# Griefcase — architecture & roadmap

This document exists because Griefcase is mid-transformation: it started as a solo,
private writing tool, and is moving toward the peer-support product described in
["Grief in the digital age — Exploring peer-based emotional support"](.) (Amit
Chansikar, MBA research paper, SSODL, 2025). That thesis is the source of truth for
*why* this product should include peer support. This document is the source of truth
for *how* — what's actually built, what's designed but not built, and why it's
sequenced this way.

## Phase 1 — live today

**Private writing (unchanged).** Entries never leave the visitor's browser. No
account, no server round-trip, nothing for Griefcase (the company) to ever see. This
is the trust foundation everything else is built on top of, not replaced by.

**Founding circle interest capture (new).** A real, working form (`#founding-circle`
on the site) that is the *only* thing on Griefcase that intentionally leaves the
visitor's browser. It posts to `POST /api/interest`, served by `worker/index.js`,
and writes to the `interest_signups` table in a Cloudflare D1 database
(`griefcase-db`). It captures: email, optional grief type, whether someone wants to
train as a peer listener, and (if so) their motivation and availability.

This exists to satisfy the thesis's own suggestion #5 — *"start small, build
trust... a Minimum Viable Product can be built around just one type of grief"* —
before committing engineering effort to matching and messaging. It turns "we believe
people want this" into "here are N real people who said so, and M who volunteered to
be trained."

**Mental-health literacy glossary (new).** Plain-language counselor vs. therapist vs.
psychologist vs. psychiatrist definitions, addressing the awareness gap the thesis's
literature review documents (Live Love Laugh Foundation, 2021: 47% of respondents
associated therapy with "something for weak people"). Static content, no backend.

**Research-grounded roadmap section (updated).** The existing "Where this is headed"
section now cites the thesis's actual survey findings and its secondary sources
(National Mental Health Survey 2015–16; WHO Mental Health Atlas 2022) instead of
making unsupported claims about demand.

## Phase 2 — designed, not built (this is the important part)

The thesis's central proposal — matching a grieving person with another person who
has been through something similar, for anonymous 1:1 conversation — is a
fundamentally different product core than anything live today. It is **not**
something to ship without the infrastructure below existing *first*, because the
alternative is putting emotionally vulnerable people in unmoderated contact with
strangers. That is a real harm mode (harassment, exploitation, someone in crisis with
no one watching), not a hypothetical one, and it's why this phase is scoped
separately rather than bolted on.

The database schema for this phase already exists (`migrations/0001_init.sql`):
`grief_profiles`, `matches`, `messages`, `reports`, `distress_flags`. Nothing queries
them yet. Building this out for real means, in rough sequence:

1. **Pseudonymous identity**, not full accounts. A `grief_profile` is created only
   once someone is accepted into matching — never at signup — and is keyed to a
   *hashed* email, never a plaintext one or a public display name. No one should be
   discoverable or linkable to their entries.

2. **Safety infrastructure, before matching, not after.** Reporting and blocking on
   every message; a lightweight automated distress screen (keyword/heuristic, not a
   diagnostic claim) that raises `distress_flags` for human review; a documented
   escalation path to crisis resources (the site already surfaces findahelpline.com
   for this) that fires *before* someone types resources tea by hand mid-conversation.

3. **Peer listener vetting**, not open matching. Applicants from the founding-circle
   form move into a `pending` → `trained` pipeline with actual guidelines (thesis
   suggestion #2), not just a checkbox. Nobody gets matched as a "peer" without going
   through it.

4. **Matching**, scoped to one grief type first (thesis suggestion #5 again) — most
   plausibly loss-of-a-parent or breakup recovery, based on which segment the
   founding-circle signups actually cluster around once there's real data.

5. **Messaging**, likely via [Durable Objects](https://developers.cloudflare.com/durable-objects/)
   for per-match realtime state — a natural fit alongside the existing Cloudflare
   Worker, but a genuinely new piece of infrastructure, not a small addition.

6. **AI-assisted matching and distress detection** (thesis suggestion #3) — a later
   refinement once there's enough real conversation data to do this responsibly,
   not a v1 feature.

None of this is a weekend of work, and none of it should be rushed to hit a demo.
The founding-circle signups from Phase 1 are what turn "when should we build this"
from a guess into a decision backed by real numbers.

## What's deliberately *not* changing

- No monetization/freemium logic yet (thesis treats this as a later-stage question).
- No claim anywhere on the site that peer matching exists today. The roadmap section
  says so explicitly, and Phase 2 stays unreachable (no route, no UI) until it does.
- The private-writing feature's privacy guarantee is untouched — it still never
  reaches a server. Only the new, clearly-labeled founding-circle form does.
