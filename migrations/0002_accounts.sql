-- ============================================================
-- Phase 1.5 — real, optional accounts.
--
-- This is deliberately small: an account exists only to (a) let someone
-- sign back in via a magic link and (b) hold one boolean — whether they
-- consent to a future AI presence reflecting on their musings and
-- suggesting support. It does NOT sync entries to the server. Entries
-- stay exactly where they've always been: only in the visitor's own
-- browser (see js/modules/state.js). See ARCHITECTURE.md.
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
  id                  TEXT PRIMARY KEY,      -- random UUID
  email               TEXT NOT NULL UNIQUE,
  ai_consent          INTEGER NOT NULL DEFAULT 0,  -- 0/1, off by default
  consent_updated_at  TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

-- Single-use, short-lived magic-link tokens. We store a SHA-256 hash of
-- the token, never the raw value — so a leaked database row alone can't
-- be used to sign in as someone. The raw token only ever exists in the
-- email we send and the URL the visitor clicks.
CREATE TABLE IF NOT EXISTS auth_tokens (
  token_hash        TEXT PRIMARY KEY,
  email             TEXT NOT NULL,
  pending_consent   INTEGER NOT NULL DEFAULT 0,  -- consent choice made before verifying, applied on first signup only
  expires_at        TEXT NOT NULL,
  used_at           TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_email ON auth_tokens(email);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);

-- Session tokens, same hashing approach as auth_tokens. Delivered to the
-- browser as an HttpOnly cookie, so page JS never touches the raw value.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash    TEXT PRIMARY KEY,
  account_id    TEXT NOT NULL REFERENCES accounts(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
