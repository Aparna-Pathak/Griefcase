/**
 * faq.js — simple accessible accordion for the FAQ list rendered by
 * content-loader.js.
 */

export function initFaq() {
  const list = document.getElementById("faq-list");
  if (!list) return;

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".faq-question");
    if (!btn) return;
    const item = btn.closest(".faq-item");
    const answer = item.querySelector(".faq-answer");
    const isOpen = item.classList.contains("is-open");

    // Close siblings for a calmer, single-focus reading experience.
    list.querySelectorAll(".faq-item.is-open").forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove("is-open");
        openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        openItem.querySelector(".faq-answer").style.maxHeight = null;
      }
    });

    item.classList.toggle("is-open", !isOpen);
    btn.setAttribute("aria-expanded", String(!isOpen));
    answer.style.maxHeight = !isOpen ? `${answer.scrollHeight}px` : null;
  });
}
