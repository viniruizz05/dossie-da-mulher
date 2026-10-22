import { IndicatorNavigation } from '../components/indicators/IndicatorNavigation';
import { MethodologySection } from '../components/indicators/MethodologySection';
import { IndicatorsDashboard } from '../components/indicators/IndicatorsDashboard';
import { Icon } from '../components/ui/Icon';
import { findTopic } from '../config/site';

export function IndicatorsPage({ topicId }: { topicId?: string }) {
  const selectedTopic = findTopic(topicId);
  return (
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
          <div className="consultation-main"><IndicatorsDashboard topicId={selectedTopic?.id} /></div>
        </div>
      </div>
      <MethodologySection />
    </>
  );
}
