// Aceita somente relatórios incorporados por HTTPS em domínios do Power BI; qualquer outro valor resulta em ''.
export function resolveEmbedUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:' && (url.hostname === 'app.powerbi.com' || url.hostname.endsWith('.powerbi.com'))) return url.href;
  } catch { /* A URL oficial pode ainda não ter sido informada. */ }
  return '';
}
