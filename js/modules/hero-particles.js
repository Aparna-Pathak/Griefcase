/**
 * hero-particles.js
 * Barely-perceptible floating particles in the hero atmosphere. Purely
 * decorative and marked aria-hidden by its container. Skips generation
 * entirely under prefers-reduced-motion, since the CSS keyframes are
 * neutralized anyway and there's no reason to churn the DOM.
 */

export function initHeroParticles(count = 14) {
  const wrap = document.getElementById("hero-particles");
  if (!wrap) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    const size = (Math.random() * 2.5 + 1.5).toFixed(1);
    const left = (Math.random() * 100).toFixed(1);
    const duration = (Math.random() * 10 + 14).toFixed(1);
    const delay = (Math.random() * -18).toFixed(1);
    p.style.setProperty("--size", `${size}px`);
    p.style.setProperty("--dur", `${duration}s`);
    p.style.setProperty("--delay", `${delay}s`);
    p.style.left = `${left}%`;
    frag.appendChild(p);
  }
  wrap.appendChild(frag);
}
