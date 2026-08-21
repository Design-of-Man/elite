/* ELITE Sports Medicine — cinematic scroll-scrub engine
   Scrolling IS scrubbing: the film section's scroll distance maps 1:1 onto a
   preloaded frame sequence drawn to a sticky full-viewport canvas, smoothed
   with a lens-style lerp. The HUD meter and zone labels derive from the same
   progress value, so they can never drift out of sync with the film. */
(function () {
  'use strict';

  var MANIFEST_URL = '/assets/sequence/manifest.json';
  var canvas = document.getElementById('seq');
  var film = document.getElementById('film');
  if (!canvas || !film) return;

  var ctx = canvas.getContext('2d');
  var hudFill = document.getElementById('hudFill');
  var hudPct = document.getElementById('hudPct');
  var hud = document.getElementById('hud');
  var loader = document.getElementById('loader');
  var loaderFill = document.getElementById('loaderFill');
  var loaderPct = document.getElementById('loaderPct');
  var zoneEls = Array.prototype.slice.call(document.querySelectorAll('.hud-zone'));
  var overlays = Array.prototype.slice.call(document.querySelectorAll('.ov'));

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Overlay visibility windows in film progress space [start, full-in, full-out, end]
  var OV_WINDOWS = {
    hero: [0.00, 0.00, 0.08, 0.15],
    f20:  [0.15, 0.19, 0.29, 0.34],
    f40:  [0.35, 0.39, 0.49, 0.54],
    f60:  [0.55, 0.59, 0.69, 0.74],
    f95:  [0.88, 0.94, 1.00, 1.00]
  };

  var state = {
    frames: [],        // Image objects (sparse until fully loaded)
    loaded: [],        // bool per index
    total: 0,
    fps: 12,
    current: 0,        // smoothed frame position (float)
    target: 0,
    progress: 0,       // 0..1 through the film
    lastDrawn: -1,
    ready: false,
    firstPassDone: false
  };

  function fit() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    state.lastDrawn = -1; // force redraw
  }

  function setFilmLength() {
    // ~30px of scroll per frame, clamped so short/long sequences still feel right
    var len = Math.max(4200, Math.min(10000, state.total * 30));
    film.style.height = len + 'px';
  }

  function frameUrl(i) {
    var n = String(i + 1);
    while (n.length < 4) n = '0' + n;
    return state.pattern.replace('%04d', n);
  }

  function nearestLoaded(i) {
    if (state.loaded[i]) return i;
    for (var d = 1; d < state.total; d++) {
      if (state.loaded[i - d]) return i - d;
      if (state.loaded[i + d]) return i + d;
    }
    return -1;
  }

  function draw(i) {
    var idx = nearestLoaded(Math.round(i));
    if (idx < 0 || idx === state.lastDrawn) return;
    var img = state.frames[idx];
    var cw = canvas.width, ch = canvas.height;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var s = Math.max(cw / iw, ch / ih);
    var w = iw * s, h = ih * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    state.lastDrawn = idx;
  }

  function filmProgress() {
    var rect = film.getBoundingClientRect();
    var scrollable = film.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    var p = -rect.top / scrollable;
    return Math.max(0, Math.min(1, p));
  }

  function pageProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
  }

  function grade(p) {
    // page background: deep clinical charcoal -> pure black
    var c = Math.round(26 - 26 * p);
    var g = Math.round(29 - 29 * p);
    var b = Math.round(34 - 34 * p);
    document.body.style.backgroundColor = 'rgb(' + c + ',' + g + ',' + b + ')';
  }

  function updateHud(p) {
    var pct = Math.round(p * 100);
    if (hudPct) hudPct.textContent = String(pct).padStart(3, '0');
    if (hudFill) hudFill.style.transform = 'scaleY(' + p + ')';
    var zone = Math.min(4, Math.floor(p * 5));
    for (var z = 0; z < zoneEls.length; z++) {
      zoneEls[z].classList.toggle('on', z === zone);
      zoneEls[z].classList.toggle('done', z < zone);
    }
  }

  function updateOverlays(p) {
    overlays.forEach(function (el) {
      var w = OV_WINDOWS[el.getAttribute('data-ov')];
      if (!w) return;
      var o = 0;
      if (p >= w[0] && p <= w[3]) {
        if (p < w[1]) o = (p - w[0]) / Math.max(w[1] - w[0], 1e-4);
        else if (p > w[2]) o = 1 - (p - w[2]) / Math.max(w[3] - w[2], 1e-4);
        else o = 1;
      }
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      var drift = (1 - o) * 14;
      el.style.transform = 'translateY(' + (p > (w[1] + w[2]) / 2 ? -drift : drift) + 'px)';
    });
  }

  function tick() {
    var p = filmProgress();
    state.progress = p;
    state.target = p * (state.total - 1);
    var ease = reduceMotion ? 1 : 0.12;
    state.current += (state.target - state.current) * ease;
    if (Math.abs(state.target - state.current) < 0.02) state.current = state.target;
    if (state.ready) draw(state.current);
    updateHud(p);
    updateOverlays(p);
    grade(pageProgress());
    var pastFilm = filmEndPassed();
    if (hud) hud.classList.toggle('hud-off', pastFilm);
    requestAnimationFrame(tick);
  }

  function filmEndPassed() {
    var rect = film.getBoundingClientRect();
    return rect.bottom < window.innerHeight * 0.5;
  }

  function markLoaded(count) {
    var pct = Math.round((count / state.firstPassCount) * 100);
    if (loaderPct) loaderPct.textContent = String(Math.min(pct, 100)).padStart(2, '0');
    if (loaderFill) loaderFill.style.width = Math.min(pct, 100) + '%';
  }

  function beginFilm() {
    if (state.firstPassDone) return;
    state.firstPassDone = true;
    state.ready = true;
    document.body.classList.add('film-ready');
    if (loader) loader.classList.add('gone');
    state.lastDrawn = -1;
    draw(state.current);
  }

  function loadFrames() {
    var stride = 4;
    var firstPass = [];
    var rest = [];
    for (var i = 0; i < state.total; i++) (i % stride === 0 ? firstPass : rest).push(i);
    state.firstPassCount = firstPass.length;
    var done = 0;

    function load(list, onEach, onAll) {
      var idx = 0, inFlight = 0, MAX = 8;
      function next() {
        while (inFlight < MAX && idx < list.length) {
          (function (i) {
            inFlight++;
            var img = new Image();
            img.decoding = 'async';
            img.onload = function () {
              state.frames[i] = img;
              state.loaded[i] = true;
              inFlight--; onEach && onEach(i); next();
            };
            img.onerror = function () { inFlight--; next(); };
            img.src = frameUrl(i);
          })(list[idx++]);
        }
        if (idx >= list.length && inFlight === 0) onAll && onAll();
      }
      next();
    }

    load(firstPass, function () {
      done++; markLoaded(done);
    }, function () {
      beginFilm();
      load(rest, null, function () { state.lastDrawn = -1; });
    });

    // Don't hold the page hostage: reveal after 12s regardless
    setTimeout(beginFilm, 12000);
  }

  // Procedural placeholder frames for local development when the generated
  // sequence has not been fetched (scripts/fetch-assets.mjs). Keeps the
  // engine, HUD and overlay choreography fully testable.
  function placeholderFrames() {
    state.total = 200;
    state.fps = 12;
    state.pattern = '';
    var W = 960, H = 540;
    for (var i = 0; i < state.total; i++) {
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      var g = c.getContext('2d');
      var p = i / (state.total - 1);
      var base = 30 - Math.round(18 * p);
      g.fillStyle = 'rgb(' + base + ',' + (base + 4) + ',' + (base + 9) + ')';
      g.fillRect(0, 0, W, H);
      // sweeping cool key light
      var lx = W * (0.2 + 0.1 * Math.sin(p * 6.283));
      var grad = g.createRadialGradient(lx, H * 0.15, 40, lx, H * 0.15, W * 0.9);
      grad.addColorStop(0, 'rgba(190,215,235,' + (0.30 - 0.12 * p) + ')');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
      // figure silhouette resolving with progress
      g.fillStyle = 'rgba(10,14,18,' + (0.35 + 0.6 * p) + ')';
      g.beginPath();
      g.ellipse(W / 2, H * 0.42, 60 + 40 * p, 60 + 40 * p, 0, 0, 7);
      g.fill();
      g.fillRect(W / 2 - (90 + 60 * p), H * 0.52, 180 + 120 * p, H);
      // frame counter strip
      g.fillStyle = 'rgba(140,220,255,0.5)';
      g.fillRect(0, H - 4, W * p, 2);
      g.fillStyle = 'rgba(200,230,250,0.8)';
      g.font = '16px monospace';
      g.fillText('PLACEHOLDER ' + ('000' + (i + 1)).slice(-4) + ' / ' + state.total, 24, H - 24);
      var img = new Image();
      img.src = c.toDataURL('image/jpeg', 0.7);
      state.frames[i] = img;
      state.loaded[i] = true;
    }
    state.firstPassCount = 1;
    markLoaded(1);
    setFilmLength();
    setTimeout(beginFilm, 300);
  }

  fetch(MANIFEST_URL, { cache: 'force-cache' })
    .then(function (r) { if (!r.ok) throw new Error('no manifest'); return r.json(); })
    .then(function (m) {
      state.total = m.frames;
      state.fps = m.fps || 12;
      state.pattern = m.pattern || '/assets/sequence/frames/f_%04d.webp';
      setFilmLength();
      loadFrames();
    })
    .catch(function () { placeholderFrames(); });

  fit();
  window.addEventListener('resize', fit);
  requestAnimationFrame(tick);

  // ---- chrome: menu + panel reveals ----
  var menuBtn = document.getElementById('menuBtn');
  var menuOverlay = document.getElementById('menuOverlay');
  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', function () {
      var open = menuOverlay.hasAttribute('hidden');
      if (open) menuOverlay.removeAttribute('hidden');
      else menuOverlay.setAttribute('hidden', '');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'CLOSE' : 'MENU';
      document.body.classList.toggle('menu-open', open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menuOverlay.hasAttribute('hidden')) menuBtn.click();
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('.panel, .site-footer').forEach(function (el) { io.observe(el); });
  }
})();
