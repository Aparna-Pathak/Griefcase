# Griefcase

> "Leave it here. Feel a little lighter."

A private, anonymous space to write down what's weighing on you, leave it
there, and feel a little lighter. Not therapy. Not a social network. Not a
productivity app — just somewhere to put things down.

This repository is a complete, production-ready **frontend prototype**:
vanilla HTML/CSS/JS, no build step, no framework, CMS-ready content
architecture with mock JSON data standing in for a headless CMS. It is
also an installable **Progressive Web App**, with baseline **SEO and
GEO** (generative/AI-answer-engine optimization) built in, and a
generative ambient soundscape the visitor can optionally turn on.

---

## Running it locally

No build step is required, but the site fetches `data/content.json` via
`fetch()`, and the service worker requires `http(s)` — both are blocked on
the `file://` protocol. Serve the folder with any static file server:

```bash
# Option A — Python (built in on most systems)
python3 -m http.server 8080

# Option B — Node
npx serve .

# Option C — VS Code
# Right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8080` (or whatever port your tool prints).
Chrome/Edge will show an install icon in the address bar once the service
worker has registered — that's the PWA working.

There is nothing to install and nothing to build — it's plain HTML/CSS/JS.

---

## Project structure

```
griefcase/
├── index.html                 Semantic, accessible page shell (full content baked in for SEO/GEO)
├── offline.html               Calm fallback page the service worker serves when there's no connection
├── manifest.webmanifest       PWA manifest: icons, shortcuts, screenshots, install metadata
├── sw.js                      Service worker: app-shell caching + offline support
├── robots.txt                 Crawler policy (explicitly allows AI-answer-engine bots too)
├── sitemap.xml                Single-page sitemap entry
├── llms.txt                   Plain-language site summary for LLM/GEO crawlers
├── css/
│   ├── variables.css           Design tokens: color, type, spacing, motion
│   ├── base.css                Reset, global element styles, a11y utilities
│   ├── layout.css              Header, section rhythm, footer grid
│   ├── components.css          Hero, writer, release ritual, library, modals, PWA/sound UI…
│   ├── about-showcase.css      The compact interactive About showcase (see below)
│   ├── prompts-orbit.css       Emotional prompts' desktop ring layout (see below)
│   ├── finale.css              The closing "Whenever you're ready." section
│   ├── animations.css          Scroll-reveal + shared motion utilities
│   └── responsive.css          Breakpoint & touch-target refinements
├── js/
│   ├── main.js                 Bootstraps the app: load content → render → wire modules
│   └── modules/
│       ├── content-loader.js   Fetches CMS content, renders every section
│       ├── state.js            localStorage persistence for entries (swap for an API later)
│       ├── ui-utils.js         Overlay open/close, focus trap, toast, confirm dialog
│       ├── navigation.js       Header scroll state + mobile menu
│       ├── reveal.js           IntersectionObserver scroll-reveal
│       ├── counters.js         Animated count-up for the Vision section's stat numbers
│       ├── hero-particles.js   Decorative hero atmosphere particles
│       ├── faq.js              Accessible accordion
│       ├── writer.js           The "Open Griefcase" writing experience
│       ├── release-ritual.js   Fold → case → close → relief animation sequence
│       ├── library.js          "My Griefcase": browse, filter, read, let go
│       ├── interactions.js     Magnetic buttons, hero cursor glow, card tilt, premium-card glow, prompts orbit hover-pop
│       ├── ambient-sound.js    Generative ambient pad + release-ritual chime (Web Audio, opt-in)
│       ├── pwa.js               Service worker registration + custom install prompt
│       ├── interest-form.js    "Founding circle" form — the one thing that calls the API below
│       ├── about-images.js     Centralized image config for the About showcase
│       └── about-showcase.js   Click/idle-advance, crossfade, and pause behavior for #about
├── icons/                      Generated app icons, favicons, OG/social card, manifest screenshots
├── scripts/
│   └── make_icons.py           Regenerates everything in icons/ from plain geometry (no art assets)
├── docs/
│   └── aso-copy-kit.md         Draft Play Store / App Store listing copy, character-limit checked
├── data/
│   └── content.json            All editable copy — the mock CMS
├── worker/
│   └── index.js                API layer: POST /api/interest only — see "Backend" below
├── migrations/
│   └── 0001_init.sql           D1 schema: interest_signups (live) + Phase 2 tables (schema only)
├── wrangler.toml                Worker + D1 binding + static-assets config
├── ARCHITECTURE.md              What's built vs. designed-but-not-built, and why — read this first
└── README.md
```

Nothing is a bundler artifact — every file is what ships. Open any module
and it's readable top to bottom.

---

## Editing content (the CMS layer)

**Everything a non-technical editor needs to change lives in
`data/content.json`.** Nothing user-facing that should be editable is
hardcoded in HTML or JS. To change copy:

1. Open `data/content.json`.
2. Edit the relevant string(s) — nav labels, hero headline, "How it works"
   steps, rotating prompts, mood categories, privacy copy, FAQ, about text,
   footer links, the safety pathway copy and link, all of it.
3. Save and refresh. No rebuild needed.

The file is organized by section (`hero`, `howItWorks`, `why`, `vision`,
`glossary`, `foundingCircle`, `prompts`, `categories`, `library`,
`privacy`, `about`, `faq`, `footer`) and every
key is a plain string or array of strings — safe to hand to someone who
has never opened a code editor, as long as they keep the JSON structure
(quotes, commas, brackets) intact. A JSON validator (many free ones
online) will catch typos before they break the page.

### Swapping in a real headless CMS

`js/modules/content-loader.js` has one function, `loadContent()`, that
fetches and returns this JSON shape. To connect a real CMS (Contentful,
Sanity, a custom API, whatever your team prefers):

1. Point the `CONTENT_URL` constant (or replace the `fetch` call) at your
   CMS's API endpoint.
2. If your CMS returns a different shape, write a small mapping function
   that transforms its response into the same object shape documented in
   `data/content.json`. Every `render*` function in that file only cares
   about the shape, not the source.
3. Nothing else in the app needs to change.

### Adding or renaming mood categories

Edit the `categories` array in `content.json`. Each entry needs an `id`
(used as a CSS variable suffix and storage key) and a `label` (shown to
users). If you add a new `id`, also add a matching `--mood-<id>` color
variable in `css/variables.css` so entries tagged with it get a color
accent — otherwise they'll fall back to the default taupe.

---

## How entries are stored

This prototype stores everything a user writes **only in their own
browser**, via `localStorage` (see `js/modules/state.js`). Nothing is
sent to a server. That's what makes the privacy copy on the site literally
true today ("private by design," "nothing leaves your device") rather than
a marketing claim.

If you later add a real backend (for cross-device sync, account recovery,
or moderation), `state.js` is the only file that needs to change —
`getEntries()`, `saveEntry()`, and `deleteEntry()` are the entire contract
the rest of the app relies on. Keep the same function names and return
shapes and `writer.js` / `library.js` / `release-ritual.js` won't need to
know the difference.

Voice notes are stored as base64 data URLs alongside the entry, which is
fine for short clips in a local prototype but is **not** how you'd want to
store audio at scale — swap that for real object storage (S3, R2, etc.)
and store a URL instead once there's a backend.

---

## Accessibility

- Semantic landmarks (`header`, `main`, `footer`, `nav`), a skip link, and
  labeled form controls throughout.
- Full keyboard support: every overlay (Writer, My Griefcase, entry
  reader, confirm dialog) traps focus while open, restores focus to the
  triggering element on close, and closes on <kbd>Escape</kbd>.
- Visible focus states (`:focus-visible`) tuned to the palette rather than
  a default blue ring.
- `prefers-reduced-motion: reduce` is respected globally — motion
  durations collapse via a CSS custom property override, scroll-reveal
  skips straight to visible, and the fold/case release ritual uses a
  much shorter timeline instead of being skipped outright (the emotional
  beats still happen).
- Live regions announce key state changes (entry saved, entry released)
  for screen reader users without relying on visual-only feedback.
- Color contrast was chosen against WCAG AA for body text on both cream
  and charcoal backgrounds.
- The newer pointer-driven polish (magnetic buttons, hero glow, card tilt)
  is skipped entirely — not just shortened — under
  `prefers-reduced-motion` or on a coarse (touch) pointer, since none of
  it is load-bearing for using the site.

---

## Empty / loading / error states

- **Empty**: "My Griefcase" shows a calm, non-guilt-inducing empty state
  before any entry exists, and a lighter "nothing tagged this way yet"
  variant when a filter has no matches.
- **Loading**: content is rendered from the static HTML defaults first
  (so there's no flash of empty page), then hydrated from
  `content.json` once it resolves.
- **Error**: if `content.json` fails to fetch (e.g. serving restrictions),
  `main.js` falls back to a small embedded content object so navigation,
  mood tags, and rotating prompts keep working rather than breaking the
  page. A console warning notes when this happens.
- Microphone permission denial in the voice recorder is handled calmly —
  the interface suggests writing instead rather than showing a hard error.

---

## Backend (Phase 1 API)

Griefcase is still a static site first — everything above this section is
served straight from Cloudflare's asset store with no server involved.
The one exception is `POST /api/interest`, which backs the "Join the
founding circle" form.

- **`wrangler.toml`** — declares the Worker (`worker/index.js`) and binds
  a D1 database (`griefcase-db`) to it. `run_worker_first` is scoped to
  `/api/*` only, so the Worker script is never invoked for the site
  itself — a request for `index.html` or any asset never touches it.
- **`worker/index.js`** — the entire API surface. One route,
  `POST /api/interest`: validates the email server-side, honors a hidden
  honeypot field for basic bot resistance, clips every field length, and
  writes a row to `interest_signups`. Returns JSON either way.
- **`migrations/0001_init.sql`** — the full schema: `interest_signups`
  (live) plus the Phase 2 tables (`grief_profiles`, `matches`, `messages`,
  `reports`, `distress_flags` — schema only, not queried by anything
  yet). See [ARCHITECTURE.md](./ARCHITECTURE.md) for what those are for.
- **Local development**: `npx wrangler dev` serves the site and the API
  together with a local D1 instance. `npx wrangler d1 execute
  griefcase-db --local --file=migrations/0001_init.sql` applies the
  schema locally first.
- **Deployment**: this repo is connected to Cloudflare via Git
  integration — pushing to `main` redeploys automatically, the same way
  it already did before this Worker/D1 setup existed. If Cloudflare's
  dashboard prompts for a one-time approval of the new D1 binding on the
  first deploy after this change, that's expected — approve it there.

---

## Progressive Web App

Griefcase is installable on desktop and mobile, and keeps working offline
after the first visit.

- **`manifest.webmanifest`** declares the name, icons (including a
  maskable variant for adaptive Android icon shapes), theme colors, two
  app shortcuts ("Open Griefcase" and "My Griefcase" — jump straight past
  the homepage), and screenshots used by richer install UI.
- **`sw.js`** caches the app shell (HTML/CSS/JS/icons) on first load with
  a stale-while-revalidate strategy — every visit gets the cached version
  instantly, while a fresh copy downloads quietly in the background for
  *next* time. `data/content.json` is network-first instead, so CMS edits
  show up immediately when online, falling back to the last-cached copy
  offline. Navigations fall back to `offline.html` as a last resort.
- **`js/modules/pwa.js`** registers the service worker and shows a custom,
  dismissible "Add to home screen" banner — only once the browser
  confirms the app is actually installable, never before, and never again
  after it's dismissed once.
- **Bump `CACHE_VERSION` in `sw.js`** whenever you change which files make
  up the app shell, so returning visitors cleanly pick up the new set
  instead of a stale mix of old and new files.
- **Regenerating icons:** `python3 scripts/make_icons.py` rebuilds every
  PNG in `icons/` from plain geometry matching the inline SVG brand mark —
  there's no source art file to keep in sync separately.
- **Before shipping this to a real domain**, replace the `https://griefcase.app/`
  placeholders in `index.html`, `manifest.webmanifest`, `robots.txt`,
  `sitemap.xml`, and `llms.txt` with your real domain.

## SEO & GEO (generative/AI-answer-engine optimization)

- **Full content is now baked into `index.html`** for every section (not
  just the hero) — `content.json` still drives the page via JS hydration
  for CMS editability, but a crawler that never runs JavaScript (including
  some AI-answer-engine crawlers) sees the complete, real content on first
  fetch. Keep both in sync if you edit copy: update `content.json` for the
  live experience, and mirror significant copy changes into `index.html`'s
  static markup so non-JS crawlers stay accurate.
- **Structured data**: two JSON-LD blocks in `<head>` — a `WebApplication`
  schema (what Griefcase is, that it's free, its core features) and a
  `FAQPage` schema mirroring the on-page FAQ, which is what lets search
  engines and AI answer engines quote FAQ answers directly.
- **Complete meta tags**: canonical URL, full Open Graph + Twitter Card
  set (including a generated 1200×630 social card at
  `icons/social-card.png`), and a descriptive `<title>`/meta description
  that state plainly what Griefcase is and isn't.
- **`llms.txt`** is a plain-language summary written specifically for LLM
  crawlers doing retrieval for chat answers (an emerging convention,
  unrelated to `robots.txt`) — what Griefcase is, what it explicitly is
  not, and the key facts worth citing accurately.
- **`robots.txt`** explicitly allows common AI crawlers (GPTBot,
  ClaudeBot, PerplexityBot, etc.) alongside standard search engines —
  there's nothing on this static site worth blocking, since the only
  actually private data (journal entries) never reaches a server in the
  first place.
- **`sitemap.xml`** is intentionally minimal (one URL) since this is a
  single-page app; add entries if you ever split sections into real
  separate pages/routes.

## ASO (App Store Optimization)

Griefcase doesn't have a live app-store listing — it's a PWA today. See
**`docs/aso-copy-kit.md`** for character-limit-checked draft copy (title,
subtitle, descriptions, keywords) for both Google Play and the Apple App
Store, ready to use if you later wrap it as a Trusted Web Activity /
native shell and actually submit it.

## Sound design

The small speaker icon (bottom-right) turns on a soft, generative ambient
pad, and the release ritual plays a two-note chime the instant the case
closes. Both are synthesized live with the Web Audio API in
`js/modules/ambient-sound.js` — **there is no imported audio file.** That
was a deliberate choice, not a shortcut:

- **Zero licensing risk.** "Open source / license-free" is automatically
  true for a sound your own code generates — there's no attribution to
  track, no license terms to verify, no track to swap out if a license
  changes later.
- **Zero added weight**, which matters for a PWA that should install and
  work offline instantly, and a loop with no audible seam (no 3-second MP3
  visibly restarting).
- **Strictly opt-in.** Sound never autoplays — browsers block that anyway,
  but more importantly, unsolicited audio is the wrong thing to introduce
  to someone arriving at a grief-support page mid-emotion. If someone
  turned sound on during a past visit, the next visit honors that
  preference only from their *first tap/click/keypress* on the new page,
  never automatically on load.
- **If you'd rather use a real recorded track**, that's a reasonable
  choice too — just make sure it's genuinely and verifiably license-free
  (public domain, or an explicit Creative Commons / royalty-free grant you
  can point to), then swap the contents of `start()` in
  `ambient-sound.js` for an `<audio>` element or `AudioBufferSourceNode`
  pointed at your file, keeping the same fade-in/out and opt-in behavior.

## Visual language: warm espresso, premium cards

The marketing pages (hero through footer) use a warm espresso-brown
palette rather than flat black for every "dark" surface — `.section-dark`
("Why Griefcase exists"), the site footer, the install banner, and the
"Before you write" FAQ section all use `--gradient-dark`
(`--color-espresso` → `--color-espresso-deep`, defined in
`css/variables.css`) instead of a solid near-black. Body ink itself
(`--color-charcoal`) is a dark brown, not black, and a new `--color-gold`
accent sits alongside the existing terracotta `--color-accent` for a
livelier, more premium accent — gradient number badges, stat values,
button hover glows, and the FAQ's open-state icon all use it.

Repeated content (How it works, Vision's stats/layers, Glossary, Privacy,
the prompt cards, and the founding-circle form) is wrapped in a shared
`.premium-card` class (`css/layout.css`) — a soft sheen background, a
quiet border, gentle elevation at rest, and a lift + glow on hover. On
desktop with a fine pointer, `initPremiumCardGlow()` in
`js/modules/interactions.js` tracks the cursor over each card and feeds
its position into a `--mx`/`--my` custom property, which the card's
`::before` reads to paint a soft gold spotlight that follows the mouse —
purely decorative, and a no-op (never wired up) under
`prefers-reduced-motion` or on a coarse/touch pointer, where the card
already looks complete without it.

## Animation & interaction pass

Building on the original micro-interactions, this pass adds a few
pointer-driven touches, all in `js/modules/interactions.js` and all
no-ops on touch devices and under `prefers-reduced-motion` (see
Accessibility below):

- **Magnetic buttons** (`.is-magnetic`) — primary/ghost CTAs pull a few
  pixels toward the cursor within their own bounds, and spring back on
  pointer-leave.
- **Hero cursor glow** — a very soft light in the hero section drifts
  toward the pointer; pure atmosphere, `aria-hidden` and non-interactive.
- **Entry card tilt** — "My Griefcase" paper-slip cards tilt subtly toward
  the pointer, delegated so it keeps working as cards are re-rendered on
  every filter change.
- **Mode-switch page-turn** — switching between Write and Record a
  thought in the writer now plays the existing `.page-turn-enter`
  transition instead of a hard cut.
- **Textarea "settle" pulse** — a single quiet ring the first time you
  start typing, echoing the original brief's "writing area subtly
  expands" note without adding a per-keystroke effect.
- **Library filter fade** — switching mood filters fades the grid rather
  than swapping instantly.

---

## The About section (compact interactive showcase)

`#about` is deliberately treated as the emotional centerpiece of the site,
not a footnote section — but it's built to *not* dominate the page. It's a
compact "feature tour" pattern (a photo frame beside an interactive list of
four beats, well under 400px tall) rather than a full-height set piece,
followed by the original compact "About" statement (`.about-settle`) that
brings the page back down to the site's calmer everyday register. An
earlier version of this section was a full-height (~88vh), text-over-photo
auto-advancing carousel; it was replaced because it took up too much of
the page and the text-on-image treatment fought with photo legibility.

**The story, and why it's told this way:** the four beats deliberately
open with the *practical* overwhelm of loss (the calls, the forms, the
decisions) rather than going straight to something softer — that's the
honest, relatable hook. Beat 3 is the turn: Griefcase is upfront that it
won't do any of that administrative work for you, and instead offers
somewhere to put down what you're carrying. Beat 4 closes on the thesis's
actual finding (most people navigating loss stay quiet about it) and
gestures at peer connection as where this is headed, without overclaiming
that it exists today. This blend was a deliberate choice — see [Where the
product vision came from](#where-the-product-vision-came-from) below for
why the copy doesn't just adopt an "estate paperwork" framing wholesale.

The imagery direction is calm, homely, lifestyle photography — sheer white
curtains, tea, journals, blankets — rather than office/corporate or
outdoor scenes, so each beat reads as safe and domestic rather than
transactional.

- **`js/modules/about-images.js`** is the single place every photo URL for
  this section lives — swap an image by changing one line here, never by
  hunting through `index.html` or CSS. Each entry also carries a credit
  and source link, kept for good practice even though the license doesn't
  require it (see licensing below).
- **`js/modules/about-showcase.js`** drives the interaction: clicking any
  beat jumps straight to it (crossfading the photo and expanding that
  beat's sub-copy); Arrow Up/Down/Left/Right move between beats when one
  is focused. It also idle-advances one beat every 4.5 seconds
  (`AUTOPLAY_MS`) with a thin progress bar under the active beat, purely
  as a convenience — hovering, focusing, or clicking pauses it, and it's
  never the *only* way through the four beats since every one is a real
  `<button>`. Pauses whenever the section scrolls out of view or the
  browser tab is hidden.
- **`css/about-showcase.css`** holds the photo crossfade, the one-shot
  light-sheen sweep on each change, and the beat list/progress-bar
  styling. Because the copy now lives beside the photo instead of on top
  of it, no scrim is needed — the photography reads at full richness.
- **Accessibility & fallback**: under `prefers-reduced-motion`, idle-
  advance never starts and the sheen sweep is disabled — the component
  becomes purely click/tap/keyboard-driven, with the same four beats
  reachable the same way.
- **Imagery & licensing**: all four photographs are sourced from Unsplash
  and used under the [Unsplash License](https://unsplash.com/license) —
  free for commercial and non-commercial use, no permission required.
  Deliberately avoided: crying faces, funeral imagery, candles,
  tombstones, and staged "sad family" stock photography — the direction
  throughout is quiet, ordinary, and specific rather than performative.

## Emotional prompts orbit (desktop) & animated stat counters

Two smaller, more playful touches added alongside the carousel:

- **The prompt cards orbit.** On a wide viewport with a fine pointer (see
  the media query in `css/prompts-orbit.css`), the "Emotional prompts"
  cards arrange themselves in a slow-spinning ring instead of the
  horizontal scroller — `renderPrompts()` in `content-loader.js` builds
  both layouts from the same `content.json` array so there's only ever
  one source of the copy, and CSS shows exactly one of the two (the
  hidden one is `display:none`, which also removes it from the tab order
  and screen-reader tree automatically — no manual `aria-hidden`
  juggling needed). Hovering or focusing a card pauses the ring and pops
  that card forward (`initPromptOrbit()` in `interactions.js`); everyone
  else — touch, narrow viewports, `prefers-reduced-motion` — always gets
  the plain scroller, since a spinning ring with no hover isn't useful.
- **The Vision stat numbers count up** when they scroll into view
  (`js/modules/counters.js`). It's deliberately generic: it doesn't
  hardcode "91%" or "4.2 / 5" anywhere, it finds every numeric substring
  in the element's rendered text and animates each one from 0 to its real
  value, leaving the surrounding `%`, `/`, `→`, `<`, and spacing exactly
  where they were — so editing the numbers in `data/content.json` never
  requires touching this file. No-ops under `prefers-reduced-motion`
  (the correct final numbers are already there; there's nothing to
  animate).

---

## Where the product vision came from

The "Where this is headed" section on the homepage, the mental-health
glossary, and the research citations in the vision copy draw directly on
["Grief in the digital age — Exploring peer-based emotional support"](.)
(Amit Chansikar, MBA research paper, SSODL, 2025) — its survey findings,
its literature review, and its explicit suggestion to start small and
build trust before building a matching engine.

**Peer matching and messaging (the thesis's central proposal) are not
built.** That's a deliberate scope decision, not an oversight — see
[ARCHITECTURE.md](./ARCHITECTURE.md) for the full reasoning and the
phased plan. In short: connecting grieving people with strangers for 1:1
conversation without safety moderation, distress escalation, and peer
vetting infrastructure *first* would be a real harm risk, not a
hypothetical one. Building UI that implied matching already worked — a
fake "connect to a peer" button that goes nowhere real — would be
actively misleading to someone in a vulnerable moment.

**What is built now:** a real interest-capture backend (Cloudflare
Worker + D1 — see `worker/index.js`, `wrangler.toml`,
`migrations/0001_init.sql`) behind the "Join the founding circle" form,
so real demand signal exists before Phase 2 gets built. The Phase 2
database schema (`grief_profiles`, `matches`, `messages`, `reports`,
`distress_flags`) is already laid down in the same migration, but nothing
queries it yet — see ARCHITECTURE.md for why it's sequenced this way and
what has to exist before it does.

---

## Safety note on scope

Griefcase is explicitly **not** therapy, medical treatment, or crisis
intervention, and the product should never be positioned that way. The
Privacy & Safety section and the footer both carry a quiet, unobtrusive
pathway to crisis resources (a link to
[findahelpline.com](https://findahelpline.com), a directory of local
helplines) for anyone who needs it — visible, but not alarming, and never
interrupting the primary experience.

---

## Browser support

Built against evergreen browsers (recent Chrome, Safari, Firefox, Edge).
Uses `IntersectionObserver`, CSS custom properties, `backdrop-filter`,
`MediaRecorder` (for the optional voice note feature, which degrades
gracefully — text writing works everywhere `MediaRecorder` doesn't), the
Web Audio API (the ambient sound toggle simply stays inert if
unsupported), and a Service Worker (PWA install/offline support — the
site is fully usable without it, just without installability or offline
access).

---

## License / usage

This is a design and engineering prototype delivered for your use. Adapt,
restyle, and extend freely.
