/**
 * preview-sketches.js
 * Wires the two "sketch" mockups in the Privacy & safety section (optional
 * sign-up, AI consent). Both are honest previews only — neither one sends,
 * stores, or transmits anything anywhere. They exist so people can react to
 * the idea before either becomes a real, built feature.
 */

import { showToast } from "./ui-utils.js";

export function initPreviewSketches() {
  const form = document.querySelector("[data-preview-signup]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Just a sketch for now — sign-up isn't live yet.");
    });
  }

  const consentCheckbox = document.querySelector("[data-preview-consent]");
  if (consentCheckbox) {
    consentCheckbox.addEventListener("change", () => {
      showToast(
        consentCheckbox.checked
          ? "Noted — this is only a preview of how consent might work."
          : "Okay — still just a preview, nothing was ever on."
      );
    });
  }
}
