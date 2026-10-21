import { useEffect } from 'react';

// O conteúdo é renderizado no cliente: ao chegar de outra página, o navegador procura a âncora antes de ela existir.
export function useScrollToHash() {
  useEffect(() => {
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
  }, []);
}
