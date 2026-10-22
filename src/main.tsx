import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminPage } from './pages/AdminPage';
import './styles/global.css';
import './styles/identity.css';
import './styles/pages.css';
import './styles/consultation.css';
import './styles/motion.css';
import './styles/polish.css';
import './styles/data.css';

const page = document.documentElement.dataset.page === 'indicadores' ? 'indicadores' : 'inicio';
const topicId = new URLSearchParams(window.location.search).get('tema') ?? undefined;
const legacyHash = page === 'inicio' && ['#painel', '#metodologia', '#fontes', '#atualizacao', '#privacidade', '#sobre'].includes(window.location.hash);
if (document.documentElement.dataset.page === 'admin') {
  createRoot(document.getElementById('root')!).render(<StrictMode><AdminPage /></StrictMode>);
} else if (legacyHash) {
  window.location.replace(`./indicadores.html${window.location.hash}`);
} else {
  createRoot(document.getElementById('root')!).render(<StrictMode><App page={page} topicId={topicId} /></StrictMode>);
}
