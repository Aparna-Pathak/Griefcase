/**
 * Griefcase Worker — API layer
 * -----------------------------------------------------------------------
 * Scope, deliberately: this only serves /api/* (see wrangler.toml's
 * run_worker_first). Every other request — the site itself — is served
 * straight from Cloudflare's asset store and never touches this file.
 *
 * What's live: POST /api/interest — the "founding circle" signup form.
 * That's it. There is no matching, no messaging, no accounts here yet.
 * Building live peer-to-peer chat between grieving strangers without
 * safety moderation and escalation infrastructure alongside it would be
 * genuinely unsafe to ship — see ARCHITECTURE.md for the Phase 2 plan
 * and why it's sequenced this way.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = {
  email: 254,
  grief_type: 80,
  motivation: 1200,
  availability: 200,
  message: 1200,
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function clip(value, max) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

async function handleInterest(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  // Honeypot: a real visitor never fills this hidden field. Silently accept
  // (so a bot can't tell it was rejected) but don't write anything.
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/interest") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed." }, 405);
      }
      return handleInterest(request, env);
    }

    return json({ ok: false, error: "Not found." }, 404);
  },
};
