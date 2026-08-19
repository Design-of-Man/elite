// ELITE Sports Medicine — interaction layer. No framework, no build step.
(function () {
  "use strict";

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
