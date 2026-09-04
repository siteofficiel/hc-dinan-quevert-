// HC Dinan-Quévert — interactions du site public
(function () {
  'use strict';

  // --- Menu mobile ---
  var toggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // --- Ombre de l'en-tête au défilement ---
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- Bandeau démo ---
  var demoBar = document.getElementById('demoBar');
  var demoClose = document.getElementById('demoBarClose');
  if (demoBar && demoClose) {
    if (sessionStorage.getItem('hcq-demo-dismissed') === '1') demoBar.style.display = 'none';
    demoClose.addEventListener('click', function () {
      demoBar.style.display = 'none';
      sessionStorage.setItem('hcq-demo-dismissed', '1');
    });
  }

  // --- Visionneuse (lightbox) ---
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  if (items.length) {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('hidden', '');
    overlay.innerHTML =
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Fermer">✕</button>' +
      '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Photo précédente">‹</button>' +
      '<img class="lightbox__img" alt="">' +
      '<button class="lightbox__btn lightbox__next" type="button" aria-label="Photo suivante">›</button>' +
      '<p class="lightbox__caption"></p>';
    document.body.appendChild(overlay);

    var img = overlay.querySelector('.lightbox__img');
    var caption = overlay.querySelector('.lightbox__caption');
    var group = [];
    var index = 0;

    function render() {
      var item = group[index];
      img.src = item.getAttribute('href');
      img.alt = item.getAttribute('data-alt') || '';
      caption.textContent = item.getAttribute('data-alt') || '';
    }
    function open(list, startIndex) {
      group = list;
      index = startIndex;
      render();
      overlay.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
      overlay.querySelector('.lightbox__close').focus();
    }
    function close() {
      overlay.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
    function prev() { index = (index - 1 + group.length) % group.length; render(); }
    function next() { index = (index + 1) % group.length; render(); }

    items.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var groupName = el.getAttribute('data-lightbox');
        var list = items.filter(function (x) { return x.getAttribute('data-lightbox') === groupName; });
        var start = Math.max(0, parseInt(el.getAttribute('data-index') || '0', 10));
        if (start >= list.length) start = 0;
        open(list, start);
      });
    });

    overlay.querySelector('.lightbox__close').addEventListener('click', close);
    overlay.querySelector('.lightbox__prev').addEventListener('click', prev);
    overlay.querySelector('.lightbox__next').addEventListener('click', next);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (overlay.hasAttribute('hidden')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    });
  }
})();
