const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');

test('gestão autenticada e publicação persistente, sem dist e sem node_modules', async t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'dossie-api-'));
  process.env.DATA_DIR = path.join(temporary, 'private');
  const { db, setAdministrator } = require('./database.cjs');
  const email = 'teste@example.invalid'; const password = randomBytes(24).toString('hex');
  await setAdministrator(email, password); db.close();
  fs.mkdirSync(path.join(temporary, 'scripts'));
  for (const name of ['serve.cjs', 'api.cjs', 'database.cjs']) fs.copyFileSync(path.join(__dirname, name), path.join(temporary, 'scripts', name));
  fs.cpSync(path.join(__dirname, '..', 'dist'), path.join(temporary, 'docs'), { recursive: true });
  let server;
  const start = () => new Promise((resolve, reject) => {
    server = spawn(process.execPath, [path.join(temporary, 'scripts/serve.cjs')], { env: { ...process.env, PORT: '0', NODE_ENV: 'test', APP_ORIGIN: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
    server.once('error', reject); let output = '';
    server.stdout.on('data', chunk => { output += chunk; const found = /localhost:(\d+)/.exec(output); if (found) resolve(`http://127.0.0.1:${found[1]}`); });
    server.once('exit', code => { if (!output) reject(Error('Servidor encerrou com código ' + code)); });
  });
  const stop = () => new Promise(resolve => { server.once('exit', resolve); server.kill(); });
  let base = await start(); let cookie = ''; let csrf = '';
  const request = async (route, method = 'GET', data, options = {}) => {
    const res = await fetch(base + '/api/' + route, { method, headers: { Origin: base, ...(data ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...options }, body: data ? JSON.stringify(data) : undefined });
    return { status: res.status, json: await res.json(), headers: res.headers };
  };
  const fixture = { title: 'Indicador de teste', topic: 'saude', unit: 'atendimentos', source: 'Fonte de teste', sourceUrl: 'https://example.org', description: 'Dados sintéticos para teste automatizado.', methodology: 'Não são dados oficiais.', chartType: 'line', points: [{ period: '2025', region: 'Município', series: 'Total', value: 7 }, { period: '2026', region: 'Município', series: 'Total', value: 12 }] };
  try {
    await t.test('três páginas e arquivos servidos sem compilação local', async () => {
      for (const route of ['/', '/indicadores.html', '/admin.html', ...fs.readdirSync(path.join(temporary, 'docs/assets')).map(name => '/assets/' + name)]) assert.equal((await fetch(base + route)).status, 200, route);
      assert.equal((await fetch(base + '/data/dossie.sqlite')).status, 404);
      assert.equal((await fetch(base + '/scripts/database.cjs')).status, 404);
      assert.equal((await fetch(base + '/api/session')).headers.get('cache-control'), 'no-store');
    });
    await t.test('autenticação e proteção de escrita', async () => {
      assert.equal((await request('admin/indicators')).status, 401);
      assert.equal((await request('admin/indicators', 'POST', fixture)).status, 401);
      assert.equal((await request('login', 'POST', { email, password: 'incorreta' })).status, 401);
      assert.equal((await request('login', 'POST', { email, password }, { Origin: 'https://outro.example' })).status, 403);
      const login = await request('login', 'POST', { email, password }); assert.equal(login.status, 200);
      const setCookie = login.headers.get('set-cookie'); assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Strict/);
      cookie = setCookie.split(';')[0]; csrf = login.json.csrf;
      assert.equal((await request('admin/indicators', 'POST', fixture, { 'X-CSRF-Token': 'errado' })).status, 403);
    });
    let saved;
    await t.test('rascunho privado, publicação e edição sem sobrescrever versão pública', async () => {
      const create = await request('admin/indicators', 'POST', fixture); assert.equal(create.status, 201); saved = create.json.indicator;
      assert.equal((await request('indicators')).json.indicators.length, 0);
      const publish = await request('admin/indicators/' + saved.id, 'PUT', { ...saved, publish: true }); assert.equal(publish.status, 200); saved = publish.json.indicator;
      assert.equal((await request('indicators')).json.indicators[0].points[1].value, 12);
      const update = await request('admin/indicators/' + saved.id, 'PUT', { ...saved, title: 'Título em revisão', points: [{ ...fixture.points[0], value: 99 }] }); assert.equal(update.status, 200); saved = update.json.indicator;
      assert.equal(saved.status, 'changed'); assert.equal((await request('indicators')).json.indicators[0].title, fixture.title);
      assert.equal((await request('admin/indicators/' + saved.id, 'PUT', { ...saved, revision: 1 })).status, 409);
    });
    await t.test('validação de fonte, valores, períodos e registros duplicados', async () => {
      for (const invalid of [{ source: '', publish: true }, { points: [{ ...fixture.points[0], value: -1 }] }, { points: [{ ...fixture.points[0], period: '2026-99' }] }, { points: [fixture.points[0], fixture.points[0]] }, { points: [{ ...fixture.points[0], value: '' }] }, { unit: '%', points: [{ ...fixture.points[0], value: 101 }] }, { sourceUrl: 'javascript:alert(1)' }]) assert.equal((await request('admin/indicators', 'POST', { ...fixture, ...invalid })).status, 400);
      assert.equal((await request('admin/indicators', 'POST', { ...fixture, publish: 'sim', source: '', points: [] })).json.indicator.status, 'draft');
    });
    await t.test('banco persiste após reiniciar o servidor', async () => {
      await stop(); base = await start();
      assert.equal((await request('indicators')).json.indicators[0].title, fixture.title);
      assert.equal((await request('admin/indicators')).status, 200);
      const unpublish = await request('admin/indicators/' + saved.id, 'PUT', { revision: saved.revision, unpublish: true }); assert.equal(unpublish.status, 200); saved = unpublish.json.indicator;
      assert.equal((await request('indicators')).json.indicators.length, 0);
      assert.equal((await request('admin/indicators/' + saved.id, 'DELETE', { revision: saved.revision })).status, 200);
      assert.ok((await request('admin/audit')).json.events.some(event => event.action === 'delete'));
      assert.equal((await request('logout', 'POST', {})).status, 200);
      assert.equal((await request('admin/indicators')).status, 401);
    });
    await t.test('limita tentativas de login', async () => {
      cookie = ''; csrf = ''; let status;
      for (let i = 0; i < 9; i++) status = (await request('login', 'POST', { email, password: 'incorreta' })).status;
      assert.equal(status, 429);
    });
  } finally { await stop(); }
});
