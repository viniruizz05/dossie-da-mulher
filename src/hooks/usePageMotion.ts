import { useEffect } from 'react';
export function usePageMotion() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || !('IntersectionObserver' in window)) return;
    const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    let observer: IntersectionObserver | undefined;
    const restore = () => {
      observer?.disconnect();
      targets.forEach(target => {
        target.removeAttribute('data-reveal-state');
        target.style.removeProperty('--reveal-delay');
      });
    };
    try {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealState = 'visible';
          observer?.unobserve(entry.target);
        }
      }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
      targets.forEach((target, index) => {
        if (target.getBoundingClientRect().top < window.innerHeight - 24) return;
        observer?.observe(target);
        target.style.setProperty('--reveal-delay', `${(index % 3) * 65}ms`);
        target.dataset.revealState = 'pending';
      });
    } catch {
      restore();
      return;
    }
    const onPreferenceChange = () => { if (preference.matches) restore(); };
    preference.addEventListener('change', onPreferenceChange);
    return () => {
      preference.removeEventListener('change', onPreferenceChange);
      restore();
    };
  }, []);
}
