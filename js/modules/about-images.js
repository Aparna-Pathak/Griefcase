/**
 * about-images.js
 * -----------------------------------------------------------------------
 * Centralized image config for the cinematic About experience (#about).
 * Every URL used by js/modules/about-cinematic.js lives here — swap a
 * photo by changing one line, no hunting through markup or CSS.
 *
 * All photos are sourced from Unsplash and used under the Unsplash
 * License (https://unsplash.com/license) — free for commercial and
 * non-commercial use, no permission required. Attribution is not
 * required by the license but is kept here as good practice and to
 * make swapping/crediting easy later.
 *
 * Deliberately avoided: crying faces, funeral imagery, candles,
 * tombstones, staged "sad family" photography — see ARCHITECTURE.md /
 * the brief this was built from for why.
 */

export const ABOUT_IMAGES = {
  // Scene 1 — "Something changes."
  moment: {
    url: "https://images.unsplash.com/photo-1743347255943-934f540adc89?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "An empty chair beside a sunlit window in a quiet room",
    credit: "Photo by Nellie Adamyan on Unsplash",
    creditUrl: "https://unsplash.com/@nellie_adamyan",
  },

  // Scene 2 — "Everything else still needs to be handled."
  practicalBurden: {
    url: "https://images.unsplash.com/photo-1769794370964-78412732f1cd?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "Papers, pens, and a highlighter spread across a desk in warm light",
    credit: "Photo by Yen Vu on Unsplash",
    creditUrl: "https://unsplash.com/@yenvu2410",
  },

  // Scene 3 base layer — calm, private writing
  reflectionBase: {
    url: "https://images.unsplash.com/photo-1639018868033-f501b5a521bd?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "An open notebook with handwriting, resting on a quiet desk",
    credit: "Photo by Tai Bui on Unsplash",
    creditUrl: "https://unsplash.com/@agforl24",
  },

  // Scene 3 reveal layer — what's underneath: not being alone with it
  reflectionReveal: {
    url: "https://images.unsplash.com/photo-1719936537196-5ed9c80618bd?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "Two people sitting together on a bench, quietly looking out at a warmly lit view",
    credit: "Photo by José Martín Ramírez Carrasco on Unsplash",
    creditUrl: "https://unsplash.com/@martinirc",
  },

  // Scene 4 — "You don't have to carry it by yourself."
  outcome: {
    url: "https://images.unsplash.com/photo-1768577908037-bbc3da95c1cf?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "Soft morning light through sheer curtains",
    credit: "Photo by 王大洪 on Unsplash",
    creditUrl: "https://unsplash.com/@mr_wdh",
  },
};
