const readline = require('node:readline');
const { Writable } = require('node:stream');
const { setAdministrator, db } = require('./database.cjs');
let hidden = false;
const output = new Writable({ write(chunk, encoding, next) { if (!hidden) process.stdout.write(chunk); next(); } });
const input = readline.createInterface({ input: process.stdin, output, terminal: true });
const ask = question => new Promise(resolve => input.question(question, resolve));
(async () => {
  try {
    console.log('Configurar acesso administrativo. A senha não aparecerá na tela.');
    const email = await ask('E-mail: ');
    process.stdout.write('Senha (mínimo de 12 caracteres): '); hidden = true;
    const password = await ask(''); hidden = false; process.stdout.write('\n');
    process.stdout.write('Repita a senha: '); hidden = true;
    const confirmation = await ask(''); hidden = false; process.stdout.write('\n');
    if (password !== confirmation) throw Error('As senhas não coincidem.');
    await setAdministrator(email, password, process.argv.includes('--reset'));
    console.log('Acesso configurado. Abra o site e entre em /admin.html.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { input.close(); db.close(); }
})();
