/* ------------------------------------------------------------------
   Geenius AI - flattened site runtime
   Replaces the React bundle. No dependencies, no build step.
   Every behaviour here mirrors what the original components did.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ================================================================
     Toasts  (mirrors shadcn useToast)
     ================================================================ */
  var toaster = null;
  function toast(opts) {
    if (!toaster) {
      toaster = document.createElement("div");
      toaster.className = "gx-toaster";
      document.body.appendChild(toaster);
    }
    var el = document.createElement("div");
    el.className = "gx-toast";
    el.setAttribute("role", "status");
    el.setAttribute("data-variant", opts.variant || "default");

    var inner = document.createElement("div");
    inner.className = "gx-toast-inner";
    if (opts.title) {
      var t = document.createElement("div");
      t.className = "gx-toast-title";
      t.textContent = opts.title;
      inner.appendChild(t);
    }
    if (opts.description) {
      var d = document.createElement("div");
      d.className = "gx-toast-desc";
      d.textContent = opts.description;
      inner.appendChild(d);
    }
    var close = document.createElement("button");
    close.className = "gx-toast-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
    close.addEventListener("click", function () { dismiss(); });

    el.appendChild(inner);
    el.appendChild(close);
    toaster.appendChild(el);
    requestAnimationFrame(function () { el.setAttribute("data-state", "open"); });

    var timer = setTimeout(dismiss, 6000);
    function dismiss() {
      clearTimeout(timer);
      el.removeAttribute("data-state");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    }
    return { dismiss: dismiss };
  }

  /* ================================================================
     Popups  (ContactFormPopup / ShowUpScalerFormPopup /
              DatabaseReactivationFormPopup / LeadMagnetFormPopup)
     ================================================================ */
  var popupHost = null;

  function openPopup() {
    if (!popupHost) return;
    popupHost.hidden = false;
    document.body.style.overflow = "hidden";
    var first = popupHost.querySelector("input, select, textarea, button");
    if (first) try { first.focus({ preventScroll: true }); } catch (e) {}
  }
  function closePopup() {
    if (!popupHost) return;
    popupHost.hidden = true;
    document.body.style.overflow = "";
  }

  function initPopups() {
    popupHost = $('[data-gx="popup-host"]');
    // The Navbar "Get Started" button called window.showGeeniusForm(); keep the
    // same global hooks available so external/embedded snippets keep working.
    window.showGeeniusForm = openPopup;
    window.hideGeeniusForm = closePopup;

    if (!popupHost) return;
    document.addEventListener("click", function (e) {
      var opener = e.target.closest && e.target.closest('[data-gx="open-popup"]');
      if (opener) { e.preventDefault(); openPopup(); return; }
      var closer = e.target.closest && e.target.closest('[data-gx="close-popup"]');
      if (closer) { e.preventDefault(); closePopup(); return; }
      var overlay = $('[data-gx="popup-overlay"]', popupHost);
      if (overlay && e.target === overlay) closePopup();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !popupHost.hidden) closePopup();
    });
  }

  /* ================================================================
     Demo widget  (floating "Try Geenius AI" bubble)
     ================================================================ */
  function initDemoWidget() {
    var host = $('[data-gx="demo-widget"]');
    if (!host) return;
    var panel = $('[data-gx="demo-widget-panel"]', host);
    var label = $('[data-gx="demo-widget-label"]', host);
    var fab = $('[data-gx="demo-widget-toggle"]', host);
    if (!panel || !fab) return;

    var iconOpen = fab.innerHTML;
    var iconClose = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x h-6 w-6 text-white"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

    function setOpen(open) {
      panel.hidden = !open;
      if (label) label.hidden = open;
      fab.innerHTML = open ? iconClose : iconOpen;
      fab.setAttribute("aria-expanded", String(open));
    }
    setOpen(false);
    fab.addEventListener("click", function () { setOpen(panel.hidden); });
    var x = $('[data-gx="demo-widget-close"]', panel);
    if (x) x.addEventListener("click", function () { setOpen(false); });
    host.addEventListener("gx:form-success", function () { setOpen(false); });
  }

  /* ================================================================
     Cookie consent
     ================================================================ */
  function initCookieConsent() {
    var bar = $('[data-gx="cookie-bar"]');
    if (!bar) return;
    var stored = null;
    try { stored = localStorage.getItem("cookie-consent"); } catch (e) {}
    bar.hidden = !!stored;
    function decide(value) {
      try { localStorage.setItem("cookie-consent", value); } catch (e) {}
      bar.hidden = true;
    }
    var accept = $('[data-gx="cookie-accept"]', bar);
    var reject = $('[data-gx="cookie-reject"]', bar);
    if (accept) accept.addEventListener("click", function () { decide("accepted"); });
    if (reject) reject.addEventListener("click", function () { decide("rejected"); });
  }

  /* ================================================================
     Accordion  (type="single" collapsible, as the FAQ used)
     ================================================================ */
  function initAccordions() {
    var triggers = $$('[data-gx="accordion-trigger"]');
    if (!triggers.length) return;
    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var content = document.getElementById(trigger.getAttribute("aria-controls"));
        var isOpen = trigger.getAttribute("data-state") === "open";
        // single + collapsible: close everything, then open this one if it was shut
        triggers.forEach(function (t) {
          t.setAttribute("data-state", "closed");
          t.setAttribute("aria-expanded", "false");
          var c = document.getElementById(t.getAttribute("aria-controls"));
          if (c) c.setAttribute("data-state", "closed");
          var item = t.closest("[data-state]");
          if (item && item !== t) item.setAttribute("data-state", "closed");
        });
        if (!isOpen) {
          trigger.setAttribute("data-state", "open");
          trigger.setAttribute("aria-expanded", "true");
          if (content) content.setAttribute("data-state", "open");
          var parentItem = trigger.parentElement && trigger.parentElement.parentElement;
          if (parentItem && parentItem.hasAttribute("data-state")) parentItem.setAttribute("data-state", "open");
          var header = trigger.parentElement;
          if (header && header.hasAttribute("data-state")) header.setAttribute("data-state", "open");
        }
      });
    });
  }

  /* ================================================================
     Checkboxes  (Radix checkbox markup, driven without React)
     ================================================================ */
  function initCheckboxes(root) {
    $$('[data-gx="checkbox"]', root).forEach(function (box) {
      if (box.__gxInit) return;
      box.__gxInit = true;
      // keep a real input around so the browser can enforce `required`
      var hidden = document.createElement("input");
      hidden.type = "checkbox";
      hidden.name = box.id || "consent";
      hidden.id = (box.id || "consent") + "-input";
      hidden.required = box.getAttribute("aria-required") === "true";
      hidden.tabIndex = -1;
      hidden.setAttribute("aria-hidden", "true");
      hidden.style.cssText = "position:absolute;opacity:0;width:1px;height:1px;pointer-events:none;margin:0";
      box.parentNode.insertBefore(hidden, box.nextSibling);
      box.__gxInput = hidden;

      function set(checked) {
        box.setAttribute("data-state", checked ? "checked" : "unchecked");
        box.setAttribute("aria-checked", String(checked));
        hidden.checked = checked;
        var ind = $('[data-gx="checkbox-indicator"]', box);
        if (ind) ind.style.display = checked ? "flex" : "none";
      }
      box.__gxSet = set;
      set(false);

      box.addEventListener("click", function (e) {
        e.preventDefault();
        set(box.getAttribute("data-state") !== "checked");
      });
      box.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          set(box.getAttribute("data-state") !== "checked");
        }
      });
      // the visible <label for="..."> still points at the Radix button id
      if (box.id) {
        var label = document.querySelector('label[for="' + CSS.escape(box.id) + '"]');
        if (label) label.addEventListener("click", function (e) {
          e.preventDefault();
          set(box.getAttribute("data-state") !== "checked");
        });
      }
    });
  }

  /* ================================================================
     Forms  (POST to the same LeadConnector webhooks as the React app)
     ================================================================ */
  function initForms(root) {
    $$('form[data-gx-webhook]', root).forEach(function (form) {
      if (form.__gxInit) return;
      form.__gxInit = true;

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var webhook = form.getAttribute("data-gx-webhook");
        var successMsg = form.getAttribute("data-gx-success");
        var errorMsg = form.getAttribute("data-gx-error") || "Something went wrong. Please try again.";
        var redirect = form.getAttribute("data-gx-redirect");
        var source = form.getAttribute("data-gx-source");
        var shouldReset = form.hasAttribute("data-gx-reset");

        var data = {};
        $$("input, select, textarea", form).forEach(function (field) {
          if (!field.name || field.getAttribute("aria-hidden") === "true") return;
          if (field.type === "checkbox") { data[field.name] = field.checked; return; }
          data[field.name] = field.value;
        });
        // Radix checkboxes carry their value on the button, not an input
        $$('[data-gx="checkbox"]', form).forEach(function (box) {
          var key = box.id || "consent";
          data[key] = box.getAttribute("data-state") === "checked";
        });

        var consentBox = $('[data-gx="checkbox"]', form);
        if (consentBox && consentBox.getAttribute("data-state") !== "checked") {
          toast({ title: "Consent Required", description: "Please consent to receive communications.", variant: "destructive" });
          return;
        }
        // ShowUpScaler required every field before submitting
        if (form.getAttribute("data-gx-form") === "showupscaler") {
          var missing = $$("input", form).some(function (i) {
            return i.required && i.getAttribute("aria-hidden") !== "true" && !i.value.trim();
          });
          if (missing) {
            toast({ title: "All Fields Required", description: "Please fill in all fields before submitting.", variant: "destructive" });
            return;
          }
        }
        if (source) data.source = source;

        var submitBtn = form.querySelector('button[type="submit"]') || form.querySelector("button:not([data-gx])");
        var originalHTML = submitBtn ? submitBtn.innerHTML : null;
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Submitting..."; }

        fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        })
          .then(function (res) {
            if (!res.ok) throw new Error("Failed to submit");
            if (redirect) { window.location.href = redirect; return; }
            if (successMsg) toast({ title: "Success!", description: successMsg });
            if (shouldReset) {
              form.reset();
              $$('[data-gx="checkbox"]', form).forEach(function (b) { if (b.__gxSet) b.__gxSet(false); });
            }
            form.dispatchEvent(new CustomEvent("gx:form-success", { bubbles: true }));
            closePopup();
          })
          .catch(function () {
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
          })
          .finally(function () {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalHTML; }
          });
      });
    });
  }

  /* ================================================================
     Tooltips
     ================================================================ */
  function initTooltips() {
    var triggers = $$('[data-gx="tooltip-trigger"]');
    if (!triggers.length) return;
    var tip = document.createElement("div");
    tip.className = "gx-tooltip";
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);
    var hideTimer = null;

    function show(el) {
      clearTimeout(hideTimer);
      tip.textContent = el.getAttribute("data-gx-tip") || "";
      tip.setAttribute("data-state", "open");
      var r = el.getBoundingClientRect();
      var t = tip.getBoundingClientRect();
      var left = r.left - t.width - 8;
      if (left < 8) left = r.right + 8;                       // flip when it won't fit
      if (left + t.width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - t.width - 8);
      var top = r.top + r.height / 2 - t.height / 2;
      top = Math.max(8, Math.min(top, window.innerHeight - t.height - 8));
      tip.style.left = left + "px";
      tip.style.top = top + "px";
    }
    function hide() {
      hideTimer = setTimeout(function () { tip.removeAttribute("data-state"); }, 80);
    }
    triggers.forEach(function (el) {
      el.addEventListener("mouseenter", function () { show(el); });
      el.addEventListener("focus", function () { show(el); });
      el.addEventListener("mouseleave", hide);
      el.addEventListener("blur", hide);
      el.addEventListener("click", function (e) { e.preventDefault(); show(el); });
    });
    window.addEventListener("scroll", function () { tip.removeAttribute("data-state"); }, { passive: true });
  }

  /* ================================================================
     Carousel  (loop + centre alignment, matching the embla options used:
                { loop: true, align: "center", slidesToScroll: 1 })
     ================================================================ */
  function initCarousels() {
    $$('[data-gx="carousel"]').forEach(function (root) {
      var track = $('[data-gx="carousel-track"]', root);
      var slides = $$('[data-gx="carousel-slide"]', root);
      var viewport = track && track.parentElement;
      if (!track || slides.length < 2 || !viewport) return;

      var index = 0, tx = 0, animating = false;
      slides.forEach(function (s) { s.style.transform = ""; });

      function setTx(v, animate) {
        if (!animate) {
          track.style.transition = "none";
          track.style.transform = "translate3d(" + v + "px, 0, 0)";
          void track.offsetHeight;                 // flush, so the next change animates
          track.style.transition = "";
        } else {
          track.style.transition = "";
          track.style.transform = "translate3d(" + v + "px, 0, 0)";
        }
        tx = v;
      }

      // Loop without cloning: flex `order` rotates the slides into a ring so the
      // active slide always has a neighbour peeking on each side, exactly as
      // embla's loop mode renders it - and every <video> stays unique.
      function ring() {
        var n = slides.length;
        slides.forEach(function (s, i) {
          var d = ((i - index) % n + n) % n;
          var signed = d > n / 2 ? d - n : d;
          s.style.order = String(signed + n);
          s.setAttribute("aria-hidden", String(i !== index));
        });
      }

      // Positions are derived arithmetically from the viewport and track boxes
      // rather than read off the slides: right after `order` changes, slide
      // rects can still report their pre-reorder positions.
      function slideWidth() { return slides[0].getBoundingClientRect().width; }
      function midPosition() { return Math.floor((slides.length - 1) / 2); }

      function centre(animate) {
        var vp = viewport.getBoundingClientRect();
        var w = slideWidth();
        var trackOrigin = track.getBoundingClientRect().left - tx;   // untransformed
        var desired = vp.left + (vp.width - w) / 2;
        setTx(desired - (trackOrigin + midPosition() * w), animate);
      }

      function go(delta) {
        if (animating) return;
        animating = true;
        var step = slideWidth();
        setTx(tx - delta * step, true);
        var fallback = setTimeout(finish, 700);
        function onEnd(e) {
          // slides carry their own `transition-all`, so their transitionend
          // bubbles up here; only the track's own transform ends the step.
          if (e && (e.target !== track || e.propertyName !== "transform")) return;
          finish();
        }
        function finish() {
          if (!animating) return;
          clearTimeout(fallback);
          track.removeEventListener("transitionend", onEnd);
          index = (index + delta + slides.length) % slides.length;
          ring();
          centre(false);
          animating = false;
        }
        track.addEventListener("transitionend", onEnd);
      }

      var prev = $('[data-gx="carousel-prev"]', root);
      var next = $('[data-gx="carousel-next"]', root);
      if (prev) prev.addEventListener("click", function () { go(-1); });
      if (next) next.addEventListener("click", function () { go(1); });
      root.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      });

      var startX = null;
      viewport.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
      viewport.addEventListener("touchend", function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        startX = null;
      });

      window.addEventListener("resize", function () { centre(false); });
      ring();
      centre(false);
    });
  }

  /* ================================================================
     Sliders  (Radix slider markup, driven without React)
     ================================================================ */
  function initSliders() {
    $$('[data-gx="slider"]').forEach(function (root) {
      var thumb = $('[data-gx="slider-thumb"]', root);
      // the thumb sits in its own positioned wrapper; the range fill is a
      // different element that also carries a `left` style, so match on the
      // thumb's parent rather than the first `[style*=left]` in the slider.
      var thumbWrap = thumb && thumb.parentElement;
      var range = root.querySelector("span.absolute.h-full");
      if (!thumb || !thumbWrap || !range) return;

      var min = Number(thumb.getAttribute("aria-valuemin") || 0);
      var max = Number(thumb.getAttribute("aria-valuemax") || 100);
      var step = Number(root.getAttribute("data-gx-step") || 1);

      function value() { return Number(thumb.getAttribute("aria-valuenow") || min); }
      function set(v, emit) {
        v = Math.max(min, Math.min(max, Math.round(v / step) * step));
        thumb.setAttribute("aria-valuenow", String(v));
        var pct = max === min ? 0 : (v - min) / (max - min);
        range.style.right = (100 - pct * 100) + "%";
        var w = thumb.offsetWidth || 20;
        thumbWrap.style.left = "calc(" + (pct * 100) + "% + " + ((0.5 - pct) * w).toFixed(2) + "px)";
        if (emit !== false) root.dispatchEvent(new CustomEvent("gx:slider", { detail: { value: v }, bubbles: true }));
      }
      root.__gxSet = function (v) { set(v, false); };
      root.__gxValue = value;

      function fromPointer(clientX) {
        var r = root.getBoundingClientRect();
        var pct = r.width ? (clientX - r.left) / r.width : 0;
        set(min + pct * (max - min));
      }
      var dragging = false;
      root.addEventListener("pointerdown", function (e) {
        dragging = true;
        root.setPointerCapture(e.pointerId);
        fromPointer(e.clientX);
        thumb.focus();
      });
      root.addEventListener("pointermove", function (e) { if (dragging) fromPointer(e.clientX); });
      root.addEventListener("pointerup", function (e) { dragging = false; try { root.releasePointerCapture(e.pointerId); } catch (err) {} });
      root.addEventListener("pointercancel", function () { dragging = false; });
      thumb.addEventListener("keydown", function (e) {
        var v = value(), d = 0;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") d = step;
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = -step;
        else if (e.key === "Home") { set(min); e.preventDefault(); return; }
        else if (e.key === "End") { set(max); e.preventDefault(); return; }
        else if (e.key === "PageUp") d = step * 10;
        else if (e.key === "PageDown") d = -step * 10;
        else return;
        e.preventDefault();
        set(v + d);
      });
      set(value(), false);
    });
  }

  /* ================================================================
     Call Cost Calculator
     ================================================================ */
  var AGENT_STEPS = [1, 3, 10, 20, 30, 40, 50];

  function initCallCostCalculator() {
    var totalEl = $('[data-gx-out="total"]');
    if (!totalEl || !$('[data-gx-calc-slider]')) return;

    var state = { connectRate: 50, callingHours: 8, agents: 0, costPerMinute: 0.8 };

    var sliders = {};
    var inputs = {};
    $$('[data-gx-calc-slider]').forEach(function (s) { sliders[s.getAttribute("data-gx-calc-slider")] = s; });
    $$('[data-gx-calc-input]').forEach(function (i) { inputs[i.getAttribute("data-gx-calc-input")] = i; });

    function render() {
      var agents = AGENT_STEPS[state.agents];
      var total = 60 * (state.connectRate / 100) * state.callingHours * agents * state.costPerMinute;

      if (inputs.connectRate) inputs.connectRate.value = String(state.connectRate);
      if (inputs.callingHours) inputs.callingHours.value = String(state.callingHours);
      if (inputs.agents) inputs.agents.value = String(agents);
      if (inputs.costPerMinute) inputs.costPerMinute.value = "£" + state.costPerMinute.toFixed(2);

      if (sliders.connectRate && sliders.connectRate.__gxSet) sliders.connectRate.__gxSet(state.connectRate);
      if (sliders.callingHours && sliders.callingHours.__gxSet) sliders.callingHours.__gxSet(state.callingHours);
      if (sliders.agents && sliders.agents.__gxSet) sliders.agents.__gxSet(state.agents);
      if (sliders.costPerMinute && sliders.costPerMinute.__gxSet) sliders.costPerMinute.__gxSet(Math.round((state.costPerMinute - 0.10) * 100));

      var out = {
        connect: state.connectRate + "%",
        hours: String(state.callingHours),
        agents: String(agents),
        cpm: "£" + state.costPerMinute.toFixed(2)
      };
      Object.keys(out).forEach(function (k) {
        var el = $('[data-gx-out="' + k + '"]');
        if (el) el.textContent = out[k];
      });
      var breakdown = $('[data-gx-out="breakdown"]');
      if (breakdown) {
        // " agent"/" agents" lives in a bare text node after the agents span,
        // together with the "\u00d7 " separator that leads into the next term.
        var span = $('[data-gx-out="agents"]', breakdown);
        var node = span && span.nextSibling;
        if (node && node.nodeType === 3) {
          if (span.__gxSuffix === undefined) span.__gxSuffix = node.nodeValue.replace(/^\s*agents?/, "");
          node.nodeValue = (agents !== 1 ? " agents" : " agent") + span.__gxSuffix;
        }
      }
      totalEl.textContent = "£" + total.toFixed(2);
    }

    function bind(key, sliderTransform, inputParse) {
      var slider = sliders[key];
      if (slider) {
        slider.addEventListener("gx:slider", function (e) {
          state[key] = sliderTransform(e.detail.value);
          render();
        });
      }
      var input = inputs[key];
      if (input) {
        input.addEventListener("input", function () {
          var v = inputParse(input.value);
          if (v !== null) { state[key] = v; render(); }
        });
        input.addEventListener("blur", render);
      }
    }

    bind("connectRate", function (v) { return v; }, function (val) {
      var n = parseInt(val, 10);
      if (!isNaN(n)) return Math.min(100, Math.max(0, n));
      if (val === "") return 0;
      return null;
    });
    bind("callingHours", function (v) { return v; }, function (val) {
      var n = parseInt(val, 10);
      if (!isNaN(n)) return Math.min(24, Math.max(0, n));
      if (val === "") return 0;
      return null;
    });
    bind("agents", function (v) { return v; }, function (val) {
      var n = parseInt(val, 10);
      if (isNaN(n)) return null;
      var closest = 0;
      for (var i = 1; i < AGENT_STEPS.length; i++) {
        if (Math.abs(AGENT_STEPS[i] - n) < Math.abs(AGENT_STEPS[closest] - n)) closest = i;
      }
      return closest;
    });
    bind("costPerMinute", function (v) { return Math.round((v / 100 + 0.10) * 100) / 100; }, function (val) {
      var n = parseFloat(String(val).replace("£", ""));
      if (isNaN(n)) return null;
      return Math.min(1.0, Math.max(0.10, Math.round(n * 100) / 100));
    });

    render();
  }

  /* ================================================================
     Database Reactivation revenue calculator
     ================================================================ */
  function initDormantRevenueCalculator() {
    var amount = $('[data-gx-out="dormantRevenue"]');
    if (!amount) return;
    var box = $('[data-gx-out="revenueBox"]');
    var note = $('[data-gx-out="revenueNote"]');
    var leadCount = document.getElementById("leadCount");
    var conversionRate = document.getElementById("conversionRate");
    var saleValue = document.getElementById("saleValue");
    if (!leadCount || !conversionRate || !saleValue) return;

    function render() {
      var leads = parseFloat(leadCount.value) || 0;
      var conversion = (parseFloat(conversionRate.value) || 0) / 100;
      var value = parseFloat(saleValue.value) || 0;
      var revenue = leads * conversion * value;
      var valid = parseFloat(leadCount.value) > 0 && parseFloat(conversionRate.value) > 0 && parseFloat(saleValue.value) > 0;

      amount.textContent = valid ? revenue.toLocaleString("en-GB", { maximumFractionDigits: 0 }) : "0";
      if (box) {
        box.classList.toggle("scale-100", valid);
        box.classList.toggle("opacity-100", valid);
        box.classList.toggle("scale-95", !valid);
        box.classList.toggle("opacity-50", !valid);
      }
      if (note) {
        note.textContent = valid
          ? "Based on " + parseInt(leadCount.value, 10).toLocaleString() + " leads × " + conversionRate.value +
            "% conversion × £" + parseInt(saleValue.value, 10).toLocaleString() + " per sale"
          : "Enter your numbers above to see your potential";
      }
    }
    [leadCount, conversionRate, saleValue].forEach(function (el) {
      el.addEventListener("input", render);
    });
    render();
  }

  /* ================================================================
     Scroll-to-target buttons  (scrollToCalendar)
     ================================================================ */
  function initScrollButtons() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest('[data-gx="scroll-to"]');
      if (!btn) return;
      e.preventDefault();
      var sel = btn.getAttribute("data-gx-target") || "#booking-calendar";
      var target = sel ? document.querySelector(sel) : null;
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ================================================================
     Video play overlays  (handlePlayClick: restart, unmute, controls)
     ================================================================ */
  function initVideoOverlays() {
    $$('[data-gx="play-video"]').forEach(function (overlay) {
      overlay.addEventListener("click", function () {
        var wrap = overlay.parentElement;
        var video = wrap && wrap.querySelector("video");
        if (!video) return;
        video.currentTime = 0;
        video.muted = false;
        video.controls = true;
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
        overlay.hidden = true;
      });
    });
  }

  /* ================================================================
     Fade-in sections  (IntersectionObserver, as on the AI guide page)
     ================================================================ */
  function initFadeSections() {
    var sections = $$(".fade-section");
    if (!sections.length) return;
    if (!("IntersectionObserver" in window)) {
      sections.forEach(function (el) {
        el.classList.add("opacity-100", "translate-y-0");
        el.classList.remove("opacity-0", "translate-y-6");
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-6");
        }
      });
    }, { threshold: 0.1 });
    sections.forEach(function (el) { observer.observe(el); });
  }

  /* ================================================================
     Parallax book  (mouse tilt on the AI guide hero)
     ================================================================ */
  function initParallax() {
    $$('[data-gx="parallax-host"]').forEach(function (host) {
      var target = $('[data-gx="parallax-target"]', host);
      if (!target) return;
      function apply(x, y, resting) {
        target.style.transition = resting
          ? "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.5s ease-out"
          : "transform 0.08s linear, filter 0.08s linear";
        target.style.transform =
          "perspective(600px) rotateY(" + x * 20 + "deg) rotateX(" + -y * 15 +
          "deg) scale(" + (1 + Math.abs(x * 0.03) + Math.abs(y * 0.02)) + ")";
        target.style.filter =
          "drop-shadow(" + -x * 25 + "px " + (y * 15 + 20) + "px 35px hsl(var(--foreground) / 0.35))";
      }
      host.addEventListener("mousemove", function (e) {
        var r = host.getBoundingClientRect();
        apply(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2, false);
      });
      host.addEventListener("mouseleave", function () { apply(0, 0, true); });
    });
  }

  /* ================================================================
     Boot
     ================================================================ */

  /* ================================================================
     Use-case selector  (tablist, replaces the six-card grid)
     ================================================================ */
  function initUseCaseSelector() {
    var tabs = $$('[data-gx="usecase-tab"]');
    if (!tabs.length) return;

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.setAttribute("tabindex", on ? "0" : "-1");
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(tab, false);
        // stacked layout: the panel sits below the list, so bring it into view
        if (window.matchMedia("(max-width: 1023px)").matches) {
          var panels = tab.closest(".gx-uc").querySelector(".gx-uc-panels");
          if (panels && panels.getBoundingClientRect().top > window.innerHeight * 0.6) {
            window.scrollTo({
              top: panels.getBoundingClientRect().top + window.scrollY - 90,
              behavior: "smooth"
            });
          }
        }
      });
      tab.addEventListener("keydown", function (e) {
        var step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1
                 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
        if (step) {
          e.preventDefault();
          select(tabs[(i + step + tabs.length) % tabs.length], true);
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          select(e.key === "Home" ? tabs[0] : tabs[tabs.length - 1], true);
        }
      });
    });
  }

  function boot() {
    initPopups();
    initDemoWidget();
    initCookieConsent();
    initAccordions();
    initCheckboxes(document);
    initForms(document);
    initTooltips();
    initUseCaseSelector();
    initCarousels();
    initSliders();
    initCallCostCalculator();
    initDormantRevenueCalculator();
    initScrollButtons();
    initVideoOverlays();
    initFadeSections();
    initParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
