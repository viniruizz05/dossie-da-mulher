const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '..', 'dist');
const docs = path.join(__dirname, '..', 'docs');
if(!fs.existsSync(path.join(dist,'index.html'))) { console.error('Compile o projeto com pnpm build antes de publicar.'); process.exit(1); }
fs.mkdirSync(docs, { recursive: true });
const oldAssets = path.join(docs, 'assets');
if (fs.existsSync(oldAssets)) for (const asset of fs.readdirSync(oldAssets, { withFileTypes: true })) {
  if (asset.isFile() && /\.(js|css)$/.test(asset.name) && !fs.existsSync(path.join(dist, 'assets', asset.name))) fs.unlinkSync(path.join(oldAssets, asset.name));
}
fs.cpSync(dist, docs, { recursive: true });
console.log('docs/ atualizado. Login e dados exigem o servidor Node; hospedagem apenas estática não executa a API.');
