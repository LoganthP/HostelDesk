const NAV_OFFSET_PX = 88;

export function scrollToSection(id: string, focusHeading = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET_PX;
  window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
  if (window.location.hash !== `#${id}`) {
    window.history.pushState(null, '', `#${id}`);
  }
  if (focusHeading) {
    const heading = el.querySelector<HTMLElement>('h1, h2, [data-section-heading]') ?? el;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}

