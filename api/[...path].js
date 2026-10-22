import cloud from '../server/cloud.cjs';

export default async function handler(req, res) {
  const pathname = new URL(req.url, 'https://dossie-da-mulher.vercel.app').pathname;
  return cloud.handleCloudApi(req, res, pathname);
}
