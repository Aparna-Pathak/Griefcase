/**
 * state.js
 * -----------------------------------------------------------------------
 * Thin persistence layer for entries left in the Griefcase.
 *
 * This prototype stores entries in localStorage only — nothing is sent to
 * a server, which is what makes "private by design" true today. To move
 * to a real backend later, keep this module's function signatures
 * (getEntries/saveEntry/deleteEntry) identical and swap the internals for
 * fetch() calls to your API; nothing in writer.js or library.js needs to
 * change.
 */

const STORAGE_KEY = "griefcase:entries";

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Griefcase: could not read stored entries", err);
    return [];
  }
}

function write(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (err) {
    console.warn("Griefcase: could not save entry", err);
    return false;
  }
}

export function getEntries() {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function saveEntry({ text, mood, audio }) {
  const entries = read();
  const entry = {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: text || "",
    mood: mood || null,
    audio: audio || null, // base64 data URL, small voice notes only
    createdAt: Date.now(),
  };
  entries.push(entry);
  const ok = write(entries);
  return ok ? entry : null;
}

export function deleteEntry(id) {
  const entries = read().filter((e) => e.id !== id);
  return write(entries);
}

export function isStorageAvailable() {
  try {
    const testKey = "griefcase:test";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
