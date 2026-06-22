/* NID Studios — main.js
   Vanilla JS for: nav scroll, TrondheimClock, WorkboardPapers,
   PaperPlate manifesto, drawer accordion, IntersectionObserver reveals,
   WorkRoulette, and Formspree contact form. */

(function () {
  'use strict';

  // ── 1. TRONDHEIM CLOCK ───────────────────────────────────
  //   (Sticky-topbar scroll state lives in nav.js, loaded site-wide.)
  function trondheimContext() {
    const now = new Date();
    const fmt = function (opts) {
      return new Intl.DateTimeFormat('en-GB', Object.assign(
        { timeZone: 'Europe/Oslo', hour12: false }, opts
      )).format(now);
    };
    const hh = parseInt(fmt({ hour: '2-digit' }), 10);
    const mm = parseInt(fmt({ minute: '2-digit' }), 10);
    const localHour = hh + mm / 60;
    const timeStr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');

    const yearStart = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - yearStart) / 86400000);

    const lat   = 63.4 * Math.PI / 180;
    const delta = 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (dayOfYear - 80) / 365);
    const cosH  = -Math.tan(lat) * Math.tan(delta);

    var sunrise, sunset, isDay, progress;
    if (cosH > 1) {
      sunrise = 12; sunset = 12; isDay = false;
      progress = (localHour < 12 ? localHour + 12 : localHour - 12) / 24;
    } else if (cosH < -1) {
      sunrise = 0; sunset = 24; isDay = true;
      progress = localHour / 24;
    } else {
      var halfDay = Math.acos(cosH) * 12 / Math.PI;
      sunrise = 12 - halfDay;
      sunset  = 12 + halfDay;
      isDay   = localHour >= sunrise && localHour <= sunset;
      if (isDay) {
        progress = (localHour - sunrise) / (sunset - sunrise);
      } else {
        var nightLen     = 24 - (sunset - sunrise);
        var nightElapsed = localHour > sunset
          ? localHour - sunset
          : localHour + (24 - sunset);
        progress = nightElapsed / nightLen;
      }
    }
    return { timeStr: timeStr, isDay: isDay, progress: progress };
  }

  function renderClock(container) {
    var ctx = trondheimContext();
    var W = 64, H = 22, pad = 5;
    var horizonY = H - 4, peakY = 3;
    var x = pad + ctx.progress * (W - 2 * pad);
    var y = horizonY - (horizonY - peakY) * Math.sin(Math.PI * ctx.progress);
    var ns = 'http://www.w3.org/2000/svg';

    function svgEl(tag, attrs) {
      var e = document.createElementNS(ns, tag);
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
      return e;
    }

    var wrap = document.createElement('div');
    wrap.className = 'clock ' + (ctx.isDay ? 'clock--day' : 'clock--night');
    wrap.title = 'Trondheim — ' + (ctx.isDay ? 'day' : 'night');

    var svg = svgEl('svg', {
      'class': 'clock-arc',
      'viewBox': '0 0 ' + W + ' ' + H,
      'width': W, 'height': H, 'aria-hidden': 'true'
    });

    svg.appendChild(svgEl('line', {
      x1: pad - 1, y1: horizonY, x2: W - pad + 1, y2: horizonY,
      stroke: 'currentColor', 'stroke-width': '0.5', opacity: '0.28'
    }));
    svg.appendChild(svgEl('path', {
      d: 'M ' + pad + ' ' + horizonY + ' Q ' + (W / 2) + ' ' + (peakY - 4) + ' ' + (W - pad) + ' ' + horizonY,
      fill: 'none', stroke: 'currentColor', 'stroke-width': '0.4',
      'stroke-dasharray': '1.2 2', opacity: '0.22'
    }));
    svg.appendChild(svgEl('path', {
      'class': 'clock-cathedral',
      d: 'M 18 18 L 18 11 L 24 11 L 24 14 L 31.5 11 L 31.5 8 L 32 5 L 32.5 8 L 32.5 11 L 40 14 L 40 11 L 46 11 L 46 18 Z',
      fill: 'currentColor', opacity: '0.55'
    }));

    if (ctx.isDay) {
      var sunG = svgEl('g', { 'class': 'clock-sun' });
      [0, 45, 90, 135].forEach(function (a) {
        sunG.appendChild(svgEl('line', {
          x1: x - 5, y1: y, x2: x + 5, y2: y,
          transform: 'rotate(' + a + ' ' + x + ' ' + y + ')',
          stroke: 'var(--accent)', 'stroke-width': '0.55',
          'stroke-linecap': 'round', opacity: '0.55'
        }));
      });
      sunG.appendChild(svgEl('circle', { cx: x, cy: y, r: '2.6', fill: 'var(--accent)' }));
      svg.appendChild(sunG);
    } else {
      var moonG = svgEl('g', { 'class': 'clock-moon' });
      var defs  = svgEl('defs', {});
      var mask  = svgEl('mask', { id: 'clock-crescent' });
      mask.appendChild(svgEl('rect', { width: W, height: H, fill: 'white' }));
      mask.appendChild(svgEl('circle', { cx: x + 1.8, cy: y - 0.7, r: '2.5', fill: 'black' }));
      defs.appendChild(mask);
      moonG.appendChild(defs);
      moonG.appendChild(svgEl('circle', { cx: x, cy: y, r: '2.8', fill: 'currentColor', mask: 'url(#clock-crescent)' }));
      svg.appendChild(moonG);
    }

    wrap.appendChild(svg);
    var tSpan = document.createElement('span'); tSpan.className = 'clock-time'; tSpan.textContent = ctx.timeStr;
    var sSpan = document.createElement('span'); sSpan.className = 'clock-sep';  sSpan.textContent = '·';
    var lSpan = document.createElement('span'); lSpan.className = 'clock-loc';  lSpan.textContent = 'Trondheim';
    wrap.appendChild(tSpan); wrap.appendChild(sSpan); wrap.appendChild(lSpan);

    container.innerHTML = '';
    container.appendChild(wrap);
  }

  var clockEl = document.getElementById('clock');
  if (clockEl) {
    renderClock(clockEl);
    setInterval(function () { renderClock(clockEl); }, 30000);
  }

  // ── 3. WORKBOARD POST-ITS (home page) ───────────────────
  var workboard = document.querySelector('.workboard');
  if (workboard) {
    var BRIEFS = [
      { text: 'Can you make the logo just a little bigger?', from: '— the client, again' },
      { text: 'I want it to feel like Apple. But cheaper.',  from: '— brief #04' },
      { text: 'Make it pop. You\'ll know it when you see it.', from: '— 02:14 a.m.' },
      { text: 'Homepage. Blog. Shop. AI chatbot. By Friday?', from: '— sales, fwd' },
      { text: 'Less words. But also more information.',       from: '— round 3' },
      { text: 'My nephew said he could do it for kr 2 000.', from: '— overheard' },
      { text: 'Mobile-first. Tablet-first. Also a kiosk.',   from: '— stakeholder' },
      { text: 'Use AI for the copy. But it must sound human.', from: '— marketing' },
      { text: 'I want it timeless. And also very 2026.',     from: '— gut feeling' },
      { text: 'Just give it that Squarespace feeling.',       from: '— anonymous' },
      { text: 'Hamburger menu, AND visible at all times.',    from: '— UX guy' },
      { text: 'More white space. But fill the page.',         from: '— committee' },
    ];
    var COLORS  = ['#FEEE85','#FEEE85','#FEEE85','#FFB8C7','#FEEE85','#FEEE85','#FEEE85','#BBE6CB'];
    var UPPER   = [{ top:'30%',right:'6%', rot:-6 },{ top:'34%',right:'28%',rot:4 },{ top:'28%',right:'18%',rot:3 }];
    var LOWER   = [{ top:'62%',right:'32%',rot:6 },{ top:'64%',right:'4%', rot:-7 },{ top:'60%',right:'20%',rot:-5 }];

    function getLane(t) {
      return t % 2 === 0
        ? UPPER[Math.floor(t / 2) % UPPER.length]
        : LOWER[Math.floor(t / 2) % LOWER.length];
    }

    var wbTick = 0;

    function spawnNote() {
      var t     = wbTick++;
      var brief = BRIEFS[t % BRIEFS.length];
      var lane  = getLane(t);
      var color = COLORS[t % COLORS.length];

      var paper = document.createElement('div');
      paper.className = 'wb-paper';
      paper.style.setProperty('--wb-rot', lane.rot + 'deg');
      paper.style.setProperty('--wb-bg', color);
      paper.style.top   = lane.top;
      paper.style.right = lane.right;

      var noteSpan   = document.createElement('span'); noteSpan.className   = 'wb-paper-note';   noteSpan.textContent = brief.text;
      var bylineSpan = document.createElement('span'); bylineSpan.className = 'wb-paper-byline'; bylineSpan.textContent = brief.from;
      paper.appendChild(noteSpan);
      paper.appendChild(bylineSpan);
      workboard.appendChild(paper);

      // Remove after animation completes (7s)
      setTimeout(function () {
        if (paper.parentNode) paper.parentNode.removeChild(paper);
      }, 7100);
    }

    // Spawn first note immediately, then every 3.5s
    spawnNote();
    setInterval(spawnNote, 3500);
  }

  // ── 4. PAPER PLATE (manifesto video) ────────────────────
  var paperPlateReveal = document.getElementById('paper-plate-reveal');
  var paperPlateVideo  = document.querySelector('.paper-plate-video');
  if (paperPlateVideo && paperPlateReveal) {
    var FADE_IN_START  = 0.30;
    var FADE_IN_END    = 0.34;
    var FADE_OUT_START = 0.60;
    var FADE_OUT_END   = 0.66;

    var tryPlay = function () { paperPlateVideo.play().catch(function () {}); };
    if (paperPlateVideo.readyState >= 2) tryPlay();
    else paperPlateVideo.addEventListener('loadeddata', tryPlay, { once: true });

    function paperTick() {
      if (paperPlateVideo.duration) {
        var p = paperPlateVideo.currentTime / paperPlateVideo.duration;
        var op;
        if      (p < FADE_IN_START)  op = 0;
        else if (p < FADE_IN_END)    op = (p - FADE_IN_START)  / (FADE_IN_END  - FADE_IN_START);
        else if (p < FADE_OUT_START) op = 1;
        else if (p < FADE_OUT_END)   op = 1 - (p - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START);
        else                         op = 0;
        op = 1 - Math.pow(1 - op, 2); // easeOut
        paperPlateReveal.style.opacity   = op;
        paperPlateReveal.style.transform = 'translateY(' + ((1 - op) * 8) + 'px)';
      }
      requestAnimationFrame(paperTick);
    }
    requestAnimationFrame(paperTick);
  }

  // ── 5. DRAWER ACCORDION ──────────────────────────────────
  var drawers = document.querySelectorAll('.drawer');
  drawers.forEach(function (drawer) {
    var btn = drawer.querySelector('.drawer-pull');
    drawer.addEventListener('click', function () {
      var isOpen = drawer.classList.contains('open');
      // Close all
      drawers.forEach(function (d) {
        d.classList.remove('open');
        var b = d.querySelector('.drawer-pull');
        if (b) {
          b.setAttribute('aria-expanded', 'false');
          var label = b.querySelector('.pull-label');
          if (label) label.textContent = 'Open';
        }
      });
      // Open clicked one
      if (!isOpen) {
        drawer.classList.add('open');
        if (btn) {
          btn.setAttribute('aria-expanded', 'true');
          var label = btn.querySelector('.pull-label');
          if (label) label.textContent = 'Close';
        }
      }
    });
    // Keyboard: Enter/Space on drawer row
    drawer.setAttribute('tabindex', '0');
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        drawer.click();
      }
    });
  });

  // ── 6. INTERSECTION OBSERVER REVEALS ─────────────────────
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '-8% 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    // Fallback: show everything immediately
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  // ── 7. WORK ROULETTE (work page) ─────────────────────────
  var rouletteSection = document.querySelector('.work-roulette');
  if (rouletteSection) {
    var images     = rouletteSection.querySelectorAll('.roulette-image');
    var dots       = rouletteSection.querySelectorAll('.roulette-dot');
    var infoEl     = rouletteSection.querySelector('.roulette-info');
    var counterEl  = rouletteSection.querySelector('.roulette-counter');
    var titleMetaEl = rouletteSection.querySelector('.roulette-image-title');
    var progressEl = rouletteSection.querySelector('.roulette-progress');
    var DURATION   = 5500;
    var current    = 0;
    var paused     = false;
    var timer      = null;

    // Set background images from data-photo attribute
    images.forEach(function (img) {
      var photo = img.getAttribute('data-photo');
      if (photo) img.style.backgroundImage = 'url(/assets/photos/' + photo + ')';
    });

    function updateRoulette(idx) {
      current = idx;
      var total = images.length;

      // Swap active image
      images.forEach(function (img, i) {
        img.classList.toggle('active', i === idx);
        img.setAttribute('aria-hidden', i !== idx ? 'true' : 'false');
      });

      // Update counter + overlay title
      if (counterEl) counterEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
      var activeImg = images[idx];
      if (titleMetaEl && activeImg) {
        titleMetaEl.textContent = (activeImg.getAttribute('data-title') || '') + ' — ' + (activeImg.getAttribute('data-sector') || '') + ', ' + (activeImg.getAttribute('data-year') || '');
      }

      // Re-animate info panel
      if (infoEl && activeImg) {
        infoEl.innerHTML =
          '<div class="roulette-eyebrow">' + esc(activeImg.getAttribute('data-sector') || '') + ' · ' + esc(activeImg.getAttribute('data-year') || '') + '</div>' +
          '<h3 class="roulette-title">' + esc(activeImg.getAttribute('data-title') || '') + '</h3>' +
          '<p class="roulette-note">' + esc(activeImg.getAttribute('data-note') || '') + '</p>' +
          '<div class="roulette-tags"><span class="tg">' + esc(activeImg.getAttribute('data-tag') || '') + '</span></div>';
        // Restart slide-in animation
        infoEl.style.animation = 'none';
        infoEl.offsetHeight; // reflow
        infoEl.style.animation = '';
      }

      // Update dots
      dots.forEach(function (dot, i) {
        dot.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });

      // Restart progress bar
      if (progressEl) {
        var bar = progressEl.querySelector('span');
        if (bar) {
          bar.style.animation = 'none';
          bar.offsetHeight;
          bar.style.animation = '';
          bar.style.animationPlayState = paused ? 'paused' : 'running';
        }
      }
    }

    function advance() {
      updateRoulette((current + 1) % images.length);
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(advance, DURATION);
    }

    function pauseTimer()  { paused = true;  clearInterval(timer); pauseProgress(); }
    function resumeTimer() { paused = false; startTimer(); resumeProgress(); }

    function pauseProgress() {
      var bar = progressEl && progressEl.querySelector('span');
      if (bar) bar.style.animationPlayState = 'paused';
    }
    function resumeProgress() {
      var bar = progressEl && progressEl.querySelector('span');
      if (bar) bar.style.animationPlayState = 'running';
    }

    // Dot clicks
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        clearInterval(timer);
        updateRoulette(i);
        if (!paused) startTimer();
      });
    });

    // Pause on hover
    rouletteSection.addEventListener('mouseenter', pauseTimer);
    rouletteSection.addEventListener('mouseleave', resumeTimer);

    // Initialise
    updateRoulette(0);
    startTimer();
  }

  // ── 8. CONTACT FORM (Formspree) ──────────────────────────
  var formEl   = document.querySelector('form[data-formspree]');
  var statusEl = document.getElementById('form-status');
  if (formEl && statusEl) {
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = formEl.querySelector('button[type="submit"]');
      var origText = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      statusEl.textContent = '';
      statusEl.className   = 'form-status';

      fetch(formEl.action, {
        method:  'POST',
        body:    new FormData(formEl),
        headers: { Accept: 'application/json' },
      })
        .then(function (res) {
          if (res.ok) {
            if (btn) { btn.innerHTML = 'Sent — talk soon <span class="arr">✓</span>'; }
            statusEl.textContent = 'Message received. We\'ll be in touch.';
            statusEl.className   = 'form-status success';
            formEl.reset();
          } else {
            throw new Error('HTTP ' + res.status);
          }
        })
        .catch(function () {
          if (btn) { btn.innerHTML = origText; btn.disabled = false; }
          statusEl.textContent = 'Error sending — try emailing us directly.';
          statusEl.className   = 'form-status error';
        });
    });
  }

  // HTML-escape helper (used in roulette info injection)
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

}());
