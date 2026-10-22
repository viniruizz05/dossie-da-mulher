const topics = ['violencia','saude','educacao','territorio','participacao','politicas'];
function fail(status,message){throw Object.assign(Error(message),{status});}
function text(value, name, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(400, `Revise o campo ${name}.`);
  return value.trim();
}
function validate(input, publish) {
  const item = {
    title: text(input.title, 'título', 120, true), topic: input.topic,
    unit: text(input.unit, 'unidade', 40, true), description: text(input.description, 'descrição', 600),
    source: text(input.source, 'fonte', 200, publish), sourceUrl: text(input.sourceUrl, 'endereço da fonte', 500),
    methodology: text(input.methodology, 'metodologia', 1200), chartType: input.chartType,
  };
  if (!topics.includes(item.topic) || !['line', 'bar'].includes(item.chartType)) fail(400, 'Tema ou tipo de gráfico inválido.');
  if (item.sourceUrl) { try { const url = new URL(item.sourceUrl); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Error(); } catch { fail(400, 'Informe um endereço http ou https válido para a fonte.'); } }
  if (!Array.isArray(input.points) || input.points.length > 500 || (publish && !input.points.length)) fail(400, 'Inclua entre 1 e 500 registros para publicar.');
  const keys = new Set();
  item.points = input.points.map(point => {
    if (!point || typeof point !== 'object') fail(400, 'Revise os registros.');
    const period = text(point.period, 'período', 7, true);
    if (!/^(19|20|21)\d{2}(-(0[1-9]|1[0-2]))?$/.test(period)) fail(400, 'Use períodos no formato AAAA ou AAAA-MM.');
    const series = text(point.series, 'série', 60, true);
    const region = text(point.region, 'região', 80, true);
    if (typeof point.value !== 'number' || !Number.isFinite(point.value) || point.value < 0 || point.value > 1e12) fail(400, 'Os valores devem ser números de 0 a 1 trilhão.');
    if (item.unit === '%' && point.value > 100) fail(400, 'Percentuais devem estar entre 0 e 100.');
    const key = JSON.stringify([period, series, region]);
    if (keys.has(key)) fail(400, 'Há registros repetidos para o mesmo período, série e região.'); keys.add(key);
    return { period, series, region, value: point.value };
  });
  if (new Set(item.points.map(p => p.period.length)).size > 1) fail(400, 'Use apenas anos ou apenas meses no mesmo indicador.');
  if (new Set(item.points.map(p => p.series)).size > 6) fail(400, 'Use até 6 séries por indicador para manter a leitura clara.');
  return item;
}

module.exports = { validate };
