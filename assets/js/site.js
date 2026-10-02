/* Janta website behaviour. Settings (WhatsApp number, timings) come from window.JANTA,
   which build.py writes into every page from _build/data.py. No tracking, no cookies, no storage. */
(function () {
  "use strict";
  var CFG = window.JANTA || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* year */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* mobile menu */
  var burger = $("[data-burger]"), nav = $("#nav");
  if (burger && nav) {
    var setMenu = function (open) {
      nav.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* header shadow + floating buttons */
  var header = $("[data-header]");
  var onScroll = function () {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("scrolled", y > 8);
    document.body.classList.toggle("show-float", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  var top = $("[data-top]");
  if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* live open / closed status, always in India time */
  function istNow() {
    try {
      var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var h = +p.filter(function (x) { return x.type === "hour"; })[0].value % 24;
      var m = +p.filter(function (x) { return x.type === "minute"; })[0].value;
      return h * 60 + m;
    } catch (e) { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  }
  function mins(t) { var a = t.split(":"); return +a[0] * 60 + +a[1]; }
  function fmt(t) {
    var a = t.split(":"), h = +a[0], m = +a[1], s = h < 12 ? "AM" : "PM", h12 = h % 12 || 12;
    return h12 + (m ? ":" + (m < 10 ? "0" : "") + m : "") + " " + s;
  }
  function paintStatus() {
    var now = istNow(), T = CFG.timings || {};
    $$("[data-status]").forEach(function (el) {
      var t = T[el.getAttribute("data-status")];
      if (!t) return;
      var open, text;
      if (t[0] === null) { open = true; text = "Open now, 24 hours"; }
      else {
        var o = mins(t[0]), c = mins(t[1]);
        open = now >= o && now < c;
        if (open) text = "Open now, until " + fmt(t[1]);
        else if (now < o) text = "Opens today at " + fmt(t[0]);
        else text = "Closed now, opens " + fmt(t[0]);
      }
      el.textContent = text;
      el.classList.toggle("is-open", open);
      el.classList.toggle("is-closed", !open);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* map: load Google Maps only when asked */
  $$("[data-map-load]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest("[data-map]");
      var f = document.createElement("iframe");
      f.src = box.getAttribute("data-map");
      f.title = "Map showing Janta at B-22 Gandhi Nagar, Moradabad";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.allowFullscreen = true;
      box.appendChild(f);
      var ph = $(".map-ph", box);
      if (ph) ph.style.visibility = "hidden";
    });
  });

  /* gallery lightbox */
  var lb = $("[data-lb]");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = $("img", lb), lbCap = $("p", lb);
    $$("[data-lightbox]").forEach(function (b) {
      b.addEventListener("click", function () {
        lbImg.src = b.getAttribute("data-lightbox");
        lbImg.alt = b.getAttribute("data-cap") || "";
        lbCap.textContent = b.getAttribute("data-cap") || "";
        lb.showModal();
      });
    });
    $("[data-lb-close]", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  } else {
    $$("[data-lightbox]").forEach(function (b) { b.style.cursor = "default"; });
  }

  /* forms -> WhatsApp message (nothing is stored on the site) */
  $$("[data-wa-form]").forEach(function (form) {
    var err = $(".form-err", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$("input[required]", form).forEach(function (i) {
        var v = i.value.trim(), bad = !v || (i.type === "tel" && v.replace(/\D/g, "").length < 10);
        i.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) ok = false;
      });
      if (err) err.hidden = ok;
      if (!ok) { var first = $("[aria-invalid='true']", form); if (first) first.focus(); return; }
      var kind = form.getAttribute("data-wa-form");
      var lines = [kind === "donor" ? "Hello, I would like to register as a blood donor at Janta Blood Centre." : "Hello, I would like to book a test at Janta."];
      $$("input, select, textarea", form).forEach(function (i) {
        if (!i.name) return;
        if (i.type === "checkbox") { if (i.checked) lines.push(i.name + ": " + i.value); return; }
        if (i.value.trim()) lines.push(i.name + ": " + i.value.trim());
      });
      window.open("https://wa.me/" + CFG.wa + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
    });
  });
})();
