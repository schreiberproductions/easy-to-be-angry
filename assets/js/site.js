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

  // Submenu triggers: hover/focus on desktop (CSS), tap to expand on mobile.
  nav.querySelectorAll('.nav__item--has-menu').forEach(function (item) {
    var trigger = item.querySelector('.nav__link');
    var submenu = item.querySelector('.nav__submenu');

    trigger.addEventListener('click', function (e) {
      if (!mq.matches) return; // desktop keeps the link navigable
      e.preventDefault();
      var open = submenu.getAttribute('data-open') === 'true';
      submenu.setAttribute('data-open', String(!open));
      trigger.setAttribute('aria-expanded', String(!open));
    });
  });

  // Close everything when leaving mobile width
  mq.addEventListener('change', function (e) {
    if (!e.matches) {
      setMenu(false);
      nav.querySelectorAll('.nav__submenu').forEach(function (s) {
        s.setAttribute('data-open', 'false');
      });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && list.getAttribute('data-open') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

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
