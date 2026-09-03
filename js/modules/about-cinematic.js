/**
 * about-cinematic.js
 * -----------------------------------------------------------------------
 * The four-scene cinematic experience inside #about. Three independent
 * pieces, each optional and each a no-op if its target markup isn't on
 * the page:
 *
 *   1. Image wiring — pulls src/alt from about-images.js so the markup
 *      and CSS never hardcode a photo URL.
 *   2. Scene-in-view — a per-scene IntersectionObserver that triggers a
 *      slow image scale-down + scrim settle as each scene arrives.
 *      Transform/opacity only, so it's cheap, and it's already
 *      neutralized under prefers-reduced-motion by the global CSS rule
 *      in base.css (all transition-durations collapse to 1ms).
 *   3. Reveal spotlight — the cursor-following mask on scene 3, desktop
 *      + fine-pointer only. On touch/coarse pointers, or under reduced
 *      motion, the second image simply fades in at low opacity once the
 *      scene is in view (see about-cinematic.css) instead of requiring
 *      an interaction nobody on that device can perform.
 */

import { ABOUT_IMAGES } from "./about-images.js";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = () => window.matchMedia("(pointer: coarse)").matches;

export function initAboutCinematic() {
  const root = document.getElementById("about");
  if (!root) return;

  wireImages(root);
  initSceneObserver(root);

  if (!prefersReducedMotion() && !isCoarsePointer()) {
    initRevealSpotlight(root);
    initParallax(root);
  } else {
    root.classList.add("is-static-reveal");
  }
}

function wireImages(root) {
  root.querySelectorAll("[data-about-image]").forEach((img) => {
    const key = img.dataset.aboutImage;
    const source = ABOUT_IMAGES[key];
    if (!source) return;
    img.src = source.url;
    img.alt = source.alt;
    img.loading = img.dataset.eager === "true" ? "eager" : "lazy";
    img.decoding = "async";
  });
}

function initSceneObserver(root) {
  const scenes = root.querySelectorAll(".about-scene");
  if (!scenes.length) return;

  if (!("IntersectionObserver" in window)) {
    scenes.forEach((s) => {
      s.classList.add("is-in-view");
      const img = s.querySelector(".about-scene-img");
      if (img) img.dataset.inView = "true";
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-in-view", entry.isIntersecting);
        const img = entry.target.querySelector(".about-scene-img");
        if (img) img.dataset.inView = String(entry.isIntersecting);
      });
    },
    { threshold: 0.35 }
  );

  scenes.forEach((s) => observer.observe(s));
}

/* ---- Cursor-reactive reveal (scene 3 only, fine pointer, motion OK) ---- */
function initRevealSpotlight(root) {
  const scene = root.querySelector(".about-scene-reveal");
  if (!scene) return;
  const media = scene.querySelector(".about-scene-media");
  const layer = scene.querySelector(".about-reveal-layer");
  const hint = scene.querySelector(".about-reveal-hint");
  if (!media || !layer) return;

  let targetX = 50;
  let targetY = 50;
  let curX = 50;
  let curY = 50;
  let raf = null;

  function paint() {
    layer.style.setProperty("--rx", `${curX}%`);
    layer.style.setProperty("--ry", `${curY}%`);
  }

  function tick() {
    curX += (targetX - curX) * 0.08;
    curY += (targetY - curY) * 0.08;
    paint();
    if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  }

  media.addEventListener("pointermove", (e) => {
    const rect = media.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width) * 100;
    targetY = ((e.clientY - rect.top) / rect.height) * 100;
    layer.classList.add("is-active");
    if (hint) hint.classList.add("is-dismissed");
    if (!raf) raf = requestAnimationFrame(tick);
  });

  media.addEventListener("pointerleave", () => {
    layer.classList.remove("is-active");
  });
}

/* ---- Subtle scroll parallax on scene imagery (transform only) ---- */
function initParallax(root) {
  const images = Array.from(root.querySelectorAll(".about-scene-img"));
  if (!images.length) return;

  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - vh / 2;
      // Clamp so the drift never exceeds a few percent of the image's own height.
      const drift = Math.max(-24, Math.min(24, centerOffset * 0.04));
      const scale = img.dataset.inView === "true" ? 1 : 1.06;
      img.style.transform = `scale(${scale}) translateY(${drift.toFixed(1)}px)`;
    });
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  update();
}
