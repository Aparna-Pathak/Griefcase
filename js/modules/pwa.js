/**
 * pwa.js
 * -----------------------------------------------------------------------
 * Service worker registration + a custom, dismissible install prompt.
 * Kept deliberately calm: the banner only appears once the browser says
 * the app is actually installable, never nags after a dismissal, and
 * never appears at all if the app is already installed.
 */

const DISMISS_KEY = "griefcase:install-dismissed";
let deferredPrompt = null;

export function initPWA() {
  registerServiceWorker();
  initInstallPrompt();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (window.location.protocol === "file:") return; // SW requires http(s)

  // Registered directly rather than deferred to the window `load` event:
  // this runs from inside main.js's async bootstrap(), which awaits a
  // content fetch first — by the time that resolves, `load` may already
  // have fired, so a `load` listener attached here could wait forever.
  // register() itself is cheap and non-blocking, so there's no real
  // benefit to deferring it further.
  navigator.serviceWorker.register("sw.js").catch((err) => {
    console.warn("Griefcase: service worker registration failed —", err.message);
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // iOS Safari
  );
}

function initInstallPrompt() {
  const banner = document.getElementById("install-banner");
  const confirmBtn = document.getElementById("install-confirm");
  const dismissBtn = document.getElementById("install-dismiss");
  if (!banner || !confirmBtn || !dismissBtn) return;

  if (isStandalone() || localStorage.getItem(DISMISS_KEY) === "1") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    banner.hidden = false;
    // Let a real writing moment finish before interrupting with this —
    // show it a beat after the page has settled, not the instant it's eligible.
    requestAnimationFrame(() => {
      setTimeout(() => banner.classList.add("is-visible"), 400);
    });
  });

  confirmBtn.addEventListener("click", async () => {
    hideBanner();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });

  dismissBtn.addEventListener("click", () => {
    localStorage.setItem(DISMISS_KEY, "1");
    hideBanner();
  });

  window.addEventListener("appinstalled", () => {
    localStorage.setItem(DISMISS_KEY, "1");
    hideBanner();
  });

  function hideBanner() {
    banner.classList.remove("is-visible");
    setTimeout(() => { banner.hidden = true; }, 400);
  }
}
