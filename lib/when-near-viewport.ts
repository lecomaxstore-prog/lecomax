/** Start optional work once it is useful; cleanup cancels work that has not started. */
export function whenNearViewport(element: Element | null, start: () => void) {
  if (!element || typeof IntersectionObserver === 'undefined') {
    const timer = setTimeout(start, 1500);
    return () => clearTimeout(timer);
  }
  let finished = false;
  const observer = new IntersectionObserver(entries => {
    if (finished || !entries.some(entry => entry.isIntersecting)) return;
    finished = true;
    observer.disconnect();
    start();
  }, { rootMargin: '300px' });
  observer.observe(element);
  return () => { finished = true; observer.disconnect(); };
}
