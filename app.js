/* stallpack explained — page logic.
   No network calls (the CSP forbids them anyway). localStorage holds only the
   theme choice. The live demo runs the same integer-paise engine that
   data/reconcile.js exports and test/reconcile.test.js proves. */
'use strict';

(function () {
  var root = document.documentElement;
  root.classList.add('js');

  /* ---------- theme toggle ---------- */
  var THEME_KEY = 'stallpack-explained.theme';
  var toggle = document.getElementById('theme-toggle');

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function effectiveTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return systemPrefersDark() ? 'dark' : 'light';
  }
  function applyTheme(t) {
    if (t === 'dark' || t === 'light') {
      root.setAttribute('data-theme', t);
    } else {
      root.removeAttribute('data-theme');
    }
    if (toggle) toggle.setAttribute('aria-pressed', String(effectiveTheme() === 'dark'));
  }
  try {
    applyTheme(localStorage.getItem(THEME_KEY));
  } catch (e) { /* storage may be unavailable; theme stays on system preference */ }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* non-fatal */ }
    });
  }

  /* ---------- scroll-triggered stage animations ---------- */
  var animated = Array.prototype.slice.call(document.querySelectorAll('.anim, .feature-grid'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    animated.forEach(function (el) { io.observe(el); });
  } else {
    animated.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- live one-item demo ---------- */
  /* Engine functions come from data/reconcile.js (loaded before this file). */
  var state = { carried: 30, returned: 12 };
  var MAX_QTY = 999;

  var elCarried = document.getElementById('d-carried');
  var elReturned = document.getElementById('d-returned');
  var elPrice = document.getElementById('d-price');
  var elTakings = document.getElementById('d-takings');
  var outSold = document.getElementById('o-sold');
  var outExpected = document.getElementById('o-expected');
  var outVariance = document.getElementById('o-variance');
  var verdictWrap = document.getElementById('o-verdict-wrap');
  var outNote = document.getElementById('o-note');

  var DEFAULT_NOTE = 'Returned can never exceed carried — the app clamps it, so a slip of the thumb can’t invent sales.';

  function render() {
    if (!elCarried) return;
    elCarried.textContent = String(state.carried);
    elReturned.textContent = String(state.returned);

    var pricePaise = parseRupees(elPrice.value);
    var takingsPaise = parseRupees(elTakings.value);
    elPrice.setAttribute('aria-invalid', String(pricePaise === null));
    elTakings.setAttribute('aria-invalid', String(takingsPaise === null));

    var sold = soldUnits(state.carried, state.returned);
    outSold.textContent = sold === null ? '—' : String(sold);

    if (sold === null || pricePaise === null) {
      outExpected.textContent = '—';
      outVariance.textContent = '—';
      outNote.textContent = 'Enter a price in rupees with at most 2 decimals (e.g. 50 or 120.50).';
      return;
    }
    var expected = lineExpectedPaise(sold, pricePaise);
    outExpected.textContent = formatPaise(expected);

    if (takingsPaise === null) {
      outVariance.textContent = '—';
      outNote.textContent = 'Enter the takings you counted, in rupees with at most 2 decimals.';
      return;
    }
    var variance = takingsPaise - expected;
    verdictWrap.classList.remove('is-match', 'is-over');
    if (variance === 0) {
      verdictWrap.classList.add('is-match');
      outVariance.textContent = formatPaise(0) + ' · matches';
    } else if (variance > 0) {
      verdictWrap.classList.add('is-over');
      outVariance.textContent = '+' + formatPaise(variance) + ' · over';
    } else {
      outVariance.textContent = formatPaise(variance) + ' · short';
    }
    outNote.textContent = DEFAULT_NOTE;
  }

  Array.prototype.forEach.call(document.querySelectorAll('.step-btn'), function (btn) {
    btn.addEventListener('click', function () {
      var which = btn.getAttribute('data-step');
      var delta = parseInt(btn.getAttribute('data-delta'), 10);
      if (which === 'carried') {
        state.carried = Math.min(MAX_QTY, Math.max(0, state.carried + delta));
        if (state.returned > state.carried) state.returned = state.carried; // clamp
      } else {
        state.returned = Math.min(state.carried, Math.max(0, state.returned + delta));
      }
      render();
    });
  });
  if (elPrice) elPrice.addEventListener('input', render);
  if (elTakings) elTakings.addEventListener('input', render);
  render();
})();
