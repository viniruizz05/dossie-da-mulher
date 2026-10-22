const { createHmac, timingSafeEqual } = require('node:crypto');
const { validate } = require('./validation.cjs');
const cookieName = 'dossie_cloud_access';
const fail = (status, message) => { throw Object.assign(Error(message), { status }); };
function configuration() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SESSION_SECRET;
  const origin = process.env.APP_ORIGIN;
  const test = process.env.NODE_ENV === 'test';
  const invalid = [!url && 'SUPABASE_URL', !key?.startsWith('sb_publishable_') && 'SUPABASE_PUBLISHABLE_KEY', (!secret || secret.length < 43 || /GERAR_UM_SEGREDO/.test(secret)) && 'SESSION_SECRET (mínimo 43 caracteres)', !origin && 'APP_ORIGIN'].filter(Boolean);
  if (invalid.length) {
    console.error('Cloud configuration missing or invalid:', invalid.join(', '));
    fail(503, 'A integração com o banco de dados ainda não foi configurada.');
  }
  try {
    const provider = new URL(url); const site = new URL(origin);
    if (provider.origin !== url || site.origin !== origin) throw Error();
    if (!test && (provider.protocol !== 'https:' || !provider.hostname.endsWith('.supabase.co') || site.protocol !== 'https:')) throw Error();
  } catch { fail(503, 'A configuração dos serviços precisa ser revisada.'); }
  return { url, key, secret, origin, secure: new URL(origin).protocol === 'https:' };
}
function json(res, status, result) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(result));
}
async function read(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) fail(415, 'Envie os dados em JSON.');
  let value;
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > 128 * 1024) fail(413, 'O formulário excede o tamanho permitido.');
    try { value = typeof req.body === 'string' ? JSON.parse(raw) : req.body; } catch { fail(400, 'Dados inválidos.'); }
  } else {
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 128 * 1024) fail(413, 'O formulário excede o tamanho permitido.'); chunks.push(chunk); }
    try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400, 'Dados inválidos.'); }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'Dados inválidos.');
  return value;
}
async function provider(config, endpoint, { token, method = 'GET', body } = {}) {
  let response;
  try { response = await fetch(config.url + endpoint, { method, headers: { apikey: config.key, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000), redirect: 'error' }); }
  catch { fail(503, 'O serviço de dados está temporariamente indisponível. Tente novamente.'); }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}
const cookie = (config, token = '', age = 0) => `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${config.secure ? '; Secure' : ''}`;
const csrfFor = (config, token) => createHmac('sha256', config.secret).update(`csrf:${token}`).digest('hex');
const cookieToken = req => (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
async function rpc(config, name, token, body = {}) {
  const result = await provider(config, '/rest/v1/rpc/' + name, { token, method: 'POST', body });
  if (!result.ok) {
    if (result.status >= 500) fail(503, 'Não foi possível consultar o banco de dados. Tente novamente.');
    if (result.data?.message === 'DOSSIE_CONFLICT') fail(409, 'Este indicador mudou em outra sessão. Abra a versão mais recente.');
    if (result.data?.message === 'DOSSIE_NOT_FOUND') fail(404, 'Indicador não encontrado.');
    if (result.data?.message === 'DOSSIE_INVALID_DATA' || result.data?.code === '23514') fail(400, 'Revise os dados e a fonte do indicador.');
    fail(403, 'Sua conta não tem permissão para essa operação.');
  }
  return result.data;
}
async function identity(config, token) {
  if (!token || token.length > 3800 || !/^[A-Za-z0-9_.-]+$/.test(token)) return null;
  const result = await provider(config, '/auth/v1/user', { token });
  if (result.status >= 500) fail(503, 'O serviço de autenticação está temporariamente indisponível.');
  if (!result.ok || !result.data?.id || !result.data.email_confirmed_at) return null;
  const allowed = await rpc(config, 'dossie_editor_access', token);
  return allowed === true ? result.data : null;
}
const record = row => ({ ...row.data, id: row.id, revision: row.revision, updatedAt: row.updated_at, publishedAt: row.published_at, status: row.status });

async function handleCloudApi(req, res, pathname) {
  try {
    const config = configuration();
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!allowedMethods.includes(req.method)) fail(405, 'Método não permitido.');
    if (req.method !== 'GET' && (req.headers.origin !== config.origin || req.headers['sec-fetch-site'] === 'cross-site')) fail(403, 'Origem não autorizada. Atualize a página.');
    if (pathname === '/api/health' && req.method === 'GET') return json(res, 200, { app: 'dossie-manual', provider: 'supabase' });
    if (pathname === '/api/indicators' && req.method === 'GET') {
      const rows = await rpc(config, 'dossie_list_public', null);
      return json(res, 200, { indicators: rows.map(row => ({ ...row.data, id: row.id, publishedAt: row.published_at })) });
    }
    const token = cookieToken(req);
    if (pathname === '/api/login' && req.method === 'POST') {
      const input = await read(req);
      if (typeof input.email !== 'string' || input.email.length > 254 || typeof input.password !== 'string' || input.password.length > 200) fail(400, 'Informe e-mail e senha.');
      const result = await provider(config, '/auth/v1/token?grant_type=password', { method: 'POST', body: { email: input.email.trim(), password: input.password } });
      if (result.status === 429) fail(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      if (result.status >= 500) fail(503, 'O serviço de autenticação está temporariamente indisponível.');
      if (!result.ok || !result.data?.access_token) fail(401, 'E-mail ou senha incorretos.');
      const access = result.data.access_token;
      const user = await identity(config, access);
      if (!user) { await provider(config, '/auth/v1/logout?scope=local', { token: access, method: 'POST' }); fail(403, 'Sua conta não está autorizada a administrar o portal.'); }
      res.setHeader('Set-Cookie', cookie(config, access, Math.min(3600, Math.max(1, Number(result.data.expires_in) || 3600))));
      return json(res, 200, { user: { email: user.email }, csrf: csrfFor(config, access) });
    }
    const user = await identity(config, token);
    if (pathname === '/api/session' && req.method === 'GET') {
      if (!user && token) res.setHeader('Set-Cookie', cookie(config));
      return json(res, 200, { user: user ? { email: user.email } : null, csrf: user ? csrfFor(config, token) : null });
    }
    if (!user) { res.setHeader('Set-Cookie', cookie(config)); fail(401, 'Entre na sua conta para continuar.'); }
    if (req.method !== 'GET') {
      const supplied = req.headers['x-csrf-token']; const expected = csrfFor(config, token);
      if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) fail(403, 'Sessão de edição inválida. Atualize a página.');
    }
    if (pathname === '/api/logout' && req.method === 'POST') {
      const result = await provider(config, '/auth/v1/logout?scope=local', { token, method: 'POST' });
      res.setHeader('Set-Cookie', cookie(config));
      if (!result.ok && result.status >= 500) fail(503, 'O acesso local foi encerrado. O serviço de autenticação está indisponível.');
      return json(res, 200, { ok: true });
    }
    if (pathname === '/api/admin/indicators' && req.method === 'GET') return json(res, 200, { indicators: (await rpc(config, 'dossie_list_admin', token)).map(record) });
    if (pathname === '/api/admin/audit' && req.method === 'GET') return json(res, 200, { events: await rpc(config, 'dossie_list_audit', token) });
    const match = /^\/api\/admin\/indicators(?:\/([a-f0-9-]{36}))?$/.exec(pathname);
    if (!match) fail(404, 'Endereço não encontrado.');
    const id = match[1] || null;
    if ((!id && req.method !== 'POST') || (id && !['PUT', 'DELETE'].includes(req.method))) fail(405, 'Método não permitido.');
    const input = await read(req);
    if (id && (!Number.isSafeInteger(input.revision) || input.revision < 1)) fail(400, 'Abra a versão mais recente do indicador.');
    const action = req.method === 'DELETE' ? 'delete' : input.unpublish === true ? 'unpublish' : input.publish === true ? 'publish' : 'save';
    if (!id && ['delete', 'unpublish'].includes(action)) fail(400, 'Indicador inválido.');
    const data = ['save', 'publish'].includes(action) ? validate(input, action === 'publish') : null;
    const row = await rpc(config, 'dossie_mutate', token, { p_id: id, p_revision: input.revision || null, p_action: action, p_data: data });
    return json(res, id ? 200 : 201, action === 'delete' ? { ok: true } : { indicator: record(row) });
  } catch (error) { if (!error.status) console.error('Cloud API failure:', error.code || error.name); json(res, error.status || 500, { error: error.status ? error.message : 'Não foi possível concluir a solicitação.' }); }
}
module.exports = { handleCloudApi };
