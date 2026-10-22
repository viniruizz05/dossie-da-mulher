export type Point = { period: string; series: string; region: string; value: number };
export type Indicator = {
  id?: string; revision?: number; title: string; topic: string; unit: string; description: string;
  source: string; sourceUrl: string; methodology: string; chartType: 'line' | 'bar'; points: Point[];
  updatedAt?: string; publishedAt?: string | null; status?: 'draft' | 'published' | 'changed';
};
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export async function api<T>(path: string, method = 'GET', data?: unknown, csrf?: string): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api/${path}`, { method, credentials: 'same-origin', cache: 'no-store',
    headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
    body: data ? JSON.stringify(data) : undefined }); }
  catch { throw new ApiError('Não foi possível conectar ao servidor. Tente novamente.', 0); }
  const result = await response.json().catch(() => { throw new ApiError('O servidor de dados não está disponível. Abra o site pelo inicializador ou pelo servidor da aplicação.', 0); });
  if (!response.ok) throw new ApiError(result.error || 'Não foi possível concluir a solicitação.', response.status);
  return result;
}
export const number = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
export const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Ainda não publicado';
export const periodLabel = (value: string) => value.length === 7 ? `${value.slice(5)}/${value.slice(0, 4)}` : value;
export function downloadCsv(indicator: Indicator, points: Point[]) {
  const cell = (value: unknown) => `"${String(value).replace(/^(\s*[=+@-]|[\t\r\n])/, "'$&").replaceAll('"', '""')}"`;
  const rows = [['Indicador', 'Período', 'Região', 'Série', 'Valor', 'Unidade', 'Fonte'], ...points.map(p => [indicator.title, p.period, p.region, p.series, number(p.value), indicator.unit, indicator.source])];
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'indicadores-dossie.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
