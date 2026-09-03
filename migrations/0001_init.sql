-- ============================================================
-- Phase 1 — LIVE. Backs the "founding circle" interest capture
-- on the site right now. No matching or messaging happens here.
-- ============================================================
CREATE TABLE IF NOT EXISTS interest_signups (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL,
  grief_type        TEXT,                -- free text, e.g. "loss of a parent", "breakup"
  wants_to_be_peer  INTEGER NOT NULL DEFAULT 0,  -- 0/1: interested in training as a peer listener
  motivation        TEXT,                -- why they want to be a peer listener (only if wants_to_be_peer)
  availability      TEXT,                -- optional free text
  message           TEXT,                -- optional general note
  source            TEXT DEFAULT 'site',
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_interest_signups_email ON interest_signups(email);
CREATE INDEX IF NOT EXISTS idx_interest_signups_peer ON interest_signups(wants_to_be_peer);

-- ============================================================
-- Phase 2 — SCHEMA ONLY. Not wired to any API route yet. This
-- is the architecture for peer matching + moderated messaging,
-- laid down now so Phase 2 has a real foundation, but nothing
-- here is reachable by users until safety/moderation ships
-- alongside it (see ARCHITECTURE.md).
-- ============================================================

-- A pseudonymous profile, never tied to a public display name.
-- Created only once someone is accepted through matching consent,
-- not at signup time.
CREATE TABLE IF NOT EXISTS grief_profiles (
  id                TEXT PRIMARY KEY,     -- random UUID, not sequential
  email_hash        TEXT NOT NULL,        -- salted hash, never plaintext email
  grief_type        TEXT NOT NULL,
  is_peer_listener  INTEGER NOT NULL DEFAULT 0,
  peer_status       TEXT DEFAULT 'none',  -- none | pending | trained | suspended
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS matches (
  id                TEXT PRIMARY KEY,     -- random UUID
  profile_a_id      TEXT NOT NULL REFERENCES grief_profiles(id),
  profile_b_id      TEXT NOT NULL REFERENCES grief_profiles(id),
  grief_type        TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | active | ended | terminated_for_safety
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at          TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id                TEXT PRIMARY KEY,
  match_id          TEXT NOT NULL REFERENCES matches(id),
  sender_profile_id TEXT NOT NULL REFERENCES grief_profiles(id),
  body              TEXT NOT NULL,
  distress_score    REAL,                 -- set by an automated screen, nullable
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id                TEXT PRIMARY KEY,
  match_id          TEXT REFERENCES matches(id),
  message_id        TEXT REFERENCES messages(id),
  reporter_profile_id TEXT NOT NULL REFERENCES grief_profiles(id),
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open', -- open | reviewed | actioned | dismissed
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS distress_flags (
  id                TEXT PRIMARY KEY,
  match_id          TEXT NOT NULL REFERENCES matches(id),
  message_id        TEXT REFERENCES messages(id),
  flagged_by        TEXT NOT NULL DEFAULT 'automated', -- automated | peer | self
  severity          TEXT NOT NULL,        -- watch | elevated | crisis
  escalation_status TEXT NOT NULL DEFAULT 'unreviewed', -- unreviewed | human_reviewed | resources_sent | escalated
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
