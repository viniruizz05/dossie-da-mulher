import { Brand } from './Brand';
import { Icon } from '../ui/Icon';

export function Footer() {
  return (
    <footer className="footer footer-compact">
      <div className="container">
        <div className="footer-main">
          <Brand light />
          <div className="footer-institution"><strong>Prefeitura de Itaquaquecetuba</strong><p>Secretaria da Mulher</p></div>
          <a className="footer-return" href="./">Página inicial</a>
        </div>
        <div className="footer-bottom"><span>Dossiê da Mulher Itaquaquecetubense</span><a className="footer-login" href="./admin.html"><Icon name="lock" size={14} />Área administrativa</a></div>
      </div>
    </footer>
  );
}

