import { useRef, useState } from 'react';
import { Icon } from './Icon';

export function Brand({ light = false }: { light?: boolean }) {
  return <a href="./" className={`brand ${light ? 'brand--light' : ''}`} aria-label="Dossiê da Mulher — início"><span className="brand-mark" aria-hidden="true">dm<span>·</span></span><span><strong>Dossiê da Mulher</strong><small>ITAQUAQUECETUBA</small></span></a>;
}

export function Header({ page = 'inicio' }: { page?: 'inicio' | 'indicadores' }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return (
    <>
      <div className="institutional-bar"><div className="container"><span>Prefeitura de Itaquaquecetuba <span className="institutional-divider">/</span> Secretaria da Mulher</span><span className="institutional-label">Informação a serviço das mulheres</span></div></div>
      <header className="header" onKeyDown={event => {
        if (event.key === 'Escape' && open) { setOpen(false); button.current?.focus(); }
      }}>
        <div className="container header-inner">
          <Brand />
          <button ref={button} type="button" className="menu-button" aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button>
          <nav id="navigation" aria-label="Navegação principal" data-open={open} onClick={() => setOpen(false)}>
            <a href="./" aria-current={page === 'inicio' ? 'page' : undefined}>Início</a>
            <a href="./#temas">Temas</a>
            <a href="./indicadores.html#metodologia">Sobre os dados</a>
            <a className="nav-cta" href="./indicadores.html" aria-current={page === 'indicadores' ? 'page' : undefined}>Indicadores <Icon name="arrow" size={16} /></a>
          </nav>
        </div>
      </header>
    </>
  );
}

