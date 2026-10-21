import { ProtectionArt } from '../components/home/ProtectionArt';
import { Topics } from '../components/home/Topics';
import { Icon } from '../components/ui/Icon';

export function HomePage() {
  return (
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
  );
}
