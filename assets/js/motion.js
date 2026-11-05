// Repeat reveal transitions on every viewport entry, including scrolling back up.
// No external dependencies; reduced-motion users receive static content.
(() => {
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll(
    '.hero > *, .section-header, .section-head, .premium-section > .eyebrow, .premium-section > h2, .premium-section > p, .split-section, .contact-section > .button, .card, .prose > h1, .prose > .lead, .prose > h2, .prose > p, .prose > ul, .prose > pre, .prose > .notice, .prose > .system-diagram, .prose > .tags'
  );
  if (!targets.length) return;

  targets.forEach((el, index) => {
    el.classList.add('scroll-reveal');
    if (el.classList.contains('card')) {
      el.style.setProperty('--reveal-delay', `${(index % 2) * 100}ms`);
    }
  });
  document.documentElement.classList.add('motion-ready');

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      // Do not unobserve: clearing the class allows the transition to replay.
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    }
  }, { threshold: 0, rootMargin: '-25px 0px -25px 0px' });

  targets.forEach(el => observer.observe(el));
})();
