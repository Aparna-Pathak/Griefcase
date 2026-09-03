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
  // Scene 1 — "Something changes." Replaced with a photo that has real
  // motion caught in it (curtains mid-billow, light shifting through
  // them) rather than a still, empty room — the moment reads as
  // something happening, not just a static aftermath.
  moment: {
    url: "https://images.unsplash.com/photo-1780155968749-2b45bcd44884?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "Sheer curtains billowing in a sunlit room",
    credit: "Photo by Jon Tyson on Unsplash",
    creditUrl: "https://unsplash.com/@jontyson",
  },

  // Scene 2 — "Everything else still needs to be handled." A hand
  // mid-signature over paperwork reads as an active moment of dealing
  // with admin, rather than a flat, lifeless desk arrangement.
  practicalBurden: {
    url: "https://images.unsplash.com/photo-1764231467852-b609a742e082?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "A hand signing paperwork on a desk",
    credit: "Photo by Jakub Żerdzicki on Unsplash",
    creditUrl: "https://unsplash.com/@jakubzerdzicki",
  },

  // Scene 3 — calm, private writing. A hand actively mid-sentence in a
  // notebook, warm wood tones and a coffee cup close by, reads as lived-in
  // rather than a sterile top-down product shot.
  reflectionBase: {
    url: "https://images.unsplash.com/photo-1675098979498-4f553c74b6e7?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "A hand writing in a notebook on a wooden table beside a coffee cup",
    credit: "Photo by Carter Hightower on Unsplash",
    creditUrl: "https://unsplash.com/@cshightowerphoto",
  },

  // Scene 4 — "You don't have to carry it by yourself." Two people
  // walking together, hands linked, in warm daylight — genuinely warm
  // and in motion, matching the upbeat closing beat rather than a
  // somber or static "two people sitting quietly" shot.
  outcome: {
    url: "https://images.unsplash.com/photo-1549990414-deeea9e3c0b6?fm=jpg&q=70&w=2000&auto=format&fit=crop",
    alt: "Two people holding hands while walking together outdoors in warm daylight",
    credit: "Photo by Simon Boxus on Unsplash",
    creditUrl: "https://unsplash.com/@simonlerouge",
  },
};
