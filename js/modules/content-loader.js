/**
 * content-loader.js
 * -----------------------------------------------------------------------
 * Single source of truth for pulling CMS content into the page.
 *
 * Today this fetches a static JSON file (data/content.json), which stands
 * in for a headless CMS. To connect a real CMS later, swap the URL in
 * loadContent() for your API endpoint (and, if the shape differs, write a
 * small adapter that maps the CMS response onto this same object shape).
 * Nothing else in the app needs to change — every render* function below
 * only depends on the plain object shape defined in content.json.
 */

const CONTENT_URL = "data/content.json";

export async function loadContent() {
  const res = await fetch(CONTENT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
  return res.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
}

export function renderNav(site) {
  const list = document.getElementById("nav-list");
  if (!list) return;
  list.innerHTML = "";
  site.nav.forEach((item) => {
    const li = document.createElement("li");
    const isAction = item.target === "open-writer" || item.target === "open-library";
    const a = document.createElement(isAction ? "button" : "a");
    a.className = "nav-link";
    a.textContent = item.label;
    if (isAction) {
      a.type = "button";
      a.dataset.action = item.target;
    } else {
      a.href = item.target;
    }
    li.appendChild(a);
    list.appendChild(li);
  });
}

export function renderHero(hero) {
  setText("hero-eyebrow", hero.eyebrow);
  setText("hero-headline", hero.headline);
  setText("hero-sub", hero.subcopy);
  setText("hero-cta-primary", hero.ctaPrimary);
  setText("hero-cta-secondary", hero.ctaSecondary);
}

export function renderHowItWorks(section) {
  setText("how-eyebrow", section.eyebrow);
  setText("how-headline", section.headline);
  setText("how-intro", section.intro);

  const grid = document.getElementById("steps-grid");
  if (!grid) return;
  grid.innerHTML = "";
  section.steps.forEach((step, i) => {
    const card = document.createElement("div");
    card.className = "step-card";
    card.style.setProperty("--i", i);
    card.innerHTML = `
      <div class="step-number">${step.number}</div>
      <h3>${step.title}</h3>
      <p>${step.body}</p>
    `;
    grid.appendChild(card);
  });
}

export function renderWhy(why) {
  setText("why-eyebrow", why.eyebrow);
  setText("why-headline", why.headline);

  const copy = document.getElementById("why-copy");
  if (copy) {
    copy.innerHTML = why.paragraphs.map((p) => `<p>${p}</p>`).join("");
  }

  const quote = document.getElementById("why-quote");
  if (quote) {
    quote.querySelector("p").textContent = why.quote.text;
    quote.querySelector("cite").textContent = why.quote.attribution;
  }
}

export function renderVision(vision) {
  if (!vision) return;
  setText("vision-eyebrow", vision.eyebrow);
  setText("vision-headline", vision.headline);
  setText("vision-intro", vision.intro);
  setText("vision-note", vision.note);

  const copy = document.getElementById("vision-copy");
  if (copy) copy.innerHTML = vision.paragraphs.map((p) => `<p>${p}</p>`).join("");

  const layers = document.getElementById("vision-layers");
  if (layers) {
    layers.innerHTML = "";
    vision.layers.forEach((layer, i) => {
      const card = document.createElement("div");
      card.className = "vision-layer";
      card.style.setProperty("--i", i);
      card.innerHTML = `<span class="vision-layer-index">${String(i + 1).padStart(2, "0")}</span><h3>${layer.title}</h3><p>${layer.body}</p>`;
      layers.appendChild(card);
    });
  }
}

export function renderPrompts(prompts) {
  setText("prompts-eyebrow", prompts.eyebrow);
  setText("prompts-headline", prompts.headline);
  setText("prompts-intro", prompts.intro);

  const scroller = document.getElementById("prompts-scroller");
  if (!scroller) return;
  scroller.innerHTML = "";
  prompts.cards.forEach((text) => {
    const card = document.createElement("div");
    card.className = "prompt-card";
    card.innerHTML = `<p>${text}</p><button type="button" data-open-writer data-prefill="${escapeAttr(text)}">Start writing this &rarr;</button>`;
    scroller.appendChild(card);
  });
}

export function renderPrivacy(privacy) {
  setText("privacy-eyebrow", privacy.eyebrow);
  setText("privacy-headline", privacy.headline);
  setText("privacy-disclaimer", privacy.disclaimer);
  setText("safety-label", privacy.safety.label);
  setText("safety-body", privacy.safety.body);

  const link = document.getElementById("safety-link");
  if (link) {
    link.textContent = privacy.safety.linkText;
    link.href = privacy.safety.linkUrl;
  }

  const grid = document.getElementById("privacy-grid");
  if (grid) {
    grid.innerHTML = "";
    privacy.points.forEach((point, i) => {
      const card = document.createElement("div");
      card.className = "privacy-card";
      card.style.setProperty("--i", i);
      card.innerHTML = `<h3>${point.title}</h3><p>${point.body}</p>`;
      grid.appendChild(card);
    });
  }
}

export function renderFaq(faq) {
  const list = document.getElementById("faq-list");
  if (!list) return;
  list.innerHTML = "";
  faq.forEach((item, i) => {
    const wrap = document.createElement("div");
    wrap.className = "faq-item";
    const id = `faq-answer-${i}`;
    wrap.innerHTML = `
      <button class="faq-question" aria-expanded="false" aria-controls="${id}">
        <span>${item.q}</span>
        <span class="plus" aria-hidden="true"></span>
      </button>
      <div class="faq-answer" id="${id}">
        <p>${item.a}</p>
      </div>
    `;
    list.appendChild(wrap);
  });
}

export function renderAbout(about) {
  setText("about-eyebrow", about.eyebrow);
  setText("about-headline", about.headline);
  const copy = document.getElementById("about-copy");
  if (copy) copy.innerHTML = about.paragraphs.map((p) => `<p>${p}</p>`).join("");
}

export function renderFooter(footer) {
  setText("footer-tagline", footer.tagline);
  setText("footer-copyright", footer.copyright);

  const safetyNote = document.getElementById("footer-safety-note");
  if (safetyNote) safetyNote.textContent = footer.safetyNote;

  const cols = document.getElementById("footer-cols");
  if (cols) {
    cols.innerHTML = "";
    footer.columns.forEach((col) => {
      const div = document.createElement("div");
      div.className = "footer-col";
      const links = col.links
        .map((link) => {
          const isAction = link.target === "open-writer" || link.target === "open-library";
          return isAction
            ? `<li><button type="button" data-action="${link.target}">${link.label}</button></li>`
            : `<li><a href="${link.target}">${link.label}</a></li>`;
        })
        .join("");
      div.innerHTML = `<h3>${col.title}</h3><ul>${links}</ul>`;
      cols.appendChild(div);
    });
  }
}

export function renderMoodChips(categories) {
  const wrap = document.getElementById("writer-mood-chips");
  if (!wrap) return;
  wrap.innerHTML = "";
  categories
    .filter((c) => c.id !== "all")
    .forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mood-chip";
      btn.textContent = cat.label;
      btn.dataset.mood = cat.id;
      btn.setAttribute("aria-pressed", "false");
      btn.style.setProperty("--mood-color", `var(--mood-${cat.id})`);
      wrap.appendChild(btn);
    });
}

export function renderLibraryFilters(categories) {
  const wrap = document.getElementById("library-filters");
  if (!wrap) return;
  wrap.innerHTML = "";
  categories.forEach((cat, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-chip";
    btn.textContent = cat.label;
    btn.dataset.filter = cat.id;
    btn.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    wrap.appendChild(btn);
  });
}

export function renderLibraryStrings(library) {
  setText("library-eyebrow", library.eyebrow);
  setText("library-heading", library.headline);
  setText("library-intro", library.intro);
  setText("library-empty-title", library.emptyTitle);
  setText("library-empty-body", library.emptyBody);
  setText("library-empty-cta", library.emptyCta);
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}
