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
  /* SET ANSWERS, no AI. Until 2026-10-30 this posted every message to
     /api/chat, an LLM proxy that needed ANTHROPIC_API_KEY or XAI_API_KEY. The
     Vercel project never had either, so every visitor who typed anything got
     "Our online assistant isn't fully connected yet", and it could not take a
     booking at all. It now works the way the sister sites' assistants do
     (regenorthopb.com, firstrehabnpb.com): fixed answers written only from the
     canonical facts in CLAUDE.md, no medical advice, unknowns go to the phone,
     and a short booking flow that delivers exactly like the appointment form.

     Booking delivery: FormSubmit's AJAX endpoint on the SAME activated alias as
     /schedule-appointment/, so no new activation is needed, with the same _cc
     list plus hello@designofman.com. The AJAX endpoint honours _cc (verified
     against delivered copies from jupiterlaser.com and regenorthopb.com). A
     send is only reported as received when FormSubmit answers success "true";
     anything else keeps the request in localStorage, retries on the next page
     load, and tells the visitor to call. Never loaded on the three PHI pages. */
  var launcher = document.getElementById("ai-assistant-launcher");
  var panel = document.getElementById("ai-assistant-panel");
  var closeBtn = document.getElementById("ai-close");
  var messages = document.getElementById("ai-messages");
  var form = document.getElementById("ai-form");
  var input = document.getElementById("ai-input");

  var PHONE = "561-202-8886";
  var TEL = "tel:+15612028886";
  var ENDPOINT = "https://formsubmit.co/ajax/9603b985721c50e3ba9e2e711ff856e6";
  var CC = "info@elitesportsmed.org,matarazzomd@gmail.com,hello@designofman.com";
  var PENDING_KEY = "esm-assist-pending";
  var PHI_PREFIXES = ["/new-patient-intake-form/", "/elite-injection-consent-form/", "/elite-medical-records-request/"];

  var onPHIPage = PHI_PREFIXES.some(function (p) { return window.location.pathname.indexOf(p) === 0; });
  if (onPHIPage) {
    if (launcher) launcher.remove();
    if (panel) panel.remove();
    launcher = panel = null;
  }

  function scrollDown() { messages.scrollTop = messages.scrollHeight; }

  function addMsg(role, text) {
    var div = document.createElement("div");
    div.className = "ai-msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    messages.appendChild(div);
    scrollDown();
    return div;
  }

  // A bot message with links. Parts are [text] or [label, href]; built with
  // DOM nodes so nothing typed by a visitor is ever parsed as HTML.
  function addRich(parts) {
    var div = document.createElement("div");
    div.className = "ai-msg bot";
    parts.forEach(function (part) {
      if (part.length === 1) {
        div.appendChild(document.createTextNode(part[0]));
      } else {
        var a = document.createElement("a");
        a.textContent = part[0];
        a.href = part[1];
        div.appendChild(a);
      }
    });
    messages.appendChild(div);
    scrollDown();
  }

  function addChips(labels) {
    var wrap = document.createElement("div");
    wrap.className = "ai-chips";
    labels.forEach(function (label) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", function () {
        wrap.remove();
        handle(label);
      });
      wrap.appendChild(b);
    });
    messages.appendChild(wrap);
    scrollDown();
  }

  var MAIN_CHIPS = ["Book an appointment", "Locations & hours", "Services", "About Dr. Matarazzo"];

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

  var CLINICAL = /\b(pain|hurt|swollen|swelling|injur|torn|tear|broke|fractur|diagnos|should i|do i need|surgery or|symptom|medicat|dose|dosing)/i;
  var BOOK = /\b(book|appointment|appt|schedul|consult|see the doctor|be seen|visit|new patient)/i;

  // ---------------- booking flow ----------------
  var booking = null; // { step, data }
  var STEPS = [
    { key: "name", ask: "Happy to set that up. What's your full name?" },
    { key: "phone", ask: "What's the best phone number to reach you?" },
    { key: "email", ask: "And your email? (Type \"skip\" if you'd rather not.)" },
    { key: "office", ask: "Which office works best?", chips: ["Port St. Lucie", "Palm Beach Gardens", "Either"] },
    { key: "reason", ask: "In a few words, what would you like to be seen for? Please leave out medical history and insurance details; the team will go over those on the phone." }
  ];

  function startBooking() {
    booking = { step: 0, data: {} };
    askStep();
  }

  function askStep() {
    var s = STEPS[booking.step];
    addMsg("bot", s.ask);
    if (s.chips) addChips(s.chips);
  }

  function validate(key, value) {
    if (key === "name") return value.length >= 2 ? "" : "Please type your name.";
    if (key === "phone") {
      var d = value.replace(/\D/g, "");
      return d.length === 10 || (d.length === 11 && d.charAt(0) === "1") ? "" : "That doesn't look like a 10-digit phone number. Could you check it?";
    }
    if (key === "email") {
      if (/^skip$/i.test(value)) return "";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? "" : "That email doesn't look right. Try again, or type \"skip\".";
    }
    if (key === "reason") return value.length >= 2 ? "" : "Just a few words is fine.";
    return "";
  }

  function bookingInput(text) {
    var s = STEPS[booking.step];
    var value = text.trim();
    var problem = validate(s.key, value);
    if (problem) { addMsg("bot", problem); if (s.chips) addChips(s.chips); return; }
    booking.data[s.key] = s.key === "email" && /^skip$/i.test(value) ? "" : value.slice(0, s.key === "reason" ? 500 : 200);
    booking.step++;
    if (booking.step < STEPS.length) { askStep(); return; }
    var data = booking.data;
    booking = null;
    sendBooking(data, true);
  }

  function payload(data) {
    return {
      _subject: "[Appointment Request] elitesportsmed.org (website chat)",
      _cc: CC,
      _template: "table",
      _captcha: "false",
      Name: data.name,
      Phone: data.phone,
      Email: data.email || "(not given)",
      "Preferred office": data.office,
      "Reason for visit": data.reason,
      Source: "Website chat assistant",
      Page: window.location.pathname
    };
  }

  function post(data) {
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload(data))
    }).then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (out) {
        if (String(out && out.success) !== "true") throw new Error("not delivered");
        return true;
      });
  }

  function remember(data) { try { window.localStorage.setItem(PENDING_KEY, JSON.stringify(data)); } catch (e) {} }
  function forget() { try { window.localStorage.removeItem(PENDING_KEY); } catch (e) {} }

  function sendBooking(data, interactive) {
    remember(data); // kept until delivery is confirmed, so an outage cannot lose it
    var typing = interactive ? addTyping() : null;
    post(data).then(function () {
      forget();
      if (typing) typing.remove();
      if (interactive) {
        addRich([["Thanks, " + data.name.split(" ")[0] + ". Your request is in, and the team will call you to set a time. If you'd rather not wait, call "], [PHONE, TEL], ["."]]);
      }
      try { document.dispatchEvent(new CustomEvent("esm:assistant-lead")); } catch (e) {}
    }).catch(function () {
      if (typing) typing.remove();
      if (interactive) {
        addRich([["Sorry, I couldn't send that just now, so please don't assume we have it. Call "], [PHONE, TEL], [" and the team will book you directly. I'll also try sending it again next time you open a page here."]]);
      }
    });
  }

  // Retry a request an earlier page could not deliver.
  if (!onPHIPage) {
    try {
      var pending = JSON.parse(window.localStorage.getItem(PENDING_KEY) || "null");
      if (pending && pending.name && pending.phone) sendBooking(pending, false);
    } catch (e) {}
  }

  function addTyping() {
    var div = document.createElement("div");
    div.className = "ai-msg bot ai-typing-wrap";
    div.innerHTML = '<span class="ai-typing"><span></span><span></span><span></span></span>';
    messages.appendChild(div);
    scrollDown();
    return div;
  }

  // ---------------- answering ----------------
  function handle(text) {
    addMsg("user", text);
    if (booking) { bookingInput(text); return; }
    if (BOOK.test(text) && !/\b(form|forms|paperwork)\b/i.test(text)) { startBooking(); return; }
    for (var i = 0; i < ANSWERS.length; i++) {
      if (ANSWERS[i].test.test(text)) {
        addRich(ANSWERS[i].parts);
        addChips(["Book an appointment", "Something else"]);
        return;
      }
    }
    if (/^something else$/i.test(text)) {
      addMsg("bot", "Sure. Ask me about booking, locations and hours, services, or Dr. Matarazzo.");
      addChips(MAIN_CHIPS);
      return;
    }
    if (CLINICAL.test(text)) {
      addRich([["I can't give medical advice, but Dr. Matarazzo can evaluate that in person. I can request an appointment for you, or call "], [PHONE, TEL], ["."]]);
      addChips(["Book an appointment"]);
      return;
    }
    addRich([["I can help with booking, locations and hours, services, or Dr. Matarazzo's background. For anything else, call "], [PHONE, TEL], ["."]]);
    addChips(MAIN_CHIPS);
  }

  if (launcher && panel) {
    launcher.addEventListener("click", function () {
      panel.classList.add("is-open");
      launcher.setAttribute("aria-expanded", "true");
      if (!messages.dataset.greeted) {
        addMsg("bot", "Hi, I'm the Elite Sports Medicine front desk assistant. I can request an appointment for you or answer questions about our offices, hours and services.");
        addChips(MAIN_CHIPS);
        messages.dataset.greeted = "1";
      }
      input && input.focus();
    });
  }
  if (closeBtn && panel) {
    closeBtn.addEventListener("click", function () {
      panel.classList.remove("is-open");
      launcher.setAttribute("aria-expanded", "false");
    });
  }

  if (form && panel) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      handle(text);
      input.focus();
    });
  }
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

   gtag is mirrored but not currently loaded here. It is what Google Ads can
   import as a conversion, so the call is left in place and no-ops until a GA4
   tag is added rather than needing this file edited again on that day. */
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
    if (el.closest(".ai-panel, .ai-launcher")) return "assistant";
    return "body";
  }

  /* Delegated in the capture phase so it covers every link on every page,
     including markup added later, and still records the click on a tel: link
     that navigates away immediately. */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
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
     (verified: yes — a bot POSTing straight to FormSubmit skips this script
     and arrives without it), (b) lists anything suspicious in a `flags`
     field and prefixes the subject so the inbox sorts itself, and (c) if
     flagged, tells /thank-you/ not to count this one as a lead. Nothing here
     stops the send. Flags look at the typed text only to decide the label;
     none of it is sent to analytics. */
  var apptForm = document.querySelector('form[action^="https://formsubmit.co/"]');
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
     assistant dispatches this only after FormSubmit answered success "true",
     so, like /thank-you/, it counts deliveries, not attempts. */
  document.addEventListener("esm:assistant-lead", function () {
    leadEvent("form_submit", { path: window.location.pathname, form: "assistant" });
  });

  /* form_submit fires on /thank-you/, not on submit. The appointment form is a
     plain POST to FormSubmit, which only follows its _next redirect here once
     the send actually succeeded — so this page IS the confirmed-delivery
     signal, and counting the submit instead would count sends that failed.
     Same rule both sibling sites follow: fire on delivery, not intent.

     sessionStorage stops a refresh or a back-navigation from counting the same
     lead twice; if it is unavailable the event simply fires, since an
     occasional double beats silently losing the conversion. */
  if (window.location.pathname.indexOf("/thank-you/") === 0) {
    var counted = false;
    var flagged = false;
    try {
      counted = window.sessionStorage.getItem("esm-thankyou-counted") === "1";
      window.sessionStorage.setItem("esm-thankyou-counted", "1");
      flagged = window.sessionStorage.getItem("esm-lead-flagged") === "1";
      window.sessionStorage.removeItem("esm-lead-flagged");
    } catch (err) {}
    if (!counted && !flagged) {
      leadEvent("form_submit", {
        path: window.location.pathname,
        form: "schedule-appointment"
      });
    }
  }
})();
