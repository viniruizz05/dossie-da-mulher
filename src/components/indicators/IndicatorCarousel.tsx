import { useId, useState } from 'react';
import { Icon } from '../ui/Icon';
import { IndicatorChart } from './IndicatorChart';
import type { Indicator } from '../../lib/data';
import type { IconName } from '../ui/Icon';

export function IndicatorCarousel({ title, icon, indicators }: { title: string; icon: IconName; indicators: Indicator[] }) {
  const uid = useId();
  const [activeId, setActiveId] = useState<string | undefined>();
  const [direction, setDirection] = useState<'next' | 'previous'>('next');
  const index = Math.max(0, indicators.findIndex(item => item.id === activeId));
  const multiple = indicators.length > 1;
  if (!indicators.length) return null;
  const select = (target: number, movement: 'next' | 'previous' = target >= index ? 'next' : 'previous') => {
    if (target < 0 || target >= indicators.length) return;
    setDirection(movement);
    setActiveId(indicators[target].id);
  };
  const move = (step: number) => select((index + step + indicators.length) % indicators.length, step > 0 ? 'next' : 'previous');
  return <section className={`indicator-carousel${multiple ? ' indicator-carousel--multiple' : ''}`} data-direction={direction} role="region" aria-roledescription={multiple ? 'carrossel' : undefined} aria-labelledby={`${uid}-heading`}>
    <div className="carousel-heading">
      <div className="carousel-topic"><span><Icon name={icon} size={19} /></span><div><p className="data-overline">{multiple ? 'INDICADORES DESTE TEMA' : 'TEMA'}</p><h3 id={`${uid}-heading`}>{title}</h3></div></div>
      {multiple && <div className="carousel-navigation" aria-label={`Navegar pelos indicadores de ${title}`} onKeyDown={event => {
        if (!(event.target instanceof HTMLButtonElement)) return;
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
        if (event.key === 'Home') { event.preventDefault(); select(0); }
        if (event.key === 'End') { event.preventDefault(); select(indicators.length - 1); }
      }}><button type="button" className="carousel-arrow carousel-arrow--previous" aria-controls={`${uid}-slides`} aria-label={`Indicador anterior de ${title}`} onClick={() => move(-1)}><Icon name="arrow" size={19} /></button><span className="carousel-count" aria-live="polite" aria-atomic="true"><strong key={indicators[index].id}>{index + 1}</strong> de {indicators.length}</span><button type="button" className="carousel-arrow" aria-controls={`${uid}-slides`} aria-label={`Próximo indicador de ${title}`} onClick={() => move(1)}><Icon name="arrow" size={19} /></button></div>}
    </div>
    {multiple && <label className="carousel-select"><span>Indicador</span><select value={indicators[index].id} onChange={event => select(indicators.findIndex(item => item.id === event.target.value))}>{indicators.map((item, itemIndex) => <option value={item.id} key={item.id}>{itemIndex + 1}. {item.title}</option>)}</select></label>}
    <div id={`${uid}-slides`} className="carousel-slides">{indicators.map((item, itemIndex) => <div className="carousel-slide" key={item.id} hidden={itemIndex !== index} role="group" aria-roledescription={multiple ? 'slide' : undefined} aria-label={multiple ? `${itemIndex + 1} de ${indicators.length}: ${item.title}` : undefined}><IndicatorChart indicator={item} /></div>)}</div>
  </section>;
}
