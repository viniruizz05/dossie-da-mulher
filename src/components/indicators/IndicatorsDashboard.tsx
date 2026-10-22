import { useEffect, useState } from 'react';
import { api } from '../../lib/data';
import type { Indicator } from '../../lib/data';
import { findTopic, topics } from '../../config/site';
import { Icon } from '../ui/Icon';
import { IndicatorCarousel } from './IndicatorCarousel';

export function IndicatorsDashboard({ topicId }: { topicId?: string }) {
  const [items, setItems] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const topic = findTopic(topicId);
  useEffect(() => {
    let alive = true;
    const load = () => api<{ indicators: Indicator[] }>('indicators').then(result => { if (alive) { setItems(result.indicators); setError(''); } }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoading(false); });
    void load(); const interval = window.setInterval(load, 60000);
    window.addEventListener('focus', load);
    return () => { alive = false; clearInterval(interval); window.removeEventListener('focus', load); };
  }, []);
  const filtered = items.filter(item => (!topic || item.topic === topic.id) && `${item.title} ${item.description}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  return <section id="painel" className="native-dashboard" aria-labelledby="dashboard-title">
    <div className="dashboard-heading"><div><p className="data-overline">EXPLORE OS DADOS</p><h2 id="dashboard-title">{topic?.title || 'Panorama do município'}</h2><p>Escolha o período, compare séries e consulte cada valor.</p></div><span className="live-label"><span />Consulta pública</span></div>
    <label className="indicator-search"><Icon name="chart" size={19} /><span className="sr-only">Buscar indicador</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar um indicador" /></label>
    {loading && <div className="dashboard-empty" role="status"><span className="loading-dot" />Carregando indicadores…</div>}
    {error && <p className="form-message form-error" role="alert">{error}</p>}
    {!loading && !error && !filtered.length && <div className="dashboard-empty"><span className="empty-chart-icon"><Icon name="chart" size={32} /></span><h3>{search ? 'Nenhum indicador encontrado' : 'Os dados serão publicados aqui'}</h3><p>{search ? 'Tente outro termo ou escolha um tema diferente.' : 'A equipe responsável está preparando e validando as informações deste tema.'}</p>{topic && <a className="text-link" href="./indicadores.html">Consultar todos os temas <Icon name="arrow" size={16} /></a>}</div>}
    <div className="indicator-cards">{topics.map(group => {
      const indicators = filtered.filter(indicator => indicator.topic === group.id);
      return indicators.length ? <IndicatorCarousel key={group.id} title={group.title} icon={group.icon} indicators={indicators} /> : null;
    })}</div>
    <p className="dashboard-footnote"><Icon name="info" size={16} />Dados agregados. Cada gráfico informa a fonte, a unidade e os períodos disponíveis.</p>
  </section>;
}
