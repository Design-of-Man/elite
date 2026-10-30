// ELITE Sports Medicine — interaction layer. No framework, no build step.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  // ---------------- Hero background footage ----------------
  // The poster is already painted by the time this runs. Load a video only if
  // motion is welcome and the connection can afford it, and pick the rendition
  // from the actual pixel width being filled rather than CSS pixels — a 4K file
  // on a phone is 25MB of someone's data for no visible gain.
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var thrifty = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "")));

    if (!reduceMotion && !thrifty) {
      var pixelWidth = window.innerWidth * (window.devicePixelRatio || 1);
      var src = pixelWidth >= 2000
        ? heroVideo.dataset.srcHi
        : heroVideo.dataset.srcLo;

      if (src) {
        heroVideo.preload = "auto";
        heroVideo.src = src;
        // play() rejects on browsers that block autoplay even when muted; the
        // poster is a complete fallback, so swallow it rather than logging.
        var attempt = heroVideo.play();
        if (attempt && typeof attempt.catch === "function") attempt.catch(function () {});
      }
    }
  }

  // ---------------- Services mega-menu ----------------
  // The trigger is a button, so keyboard and pointer share one code path:
  // hover merely calls the same open/close the click does.
  var megaWrap = document.querySelector(".nav-has-mega");
  var megaBtn = megaWrap && megaWrap.querySelector(".nav-mega-toggle");
  var megaPanel = megaWrap && megaWrap.querySelector(".nav-mega");

  if (megaBtn && megaPanel) {
    var hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var closeTimer;

    function setMega(open) {
      clearTimeout(closeTimer);
      megaPanel.hidden = !open;
      megaBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    megaBtn.addEventListener("click", function () {
      setMega(megaPanel.hidden);
    });

    if (hoverCapable) {
      megaWrap.addEventListener("mouseenter", function () { setMega(true); });
      megaWrap.addEventListener("mouseleave", function () {
        closeTimer = setTimeout(function () { setMega(false); }, 140);
      });
      megaPanel.addEventListener("mouseenter", function () { clearTimeout(closeTimer); });
      megaPanel.addEventListener("mouseleave", function () {
        closeTimer = setTimeout(function () { setMega(false); }, 140);
      });
    }

    // Escape closes and returns focus to the trigger; a click or a tab landing
    // outside the menu closes it without stealing focus back.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !megaPanel.hidden) {
        setMega(false);
        megaBtn.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!megaPanel.hidden && !megaWrap.contains(e.target)) setMega(false);
    });
    document.addEventListener("focusin", function (e) {
      if (!megaPanel.hidden && !megaWrap.contains(e.target)) setMega(false);
    });
    megaPanel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMega(false); });
    });
  }

  // ---------------- FAQ accordions ----------------
  // Lived as an inline copy on 27 separate pages, which meant any new page
  // carrying .faq-q markup silently had no handler at all.
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      if (!item) return;
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // ---------------- Mobile collapsible groups ----------------
  document.querySelectorAll(".m-group-toggle").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.addEventListener("click", function () {
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  // Scroll-reveal via IntersectionObserver — cheap, no scroll-jank library.
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            /* Reveal a stagger group's children together so the per-child
               transition-delay produces a clean DOM-order cascade. */
            if (entry.target.classList.contains("reveal-stagger")) {
              Array.prototype.forEach.call(entry.target.children, function (child) {
                child.classList.add("is-visible");
              });
            }
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      var staggered = parent && parent.classList.contains("reveal-stagger");

      /* The stagger index must come from the element's position among its
         SIBLINGS. This used to be a page-wide counter (i % 6), which meant
         the index depended on how many .reveal elements happened to appear
         earlier in the document -- on the homepage that handed the first
         service card --i:5, so it faded in last and the grid appeared in the
         order 2,3,4,5,1. An authored inline --i always wins. */
      if (!el.style.getPropertyValue("--i")) {
        el.style.setProperty(
          "--i",
          el.dataset.i || (staggered ? Array.prototype.indexOf.call(parent.children, el) : 0)
        );
      }

      /* Children of a stagger container are revealed BY that container, not
         observed one by one. Observing each separately meant cards in the
         same row crossed the threshold in whatever order the observer
         reported them, so the cascade was non-deterministic even once the
         indices were right. */
      if (!staggered) io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---------------- Animated counters ----------------


  // The authored value lives in the HTML, so it is what a crawler, a social
  // preview, a no-JS visitor or a failed main.js all read. This only animates
  // from zero up to that value and then restores it verbatim — the number is
  // never sourced from here.
  // Roll the digits up into place rather than ticking a number. The authored
  // value stays in the HTML and is what a crawler, a social preview, a no-JS
  // visitor or a failed main.js reads — this only rearranges it into sliding
  // columns and puts it back verbatim if anything is unexpected.
  function rollUp(el) {
    if (el.dataset.rolled) return;
    var finalText = el.textContent;
    var parts = /^(\D*?)([\d][\d,.]*)(.*)$/.exec(finalText);
    if (!parts) return;                       // nothing numeric — leave it alone
    el.dataset.rolled = "1";

    if (reduceMotion) return;                 // authored text, no movement

    var before = parts[1], digits = parts[2], after = parts[3];
    var frag = document.createElement("span");
    frag.className = "odo";
    if (before) frag.appendChild(document.createTextNode(before));

    var strips = [];
    for (var i = 0; i < digits.length; i++) {
      var ch = digits.charAt(i);
      if (ch < "0" || ch > "9") {             // separators ride along statically
        frag.appendChild(document.createTextNode(ch));
        continue;
      }
      var slot = document.createElement("span");
      slot.className = "odo-d";
      var strip = document.createElement("span");
      strip.className = "odo-strip";
      for (var d = 0; d <= 9; d++) {
        var cell = document.createElement("span");
        cell.textContent = String(d);
        strip.appendChild(cell);
      }
      // Start a full turn below so the digit arrives travelling upward.
      strip.style.transform = "translate3d(0, -" + ((+ch) * 10) + "%, 0)";
      slot.appendChild(strip);
      frag.appendChild(slot);
      strips.push({ strip: strip, value: +ch, index: strips.length });
    }
    if (after) frag.appendChild(document.createTextNode(after));

    // Only swap in the animated version once it is built successfully.
    el.textContent = "";
    el.appendChild(frag);
    // The columns contain every digit 0-9, so without this a screen reader
    // would read "23+" as a run of ten digits twice. role=img + label makes the
    // element announce the authored value and nothing else.
    frag.setAttribute("aria-hidden", "true");
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", finalText);

    strips.forEach(function (s) {
      s.strip.style.transition = "none";
      s.strip.style.transform = "translate3d(0, 0, 0)";
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        strips.forEach(function (s) {
          s.strip.style.transition = "transform 1.15s var(--ease)";
          s.strip.style.transitionDelay = (s.index * 90) + "ms";
          s.strip.style.transform = "translate3d(0, -" + (s.value * 10) + "%, 0)";
        });
      });
    });
  }


  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var countIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            rollUp(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { countIo.observe(el); });
  }
  // No else-branch: without IntersectionObserver the markup already shows the
  // correct value, so there is nothing to fill in.

  // ---------------- Scroll progress ----------------
  // Injected rather than added to 63 pages of markup. Decorative, so it is
  // aria-hidden and never announced.
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  // ---------------- Header: recede on the way down, return on the way up ----------------
  // Gives back the full screen while reading and puts the booking CTA one
  // gesture away at any depth. Never hides while the mega-menu is open, and
  // never within the first screen where the hero CTA is still in view.
  var lastY = window.scrollY;
  var progressTicking = false;

  function onScrollFrame() {
    var y = window.scrollY;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0).toFixed(4) + ")";

    if (header) {
      var megaOpen = megaPanel && !megaPanel.hidden;
      var down = y > lastY + 4;
      var up = y < lastY - 4;
      if (megaOpen || y < window.innerHeight * 0.9) header.classList.remove("is-receded");
      else if (down) header.classList.add("is-receded");
      else if (up) header.classList.remove("is-receded");
    }
    lastY = y;
    progressTicking = false;
  }
  document.addEventListener("scroll", function () {
    if (!progressTicking) { requestAnimationFrame(onScrollFrame); progressTicking = true; }
  }, { passive: true });
  onScrollFrame();

  // ---------------- Hero parallax (decorative only, GPU-only transform) ----------------
  if (!reduceMotion) {
    var parallaxEls = document.querySelectorAll("[data-parallax]");
    if (parallaxEls.length) {
      var ticking = false;
      function updateParallax() {
        var vh = window.innerHeight;
        parallaxEls.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > vh) return;
          var speed = parseFloat(el.dataset.parallax) || 0.15;
          var offset = (rect.top - vh / 2) * speed;
          el.style.transform = "translate3d(0, " + offset.toFixed(1) + "px, 0)";
        });
        ticking = false;
      }
      document.addEventListener(
        "scroll",
        function () {
          if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
          }
        },
        { passive: true }
      );
      updateParallax();
    }
  }

  // ---------------- Scroll-linked section motion ----------------
  // One observer drives everything below. Elements declare what they want with
  // data attributes rather than each effect owning its own scroll listener.
  if (!reduceMotion && "IntersectionObserver" in window) {

    // Media panels wipe open instead of fading. clip-path is composited, so
    // this stays on the GPU like everything else here.
    var wipes = document.querySelectorAll(".split-media, .figure-wide, .diagram");
    if (wipes.length) {
      var wipeIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-wiped");
          wipeIO.unobserve(e.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
      wipes.forEach(function (el) {
        el.classList.add("wipe");
        // Anything already at or above the fold is opened immediately. A clipped
        // element is invisible, so it must never depend on an observer callback
        // that might not fire for it.
        if (el.getBoundingClientRect().top < window.innerHeight) {
          requestAnimationFrame(function () { el.classList.add("is-wiped"); });
        } else {
          wipeIO.observe(el);
        }
      });
    }

    // Section headings drift up a little slower than the page, so a section
    // settles rather than arriving all at once. Decorative only.
    var drifters = document.querySelectorAll(".section-head");
    if (drifters.length) {
      var driftTicking = false;
      function drift() {
        var vh = window.innerHeight;
        drifters.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          // -1 to 1 across the viewport, eased at the edges
          var t = (r.top + r.height / 2 - vh / 2) / vh;
          el.style.transform = "translate3d(0, " + (t * -14).toFixed(2) + "px, 0)";
        });
        driftTicking = false;
      }
      document.addEventListener("scroll", function () {
        if (!driftTicking) { requestAnimationFrame(drift); driftTicking = true; }
      }, { passive: true });
      drift();
    }
  }

  // ---------------- Hero headline word-stagger on load ----------------
  // Walks child nodes so inline tags (e.g. <em>) survive as single animated units.
  document.querySelectorAll("[data-split-words]").forEach(function (el) {
    var i = 0;
    var out = [];
    el.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach(function (chunk) {
          if (!chunk.trim()) {
            if (chunk) out.push(chunk);
            return;
          }
          out.push('<span class="word-wrap"><span class="word" style="transition-delay:' + i * 70 + 'ms">' + chunk + "</span></span>");
          i++;
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        out.push('<span class="word-wrap"><span class="word" style="transition-delay:' + i * 70 + 'ms">' + node.outerHTML + "</span></span>");
        i++;
      }
    });
    el.innerHTML = out.join("");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add("is-in");
      });
    });
  });

  // ---------------- Magnetic buttons (desktop / fine-pointer only) ----------------
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = "translate3d(" + (x * 0.25).toFixed(1) + "px, " + (y * 0.35).toFixed(1) + "px, 0)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  // ---------------- Front Desk Assistant ----------------
  /* SET ANSWERS, no AI, no external API, no medical advice. Rebuilt 2026-10-30
     on First Rehabilitation's intake conversation (firstrehabnpb.com,
     assets/js/intake.js), which Nick asked for on every client site: a greeting
     with three intents, one question per bubble with a typing pause, chips that
     are real buttons, a confirm card with "Fix something", a reference number,
     a draft that survives a reload, and a retry queue. The look (.ai-* in
     v2.css), the answers and the markup on every page are this site's own.

     Facts: every answer and chip below restates CLAUDE.md "Business facts" or a
     published page. Do not add a price, an insurance plan, a wait time or a
     credential that is not already on the site. The site publishes no
     insurance list ("most major carriers"), so the booking flow has no
     insurance step; do not invent one.

     Delivery: this site's own /api/lead/ (api/lead.js), the same endpoint as
     the /schedule-appointment/ form. A send is only reported as received when
     the endpoint answers success "true". Before the request leaves, it is put
     in the localStorage queue under the original key (esm-assist-pending, now
     an array; a single object queued by the old assistant is read and sent as
     it was), so a closed tab or an outage cannot lose it; it is retried on the
     next page load and when the browser comes back online.

     Analytics: unchanged. A confirmed delivery dispatches esm:assistant-lead,
     which the analytics block turns into form_submit {path, form:"assistant"}.
     Nothing typed, chosen or answered here is ever sent to analytics.

     Never loaded on the three PHI pages. */
  var launcher = document.getElementById("ai-assistant-launcher");
  var panel = document.getElementById("ai-assistant-panel");
  var closeBtn = document.getElementById("ai-close");
  var messages = document.getElementById("ai-messages");
  var form = document.getElementById("ai-form");
  var input = document.getElementById("ai-input");

  var PHONE = "561-202-8886";
  var TEL = "tel:+15612028886";
  var ENDPOINT = "/api/lead/";
  var PENDING_KEY = "esm-assist-pending";     // retry queue (kept from the old assistant)
  var DRAFT_KEY = "esm.assist.draft.v1";      // answers given so far
  var DRAFT_TTL = 72 * 3600 * 1000;
  var PHI_PREFIXES = ["/new-patient-intake-form/", "/elite-injection-consent-form/", "/elite-medical-records-request/"];
  var HOURS = "Monday to Friday, 8:30 AM to 4:00 PM";
  var PSL = "Port St. Lucie";
  var PBG = "Palm Beach Gardens";
  var PEPTIDES = "Peptide therapy";

  var onPHIPage = PHI_PREFIXES.some(function (p) { return window.location.pathname.indexOf(p) === 0; });
  if (onPHIPage) {
    if (launcher) launcher.remove();
    if (panel) panel.remove();
    launcher = panel = null;
  }

  // ---------- storage (never throws) ----------
  function load(key) {
    try { return JSON.parse(window.localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }
  function save(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function drop(key) {
    try { window.localStorage.removeItem(key); } catch (e) {}
  }

  // ---------- retry queue ----------
  /* The old assistant kept ONE pending booking as a bare object of its form
     data. Read that shape too and send it exactly as it would have gone. */
  function legacyPayload(d) {
    return {
      _subject: "[Appointment Request] elitesportsmed.org (website chat)",
      source: "assistant",
      name: d.name, phone: d.phone, email: d.email || "",
      office: d.office, reason: d.reason, page: d.page || window.location.pathname
    };
  }
  function readQueue() {
    var q = load(PENDING_KEY);
    if (!q) return [];
    if (!Array.isArray(q)) q = (q.name && q.phone) ? [legacyPayload(q)] : [];
    return q.filter(function (p) { return p && p.name && p.phone; });
  }
  function writeQueue(q) { if (q.length) save(PENDING_KEY, q.slice(-20)); else drop(PENDING_KEY); }
  function keyOf(p) { return p.ref || (p.name + "|" + p.phone + "|" + (p.message || p.reason || "")); }
  function enqueue(p) {
    var q = readQueue().filter(function (x) { return keyOf(x) !== keyOf(p); });
    q.push(p);
    writeQueue(q);
  }
  function dequeue(p) {
    writeQueue(readQueue().filter(function (x) { return keyOf(x) !== keyOf(p); }));
  }

  var inFlight = {};
  function post(p) {
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(p)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (out) {
        if (!r.ok || String(out && out.success) !== "true") throw new Error("not delivered");
        return true;
      });
    });
  }
  // Every confirmed delivery, live or retried, counts once.
  function deliver(p) {
    var k = keyOf(p);
    if (inFlight[k]) return inFlight[k];
    inFlight[k] = post(p).then(function () {
      dequeue(p);
      delete inFlight[k];
      try { document.dispatchEvent(new CustomEvent("esm:assistant-lead")); } catch (e) {}
      return true;
    }, function (err) {
      delete inFlight[k];
      throw err;
    });
    return inFlight[k];
  }
  function flushQueue() {
    var q = readQueue();
    (function next(i) {
      if (i >= q.length) return;
      deliver(q[i]).then(function () { next(i + 1); }, function () { /* still down; next load */ });
    })(0);
  }
  if (!onPHIPage) {
    flushQueue();
    window.addEventListener("online", flushQueue);
  }

  if (!(launcher && panel && messages && form && input)) return;

  // ---------- accessibility + chrome ----------
  messages.setAttribute("role", "log");
  messages.setAttribute("aria-live", "polite");
  panel.setAttribute("tabindex", "-1");
  var aiHeader = panel.querySelector(".ai-header");
  var restartBtn = document.createElement("button");
  restartBtn.type = "button";
  restartBtn.className = "ai-restart";
  restartBtn.textContent = "Start over";
  if (aiHeader && closeBtn) aiHeader.insertBefore(restartBtn, closeBtn);
  var disclaimer = messages.querySelector(".disclaimer");

  // ---------- rendering (DOM only: nothing a visitor types is parsed as HTML) ----------
  /* A message is a list of parts: "text", ["label", href], {b: "bold"} or
     {note: "small print"}. */
  function scrollDown() { messages.scrollTop = messages.scrollHeight; }
  function partsInto(div, parts) {
    (typeof parts === "string" ? [parts] : parts).forEach(function (part) {
      if (typeof part === "string") { div.appendChild(document.createTextNode(part)); return; }
      if (Array.isArray(part)) {
        var a = document.createElement("a");
        a.textContent = part[0];
        a.href = part[1];
        div.appendChild(a);
        return;
      }
      if (part.b != null) {
        var s = document.createElement("strong");
        s.textContent = part.b;
        div.appendChild(s);
        return;
      }
      if (part.note != null) {
        var n = document.createElement("span");
        n.className = "ai-note";
        n.textContent = part.note;
        div.appendChild(n);
      }
    });
  }
  function addBot(parts) {
    var div = document.createElement("div");
    div.className = "ai-msg bot";
    partsInto(div, parts);
    messages.appendChild(div);
    scrollDown();
    return div;
  }
  function addUser(text) {
    var div = document.createElement("div");
    div.className = "ai-msg user";
    div.textContent = text;
    messages.appendChild(div);
    scrollDown();
  }
  function addTyping() {
    var div = document.createElement("div");
    div.className = "ai-msg bot ai-typing-wrap";
    div.setAttribute("aria-hidden", "true");
    div.innerHTML = '<span class="ai-typing"><span></span><span></span><span></span></span>';
    messages.appendChild(div);
    scrollDown();
    return div;
  }
  function addNode(node) { messages.appendChild(node); scrollDown(); }

  var busy = false;
  var chipsEl = null;
  var chipDefs = [];
  function clearChips() { if (chipsEl) chipsEl.remove(); chipsEl = null; chipDefs = []; }
  /* Chips: [{label, value, cls}]. Typing a chip's label (emoji optional, any
     case) is the same as tapping it. */
  function showChips(defs) {
    clearChips();
    if (!defs || !defs.length) return;
    chipDefs = defs;
    chipsEl = document.createElement("div");
    chipsEl.className = "ai-chips";
    defs.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = c.label;
      if (c.cls) b.className = c.cls;
      b.addEventListener("click", function () {
        if (busy) return;
        var defsNow = chipDefs;
        clearChips();
        choose(c, defsNow);
      });
      chipsEl.appendChild(b);
    });
    addNode(chipsEl);
  }
  function plain(label) {
    return String(label).replace(/^[^A-Za-z0-9]+/, "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function chipFor(text) {
    var t = plain(text);
    for (var i = 0; i < chipDefs.length; i++) if (plain(chipDefs[i].label) === t) return chipDefs[i];
    return null;
  }

  // Bot messages one at a time, each after a short typing pause.
  var typingTimer = null;
  function say(list, done) {
    busy = true;
    clearChips();
    var i = 0;
    (function next() {
      if (i >= list.length) { busy = false; if (done) done(); return; }
      var item = list[i];
      var typing = addTyping();
      var len = typeof item === "string" ? item.length : (item.nodeType ? 120 : JSON.stringify(item).length);
      typingTimer = setTimeout(function () {
        typing.remove();
        if (item && item.nodeType) addNode(item); else addBot(item);
        i++;
        next();
      }, Math.min(350 + len * 6, 1100));
    })();
  }

  // ---------- set answers ----------
  /* Every answer below restates CLAUDE.md "Business facts" or an existing page.
     Do not add a price, an insurance plan, a wait time or a credential here
     that is not already published on the site. */
  var ANSWERS = [
    {
      test: /\b(emergency|911|chest pain|can'?t breathe|bleeding)s?\b/i,
      parts: [["If this is a medical emergency, call 911 or go to the nearest emergency room."]]
    },
    {
      test: /\b(where|location|address|office|directions|port st|psl|st\.? lucie|palm beach gardens|pbg|parking|exit)s?\b/i,
      parts: [
        ["Port St. Lucie: 1100 SW St. Lucie West Blvd., Ste. 105, FL 34986 (I-95 exit 121, St. Lucie West Blvd). "],
        ["Palm Beach Gardens: 11380 Prosperity Farms Rd, Ste 204, FL 33410. "],
        ["Both are open Monday to Friday, 8:30 AM to 4:00 PM. "],
        ["Directions and maps", "/areas-we-serve/"]
      ]
    },
    {
      test: /\b(hour|open|close|closing|when are you|saturday|sunday|weekend)s?\b/i,
      parts: [["Both offices are open Monday to Friday, 8:30 AM to 4:00 PM. Call "], [PHONE, TEL], [" to book."]]
    },
    {
      test: /\b(insurance|insur|medicare|medicaid|aetna|cigna|humana|united|blue ?cross|bcbs|tricare|accept|cover|copay)s?\b/i,
      parts: [["For insurance questions, please call "], [PHONE, TEL], [" and the office can tell you about your plan."]]
    },
    {
      test: /\b(price|prices|cost|how much|fee|fees|pay|payment|membership|concierge)s?\b/i,
      parts: [["We don't publish prices online, including memberships. The office will go over costs with you: call "], [PHONE, TEL], [". "], ["Memberships", "/memberships/"]]
    },
    {
      test: /\b(dr\.?|doctor|matarazzo|surgeon|who is|credentials|experience|jets|islanders|board)s?\b/i,
      parts: [
        ["Dr. Marc F. Matarazzo, MD is board-certified, fellowship-trained and MAKO-certified, the first surgeon in Florida to implant the MISHA Knee System, and spent over a decade as a team physician for the NY Jets and NY Islanders. "],
        ["Meet Dr. Matarazzo", "/marc-f-matarazzo/"]
      ]
    },
    {
      test: /\b(mako|robot|knee replacement|partial knee|total knee)s?\b/i,
      parts: [["Dr. Matarazzo performs MAKO robotic-assisted total and partial knee replacement. "], ["MAKO knee replacement", "/services/mako-total-and-partial-knee-replacement/"]]
    },
    {
      test: /\bmisha\b/i,
      parts: [["Dr. Matarazzo was the first surgeon in Florida to implant the MISHA Knee System. "], ["About the MISHA implant", "/services/misha-minimally-invasive-implantable-shock-absorber-implant/"]]
    },
    {
      test: /\b(shoulder|rotator|reverse shoulder)s?\b/i,
      parts: [["Shoulder care here includes rotator cuff repair and total and reverse shoulder replacement. "], ["Shoulder and knee surgery", "/services/shoulder-and-knee-surgery/"]]
    },
    {
      test: /\b(acl|ligament|meniscus|cartilage|maci|kneecap|patella)s?\b/i,
      parts: [["Sports knee injuries are a core part of the practice: ACL reconstruction, meniscus repair, cartilage restoration and kneecap stabilization. "], ["Sports medicine", "/services/sports-medicine/"]]
    },
    {
      test: /\b(prp|regenerative|orthobiologic|stem cell|injection)s?\b/i,
      parts: [["Non-surgical options include PRP injections and orthobiologic therapies. "], ["Regenerative treatments", "/regenerative-treatments/"]]
    },
    {
      test: /\b(peptide)s?\b/i,
      parts: [["Peptide therapy is offered at the Port St. Lucie office. "], ["Peptide therapy", "/services/peptide-therapy/"]]
    },
    {
      test: /\b(shockwave|laser|mls)s?\b/i,
      parts: [["Shockwave and MLS laser therapy are available. "], ["Shockwave therapy", "/services/shockwave-therapy/"], [" · "], ["Laser therapy", "/services/laser-therapy/"]]
    },
    {
      test: /\b(second opinion)s?\b/i,
      parts: [["Dr. Matarazzo offers second opinions. "], ["Second opinions", "/second-opinions/"]]
    },
    {
      test: /\b(workers'? ?comp|work injury|ime|cme|independent medical|compulsory|legal|attorney|lawyer|personal injury|car accident|auto accident|pip)s?\b/i,
      parts: [["The practice handles workers' compensation, personal injury and legal work, including IMEs and CMEs. "], ["Workers' comp", "/services/workers-compensation-injuries/"], [" · "], ["Legal reviews", "/services/legal-reviews/"]]
    },
    {
      test: /\b(form|forms|paperwork|intake|records|consent)s?\b/i,
      parts: [["New-patient paperwork is on the site to fill in and print, then bring to your visit: "], ["New patient intake", "/new-patient-intake-form/"]]
    },
    {
      test: /\b(services|treat|treatment|what do you do|offer)s?\b/i,
      parts: [["Sports medicine, ACL and meniscus surgery, cartilage restoration, MAKO robotic knee replacement, shoulder replacement, PRP and orthobiologics, shockwave and laser therapy, second opinions, and workers' comp and legal evaluations. "], ["All services", "/services/"]]
    },
    {
      test: /\b(phone|call|number|email|contact|talk to|speak)s?\b/i,
      parts: [["Call "], [PHONE, TEL], [" or email "], ["info@elitesportsmed.org", "mailto:info@elitesportsmed.org"], ["."]]
    }
  ];
  function flat(parts) { return parts.map(function (p) { return p.length === 1 ? p[0] : p; }); }
  function answerFor(text) {
    for (var i = 0; i < ANSWERS.length; i++) if (ANSWERS[i].test.test(text)) return flat(ANSWERS[i].parts);
    return null;
  }

  var CLINICAL = /\b(pain|hurt|swollen|swelling|injur|torn|tear|broke|fractur|diagnos|should i|do i need|surgery or|symptom|medicat|dose|dosing)/i;
  var BOOK = /\b(book|appointment|appt|schedul|consult|see the doctor|be seen|visit|new patient)/i;

  // The question chips. Each label is run through answerFor(), so a chip can
  // only ever show an answer that already exists above.
  var FAQ_CHIPS = [
    "Where are your offices?",
    "What are your hours?",
    "What services do you offer?",
    "About Dr. Matarazzo",
    "Do you take my insurance?",
    "How much does it cost?",
    "Do you offer second opinions?",
    "New-patient paperwork"
  ];

  // Service lines from /services/ and the site's own service pages.
  var TOPICS = [
    "Knee pain or injury",
    "MAKO knee replacement",
    "Shoulder pain or injury",
    "Sports injury",
    "Regenerative treatments (PRP)",
    "Shockwave or laser therapy",
    PEPTIDES,
    "Second opinion",
    "Workers' comp or personal injury",
    "Not sure yet"
  ];

  // ---------- conversation ----------
  var flow = { state: "intent", data: {}, editing: false };

  function saveDraft() { save(DRAFT_KEY, { state: flow.state, data: flow.data, editing: flow.editing, t: Date.now() }); }
  function clearDraft() { drop(DRAFT_KEY); }
  function firstName(d) { return String(d.name || "").trim().split(/\s+/)[0] || ""; }
  function isQuestion(d) { return d.intent === "question"; }

  function summaryCard(d) {
    var card = document.createElement("div");
    card.className = "ai-summary";
    var rows = [
      ["For", isQuestion(d) ? "A message for the front desk" : "Appointment request"],
      ["Reason", d.topic], ["Office", d.office], ["Details", d.message], ["Name", d.name],
      ["Phone", d.phone], ["Email", d.email], ["Call time", d.preferred_time]
    ];
    rows.forEach(function (r) {
      if (!r[1]) return;
      var row = document.createElement("div");
      var k = document.createElement("span"); k.className = "k"; k.textContent = r[0];
      var v = document.createElement("span"); v.className = "v"; v.textContent = r[1];
      row.appendChild(k); row.appendChild(v);
      card.appendChild(row);
    });
    return card;
  }

  var FIELDS = [
    { step: "topic", label: "Reason", appt: true },
    { step: "office", label: "Office", appt: true },
    { step: "message", label: "Details" },
    { step: "name", label: "Name" },
    { step: "phone", label: "Phone" },
    { step: "email", label: "Email" },
    { step: "time", label: "Call time", appt: true }
  ];

  var STEPS = {
    intent: {
      prompt: function () {
        return [
          "Hi, welcome to Elite Sports Medicine! I'm the front desk assistant. I can request an appointment with Dr. Matarazzo for you, or answer questions about our offices, hours and services.",
          "What brings you in today?"
        ];
      },
      chips: function () {
        return [
          { label: "📅 Request an appointment", value: "appointment", cls: "primary" },
          { label: "💬 Ask a question", value: "ask" },
          { label: "👀 Just looking around", value: "browse" }
        ];
      }
      // Typed text here is a question: handled in typed().
    },
    browse: {
      terminal: true,
      prompt: function () {
        return [["Enjoy the site! I'll be right here in the corner if you need anything. You can also call us at ", [PHONE, TEL], ", " + HOURS + "."]];
      },
      chips: function () {
        return [
          { label: "📅 Actually, book me in", value: "appointment" },
          { label: "💬 I do have a question", value: "ask" }
        ];
      }
    },
    topic: {
      field: "topic",
      prompt: function () { return ["Happy to set that up. What would you like to be seen for?"]; },
      chips: function () { return TOPICS.map(function (t) { return { label: t, value: t }; }); },
      accept: function (v) {
        if (v.length < 2) return { error: "Just a few words is fine, or tap one of the options." };
        return { value: v.slice(0, 120) };
      },
      next: function () { return "office"; }
    },
    office: {
      field: "office",
      // Peptide therapy is offered at the Port St. Lucie office only
      // (/services/peptide-therapy/), so there is nothing to choose.
      auto: function (d) {
        if (d.topic !== PEPTIDES) return null;
        return { value: PSL, say: "Peptide therapy is offered at our Port St. Lucie office, so I've noted Port St. Lucie." };
      },
      prompt: function () {
        return ["Which office works best? Port St. Lucie is at 1100 SW St. Lucie West Blvd., Ste. 105, and Palm Beach Gardens is at 11380 Prosperity Farms Rd, Ste 204."];
      },
      chips: function () {
        return [{ label: PSL, value: PSL }, { label: PBG, value: PBG }, { label: "Either is fine", value: "Either is fine" }];
      },
      accept: function () { return { error: "Please tap Port St. Lucie, Palm Beach Gardens, or Either is fine." }; },
      next: function () { return "message"; }
    },
    message: {
      field: "message",
      prompt: function (d) {
        if (isQuestion(d)) {
          return [["Of course. What would you like to ask? I'll pass it straight to the front desk. ", { note: "Please leave out medical history; the team will go over that with you on the phone." }]];
        }
        return [["Tell me a little about what's going on… a sentence or two is perfect. ", { note: "No detailed medical history needed, just the basics please." }]];
      },
      accept: function (v) {
        if (v.length < 2) return { error: "Could you give me just a few words about it?" };
        return { value: v.slice(0, 1000) };
      },
      next: function () { return "name"; }
    },
    name: {
      field: "name",
      prompt: function () { return [["Thanks. Now your contact details so the front desk can reach you. What's your ", { b: "first and last name" }, "?"]]; },
      accept: function (v) {
        if (v.replace(/[^A-Za-zÀ-ɏ]/g, "").length < 2) return { error: "Please type your first and last name." };
        return { value: v.slice(0, 200) };
      },
      next: function () { return "phone"; }
    },
    phone: {
      field: "phone",
      prompt: function (d) {
        var f = firstName(d);
        return [["Thanks" + (f ? ", " + f : "") + "! What's the best ", { b: "phone number" }, " to reach you?"]];
      },
      accept: function (v) {
        var d = v.replace(/\D/g, "");
        if (!(d.length === 10 || (d.length === 11 && d.charAt(0) === "1"))) {
          return { error: "Hmm, that doesn't look like a 10-digit phone number. Mind checking it? (For example 561-555-0123.)" };
        }
        return { value: v.slice(0, 40) };
      },
      next: function () { return "email"; }
    },
    email: {
      field: "email",
      prompt: function () { return [["And your ", { b: "email" }, ", in case we can't reach you by phone? ", { note: "Optional. Tap Skip if you'd rather not." }]]; },
      chips: function () { return [{ label: "Skip", value: "" }]; },
      accept: function (v) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { error: "That email doesn't look quite right. Try again, or tap Skip." };
        return { value: v.slice(0, 200) };
      },
      next: function (d) { return isQuestion(d) ? "confirm" : "time"; }
    },
    time: {
      field: "preferred_time",
      // Inside the published hours only (CLAUDE.md: Monday to Friday, 8:30 AM to 4:00 PM).
      prompt: function () { return ["When's the best time for the front desk to call? Both offices are open " + HOURS + "."]; },
      chips: function () {
        return [
          { label: "Morning (8:30–11)", value: "Morning (8:30–11)" },
          { label: "Midday (11–2)", value: "Midday (11–2)" },
          { label: "Afternoon (2–4)", value: "Afternoon (2–4)" },
          { label: "Any time", value: "Any time" }
        ];
      },
      accept: function () { return { error: "Please tap one of the times above. They're all within office hours, " + HOURS + "." }; },
      next: function () { return "confirm"; }
    },
    confirm: {
      prompt: function (d) { return [summaryCard(d), "Did I get everything right?"]; },
      chips: function () {
        return [
          { label: "✅ Yes, send it", value: "send", cls: "primary" },
          { label: "✏️ Fix something", value: "fix" }
        ];
      },
      accept: function (v) {
        var t = v.toLowerCase();
        if (/^(y|yes|yep|send|ok|okay|correct)\b/.test(t)) return { value: "send" };
        if (/^(no|fix|change|edit|wrong)\b/.test(t)) return { value: "fix" };
        return { error: "Tap “Yes, send it” when you're ready, or “Fix something” to change an answer." };
      }
    },
    fix: {
      prompt: function () { return ["No problem. Which part should I change?"]; },
      chips: function (d) {
        return FIELDS.filter(function (f) {
          if (f.appt && isQuestion(d)) return false;
          if (f.step === "office" && d.topic === PEPTIDES) return false;
          return true;
        }).map(function (f) { return { label: f.label, value: "edit:" + f.step }; })
          .concat([{ label: "Nothing, it's right", value: "back" }]);
      },
      accept: function () { return { error: "Tap the part you'd like to change." }; }
    },
    sent: { terminal: true }
  };

  function runStep(id) {
    flow.state = id;
    var step = STEPS[id];
    if (step.auto) {
      var a = step.auto(flow.data);
      if (a) {
        flow.data[step.field] = a.value;
        saveDraft();
        say([a.say], function () { advance(step); });
        return;
      }
    }
    if (!step.terminal || id === "browse") saveDraft();
    if (id === "browse" || id === "intent") clearDraft();
    say(step.prompt(flow.data), function () {
      if (step.chips) showChips(step.chips(flow.data));
    });
  }

  function advance(step) {
    if (flow.editing) { flow.editing = false; runStep("confirm"); return; }
    runStep(step.next(flow.data));
  }

  function startAppointment() {
    flow.data = { intent: "appointment" };
    flow.editing = false;
    runStep("topic");
  }
  function startMessage(text) {
    flow.data = { intent: "question" };
    flow.editing = false;
    if (text) {
      flow.data.message = text.slice(0, 1000);
      saveDraft();
      say(["I don't have a set answer for that, so I'll pass it to the front desk and they'll follow up personally."], function () { runStep("name"); });
    } else {
      runStep("message");
    }
  }
  function questionMenu(lead) {
    flow.state = "ask";
    clearDraft();
    say(lead ? [lead] : [], function () {
      var chips = [{ label: "📅 Request an appointment", value: "appointment", cls: "primary" }];
      FAQ_CHIPS.forEach(function (q) { chips.push({ label: q, value: "faq" }); });
      chips.push({ label: "📨 Leave a message for the front desk", value: "message" });
      showChips(chips);
    });
  }
  // A question, tapped or typed: set answer, booking, no advice, or the front desk.
  function answerQuestion(text) {
    var emergency = ANSWERS[0].test.test(text);
    if (!emergency && BOOK.test(text) && !/\b(form|forms|paperwork)\b/i.test(text)) { startAppointment(); return; }
    var ans = answerFor(text);
    if (ans) { flow.state = "ask"; say([ans], function () { questionMenu("Anything else I can help with?"); }); return; }
    if (CLINICAL.test(text)) {
      flow.state = "ask";
      say([["I can't give medical advice, but Dr. Matarazzo can evaluate that in person. I can request an appointment for you, or you can call ", [PHONE, TEL], "."]], function () {
        showChips([
          { label: "📅 Request an appointment", value: "appointment", cls: "primary" },
          { label: "💬 Ask something else", value: "ask" }
        ]);
      });
      return;
    }
    startMessage(text);
  }

  // A chip was tapped (or its label typed).
  function choose(c) {
    addUser(c.label);
    var v = c.value;
    if (v === "appointment") { startAppointment(); return; }
    if (v === "ask") { questionMenu("Happy to help! Tap a question below and I'll answer right away, or I can take a message for the front desk."); return; }
    if (v === "browse") { runStep("browse"); return; }
    if (v === "message") { startMessage(""); return; }
    if (v === "faq") { answerQuestion(c.label); return; }
    if (v === "close") { closePanel(); return; }
    if (v === "resume") { resume(); return; }
    if (v === "fresh") { startOver(true); return; }
    if (flow.state === "confirm") {
      if (v === "send") { submit(); return; }
      if (v === "fix") { runStep("fix"); return; }
    }
    if (flow.state === "fix") {
      if (v === "back") { runStep("confirm"); return; }
      if (v.indexOf("edit:") === 0) { flow.editing = true; runStep(v.slice(5)); return; }
    }
    var step = STEPS[flow.state];
    if (step && step.field) {
      flow.data[step.field] = v;
      // A new reason of peptide therapy moves the request to Port St. Lucie.
      if (step.field === "topic" && v === PEPTIDES && flow.editing) flow.data.office = PSL;
      saveDraft();
      advance(step);
    }
  }

  // Free text from the input box.
  function typed(text) {
    var c = chipFor(text);
    if (c) { clearChips(); choose(c); return; }
    if (flow.state === "intent" || flow.state === "ask" || flow.state === "browse" || flow.state === "sent" || flow.state === "resume") {
      clearChips();
      addUser(text);
      answerQuestion(text);
      return;
    }
    var step = STEPS[flow.state];
    if (!step || !step.accept) return;
    addUser(text);
    var res = step.accept(text);
    if (res.error) {
      var defs = chipDefs;
      say([res.error], function () { if (defs.length) showChips(defs); });
      return;
    }
    clearChips();
    if (flow.state === "confirm") { choose({ label: "", value: res.value }); return; }
    flow.data[step.field] = res.value;
    if (step.field === "topic" && res.value === PEPTIDES && flow.editing) flow.data.office = PSL;
    saveDraft();
    advance(step);
  }

  // ---------- send ----------
  function refCode() {
    var abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", out = "";
    for (var i = 0; i < 5; i++) out += abc.charAt(Math.floor(Math.random() * abc.length));
    return "ES-" + out;
  }
  function buildPayload(d) {
    var q = isQuestion(d);
    var p = {
      _subject: (q ? "Website question " : "Appointment request ") + d.ref + " (website chat)",
      source: "assistant",
      intent: q ? "question" : "appointment",
      ref: d.ref,
      name: d.name,
      phone: d.phone,
      email: d.email || "",
      message: d.message || "",
      page: window.location.pathname
    };
    if (!q) {
      p.topic = d.topic || "";
      p.office = d.office || "";
      p.preferred_time = d.preferred_time || "";
    }
    return p;
  }

  function submit() {
    flow.data.ref = flow.data.ref || refCode();
    var p = buildPayload(flow.data);
    enqueue(p); // kept until delivery is confirmed, so an outage cannot lose it
    busy = true;
    var typing = addTyping();
    deliver(p).then(function () {
      typing.remove();
      busy = false;
      clearDraft();
      flow.state = "sent";
      say([
        ["Perfect, it's on its way! 🎉 Your reference number is ", { b: p.ref }, "."],
        ["Our front desk will call you at " + p.phone + " during office hours, " + HOURS + ". Need us sooner? Call ", [PHONE, TEL], "."]
      ], function () {
        showChips([{ label: "💬 Ask a question", value: "ask" }, { label: "Close", value: "close" }]);
      });
    }, function () {
      typing.remove();
      busy = false;
      clearDraft(); // it is in the queue now; a resumed draft would send it twice
      flow.state = "sent";
      say([
        ["Sorry, I couldn't send that just now, so please don't assume we have it. Call ", [PHONE, TEL], " and the team will book you directly."],
        "I've kept your request on this device and will try sending it again next time you open a page here."
      ], function () {
        showChips([{ label: "💬 Ask a question", value: "ask" }, { label: "Close", value: "close" }]);
      });
    });
  }

  // ---------- open / close / resume ----------
  var started = false;
  var savedDraft = null;

  function resetLog() {
    if (typingTimer) clearTimeout(typingTimer);
    busy = false;
    clearChips();
    Array.prototype.slice.call(messages.children).forEach(function (n) { if (n !== disclaimer) n.remove(); });
  }
  function startOver(fromChip) {
    clearDraft();
    flow = { state: "intent", data: {}, editing: false };
    if (!fromChip) resetLog();
    runStep("intent");
  }
  function resume() {
    var d = savedDraft;
    savedDraft = null;
    flow = { state: d.state, data: d.data || {}, editing: !!d.editing };
    runStep(d.state);
  }

  var RESUMABLE = { topic: 1, office: 1, message: 1, name: 1, phone: 1, email: 1, time: 1, confirm: 1, fix: 1 };
  function openPanel() {
    panel.classList.add("is-open");
    launcher.setAttribute("aria-expanded", "true");
    fitViewport();
    if (!started) {
      started = true;
      var d = load(DRAFT_KEY);
      if (d && d.state && RESUMABLE[d.state] && d.data && Date.now() - (d.t || 0) < DRAFT_TTL) {
        savedDraft = d;
        flow.state = "resume";
        say(["Welcome back! Pick up where you left off?"], function () {
          showChips([{ label: "Continue", value: "resume", cls: "primary" }, { label: "Start over", value: "fresh" }]);
        });
      } else {
        runStep("intent");
      }
    }
    if (window.matchMedia("(min-width: 641px)").matches) input.focus();
    else panel.focus({ preventScroll: true });
  }
  function closePanel() {
    panel.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    panel.style.top = panel.style.bottom = panel.style.height = "";
    launcher.focus();
  }

  /* iOS keeps the layout viewport the same size when the keyboard opens, so a
     panel anchored to the bottom of the screen ends up behind the keyboard.
     On phones, while the keyboard is up, pin the panel to the VISUAL viewport
     (the same fix regenorthopb.com uses). */
  function fitViewport() {
    var vv = window.visualViewport;
    if (!vv || !panel.classList.contains("is-open")) return;
    var phone = window.matchMedia("(max-width: 640px)").matches;
    if (phone && vv.height < window.innerHeight - 120) {
      panel.style.top = (vv.offsetTop + 8) + "px";
      panel.style.bottom = "auto";
      panel.style.height = Math.max(240, vv.height - 16) + "px";
    } else {
      panel.style.top = panel.style.bottom = panel.style.height = "";
    }
    scrollDown();
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fitViewport);
    window.visualViewport.addEventListener("scroll", fitViewport);
  }

  launcher.addEventListener("click", function () {
    if (panel.classList.contains("is-open")) closePanel(); else openPanel();
  });
  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  restartBtn.addEventListener("click", function () { addUser("Start over"); startOver(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) closePanel();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;
    input.value = "";
    if (!started) openPanel();
    typed(text);
  });
})();

/* ---------------------------------------------------------------- analytics
   Lead tracking. Vercel Web Analytics counts pageviews on its own; it counts
   nothing that actually indicates a lead. These are the four moments that do:
   a call started, an email started, an appointment CTA followed, and a request
   confirmed sent.

   Both sibling practice sites (regenorthopb.com, jupiterlaser.com) run the
   same funnel, and the event NAMES match jupiterlaser.com deliberately — one
   decision about which events count as conversions then applies to every
   property instead of three bespoke ones.

   Payload is placement and path only. Never a field value, never a service or
   condition name: attaching "knee pain" to an individual visitor's action is
   the line where analytics becomes a health-privacy problem.

   Two engagement events sit beside them, under the same names on all five
   client sites: directions_click (a link to a map) and chat_open (the visitor
   opens the front desk assistant). Neither is a lead; they show intent.

   Every event goes to Vercel and is mirrored to GA4 (G-1HSFDBS6Q8, loaded in
   <head> on every page except the three PHI forms since 2026-10-23). GA4 is
   what Google Ads imports conversions from. */
(function () {
  "use strict";

  /* The three PHI form pages ship no analytics tag at all, so window.va is
     already absent there and every call below no-ops. This is a second, hard
     guard: if a tag is ever added to the site globally, these pages still
     report nothing. See CLAUDE.md -> "Patient forms — PHI". */
  var PHI_PATHS = [
    "/new-patient-intake-form/",
    "/elite-injection-consent-form/",
    "/elite-medical-records-request/"
  ];
  function isPHIPage() {
    var p = window.location.pathname;
    for (var i = 0; i < PHI_PATHS.length; i++) {
      if (p.indexOf(PHI_PATHS[i]) === 0) return true;
    }
    return false;
  }

  /* Fire-and-forget. A blocked, missing or throwing analytics script must
     never delay a tel: dial or break a page.

     The insights script is `defer`, so it has not run yet when this file
     executes — window.va does not exist during page load. Queue into
     window.vaq instead (the script drains it on load, the same stub Vercel's
     own snippet installs). Without this, form_submit on /thank-you/ — the one
     event fired at load rather than on a click — was silently dropped:
     2026-09-20..28 logged 3 real leads and 0 form_submit events. If no script
     ever loads, the queue is simply never read. */
  function leadEvent(name, data) {
    if (isPHIPage()) return;
    try {
      if (typeof window.va !== "function") {
        window.va = function () {
          (window.vaq = window.vaq || []).push(arguments);
        };
      }
      window.va("event", { name: name, data: data || {} });
    } catch (err) {}
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, data || {});
      }
    } catch (err) {}
  }

  function placementOf(el) {
    if (!el || !el.closest) return "body";
    if (el.closest(".mobile-nav")) return "mobile-nav";
    if (el.closest(".site-header")) return "header";
    if (el.closest(".site-footer")) return "footer";
    if (el.closest(".hero")) return "hero";
    if (el.closest("#ai-assistant-panel, #ai-assistant-launcher")) return "assistant";
    return "body";
  }

  var MAP_LINK = /google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl|maps\.apple\.com|waze\.com/i;
  var chatOpened = false;

  /* Delegated in the capture phase so it covers every link on every page,
     including markup added later, and still records the click on a tel: link
     that navigates away immediately.

     chat_open: capture runs before the launcher's own handler toggles the
     panel, so a click that lands while the panel is closed is the click that
     opens it. Enter and Space on the launcher button arrive as clicks too.
     Once per page view; the assistant never opens itself, so this is always
     the visitor's doing. */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!chatOpened && t && t.closest && t.closest("#ai-assistant-launcher")) {
      var chat = document.getElementById("ai-assistant-panel");
      if (chat && !chat.classList.contains("is-open")) {
        chatOpened = true;
        leadEvent("chat_open", { path: window.location.pathname, location: "assistant" });
      }
      return;
    }
    var a = t && t.closest && t.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var payload = { path: window.location.pathname, location: placementOf(a) };

    if (href.indexOf("tel:") === 0) {
      leadEvent("call_click", payload);
      return;
    }
    if (href.indexOf("mailto:") === 0) {
      leadEvent("email_click", payload);
      return;
    }
    if (MAP_LINK.test(href)) {
      leadEvent("directions_click", payload);
      return;
    }
    if (a.host && a.host !== window.location.host) return;
    if ((a.pathname || "").replace(/\/+$/, "") === "/schedule-appointment") {
      leadEvent("appointment_cta", payload);
    }
  }, { passive: true, capture: true });

  /* Spam LABELLING on the appointment form, never spam blocking — a missed
     real lead costs far more than a read spam email. jupiterlaser.com runs
     the same rule and found its form_submit count ran ~2x real leads because
     cold-pitch and crypto spam typed into the page was counted as a lead.

     On submit this (a) marks the request as having come through the page
     (verified: yes — a bot POSTing straight to /api/lead/ skips this script
     and arrives without it), (b) lists anything suspicious in a `flags`
     field and prefixes the subject so the inbox sorts itself, and (c) if
     flagged, tells /thank-you/ not to count this one as a lead. Nothing here
     stops the send. Flags look at the typed text only to decide the label;
     none of it is sent to analytics. */
  var apptForm = document.querySelector('form[action="/api/lead/"]');
  if (apptForm) {
    var formLoadedAt = Date.now();
    var SPAM_WORDS = /\b(seo|backlinks?|guest post|link building|bitcoin|crypto|coinbase|nft|virtual assistant|va services|web design services)\b/i;
    var setField = function (name, value) {
      var el = apptForm.querySelector('input[name="' + name + '"]');
      if (!el) {
        el = document.createElement("input");
        el.type = "hidden";
        el.name = name;
        apptForm.appendChild(el);
      }
      el.value = value;
    };
    apptForm.addEventListener("submit", function () {
      try {
        var val = function (n) {
          var el = apptForm.elements[n];
          return el ? String(el.value || "") : "";
        };
        var flags = [];
        if ((Date.now() - formLoadedAt) / 1000 < 4) flags.push("filled in under 4s");
        var digits = val("phone").replace(/\D/g, "");
        if (!(digits.length === 10 || (digits.length === 11 && digits.charAt(0) === "1"))) {
          flags.push("phone not a 10-digit US number");
        }
        var typed = [val("first_name"), val("last_name"), val("message")].join(" ");
        if (/https?:\/\/|www\./i.test(typed)) flags.push("contains a link");
        if (SPAM_WORDS.test(typed)) flags.push("matches cold-pitch/crypto spam language");

        setField("verified", "yes");
        setField("flags", flags.length ? flags.join("; ") : "none");
        if (flags.length) {
          var subj = apptForm.querySelector('input[name="_subject"]');
          if (subj && subj.value.indexOf("[Possible spam]") !== 0) {
            subj.value = "[Possible spam] " + subj.value;
          }
        }
        window.sessionStorage.setItem("esm-lead-flagged", flags.length ? "1" : "0");
      } catch (err) {}
    });
  }

  /* An appointment request delivered by the front desk assistant. The
     assistant dispatches this only after /api/lead/ answered success "true",
     so, like /thank-you/, it counts deliveries, not attempts. */
  document.addEventListener("esm:assistant-lead", function () {
    leadEvent("form_submit", { path: window.location.pathname, form: "assistant" });
  });

  /* form_submit fires on /thank-you/, not on submit. The appointment form is a
     plain POST to /api/lead/, which only redirects here (its _next) once the
     lead was actually stored or emailed — so this page IS the confirmed-delivery
     signal, and counting the submit instead would count sends that failed.
     Same rule both sibling sites follow: fire on delivery, not intent.

     The navigation type decides whether this load is a new lead: a form post
     redirected here is "navigate", so it counts every time, including a second
     real request from the same tab. A refresh ("reload") or Back/Forward
     ("back_forward") is the same lead seen again and does not count. Until
     2026-10-30 a sessionStorage flag did this job, but nothing ever cleared
     it, so only the first lead in a tab was ever counted. Old browsers fall
     back to performance.navigation; with neither, the event simply fires,
     since an occasional double beats silently losing the conversion. */
  function navigationType() {
    try {
      var nav = window.performance && window.performance.getEntriesByType &&
        window.performance.getEntriesByType("navigation")[0];
      if (nav && nav.type) return nav.type;
      var legacy = window.performance && window.performance.navigation;
      if (legacy) {
        if (legacy.type === 1) return "reload";
        if (legacy.type === 2) return "back_forward";
        return "navigate";
      }
    } catch (err) {}
    return "navigate";
  }
  if (window.location.pathname.indexOf("/thank-you/") === 0) {
    var navType = navigationType();
    var repeat = navType === "reload" || navType === "back_forward";
    var flagged = false;
    try {
      flagged = window.sessionStorage.getItem("esm-lead-flagged") === "1";
      window.sessionStorage.removeItem("esm-lead-flagged");
      window.sessionStorage.removeItem("esm-thankyou-counted"); // the retired flag
    } catch (err) {}
    if (!repeat && !flagged) {
      leadEvent("form_submit", {
        path: window.location.pathname,
        form: "schedule-appointment"
      });
    }
  }
})();
