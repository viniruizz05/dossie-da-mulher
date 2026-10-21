// Atualiza docs/ (GitHub Pages) com o conteúdo de dist/. Execute pelo script build:pages.
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '..', 'dist');
const docs = path.join(__dirname, '..', 'docs');
if(!fs.existsSync(path.join(dist,'index.html'))) { console.error('Compile o projeto com pnpm build antes de publicar.'); process.exit(1); }
fs.rmSync(docs, { recursive: true, force: true });
fs.cpSync(dist, docs, { recursive: true });
console.log('docs/ atualizado a partir de dist/.');
