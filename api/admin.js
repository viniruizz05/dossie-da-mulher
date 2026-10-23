import cloud from '../server/cloud.cjs';

export default async function handler(req, res) {
  const incoming = new URL(req.url, 'https://dossie-da-mulher.vercel.app');
  let pathname = incoming.pathname;
  if (pathname === '/api/admin') {
    const tail = incoming.searchParams.get('__dossie_path') || '';
    if (/^(?:audit|indicators(?:\/[a-f0-9-]{36})?)$/.test(tail)) pathname += '/' + tail;
  }
  return cloud.handleCloudApi(req, res, pathname);
}
