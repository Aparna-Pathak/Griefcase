/**
 * library.js
 * "My Griefcase" — browsing, filtering, reading, and letting go of past
 * entries. Reads directly from state.js on every open/filter/delete so it
 * never holds stale data.
 */

import { openOverlay, closeOverlay, confirmDialog, showToast, trapFocus } from "./ui-utils.js";
import { getEntries, deleteEntry } from "./state.js";

let refs = {};
let categories = [];
let activeFilter = "all";
let activeEntryId = null;

export function initLibrary(cmsContent) {
  categories = cmsContent.categories;

  refs = {
    overlay: document.getElementById("library-overlay"),
    closeBtn: document.getElementById("library-close"),
    filters: document.getElementById("library-filters"),
    grid: document.getElementById("library-grid"),
    empty: document.getElementById("library-empty"),
    modalBackdrop: document.getElementById("entry-modal-backdrop"),
    modalDate: document.getElementById("entry-modal-date"),
    modalText: document.getElementById("entry-modal-text"),
    modalAudio: document.getElementById("entry-modal-audio"),
    modalMood: document.getElementById("entry-modal-mood"),
    modalClose: document.getElementById("entry-modal-close"),
    modalDelete: document.getElementById("entry-modal-delete"),
  };

  refs.closeBtn.addEventListener("click", () => closeOverlay(refs.overlay));
  refs.overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlay(refs.overlay);
    else trapFocus(refs.overlay, e);
  });

  refs.filters.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    activeFilter = chip.dataset.filter;
    refs.filters.querySelectorAll(".filter-chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
    chip.setAttribute("aria-pressed", "true");
    render();
  });

  refs.grid.addEventListener("click", (e) => {
    const slip = e.target.closest(".entry-slip");
    if (!slip) return;
    openEntry(slip.dataset.id);
  });

  refs.modalClose.addEventListener("click", closeEntryModal);
  refs.modalBackdrop.addEventListener("click", (e) => {
    if (e.target === refs.modalBackdrop) closeEntryModal();
  });
  refs.modalBackdrop.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEntryModal();
    else trapFocus(refs.modalBackdrop, e);
  });

  refs.modalDelete.addEventListener("click", handleDelete);
}

export function openLibrary() {
  activeFilter = "all";
  refs.filters.querySelectorAll(".filter-chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.filter === "all" ? "true" : "false"));
  render();
  openOverlay(refs.overlay);
}

function render() {
  const entries = getEntries().filter((e) => activeFilter === "all" || e.mood === activeFilter);

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    refs.grid.classList.remove("is-filtering");
    void refs.grid.offsetWidth;
    refs.grid.classList.add("is-filtering");
  }

  refs.grid.innerHTML = "";

  if (entries.length === 0) {
    refs.grid.hidden = true;
    refs.empty.hidden = false;
    refs.empty.querySelector("h3").textContent = activeFilter === "all"
      ? refs.empty.querySelector("h3").textContent
      : "Nothing tagged this way yet.";
    return;
  }

  refs.grid.hidden = false;
  refs.empty.hidden = true;

  const frag = document.createDocumentFragment();
  entries.forEach((entry, i) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "entry-slip";
    card.dataset.id = entry.id;
    const tilt = ((i % 5) - 2) * 0.6;
    card.style.setProperty("--tilt", `${tilt}deg`);
    if (entry.mood) card.style.setProperty("--mood-color", `var(--mood-${entry.mood})`);

    const preview = entry.text
      ? entry.text
      : "A recorded thought.";

    card.innerHTML = `
      <span class="entry-text">${escapeHtml(preview)}</span>
      <span class="entry-meta">
        <span>${formatDate(entry.createdAt)}</span>
        ${entry.audio ? '<span class="entry-voice-icon">&#9679; voice</span>' : ""}
      </span>
    `;
    frag.appendChild(card);
  });
  refs.grid.appendChild(frag);
}

function openEntry(id) {
  const entry = getEntries().find((e) => e.id === id);
  if (!entry) return;
  activeEntryId = id;

  refs.modalDate.textContent = formatDate(entry.createdAt, true);
  refs.modalText.textContent = entry.text || "";
  refs.modalText.hidden = !entry.text;

  refs.modalAudio.hidden = !entry.audio;
  refs.modalAudio.innerHTML = "";
  if (entry.audio) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = entry.audio;
    refs.modalAudio.appendChild(audio);
  }

  const cat = categories.find((c) => c.id === entry.mood);
  refs.modalMood.textContent = cat ? cat.label : "Untagged";
  refs.modalMood.style.setProperty("--mood-color", entry.mood ? `var(--mood-${entry.mood})` : "var(--color-taupe)");

  refs.modalBackdrop.hidden = false;
  void refs.modalBackdrop.offsetWidth;
  refs.modalBackdrop.classList.add("is-open");
  refs.modalClose.focus();
}

function closeEntryModal() {
  refs.modalBackdrop.classList.remove("is-open");
  setTimeout(() => { refs.modalBackdrop.hidden = true; }, 250);
  activeEntryId = null;
}

async function handleDelete() {
  if (!activeEntryId) return;
  const confirmed = await confirmDialog("Let this go for good? This can't be undone.", {
    confirmLabel: "Let this go",
    cancelLabel: "Keep it",
  });
  if (!confirmed) return;
  deleteEntry(activeEntryId);
  closeEntryModal();
  render();
  showToast("It's been let go.");
}

function formatDate(timestamp, long = false) {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, long
    ? { year: "numeric", month: "long", day: "numeric" }
    : { month: "short", day: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
