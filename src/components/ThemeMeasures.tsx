import { useState } from 'react';
import { Icon } from './Icon';

export function ThemeMeasures({ id, title, measures }: { id: string; title: string; measures: readonly string[] }) {
  const [open, setOpen] = useState(false);
  const panelId = `measures-${id}`;

  return (
    <div className="theme-details" data-open={open}>
      <button className="theme-details-toggle" type="button" aria-expanded={open}
        aria-controls={panelId} aria-label={`Indicadores previstos: ${title}`}
        onClick={() => setOpen(value => !value)}>
        <Icon name="layers" size={18} />
        <span>Indicadores previstos</span>
        <span className="theme-details-chevron"><Icon name="chevron" size={16} /></span>
      </button>
      <div className="theme-details-panel" id={panelId} aria-hidden={!open} inert={!open}>
        <div className="theme-details-inner">
          <ul>{measures.map(measure => <li key={measure}>{measure}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
