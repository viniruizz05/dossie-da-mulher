// Servidor local da versão compilada, sem dependências externas.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
if(!fs.existsSync(path.join(root,'index.html'))) { console.error('Compile o projeto com pnpm build antes de iniciar.'); process.exit(1); }
http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Endereço inválido'); }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if(!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Acesso negado'); }
  fs.readFile(file,(err,data) => { if(err) { res.writeHead(404); return res.end('Arquivo não encontrado'); } res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'}); res.end(data); });
}).listen(port,'127.0.0.1',() => console.log(`Dossiê da Mulher: http://localhost:${port}/`));
