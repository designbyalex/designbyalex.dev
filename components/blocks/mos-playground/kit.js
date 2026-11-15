/* Mos Urban component kit (#172): behaviour for the eight components in markup.ts.
   initMosKit(root) wires every .mos-c[data-c] inside root, once per element, and returns a cleanup that stops
   every timer, animation, observer and document listener it started. All queries stay inside the component.
   Rebuilt from the shipped embeds: global-site-navbar, global-link-button, home-carousel + home-hero-styles,
   products-template-slider-motion + template-interaction, filters-shared + projects-filters + filters-popover-fit
   + projects-view-toggle, products-template-specs-accordion, list-motion. GSAP's power4 twins are written as the
   design-system curves they stand for (house cubic-bezier(.83,0,.17,1), out cubic-bezier(.22,1,.36,1)). */
var RM = null;
var HOUSE = 'cubic-bezier(.83,0,.17,1)', OUT = 'cubic-bezier(.22,1,.36,1)';
var apis = new WeakMap();
// The cleanups of the init call in progress; each component pushes its own.
var cleanups = [];
function onCleanup(fn) { cleanups.push(fn); }
// Every listener a component adds goes through listen(), tied to its init's AbortController, so cleanup removes them.
var signal = null;
// Listeners added later (filter tags, the popover's outside click) are removed with their elements or by hand.
function listen(el, type, fn, capture) { el.addEventListener(type, fn, signal ? { capture: !!capture, signal: signal } : !!capture); }

function $(r, s) { return r.querySelector(s); }
function $$(r, s) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
function pad(k) { return (k < 10 ? '0' : '') + k; }
function raf2(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }
function reduced() {
  if (!RM) RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  return RM.matches;
}
function focusables(el) {
  return $$(el, 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), [tabindex]:not([tabindex="-1"])')
    .filter(function (x) { return x.getClientRects().length && !x.closest('[inert]'); });
}
function trap(e, list) {
  if (e.key !== 'Tab' || !list.length) return;
  var i = list.indexOf(document.activeElement);
  e.preventDefault();
  list[i < 0 ? 0 : (i + (e.shiftKey ? list.length - 1 : 1)) % list.length].focus({ preventScroll: true });
}

/* ------------------------------------------------------------ 1. Menu */
function menu(c) {
  var vp = $(c, '.m-viewport'), btn = $(c, '.navbar_menu-button'), nav = $(c, '.navbar_menu'), ov = $(c, '.overlay_background');
  if (!vp || !btn || !nav) return {};
  var open = false;
  function set(on) {
    open = on;
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Close' : 'Menu');
    nav.inert = !on;
    if (on) {
      vp.classList.add('is-open');
      // two frames later, so the labels have a painted start state (PBI-0015)
      raf2(function () { if (open) vp.classList.add('is-nav-open'); });
    } else {
      vp.classList.remove('is-nav-open', 'is-open');
    }
  }
  set(false);
  listen(btn, 'click', function () { set(!open); });
  if (ov) listen(ov, 'click', function () { set(false); btn.focus({ preventScroll: true }); });
  listen(c, 'keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); set(false); btn.focus({ preventScroll: true }); return; }
    trap(e, [btn].concat(focusables(nav)));
  });
  return { close: function () { set(false); } };
}

/* -------------------------------------------------------- 4. Hero carousel */
function hero(c) {
  var root = $(c, '.home-hero_tabs');
  var slides = $$(c, '.home-hero_content-item'), picks = $$(c, '.home-hero_tab-item'), n = slides.length;
  if (!root || !n) return {};
  var cnt = $(c, '.home-hero_counter'), nm = $(c, '.home-hero_name'), live = $(c, '.home-hero_content-list'), pauseBtn = $(c, '.home-hero_pause');
  var DWELL = 8000, WIPE = 1400;
  var names = picks.map(function (p) { return p.getAttribute('data-name') || ''; });
  var fills = picks.map(function (p) { return $(p, '.home-hero_progress-fill'); });
  var idx = 0, busy = false, prog = null, kb = [], reasons = {};
  var still = reduced() || n < 2;

  function held() { return !!(reasons.offscreen || reasons.user); }
  function paint(i) {
    picks.forEach(function (b, k) {
      b.classList.toggle('is-tab-active', k === i);
      b.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
    if (cnt) cnt.textContent = pad(i + 1) + ' / ' + pad(n);
    if (nm) nm.textContent = names[i] || '';
  }
  // normalise (also for a clone of a running carousel)
  $$(c, '[data-m-text]').forEach(function (h) { h.textContent = h.getAttribute('data-m-text'); h.removeAttribute('data-m-text'); });
  slides.forEach(function (s, k) { s.classList.toggle('is-content-active', k === 0); s.classList.remove('is-leaving'); });
  paint(0);

  function ken(i) {
    kb.forEach(function (a) { a.cancel(); });
    kb = [];
    if (still) return;
    $$(slides[i], '.home-hero_image').forEach(function (im) {
      kb.push(im.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }], { duration: DWELL, easing: 'linear', fill: 'forwards' }));
    });
    if (held()) kb.forEach(function (a) { a.pause(); });
  }
  // Paused or no autoplay: the active bar rests full (CSS). Playing: a fresh dwell from empty.
  function startTimer(i) {
    if (prog) { prog.onfinish = null; prog.cancel(); prog = null; }
    if (still || reasons.user) return;
    prog = fills[i].animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DWELL, easing: 'linear', fill: 'forwards' });
    prog.onfinish = function () { go((i + 1) % n, 1, false); };
    if (held()) prog.pause();
  }
  function hold(key, on) {
    reasons[key] = on;
    var any = held();
    if (prog) { if (any) prog.pause(); else prog.play(); }
    kb.forEach(function (a) { if (any) a.pause(); else a.play(); });
  }

  // SplitText's mask:"lines", by hand: measure word tops, wrap each line in a clipping mask, restore after.
  function split(h) {
    var text = h.textContent, words = text.trim().split(/\s+/);
    h.setAttribute('data-m-text', text);
    h.textContent = '';
    var spans = words.map(function (w, k) {
      var s = document.createElement('span'); s.textContent = w;
      h.appendChild(s); if (k < words.length - 1) h.appendChild(document.createTextNode(' '));
      return s;
    });
    var lines = [], top = null;
    spans.forEach(function (s) {
      var t = s.offsetTop;
      if (top === null || Math.abs(t - top) > 2) { lines.push([]); top = t; }
      lines[lines.length - 1].push(s.textContent);
    });
    h.textContent = '';
    var inner = lines.map(function (l) {
      var m = document.createElement('span'), i = document.createElement('span');
      m.className = 'm-line'; i.textContent = l.join(' '); i.style.whiteSpace = 'nowrap';
      m.appendChild(i); h.appendChild(m); return i;
    });
    return { lines: inner, restore: function () { h.textContent = text; h.removeAttribute('data-m-text'); } };
  }

  function go(next, dir, user) {
    if (next === idx || busy) return;
    var from = idx, to = next;
    idx = to;
    if (user && live) { live.setAttribute('aria-live', 'polite'); setTimeout(function () { live.setAttribute('aria-live', 'off'); }, 1200); }
    if (prog) { prog.onfinish = null; prog.cancel(); prog = null; }
    paint(to);
    var sf = slides[from], st = slides[to];
    if (reduced()) {
      sf.classList.remove('is-content-active'); st.classList.add('is-content-active');
      startTimer(to);
      return;
    }
    busy = true;
    sf.classList.add('is-leaving'); sf.classList.remove('is-content-active'); st.classList.add('is-content-active');
    var wrap = $(st, '.home-hero_image-wrapper'), imgs = $$(st, '.home-hero_image');
    var copyF = $(sf, '.home-hero_content-wrapper'), copyT = $(st, '.home-hero_content-wrapper');
    var head = $(st, '.heading-style-h2'), cta = $(st, '.button-group');
    // the wipe follows the direction of travel: forward reveals left to right
    var start = dir > 0 ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)';
    var wipe = wrap.animate([{ clipPath: start }, { clipPath: 'inset(0% 0% 0% 0%)' }], { duration: WIPE, easing: HOUSE });
    imgs.forEach(function (im) { im.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: WIPE, easing: OUT }); });
    var out = copyF.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: HOUSE, fill: 'forwards' });
    copyT.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 300, fill: 'backwards' });
    var sp = head ? split(head) : null, lineAnims = [];
    if (sp) sp.lines.forEach(function (l, k) {
      lineAnims.push(l.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { duration: 900, delay: 300 + k * 60, easing: OUT, fill: 'backwards' }));
    });
    if (cta) cta.animate([{ transform: 'translateY(45%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 700, delay: 570, easing: OUT, fill: 'backwards' });
    wipe.onfinish = function () {
      sf.classList.remove('is-leaving');
      out.cancel();
      busy = false;
      ken(to);
    };
    Promise.all(lineAnims.map(function (a) { return a.finished; })).then(function () { if (sp) sp.restore(); }, function () { if (sp) sp.restore(); });
    startTimer(to);
  }

  picks.forEach(function (b, i) {
    listen(b, 'click', function () { go(i, i > idx ? 1 : -1, true); });
    listen(b, 'keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var t = (i + d + n) % n;
      picks[t].focus();
      go(t, d, true);
    });
  });

  // touch swipe (the site uses GSAP Observer on coarse pointers)
  var sx = null;
  listen(root, 'pointerdown', function (e) { if (e.pointerType !== 'mouse') sx = e.clientX; });
  listen(root, 'pointerup', function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 40 && n > 1) go(dx < 0 ? (idx + 1) % n : (idx - 1 + n) % n, dx < 0 ? 1 : -1, true);
  });

  // pause control (WCAG 2.2.2): only when autoplay runs
  if (pauseBtn && !still) {
    var icon = $(pauseBtn, 'path'), PAUSE_D = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z', PLAY_D = 'M8 5v14l11-7z';
    var setPaused = function (p) {
      pauseBtn.classList.toggle('is-paused', p);
      pauseBtn.setAttribute('aria-label', p ? 'Play carousel' : 'Pause carousel');
      if (icon) icon.setAttribute('d', p ? PLAY_D : PAUSE_D);
    };
    setPaused(false);
    pauseBtn.hidden = false;
    root.classList.add('is-pause-ready');
    listen(pauseBtn, 'click', function () {
      var p = !reasons.user;
      setPaused(p);
      hold('user', p);
      startTimer(idx);
    });
  } else if (pauseBtn) { pauseBtn.hidden = true; }

  root.classList.add('is-ready');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { hold('offscreen', !es[es.length - 1].isIntersecting); }, { threshold: 0.15 });
    io.observe(root);
    onCleanup(function () { io.disconnect(); });
  }
  ken(0);
  startTimer(0);
  onCleanup(function () {
    if (prog) { prog.onfinish = null; prog.cancel(); prog = null; }
    kb.forEach(function (a) { a.cancel(); });
    kb = [];
  });
  return { go: function (i) { go(i, i > idx ? 1 : -1, true); } };
}

/* -------------------------------------------------------- 5. Gallery slider */
function gallery(c) {
  var track = $(c, '.cms-slider_track'), slides = $$(c, '.cms-slider_slide'), dots = $$(c, '.w-slider-dot');
  var prev = $(c, '.slider-arrow.is-bottom-previous'), next = $(c, '.slider-arrow.is-bottom-next'), n = slides.length, i = 0;
  if (!track || !n) return {};
  function w() { return slides[0].offsetWidth || 1; }
  function vis() {
    var gap = parseFloat(getComputedStyle(slides[0]).paddingRight) || 0;
    return Math.max(1, Math.floor((track.clientWidth + gap) / w()));
  }
  function max() { return Math.max(0, n - vis()); }
  function arrow(a, off) {
    a.setAttribute('aria-disabled', off ? 'true' : 'false');
    a.tabIndex = off ? -1 : 0;
  }
  function sync() {
    dots.forEach(function (d, k) { d.classList.toggle('w-active', k === i); d.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    var m = max();
    arrow(prev, i <= 0); arrow(next, i >= m);
    // #470: every card fits, so the arrows and dots go, and the arrow row with them
    var off = !m;
    prev.style.display = next.style.display = off ? 'none' : '';
    var nav = $(c, '.cms-slider_nav'); if (nav) nav.style.display = off ? 'none' : '';
    track.style.paddingBottom = off ? '0' : '';
  }
  // each card moves on its own: 700ms house, 60ms apart (max 5 steps); forward the left card leads, back the right-hand visible card
  function place(dir) {
    var v = vis(), step = w();
    slides.forEach(function (s, k) {
      var o = dir > 0 ? k - i : dir < 0 ? i + v - 1 - k : 0;
      s.style.setProperty('--m-d', reduced() ? '0ms' : Math.min(Math.max(o, 0), 5) * 60 + 'ms');
      s.style.setProperty('--m-x', (-i * step) + 'px');
      s.setAttribute('aria-hidden', k < i || k >= i + v ? 'true' : 'false');
      s.inert = k < i || k >= i + v;
    });
    sync();
  }
  function snap() { track.classList.add('is-snap'); place(0); void track.offsetWidth; track.classList.remove('is-snap'); }
  function go(t) { t = Math.max(0, Math.min(n - 1, t)); if (t === i) return; var d = t > i ? 1 : -1; i = t; place(d); }
  listen(prev, 'click', function () { if (i > 0) go(i - 1); });
  listen(next, 'click', function () { if (i < max()) go(i + 1); });
  dots.forEach(function (d, k) { listen(d, 'click', function () { go(k); }); });
  listen(track, 'keydown', function (e) {
    if (e.target.closest('.cms-slider_nav') || e.target.closest('.slider-arrow')) {
      if (e.key === 'ArrowRight' && i < max()) { e.preventDefault(); go(i + 1); }
      if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); go(i - 1); }
    }
  });
  // swipe / drag
  var sx = null, dragged = false;
  listen(track, 'pointerdown', function (e) { if (e.button === 0 && !e.target.closest('.slider-arrow, .cms-slider_nav')) { sx = e.clientX; dragged = false; } });
  listen(track, 'pointerup', function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 40) { dragged = true; if (dx < 0 && i < max()) go(i + 1); else if (dx > 0 && i > 0) go(i - 1); }
  });
  listen(track, 'click', function (e) { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
  listen(track, 'dragstart', function (e) { e.preventDefault(); });
  snap();
  if ('ResizeObserver' in window) {
    var t, ro = new ResizeObserver(function () { clearTimeout(t); t = setTimeout(snap, 150); });
    ro.observe(c);
    onCleanup(function () { ro.disconnect(); clearTimeout(t); });
  }
  return { go: go };
}

/* ------------------------------------------------------------ 6. Filter bar */
// All 136 projects on staging /projects (12 pages of 12, read 2026-11-13): name|location|typology|state|range bits|category bits.
var FIELDS = {"Typology": ["Commercial", "Community Centre", "Education & Child Care", "Health & Aged Care", "Hospitality", "Local Council", "Mixed Development", "Residential Development", "Retail", "Sports & Entertainment", "Town Centre", "Transport", "Urban Development"], "State": ["ACT", "NSW", "QLD", "SA", "VIC", "WA"], "Category": ["Seats", "Benches", "Chairs", "Stools", "Tables", "Platforms", "Bins", "Bike Racks", "Bollards", "Picnic Sets", "Cafe Sets", "Bar Sets", "Podiums"], "Range": ["Oxley", "Sturt", "Verge", "Eyre", "Rollo", "Taylor", "Custom"]};
var DATA_SRC = "100 Wickham Street|Fortitude Valley|0|2|1|64\n309 Kent St|Sydney|0|1|71|83\nAbbotsleigh|Wahroonga|2|1|1|34\nAlira Wetland|Berwick|12|4|1|129\nAmara Apartments|Booragoon|7|5|1|193\nAMRF – First Building|Bringelly|0|1|4|1\nAnchorage Park|Shell Cove|12|1|1|530\nAqualand|Greenacre|9|1|64|1\nAscham School|Edgecliff|2|1|8|274\nAshfield Boys High|Ashfield|2|1|1|3\nBankstown Metro|Bankstown|11|1|68|1\nBay Pavilions|Batemans Bay|9|1|1|64\nBeenleigh Streetscape|Beenleigh|10|2|2|19\nBosch Rooftop|Clayton|0|4|67|602\nBurwood Girls High|Burwood|2|1|1|594\nByron Bay – Railway Park|Byron Bay|10|1|64|9\nByron Bay – Visitor Centre|Byron Bay|10|1|64|1\nCarmel Village|Box Hill|8|1|2|90\nCarseldine Village|Carseldine|10|2|9|755\nCastle Towers Shopping Centre|Castle Hill|8|1|35|65\nCathwest College – Loyola|Mt Druitt|2|1|1|531\nCathwest College – McCarthy|Emu Plains|2|1|1|531\nCaves Lane|Dulwich Hill|5|1|64|64\nCity Life Church|Wantirna South|1|4|3|451\nCloverton Estate|Kalkallo|12|4|9|403\nCoffs Civic Centre|Coffs Harbour|1|1|70|35\nCommonwealth Bank Roof Terrace|Darling Square|0|1|64|1\nDementia Gardens – North Ryde|North Ryde|3|1|64|3\nDementia Gardens – Port Macquarie|Port Macquarie|3|1|64|3\nDept. Social Services|Tuggeranong|0|0|1|531\nDHL Leppington|Leppington|0|1|2|1\nEastwood Private Hospital|Eastwood|3|3|4|31\nEdmonson Park – Display Village|Edmonson Park|12|1|2|7\nEdmonson Park – Eat Street|Edmonson Park|12|1|34|81\nEdward Eager Centre|Surry Hills|3|1|37|82\nEndeavour Sports High|Caringbah|2|1|1|595\nEstate Sports Field|Catherine Park Estate|7|1|2|19\nFairwater|Blacktown|12|1|2|32\nFootscray Hospital|Footscray|3|4|7|63\nFraser Rise Community Centre|Fraser Rise|1|4|4|3\nGinninderry|Belconnen|12|0|1|787\nGlenaeon Village Renewal|Belrose|12|1|66|1\nGold Coast Airport|Gold Coast|11|2|4|7\nGreenway Plaza|Wetherill Park|4|1|1|530\nGreenway Plaza – ACAI House|Wetherill Park|4|1|4|25\nGreenway Plaza – Kiosks|Wetherill Park|4|1|2|82\nGT Cafe|Homebush|4|1|4|538\nHankcock Lane|Rozelle|5|1|65|65\nHarold Park|Forest Lodge|7|1|1|531\nHeart of Drummoyne|Drummoyne|10|1|6|30\nHercules Street|Ashfield|5|1|2|19\nHighpoint Hurstville|Hurstville|7|1|11|194\nHurlstone Park Community Room|Hurlstone Park|1|1|4|3\nHurstville Town Centre|Hurstville|10|1|64|562\nICC Darling Harbour|Darling Harbour|12|1|67|64\nIGLU Summer Hill|Summer Hill|7|1|4|17\nJames Ruse Agricultural High|Carlingford|2|1|1|3\nJubilee|Wyndham Vale|12|4|1|64\nKing's Leigh Reserve|Werribee|12|4|3|594\nLighthouse|Dee Why|0|1|64|1\nLinear Park|Glenmore Park|12|1|3|19\nLyndarum North Reserve|Lyndarum North|5|4|1|690\nMAB New Quay|Docklands|7|4|1|530\nMajura Park Shopping Centre|Majura Park|0|0|1|1\nManor Lakes|Werribee|12|4|1|595\nMascot Square|Mascot|7|1|1|64\nMeridian Estate|Clyde North|12|4|3|531\nMoore Park Tennis Centre|Moore Park|9|1|1|530\nMt Aitken Reserve|Greenvale|12|4|2|19\nMyella Estate|Wanneroo|12|5|9|83\nNarellan Town Centre|Narellan|10|1|0|0\nNewcastle Light Rail|Newcastle|11|1|1|2\nNorton Street|Leichhardt|5|1|2|19\nOakhill College|Castle Hill|2|1|7|3\nOasis Residences|South Melbourne|7|4|68|2\nOran Park|Oran Park|0|1|66|65\nPagewood by Silkari|Banksmeadow|7|1|4|3\nPark Sydney|Alexandria|12|1|6|27\nParramatta Leagues Club|Eels Place, Parramatta|9|1|2|65\nParramatta Light Rail|Parramatta|11|1|66|3\nPaw Park|Catherine Park Estate|7|1|2|2\nPeace Reserve|Newtown|10|1|2|19\nPirrama Park|Pyrmont|5|1|1|32\nPlayground Park|Catherine Park Estate|12|1|2|51\nPocket Park|Catherine Park Estate|12|1|2|1\nPoly Horizon|Epping|7|1|1|65\nPunchbowl Metro Station|Punchbowl|11|1|64|1\nQuay Quarter – Bar Stools|Sydney|6|1|64|8\nQuay Quarter – Curved Seating|Sydney|6|1|64|1\nQuay Quarter – Podium|Sydney|6|1|64|4098\nQuay Quarter – Round Stools|Sydney|6|1|64|8\nQuay Quarter Tower|Sydney|6|1|0|0\nQueen's Wharf – Podium|Brisbane|12|2|64|1\nQueen's Wharf – Waterline Park|Brisbane|12|2|1|65\nRobbins Lane|Catherine Park Estate|7|1|2|1\nRobin Wiles Park|North St Marys|5|1|2|3\nRosebery Engine Yard|Rosebery|12|1|1|3\nRosenthal Estate|Sunbury|12|4|1|1\nRussell Lea Public School|Russell Lea|2|1|1|66\nRydalmere Park|Rydalmere|9|1|5|595\nSanctuary – Wentworth Point|Wentworth Point|7|1|3|595\nScape Kensington|Kensington|7|1|4|2\nShell Cove – Marina|Shell Cove|12|1|1|115\nShell Cove – Waterfront|Shell Cove|0|1|2|1\nShore School|North Sydney|2|1|65|64\nSouth City Square|Woolloongabba|6|2|1|64\nSouthern Cross Care|North Turramurra|3|1|32|1\nSPD Wahroonga|Wahroonga|0|1|70|82\nStanley Street|Kogarah|7|1|8|530\nSt Clare's College|Griffith|2|0|2|19\nSt George Hospital|Kogarah|3|1|6|21\nSt Mary's College|Sydney|2|1|68|25\nSub Base Platypus|North Sydney|12|1|64|514\nSurry Hills Shopping Centre|Surry Hills|0|1|1|64\nSydney Street|St Marys|5|1|4|385\nTaronga Zoo|Mosman|9|1|8|3\nThe Club Stand|Flemington|9|4|33|64\nThe Grove|Randwick|3|1|68|3\nThe Rocks|The Rocks|5|1|1|64\nThomas Holt Drive|Macquarie Park|0|1|4|27\nTrue North Reserve|Keilor Park|5|4|4|19\nV by Crown|Parramatta|7|1|1|2\nVeridian|Kogarah|7|1|2|18\nWaverley Bowling Club|Waverley|0|1|2|1\nWesley College|Camperdown|2|1|68|57\nWestbrook Estate|Wyndham Vale|12|4|1|595\nWest Coast Eagles HQ|Lathlain Park|9|5|3|66\nWestern Sydney CC|Penrith|9|1|14|259\nWestern Sydney Startup Hub|North Parramatta|0|1|4|3\nWestmead Childrens Hospital|Westmead|12|1|4|31\nWestmead Hospital|Westmead|3|1|6|3\nWest Parade|West Ryde|11|1|4|1\nWestwood Estate|Fraser Rise|12|4|1|658\nWindermere|Mambourin|12|4|3|82\nWoods Estate|Mickleham|12|4|2|19\nYeo Park|Ashfield|5|1|4|1";
var DATA = null;
function bits(list, mask) { return list.filter(function (_, k) { return mask & (1 << k); }); }
function data() {
  if (DATA) return DATA;
  DATA = DATA_SRC.split('\n').map(function (row) {
    var f = row.split('|'), p = {
      name: f[0], loc: f[1],
      Typology: [FIELDS.Typology[+f[2]]], State: [FIELDS.State[+f[3]]],
      Range: bits(FIELDS.Range, +f[4]), Category: bits(FIELDS.Category, +f[5])
    };
    p.hay = [p.name, p.loc].concat(p.Typology, p.State, p.Range, p.Category).join(' ').toLowerCase();
    return p;
  });
  return DATA;
}
// Finsweet List semantics: OR inside a field, AND across fields, keyword words all present in any field.
function matches(p, sel, kw, skip) {
  for (var f in sel) {
    if (f === skip || !sel[f].length) continue;
    var ok = false;
    for (var k = 0; k < sel[f].length; k++) if (p[f].indexOf(sel[f][k]) >= 0) { ok = true; break; }
    if (!ok) return false;
  }
  if (kw) { var ws = kw.split(/\s+/); for (var j = 0; j < ws.length; j++) if (p.hay.indexOf(ws[j]) < 0) return false; }
  return true;
}

function filters(c) {
  var sec = $(c, '.section_filters3'), modal = $(c, '.filters3_modal'), btn = $(c, '.filters3_filters-button');
  var tags = $(c, '.filters3_tags-wrapper'), tpl = $(c, '.m-tag-tpl'), res = $(c, '.m-results'), items = $(c, '.m-items');
  var input = $(c, '.filters3_search-input'), panel = $(c, '.filters3_modal-content-wrapper');
  var boxes = $$(c, 'input[type=checkbox][data-field]');
  if (!sec || !modal || !btn) return {};
  var D = data(), sel = { Typology: [], State: [], Category: [], Range: [] }, kw = '', open = false, shown = D.length, tween = null, rf = 0, ft = 0, shut = 0;
  if (items) items.textContent = D.length;
  if (res) res.textContent = D.length;

  function count(s, skip) { var k = 0; for (var i = 0; i < D.length; i++) if (matches(D[i], s, kw, skip)) k++; return k; }
  function setCount(v) {
    if (!res) return;
    cancelAnimationFrame(rf); clearTimeout(ft); if (tween) { tween.cancel(); tween = null; }
    var a = shown, b = v;
    if (reduced() || a === b) { shown = b; res.textContent = b; return; }
    // lands the number even where frames are throttled (a background tab)
    ft = setTimeout(function () { cancelAnimationFrame(rf); if (tween) { tween.cancel(); tween = null; } shown = b; res.textContent = b; }, 560);
    // whole numbers from the number on screen to the new one, 500ms on the house curve (list-motion, target 3)
    tween = res.animate([], { duration: 500, easing: HOUSE, fill: 'both' });
    rf = requestAnimationFrame(function f() {
      if (!tween) return;
      if (tween.playState === 'finished') { tween.cancel(); tween = null; shown = b; res.textContent = b; return; }
      shown = Math.round(a + (b - a) * (tween.effect.getComputedTiming().progress || 0));
      res.textContent = shown;
      rf = requestAnimationFrame(f);
    });
  }
  function render() {
    boxes.forEach(function (x) {
      var f = x.getAttribute('data-field'), v = x.value, on = sel[f].indexOf(v) >= 0, lab = x.closest('label');
      x.checked = on;
      lab.classList.toggle('is-active', on);
      var trial = {}; for (var g in sel) trial[g] = g === f ? [v] : sel[g];
      lab.classList.toggle('is-list-emptyfacet', !on && count(trial) === 0);
    });
    tags.textContent = '';
    var add = function (label, remove) {
      var t = tpl.content.firstElementChild.cloneNode(true);
      $(t, '.text-style-label').textContent = label;
      t.setAttribute('aria-label', 'Remove ' + label);
      listen(t, 'click', function () { remove(); render(); });
      tags.appendChild(t);
    };
    if (kw) add(input.value.trim(), function () { input.value = ''; kw = ''; });
    Object.keys(sel).forEach(function (f) {
      sel[f].forEach(function (v) { add(v, function () { sel[f] = sel[f].filter(function (x) { return x !== v; }); }); });
    });
    setCount(count(sel));
  }
  function clearAll() { for (var f in sel) sel[f] = []; kw = ''; input.value = ''; render(); }

  function popover() { return c.clientWidth >= 768; }
  function measure() { if (open && popover()) sec.style.setProperty('--m-open-pad', modal.offsetHeight + 'px'); else sec.style.removeProperty('--m-open-pad'); }
  function outside(e) { if (!modal.contains(e.target) && !btn.contains(e.target)) setOpen(false); }
  function setOpen(on) {
    if (on === open) return;
    open = on;
    clearTimeout(shut);
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    modal.inert = !on;
    if (on) {
      modal.removeAttribute('aria-hidden');
      sec.classList.add('is-open');
      modal.classList.add('is-open');
      measure();
      var f = focusables(panel)[0]; if (f) f.focus({ preventScroll: true });
      listen(document, 'pointerdown', outside, true);
    } else {
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('is-open');
      document.removeEventListener('pointerdown', outside, true);
      // keep the room until the fade (200ms) or the slide (300ms) has finished
      shut = setTimeout(function () { sec.classList.remove('is-open'); measure(); }, reduced() ? 0 : popover() ? 200 : 300);
    }
  }
  // normalise (also for a clone of an open bar)
  modal.inert = true;
  modal.classList.remove('is-open'); sec.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
  btn.setAttribute('aria-expanded', 'false');
  listen(btn, 'click', function (e) { e.preventDefault(); setOpen(!open); });
  listen(modal, 'click', function (e) {
    if (e.target.closest('.filters3_modal-background-overlay, .filters3_tablet-modal-close-button, .m-close')) { setOpen(false); btn.focus({ preventScroll: true }); }
  });
  listen(c, 'keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') { setOpen(false); btn.focus({ preventScroll: true }); return; }
    if (!popover()) trap(e, focusables(panel));
  });
  boxes.forEach(function (x) {
    listen(x, 'change', function () {
      var f = x.getAttribute('data-field'), v = x.value, lab = x.closest('label');
      if (lab.classList.contains('is-list-emptyfacet') && x.checked) { x.checked = false; return; }
      sel[f] = sel[f].filter(function (y) { return y !== v; });
      if (x.checked) sel[f].push(v);
      render();
    });
  });
  $$(c, '.m-clear-group').forEach(function (b) { listen(b, 'click', function () { sel[b.getAttribute('data-field')] = []; render(); }); });
  $$(c, '.m-clear-all').forEach(function (b) { listen(b, 'click', function (e) { e.preventDefault(); clearAll(); }); });
  var deb;
  listen(input, 'input', function () {
    clearTimeout(deb);
    deb = setTimeout(function () { kw = input.value.trim().toLowerCase(); render(); }, 200);
  });
  listen(input, 'keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
  $$(c, '.projects_view-button').forEach(function (b, k, all) {
    listen(b, 'click', function () { all.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); });
  });
  var mro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
  if (mro) mro.observe(modal);
  onCleanup(function () {
    if (mro) mro.disconnect();
    document.removeEventListener('pointerdown', outside, true);
    clearTimeout(shut); clearTimeout(deb); clearTimeout(ft); cancelAnimationFrame(rf);
    if (tween) { tween.cancel(); tween = null; }
  });
  render();
  return { clear: clearAll, open: function () { setOpen(true); }, close: function () { setOpen(false); } };
}

/* --------------------------------------------------------- 7. Specs accordion */
function specs(c) {
  $$(c, '.accordion_item').forEach(function (it) {
    it.classList.remove('is-closed');
    var q = $(it, '.accordion_question');
    if (q) { q.setAttribute('role', 'button'); q.tabIndex = 0; q.setAttribute('aria-expanded', 'true'); }
  });
  function toggle(q) {
    var it = q.closest('.accordion_item'), closed = it.classList.toggle('is-closed');
    q.setAttribute('aria-expanded', closed ? 'false' : 'true');
  }
  listen(c, 'click', function (e) { var q = e.target.closest('.accordion_question'); if (q && c.contains(q)) toggle(q); });
  listen(c, 'keydown', function (e) {
    var q = e.target.closest && e.target.closest('.accordion_question');
    if (!q || e.target !== q || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    toggle(q);
  });
  return {};
}

/* ------------------------------------------------------------- 8. List reveal */
function list(c) {
  var wrap = $(c, '.feed_wrapper'), items = $$(c, '.feed_list > *'), t = 0, started = false;
  if (!wrap) return {};
  items.forEach(function (it, k) { it.style.setProperty('--fs-list-renderindex', k); });
  function rest() { clearTimeout(t); wrap.classList.remove('is-list-loading'); items.forEach(function (it) { it.classList.remove('is-list-starting'); }); }
  // load -> reveal: the loading line shows while the batch "renders", then the cards rise 60ms apart
  function run() {
    started = true;
    rest();
    if (reduced() || c.getAttribute('data-empty') === 'true') return;
    items.forEach(function (it) { it.classList.add('is-list-starting'); });
    items.forEach(function (it) { void getComputedStyle(it).opacity; });
    wrap.classList.add('is-list-loading');
    t = setTimeout(function () {
      wrap.classList.remove('is-list-loading');
      requestAnimationFrame(function () { items.forEach(function (it) { it.classList.remove('is-list-starting'); }); });
    }, 900);
  }
  rest();
  if (!reduced() && 'IntersectionObserver' in window) {
    items.forEach(function (it) { it.classList.add('is-list-starting'); });
    var io = new IntersectionObserver(function (es) {
      if (es[es.length - 1].isIntersecting) { io.disconnect(); if (!started) run(); }
    }, { threshold: 0.15 });
    io.observe(c);
    onCleanup(function () { io.disconnect(); });
  }
  var mo = new MutationObserver(function () {
    if (c.getAttribute('data-empty') === 'true') rest(); else run();
  });
  mo.observe(c, { attributes: true, attributeFilter: ['data-empty'] });
  onCleanup(function () { mo.disconnect(); clearTimeout(t); });
  var clr = $(c, '.m-empty-clear');
  if (clr) listen(clr, 'click', function (e) { e.preventDefault(); c.setAttribute('data-empty', 'false'); });
  return { replay: run };
}

var KINDS = { menu: menu, hero: hero, gallery: gallery, filters: filters, specs: specs, list: list };

function components(el) {
  if (!el) return [];
  var own = el.matches && el.matches('.mos-c[data-c]') ? [el] : [];
  return own.concat(el.querySelectorAll ? $$(el, '.mos-c[data-c]') : []);
}
/** Wires every component inside root; returns a cleanup for all of them. */
export function initMosKit(root) {
  var mine = (cleanups = []);
  var ac = new AbortController();
  signal = ac.signal;
  var wired = [];
  components(root).forEach(function (c) {
    if (apis.has(c)) return;
    apis.set(c, {});
    wired.push(c);
    // the kit's links are placeholders
    listen(c, 'click', function (e) { var a = e.target.closest && e.target.closest('a[href="#"]'); if (a) e.preventDefault(); });
    var f = KINDS[c.getAttribute('data-c')];
    apis.set(c, f ? f(c) || {} : {});
  });
  cleanups = [];
  signal = null;
  return function () {
    ac.abort();
    mine.forEach(function (fn) { fn(); });
    wired.forEach(function (c) { apis.delete(c); });
  };
}
/** Re-runs a component's entrance (the list's load and reveal). */
export function replayMosKit(el) {
  var cs = components(el);
  if (!cs.length && el && el.closest) { var up = el.closest('.mos-c[data-c]'); if (up) cs = [up]; }
  cs.forEach(function (c) {
    var api = apis.get(c);
    if (api && api.replay) api.replay();
  });
}
