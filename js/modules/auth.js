/**
 * auth.js
 * Real, optional accounts: a one-time emailed magic link to sign back in,
 * and a persisted AI-consent preference. This talks to the real API in
 * worker/index.js (/api/auth/*, /api/consent) — nothing here is a mockup.
 *
 * What this deliberately does NOT do: sync musings to the server. Entries
 * stay exactly where they've always lived — only in this browser's
 * localStorage (see state.js). Signing in only affects this card and the
 * AI-consent checkbox next to it.
 */

import { showToast } from "./ui-utils.js";

const RESEND_COOLDOWN_MS = 30000;

let refs = {};
let signedIn = false;
let userEmail = null;
let resendTimer = null;

export async function initAuth() {
  refs = {
    card: document.getElementById("signup-card"),
    copy: document.getElementById("signup-copy"),
    form: document.querySelector("[data-preview-signup]"),
    emailInput: document.getElementById("preview-signup-email"),
    submitBtn: document.getElementById("signup-submit"),
    footnote: document.getElementById("signup-footnote"),
    consentCheckbox: document.querySelector("[data-preview-consent]"),
    consentFootnote: document.getElementById("consent-footnote"),
  };

  handleRedirectParams();

  if (refs.form) {
    refs.form.addEventListener("submit", handleSignupSubmit);
  }
  if (refs.consentCheckbox) {
    refs.consentCheckbox.addEventListener("change", handleConsentChange);
  }

  await refreshSession();
}

async function refreshSession() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "same-origin" });
    const data = await res.json();
    signedIn = !!data.signedIn;
    userEmail = data.email || null;
    if (signedIn && refs.consentCheckbox) {
      refs.consentCheckbox.checked = !!data.aiConsent;
    }
  } catch {
    signedIn = false;
    userEmail = null;
  }
  render();
}

function render() {
  if (!refs.card) return;

  if (signedIn) {
    refs.card.innerHTML = `
      <h4>Optional sign-up</h4>
      <div class="account-status">
        <span>Signed in as <strong>${escapeHtml(userEmail || "")}</strong></span>
        <button type="button" class="btn-text" id="signout-btn">Sign out</button>
      </div>
      <p class="preview-footnote">Your musings still only ever live on this device. This account just remembers your AI-consent choice and lets you sign back in.</p>
    `;
    document.getElementById("signout-btn")?.addEventListener("click", handleSignOut);
  }

  if (refs.consentFootnote) {
    refs.consentFootnote.textContent = signedIn
      ? "Saved to your account. Change it anytime."
      : "Off by default. Check this now and it'll apply as soon as you sign up above — or sign up first and set it anytime.";
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  if (!refs.emailInput) return;
  const email = refs.emailInput.value.trim();
  if (!email) return;

  refs.submitBtn.disabled = true;
  refs.submitBtn.textContent = "Sending…";

  try {
    const res = await fetch("/api/auth/request-link", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, consent: !!refs.consentCheckbox?.checked }),
    });
    const data = await res.json().catch(() => ({}));

    if (data.ok) {
      showToast("Check your email — the link works once and expires in 15 minutes.");
      if (refs.footnote) refs.footnote.textContent = `Sent to ${email}. Didn't get it? Check spam, or try again shortly.`;
      refs.emailInput.value = "";
      startResendCooldown();
    } else {
      showToast(data.error || "Something went wrong — please try again.");
      refs.submitBtn.disabled = false;
      refs.submitBtn.textContent = "Send magic link";
    }
  } catch {
    showToast("Couldn't reach Griefcase just now — please try again.");
    refs.submitBtn.disabled = false;
    refs.submitBtn.textContent = "Send magic link";
  }
}

function startResendCooldown() {
  let remaining = Math.round(RESEND_COOLDOWN_MS / 1000);
  refs.submitBtn.disabled = true;
  refs.submitBtn.textContent = `Resend in ${remaining}s`;
  clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(resendTimer);
      refs.submitBtn.disabled = false;
      refs.submitBtn.textContent = "Send magic link";
    } else {
      refs.submitBtn.textContent = `Resend in ${remaining}s`;
    }
  }, 1000);
}

async function handleConsentChange() {
  if (!signedIn) return; // pending choice — applied on next sign-up request
  const consent = !!refs.consentCheckbox.checked;
  try {
    const res = await fetch("/api/consent", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      showToast(consent ? "Saved — AI reflection consent is on." : "Saved — AI reflection consent is off.");
    } else {
      showToast(data.error || "Couldn't save that just now.");
      refs.consentCheckbox.checked = !consent;
    }
  } catch {
    showToast("Couldn't reach Griefcase just now — please try again.");
    refs.consentCheckbox.checked = !consent;
  }
}

async function handleSignOut() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  } catch {
    // best-effort — the cookie will simply expire on its own otherwise
  }
  signedIn = false;
  userEmail = null;
  showToast("Signed out.");
  refs.card.innerHTML = `
    <h4>Optional sign-up</h4>
    <p id="signup-copy">So you can sign back in on another device someday. Never required — Griefcase stays fully usable with no account at all.</p>
    <form class="preview-signup-form" data-preview-signup novalidate>
      <label class="sr-only" for="preview-signup-email">Email address</label>
      <input type="email" id="preview-signup-email" placeholder="you@example.com" autocomplete="email" required>
      <button type="submit" class="btn btn-primary" id="signup-submit">Send magic link</button>
    </form>
    <p class="preview-footnote" id="signup-footnote">No password, ever. We'll email you a one-time link — it won't do anything until you open it.</p>
  `;
  refs.form = document.querySelector("[data-preview-signup]");
  refs.emailInput = document.getElementById("preview-signup-email");
  refs.submitBtn = document.getElementById("signup-submit");
  refs.footnote = document.getElementById("signup-footnote");
  refs.form.addEventListener("submit", handleSignupSubmit);
  if (refs.consentCheckbox) refs.consentCheckbox.checked = false;
  render();
}

function handleRedirectParams() {
  const params = new URLSearchParams(window.location.search);
  const welcome = params.get("welcome");
  const authError = params.get("authError");

  if (welcome) {
    showToast("You're signed in.");
  } else if (authError === "expired") {
    showToast("That link expired or was already used — request a new one below.");
  } else if (authError === "missing") {
    showToast("That link looks incomplete — request a new one below.");
  }

  if (welcome || authError) {
    params.delete("welcome");
    params.delete("authError");
    const query = params.toString();
    const newUrl = window.location.pathname + (query ? `?${query}` : "") + window.location.hash;
    window.history.replaceState({}, "", newUrl);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
