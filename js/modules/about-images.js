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
 * required by the license but is kept here as good practice.
 *
 * "moment" and "reflectionBase" were refreshed in the Sept 2026 pass —
 * both photographer handles below were confirmed directly from the
 * photo's own Unsplash page that session, not carried over unverified.
 * "practicalBurden" and "outcome" are held over from the prior set (see
 * their notes) — several fresh candidates were evaluated for both and
 * none beat what's already there on warmth/palette fit, so they stayed.
 *
 * Visual direction (redesign): calming, homely, lifestyle photography —
 * sheer white curtains, soft natural light, tea, blankets, journals.
 * Deliberately avoided: crying faces, funeral imagery, candles,
 * tombstones, staged "sad family" photography, and anything office/
 * corporate — see ARCHITECTURE.md / the brief this was built from.
 */

export const ABOUT_IMAGES = {
  // Beat 1 — "This too shall pass." Refreshed Sept 2026 — same sheer-
  // curtain, sunlit-room idea as before, swapped for a warmer, more
  // gold/cream-toned frame of it.
  moment: {
    url: "https://images.unsplash.com/photo-1759752784239-d54abca7da0d?fm=jpg&q=70&w=1600&auto=format&fit=crop",
    alt: "Sunlight shining through a sheer lace curtain in a warm, cream-toned room",
    credit: "Photo by Richard Stachmann on Unsplash",
    creditUrl: "https://unsplash.com/photos/sunlight-shines-through-a-sheer-lace-curtain-PbVFXjDsgp0",
  },

  // Beat 2 — "Everyone's got some baggage. It's a part of life." A
  // handwritten list stands in for baggage/things carried, kept homely
  // (notebook and tea) rather than an office desk.
  practicalBurden: {
    url: "https://images.unsplash.com/photo-8CL8KDg8oAs?fm=jpg&q=70&w=1600&auto=format&fit=crop",
    alt: "A notebook with a handwritten list, a pen, and a cup of tea",
    credit: "Photo via Unsplash",
    creditUrl: "https://unsplash.com/photos/a-notebook-with-a-list-and-a-pen-next-to-a-cup-of-tea-8CL8KDg8oAs",
  },

  // Beat 3 — "So we built somewhere to put it down." Calm, private writing.
  // Refreshed Sept 2026 — same book/warm-drink/cozy-textile idea, swapped
  // for a richer, more earthy-toned frame of it (coffee, not tea, but the
  // same quiet, put-your-feet-up register).
  reflectionBase: {
    url: "https://images.unsplash.com/photo-1696231989404-4a534a19c1e7?fm=jpg&q=70&w=1600&auto=format&fit=crop",
    alt: "A cup of coffee and an open book resting on a warm, cozy blanket",
    credit: "Photo by Lena Polishko on Unsplash",
    creditUrl: "https://unsplash.com/photos/a-cup-of-coffee-and-an-open-book-on-a-blanket-Cywmn4F_IrI",
  },

  // Beat 4 — "It's easier when someone gives you a hand with it." Home
  // warmth and company: two people under a blanket on a couch.
  outcome: {
    url: "https://images.unsplash.com/photo-DIc-2viglVQ?fm=jpg&q=70&w=1600&auto=format&fit=crop",
    alt: "Two people sitting together on a couch under a blanket",
    credit: "Photo via Unsplash",
    creditUrl: "https://unsplash.com/photos/a-man-and-woman-sitting-on-a-couch-under-a-blanket-DIc-2viglVQ",
  },
};
