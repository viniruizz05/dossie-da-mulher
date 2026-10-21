import { findTopic, topics } from '../../config/site';
import { Icon } from '../ui/Icon';

function TopicLinks({ topicId }: { topicId?: string }) {
  return (
    <>
      <a href="./indicadores.html" aria-current={!topicId ? 'page' : undefined} className="indicator-nav-general">
        <span className="indicator-nav-icon"><Icon name="chart" size={19} /></span><span>Panorama geral</span>
      </a>
      {topics.map(topic => (
        <a key={topic.id} href={`./indicadores.html?tema=${topic.id}`}
          aria-current={topicId === topic.id ? 'page' : undefined} data-topic={topic.id}>
          <span className="indicator-nav-icon"><Icon name={topic.icon} size={19} /></span>
          <span>{topic.short}</span>
        </a>
      ))}
    </>
  );
}

export function IndicatorNavigation({ topicId }: { topicId?: string }) {
  const selected = findTopic(topicId);
  return (
    <aside className="indicator-sidebar" aria-label="Seleção de temas">
      <div className="indicator-desktop-navigation">
        <div className="indicator-sidebar-title"><span>EXPLORAR</span><h2>Escolha um tema</h2></div>
        <nav className="indicator-nav" aria-label="Temas dos indicadores"><TopicLinks topicId={topicId} /></nav>
      </div>
      <div className="indicator-mobile-navigation">
        <span className="mobile-selection-label">ESCOLHA UM TEMA</span>
        <details className="indicator-mobile-select">
          <summary>
            <span className="indicator-nav-icon"><Icon name={selected?.icon ?? 'chart'} size={21} /></span>
            <span>{selected?.short ?? 'Panorama geral'}</span>
            <Icon className="mobile-select-chevron" name="chevron" size={18} />
          </summary>
          <nav className="indicator-nav" aria-label="Temas dos indicadores no celular"><TopicLinks topicId={topicId} /></nav>
        </details>
      </div>
      <div className="indicator-sidebar-help">
        <span className="sidebar-help-icon"><Icon name="info" size={19} /></span>
        <h3>Como ler os dados?</h3>
        <p>Conheça as fontes e os cuidados ao comparar os indicadores.</p>
        <a href="#metodologia">Entenda os dados <Icon name="arrow" size={15} /></a>
      </div>
    </aside>
  );
}

