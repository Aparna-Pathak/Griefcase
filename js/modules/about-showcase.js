/**
 * about-showcase.js
 * -----------------------------------------------------------------------
 * The About section as a compact, click-driven "feature tour": an image
 * frame beside an interactive list of four beats (replaces the earlier
 * full-height auto-advancing carousel — same four beats, far less space,
 * text lives beside the photo instead of on top of it).
 *
 * Behavior:
 *   - Idle-advances one beat every 4.5s (AUTOPLAY_MS below), with a thin
 *     progress bar under the active beat so the cadence is visible, not
 *     just felt.
 *   - Clicking any beat jumps straight to it; hovering/focusing the
 *     component pauses idle-advance, which resumes a few seconds after
 *     you leave it alone.
 *   - Arrow Up/Down (or Left/Right) move focus between beats when one is
 *     focused, for quick keyboard browsing.
 *   - `prefers-reduced-motion` disables idle-advance and the crossfade/
 *     sheen animation entirely — purely click-driven, still fully
 *     functional.
 *   - Pauses whenever the tab is hidden or the section scrolls out of
 *     view.
 */

import { ABOUT_IMAGES } from "./about-images.js";

const AUTOPLAY_MS = 4500;
const RESUME_DELAY_MS = 4000;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initAboutShowcase() {
  const root = document.getElementById("about");
  if (!root) return;

  wireImages(root);

  const beats = Array.from(root.querySelectorAll(".about-beat"));
  const images = Array.from(root.querySelectorAll(".about-showcase-img"));
  const sheen = root.querySelector(".about-showcase-sheen");
  if (!beats.length || !images.length) return;

  const reduced = prefersReducedMotion();
  let index = Math.max(0, beats.findIndex((b) => b.classList.contains("is-active")));
  if (index < 0) index = 0;

  let timer = null;
  let progressStart = 0;
  let resumeTimeout = null;
  let inView = true;
  let tabHidden = document.hidden;

  function paint(previous) {
    beats.forEach((b, i) => {
      const active = i === index;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-current", active ? "true" : "false");
    });
    images.forEach((img, i) => img.classList.toggle("is-active", i === index));
    if (!reduced && sheen && previous !== index) {
      sheen.classList.remove("is-sweeping");
      void sheen.offsetWidth; // eslint-disable-line no-unused-expressions
      sheen.classList.add("is-sweeping");
    }
  }

  function goTo(next, { userInitiated = false } = {}) {
    const previous = index;
    index = ((next % beats.length) + beats.length) % beats.length;
    paint(previous);
    if (userInitiated) {
      // A manual jump always starts the new beat's bar at zero — freezing
      // it at whatever fraction the *previous* beat's autoplay cycle had
      // reached would show a stale, unrelated amount of progress.
      stopAutoplay();
      resetBars();
      scheduleResume();
    } else {
      restartProgress();
    }
  }

  function activeBar() {
    return beats[index] && beats[index].querySelector(".about-beat-bar span");
  }

  function resetBars() {
    beats.forEach((b) => {
      const bar = b.querySelector(".about-beat-bar span");
      if (!bar) return;
      bar.style.transition = "none";
      bar.style.transform = "scaleX(0)";
    });
  }

  function restartProgress() {
    beats.forEach((b, i) => {
      if (i === index) return;
      const bar = b.querySelector(".about-beat-bar span");
      if (!bar) return;
      bar.style.transition = "none";
      bar.style.transform = "scaleX(0)";
    });
    const bar = activeBar();
    if (!bar || reduced) return;
    bar.style.transition = "none";
    bar.style.transform = "scaleX(0)";
    void bar.offsetWidth; // eslint-disable-line no-unused-expressions
    bar.style.transition = `transform ${AUTOPLAY_MS}ms linear`;
    bar.style.transform = "scaleX(1)";
  }

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startAutoplay() {
    if (reduced || timer || !inView || tabHidden) return;
    restartProgress();
    progressStart = Date.now();
    timer = setInterval(() => {
      goTo(index + 1);
    }, AUTOPLAY_MS);
  }

  /* Freezes the active bar at its current visual progress — used when the
     pointer/focus pauses autoplay without changing which beat is active
     (a manual jump goes through goTo's userInitiated branch instead,
     which resets to zero rather than freezing a stale fraction). Resuming
     still restarts the bar from zero (via startAutoplay -> restartProgress)
     — the freeze here is only to stop it looking like it's still animating
     while paused. */
  function pauseAutoplay() {
    stopAutoplay();
    const bar = activeBar();
    if (bar) {
      const elapsed = Date.now() - progressStart;
      const frac = Math.min(1, elapsed / AUTOPLAY_MS);
      bar.style.transition = "none";
      bar.style.transform = `scaleX(${frac})`;
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

  beats.forEach((beat, i) => {
    beat.addEventListener("click", () => goTo(i, { userInitiated: true }));
    beat.addEventListener("keydown", (e) => {
      if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(e.key)) return;
      e.preventDefault();
      const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
      const target = ((i + dir) % beats.length + beats.length) % beats.length;
      beats[target].focus();
      goTo(target, { userInitiated: true });
    });
  });

  const frame = root.querySelector(".about-showcase-frame");
  if (frame) {
    frame.addEventListener("pointerenter", pauseAutoplay);
    frame.addEventListener("pointerleave", () => {
      if (!frame.contains(document.activeElement)) scheduleResume();
    });
    frame.addEventListener("focusin", pauseAutoplay);
    frame.addEventListener("focusout", () => {
      setTimeout(() => {
        if (!frame.contains(document.activeElement) && !frame.matches(":hover")) scheduleResume();
      }, 0);
    });
  }

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

  wirePointerTilt(root, reduced);

  paint(null);
  startAutoplay();
}

/* A light pointer-driven tilt on the photo frame — the one genuinely
   interactive "premium" touch in this redesign. Deliberately narrow:
   only wired on precise pointers (matchMedia "(pointer: fine)"), so it
   never engages on touch devices, and skipped entirely under
   prefers-reduced-motion. The transition defined in CSS is disabled
   while the pointer is actively moving (so tracking feels immediate,
   not eased) and restored on pointerleave so the frame settles back to
   neutral smoothly rather than snapping. */
function wirePointerTilt(root, reduced) {
  if (reduced) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const visual = root.querySelector(".about-showcase-visual");
  if (!visual) return;

  const MAX_TILT_DEG = 5;
  let raf = null;
  let pending = null;

  function apply() {
    raf = null;
    if (!pending) return;
    visual.style.transform = `perspective(900px) rotateX(${pending.rotateX}deg) rotateY(${pending.rotateY}deg)`;
  }

  visual.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    const rect = visual.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    pending = {
      rotateY: (px - 0.5) * MAX_TILT_DEG * 2,
      rotateX: (0.5 - py) * MAX_TILT_DEG * 2,
    };
    visual.style.transition = "none";
    if (!raf) raf = requestAnimationFrame(apply);
  });

  visual.addEventListener("pointerleave", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    pending = null;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    visual.style.transition = "";
    visual.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  });
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
