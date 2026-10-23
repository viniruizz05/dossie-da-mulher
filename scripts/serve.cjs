const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { handleApi } = process.env.SUPABASE_URL
  ? { handleApi: require('../server/cloud.cjs').handleCloudApi }
  : require('./api.cjs');
if (process.env.NODE_ENV === 'production' && !/^https:\/\/[^/]+$/.test(process.env.APP_ORIGIN || '')) {
  console.error('Configure APP_ORIGIN com o endereço HTTPS do site, sem barra final.'); process.exit(1);
}
const root = ['dist', 'docs'].map(directory => path.join(__dirname, '..', directory))
  .find(directory => fs.existsSync(path.join(directory, 'index.html')));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
if (!root) { console.error('Site compilado não encontrado. Extraia todos os arquivos do projeto, incluindo a pasta docs, ou execute pnpm install e pnpm build.'); process.exit(1); }
const server = http.createServer((req,res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Endereço inválido'); }
  if (pathname.startsWith('/api/')) { void handleApi(req, res, pathname); return; }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end('Método não permitido'); }
  if (pathname === '/admin' || pathname === '/admin/') pathname = '/admin.html';
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if(!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Acesso negado'); }
  fs.readFile(file,(err,data) => { if(err) { res.writeHead(404); return res.end('Arquivo não encontrado'); } res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'}); res.end(req.method === 'HEAD' ? undefined : data); });
});
server.requestTimeout = 15000;
server.listen(port,process.env.HOST || '127.0.0.1',() => console.log(`Dossiê da Mulher: http://localhost:${server.address().port}/`));
