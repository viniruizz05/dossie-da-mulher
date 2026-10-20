import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PowerBIDashboard } from './components/PowerBIDashboard';
import { InfoSection } from './components/InfoSection';
import { Topics } from './components/Topics';
import { ProtectionArt } from './components/ProtectionArt';
import { Icon } from './components/Icon';
import { topics } from './config/site';
import { IndicatorNavigation } from './components/IndicatorNavigation';
import { usePageMotion } from './hooks/usePageMotion';

export default function App({ page = 'inicio', topicId }: { page?: 'inicio' | 'indicadores'; topicId?: string }) {
  usePageMotion();
  const selectedTopic = topics.find(topic => topic.id === topicId);
  const isIndicators = page === 'indicadores';
  return (
    <>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <div id="inicio" />
      <Header page={page} />
      <main id="conteudo" className={isIndicators ? 'indicators-page' : 'home-page'}>
        {isIndicators ? (
          <>
            <section className="indicators-intro" aria-labelledby="page-title">
              <div className="container">
                <nav className="breadcrumb" aria-label="Caminho da página"><a href="./">Início</a><span aria-hidden="true">/</span><span aria-current="page">Indicadores</span></nav>
                <div className="indicators-intro-row">
                  <div><p className="eyebrow">DOSSIÊ DA MULHER</p><h1 id="page-title">Indicadores</h1><p>Escolha um tema para consultar os dados do município.</p></div>
                  <span className="public-access-label"><Icon name="shield" size={18} />Consulta pública</span>
                </div>
              </div>
            </section>
            <div className="consultation-area">
              <div className="container consultation-layout">
                <IndicatorNavigation topicId={selectedTopic?.id} />
                <div className="consultation-main"><PowerBIDashboard topicId={selectedTopic?.id} /></div>
              </div>
            </div>
            <InfoSection />
          </>
        ) : (
          <>
            <section className="hero" aria-labelledby="page-title">
              <div className="container hero-grid">
                <div className="hero-copy">
                  <p className="eyebrow hero-eyebrow"><span />ITAQUAQUECETUBA · SP</p>
                  <h1 id="page-title">Dossiê da Mulher<br /><em>Itaquaquecetubense.</em></h1>
                  <p className="hero-description">Dados sobre <strong>violência contra a mulher</strong>, medidas protetivas e rede de atendimento em Itaquaquecetuba.</p>
                  <div className="hero-actions"><a className="button button-primary" href="./indicadores.html">Consultar indicadores <Icon name="arrow" size={19} /></a></div>
                </div>
                <ProtectionArt />
              </div>
            </section>
            <Topics />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

