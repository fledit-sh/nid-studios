/* NID Studios — nav.js
   Drives the shared sticky topbar across every page:
   - toggles `.solid` (frosted state) once scrolled past the hero edge,
   - fills the 2px accent scroll-progress hairline (#progress),
   - parallaxes any [data-parallax] hero background (skipped under
     prefers-reduced-motion).
   One rAF-throttled scroll handler. No inline script — CSP: script-src 'self'. */

(function () {
  'use strict';

  var bar = document.getElementById('topbar');
  if (!bar) return;

  var progress = document.getElementById('progress');
  var parallax = document.querySelector('[data-parallax]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.scrollingElement || document.documentElement;
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY || root.scrollTop || 0;

    bar.classList.toggle('solid', y > 48);

    if (progress) {
      var scrollable = root.scrollHeight - window.innerHeight;
      var p = scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0;
      progress.style.transform = 'scaleX(' + p + ')';
    }

    if (parallax && !reduce) {
      parallax.style.transform = 'translateY(' + (y * 0.1) + 'px)';
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();
