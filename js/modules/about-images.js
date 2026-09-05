/**
 * about-images.js
 * -----------------------------------------------------------------------
 * Centralized image config for the About showcase (#about).
 * Every URL used by js/modules/about-showcase.js lives here — swap a
 * photo by changing one line, no hunting through markup or CSS.
 *
 * All photos are sourced from Unsplash and used under the Unsplash
 * License (https://unsplash.com/license) — free for commercial and
 * non-commercial use, no permission required. Attribution is not
 * required by the license but is kept here as good practice; the
 * photographer handles below could not be independently re-verified
 * when this set was sourced (Unsplash page-fetch access was rate-
 * limited that session) — the photo IDs and content were confirmed,
 * the byline text was not, so double-check before printing a credit
 * anywhere public-facing.
 *
 * Visual direction (redesign): calming, homely, lifestyle photography —
 * sheer white curtains, soft natural light, tea, blankets, journals.
 * Deliberately avoided: crying faces, funeral imagery, candles,
 * tombstones, staged "sad family" photography, and anything office/
 * corporate — see ARCHITECTURE.md / the brief this was built from.
 */

export const ABOUT_IMAGES = {
  // Beat 1 — "Something changes."
  moment: {
    url: "https://images.unsplash.com/photo-u_cSrc6HUm8?fm=jpg&q=70&w=1600&auto=format&fit=crop",
    alt: "Sheer white curtains softly billowing in a sunlit, homely room",
    credit: "Photo via Unsplash",
    creditUrl: "https://unsplash.com/photos/sheer-white-curtains-softly-blowing-in-a-window-u_cSrc6HUm8",
  },

  // Beat 2 — "Everything else still needs to be handled." Reframed softly
  // for this redesign: a notebook and tea, not an office desk.
  practicalBurden: {
    url: "https://images.unsplash.com/photo-8CL8KDg8oAs?fm=jpg&q=70&w=1600&auto=format&fit=crop",
    alt: "A notebook with a handwritten list, a pen, and a cup of tea",
    credit: "Photo via Unsplash",
    creditUrl: "https://unsplash.com/photos/a-notebook-with-a-list-and-a-pen-next-to-a-cup-of-tea-8CL8KDg8oAs",
  },

  // Beat 3 — calm, private writing
  reflectionBase: {
    url: "https://images.unsplash.com/photo-R-m5_byK3jg?fm=jpg&q=70&w=1600&auto=format&fit=crop",
    alt: "A book, flowers, and a cup of tea resting on a cozy bed",
    credit: "Photo via Unsplash",
    creditUrl: "https://unsplash.com/photos/book-flowers-and-tea-on-a-cozy-bed-R-m5_byK3jg",
  },

  // Beat 4 — "You don't have to carry it by yourself." Reframed as home
  // warmth for this redesign: two people under a blanket on a couch,
  // not an outdoor walk.
  outcome: {
    url: "https://images.unsplash.com/photo-DIc-2viglVQ?fm=jpg&q=70&w=1600&auto=format&fit=crop",
    alt: "Two people sitting together on a couch under a blanket",
    credit: "Photo via Unsplash",
    creditUrl: "https://unsplash.com/photos/a-man-and-woman-sitting-on-a-couch-under-a-blanket-DIc-2viglVQ",
  },
};
