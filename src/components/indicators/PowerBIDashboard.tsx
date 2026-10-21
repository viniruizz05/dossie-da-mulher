import { useRef, useState } from 'react';
import { findTopic, powerBIConfig, siteConfig } from '../../config/site';
import { resolveEmbedUrl } from '../../lib/powerbi';
import { Icon } from '../ui/Icon';
import { ReportPreparation } from './ReportPreparation';

export function PowerBIDashboard({ topicId }: { topicId?: string }) {
  const topic = findTopic(topicId);
  const frame = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const thematicUrl = topic ? powerBIConfig.reportsByTopic[topic.id]?.trim() : '';
  const raw = thematicUrl || powerBIConfig.embedUrl.trim();
  const embedUrl = resolveEmbedUrl(raw);

  const expand = async () => {
    try { await frame.current?.requestFullscreen(); }
    catch { setMessage('Tela cheia indisponível. Abra o relatório em outra aba.'); }
  };
  const officialDate = siteConfig.lastUpdated
    ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${siteConfig.lastUpdated}T00:00:00Z`))
    : 'Aguardando publicação';

  return (
    <section id="painel" className="section dashboard-section" aria-labelledby="dashboard-title" data-topic={topic?.id}>
      <div className="container">
        <div className="report-shell" ref={frame}>
          <div className="report-toolbar">
            <div className="report-heading">
              <span className="report-icon"><Icon name={topic?.icon ?? 'chart'} size={24} /></span>
              <div><span className="report-kicker">{topic ? 'TEMA SELECIONADO' : 'PANORAMA MUNICIPAL'}</span><h2 id="dashboard-title">{topic?.title ?? 'Panorama geral'}</h2><span>Itaquaquecetuba · SP</span></div>
            </div>
            <div className="report-tools">
              <span className={`status ${embedUrl ? 'status--ready' : ''}`}><span />{embedUrl ? 'Disponível' : 'Em preparação'}</span>
              {embedUrl && <button type="button" className="icon-button" onClick={expand}
                aria-label="Ampliar relatório" title={embedUrl ? 'Tela cheia' : 'Disponível após a publicação do relatório'}>
                <Icon name="expand" size={18} />
              </button>}
            </div>
          </div>
          {embedUrl ? (
            <div className="report-iframe">
              <iframe src={embedUrl} title={topic && thematicUrl ? `${topic.title} — Dossiê da Mulher` : powerBIConfig.title} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
              <p className="report-fallback"><a href={embedUrl} target="_blank" rel="noopener noreferrer">Abrir relatório em outra aba ↗</a></p>
            </div>
          ) : (
            <div className="report-empty">
              <ReportPreparation />
              <div className="preparation-copy">
                <h3>Os indicadores estão<br />em preparação.</h3>
                <p>A publicação depende da validação das fontes oficiais.</p>
                <a className="text-link" href="#metodologia">Saiba mais sobre os dados <Icon name="arrow" size={16} /></a>
                <div className="preparation-measures"><span>O QUE VOCÊ PODERÁ CONSULTAR</span><div className="empty-tags" aria-label="Indicadores previstos">
                  {(topic?.measures ?? ['Registros de violência', 'Feminicídios', 'Medidas protetivas', 'Atendimentos']).map(measure => <span key={measure}>{measure}</span>)}
                </div></div>
              </div>
            </div>
          )}
          <div className="report-bottom">
            <span><Icon name="info" size={16} />{embedUrl ? (topic && !thematicUrl ? 'Relatório geral. Use seus filtros internos para consultar o tema selecionado.' : 'Use os filtros do relatório para consultar os dados.') : 'Nenhum número demonstrativo é exibido como dado oficial.'}</span>
            <span className="powered-by">POWER BI <span aria-hidden="true">▥</span></span>
          </div>
        </div>
        {raw && !embedUrl && <p className="report-message" role="status">O endereço do relatório precisa ser revisado pela equipe responsável.</p>}
        {message && <p className="report-message" role="status">{message}</p>}
        <dl className="data-metadata" data-reveal>
          <div><dt><Icon name="layers" size={17} />Fonte</dt><dd>{siteConfig.source}</dd></div>
          <div><dt><Icon name="building" size={17} />Responsável</dt><dd>{siteConfig.department}</dd></div>
          <div><dt><Icon name="clock" size={17} />Atualização</dt><dd>{siteConfig.lastUpdated ? <time dateTime={siteConfig.lastUpdated}>{officialDate}</time> : officialDate}</dd></div>
        </dl>
      </div>
    </section>
  );
}

