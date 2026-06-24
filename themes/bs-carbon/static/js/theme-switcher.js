/* ==========================================================================
   Carbon theme switcher — four native Bootstrap 5.3 color modes:
   White / Gray 10 / Gray 90 / Gray 100 → data-bs-theme="white|g10|g90|g100".
   Sets the attribute on <html>, persists it, and ticks the active dropdown item.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "carbon-portfolio-theme";
  var THEMES = ["white", "g10", "g90", "g100"];
  var root = document.documentElement;

  function normalize(value) {
    if (value === "light") return "white";   // migrate older / Bootstrap values
    if (value === "dark") return "g100";
    return THEMES.indexOf(value) !== -1 ? value : null;
  }

  function resolveInitial() {
    var stored;
    try { stored = normalize(localStorage.getItem(STORAGE_KEY)); } catch (e) { stored = null; }
    if (stored) return stored;
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "g100" : "white";
  }

  function apply(theme) { root.setAttribute("data-bs-theme", theme); }

  function markActive(theme) {
    var items = document.querySelectorAll("[data-theme-value]");
    for (var i = 0; i < items.length; i++) {
      var on = items[i].getAttribute("data-theme-value") === theme;
      items[i].classList.toggle("active", on);
      if (on) { items[i].setAttribute("aria-current", "true"); }
      else { items[i].removeAttribute("aria-current"); }
    }
  }

  apply(resolveInitial());

  function bind() {
    markActive(root.getAttribute("data-bs-theme"));
    var items = document.querySelectorAll("[data-theme-value]");
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener("click", function () {
        var theme = this.getAttribute("data-theme-value");
        apply(theme);
        markActive(theme);
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
