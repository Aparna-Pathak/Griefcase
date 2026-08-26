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
│       ├── hero-particles.js   Decorative hero atmosphere particles
│       ├── faq.js              Accessible accordion
│       ├── writer.js           The "Open Griefcase" writing experience
│       ├── release-ritual.js   Fold → case → close → relief animation sequence
│       ├── library.js          "My Griefcase": browse, filter, read, let go
│       ├── interactions.js     Magnetic buttons, hero cursor glow, card tilt (pointer-driven polish)
│       ├── ambient-sound.js    Generative ambient pad + release-ritual chime (Web Audio, opt-in)
│       └── pwa.js               Service worker registration + custom install prompt
├── icons/                      Generated app icons, favicons, OG/social card, manifest screenshots
├── scripts/
│   └── make_icons.py           Regenerates everything in icons/ from plain geometry (no art assets)
├── docs/
│   └── aso-copy-kit.md         Draft Play Store / App Store listing copy, character-limit checked
├── data/
│   └── content.json            All editable copy — the mock CMS
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
`prompts`, `categories`, `library`, `privacy`, `about`, `faq`, `footer`) and every
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

## Where the product vision came from

The "Where this is headed" section on the homepage, and the philosophy in
the Why/About copy ("presence before solutions," "support that adapts to
a person, not the other way around") draws directly on the founder pitch
deck this update was built from — its emphasis on listening before
fixing, earned (not forced) escalation, and a layered model from AI
reflection through to licensed professionals.

**None of the layers beyond private writing and voice notes are built.**
That's a deliberate scope decision, not an oversight: a static frontend
prototype has no real backend, no moderation, no crisis-detection
capability, and no way to actually connect someone to a trained volunteer
or professional. Building UI that *implied* those things worked — a fake
"AI listener" chat, a "connect to a volunteer" button that goes nowhere
real — would be actively misleading to someone in a vulnerable moment,
which is precisely the audience this product exists to be gentle with.
The vision section says this openly on the page itself (see its closing
note), rather than only in this README, so a visitor never mistakes
roadmap language for a working feature.

If those layers get built for real, they'll need their own safety design
(consent flows, escalation policy, moderation, professional vetting) well
beyond what belongs in a frontend README — this prototype intentionally
stops at the boundary of what it can honestly deliver today.

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
