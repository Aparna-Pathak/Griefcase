/**
 * counters.js
 * -----------------------------------------------------------------------
 * Animated count-up for the numbers in the Vision section's stat cards
 * (91%, 4.2 / 5, 150M → <30M). Generic on purpose: it doesn't hardcode
 * those three values, it finds every numeric substring in an element's
 * text (via regex) and counts each one up from 0 to its real value,
 * leaving everything else (%, /, →, <, M, spacing) exactly where it was
 * — so editing the numbers in data/content.json doesn't require touching
 * this file.
 *
 * No-ops under prefers-reduced-motion (the static, final text is already
 * correct — there's simply nothing left to animate).
 */

const NUMBER_PATTERN = /\d+(\.\d+)?/g;
const DURATION_MS = 1400;

export function initCounters() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const targets = document.querySelectorAll(".vision-stat-value");
  if (!targets.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  targets.forEach((el) => observer.observe(el));
}

function animateValue(el) {
  const original = el.textContent;
  const matches = [...original.matchAll(NUMBER_PATTERN)];
  if (!matches.length) return;

  const start = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - start) / DURATION_MS);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic

    let cursor = 0;
    let output = "";
    matches.forEach((m) => {
      output += original.slice(cursor, m.index);
      const target = parseFloat(m[0]);
      const decimals = m[0].includes(".") ? m[0].split(".")[1].length : 0;
      const current = target * eased;
      output += decimals ? current.toFixed(decimals) : String(Math.round(current));
      cursor = m.index + m[0].length;
    });
    output += original.slice(cursor);
    el.textContent = output;

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = original; // guarantee exact final text
    }
  }

  requestAnimationFrame(frame);
}
