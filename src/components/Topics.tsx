import { topics } from '../config/site';
import { Icon } from './Icon';
import { ThemeMeasures } from './ThemeMeasures';

export function Topics() {
  return (
    <section id="temas" className="section topics-section topic-catalog" aria-labelledby="topics-title">
      <div className="container">
        <div className="section-title-row">
          <div><p className="eyebrow">TEMAS DE ANÁLISE</p><h2 id="topics-title">O que os dados revelam?</h2><p className="catalog-description">Escolha o tema que deseja consultar.</p></div>
          <a className="text-link" href="./indicadores.html">Consultar o painel <Icon name="arrow" size={17} /></a>
        </div>
        <div className="theme-grid">
          {topics.map(topic => (
            <article className={`theme-card theme-card--${topic.id}`} key={topic.id} data-reveal>
              <a className="theme-card-link" href={`./indicadores.html?tema=${topic.id}`} aria-label={`Consultar indicadores de ${topic.short}`}>
              <div className="theme-card-top">
                <span className="theme-card-icon"><Icon name={topic.icon} size={24} /></span>
                <div><h3>{topic.title}</h3></div>
                <span className="theme-card-arrow"><Icon name="arrow" size={16} /></span>
              </div>
              <p className="theme-description">{topic.description}</p>
              </a>
              <ThemeMeasures id={topic.id} title={topic.title} measures={topic.measures} />
            </article>
          ))}
        </div>
        <p className="catalog-note"><Icon name="info" size={15} />A disponibilidade dos indicadores depende da validação das bases oficiais.</p>
      </div>
    </section>
  );
}

