import { Brand } from './Brand';

export function Footer() {
  return (
    <footer className="footer footer-compact">
      <div className="container">
        <div className="footer-main">
          <Brand light />
          <div className="footer-institution"><strong>Prefeitura de Itaquaquecetuba</strong><p>Secretaria da Mulher</p></div>
          <a className="footer-return" href="./">Página inicial</a>
        </div>
        <div className="footer-bottom"><span>Dossiê da Mulher Itaquaquecetubense</span><span>Versão de apresentação · Relatório oficial pendente</span></div>
      </div>
    </footer>
  );
}

