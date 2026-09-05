/**
 * Griefcase Worker — API layer
 * -----------------------------------------------------------------------
 * Scope, deliberately: this only serves /api/* (see wrangler.toml's
 * run_worker_first). Every other request — the site itself — is served
 * straight from Cloudflare's asset store and never touches this file.
 *
 * What's live:
 *   - POST /api/interest          — the "founding circle" signup form.
 *   - POST /api/auth/request-link — optional account sign-up/sign-in via
 *                                   a one-time emailed link.
 *   - GET  /api/auth/verify       — the link the visitor clicks.
 *   - GET  /api/auth/me           — "am I signed in, and what's my
 *                                   AI-consent preference".
 *   - POST /api/auth/logout
 *   - POST /api/consent           — update the AI-consent preference.
 *
 * What an account is NOT: it does not sync musings to a server. Entries
 * stay exactly where they've always lived — only in the visitor's own
 * browser (js/modules/state.js is untouched). An account exists only so
 * someone can sign back in, and so there's a real place to hold one
 * boolean: whether they'd consent to a future AI presence reflecting on
 * their musings and suggesting support. That AI presence isn't built yet
 * (see ARCHITECTURE.md) — this just gives consent a real, honest home
 * ahead of it, instead of bolting it on later without asking first.
 *
 * There is still no matching, no messaging, no peer accounts here — see
 * ARCHITECTURE.md for why that's sequenced separately.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = {
  email: 254,
  grief_type: 80,
  motivation: 1200,
  availability: 200,
  message: 1200,
};

const SESSION_COOKIE = "gc_session";
const SESSION_DAYS = 30;
const TOKEN_TTL_MINUTES = 15;
const MAX_LINK_REQUESTS_PER_HOUR = 5;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

function clip(value, max) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/* ---------------------------------------------------------------------
 * Token + cookie helpers
 * ------------------------------------------------------------------- */

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function sessionCookieHeader(rawToken, maxAgeSeconds) {
  return `${SESSION_COOKIE}=${rawToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

async function getAccountFromSession(request, env) {
  const cookies = parseCookies(request);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return null;

  const hash = await sha256Hex(raw);
  const row = await env.DB.prepare(
    `SELECT s.expires_at as session_expires_at, a.id, a.email, a.ai_consent
       FROM sessions s JOIN accounts a ON a.id = s.account_id
      WHERE s.token_hash = ?`
  )
    .bind(hash)
    .first();

  if (!row) return null;
  if (new Date(row.session_expires_at).getTime() < Date.now()) return null;

  return { id: row.id, email: row.email, aiConsent: !!row.ai_consent };
}

/* ---------------------------------------------------------------------
 * Email delivery — Resend, only if RESEND_API_KEY is configured as a
 * Worker secret. If it isn't, sign-in requests fail loudly and honestly
 * (never a silent "check your email" that never arrives).
 * ------------------------------------------------------------------- */

async function sendMagicLinkEmail(env, email, magicUrl) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, reason: "not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.MAIL_FROM || "Griefcase <onboarding@resend.dev>",
        to: [email],
        subject: "Your Griefcase sign-in link",
        html: `<p>Tap below to sign in to Griefcase. This link works once and expires in ${TOKEN_TTL_MINUTES} minutes.</p><p><a href="${magicUrl}">Sign in to Griefcase</a></p><p style="color:#8a8178;font-size:13px">If you didn't request this, you can safely ignore this email — nothing happens unless the link is opened.</p>`,
        text: `Sign in to Griefcase: ${magicUrl}\n\nThis link works once and expires in ${TOKEN_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.`,
      }),
    });
    if (!res.ok) {
      console.error("Resend send failed", res.status, await res.text().catch(() => ""));
      return { ok: false, reason: "send_failed" };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend send error", err);
    return { ok: false, reason: "send_failed" };
  }
}

/* ---------------------------------------------------------------------
 * /api/interest — unchanged from Phase 1
 * ------------------------------------------------------------------- */

async function handleInterest(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json({ ok: true });
  }

  const email = clip(body.email, MAX_LEN.email);
  if (!email || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }

  const griefType = clip(body.griefType, MAX_LEN.grief_type);
  const wantsToBePeer = body.wantsToBePeer === true ? 1 : 0;
  const motivation = wantsToBePeer ? clip(body.motivation, MAX_LEN.motivation) : null;
  const availability = wantsToBePeer ? clip(body.availability, MAX_LEN.availability) : null;
  const message = clip(body.message, MAX_LEN.message);

  try {
    await env.DB.prepare(
      `INSERT INTO interest_signups
        (email, grief_type, wants_to_be_peer, motivation, availability, message)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(email, griefType, wantsToBePeer, motivation, availability, message)
      .run();
  } catch (err) {
    return json({ ok: false, error: "Something went wrong on our end. Please try again shortly." }, 500);
  }

  return json({ ok: true });
}

/* ---------------------------------------------------------------------
 * Accounts: request-link / verify / me / logout / consent
 * ------------------------------------------------------------------- */

async function handleRequestLink(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  // Honeypot, same pattern as /api/interest.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json({ ok: true });
  }

  const email = clip(body.email, MAX_LEN.email);
  if (!email || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "Please enter a valid email address." }, 400);
  }
  const pendingConsent = body.consent === true ? 1 : 0;

  let recent;
  try {
    recent = await env.DB.prepare(
      `SELECT COUNT(*) as c FROM auth_tokens WHERE email = ? AND created_at > datetime('now', '-1 hour')`
    )
      .bind(email)
      .first();
  } catch {
    recent = null;
  }
  if (recent && recent.c >= MAX_LINK_REQUESTS_PER_HOUR) {
    return json({ ok: false, error: "Too many sign-in attempts for this email. Please try again in a bit." }, 429);
  }

  const rawToken = randomToken();
  const tokenHash = await sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO auth_tokens (token_hash, email, pending_consent, expires_at) VALUES (?, ?, ?, ?)`
    )
      .bind(tokenHash, email, pendingConsent, expiresAt)
      .run();
  } catch (err) {
    return json({ ok: false, error: "Something went wrong on our end. Please try again shortly." }, 500);
  }

  const url = new URL(request.url);
  const magicUrl = `${url.origin}/api/auth/verify?token=${rawToken}`;
  const sent = await sendMagicLinkEmail(env, email, magicUrl);

  if (!sent.ok) {
    return json(
      {
        ok: false,
        error:
          sent.reason === "not_configured"
            ? "Sign-in emails aren't switched on yet — ask the site owner to finish setup."
            : "We couldn't send that email just now. Please try again shortly.",
      },
      502
    );
  }

  return json({ ok: true });
}

function redirectTo(origin, params) {
  const dest = new URL("/", origin);
  Object.entries(params).forEach(([k, v]) => dest.searchParams.set(k, v));
  dest.hash = "privacy";
  return new Response(null, { status: 302, headers: { Location: dest.toString() } });
}

async function handleVerify(request, env) {
  const url = new URL(request.url);
  const rawToken = url.searchParams.get("token") || "";
  if (!rawToken) return redirectTo(url.origin, { authError: "missing" });

  const tokenHash = await sha256Hex(rawToken);
  const row = await env.DB.prepare(
    `SELECT email, pending_consent, expires_at, used_at FROM auth_tokens WHERE token_hash = ?`
  )
    .bind(tokenHash)
    .first();

  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    return redirectTo(url.origin, { authError: "expired" });
  }

  await env.DB.prepare(`UPDATE auth_tokens SET used_at = datetime('now') WHERE token_hash = ?`).bind(tokenHash).run();

  let account = await env.DB.prepare(`SELECT id, ai_consent FROM accounts WHERE email = ?`).bind(row.email).first();
  if (!account) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO accounts (id, email, ai_consent, consent_updated_at, last_login_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(id, row.email, row.pending_consent ? 1 : 0)
      .run();
    account = { id, ai_consent: row.pending_consent };
  } else {
    await env.DB.prepare(`UPDATE accounts SET last_login_at = datetime('now') WHERE id = ?`).bind(account.id).run();
  }

  const rawSession = randomToken();
  const sessionHash = await sha256Hex(rawSession);
  const sessionExpiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(`INSERT INTO sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)`)
    .bind(sessionHash, account.id, sessionExpiresAt)
    .run();

  const dest = new URL("/", url.origin);
  dest.searchParams.set("welcome", "1");
  dest.hash = "privacy";

  return new Response(null, {
    status: 302,
    headers: {
      Location: dest.toString(),
      "Set-Cookie": sessionCookieHeader(rawSession, SESSION_DAYS * 24 * 60 * 60),
    },
  });
}

async function handleMe(request, env) {
  const account = await getAccountFromSession(request, env);
  if (!account) return json({ signedIn: false });
  return json({ signedIn: true, email: account.email, aiConsent: account.aiConsent });
}

async function handleLogout(request, env) {
  const cookies = parseCookies(request);
  const raw = cookies[SESSION_COOKIE];
  if (raw) {
    const hash = await sha256Hex(raw);
    await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(hash).run();
  }
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookieHeader() });
}

async function handleConsent(request, env) {
  const account = await getAccountFromSession(request, env);
  if (!account) return json({ ok: false, error: "Sign in first." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }
  const consent = body.consent === true ? 1 : 0;

  await env.DB.prepare(`UPDATE accounts SET ai_consent = ?, consent_updated_at = datetime('now') WHERE id = ?`)
    .bind(consent, account.id)
    .run();

  return json({ ok: true, aiConsent: !!consent });
}

/* ---------------------------------------------------------------------
 * Router
 * ------------------------------------------------------------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/interest") {
      if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
      return handleInterest(request, env);
    }

    if (url.pathname === "/api/auth/request-link") {
      if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
      return handleRequestLink(request, env);
    }

    if (url.pathname === "/api/auth/verify") {
      if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);
      return handleVerify(request, env);
    }

    if (url.pathname === "/api/auth/me") {
      if (request.method !== "GET") return json({ ok: false, error: "Method not allowed." }, 405);
      return handleMe(request, env);
    }

    if (url.pathname === "/api/auth/logout") {
      if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
      return handleLogout(request, env);
    }

    if (url.pathname === "/api/consent") {
      if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
      return handleConsent(request, env);
    }

    return json({ ok: false, error: "Not found." }, 404);
  },
};
