/**
 * interactions.js
 * -----------------------------------------------------------------------
 * Cross-cutting, pointer-driven motion that doesn't belong to any single
 * component: magnetic buttons, the hero's cursor-following glow, and
 * tilt-on-hover for library entry cards (delegated, since cards are
 * re-rendered on every filter change).
 *
 * Every effect here is a no-op on touch pointers and under
 * prefers-reduced-motion — these are garnish, never load-bearing, and a
 * static page with none of this still fully works.
 */

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = () => window.matchMedia("(pointer: coarse)").matches;

export function initInteractions() {
  if (prefersReducedMotion() || isCoarsePointer()) return;
  initMagneticButtons();
  initHeroGlow();
  initCardTilt();
}

/* ---- Magnetic buttons: a few px of cursor-follow within their own bounds ---- */
function initMagneticButtons() {
  const MAX_PULL = 8;
  const STRENGTH = 0.3;

  document.addEventListener("pointermove", (e) => {
    const btn = e.target.closest(".is-magnetic");
    if (btn) applyPull(btn, e);
  });

  document.addEventListener(
    "pointerout",
    (e) => {
      const btn = e.target.closest(".is-magnetic");
      if (btn && !btn.contains(e.relatedTarget)) resetPull(btn);
    },
    true
  );

  function applyPull(btn, e) {
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * STRENGTH;
    const y = (e.clientY - (rect.top + rect.height / 2)) * STRENGTH;
    const clampedX = Math.max(-MAX_PULL, Math.min(MAX_PULL, x));
    const clampedY = Math.max(-MAX_PULL, Math.min(MAX_PULL, y));
    btn.style.transform = `translate(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px)`;
  }

  function resetPull(btn) {
    btn.style.transform = "";
  }
}

/* ---- Hero cursor glow ---- */
function initHeroGlow() {
  const hero = document.getElementById("hero");
  const glow = document.getElementById("hero-glow");
  if (!hero || !glow) return;

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    glow.style.left = `${e.clientX - rect.left}px`;
    glow.style.top = `${e.clientY - rect.top}px`;
    glow.classList.add("is-active");
  });

  hero.addEventListener("pointerleave", () => glow.classList.remove("is-active"));
}

/* ---- Entry card tilt (delegated — cards are re-rendered on filter) ---- */
function initCardTilt() {
  const MAX_DEG = 5;
  let activeCard = null;

  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest(".entry-slip");
    if (card !== activeCard) {
      if (activeCard) resetTilt(activeCard);
      activeCard = card;
    }
    if (card) tilt(card, e);
  });

  document.addEventListener(
    "pointerout",
    (e) => {
      const card = e.target.closest(".entry-slip");
      if (card && !card.contains(e.relatedTarget)) {
        resetTilt(card);
        if (activeCard === card) activeCard = null;
      }
    },
    true
  );

  function tilt(card, e) {
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const rotY = (px * MAX_DEG * 2).toFixed(2);
    const rotX = (-py * MAX_DEG * 2).toFixed(2);
    card.classList.add("is-tilting");
    card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  }

  function resetTilt(card) {
    card.classList.remove("is-tilting");
    card.style.transform = "";
  }
}
