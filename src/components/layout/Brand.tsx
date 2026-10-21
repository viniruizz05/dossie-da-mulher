export function Brand({ light = false }: { light?: boolean }) {
  return <a href="./" className={`brand ${light ? 'brand--light' : ''}`} aria-label="Dossiê da Mulher — início"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><text x="21.3" y="32" textAnchor="middle">dm</text><circle cx="39.5" cy="30.6" r="1.9" /></svg></span><span><strong>Dossiê da Mulher</strong><small>ITAQUAQUECETUBA</small></span></a>;
}
