/**
 * about-carousel.js
 * -----------------------------------------------------------------------
 * The About section as a self-paced, auto-advancing carousel (replaces
 * the earlier scroll-scrubbed "cinematic scenes" version — same four
 * beats, same images, but presented as a single fixed-height stage that
 * cycles on its own rather than requiring the visitor to scroll through
 * four full viewports).
 *
 * Behavior:
 *   - Autoplay advances one slide every 2 seconds (AUTOPLAY_MS below),
 *     with a progress bar that fills in sync so the cadence is visible,
 *     not just felt.
 *   - Hovering/focusing the carousel, or interacting with a dot/arrow,
 *     pauses autoplay; it resumes a few seconds after the pointer leaves.
 *   - Fully controllable by keyboard and via the dot/arrow buttons —
 *     autoplay is a convenience, never the only way to move through it.
 *   - `prefers-reduced-motion` disables autoplay and the per-slide
 *     Ken Burns drift entirely; the carousel becomes purely click/tap-
 *     driven, still fully functional.
 *   - Pauses whenever the tab is hidden or the section scrolls out of
 *     view, so it isn't silently burning frames off-screen.
 */

import { ABOUT_IMAGES } from "./about-images.js";

const AUTOPLAY_MS = 2000;
const RESUME_DELAY_MS = 3200;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initAboutCarousel() {
  const root = document.getElementById("about");
  if (!root) return;

  wireImages(root);

  const slides = Array.from(root.querySelectorAll(".about-slide"));
  const dots = Array.from(root.querySelectorAll(".about-carousel-dot"));
  const arrows = Array.from(root.querySelectorAll(".about-carousel-arrow"));
  const progressBar = document.getElementById("about-carousel-progress-bar");
  if (!slides.length) return;

  const reduced = prefersReducedMotion();
  let index = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
  if (index < 0) index = 0;

  let timer = null;
  let progressStart = 0;
  let resumeTimeout = null;
  let inView = true;
  let tabHidden = document.hidden;

  function paint() {
    slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
    dots.forEach((d, i) => {
      d.classList.toggle("is-active", i === index);
      d.setAttribute("aria-selected", i === index ? "true" : "false");
    });
  }

  function goTo(next, { userInitiated = false } = {}) {
    index = ((next % slides.length) + slides.length) % slides.length;
    paint();
    if (userInitiated) {
      pauseAutoplay();
      scheduleResume();
    } else {
      restartProgress();
    }
  }

  function restartProgress() {
    if (!progressBar || reduced) return;
    progressBar.style.transition = "none";
    progressBar.style.transform = "scaleX(0)";
    // Force reflow so the next transition actually starts from 0.
    void progressBar.offsetWidth;
    progressBar.style.transition = `transform ${AUTOPLAY_MS}ms linear`;
    progressBar.style.transform = "scaleX(1)";
  }

  function startAutoplay() {
    if (reduced || timer || !inView || tabHidden) return;
    restartProgress();
    progressStart = Date.now();
    timer = setInterval(() => {
      index = (index + 1) % slides.length;
      paint();
      restartProgress();
    }, AUTOPLAY_MS);
  }

  function pauseAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (progressBar) {
      const elapsed = Date.now() - progressStart;
      const frac = Math.min(1, elapsed / AUTOPLAY_MS);
      progressBar.style.transition = "none";
      progressBar.style.transform = `scaleX(${frac})`;
    }
  }

  function scheduleResume() {
    if (resumeTimeout) clearTimeout(resumeTimeout);
    resumeTimeout = setTimeout(() => {
      if (!root.matches(":hover") && !root.contains(document.activeElement)) {
        startAutoplay();
      }
    }, RESUME_DELAY_MS);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => goTo(i, { userInitiated: true }));
  });

  arrows.forEach((arrow) => {
    arrow.addEventListener("click", () => {
      const dir = Number(arrow.dataset.dir) || 1;
      goTo(index + dir, { userInitiated: true });
    });
  });

  root.addEventListener("pointerenter", pauseAutoplay);
  root.addEventListener("pointerleave", () => {
    if (!root.contains(document.activeElement)) scheduleResume();
  });
  root.addEventListener("focusin", pauseAutoplay);
  root.addEventListener("focusout", () => {
    // Give focus a tick to land on the new element before checking.
    setTimeout(() => {
      if (!root.contains(document.activeElement) && !root.matches(":hover")) scheduleResume();
    }, 0);
  });

  // Basic swipe support for touch.
  let touchStartX = null;
  root.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", (e) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 40) return;
    goTo(index + (dx < 0 ? 1 : -1), { userInitiated: true });
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) startAutoplay();
          else pauseAutoplay();
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(root);
  }

  document.addEventListener("visibilitychange", () => {
    tabHidden = document.hidden;
    if (tabHidden) pauseAutoplay();
    else startAutoplay();
  });

  paint();
  startAutoplay();
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
