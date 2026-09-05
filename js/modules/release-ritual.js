/**
 * release-ritual.js
 * -----------------------------------------------------------------------
 * The signature Griefcase interaction: a finished musing folds into a
 * paper shape, settles into the case, the case closes, and the entry is
 * only written to storage at that moment — the visual metaphor and the
 * actual "save" happen together. This is the one moment on the site
 * that is choreographed rather than purely reactive, so it's kept in its
 * own module.
 *
 * Respects prefers-reduced-motion by collapsing the staged fold/case
 * animation into a much shorter timeline rather than skipping the ritual
 * outright — the emotional beats (saved / safe / breathe) still happen,
 * just without the extended motion.
 */

import { saveEntry } from "./state.js";
import { announce } from "./ui-utils.js";
import { playChime } from "./ambient-sound.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TIMING = reducedMotion
  ? { fold1: 20, fold2: 20, fold3: 20, caseIn: 40, lidOpen: 40, lidClose: 120, line1: 200, line2: 1400, actions: 700 }
  : { fold1: 200, fold2: 320, fold3: 420, caseIn: 260, lidOpen: 320, lidClose: 900, line1: 500, line2: 2200, actions: 900 };

let refs = {};
let onWriteAnother = null;
let onCloseAll = null;
let busy = false;

export function initReleaseRitual({ onWriteAnother: writeAnother, onClose }) {
  onWriteAnother = writeAnother;
  onCloseAll = onClose;

  refs = {
    stage: document.getElementById("release-stage"),
    paper: document.getElementById("release-paper"),
    caseWrap: document.getElementById("release-case"),
    lid: document.getElementById("case-lid"),
    message: document.getElementById("release-message"),
    line1: document.getElementById("release-line-1"),
    line2: document.getElementById("release-line-2"),
    breathing: document.getElementById("breathing-circle"),
    actions: document.getElementById("release-actions"),
    writeAnotherBtn: document.getElementById("btn-write-another"),
    closeBtn: document.getElementById("btn-close-griefcase"),
  };

  refs.writeAnotherBtn.addEventListener("click", () => {
    teardown();
    if (onWriteAnother) onWriteAnother();
  });
  refs.closeBtn.addEventListener("click", () => {
    teardown();
    if (onCloseAll) onCloseAll();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startRelease(entry) {
  if (busy) return;
  busy = true;

  resetStage(entry);
  document.body.classList.add("no-scroll");
  refs.stage.hidden = false;
  void refs.stage.offsetWidth;
  refs.stage.classList.add("is-open");
  refs.stage.setAttribute("tabindex", "-1");
  refs.stage.focus({ preventScroll: true });
  announce("Folding your musing into the Griefcase.");

  await wait(120);
  refs.paper.classList.add("fold-1");
  await wait(TIMING.fold1);
  refs.paper.classList.add("fold-2");
  await wait(TIMING.fold2);
  refs.paper.classList.add("fold-3");

  await wait(TIMING.fold3);
  refs.caseWrap.classList.add("is-visible");

  await wait(TIMING.caseIn);
  refs.lid.style.transform = "rotate(-24deg)";

  await wait(TIMING.lidOpen);
  await wait(TIMING.lidClose * 0.4);
  refs.lid.style.transform = "rotate(0deg)";

  await wait(TIMING.lidClose);

  // The entry is written to storage right as the case closes.
  const saved = saveEntry({ text: entry.text, mood: entry.mood, audio: entry.audio });
  playChime();

  await wait(TIMING.line1);
  refs.line1.classList.add("is-visible");
  announce("It's here now. You don't have to carry it alone.");

  await wait(TIMING.line2);
  refs.line1.hidden = true;
  refs.line2.hidden = false;
  requestAnimationFrame(() => refs.line2.classList.add("is-visible"));
  refs.breathing.classList.add("is-visible");
  announce("It's safe here. Take a breath.");

  await wait(TIMING.actions);
  refs.actions.classList.add("is-visible");

  busy = false;
  return saved;
}

function resetStage(entry) {
  refs.paper.className = "release-paper";
  refs.paper.textContent = (entry.text || "A recorded musing").slice(0, 260);
  refs.caseWrap.classList.remove("is-visible");
  refs.lid.style.transform = "rotate(0deg)";
  refs.line1.hidden = false;
  refs.line1.classList.remove("is-visible");
  refs.line2.hidden = true;
  refs.line2.classList.remove("is-visible");
  refs.breathing.classList.remove("is-visible");
  refs.actions.classList.remove("is-visible");
}

function teardown() {
  refs.stage.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => { refs.stage.hidden = true; }, 500);
}
