// Générateur des pages statiques du site (GitHub Pages).
// Exécution : node tools/build-pages.js
// Produit les fichiers .html à la racine du dépôt à partir des gabarits ci-dessous.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ---------- composants partagés ----------
function head(pageKey, title, desc) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="icon" type="image/svg+xml" href="public/favicon.svg">
  <link rel="preload" href="public/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="public/css/style.css">
</head>
<body data-page="${pageKey}">`;
}

const DEMO_BAR = `
<div class="demo-bar" id="demoBar" role="note">
  <span><strong>Site de démonstration.</strong> Les textes, résultats, effectifs et photos sont des exemples, à remplacer par les contenus officiels du club.</span>
  <button type="button" class="demo-bar__close" id="demoBarClose" aria-label="Fermer ce bandeau">✕</button>
</div>`;

const HEADER = `
<header class="site-header" id="siteHeader">
  <div class="topbar">
    <div class="container topbar__inner">
      <p class="topbar__item"><svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg><span data-bind="salle"></span></p>
      <p class="topbar__item topbar__item--hide"><svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg><span data-bind="telephone"></span></p>
      <a class="topbar__link" href="adherents.html">
        <svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>
        Espace adhérents
      </a>
      <div class="topbar__socials">
        <a href="#" data-href="facebook" target="_blank" rel="noopener" aria-label="Facebook"><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.3-1.4 1.5-1.4h1.4V5.5c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2.3H8.6V14H11v7h2.5z"/></svg></a>
        <a href="#" data-href="instagram" target="_blank" rel="noopener" aria-label="Instagram"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg></a>
        <a href="#" data-href="youtube" target="_blank" rel="noopener" aria-label="YouTube"><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.8-.5-5.6c-.3-1-1.1-1.8-2.1-2C18.6 4 12 4 12 4s-6.6 0-8.4.4c-1 .2-1.8 1-2.1 2C1 8.2 1 12 1 12s0 3.8.5 5.6c.3 1 1.1 1.8 2.1 2 1.8.4 8.4.4 8.4.4s6.6 0 8.4-.4c1-.2 1.8-1 2.1-2 .5-1.8.5-5.6.5-5.6zM9.8 15.5v-7l6 3.5-6 3.5z"/></svg></a>
      </div>
    </div>
  </div>
  <div class="container header-main">
    <a class="brand" href="index.html" aria-label="Accueil">
      <span class="brand__logo"><img src="public/img/logo.jpg" alt="Logo HC Dinan-Quévert" width="48" height="42"></span>
      <span class="brand__text">
        <span class="brand__name" data-bind="nomCourt"></span>
        <span class="brand__sub" data-bind="sousTitre"></span>
      </span>
    </a>
    <nav class="main-nav" aria-label="Navigation principale">
      <ul>
        <li><a href="index.html">Accueil</a></li>
        <li><a href="club.html">Le club</a></li>
        <li><a href="equipes.html">Équipes</a></li>
        <li><a href="n3.html">N3</a></li>
        <li><a href="actualites.html">Actualités</a></li>
        <li><a href="photos.html">Photos</a></li>
      </ul>
    </nav>
    <div class="header-actions">
      <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="mobileNav" aria-label="Ouvrir le menu"><span></span><span></span><span></span></button>
    </div>
  </div>
  <nav class="mobile-nav" id="mobileNav" aria-label="Navigation mobile">
    <ul>
      <li><a href="index.html">Accueil</a></li>
      <li><a href="club.html">Le club</a></li>
      <li><a href="equipes.html">Équipes</a></li>
      <li><a href="n3.html">N3</a></li>
      <li><a href="actualites.html">Actualités</a></li>
      <li><a href="photos.html">Photos</a></li>
      <li><a href="adherents.html">Espace adhérents</a></li>
      <li><a href="admin.html" class="mobile-nav__admin">Espace administrateur</a></li>
    </ul>
  </nav>
</header>`;

const FOOTER = `
<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-col footer-col--brand">
      <a class="brand brand--footer" href="index.html">
        <span class="brand__logo brand__logo--footer"><img src="public/img/logo.jpg" alt="Logo HC Dinan-Quévert" width="56" height="50"></span>
        <span class="brand__text">
          <span class="brand__name" data-bind="nomCourt"></span>
          <span class="brand__sub" data-bind="sousTitre"></span>
        </span>
      </a>
      <p class="footer-about" data-bind="sloganDetail"></p>
      <div class="footer-socials">
        <a href="#" data-href="facebook" target="_blank" rel="noopener" aria-label="Facebook"><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.3-1.4 1.5-1.4h1.4V5.5c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2.3H8.6V14H11v7h2.5z"/></svg></a>
        <a href="#" data-href="instagram" target="_blank" rel="noopener" aria-label="Instagram"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg></a>
        <a href="#" data-href="youtube" target="_blank" rel="noopener" aria-label="YouTube"><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.8-.5-5.6c-.3-1-1.1-1.8-2.1-2C18.6 4 12 4 12 4s-6.6 0-8.4.4c-1 .2-1.8 1-2.1 2C1 8.2 1 12 1 12s0 3.8.5 5.6c.3 1 1.1 1.8 2.1 2 1.8.4 8.4.4 8.4.4s6.6 0 8.4-.4c1-.2 1.8-1 2.1-2 .5-1.8.5-5.6.5-5.6zM9.8 15.5v-7l6 3.5-6 3.5z"/></svg></a>
      </div>
    </div>
    <div class="footer-col">
      <h2 class="footer-title">Le club</h2>
      <ul class="footer-links">
        <li><a href="club.html">Présentation &amp; histoire</a></li>
        <li><a href="equipes.html">Nos équipes</a></li>
        <li><a href="n3.html">Équipe N3</a></li>
        <li><a href="actualites.html">Actualités</a></li>
        <li><a href="photos.html">Photos</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h2 class="footer-title">Contact</h2>
      <ul class="footer-links footer-links--contact">
        <li><svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg><span data-bind="adresse"></span></li>
        <li><svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg><span data-bind="telephone"></span></li>
        <li><svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg><a href="#" data-href="email"><span data-bind="email"></span></a></li>
        <li><svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg><a href="#" data-href="salleLien" target="_blank" rel="noopener"><span data-bind="salle"></span></a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h2 class="footer-title">Accès rapide</h2>
      <ul class="footer-links">
        <li><a href="adherents.html" class="footer-link--strong">Espace adhérents</a></li>
        <li><a href="compositions.html">Compositions du week-end</a></li>
        <li><a href="actualites.html?tab=resultats">Résultats</a></li>
        <li><a href="mentions-legales.html">Mentions légales</a></li>
        <li><a href="confidentialite.html">Politique de confidentialité</a></li>
      </ul>
    </div>
  </div>
  <div class="container footer-partners">
    <h2 class="footer-title footer-title--partners">Nos partenaires</h2>
    <ul class="partners-list" id="partnersList"></ul>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom__inner">
      <p>© <span data-bind="year"></span> <span data-bind="nomComplet"></span> — Rink hockey · Quévert · Dinan. Site réalisé pour le club.</p>
      <a href="admin.html" class="btn btn--admin-access">
        <svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>
        Espace administrateur
      </a>
    </div>
  </div>
</footer>
<script src="public/js/site.js" defer></script>
</body>
</html>`;

function wrap(pageKey, title, desc, bodyClass, body) {
  return head(pageKey, title, desc) + '\n<a class="skip-link" href="#contenu">Aller au contenu</a>\n' +
    DEMO_BAR + '\n' + HEADER + '\n' +
    '<main id="contenu" class="' + (bodyClass || '') + '">\n' + body + '\n</main>\n' + FOOTER;
}

// ---------- pages ----------
const pages = {};

pages['index.html'] = wrap('home', 
  'HC Dinan-Quévert — Rink hockey · Quévert · Dinan',
  'Site officiel du Hockey Club Dinan-Quévert, club de rink hockey à Quévert / Dinan (Côtes-d\u2019Armor) : actualités, résultats, équipes, photos et espace adhérents.',
  '',
  `
  <section class="hero">
    <div class="hero__bg" style="background-image:url('public/img/hero.jpg')"></div>
    <div class="hero__overlay"></div>
    <div class="container hero__inner">
      <div class="hero__content">
        <span class="hero__logo-chip"><img src="public/img/logo.jpg" alt="" width="44" height="39"><span data-bind="nomCourt"></span></span>
        <p class="hero__kicker">Rink hockey · Pays de Dinan · depuis 1987</p>
        <h1 class="hero__title" data-bind="slogan"></h1>
        <p class="hero__sub" data-bind="sloganDetail"></p>
        <div class="hero__actions">
          <a class="btn btn--light" href="club.html">Découvrir le club</a>
          <a class="btn btn--ghost" href="actualites.html">Actualités</a>
        </div>
        <p class="hero__tag">11 fois champion de France · 6 Coupes de France</p>
      </div>
    </div>
  </section>

  <section class="upcoming" aria-labelledby="titre-prochains">
    <div class="container">
      <div class="upcoming__panel">
        <div class="section-head section-head--light">
          <div>
            <p class="section-head__kicker">Ne manquez rien</p>
            <h2 class="section-head__title" id="titre-prochains">Prochains matchs</h2>
          </div>
          <a class="link-arrow" href="actualites.html?tab=resultats">Tous les matchs &amp; résultats</a>
        </div>
        <div class="match-list" id="prochains"></div>
      </div>
    </div>
  </section>

  <section class="intro" aria-labelledby="titre-intro">
    <div class="container intro__grid">
      <div class="intro__text">
        <p class="section-head__kicker">Le club</p>
        <h2 class="section-head__title" id="titre-intro">Un grand du rink hockey, une famille</h2>
        <p class="intro__lead" data-bind="presentation"></p>
        <a class="btn btn--primary" href="club.html">En savoir plus sur le club</a>
      </div>
      <div class="intro__stats" id="clubStats"></div>
    </div>
  </section>

  <section class="last-result" aria-labelledby="titre-dernier">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker">Sur les parquets</p>
          <h2 class="section-head__title" id="titre-dernier">Dernier résultat</h2>
        </div>
        <a class="link-arrow" href="actualites.html?tab=resultats">Tous les résultats</a>
      </div>
      <div id="dernierResultat"></div>
    </div>
  </section>

  <section class="n3-focus" aria-labelledby="titre-n3">
    <div class="container">
      <div class="n3-focus__panel" id="n3Focus"></div>
    </div>
  </section>

  <section class="news" aria-labelledby="titre-actus">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker">La vie du club</p>
          <h2 class="section-head__title" id="titre-actus">Dernières actualités</h2>
        </div>
        <a class="link-arrow" href="actualites.html">Toutes les actualités</a>
      </div>
      <div class="news-grid" id="actusHome"></div>
    </div>
  </section>

  <section class="photos-preview" aria-labelledby="titre-photos">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker">En images</p>
          <h2 class="section-head__title" id="titre-photos">Dernières photos</h2>
        </div>
        <a class="link-arrow" href="photos.html">Tous les albums</a>
      </div>
      <div class="album-grid album-grid--3" id="photosPreview"></div>
    </div>
  </section>

  <section class="adherents-cta" aria-labelledby="titre-adherents">
    <div class="container">
      <div class="adherents-cta__panel">
        <div class="adherents-cta__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>
        </div>
        <div class="adherents-cta__body">
          <h2 class="adherents-cta__title" id="titre-adherents">Espace adhérents</h2>
          <p>Compositions du week-end, infos pratiques et vie du club : tout ce qu’il faut savoir, en un coup d’œil, même sur votre téléphone.</p>
        </div>
        <div class="adherents-cta__actions">
          <a class="btn btn--primary" href="adherents.html">Accéder à l’espace</a>
          <a class="btn btn--outline" href="compositions.html">Compositions du week-end</a>
        </div>
      </div>
    </div>
  </section>`
);

pages['club.html'] = wrap('club', 
  'Le club · HC Dinan-Quévert',
  'Histoire, valeurs, infrastructures et informations pratiques du Hockey Club Dinan-Quévert, club de rink hockey à Quévert / Dinan.',
  '',
  `
  <section class="page-hero page-hero--img" style="background-image:url('public/img/club.jpg')">
    <div class="page-hero__overlay"></div>
    <div class="container page-hero__inner">
      <p class="page-hero__kicker">Hockey Club Dinan-Quévert</p>
      <h1 class="page-hero__title">Le club</h1>
      <p class="page-hero__sub">Depuis 1987, l’esprit bleu &amp; blanc au service des jeunes et du territoire.</p>
    </div>
  </section>

  <section class="section" aria-labelledby="titre-presentation">
    <div class="container two-col">
      <div>
        <p class="section-head__kicker">Présentation</p>
        <h2 class="section-head__title" id="titre-presentation">Une aventure humaine et sportive</h2>
      </div>
      <div class="prose">
        <p data-bind="presentation"></p>
        <p>Né de la volonté de deux passionnés, Thierry Lemarié et Yannick Ricaille, avec le soutien de la commune de Quévert, le club est devenu une référence du rink hockey français : onze titres de champion de France, six Coupes de France et un rayonnement européen.</p>
        <p>Mais le HC Dinan-Quévert, c’est avant tout une école de vie : des centaines d’enfants formés au patinage, des bénévoles engagés et un esprit familial qui fait la fierté du Pays de Dinan.</p>
      </div>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="titre-valeurs">
    <div class="container">
      <div class="section-head section-head--center">
        <p class="section-head__kicker">Nos valeurs</p>
        <h2 class="section-head__title" id="titre-valeurs">Ce qui nous fait avancer</h2>
      </div>
      <div class="values-grid">
        <article class="value-card"><span class="value-card__num">01</span><h3 class="value-card__title">Famille</h3><p>Un club à taille humaine où chaque licencié, du plus jeune patineur au bénévole, trouve sa place et est reconnu.</p></article>
        <article class="value-card"><span class="value-card__num">02</span><h3 class="value-card__title">Formation</h3><p>De l’école de patinage à la N1 Élite, nous formons les joueurs et les citoyens de demain, sur et hors des parquets.</p></article>
        <article class="value-card"><span class="value-card__num">03</span><h3 class="value-card__title">Compétition</h3><p>Onze titres nationaux et l’exigence du haut niveau, portés par l’envie de faire vibrer la salle Némée.</p></article>
        <article class="value-card"><span class="value-card__num">04</span><h3 class="value-card__title">Territoire</h3><p>Fiers d’être Bretons et Côtes-d’Armoricains : le club rayonne sur Dinan, Quévert et tout le département.</p></article>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="titre-histoire">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker">Depuis 1987</p>
          <h2 class="section-head__title" id="titre-histoire">Notre histoire</h2>
        </div>
      </div>
      <ol class="timeline" id="histoireTimeline"></ol>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="titre-rink">
    <div class="container two-col">
      <div>
        <p class="section-head__kicker">Le sport</p>
        <h2 class="section-head__title" id="titre-rink">Le rink hockey, c’est quoi ?</h2>
        <div class="prose">
          <p>Le rink hockey est un hockey sur patins à roulettes (quad), pratiqué en salle sur un parquet, à cinq contre cinq (quatre joueurs de champ et un gardien). Rapide, technique et spectaculaire, il se joue en deux mi-temps de 25 minutes.</p>
          <p>Discipline historique du patinage français, le rink hockey a forgé la légende du HC Dinan-Quévert, l’un des clubs les plus titrés de l’Hexagone.</p>
        </div>
      </div>
      <div class="rink-facts">
        <div class="rink-fact"><strong>5</strong><span>joueurs par équipe</span></div>
        <div class="rink-fact"><strong>2 × 25 min</strong><span>de temps de jeu</span></div>
        <div class="rink-fact"><strong>Patins quad</strong><span>crosse &amp; balle</span></div>
        <div class="rink-fact"><strong>Dès 4 ans</strong><span>à l’école de patinage</span></div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="titre-categories">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker">De 4 à 99 ans</p>
          <h2 class="section-head__title" id="titre-categories">Nos catégories</h2>
        </div>
        <a class="link-arrow" href="equipes.html">Découvrir les équipes</a>
      </div>
      <ul class="categories-list">
        <li><a href="equipe.html?slug=n1-elite"><strong>N1 Élite</strong><span>Équipe fanion — haut niveau national</span></a></li>
        <li><a href="n3.html"><strong>N3</strong><span>Réserve compétitive du club</span></a></li>
        <li><a href="equipe.html?slug=u19"><strong>U19 · U17 · U15</strong><span>La relève en compétition</span></a></li>
        <li><a href="equipe.html?slug=u13"><strong>U13 · U11 · U9</strong><span>L’école du jeu et du plaisir</span></a></li>
        <li><a href="equipe.html?slug=ecole-de-patinage"><strong>École de patinage</strong><span>Dès 4 ans</span></a></li>
      </ul>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="titre-infra">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker">Nos installations</p>
          <h2 class="section-head__title" id="titre-infra">Infrastructures</h2>
        </div>
      </div>
      <div class="infra-grid">
        <article class="infra-card">
          <div class="infra-card__img"><img src="public/img/hero.jpg" alt="Salle Némée, salle omnisports de Dinan" loading="lazy"></div>
          <div class="infra-card__body"><h3 class="infra-card__title">Salle Némée — Dinan</h3><p>Salle omnisports de Dinan (≈ 1 600 places), antre de l’équipe fanion et des grandes soirées européennes du club.</p></div>
        </article>
        <article class="infra-card">
          <div class="infra-card__img"><img src="public/img/club.jpg" alt="Complexe sportif de Quévert" loading="lazy"></div>
          <div class="infra-card__body"><h3 class="infra-card__title">Complexe sportif — Quévert</h3><p>Le gymnase de Quévert accueille les entraînements des jeunes et de l’école de patinage, berceau du club depuis 1987.</p></div>
        </article>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="titre-infos">
    <div class="container two-col">
      <div>
        <p class="section-head__kicker">Nous trouver</p>
        <h2 class="section-head__title" id="titre-infos">Informations pratiques</h2>
        <div class="prose">
          <p><strong>Siège du club</strong><br><span data-bind="adresse"></span></p>
          <p><strong>Lieu des matchs</strong><br><span data-bind="salle"></span></p>
          <p><strong>Téléphone</strong><br><span data-bind="telephone"></span></p>
          <p><strong>Email</strong><br><a href="#" data-href="email"><span data-bind="email"></span></a></p>
          <a class="btn btn--primary" href="#" data-href="salleLien" target="_blank" rel="noopener">Localiser la salle sur la carte</a>
        </div>
      </div>
      <div class="map-placeholder" role="img" aria-label="Carte de localisation — salle Némée, Dinan">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
        <span data-bind="salle"></span>
        <a href="#" data-href="salleLien" target="_blank" rel="noopener">Ouvrir dans Google Maps</a>
      </div>
    </div>
  </section>`
);

pages['equipes.html'] = wrap('equipes', 
  'Équipes · HC Dinan-Quévert',
  'Toutes les équipes du HC Dinan-Quévert : N1 Élite, N3, catégories jeunes U19 à U9 et école de patinage.',
  '',
  `
  <section class="page-hero">
    <div class="page-hero__overlay"></div>
    <div class="container page-hero__inner">
      <p class="page-hero__kicker">Toutes les catégories</p>
      <h1 class="page-hero__title">Nos équipes</h1>
      <p class="page-hero__sub">De l’école de patinage à la N1 Élite, une seule famille bleu &amp; blanc.</p>
    </div>
  </section>
  <div id="equipesRoot"></div>`
);

pages['equipe.html'] = wrap('equipe', 
  'Équipe · HC Dinan-Quévert',
  'Présentation, effectif et agenda d\u2019une équipe du Hockey Club Dinan-Quévert.',
  '',
  `
  <section class="page-hero" id="equipeHero"></section>
  <div id="equipeBody"></div>
  <div id="equipeAgenda"></div>`
);

pages['n3.html'] = wrap('n3', 
  'Équipe N3 · HC Dinan-Quévert',
  'La Nationale 3 du HC Dinan-Quévert : effectif, staff, calendrier, résultats, classement, statistiques et galerie photos.',
  'page-n3',
  `
  <section class="n3-hero" id="n3Hero">
    <div class="n3-hero__overlay"></div>
    <div class="container n3-hero__inner">
      <p class="n3-hero__kicker">Nationale 3 · L’équipe qui monte</p>
      <h1 class="n3-hero__title">N3</h1>
      <p class="n3-hero__sub"></p>
      <div class="n3-hero__actions">
        <a class="btn btn--gold" href="#effectif">Voir l’effectif</a>
        <a class="btn btn--ghost" href="photos.html" data-n3album>Galerie photos</a>
      </div>
    </div>
  </section>

  <section class="n3-stats" aria-label="Statistiques de la N3">
    <div class="container n3-stats__grid" id="n3Stats"></div>
  </section>

  <section class="section" aria-labelledby="n3-presentation">
    <div class="container two-col">
      <div>
        <p class="section-head__kicker section-head__kicker--gold">La réserve compétitive</p>
        <h2 class="section-head__title" id="n3-presentation">Jeunesse et expérience</h2>
      </div>
      <div class="prose" id="n3Presentation"></div>
    </div>
  </section>

  <section class="section section--tint" aria-labelledby="n3-matchs">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker section-head__kicker--gold">L’agenda de la N3</p>
          <h2 class="section-head__title" id="n3-matchs">Matchs &amp; résultats</h2>
        </div>
      </div>
      <div class="split-match">
        <div><h3 class="mini-title">Prochains matchs</h3><div id="n3Prochains"></div></div>
        <div><h3 class="mini-title">Derniers résultats</h3><div id="n3Resultats"></div></div>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="n3-classement">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker section-head__kicker--gold">Le championnat</p>
          <h2 class="section-head__title" id="n3-classement">Classement</h2>
        </div>
      </div>
      <div class="table-scroll">
        <table class="standing-table">
          <caption class="visually-hidden">Classement du championnat — Nationale 3</caption>
          <thead>
            <tr><th scope="col">#</th><th scope="col" class="ta-l">Équipe</th><th scope="col">Pts</th><th scope="col">J</th><th scope="col">G</th><th scope="col">N</th><th scope="col">P</th><th scope="col">+/-</th></tr>
          </thead>
          <tbody id="classementTable"></tbody>
        </table>
      </div>
      <p class="table-note">Classement de démonstration — à mettre à jour depuis l’administration.</p>
    </div>
  </section>

  <section class="section section--dark" id="effectif" aria-labelledby="n3-effectif">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker section-head__kicker--gold">Le groupe</p>
          <h2 class="section-head__title section-head__title--white" id="n3-effectif">L’effectif</h2>
        </div>
      </div>
      <div class="player-grid" id="n3Effectif"></div>
    </div>
  </section>

  <section class="section" aria-labelledby="n3-galerie">
    <div class="container">
      <div class="section-head">
        <div>
          <p class="section-head__kicker section-head__kicker--gold">En images</p>
          <h2 class="section-head__title" id="n3-galerie">Galerie N3</h2>
        </div>
        <a class="link-arrow" href="photos.html" data-n3album>Voir l’album complet</a>
      </div>
      <div class="gallery-grid" id="n3Gallery"></div>
    </div>
  </section>`
);

pages['actualites.html'] = wrap('actualites', 
  'Actualités & résultats · HC Dinan-Quévert',
  'Actualités, événements et résultats du HC Dinan-Quévert : toute la vie du club de rink hockey de Quévert / Dinan.',
  '',
  `
  <section class="page-hero">
    <div class="page-hero__overlay"></div>
    <div class="container page-hero__inner">
      <p class="page-hero__kicker">La vie du club</p>
      <h1 class="page-hero__title">Actualités</h1>
      <p class="page-hero__sub">Résultats, événements, vie associative : tout le HC Dinan-Quévert.</p>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <nav class="tabs" aria-label="Rubriques">
        <a class="tab" data-tab="actualites" href="actualites.html?tab=actualites">Actualités du club</a>
        <a class="tab" data-tab="resultats" href="actualites.html?tab=resultats">Résultats</a>
      </nav>
      <div class="chips" id="catChips" role="group" aria-label="Filtrer par catégorie"></div>
      <div id="newsList"></div>
      <div id="resultatsList"></div>
    </div>
  </section>`
);

pages['article.html'] = wrap('article', 
  'Actualité · HC Dinan-Quévert',
  'Article du HC Dinan-Quévert.',
  '',
  `<div class="section"><div class="container" id="articleRoot"></div></div>`
);

pages['photos.html'] = wrap('photos', 
  'Photos · HC Dinan-Quévert',
  'Galerie photos du HC Dinan-Quévert : albums des matchs, de la N3, des jeunes et de la vie du club.',
  '',
  `
  <section class="page-hero">
    <div class="page-hero__overlay"></div>
    <div class="container page-hero__inner">
      <p class="page-hero__kicker">En images</p>
      <h1 class="page-hero__title">Galerie photos</h1>
      <p class="page-hero__sub">Les plus beaux moments du club, saison après saison.</p>
    </div>
  </section>
  <section class="section"><div class="container" id="albumsRoot"></div></section>`
);

pages['album.html'] = wrap('album', 
  'Album photo · HC Dinan-Quévert',
  'Album photo du HC Dinan-Quévert.',
  '',
  `<div class="section"><div id="albumRoot"></div></div>`
);

pages['adherents.html'] = wrap('adherents', 
  'Espace adhérents · HC Dinan-Quévert',
  'Espace réservé aux adhérents du HC Dinan-Quévert : compositions du week-end, infos pratiques et contacts.',
  '',
  `
  <section class="page-hero">
    <div class="page-hero__overlay"></div>
    <div class="container page-hero__inner">
      <p class="page-hero__kicker">Réservé aux licenciés &amp; parents</p>
      <h1 class="page-hero__title">Espace adhérents</h1>
      <p class="page-hero__sub">Tout ce qu’il faut savoir, simplement, quand vous en avez besoin.</p>
    </div>
  </section>

  <section class="section" id="adherentGate" hidden>
    <div class="container">
      <div class="gate__card">
        <div class="gate__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg></div>
        <h1 class="gate__title">Espace adhérents</h1>
        <p class="gate__text">Cet espace est réservé aux adhérents du club. Saisissez le code communiqué par le club.</p>
        <p class="gate__error" role="alert"></p>
        <form class="gate__form">
          <label class="visually-hidden" for="code">Code d’accès</label>
          <input class="gate__input" id="code" name="code" type="password" autocomplete="off" placeholder="Code d’accès" required>
          <button class="btn btn--primary" type="submit">Accéder</button>
        </form>
      </div>
    </div>
  </section>

  <div id="adherentContent">
    <section class="section">
      <div class="container">
        <div class="quick-actions">
          <a class="quick-action quick-action--primary" href="compositions.html">
            <svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
            <span class="quick-action__title">Compositions du week-end</span>
            <span class="quick-action__text">Où je joue, contre qui, à quelle heure et avec qui ?</span>
          </a>
          <a class="quick-action" href="club.html">
            <svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
            <span class="quick-action__title">Infos pratiques</span>
            <span class="quick-action__text">Adresse, horaires, contacts et accès à la salle.</span>
          </a>
          <a class="quick-action" href="photos.html">
            <svg class="ic" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m5 19 5-5 3 3 3-3 3 3"/></svg>
            <span class="quick-action__title">Photos</span>
            <span class="quick-action__text">Retrouvez les albums du club.</span>
          </a>
        </div>
      </div>
    </section>

    <section class="section section--tint" aria-labelledby="titre-comp">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-head__kicker">Cette semaine</p>
            <h2 class="section-head__title" id="titre-comp">Compositions du week-end</h2>
          </div>
          <a class="link-arrow" href="compositions.html">Tout voir</a>
        </div>
        <div id="compsHome"></div>
      </div>
    </section>

    <section class="section" aria-labelledby="titre-pra">
      <div class="container two-col">
        <div>
          <p class="section-head__kicker">Rappels</p>
          <h2 class="section-head__title" id="titre-pra">À retenir</h2>
          <div class="prose">
            <p><strong>Certificat médical</strong> : obligatoire pour toute licence (sport sur patins).</p>
            <p><strong>Équipement</strong> : patins quad, protections et crosse ; prêt possible pour les débutants à l’école de patinage.</p>
            <p><strong>Convocation</strong> : les compositions sont publiées chaque semaine, pensez à les consulter avant le week-end.</p>
          </div>
        </div>
        <div>
          <p class="section-head__kicker">Contact</p>
          <h2 class="section-head__title">Vos interlocuteurs</h2>
          <div class="prose">
            <p><strong>Secrétariat &amp; licences</strong><br><span data-bind="email"></span></p>
            <p><strong>Siège du club</strong><br><span data-bind="adresse"></span></p>
            <p><strong>Salle des matchs</strong><br><span data-bind="salle"></span></p>
            <p><strong>Téléphone</strong><br><span data-bind="telephone"></span></p>
          </div>
        </div>
      </div>
    </section>
  </div>`
);

pages['compositions.html'] = wrap('compositions', 
  'Compositions du week-end · HC Dinan-Quévert',
  'Compositions des équipes du HC Dinan-Quévert pour le week-end : adversaire, heure, lieu et joueurs.',
  '',
  `
  <section class="page-hero">
    <div class="page-hero__overlay"></div>
    <div class="container page-hero__inner">
      <p class="page-hero__kicker">Espace adhérents</p>
      <h1 class="page-hero__title">Compositions du week-end</h1>
      <p class="page-hero__sub">Où je joue, contre qui, à quelle heure et avec qui ?</p>
    </div>
  </section>

  <section class="section" id="adherentGate" hidden>
    <div class="container">
      <div class="gate__card">
        <div class="gate__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg></div>
        <h1 class="gate__title">Espace adhérents</h1>
        <p class="gate__text">Saisissez le code communiqué par le club pour consulter les compositions.</p>
        <p class="gate__error" role="alert"></p>
        <form class="gate__form">
          <label class="visually-hidden" for="code">Code d’accès</label>
          <input class="gate__input" id="code" name="code" type="password" autocomplete="off" placeholder="Code d’accès" required>
          <button class="btn btn--primary" type="submit">Accéder</button>
        </form>
      </div>
    </div>
  </section>

  <section class="section" id="adherentContent">
    <div class="container" id="compsList"></div>
  </section>`
);

pages['resultats.html'] = wrap('resultats', 
  'Matchs & résultats · HC Dinan-Quévert',
  'Tous les matchs et résultats du HC Dinan-Quévert, club de rink hockey à Quévert / Dinan.',
  '',
  `
  <section class="page-hero">
    <div class="page-hero__overlay"></div>
    <div class="container page-hero__inner">
      <p class="page-hero__kicker">L’agenda du club</p>
      <h1 class="page-hero__title">Matchs &amp; résultats</h1>
      <p class="page-hero__sub">Tous les rendez-vous et les scores du HC Dinan-Quévert.</p>
    </div>
  </section>
  <section class="section" aria-labelledby="titre-avenir">
    <div class="container">
      <div class="section-head"><div><p class="section-head__kicker">À venir</p><h2 class="section-head__title" id="titre-avenir">Prochains matchs</h2></div></div>
      <div id="prochainsAll"></div>
    </div>
  </section>
  <section class="section section--tint" aria-labelledby="titre-resultats">
    <div class="container">
      <div class="section-head"><div><p class="section-head__kicker">Les scores</p><h2 class="section-head__title" id="titre-resultats">Résultats</h2></div></div>
      <div id="resultatsAll"></div>
    </div>
  </section>`
);

pages['mentions-legales.html'] = wrap('legales', 
  'Mentions légales · HC Dinan-Quévert',
  'Mentions légales du site du HC Dinan-Quévert.',
  '',
  `
  <section class="page-hero">
    <div class="page-hero__overlay"></div>
    <div class="container page-hero__inner">
      <p class="page-hero__kicker">Informations</p>
      <h1 class="page-hero__title">Mentions légales</h1>
    </div>
  </section>
  <section class="section">
    <div class="container prose prose--narrow">
      <h2>Éditeur du site</h2>
      <p><span data-bind="nomComplet"></span><br><span data-bind="adresse"></span><br>Tél. : <span data-bind="telephone"></span><br>Email : <span data-bind="email"></span></p>
      <h2>Responsable de la publication</h2>
      <p>Le bureau du <span data-bind="nomCourt"></span>.</p>
      <h2>Hébergement</h2>
      <p>Ce site est hébergé sur GitHub Pages. Les informations relatives à l’hébergeur seront complétées par le club.</p>
      <h2>Propriété intellectuelle</h2>
      <p>L’ensemble des contenus (textes, logos, photos) est la propriété du <span data-bind="nomCourt"></span>, sauf mention contraire. Toute reproduction est soumise à autorisation préalable.</p>
      <h2>Crédits photos</h2>
      <p>Les photos publiées sur ce site sont fournies par le club et ses membres. Les images de démonstration utilisées lors de la conception seront remplacées par les visuels officiels du club.</p>
    </div>
  </section>`
);

pages['confidentialite.html'] = wrap('confidentialite', 
  'Politique de confidentialité · HC Dinan-Quévert',
  'Politique de confidentialité du site du HC Dinan-Quévert.',
  '',
  `
  <section class="page-hero">
    <div class="page-hero__overlay"></div>
    <div class="container page-hero__inner">
      <p class="page-hero__kicker">Informations</p>
      <h1 class="page-hero__title">Politique de confidentialité</h1>
    </div>
  </section>
  <section class="section">
    <div class="container prose prose--narrow">
      <h2>Données personnelles</h2>
      <p>Le <span data-bind="nomCourt"></span> traite les données personnelles de ses adhérents et contacts dans le cadre de la gestion des licences, de l’organisation des activités sportives et de l’information du club.</p>
      <h2>Données collectées</h2>
      <p>Les informations collectées (nom, prénom, coordonnées, informations de licence) sont strictement nécessaires au fonctionnement associatif du club.</p>
      <h2>Cookies</h2>
      <p>Ce site n’utilise pas de cookie publicitaire ni de mesure d’audience tierce. Le site stocke localement, dans votre navigateur, uniquement le code d’accès adhérent que vous saisissez.</p>
      <h2>Vos droits</h2>
      <p>Conformément au RGPD, vous disposez d’un droit d’accès, de rectification et de suppression de vos données. Pour toute demande, contactez : <span data-bind="email"></span>.</p>
    </div>
  </section>`
);

pages['404.html'] = wrap('404', 
  'Page introuvable · HC Dinan-Quévert',
  'Page introuvable.',
  'notfound',
  `
  <div class="container notfound__inner">
    <p class="notfound__code">404</p>
    <h1 class="notfound__title">Page introuvable</h1>
    <p class="notfound__text">La page demandée n’existe pas ou a été déplacée.</p>
    <a class="btn btn--primary" href="index.html">Retour à l’accueil</a>
  </div>`
);

// ---------- écriture ----------
Object.keys(pages).forEach(function (name) {
  fs.writeFileSync(path.join(ROOT, name), pages[name]);
  console.log('écrit :', name);
});
console.log('Terminé.');
