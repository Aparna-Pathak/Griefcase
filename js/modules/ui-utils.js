/**
 * ui-utils.js
 * -----------------------------------------------------------------------
 * Small, dependency-free helpers shared across overlays and dialogs:
 * focus trapping, body scroll locking, a toast, and a reusable confirm
 * dialog. Kept generic so writer.js / library.js / release-ritual.js don't
 * duplicate this logic.
 */

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

let lastFocused = null;
let openLockCount = 0;

export function lockScroll() {
  openLockCount += 1;
  document.body.classList.add("no-scroll");
}

export function unlockScroll() {
  openLockCount = Math.max(0, openLockCount - 1);
  if (openLockCount === 0) document.body.classList.remove("no-scroll");
}

export function openOverlay(el, { focusEl } = {}) {
  lastFocused = document.activeElement;
  el.hidden = false;
  // Force reflow so the transition runs from the pre-open state.
  void el.offsetWidth;
  el.classList.add("is-open");
  lockScroll();
  const target = focusEl || el.querySelector(FOCUSABLE);
  if (target) target.focus();
}

export function closeOverlay(el) {
  el.classList.remove("is-open");
  unlockScroll();
  const done = () => {
    el.hidden = true;
    el.removeEventListener("transitionend", done);
  };
  el.addEventListener("transitionend", done);
  // Fallback in case transitionend doesn't fire (e.g. reduced motion / display none edge cases)
  setTimeout(() => {
    if (!el.classList.contains("is-open")) el.hidden = true;
  }, 600);
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
}

export function trapFocus(container, event) {
  if (event.key !== "Tab") return;
  const focusables = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

let toastTimer = null;
export function showToast(message, duration = 2600) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
}

export function announce(message) {
  const region = document.getElementById("live-region");
  if (region) region.textContent = message;
}

/**
 * Reusable confirm dialog. Returns a Promise<boolean> resolved true if the
 * user confirms, false if they cancel.
 */
export function confirmDialog(message, { confirmLabel = "Continue", cancelLabel = "Cancel" } = {}) {
  return new Promise((resolve) => {
    const backdrop = document.getElementById("confirm-backdrop");
    const text = document.getElementById("confirm-text");
    const okBtn = document.getElementById("confirm-ok");
    const cancelBtn = document.getElementById("confirm-cancel");

    text.textContent = message;
    okBtn.textContent = confirmLabel;
    cancelBtn.textContent = cancelLabel;

    const cleanup = (result) => {
      backdrop.classList.remove("is-open");
      setTimeout(() => { backdrop.hidden = true; }, 250);
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onKey);
      resolve(result);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onKey = (e) => {
      if (e.key === "Escape") cleanup(false);
      else trapFocus(backdrop, e);
    };

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    document.addEventListener("keydown", onKey);

    backdrop.hidden = false;
    void backdrop.offsetWidth;
    backdrop.classList.add("is-open");
    cancelBtn.focus();
  });
}
