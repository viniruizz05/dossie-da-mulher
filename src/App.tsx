import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { usePageMotion } from './hooks/usePageMotion';
import { useScrollToHash } from './hooks/useScrollToHash';
import { HomePage } from './pages/HomePage';
import { IndicatorsPage } from './pages/IndicatorsPage';

export default function App({ page = 'inicio', topicId }: { page?: 'inicio' | 'indicadores'; topicId?: string }) {
  usePageMotion();
  useScrollToHash();
  const isIndicators = page === 'indicadores';
  return (
    <>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <div id="inicio" />
      <Header page={page} />
      <main id="conteudo" className={isIndicators ? 'indicators-page' : 'home-page'}>
        {isIndicators ? <IndicatorsPage topicId={topicId} /> : <HomePage />}
      </main>
      <Footer />
    </>
  );
}
