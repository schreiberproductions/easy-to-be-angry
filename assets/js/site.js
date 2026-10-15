(function () {
  'use strict';

  var nav = document.querySelector('.nav');
  if (!nav) return;

  var toggle = nav.querySelector('.nav__toggle');
  var list = nav.querySelector('.nav__list');
  var mq = window.matchMedia('(max-width: 860px)');

  // Bar is transparent at the top of the page and gains a frosted panel once
  // content would otherwise scroll underneath it.
  var onNavScroll = function () {
    nav.classList.toggle('nav--scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  function setMenu(open) {
    list.setAttribute('data-open', String(open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.nav__toggle-label').textContent = open ? 'Close' : 'Menu';
  }

  toggle.addEventListener('click', function () {
    setMenu(list.getAttribute('data-open') !== 'true');
  });

  // Submenus open on hover/focus on desktop (CSS). On mobile they are simply
  // shown, so tapping "Learn" goes to the Learn page rather than being eaten
  // by a toggle — the sections underneath are still one tap away.
  function syncSubmenus() {
    nav.querySelectorAll('.nav__item--has-menu').forEach(function (item) {
      var trigger = item.querySelector('.nav__link');
      var submenu = item.querySelector('.nav__submenu');
      submenu.setAttribute('data-open', String(mq.matches));
      trigger.setAttribute('aria-expanded', String(mq.matches));
    });
  }

  syncSubmenus();

  mq.addEventListener('change', function (e) {
    if (!e.matches) setMenu(false);
    syncSubmenus();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && list.getAttribute('data-open') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

  // Carousel. Scroll-snap already gives native swipe and keyboard scrolling;
  // this only wires up the buttons, dots and the live count. Without JS the
  // viewport is still a scrollable, swipeable row — nothing is lost.
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var viewport = root.querySelector('.carousel__viewport');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.quote-card'));
    var prev = root.querySelector('.carousel__btn--prev');
    var next = root.querySelector('.carousel__btn--next');
    var dotWrap = root.querySelector('.carousel__dots');
    var count = root.querySelector('.carousel__count');
    if (!viewport || slides.length < 2) return;

    var current = 0;

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Example ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dotWrap.appendChild(b);
      return b;
    });

    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      viewport.scrollTo({ left: slides[i].offsetLeft - viewport.offsetLeft, behavior: 'smooth' });
    }

    function sync() {
      // Derive the active slide from scroll position so swipes, button presses
      // and keyboard scrolling all report the same thing.
      var mid = viewport.scrollLeft + viewport.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      slides.forEach(function (s, i) {
        var c = s.offsetLeft - viewport.offsetLeft + s.offsetWidth / 2;
        var d = Math.abs(c - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      if (best !== current) {
        current = best;
        dots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === current)); });
        if (count) count.textContent = (current + 1) + ' of ' + slides.length;
      }
      prev.disabled = viewport.scrollLeft <= 2;
      next.disabled = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 2;
    }

    prev.addEventListener('click', function () { go(current - 1); });
    next.addEventListener('click', function () { go(current + 1); });

    var queued = false;
    viewport.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; sync(); });
    }, { passive: true });

    window.addEventListener('resize', sync);

    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); go(current - 1); }
    });

    dots[0].setAttribute('aria-selected', 'true');
    sync();
  });

  // Bubble chart. Hovering lifts the bubble under the pointer and eases its
  // neighbours gently aside; the tooltip anchors to the bubble rather than the
  // cursor so it doesn't jitter while the pointer moves inside a circle.
  document.querySelectorAll('[data-bubbles]').forEach(function (root) {
    var svg = root.querySelector('.bubbles__svg');
    var tip = root.querySelector('.bubbles__tip');
    var head = tip.querySelector('.bubbles__tip-head');
    var needs = tip.querySelector('.bubbles__tip-needs');
    var bubbles = Array.prototype.slice.call(root.querySelectorAll('.bub'));
    if (!bubbles.length) return;

    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // centres in viewBox units, read once from the packing values
    var pts = bubbles.map(function (b) {
      return {
        el: b,
        x: parseFloat(b.style.getPropertyValue('--bx')),
        y: parseFloat(b.style.getPropertyValue('--by')),
        r: parseFloat(b.querySelector('circle').getAttribute('r'))
      };
    });

    var lastX = 0, lastY = 0, queued = false;

    // Follows the pointer. Position is written straight to the element rather
    // than transitioned, so it tracks instead of lagging behind the cursor.
    function place(x, y) {
      var cb = root.getBoundingClientRect();
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var pad = 14;
      // Clamped to the viewport, not to the chart box — the chart is barely
      // bigger than the bubbles, so clamping to it flipped the tooltip back
      // over the circles on almost every hover.
      var vx = x + 18, vy = y + 18;
      if (vx + tw > window.innerWidth - pad) vx = x - tw - 18;
      if (vx < pad) vx = pad;
      if (vy + th > window.innerHeight - pad) vy = y - th - 18;
      if (vy < pad) vy = pad;
      tip.style.left = (vx - cb.left) + 'px';
      tip.style.top = (vy - cb.top) + 'px';
    }

    function clear() {
      pts.forEach(function (p) {
        p.el.style.removeProperty('--dx');
        p.el.style.removeProperty('--dy');
        p.el.style.removeProperty('--s');
      });
    }

    function activate(target) {
      var hit = pts.find(function (p) { return p.el === target; });
      if (!hit) return;

      if (!calm) {
        pts.forEach(function (p) {
          if (p === hit) {
            p.el.style.setProperty('--s', '1.07');
            return;
          }
          // clear the scale from whichever bubble was hovered before, or it
          // stays enlarged and they accumulate as the pointer moves around
          p.el.style.removeProperty('--s');
          var dx = p.x - hit.x, dy = p.y - hit.y;
          var d = Math.hypot(dx, dy) || 1;
          var push = 16 * Math.exp(-d / 150);          // only near neighbours shift
          p.el.style.setProperty('--dx', (dx / d * push).toFixed(2) + 'px');
          p.el.style.setProperty('--dy', (dy / d * push).toFixed(2) + 'px');
        });
      }

      head.textContent = target.dataset.label;
      needs.innerHTML = '<b>Underlying Needs:</b> ' +
        target.dataset.needs.replace(/[&<>]/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
        });

      tip.hidden = false;
      tip.setAttribute('data-show', 'true');
      place(lastX, lastY);
    }

    function deactivate() {
      clear();
      tip.setAttribute('data-show', 'false');
    }

    // Hover drives this on a mouse; on touch there is no hover at all, so a tap
    // has to open the tooltip or the underlying needs are unreachable on a phone.
    var canHover = window.matchMedia('(hover: hover)').matches;

    bubbles.forEach(function (b) {
      if (canHover) {
        b.addEventListener('pointerenter', function () { activate(b); });
      }
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        // a tap has no prior pointermove, so seed the position from the tap
        if (e.clientX || e.clientY) { lastX = e.clientX; lastY = e.clientY; }
        if (tip.getAttribute('data-show') === 'true' && tip.dataset.for === b.dataset.label) {
          deactivate();
        } else {
          tip.dataset.for = b.dataset.label;
          activate(b);
        }
      });
    });

    // focus/blur don't reliably reach listeners bound to SVG groups, but
    // focusin/focusout bubble, so delegate from the svg instead.
    svg.addEventListener('focusin', function (e) {
      var b = e.target.closest && e.target.closest('.bub');
      if (b) activate(b);
    });
    svg.addEventListener('focusout', function (e) {
      if (!svg.contains(e.relatedTarget)) deactivate();
    });

    if (canHover) {
      svg.addEventListener('pointerleave', deactivate);
      svg.addEventListener('pointermove', function (e) {
        lastX = e.clientX; lastY = e.clientY;
        if (tip.getAttribute('data-show') !== 'true' || queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; place(lastX, lastY); });
      }, { passive: true });
    }
    document.addEventListener('click', function () {
      if (!canHover) deactivate();
    });
    tip.addEventListener('transitionend', function () {
      if (tip.getAttribute('data-show') !== 'true') tip.hidden = true;
    });
  });

  // Stacked column chart. Each block is one logged event; hovering dims the
  // rest and names the need behind that one. Same tooltip behaviour as the
  // bubble chart, including clamping to the viewport rather than the figure.
  document.querySelectorAll('[data-bars]').forEach(function (root) {
    var svg = root.querySelector('.bars__svg');
    var tip = root.querySelector('.bars__tip');
    var head = tip && tip.querySelector('.bars__tip-head');
    var need = tip && tip.querySelector('.bars__tip-need');
    var segs = Array.prototype.slice.call(root.querySelectorAll('.bars__seg'));
    // bail rather than throw: a missing tooltip used to take down every
    // listener set up after this block, including the scroll reveal
    if (!segs.length || !svg || !tip || !head || !need) return;

    var lastX = 0, lastY = 0, queued = false;

    function place(x, y) {
      var cb = root.getBoundingClientRect();
      var tw = tip.offsetWidth, th = tip.offsetHeight, pad = 14;
      var vx = x + 18, vy = y + 18;
      if (vx + tw > window.innerWidth - pad) vx = x - tw - 18;
      if (vx < pad) vx = pad;
      if (vy + th > window.innerHeight - pad) vy = y - th - 18;
      if (vy < pad) vy = pad;
      tip.style.left = (vx - cb.left) + 'px';
      tip.style.top = (vy - cb.top) + 'px';
    }

    function activate(seg) {
      segs.forEach(function (s) { s.removeAttribute('data-on'); });
      seg.setAttribute('data-on', '');
      root.classList.add('is-focused');
      head.textContent = seg.dataset.when;
      need.innerHTML = '<b>Underlying need:</b> ' +
        seg.dataset.need.replace(/[&<>]/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
        });
      tip.hidden = false;
      tip.setAttribute('data-show', 'true');
      place(lastX, lastY);
    }

    function deactivate() {
      segs.forEach(function (s) { s.removeAttribute('data-on'); });
      root.classList.remove('is-focused');
      tip.setAttribute('data-show', 'false');
    }

    var canHover = window.matchMedia('(hover: hover)').matches;

    segs.forEach(function (seg) {
      if (canHover) seg.addEventListener('pointerenter', function () { activate(seg); });
      seg.addEventListener('click', function (e) {
        e.stopPropagation();
        if (e.clientX || e.clientY) { lastX = e.clientX; lastY = e.clientY; }
        if (tip.getAttribute('data-show') === 'true' && seg.hasAttribute('data-on')) deactivate();
        else activate(seg);
      });
    });

    if (canHover) {
      svg.addEventListener('pointerleave', deactivate);
      svg.addEventListener('pointermove', function (e) {
        lastX = e.clientX; lastY = e.clientY;
        if (tip.getAttribute('data-show') !== 'true' || queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; place(lastX, lastY); });
      }, { passive: true });
    }
    document.addEventListener('click', function () { if (!canHover) deactivate(); });
    tip.addEventListener('transitionend', function () {
      if (tip.getAttribute('data-show') !== 'true') tip.hidden = true;
    });
  });

  // The four "masking" panels as tabs. The strip is built from the panels'
  // own headings rather than duplicated in the markup, and it is only added
  // here — so with JS off the page keeps all four headings and all the text.
  document.querySelectorAll('[data-masking]').forEach(function (root) {
    var panels = Array.prototype.slice.call(root.querySelectorAll('.masking__panel'));
    if (panels.length < 2) return;

    var prefix = root.dataset.maskingPrefix || '';

    var lead = document.createElement('p');
    lead.className = 'masking__lead';
    lead.textContent = prefix.trim() + '\u2026';

    var strip = document.createElement('div');
    strip.className = 'masking__tabs';
    strip.setAttribute('role', 'tablist');
    strip.setAttribute('aria-label', 'What your anger may be masking');

    var tabs = panels.map(function (panel, i) {
      var heading = panel.querySelector('.subhead-major');
      var full = heading ? heading.textContent.trim() : 'Section ' + (i + 1);
      var label = full.indexOf(prefix) === 0 ? full.slice(prefix.length) : full;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'masking__tab';
      b.id = 'mask-tab-' + i;
      b.textContent = label;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', panel.id);
      strip.appendChild(b);

      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', b.id);
      panel.tabIndex = 0;
      return b;
    });

    function select(i, moveFocus) {
      tabs.forEach(function (t, n) {
        t.setAttribute('aria-selected', String(n === i));
        // roving tabindex: one stop for the strip, arrows move within it
        t.tabIndex = n === i ? 0 : -1;
      });
      panels.forEach(function (p, n) { p.hidden = n !== i; });
      if (moveFocus) tabs[i].focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1
              : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1
              : e.key === 'Home' ? 0
              : e.key === 'End' ? tabs.length - 1 : null;
        if (n === null) return;
        e.preventDefault();
        select((n + tabs.length) % tabs.length, true);
      });
    });

    root.insertBefore(strip, panels[0]);
    root.insertBefore(lead, strip);
    root.classList.add('is-tabbed');
    select(0);
  });

  // The shift list doubles as the way into the steps below it. The rows are
  // real anchors, so without JS they still jump to the right step; this only
  // opens that step first and flags it briefly so the jump is visible.
  // One step open at a time, so choosing another doesn't leave a long scroll
  // behind it. Done on the group rather than with the name attribute, which
  // would also stop a reader closing the one they have open.
  document.querySelectorAll('[data-steps]').forEach(function (group) {
    var steps = Array.prototype.slice.call(group.querySelectorAll('.step'));
    steps.forEach(function (step) {
      step.addEventListener('toggle', function () {
        if (!step.open) return;
        steps.forEach(function (other) { if (other !== step) other.open = false; });
      });
    });
  });

  document.querySelectorAll('[data-step-jump] a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var step = document.querySelector(a.getAttribute('href'));
      if (!step) return;
      step.open = true;
      document.querySelectorAll('.step.is-target').forEach(function (s) {
        s.classList.remove('is-target');
      });
      step.classList.add('is-target');
      setTimeout(function () { step.classList.remove('is-target'); }, 1600);
    });
  });

  // A step opened straight from a link in the address bar should be open.
  (function openFromHash() {
    var open = function () {
      var el = location.hash && document.querySelector(location.hash);
      if (el && el.classList.contains('step')) el.open = true;
    };
    window.addEventListener('hashchange', open);
    open();
  })();

  // Scroll reveal. The class is added here so content stays visible without JS.
  // A position sweep (rather than IntersectionObserver) is used deliberately: it
  // also reveals anything the reader jumped straight past via an anchor link, so
  // no section can ever get stranded at opacity 0.
  var pending = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (pending.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('js-reveal');

    var queued = false;

    var sweep = function () {
      queued = false;
      var limit = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top >= limit) return true;
        el.classList.add('is-visible');
        return false;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    };

    var onScroll = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sweep);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('hashchange', onScroll);
    sweep();
  }
})();
