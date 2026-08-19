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
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--i", el.dataset.i || i % 6);
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---------------- Animated counters ----------------
  // Custom expo-out easing — matches the CSS --ease token, never linear.
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    var suffix = el.dataset.suffix || "";
    var decimals = el.dataset.count.indexOf(".") > -1 ? el.dataset.count.split(".")[1].length : 0;
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    var duration = 1400;
    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = easeOutExpo(progress);
      var value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var countIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { countIo.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
  }

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

      fetch("/api/chat", {
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
