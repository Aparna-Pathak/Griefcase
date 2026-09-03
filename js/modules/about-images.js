/**
 * about-images.js
 * -----------------------------------------------------------------------
 * Centralized image config for the About carousel (#about).
 * Every URL used by js/modules/about-carousel.js lives here — swap a
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

  // Scene 2 — "Everything else still needs to be handled." Replaced for the
  // premium redesign — a desk with a phone and paperwork reads more
  // specifically as "the calls, the forms" than the previous generic
  // stationery shot.
  practicalBurden: {
    url: "https://images.unsplash.com/photo-1681975264904-362dae92e526?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "A phone, pens, and paperwork spread across a desk",
    credit: "Photo by Nishal Pavithran on Unsplash",
    creditUrl: "https://unsplash.com/@nishal001",
  },

  // Scene 3 — calm, private writing
  reflectionBase: {
    url: "https://images.unsplash.com/photo-1639018868033-f501b5a521bd?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "An open notebook with handwriting, resting on a quiet desk",
    credit: "Photo by Tai Bui on Unsplash",
    creditUrl: "https://unsplash.com/@agforl24",
  },

  // Scene 4 — "You don't have to carry it by yourself." Replaced for the
  // premium redesign — two people sitting together reads far more directly
  // as "not alone" than the previous generic soft-light shot, and doubles
  // as the carousel's closing, warmest image.
  outcome: {
    url: "https://images.unsplash.com/photo-1719936537196-5ed9c80618bd?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "Two people sitting together on a bench, quietly looking out at a warmly lit view",
    credit: "Photo by José Martín Ramírez Carrasco on Unsplash",
    creditUrl: "https://unsplash.com/@martinirc",
  },
};
