/**
 * writer.js
 * -----------------------------------------------------------------------
 * The core "Open Griefcase" writing experience: mode switching between
 * typed text and a recorded voice note, rotating (never imposed) prompt
 * placeholders, optional mood tagging, and handing a finished entry off
 * to release-ritual.js for the fold-and-close moment.
 */

import { openOverlay, closeOverlay, confirmDialog, announce } from "./ui-utils.js";

let refs = {};
let content = null;
let rotateTimer = null;
let rotateIndex = 0;
let mode = "text"; // 'text' | 'voice'
let selectedMood = null;
let mediaRecorder = null;
let mediaChunks = [];
let mediaStream = null;
let recordedBlob = null;
let recordSeconds = 0;
let recordTimer = null;
const MAX_RECORD_SECONDS = 90;

let onLeaveCallback = null;

export function initWriter(cmsContent, { onLeave }) {
  content = cmsContent;
  onLeaveCallback = onLeave;

  refs = {
    overlay: document.getElementById("writer-overlay"),
    closeBtn: document.getElementById("writer-close"),
    modeWrite: document.getElementById("mode-write"),
    modeVoice: document.getElementById("mode-voice"),
    modeUnsure: document.getElementById("mode-unsure"),
    fieldText: document.getElementById("writer-field-text"),
    fieldVoice: document.getElementById("writer-field-voice"),
    textarea: document.getElementById("writer-textarea"),
    helpText: document.getElementById("writer-help-text"),
    moodChips: document.getElementById("writer-mood-chips"),
    leaveBtn: document.getElementById("btn-leave-it"),
    discardBtn: document.getElementById("btn-discard"),
    recordDot: document.getElementById("record-dot"),
    recordToggle: document.getElementById("record-toggle"),
    voiceStatus: document.getElementById("voice-status"),
    voicePlayback: document.getElementById("voice-playback"),
  };

  refs.closeBtn.addEventListener("click", handleClose);
  refs.discardBtn.addEventListener("click", handleClose);
  refs.modeWrite.addEventListener("click", () => setMode("text"));
  refs.modeVoice.addEventListener("click", () => setMode("voice"));
  refs.modeUnsure.addEventListener("click", handleUnsure);
  refs.textarea.addEventListener("input", handleTextInput);
  refs.leaveBtn.addEventListener("click", handleLeaveIt);
  refs.recordToggle.addEventListener("click", handleRecordToggle);

  refs.moodChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".mood-chip");
    if (!chip) return;
    const isSame = chip.dataset.mood === selectedMood;
    refs.moodChips.querySelectorAll(".mood-chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
    selectedMood = isSame ? null : chip.dataset.mood;
    if (!isSame) chip.setAttribute("aria-pressed", "true");
  });

  refs.overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") handleClose();
  });

  autosize(refs.textarea);
}

export function openWriter(prefillText) {
  resetWriter();
  if (prefillText) {
    refs.textarea.value = prefillText;
    autosize(refs.textarea);
    updateLeaveState();
  }
  openOverlay(refs.overlay, { focusEl: mode === "text" ? refs.textarea : refs.modeWrite });
  startPlaceholderRotation();
}

function resetWriter() {
  mode = "text";
  selectedMood = null;
  hadTextLastInput = false;
  refs.textarea.value = "";
  recordedBlob = null;
  refs.voicePlayback.hidden = true;
  refs.voicePlayback.innerHTML = "";
  refs.voiceStatus.textContent = "Tap to record a thought. It stays on this device.";
  refs.recordDot.classList.remove("is-recording");
  refs.recordToggle.textContent = "Start recording";
  refs.helpText.textContent = "";
  refs.moodChips.querySelectorAll(".mood-chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
  setMode("text");
  updateLeaveState();
  stopMediaStream();
}

function setMode(next) {
  const changed = next !== mode;
  mode = next;
  refs.modeWrite.setAttribute("aria-pressed", String(next === "text"));
  refs.modeVoice.setAttribute("aria-pressed", String(next === "voice"));
  refs.fieldText.classList.toggle("is-hidden", next !== "text");
  refs.fieldVoice.classList.toggle("is-active", next === "voice");
  if (next === "text") {
    stopRecordingIfActive();
    startPlaceholderRotation();
  } else {
    stopPlaceholderRotation();
  }
  if (changed) pageTurn(next === "text" ? refs.fieldText : refs.fieldVoice);
  updateLeaveState();
}

function pageTurn(el) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.classList.remove("page-turn-enter");
  void el.offsetWidth;
  el.classList.add("page-turn-enter");
  el.addEventListener("animationend", () => el.classList.remove("page-turn-enter"), { once: true });
}

function handleUnsure() {
  setMode("text");
  const lines = content.prompts.rotating;
  const line = lines[Math.floor(Math.random() * lines.length)];
  stopPlaceholderRotation();
  refs.textarea.placeholder = line;
  refs.helpText.textContent = "A starting point, if it helps — write over it, or just ignore it.";
  announce("A gentle starting prompt has been added.");
  refs.textarea.focus();
}

function startPlaceholderRotation() {
  stopPlaceholderRotation();
  const lines = content?.prompts?.rotating || [];
  if (!lines.length) return;
  rotateIndex = Math.floor(Math.random() * lines.length);
  applyPlaceholder(lines);
  rotateTimer = setInterval(() => {
    if (document.activeElement === refs.textarea || refs.textarea.value) return;
    rotateIndex = (rotateIndex + 1) % lines.length;
    applyPlaceholder(lines);
  }, 4500);
}

function applyPlaceholder(lines) {
  if (!refs.textarea.value) refs.textarea.placeholder = lines[rotateIndex];
}

function stopPlaceholderRotation() {
  clearInterval(rotateTimer);
  rotateTimer = null;
}

let hadTextLastInput = false;
function handleTextInput() {
  autosize(refs.textarea);
  updateLeaveState();
  const hasText = refs.textarea.value.length > 0;
  if (hasText && !hadTextLastInput && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    refs.textarea.classList.remove("is-settling");
    void refs.textarea.offsetWidth;
    refs.textarea.classList.add("is-settling");
  }
  hadTextLastInput = hasText;
}

function autosize(el) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, window.innerHeight * 0.6)}px`;
}

function updateLeaveState() {
  const hasText = mode === "text" && refs.textarea.value.trim().length > 0;
  const hasAudio = mode === "voice" && !!recordedBlob;
  refs.leaveBtn.disabled = !(hasText || hasAudio);
}

async function handleClose() {
  const hasContent = refs.textarea.value.trim().length > 0 || !!recordedBlob;
  if (hasContent) {
    const confirmed = await confirmDialog("Leave without saving this?", {
      confirmLabel: "Leave without saving",
      cancelLabel: "Keep writing",
    });
    if (!confirmed) return;
  }
  stopMediaStream();
  stopPlaceholderRotation();
  closeOverlay(refs.overlay);
}

async function handleLeaveIt() {
  let audioDataUrl = null;
  if (mode === "voice" && recordedBlob) {
    audioDataUrl = await blobToDataUrl(recordedBlob);
  }
  const entry = {
    text: mode === "text" ? refs.textarea.value.trim() : "",
    mood: selectedMood,
    audio: audioDataUrl,
  };
  stopMediaStream();
  stopPlaceholderRotation();
  closeOverlay(refs.overlay);
  if (onLeaveCallback) onLeaveCallback(entry);
}

/* ---- Voice recording ---- */

async function handleRecordToggle() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    stopRecordingIfActive();
    return;
  }
  if (recordedBlob) {
    // Re-record: clear previous take.
    recordedBlob = null;
    refs.voicePlayback.hidden = true;
    refs.voicePlayback.innerHTML = "";
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    refs.voiceStatus.textContent = "We couldn't access your microphone. You can write instead.";
    return;
  }

  mediaChunks = [];
  recordSeconds = 0;
  mediaRecorder = new MediaRecorder(mediaStream);
  mediaRecorder.addEventListener("dataavailable", (e) => {
    if (e.data.size > 0) mediaChunks.push(e.data);
  });
  mediaRecorder.addEventListener("stop", () => {
    recordedBlob = new Blob(mediaChunks, { type: mediaChunks[0]?.type || "audio/webm" });
    renderPlayback(recordedBlob);
    updateLeaveState();
  });

  mediaRecorder.start();
  refs.recordDot.classList.add("is-recording");
  refs.recordToggle.textContent = "Stop recording";
  refs.voiceStatus.textContent = "Recording… 0:00";

  recordTimer = setInterval(() => {
    recordSeconds += 1;
    refs.voiceStatus.textContent = `Recording… ${formatTime(recordSeconds)}`;
    if (recordSeconds >= MAX_RECORD_SECONDS) stopRecordingIfActive();
  }, 1000);
}

function stopRecordingIfActive() {
  clearInterval(recordTimer);
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
  refs.recordDot.classList.remove("is-recording");
  refs.recordToggle.textContent = recordedBlob ? "Record again" : "Start recording";
  if (!recordedBlob) refs.voiceStatus.textContent = "Tap to record a thought. It stays on this device.";
  stopMediaStream();
}

function stopMediaStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
}

function renderPlayback(blob) {
  const url = URL.createObjectURL(blob);
  refs.voiceStatus.textContent = "Got it. You can listen back, or leave it as is.";
  refs.voicePlayback.hidden = false;
  refs.voicePlayback.innerHTML = "";
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;
  refs.voicePlayback.appendChild(audio);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
