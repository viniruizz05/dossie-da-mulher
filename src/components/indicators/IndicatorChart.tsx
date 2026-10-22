import { useId, useMemo, useState } from 'react';
import type { Indicator, Point } from '../../lib/data';
import { date, downloadCsv, number, periodLabel } from '../../lib/data';
import { Icon } from '../ui/Icon';

const colors = ['#7d438f', '#187d7b', '#b7672b', '#4169ac', '#b64579', '#64713b'];
export function IndicatorChart({ indicator, preview = false }: { indicator: Indicator; preview?: boolean }) {
  const uid = useId();
  const allPeriods = [...new Set(indicator.points.map(p => p.period))].sort();
  const regions = [...new Set(indicator.points.map(p => p.region))].sort();
  const series = [...new Set(indicator.points.map(p => p.series))];
  const [region, setRegion] = useState(regions[0] || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hidden, setHidden] = useState<string[]>([]);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [active, setActive] = useState<Point | null>(null);
  const actualRegion = regions.includes(region) ? region : regions[0];
  const periods = allPeriods.filter(p => (!from || p >= from) && (!to || p <= to));
  const visibleSeries = series.filter(s => !hidden.includes(s));
  const points = useMemo(() => indicator.points.filter(p => p.region === actualRegion && (!from || p.period >= from) && (!to || p.period <= to) && !hidden.includes(p.series)).sort((a, b) => a.period.localeCompare(b.period) || a.series.localeCompare(b.series)), [indicator.points, actualRegion, from, to, hidden]);
  const max = Math.max(1, ...points.map(p => p.value)) * 1.12;
  const width = Math.max(660, periods.length * (indicator.chartType === 'bar' ? 60 : 24));
  const height = 300, left = 62, right = 20, top = 22, bottom = 42;
  const chartWidth = width - left - right, chartHeight = height - top - bottom;
  const step = chartWidth / Math.max(1, periods.length);
  const x = (index: number) => left + step * (index + .5);
  const y = (value: number) => top + chartHeight * (1 - value / max);
  const findPoint = (period: string, name: string) => points.find(p => p.period === period && p.series === name);
  const recent = visibleSeries.map(name => points.filter(p => p.series === name).at(-1)).filter((p): p is Point => !!p);
  return (
    <article className="data-card" aria-labelledby={`${uid}-title`}>
      <div className="data-card-heading"><div><p className="data-overline">{preview ? 'PRÉVIA DO INDICADOR' : 'DADOS DO MUNICÍPIO'}</p><h3 id={`${uid}-title`}>{indicator.title || 'Título do indicador'}</h3>{indicator.description && <p>{indicator.description}</p>}</div><span className="data-unit">{indicator.unit}</span></div>
      <div className="data-controls">
        <label>Região<select value={actualRegion || ''} onChange={e => { setRegion(e.target.value); setActive(null); }}>{regions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>De<select value={from} onChange={e => { setFrom(e.target.value); setActive(null); }}><option value="">Primeiro período</option>{allPeriods.filter(p => !to || p <= to).map(p => <option value={p} key={p}>{periodLabel(p)}</option>)}</select></label>
        <label>Até<select value={to} onChange={e => { setTo(e.target.value); setActive(null); }}><option value="">Último período</option>{allPeriods.filter(p => !from || p >= from).map(p => <option value={p} key={p}>{periodLabel(p)}</option>)}</select></label>
        <button className="quiet-button" onClick={() => { setFrom(''); setTo(''); setHidden([]); setRegion(regions[0]); setActive(null); }}>Limpar filtros</button>
      </div>
      <div className="series-legend" aria-label="Séries do gráfico">{series.map((name, index) => <button key={name} type="button" aria-pressed={!hidden.includes(name)} onClick={() => { setHidden(old => old.includes(name) ? old.filter(s => s !== name) : [...old, name]); setActive(null); }}><span style={{ background: colors[index % colors.length] }} />{name}<span className="series-check">{!hidden.includes(name) ? '✓' : '+'}</span></button>)}</div>
      <div className="data-highlights">{recent.map(p => <div key={p.series}><span>{p.series}</span><strong>{number(p.value)}<small>{indicator.unit}</small></strong><span>{periodLabel(p.period)} · {p.region}</span></div>)}</div>
      <div className="data-view-toolbar"><div role="tablist" aria-label="Visualização dos dados"><button id={`${uid}-chart-tab`} role="tab" aria-selected={view === 'chart'} aria-controls={`${uid}-panel`} tabIndex={view === 'chart' ? 0 : -1} onKeyDown={e => { if (e.key === 'ArrowRight') { setView('table'); document.getElementById(`${uid}-table-tab`)?.focus(); } }} onClick={() => setView('chart')}><Icon name="chart" size={16} />Gráfico</button><button id={`${uid}-table-tab`} role="tab" aria-selected={view === 'table'} aria-controls={`${uid}-panel`} tabIndex={view === 'table' ? 0 : -1} onKeyDown={e => { if (e.key === 'ArrowLeft') { setView('chart'); document.getElementById(`${uid}-chart-tab`)?.focus(); } }} onClick={() => setView('table')}>Tabela</button></div><button className="quiet-button" disabled={!points.length} onClick={() => downloadCsv(indicator, points)}>Baixar CSV ↓</button></div>
      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-${view}-tab`}>
        {!points.length ? <div className="chart-empty">{visibleSeries.length ? 'Nenhum registro neste recorte.' : 'Ative uma série acima para explorar os dados.'}</div> : view === 'table' ? <div className="table-scroll"><table className="data-table"><caption>{indicator.title} · {indicator.unit}</caption><thead><tr><th scope="col">Período</th><th scope="col">Região</th><th scope="col">Série</th><th scope="col">Valor ({indicator.unit})</th></tr></thead><tbody>{points.map(p => <tr key={`${p.period}-${p.series}-${p.region}`}><td>{periodLabel(p.period)}</td><td>{p.region}</td><td>{p.series}</td><td>{number(p.value)}</td></tr>)}</tbody></table></div> : <>
          <div className="chart-scroll" tabIndex={0} aria-label="Gráfico. Role horizontalmente para ver todos os períodos, se necessário.">
            <svg className="native-chart" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width }} role="group" aria-label={`${indicator.title}, em ${indicator.unit}. Use a tabela para ler todos os valores.`}>
              {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1={left} y1={top + chartHeight * i / 4} x2={width - right} y2={top + chartHeight * i / 4} stroke="#ece6ef" strokeDasharray={i === 4 ? undefined : '3 5'} /><text x={left - 10} y={top + chartHeight * i / 4 + 4} textAnchor="end" className="chart-axis">{new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(max * (1 - i / 4))}</text></g>)}
              {periods.map((period, index) => <text x={x(index)} y={height - 14} textAnchor="middle" className="chart-axis" key={period}>{periodLabel(period)}</text>)}
              {visibleSeries.map((name, seriesIndex) => {
                const color = colors[series.indexOf(name) % colors.length];
                let drawing = ''; let previousPeriod: number | null = null;
                for (const [index, period] of periods.entries()) {
                  const p = findPoint(period, name); if (!p) { previousPeriod = null; continue; }
                  const sequence = period.length === 7 ? Number(period.slice(0, 4)) * 12 + Number(period.slice(5)) : Number(period);
                  drawing += `${previousPeriod !== null && sequence === previousPeriod + 1 ? 'L' : 'M'} ${x(index)} ${y(p.value)} `;
                  previousPeriod = sequence;
                }
                return <g key={name}>{indicator.chartType === 'line' && <path d={drawing} fill="none" stroke={color} strokeWidth="3" className="data-line" />}{periods.map((period, index) => {
                  const p = findPoint(period, name); if (!p) return null;
                  const barWidth = Math.min(26, step * .7 / visibleSeries.length);
                  const position = x(index) - visibleSeries.length * barWidth / 2 + seriesIndex * barWidth;
                  const description = `${name}, ${periodLabel(period)}: ${number(p.value)} ${indicator.unit}`;
                  const events = { onMouseEnter: () => setActive(p), onMouseLeave: () => setActive(null), onFocus: () => setActive(p), onBlur: () => setActive(null), onClick: () => setActive(p) };
                  return indicator.chartType === 'bar' ? <rect {...events} key={period} tabIndex={0} role="img" aria-label={description} x={position} y={y(p.value)} width={Math.max(1, barWidth - 3)} height={Math.max(2, top + chartHeight - y(p.value))} rx="3" fill={color} className="data-bar"><title>{description}</title></rect> : <circle {...events} key={period} tabIndex={0} role="img" aria-label={description} cx={x(index)} cy={y(p.value)} r={active === p ? 6 : 4} fill={color} stroke="#fff" strokeWidth="2"><title>{description}</title></circle>;
                })}</g>;
              })}
            </svg>
          </div>
          <p className="chart-reading" aria-live="polite">{active ? <><strong>{active.series}</strong> · {periodLabel(active.period)} · {number(active.value)} {indicator.unit}</> : 'Passe sobre os pontos ou use Tab para consultar os valores. Lacunas indicam ausência de registro.'}</p>
        </>}
      </div>
      <div className="data-source"><p><strong>Fonte:</strong> {indicator.source || 'Informe a fonte antes de publicar.'}{indicator.sourceUrl && <> · <a href={indicator.sourceUrl} target="_blank" rel="noopener noreferrer">Consultar fonte ↗</a></>}</p><p><Icon name="clock" size={14} /> Publicado em {date(indicator.publishedAt)}</p></div>
      {indicator.methodology && <details className="data-method"><summary>Como ler estes dados <Icon name="chevron" size={16} /></summary><p>{indicator.methodology}</p></details>}
    </article>
  );
}
