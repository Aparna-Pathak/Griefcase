/**
 * reveal.js
 * Gentle scroll-reveal for elements marked [data-reveal]. Groups marked
 * [data-reveal-group] stagger their direct children in via --i (set by
 * content-loader when it renders repeated items, or defaulted here).
 * No-ops content immediately if the user prefers reduced motion — the
 * CSS already neutralizes the transition, this just avoids unnecessary
 * observer churn.
 */

export function initReveal() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      if (!child.style.getPropertyValue("--i")) child.style.setProperty("--i", i);
      child.setAttribute("data-reveal", "");
    });
  });

  const targets = document.querySelectorAll("[data-reveal]");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}
