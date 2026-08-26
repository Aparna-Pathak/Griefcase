/**
 * navigation.js
 * Header scroll state + mobile nav toggle. Content of the nav itself is
 * rendered by content-loader.js; this module only handles behavior.
 */

export function initNavigation() {
  const header = document.getElementById("site-header");
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");

  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (toggle && nav) {
    const closeMenu = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    const openMenu = () => {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("is-open");
      isOpen ? closeMenu() : openMenu();
    });

    nav.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }
}
