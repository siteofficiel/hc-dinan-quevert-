// HC Dinan-Quévert — site statique (GitHub Pages)
// Charge data/content.json puis rend chaque page côté client.
// Aucun serveur requis : tout le contenu vit dans le dépôt GitHub.
(function () {
  'use strict';

  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function parseDate(iso) {
    if (!iso) return null;
    var d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fLong(iso) {
    var d = parseDate(iso);
    if (!d) return '';
    return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function fShort(iso) {
    var d = parseDate(iso);
    if (!d) return '';
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }
  function excerpt(t, max) {
    var s = String(t || '').replace(/\s+/g, ' ').trim();
    return s.length > max ? s.slice(0, max).trimEnd() + '…' : s;
  }
  function hasScore(m) { return m.scorePour !== null && m.scorePour !== undefined && m.scorePour !== ''; }
  function isUpcoming(iso) { return iso && iso >= todayISO(); }
  function isFuture(m) { return !hasScore(m) && isUpcoming(m.dateISO); }
  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  // ---------- état ----------
  var CONTENT = null;
  var page = document.body.getAttribute('data-page') || '';

  function el(id) { return document.getElementById(id); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ---------- liaison des textes du site ----------
  function bindSiteInfo() {
    var s = CONTENT.settings;
    $$('[data-bind]').forEach(function (node) {
      var key = node.getAttribute('data-bind');
      var val = null;
      if (key === 'nomCourt') val = s.nomCourt;
      else if (key === 'nomComplet') val = s.nomComplet;
      else if (key === 'sousTitre') val = s.sousTitre;
      else if (key === 'slogan') val = s.slogan;
      else if (key === 'sloganDetail') val = s.sloganDetail;
      else if (key === 'presentation') val = s.presentation;
      else if (key === 'email') val = s.email;
      else if (key === 'telephone') val = s.telephone;
      else if (key === 'adresse') val = s.adresse;
      else if (key === 'salle') val = s.salle;
      else if (key === 'year') val = String(new Date().getFullYear());
      if (val !== null) node.textContent = val;
    });
    // liens
    $$('[data-href]').forEach(function (a) {
      var k = a.getAttribute('data-href');
      var v = null;
      if (k === 'facebook') v = s.facebook;
      else if (k === 'instagram') v = s.instagram;
      else if (k === 'youtube') v = s.youtube;
      else if (k === 'email') v = 'mailto:' + s.email;
      else if (k === 'salleLien') v = s.salleLien;
      else if (k === 'tel') v = 'tel:' + s.telephone;
      if (v) a.setAttribute('href', v);
    });
    // partenaires
    var part = el('partnersList');
    if (part && s.partenaires && s.partenaires.length) {
      part.innerHTML = s.partenaires.map(function (p) { return '<li class="partner-badge">' + esc(p) + '</li>'; }).join('');
    }
  }

  // ---------- navigation ----------
  function initNav() {
    var map = {
      home: '/', club: 'club.html', equipes: 'equipes.html', equipe: 'equipes.html', n3: 'n3.html',
      actualites: 'actualites.html', article: 'actualites.html', photos: 'photos.html', album: 'photos.html',
      adherents: 'adherents.html', compositions: 'adherents.html', resultats: 'actualites.html',
    };
    var active = map[page];
    $$('.main-nav a, .mobile-nav a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === active || (active && href.indexOf(active) === 0 && active !== '/')) a.classList.add('is-active');
    });
    // menu mobile
    var toggle = el('navToggle'), mobile = el('mobileNav');
    if (toggle && mobile) {
      toggle.addEventListener('click', function () {
        var open = mobile.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var header = el('siteHeader');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  // ---------- bandeau démo ----------
  function initDemoBar() {
    var bar = el('demoBar'), close = el('demoBarClose');
    if (bar && close) {
      if (sessionStorage.getItem('hcq-demo-dismissed') === '1') bar.style.display = 'none';
      close.addEventListener('click', function () {
        bar.style.display = 'none';
        sessionStorage.setItem('hcq-demo-dismissed', '1');
      });
    }
  }

  // ---------- lightbox ----------
  function initLightbox() {
    var items = $$('[data-lightbox]');
    if (!items.length) return;
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
    var img = $('.lightbox__img', overlay), caption = $('.lightbox__caption', overlay);
    var group = [], index = 0;
    function render() {
      var it = group[index];
      img.src = it.getAttribute('href');
      img.alt = it.getAttribute('data-alt') || '';
      caption.textContent = it.getAttribute('data-alt') || '';
    }
    function open(list, i) { group = list; index = i; render(); overlay.removeAttribute('hidden'); document.body.style.overflow = 'hidden'; $('.lightbox__close', overlay).focus(); }
    function close() { overlay.setAttribute('hidden', ''); document.body.style.overflow = ''; }
    items.forEach(function (node) {
      node.addEventListener('click', function (e) {
        e.preventDefault();
        var g = node.getAttribute('data-lightbox');
        var list = items.filter(function (x) { return x.getAttribute('data-lightbox') === g; });
        var i = Math.max(0, parseInt(node.getAttribute('data-index') || '0', 10));
        open(list, Math.min(i, list.length - 1));
      });
    });
    $('.lightbox__close', overlay).addEventListener('click', close);
    $('.lightbox__prev', overlay).addEventListener('click', function () { index = (index - 1 + group.length) % group.length; render(); });
    $('.lightbox__next', overlay).addEventListener('click', function () { index = (index + 1) % group.length; render(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (overlay.hasAttribute('hidden')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') { index = (index - 1 + group.length) % group.length; render(); }
      else if (e.key === 'ArrowRight') { index = (index + 1) % group.length; render(); }
    });
  }

  // ---------- gabarits ----------
  function chip(text) { return '<span class="chip">' + esc(text) + '</span>'; }

  function matchCard(m) {
    var d = parseDate(m.dateISO);
    return '<article class="match-card">' +
      '<div class="match-card__date"><span class="match-card__day">' + (d ? JOURS[d.getDay()].slice(0, 3) : '') + '</span>' +
      '<span class="match-card__num">' + (d ? d.getDate() : '') + '</span>' +
      '<span class="match-card__month">' + (d ? MOIS[d.getMonth()].slice(0, 4) : '') + '</span></div>' +
      '<div class="match-card__body">' +
      '<span class="chip chip--light">' + esc(m.competition) + '</span>' +
      '<p class="match-card__teams"><strong>Quévert <span class="match-card__label">(' + esc(m.equipeLabel) + ')</span></strong>' +
      '<em>vs</em><strong>' + esc(m.adversaire) + '</strong></p>' +
      '<p class="match-card__meta"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' +
      (m.heure || '') + (m.heure && m.lieu ? ' · ' : '') + esc(m.lieu || '') + '</p></div></article>';
  }

  function resultCard(m) {
    var sp = m.scorePour, sc = m.scoreContre;
    var issue = 'nul';
    if (sp !== null && sp !== undefined) { if (sp > sc) issue = 'victoire'; else if (sp < sc) issue = 'defaite'; }
    var badge = issue === 'victoire' ? 'Victoire' : (issue === 'defaite' ? 'Défaite' : 'Match nul');
    return '<article class="result-card result-card--' + issue + '">' +
      '<header class="result-card__head"><span class="chip">' + esc(m.competition) + '</span>' +
      '<time datetime="' + esc(m.dateISO) + '">' + fShort(m.dateISO) + '</time></header>' +
      '<div class="result-card__teams">' +
      '<span class="team"><span class="team__label">Quévert</span><strong>' + esc(m.equipeLabel) + '</strong></span>' +
      '<span class="score"><b>' + sp + '</b><i>–</i><b>' + sc + '</b></span>' +
      '<span class="team"><span class="team__label">Adversaire</span><strong>' + esc(m.adversaire) + '</strong></span></div>' +
      '<p class="result-card__meta"><span class="badge-issue badge-issue--' + issue + '">' + badge + '</span>' +
      (m.domicile ? 'à domicile' : 'à l’extérieur') + (m.lieu ? ' · ' + esc(m.lieu) : '') + '</p>' +
      (m.resume ? '<p class="result-card__resume">' + esc(excerpt(m.resume, 140)) + '</p>' : '') + '</article>';
  }

  function newsCard(a) {
    return '<article class="news-card">' +
      '<a class="news-card__media" href="article.html?slug=' + encodeURIComponent(a.slug) + '" tabindex="-1" aria-hidden="true">' +
      '<img src="' + esc(a.image || 'public/img/hero.jpg') + '" alt="" loading="lazy"></a>' +
      '<div class="news-card__body">' +
      '<div class="news-card__meta"><span class="chip">' + esc(a.categorie) + '</span>' +
      '<time datetime="' + esc(a.dateISO) + '">' + fShort(a.dateISO) + '</time></div>' +
      '<h2 class="news-card__title"><a href="article.html?slug=' + encodeURIComponent(a.slug) + '">' + esc(a.titre) + '</a></h2>' +
      '<p class="news-card__excerpt">' + esc(excerpt(a.resume || a.contenu, 130)) + '</p>' +
      '<a class="link-arrow" href="article.html?slug=' + encodeURIComponent(a.slug) + '">Lire la suite</a></div></article>';
  }

  function albumCard(al) {
    var cover = CONTENT.photos.find(function (p) { return String(p.albumId) === String(al.id); });
    var count = CONTENT.photos.filter(function (p) { return String(p.albumId) === String(al.id); }).length;
    return '<a class="album-card" href="album.html?slug=' + encodeURIComponent(al.slug) + '">' +
      '<span class="album-card__img">' + (cover ? '<img src="' + esc(cover.fichier) + '" alt="' + esc(al.nom) + '" loading="lazy">' : '') + '</span>' +
      '<span class="album-card__overlay"><span class="album-card__name">' + esc(al.nom) + '</span>' +
      '<span class="album-card__count">' + count + ' photo' + (count > 1 ? 's' : '') + '</span></span></a>';
  }

  function compCard(c) {
    var gardiens = (c.joueurs || []).filter(function (j) { return j.poste === 'Gardien'; });
    var joueurs = (c.joueurs || []).filter(function (j) { return j.poste !== 'Gardien'; });
    var rows = gardiens.map(function (j) {
      return '<li class="comp-list__item"><span class="comp-list__poste comp-list__poste--gk">Gardien</span><span class="comp-list__name">' + esc(j.nom) + '</span></li>';
    }).join('') + joueurs.map(function (j, i) {
      return '<li class="comp-list__item"><span class="comp-list__poste">Joueur ' + (i + 1) + '</span><span class="comp-list__name">' + esc(j.nom) + '</span></li>';
    }).join('');
    return '<article class="comp-card">' +
      '<header class="comp-card__head">' +
      '<div class="comp-card__badges"><span class="comp-card__jour">' + esc(c.jour || '') + '</span>' +
      '<span class="comp-card__equipe">ÉQUIPE ' + esc(c.equipeLabel) + '</span>' +
      (c.demo ? '<span class="comp-card__demo">Démo</span>' : '') + '</div>' +
      '<div class="comp-card__match"><strong>Quévert</strong><em>vs</em><strong>' + esc(c.adversaire) + '</strong>' +
      '<span class="comp-card__domicile">' + (c.domicile ? 'à domicile' : 'à l’extérieur') + '</span></div>' +
      '<ul class="comp-card__info">' +
      '<li><span>Date</span><strong>' + fLong(c.dateISO) + '</strong></li>' +
      '<li><span>Heure</span><strong>' + esc(c.heure || '—') + '</strong></li>' +
      '<li><span>Lieu</span><strong>' + esc(c.lieu || '—') + '</strong></li></ul></header>' +
      '<div class="comp-card__body"><h3 class="comp-card__subtitle">Composition</h3><ul class="comp-list">' + rows + '</ul>' +
      ((c.absents && c.absents.length) ? '<p class="comp-card__absents"><strong>Absents :</strong> ' + esc(c.absents.join(', ')) + '</p>' : '') +
      (c.note ? '<p class="comp-card__note"><strong>Note :</strong> ' + esc(c.note) + '</p>' : '') + '</div></article>';
  }

  // ---------- rendus par page ----------
  function renderHome() {
    var s = CONTENT.settings;
    var matchs = CONTENT.matchs.filter(function (m) { return m.publie !== false; });
    var prochains = matchs.filter(isFuture).sort(function (a, b) { return a.dateISO < b.dateISO ? -1 : 1; }).slice(0, 4);
    var resultats = matchs.filter(hasScore).sort(function (a, b) { return b.dateISO < a.dateISO ? -1 : 1; });
    var dernier = resultats[0] || null;
    var actus = CONTENT.actualites.filter(function (a) { return a.publie !== false; })
      .sort(function (a, b) { return (b.epingle ? 1 : 0) - (a.epingle ? 1 : 0) || (b.dateISO < a.dateISO ? -1 : 1); }).slice(0, 3);
    var albums = CONTENT.albums.slice(0, 3);

    if (el('prochains')) el('prochains').innerHTML = prochains.length
      ? prochains.map(matchCard).join('')
      : '<p class="empty-note">Aucun match programmé pour le moment.</p>';
    if (el('dernierResultat')) el('dernierResultat').innerHTML = dernier
      ? resultCard(dernier) : '<p class="empty-note">Les résultats de la saison seront publiés ici.</p>';
    if (el('actusHome')) el('actusHome').innerHTML = actus.map(newsCard).join('');
    if (el('photosPreview')) el('photosPreview').innerHTML = albums.map(albumCard).join('');

    // focus N3
    var n3 = CONTENT.equipes.find(function (e) { return e.slug === 'n3'; });
    if (n3 && el('n3Focus')) {
      el('n3Focus').innerHTML =
        '<div class="n3-focus__img"><img src="' + esc(n3.image || 'public/img/n3-team.webp') + '" alt="Équipe N3 du ' + esc(s.nomCourt) + '" loading="lazy"></div>' +
        '<div class="n3-focus__body">' +
        '<p class="section-head__kicker section-head__kicker--gold">Équipe mise à l’honneur</p>' +
        '<h2 class="section-head__title section-head__title--white">La N3, l’équipe qui monte</h2>' +
        '<p class="n3-focus__text">' + esc(excerpt(n3.description, 220)) + '</p>' +
        (n3.stats ? '<ul class="n3-focus__mini"><li><strong>' + n3.stats.g + ' victoires</strong> en ' + n3.stats.mj + ' matchs</li>' +
          '<li><strong>' + n3.stats.bp + ' buts</strong> marqués</li><li><strong>' + n3.stats.bc + ' buts</strong> encaissés</li></ul>' : '') +
        '<a class="btn btn--gold" href="n3.html">Découvrir l’équipe N3</a></div>';
    }

    // stats palmarès
    var stats = el('clubStats');
    if (stats && s.palmares && s.palmares.length) {
      stats.innerHTML = s.palmares.map(function (p) {
        return '<div class="stat"><span class="stat__value">' + esc(p.value) + '</span><span class="stat__label">' + esc(p.label) + '</span></div>';
      }).join('');
    }
  }

  function renderClub() {
    var s = CONTENT.settings;
    var stats = el('clubStats');
    if (stats && s.palmares) {
      stats.innerHTML = s.palmares.map(function (p) {
        return '<div class="stat"><span class="stat__value">' + esc(p.value) + '</span><span class="stat__label">' + esc(p.label) + '</span></div>';
      }).join('');
    }
    var timeline = el('histoireTimeline');
    if (timeline && s.histoire) {
      timeline.innerHTML = s.histoire.map(function (h) {
        return '<li class="timeline__item"><span class="timeline__year">' + esc(h.annee) + '</span><p class="timeline__text">' + esc(h.texte) + '</p></li>';
      }).join('');
    }
    // présentation longue
    var pres = el('clubPresentation');
    if (pres) pres.textContent = s.presentation;
  }

  function renderEquipes() {
    var root = el('equipesRoot');
    if (!root) return;
    var teams = CONTENT.equipes.filter(function (e) { return e.publie !== false; })
      .sort(function (a, b) { return (a.ordre || 99) - (b.ordre || 99); });
    var groupes = {};
    teams.forEach(function (e) {
      var cat = e.categorie || 'Autres';
      (groupes[cat] = groupes[cat] || []).push(e);
    });
    var html = '';
    Object.keys(groupes).forEach(function (cat) {
      var slug = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
      html += '<section class="section" aria-labelledby="cat-' + slug + '">' +
        '<div class="container"><h2 class="section-head__title section-head__title--small" id="cat-' + slug + '">' + esc(cat) + '</h2>' +
        '<div class="teams-grid">' +
        groupes[cat].map(function (e) {
          var href = e.slug === 'n3' ? 'n3.html' : 'equipe.html?slug=' + encodeURIComponent(e.slug);
          return '<a class="team-card" href="' + href + '">' +
            '<span class="team-card__img"><img src="' + esc(e.image || 'public/img/hero.jpg') + '" alt="Équipe ' + esc(e.nom) + '" loading="lazy">' +
            (e.slug === 'n3' ? '<span class="team-card__flag">À l’honneur</span>' : '') + '</span>' +
            '<span class="team-card__body"><span class="team-card__name">' + esc(e.nom) + '</span>' +
            '<span class="team-card__tagline">' + esc(e.tagline) + '</span>' +
            '<span class="link-arrow">Voir l’équipe</span></span></a>';
        }).join('') +
        '</div></div></section>';
    });
    root.innerHTML = html;
  }

  function renderEquipe() {
    var slug = qs('slug');
    var e = CONTENT.equipes.find(function (x) { return x.slug === slug; }) || CONTENT.equipes[0];
    if (!e) return;
    document.title = 'Équipe ' + e.nom + ' · ' + CONTENT.settings.nomCourt;
    var hero = el('equipeHero');
    if (hero) hero.innerHTML =
      '<div class="page-hero__overlay"></div><div class="container page-hero__inner">' +
      '<p class="page-hero__kicker">' + esc(e.categorie) + '</p>' +
      '<h1 class="page-hero__title">Équipe ' + esc(e.nom) + '</h1>' +
      '<p class="page-hero__sub">' + esc(e.tagline) + '</p></div>';
    hero.style.backgroundImage = 'url(\'' + (e.image || 'public/img/hero.jpg') + '\'';
    hero.classList.add('page-hero--img');
    var body = el('equipeBody');
    if (body) body.innerHTML =
      '<section class="section"><div class="container team-detail">' +
      '<div class="prose"><h2 class="section-head__title">La présentation</h2><p>' + esc(e.description) + '</p>' +
      '<div class="staff-box"><h3 class="staff-box__title">Encadrement</h3>' +
      '<p><strong>' + esc(e.entraineur) + '</strong></p>' + (e.entraineurAdj ? '<p>' + esc(e.entraineurAdj) + '</p>' : '') + '</div></div>' +
      '<aside class="team-side"><h3 class="team-side__title">Effectif</h3>' +
      ((e.joueurs && e.joueurs.length)
        ? '<ul class="roster">' + e.joueurs.map(function (j) {
          return '<li class="roster__item"><span class="roster__num">' + esc(j.numero) + '</span><span class="roster__name">' + esc(j.nom) + '</span><span class="roster__poste">' + esc(j.poste) + '</span></li>';
        }).join('') + '</ul>'
        : '<p class="empty-note">Effectif à compléter.</p>') + '</aside></div></section>';

    var matchs = CONTENT.matchs.filter(function (m) { return m.publie !== false && m.equipeSlug === e.slug; })
      .sort(function (a, b) { return a.dateISO < b.dateISO ? -1 : 1; });
    var prochains = matchs.filter(isFuture);
    var resultats = matchs.filter(hasScore).reverse();
    var ag = el('equipeAgenda');
    if (ag) ag.innerHTML =
      '<section class="section section--tint"><div class="container">' +
      '<div class="section-head"><div><p class="section-head__kicker">L’agenda</p><h2 class="section-head__title">Prochains matchs</h2></div></div>' +
      (prochains.length ? '<div class="match-list">' + prochains.map(matchCard).join('') + '</div>' : '<p class="empty-note">Aucun match programmé pour le moment.</p>') +
      (resultats.length ? '<div class="section-head section-head--mt"><h2 class="section-head__title">Derniers résultats</h2></div>' +
        '<div class="result-grid">' + resultats.map(resultCard).join('') + '</div>' : '') +
      '</div></section>';
  }

  function renderN3() {
    var e = CONTENT.equipes.find(function (x) { return x.slug === 'n3'; });
    if (!e) return;
    var hero = el('n3Hero');
    if (hero) hero.style.backgroundImage = 'url(\'' + (e.image || 'public/img/n3-team.webp') + '\'';
    var heroSub = $('.n3-hero__sub');
    if (heroSub && e.tagline) heroSub.textContent = e.tagline;
    var stats = el('n3Stats');
    if (stats && e.stats) {
      var s = e.stats;
      stats.innerHTML = [
        { v: s.mj, l: 'Matchs joués' }, { v: s.g, l: 'Victoires' }, { v: s.bp, l: 'Buts marqués' },
        { v: s.bc, l: 'Buts encaissés' }, { v: s.meilleurButeur, l: 'Meilleur buteur', sm: true }, { v: s.meilleurGardien, l: 'Meilleur gardien', sm: true },
      ].map(function (x) {
        return '<div class="n3-stat"><span class="n3-stat__value' + (x.sm ? ' n3-stat__value--sm' : '') + '">' + esc(x.v || '—') + '</span><span class="n3-stat__label">' + x.l + '</span></div>';
      }).join('');
    }
    var pres = el('n3Presentation');
    if (pres) pres.innerHTML = '<p>' + esc(e.description) + '</p>' +
      '<p>Véritable pont entre la formation et l’équipe fanion, la N3 fait grandir les jeunes pousses quévertoises aux côtés de cadres expérimentés. Un état d’esprit de compétiteur, des ambitions élevées et l’envie de faire vibrer les supporters.</p>';

    var matchs = CONTENT.matchs.filter(function (m) { return m.publie !== false && m.equipeSlug === 'n3'; })
      .sort(function (a, b) { return a.dateISO < b.dateISO ? -1 : 1; });
    var prochains = matchs.filter(isFuture);
    var resultats = matchs.filter(hasScore).reverse();
    if (el('n3Prochains')) el('n3Prochains').innerHTML = prochains.length ? prochains.map(matchCard).join('') : '<p class="empty-note">Aucun match programmé.</p>';
    if (el('n3Resultats')) el('n3Resultats').innerHTML = resultats.length ? resultats.map(resultCard).join('') : '<p class="empty-note">Les résultats seront publiés ici.</p>';

    var classement = CONTENT.classement.slice().sort(function (a, b) { return a.pos - b.pos; });
    var tb = el('classementTable');
    if (tb) tb.innerHTML = classement.map(function (r) {
      var ours = /quevert|dinan/i.test(r.equipe);
      return '<tr class="' + (ours ? 'is-ours' : '') + '">' +
        '<td><span class="pos ' + (r.pos <= 3 ? 'pos--top' : 'pos--normal') + '">' + r.pos + '</span></td>' +
        '<td class="ta-l">' + esc(r.equipe) + '</td><td><strong>' + r.pts + '</strong></td>' +
        '<td>' + r.j + '</td><td>' + r.g + '</td><td>' + r.n + '</td><td>' + r.p + '</td>' +
        '<td>' + (r.bp - r.bc > 0 ? '+' : '') + (r.bp - r.bc) + '</td></tr>';
    }).join('');

    var effectif = el('n3Effectif');
    if (effectif) effectif.innerHTML =
      (e.joueurs || []).map(function (j) {
        return '<div class="player-card"><span class="player-card__num">' + esc(j.numero) + '</span><span class="player-card__name">' + esc(j.nom) + '</span><span class="player-card__poste">' + esc(j.poste) + '</span></div>';
      }).join('') +
      '<div class="staff-strip"><span class="staff-strip__label">Staff</span>' +
      '<span class="staff-strip__name">' + esc(e.entraineur) + '</span>' +
      (e.entraineurAdj ? '<span class="staff-strip__name">' + esc(e.entraineurAdj) + '</span>' : '') + '</div>';

    var album = CONTENT.albums.find(function (a) { return /^n3/i.test(a.slug); }) || CONTENT.albums[0];
    var photos = album ? CONTENT.photos.filter(function (p) { return String(p.albumId) === String(album.id); }) : [];
    var gal = el('n3Gallery');
    if (gal && photos.length) {
      gal.innerHTML = photos.slice(0, 6).map(function (p, i) {
        return '<a class="gallery-item" href="' + esc(p.fichier) + '" data-lightbox="n3" data-alt="' + esc(p.legende || ('Photo N3 ' + (i + 1))) + '" data-index="' + i + '">' +
          '<img src="' + esc(p.fichier) + '" alt="' + esc(p.legende || 'Photo de la N3') + '" loading="lazy"></a>';
      }).join('');
    }
    var linkAlbum = $('[data-n3album]');
    if (linkAlbum && album) linkAlbum.setAttribute('href', 'album.html?slug=' + encodeURIComponent(album.slug));
    initLightbox();
  }

  function renderActualites() {
    var tab = qs('tab') || 'actualites';
    var cat = qs('cat') || '';
    $$('.tab').forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === tab);
      var u = new URL(t.href, location.href); u.searchParams.set('tab', t.getAttribute('data-tab')); t.href = u.pathname + '?' + u.searchParams.toString();
    });
    var actus = CONTENT.actualites.filter(function (a) { return a.publie !== false; })
      .sort(function (a, b) { return b.dateISO < a.dateISO ? -1 : 1; });
    var categories = Array.from(new Set(actus.map(function (a) { return a.categorie; }).filter(Boolean)));
    var chipsBox = el('catChips');
    if (chipsBox) {
      chipsBox.innerHTML = '<a class="chip chip--filter ' + (!cat ? 'is-active' : '') + '" href="actualites.html?tab=actualites">Tout</a>' +
        categories.map(function (c) {
          return '<a class="chip chip--filter ' + (cat === c ? 'is-active' : '') + '" href="actualites.html?tab=actualites&cat=' + encodeURIComponent(c) + '">' + esc(c) + '</a>';
        }).join('');
    }
    var newsBox = el('newsList');
    var resBox = el('resultatsList');
    if (tab === 'resultats') {
      if (newsBox) newsBox.style.display = 'none';
      if (chipsBox) chipsBox.style.display = 'none';
      var resultats = CONTENT.matchs.filter(function (m) { return m.publie !== false && hasScore(m); })
        .sort(function (a, b) { return b.dateISO < a.dateISO ? -1 : 1; });
      if (resBox) resBox.innerHTML = resultats.length
        ? '<div class="result-grid result-grid--wide">' + resultats.map(resultCard).join('') + '</div>'
        : '<p class="empty-note">Les résultats de la saison seront publiés ici.</p>';
    } else {
      if (resBox) resBox.style.display = 'none';
      var list = cat ? actus.filter(function (a) { return a.categorie === cat; }) : actus;
      if (newsBox) newsBox.innerHTML = list.length
        ? '<div class="news-grid news-grid--list">' + list.map(newsCard).join('') + '</div>'
        : '<p class="empty-note">Aucune actualité dans cette catégorie pour le moment.</p>';
    }
  }

  function renderArticle() {
    var slug = qs('slug');
    var a = CONTENT.actualites.find(function (x) { return x.slug === slug; });
    var root = el('articleRoot');
    if (!root) return;
    if (!a) {
      root.innerHTML = '<div class="container notfound__inner"><p class="notfound__code">404</p><h1 class="notfound__title">Article introuvable</h1><p class="notfound__text">Cet article n’existe pas ou a été déplacé.</p><a class="btn btn--primary" href="actualites.html">Retour aux actualités</a></div>';
      return;
    }
    document.title = a.titre + ' · ' + CONTENT.settings.nomCourt;
    var base = location.origin + location.pathname.replace(/[^/]*$/, '');
    var url = base + 'article.html?slug=' + encodeURIComponent(a.slug);
    var autres = CONTENT.actualites.filter(function (x) { return x.publie !== false && x.id !== a.id; })
      .sort(function (x, y) { return y.dateISO < x.dateISO ? -1 : 1; }).slice(0, 3);
    root.innerHTML =
      '<article class="article"><header class="article__header"><div class="container article__header-inner">' +
      '<a class="back-link" href="actualites.html">← Retour aux actualités</a>' +
      '<div class="news-card__meta article__meta"><span class="chip">' + esc(a.categorie) + '</span><time datetime="' + esc(a.dateISO) + '">' + fLong(a.dateISO) + '</time></div>' +
      '<h1 class="article__title">' + esc(a.titre) + '</h1></div></header>' +
      (a.image ? '<div class="container article__figure"><img src="' + esc(a.image) + '" alt="' + esc(a.titre) + '"></div>' : '') +
      '<div class="container article__layout"><div class="article__body prose">' +
      String(a.contenu || '').split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p.trim()) + '</p>'; }).join('') +
      '<div class="share"><span class="share__label">Partager :</span>' +
      '<a class="share__btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '">Facebook</a>' +
      '<a class="share__btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(a.titre) + '">X</a>' +
      '<a class="share__btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(a.titre + ' ' + url) + '">WhatsApp</a></div></div>' +
      (autres.length ? '<aside class="article__aside"><h2 class="mini-title">À lire aussi</h2>' +
        autres.map(function (x) {
          return '<a class="side-news" href="article.html?slug=' + encodeURIComponent(x.slug) + '">' +
            '<img src="' + esc(x.image || 'public/img/hero.jpg') + '" alt="" loading="lazy"><span>' +
            '<span class="side-news__title">' + esc(x.titre) + '</span><span class="side-news__date">' + fShort(x.dateISO) + '</span></span></a>';
        }).join('') + '</aside>' : '') + '</div></article>';
  }

  function renderPhotos() {
    var root = el('albumsRoot');
    if (!root) return;
    root.innerHTML = CONTENT.albums.length
      ? '<div class="album-grid">' + CONTENT.albums.map(albumCard).join('') + '</div>'
      : '<p class="empty-note">Les premiers albums seront publiés prochainement.</p>';
  }

  function renderAlbum() {
    var slug = qs('slug');
    var al = CONTENT.albums.find(function (x) { return x.slug === slug; });
    var root = el('albumRoot');
    if (!root) return;
    if (!al) {
      root.innerHTML = '<p class="empty-note">Album introuvable.</p>';
      return;
    }
    document.title = al.nom + ' · ' + CONTENT.settings.nomCourt;
    var photos = CONTENT.photos.filter(function (p) { return String(p.albumId) === String(al.id); });
    var others = CONTENT.albums.filter(function (x) { return x.slug !== al.slug; }).slice(0, 3);
    root.innerHTML =
      '<div class="container">' +
      '<div class="page-hero__kicker" style="color:var(--gold-500);margin:26px 0 4px">Album photo</div>' +
      '<h1 class="page-hero__title" style="color:var(--navy-900);text-transform:uppercase">' + esc(al.nom) + '</h1>' +
      (al.description ? '<p style="color:var(--muted);margin:8px 0 0">' + esc(al.description) + '</p>' : '') +
      '<a class="back-link" href="photos.html" style="display:inline-block;margin:16px 0 4px">← Tous les albums</a>' +
      (photos.length
        ? '<div class="gallery-grid">' + photos.map(function (p, i) {
          return '<a class="gallery-item" href="' + esc(p.fichier) + '" data-lightbox="album" data-alt="' + esc(p.legende || al.nom) + '" data-index="' + i + '">' +
            '<img src="' + esc(p.fichier) + '" alt="' + esc(p.legende || (al.nom + ' — photo ' + (i + 1))) + '" loading="lazy"></a>';
        }).join('') + '</div>'
        : '<p class="empty-note">Cet album ne contient pas encore de photos.</p>') +
      '<h2 class="section-head__title section-head__title--small album-others-title">Autres albums</h2>' +
      '<div class="album-grid album-grid--3">' + others.map(albumCard).join('') + '</div></div>';
    initLightbox();
  }

  function renderAdherents() {
    var comps = CONTENT.compositions.filter(function (c) { return c.publie !== false; })
      .sort(function (a, b) { return a.dateISO < b.dateISO ? -1 : 1; });
    var aVenir = comps.filter(function (c) { return isUpcoming(c.dateISO); });
    var box = el('compsHome');
    if (box) box.innerHTML = aVenir.length
      ? aVenir.map(compCard).join('')
      : '<p class="empty-note">Aucune composition publiée pour le moment. Elles apparaîtront ici dès leur publication par les responsables d’équipe.</p>';
  }

  function renderCompositions() {
    var comps = CONTENT.compositions.filter(function (c) { return c.publie !== false; })
      .sort(function (a, b) { return a.dateISO < b.dateISO ? -1 : 1; });
    var aVenir = comps.filter(function (c) { return isUpcoming(c.dateISO); });
    var list = aVenir.length ? aVenir : comps;
    var box = el('compsList');
    if (box) box.innerHTML = list.length
      ? list.map(compCard).join('')
      : '<div class="empty-state"><p class="empty-state__title">Aucune composition publiée</p><p>Les compositions du week-end apparaîtront ici dès leur publication par les responsables d’équipe.</p><a class="btn btn--primary" href="adherents.html">Retour à l’espace adhérents</a></div>';
  }

  function renderResultats() {
    var matchs = CONTENT.matchs.filter(function (m) { return m.publie !== false; })
      .sort(function (a, b) { return a.dateISO < b.dateISO ? -1 : 1; });
    var aVenir = matchs.filter(isFuture);
    var resultats = matchs.filter(hasScore).reverse();
    if (el('prochainsAll')) el('prochainsAll').innerHTML = aVenir.length
      ? '<div class="match-list">' + aVenir.map(matchCard).join('') + '</div>'
      : '<p class="empty-note">Aucun match programmé pour le moment.</p>';
    if (el('resultatsAll')) el('resultatsAll').innerHTML = resultats.length
      ? '<div class="result-grid result-grid--wide">' + resultats.map(resultCard).join('') + '</div>'
      : '<p class="empty-note">Les résultats seront publiés ici au fil de la saison.</p>';
  }

  // ---------- porte de l'espace adhérents (code) ----------
  function gateAdherent() {
    var code = (CONTENT.settings.codeAdherent || '').trim();
    if (!code || sessionStorage.getItem('hcq-adherent') === '1') return;
    var gate = el('adherentGate');
    var body = el('adherentContent');
    if (!gate || !body) return;
    body.style.display = 'none';
    gate.removeAttribute('hidden');
    var form = $('form', gate);
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = $('input[name=code]', form);
        if (input && input.value.trim() === code) {
          sessionStorage.setItem('hcq-adherent', '1');
          gate.setAttribute('hidden', '');
          body.style.display = '';
        } else {
          var err = $('.gate__error', gate);
          if (err) err.textContent = 'Code incorrect, réessayez.';
        }
      });
    }
  }

  // ---------- démarrage ----------
  fetch('data/content.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      CONTENT = data;
      bindSiteInfo();
      initNav();
      initDemoBar();
      if (page === 'home') renderHome();
      else if (page === 'club') renderClub();
      else if (page === 'equipes') renderEquipes();
      else if (page === 'equipe') renderEquipe();
      else if (page === 'n3') renderN3();
      else if (page === 'actualites') renderActualites();
      else if (page === 'article') renderArticle();
      else if (page === 'photos') renderPhotos();
      else if (page === 'album') renderAlbum();
      else if (page === 'adherents') { gateAdherent(); renderAdherents(); }
      else if (page === 'compositions') { gateAdherent(); renderCompositions(); }
      else if (page === 'resultats') renderResultats();
      if (page !== 'n3' && page !== 'album') initLightbox();
    })
    .catch(function (err) {
      console.error('Impossible de charger le contenu :', err);
      var m = document.querySelector('main .container');
      if (m && page !== 'home') {
        m.insertAdjacentHTML('afterbegin', '<p class="flash flash--err" style="margin-top:20px">Impossible de charger le contenu (' + esc(err.message) + '). Vérifiez que le fichier <code>data/content.json</code> est présent.</p>');
      }
    });
})();
