/**
 * interest-form.js
 * -----------------------------------------------------------------------
 * The "founding circle" form — the only thing on Griefcase today that
 * deliberately leaves the visitor's browser. Posts to /api/interest,
 * served by worker/index.js. Everything else on the site (entries, mood
 * tags, sound preference) stays local — this is the one exception, and
 * the form copy says so explicitly before anyone submits it.
 */

let content = null;

export function initInterestForm(loadedContent) {
  content = loadedContent?.foundingCircle || {};
  const form = document.getElementById("founding-form");
  if (!form) return;

  const peerCheckbox = document.getElementById("founding-wants-peer");
  const peerFields = document.getElementById("founding-peer-fields");
  if (peerCheckbox && peerFields) {
    peerCheckbox.addEventListener("change", () => {
      peerFields.hidden = !peerCheckbox.checked;
    });
  }

  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const statusEl = document.getElementById("founding-status");
  const submitBtn = document.getElementById("founding-submit");

  const email = form.email.value.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showStatus(statusEl, content.errorEmail || "Please enter a valid email address.", true);
    form.email.focus();
    return;
  }

  const payload = {
    email,
    griefType: form.griefType.value.trim() || null,
    wantsToBePeer: !!form.wantsToBePeer.checked,
    motivation: form.wantsToBePeer.checked ? form.motivation.value.trim() || null : null,
    availability: form.wantsToBePeer.checked ? form.availability.value.trim() || null : null,
    message: form.message.value.trim() || null,
    website: form.website.value, // honeypot
  };

  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = content.submittingLabel || "Sending…";
  showStatus(statusEl, "", false, true);

  try {
    const res = await fetch("/api/interest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "request_failed");
    }

    form.reset();
    if (document.getElementById("founding-peer-fields")) {
      document.getElementById("founding-peer-fields").hidden = true;
    }
    showStatus(statusEl, content.successBody || "You're on the list.", false);
  } catch (err) {
    showStatus(statusEl, content.errorGeneric || "Something went wrong. Please try again in a moment.", true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

function showStatus(el, text, isError, hide = false) {
  if (!el) return;
  if (hide) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.textContent = text;
  el.classList.toggle("is-error", !!isError);
  el.classList.toggle("is-success", !isError);
}
