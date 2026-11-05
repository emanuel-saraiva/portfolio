// Deterministic starfield: no dependencies, no canvas, gentle motion only.
(() => {
  const field = document.getElementById('starfield');
  if (!field) return;
  let seed = 72841;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const count = window.innerWidth < 700 ? 66 : 145;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'star';
    dot.style.left = `${(random() * 100).toFixed(2)}%`;
    dot.style.top = `${(random() * 72).toFixed(2)}%`;
    dot.style.setProperty('--size', `${random() > .83 ? 2.5 : 1.5}px`);
    dot.style.setProperty('--opacity', `${(.12 + random() * .46).toFixed(2)}`);
    fragment.appendChild(dot);
  }
  field.appendChild(fragment);
})();
