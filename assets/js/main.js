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
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--i", el.dataset.i || i % 6);
      io.observe(el);
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

  // ---------------- AI Front Desk Assistant ----------------
  var launcher = document.getElementById("ai-assistant-launcher");
  var panel = document.getElementById("ai-assistant-panel");
  var closeBtn = document.getElementById("ai-close");
  var messages = document.getElementById("ai-messages");
  var form = document.getElementById("ai-form");
  var input = document.getElementById("ai-input");
  var history = [];

  function addMsg(role, text) {
    var div = document.createElement("div");
    div.className = "ai-msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTyping() {
    var div = document.createElement("div");
    div.className = "ai-msg bot ai-typing-wrap";
    div.innerHTML = '<span class="ai-typing"><span></span><span></span><span></span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  if (launcher && panel) {
    launcher.addEventListener("click", function () {
      panel.classList.add("is-open");
      launcher.setAttribute("aria-expanded", "true");
      if (!messages.dataset.greeted) {
        addMsg("bot", "Hi, I'm the Elite Sports Medicine front desk assistant. Ask me about services, locations, insurance, or booking with Dr. Matarazzo.");
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

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      addMsg("user", text);
      history.push({ role: "user", content: text });
      input.value = "";
      input.disabled = true;
      var typingEl = addTyping();

      fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("bad response");
          return r.json();
        })
        .then(function (data) {
          typingEl.remove();
          var reply = data.reply || "Sorry, I couldn't process that. Please call 561-202-8886.";
          addMsg("bot", reply);
          history.push({ role: "assistant", content: reply });
        })
        .catch(function () {
          typingEl.remove();
          addMsg("bot", "I'm having trouble connecting right now — please call 561-202-8886 or use the Schedule Appointment page.");
        })
        .finally(function () {
          input.disabled = false;
          input.focus();
        });
    });
  }
})();
