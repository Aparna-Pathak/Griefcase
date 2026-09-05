/**
 * main.js
 * -----------------------------------------------------------------------
 * Entry point. Loads CMS content, renders every content-driven section,
 * and wires up the interactive modules. Kept intentionally thin — all
 * real logic lives in js/modules/*.
 */

import {
  loadContent,
  renderNav,
  renderHero,
  renderHowItWorks,
  renderWhy,
  renderVision,
  renderGlossary,
  renderFoundingCircle,
  renderPrompts,
  renderPrivacy,
  renderFaq,
  renderAbout,
  renderFooter,
  renderMoodChips,
  renderLibraryFilters,
  renderLibraryStrings,
} from "./modules/content-loader.js";

import { initNavigation } from "./modules/navigation.js";
import { initReveal } from "./modules/reveal.js";
import { initHeroParticles } from "./modules/hero-particles.js";
import { initFaq } from "./modules/faq.js";
import { initWriter, openWriter } from "./modules/writer.js";
import { initReleaseRitual, startRelease } from "./modules/release-ritual.js";
import { initLibrary, openLibrary } from "./modules/library.js";
import { showToast, closeOverlay } from "./modules/ui-utils.js";
import { initInteractions } from "./modules/interactions.js";
import { initAmbientSound } from "./modules/ambient-sound.js";
import { initPWA } from "./modules/pwa.js";
import { initInterestForm } from "./modules/interest-form.js";
import { initAboutShowcase } from "./modules/about-showcase.js";
import { initCounters } from "./modules/counters.js";
import { initAuth } from "./modules/auth.js";

/** Minimal fallback so the app still functions if content.json can't be
 *  fetched (e.g. opened directly via file:// in a browser that blocks
 *  local fetch). The static HTML already carries hero/section copy as a
 *  first-paint fallback; this covers only what JS must generate. */
const FALLBACK_CONTENT = {
  site: {
    nav: [
      { label: "Griefcase", target: "#hero" },
      { label: "Write", target: "open-writer" },
      { label: "My Griefcase", target: "open-library" },
      { label: "Why Griefcase", target: "#why" },
      { label: "About", target: "#about" },
    ],
  },
  hero: { eyebrow: "A quiet place for what you're carrying", headline: "Some things are easier to leave here.", subcopy: "Your musings don't need to make sense. They just need somewhere to go.", ctaPrimary: "Open Griefcase", ctaSecondary: "See how it works" },
  howItWorks: { eyebrow: "How it works", headline: "There's no right way to use this.", intro: "But if it helps, here's roughly how it goes.", steps: [] },
  why: { eyebrow: "Why Griefcase exists", headline: "You don't have to carry everything.", paragraphs: [], quote: { text: "You are allowed to feel this.", attribution: "— Griefcase" } },
  vision: { eyebrow: "Where this is headed", headline: "Presence first. Solutions only if you want them.", intro: "", paragraphs: [], layers: [], note: "", stats: [], statsCaveat: "" },
  glossary: { eyebrow: "Worth knowing", headline: "Therapist, counselor, psychologist, psychiatrist — what's the difference?", intro: "", terms: [], note: "" },
  foundingCircle: { eyebrow: "Be part of what's next", headline: "Join the founding circle.", intro: "", formNote: "", emailLabel: "Email", griefTypeLabel: "Grief type (optional)", peerCheckboxLabel: "I'd be interested in training to become a peer listener", motivationLabel: "Motivation (optional)", availabilityLabel: "Availability (optional)", messageLabel: "Anything else? (optional)", submitLabel: "Join the founding circle", submittingLabel: "Sending…", successBody: "You're on the list.", errorGeneric: "Something went wrong. Please try again.", errorEmail: "Please enter a valid email address." },
  prompts: { eyebrow: "If it helps", headline: "Emotional prompts", intro: "", rotating: ["Say the thing you couldn't say.", "Write the message you won't send.", "Just let it out."], cards: [] },
  categories: [
    { id: "all", label: "Everything" }, { id: "heavy", label: "Heavy" }, { id: "angry", label: "Angry" },
    { id: "sad", label: "Sad" }, { id: "confused", label: "Confused" }, { id: "hopeful", label: "Hopeful" }, { id: "unspoken", label: "Unspoken" },
  ],
  library: { eyebrow: "My Griefcase", headline: "What I've left here.", intro: "", emptyTitle: "Nothing here yet.", emptyBody: "Whatever you leave will stay here.", emptyCta: "Open Griefcase" },
  privacy: { eyebrow: "Privacy & safety", headline: "Your musings belong to you.", points: [], disclaimer: "Griefcase isn't therapy, medical care, or crisis support.", safety: { label: "If you're in immediate danger", body: "Please contact your local emergency number or a crisis line where you live.", linkText: "Find support in your country", linkUrl: "https://findahelpline.com" } },
  about: { eyebrow: "About", headline: "A room, not a solution.", paragraphs: [] },
  faq: [],
  footer: { tagline: "Leave it here. Feel a little lighter.", columns: [], safetyNote: "In immediate danger? Contact your local emergency number.", copyright: "Griefcase." },
};

async function bootstrap() {
  let content;
  try {
    content = await loadContent();
  } catch (err) {
    console.warn("Griefcase: using fallback content —", err.message);
    content = FALLBACK_CONTENT;
  }

  renderNav(content.site);
  renderHero(content.hero);
  renderHowItWorks(content.howItWorks);
  renderWhy(content.why);
  renderVision(content.vision);
  renderGlossary(content.glossary);
  renderFoundingCircle(content.foundingCircle);
  renderPrompts(content.prompts);
  renderPrivacy(content.privacy);
  renderFaq(content.faq);
  renderAbout(content.about);
  renderFooter(content.footer);
  renderMoodChips(content.categories);
  renderLibraryFilters(content.categories);
  renderLibraryStrings(content.library);

  initNavigation();
  initReveal();
  initHeroParticles();
  initFaq();

  initWriter(content, {
    onLeave: async (entry) => {
      await startRelease(entry);
    },
  });

  initReleaseRitual({
    onWriteAnother: () => openWriter(),
    onClose: () => {},
  });

  initLibrary(content);
  initInteractions();
  initAmbientSound();
  initPWA();
  initInterestForm(content);
  initAboutShowcase();
  initCounters();
  initAuth();

  wireGlobalActions();
  handleLaunchShortcut();
}

/** PWA app shortcuts (manifest.webmanifest) deep-link via a query param —
 *  jump straight to the writer or library the instant the app opens. */
function handleLaunchShortcut() {
  const params = new URLSearchParams(window.location.search);
  const action = params.get("action");
  if (action === "write") openWriter();
  if (action === "library") openLibrary();
}

function wireGlobalActions() {
  document.addEventListener("click", (e) => {
    const writerTrigger = e.target.closest("[data-open-writer]");
    if (writerTrigger) {
      e.preventDefault();
      openWriter(writerTrigger.dataset.prefill || undefined);
      return;
    }

    const actionTrigger = e.target.closest("[data-action]");
    if (actionTrigger) {
      e.preventDefault();
      const action = actionTrigger.dataset.action;
      if (action === "open-writer") openWriter();
      if (action === "open-library") openLibrary();
      return;
    }

    if (e.target.closest("#btn-open-writer")) return; // handled by data-open-writer above
  });

  const libraryNavLink = () => {}; // nav "My Griefcase" handled generically via data-action
}

document.addEventListener("DOMContentLoaded", bootstrap);
