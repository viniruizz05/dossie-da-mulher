const { randomBytes, randomUUID } = require('node:crypto');
const { db, hashToken, authenticate } = require('./database.cjs');
const { validate } = require('../server/validation.cjs');
const attempts = new Map();
const sessionHours = 8;
const production = process.env.NODE_ENV === 'production';
const cookie = (token, maxAge) => `dossie_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${production ? '; Secure' : ''}`;
function reply(res, status, value) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
function fail(status, message) { throw Object.assign(Error(message), { status }); }
async function body(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'Envie os dados em JSON.');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 128 * 1024) fail(413, 'O formulário excede o tamanho permitido.'); chunks.push(chunk); }
  try { const value = JSON.parse(Buffer.concat(chunks).toString()); if (!value || Array.isArray(value) || typeof value !== 'object') throw Error(); return value; }
  catch { fail(400, 'Dados inválidos.'); }
}
function session(req) {
  const token = /(?:^|;\s*)dossie_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  if (!token) return null;
  return db.prepare('SELECT sessions.*, users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(hashToken(token), Date.now());
}
function sameOrigin(req) {
  const origin = process.env.APP_ORIGIN || `http://${req.headers.host}`;
  if (req.headers.origin !== origin || req.headers['sec-fetch-site'] === 'cross-site') fail(403, 'Origem da solicitação não autorizada. Atualize a página.');
}
const record = row => ({ ...JSON.parse(row.draft), id: row.id, revision: row.revision, updatedAt: row.updated_at, publishedAt: row.published_at, status: row.published ? (row.draft === row.published ? 'published' : 'changed') : 'draft' });
function change(user, action, id, snapshot, update) {
  db.exec('BEGIN IMMEDIATE');
  try { update(); db.prepare('INSERT INTO audit(user_id,action,indicator_id,snapshot,created_at) VALUES(?,?,?,?,?)').run(user.user_id, action, id, JSON.stringify(snapshot), new Date().toISOString()); db.exec('COMMIT'); }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
async function handleApi(req, res, pathname) {
  try {
    if (pathname === '/api/health' && req.method === 'GET') return reply(res, 200, { app: 'dossie-manual', version: 1 });
    if (pathname === '/api/indicators' && req.method === 'GET') {
      const rows = db.prepare('SELECT id,published,published_at FROM indicators WHERE published IS NOT NULL ORDER BY published_at DESC').all();
      return reply(res, 200, { indicators: rows.map(row => ({ ...JSON.parse(row.published), id: row.id, publishedAt: row.published_at })) });
    }
    const user = session(req);
    if (pathname === '/api/session' && req.method === 'GET') return reply(res, 200, { user: user ? { email: user.email } : null, csrf: user?.csrf || null });
    if (req.method !== 'GET') sameOrigin(req);
    if (pathname === '/api/login' && req.method === 'POST') {
      const now = Date.now();
      for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
      const key = req.socket.remoteAddress; const rate = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
      if (rate.count >= 8 || attempts.size > 10000) fail(429, 'Muitas tentativas. Aguarde 15 minutos e tente novamente.');
      rate.count++; attempts.set(key, rate);
      const input = await body(req);
      if (typeof input.email !== 'string' || input.email.length > 254 || typeof input.password !== 'string' || input.password.length > 200) fail(400, 'Informe e-mail e senha.');
      const account = await authenticate(input.email, input.password);
      if (!account) fail(401, 'E-mail ou senha incorretos.');
      const token = randomBytes(32).toString('hex'); const csrf = randomBytes(32).toString('hex');
      db.prepare('DELETE FROM sessions WHERE expires<?').run(now);
      if (user) db.prepare('DELETE FROM sessions WHERE token=?').run(user.token);
      db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hashToken(token), account.id, csrf, now + sessionHours * 3600000);
      res.setHeader('Set-Cookie', cookie(token, sessionHours * 3600));
      return reply(res, 200, { user: { email: account.email }, csrf });
    }
    if (!user) fail(401, 'Entre na sua conta para continuar.');
    if (req.method !== 'GET' && req.headers['x-csrf-token'] !== user.csrf) fail(403, 'Sessão de edição inválida. Atualize a página.');
    if (pathname === '/api/logout' && req.method === 'POST') { db.prepare('DELETE FROM sessions WHERE token=?').run(user.token); res.setHeader('Set-Cookie', cookie('', 0)); return reply(res, 200, { ok: true }); }
    if (pathname === '/api/admin/indicators' && req.method === 'GET') return reply(res, 200, { indicators: db.prepare('SELECT * FROM indicators ORDER BY updated_at DESC').all().map(record) });
    if (pathname === '/api/admin/audit' && req.method === 'GET') return reply(res, 200, { events: db.prepare('SELECT audit.action,audit.created_at,users.email, audit.indicator_id FROM audit JOIN users ON users.id=audit.user_id ORDER BY audit.id DESC LIMIT 30').all() });
    const match = /^\/api\/admin\/indicators(?:\/([a-f0-9-]{36}))?$/.exec(pathname);
    if (!match) fail(404, 'Endereço não encontrado.');
    const id = match[1];
    if (!id && req.method === 'POST') {
      const input = await body(req); const item = validate(input, input.publish === true); const json = JSON.stringify(item); const id = randomUUID(); const now = new Date().toISOString();
      change(user, input.publish === true ? 'publish' : 'create', id, item, () => db.prepare('INSERT INTO indicators(id,draft,published,updated_at,published_at) VALUES(?,?,?,?,?)').run(id, json, input.publish === true ? json : null, now, input.publish === true ? now : null));
      return reply(res, 201, { indicator: record(db.prepare('SELECT * FROM indicators WHERE id=?').get(id)) });
    }
    if (id && ['PUT', 'DELETE'].includes(req.method)) {
      const input = await body(req); const current = db.prepare('SELECT * FROM indicators WHERE id=?').get(id);
      if (!current) fail(404, 'Indicador não encontrado.');
      if (input.revision !== current.revision) fail(409, 'Este indicador mudou em outra sessão. Volte à lista e abra a versão mais recente.');
      if (req.method === 'DELETE') { change(user, 'delete', id, record(current), () => db.prepare('DELETE FROM indicators WHERE id=? AND revision=?').run(id, input.revision)); return reply(res, 200, { ok: true }); }
      if (input.unpublish === true) {
        change(user, 'unpublish', id, record(current), () => db.prepare('UPDATE indicators SET published=NULL,published_at=NULL,revision=revision+1,updated_at=? WHERE id=?').run(new Date().toISOString(), id));
      } else {
        const item = validate(input, input.publish === true); const json = JSON.stringify(item); const now = new Date().toISOString();
        change(user, input.publish === true ? 'publish' : 'edit', id, item, () => db.prepare('UPDATE indicators SET draft=?,published=?,revision=revision+1,updated_at=?,published_at=? WHERE id=?').run(json, input.publish === true ? json : current.published, now, input.publish === true ? now : current.published_at, id));
      }
      return reply(res, 200, { indicator: record(db.prepare('SELECT * FROM indicators WHERE id=?').get(id)) });
    }
    fail(405, 'Método não permitido.');
  } catch (error) { if (!error.status) console.error('Falha na API:', error.code || error.name); reply(res, error.status || 500, { error: error.status ? error.message : 'Não foi possível concluir. Tente novamente.' }); }
}
module.exports = { handleApi, validate };
