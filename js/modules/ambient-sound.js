/**
 * ambient-sound.js
 * -----------------------------------------------------------------------
 * A soft, generative ambient soundscape and a single soft chime cue for
 * the release ritual — synthesized entirely with the Web Audio API rather
 * than an imported audio file. That's a deliberate choice, not a
 * shortcut: it means zero licensing risk ("open source / license-free"
 * is trivially true for code you wrote), zero added download weight for
 * a PWA that should work offline, and a loop with no seams.
 *
 * Sound is strictly opt-in. It never starts on its own — autoplay would
 * both be blocked by the browser and, more importantly, be the wrong
 * thing to do to someone arriving at a grief-support page mid-emotion.
 * The one exception: if someone explicitly turned sound on in a past
 * visit, we honor that on the next visit — but only from their first
 * tap/click/keypress on the new page, never automatically.
 */

const PREF_KEY = "griefcase:sound";
let ctx = null;
let masterGain = null;
let padNodes = null;
let isPlaying = false;
let starting = false;

let refs = {};

export function initAmbientSound() {
  refs = {
    toggle: document.getElementById("sound-toggle"),
    iconOn: document.querySelector("#sound-toggle .sound-icon-on"),
    iconOff: document.querySelector("#sound-toggle .sound-icon-off"),
  };
  if (!refs.toggle) return;

  refs.toggle.addEventListener("click", () => {
    isPlaying ? stop() : start();
  });

  const preferred = localStorage.getItem(PREF_KEY);
  if (preferred === "on") {
    setToggleVisual(true);
    const resume = () => {
      document.removeEventListener("pointerdown", resume);
      document.removeEventListener("keydown", resume);
      start();
    };
    document.addEventListener("pointerdown", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
  }
}

export function isSoundEnabled() {
  return isPlaying;
}

function setToggleVisual(on) {
  if (!refs.toggle) return;
  refs.toggle.setAttribute("aria-pressed", String(on));
  refs.toggle.setAttribute("aria-label", on ? "Turn off ambient sound" : "Play soft ambient sound");
  if (refs.iconOn) refs.iconOn.hidden = !on;
  if (refs.iconOff) refs.iconOff.hidden = on;
}

function ensureContext() {
  if (ctx) return ctx;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  ctx = new AudioContextClass();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);
  return ctx;
}

function buildReverb(context) {
  // A short, soft synthetic impulse response — an exponentially decaying
  // noise tail — stands in for a convolution reverb "room" without
  // needing an external sample.
  const duration = 3.2;
  const rate = context.sampleRate;
  const length = Math.floor(rate * duration);
  const impulse = context.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.2);
    }
  }
  const convolver = context.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

function buildPad(context) {
  const dry = context.createGain();
  dry.gain.value = 0.7;
  const wet = context.createGain();
  wet.gain.value = 0.35;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.4;

  const filterLfo = context.createOscillator();
  filterLfo.frequency.value = 0.045;
  const filterLfoGain = context.createGain();
  filterLfoGain.gain.value = 260;
  filterLfo.connect(filterLfoGain);
  filterLfoGain.connect(filter.frequency);
  filterLfo.start();

  // A soft, slightly detuned cluster around a low root — deliberately
  // unresolved (no clear melody) so it reads as atmosphere, not music
  // that demands attention.
  const freqs = [98, 110, 146.83, 164.81];
  const oscillators = freqs.map((freq, i) => {
    const osc = context.createOscillator();
    osc.type = i % 2 === 0 ? "sine" : "triangle";
    osc.frequency.value = freq;
    osc.detune.value = (i - 1.5) * 4;

    const voiceGain = context.createGain();
    voiceGain.gain.value = 0.22;

    const tremolo = context.createOscillator();
    tremolo.frequency.value = 0.06 + i * 0.015;
    const tremoloGain = context.createGain();
    tremoloGain.gain.value = 0.08;
    tremolo.connect(tremoloGain);
    tremoloGain.connect(voiceGain.gain);
    tremolo.start();

    osc.connect(voiceGain);
    voiceGain.connect(filter);
    osc.start();
    return { osc, tremolo, voiceGain };
  });

  const reverb = buildReverb(context);
  filter.connect(dry);
  filter.connect(reverb);
  reverb.connect(wet);
  dry.connect(masterGain);
  wet.connect(masterGain);

  return { oscillators, filter, filterLfo, filterLfoGain, dry, wet, reverb };
}

function start() {
  if (starting || isPlaying) return;
  const context = ensureContext();
  if (!context) return;
  starting = true;

  context.resume().then(() => {
    if (!padNodes) padNodes = buildPad(context);
    const now = context.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0.55, now + 2.2);
    isPlaying = true;
    starting = false;
    setToggleVisual(true);
    localStorage.setItem(PREF_KEY, "on");
  });
}

function stop() {
  if (!ctx || !isPlaying) {
    setToggleVisual(false);
    localStorage.setItem(PREF_KEY, "off");
    return;
  }
  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(0, now + 1.4);
  isPlaying = false;
  setToggleVisual(false);
  localStorage.setItem(PREF_KEY, "off");
}

/** A short, soft two-note chime — played once as the case closes in the
 *  release ritual. No-ops silently if sound is off or audio isn't
 *  available, so callers never need to check first. */
export function playChime() {
  if (!isPlaying || !ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25]; // a gentle, consonant fifth-ish pair (C5, E5)

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const start = now + i * 0.16;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.16, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.2);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + 2.3);
  });
}
