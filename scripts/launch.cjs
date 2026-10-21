// Execute pelo abrir-site.cmd. Inicia o servidor e abre o navegador do usuário.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const address = 'http://localhost:4173/';
const projectRoot = path.join(__dirname, '..');
function ready() {
  return new Promise(resolve => {
    const request = http.get(address, response => {
      let body = ''; response.setEncoding('utf8'); response.on('data', chunk => body += chunk);
      response.on('end', () => resolve(response.statusCode === 200 && body.includes('Dossiê da Mulher Itaquaquecetubense')));
    });
    request.setTimeout(1000, () => request.destroy()); request.on('error', () => resolve(false));
  });
}
(async () => {
  if (!await ready()) {
    const output = fs.openSync(path.join(projectRoot, 'servidor.log'), 'a');
    const errors = fs.openSync(path.join(projectRoot, 'servidor-erros.log'), 'a');
    const child = spawn(process.execPath, [path.join(__dirname, 'serve.cjs')], { cwd: projectRoot, env: { ...process.env, PORT: '4173' }, detached: true, windowsHide: true, stdio: ['ignore', output, errors] });
    child.on('error', error => { console.error(error.message); process.exitCode = 1; }); child.unref();
    fs.closeSync(output); fs.closeSync(errors);
    for(let attempt = 0; attempt < 30; attempt++) { if (await ready()) break; await new Promise(resolve => setTimeout(resolve, 200)); }
  }
  if(!await ready()) { console.error('Não foi possível iniciar o site. Consulte servidor-erros.log.'); process.exitCode = 1; return; }
  console.log('Site disponível em ' + address);
  if(process.platform === 'win32') {
    const browser = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', address], { detached:true, windowsHide:true, stdio:'ignore' });
    browser.on('error', () => console.log('Abra o endereço acima no seu navegador.')); browser.unref();
  }
})();
