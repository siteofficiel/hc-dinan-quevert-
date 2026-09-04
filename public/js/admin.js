// HC Dinan-Quévert — administration statique (GitHub Pages)
// L'administration modifie data/content.json et les images directement dans le dépôt GitHub.
// La clé (token) sert de connexion : elle n'est conservée qu'en mémoire de session.
(function () {
  'use strict';

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function byId(id) { return document.getElementById(id); }
  function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64decode(b64) { return decodeURIComponent(escape(atob(String(b64).replace(/\s/g, '')))); }
  function slugify(t) {
    return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  }
  function uniqSlug(base, existing) {
    var s = slugify(base) || 'element', i = 2, seen = {};
    existing.forEach(function (x) { seen[x] = 1; });
    while (seen[s]) { s = slugify(base) + '-' + i; i++; }
    return s;
  }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ---------- état & stockage ----------
  var state = {
    token: sessionStorage.getItem('hcq-admin-token') || '',
    owner: localStorage.getItem('hcq-admin-owner') || '',
    repo: localStorage.getItem('hcq-admin-repo') || 'hc-dinan-quevert',
    branch: 'main',
    fileSha: null,
    content: null,
  };

  // ---------- API GitHub ----------
  function api(method, urlPath, body) {
    var headers = {
      Authorization: 'Bearer ' + state.token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
    return fetch('https://api.github.com' + urlPath, {
      method: method, headers: headers, body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (json) {
        return { ok: r.ok, status: r.status, json: json };
      });
    });
  }

  function repoBase() { return '/repos/' + encodeURIComponent(state.owner) + '/' + encodeURIComponent(state.repo); }

  function getFileObj(path) {
    return api('GET', repoBase() + '/contents/' + encodeURIComponent(path) + '?ref=' + encodeURIComponent(state.branch))
      .then(function (r) {
        if (r.status === 200 && r.json && r.json.content) {
          return { sha: r.json.sha, text: b64decode(r.json.content) };
        }
        return null;
      });
  }
  function putFile(path, b64, sha, message) {
    var body = { message: message, content: b64, branch: state.branch };
    if (sha) body.sha = sha;
    return api('PUT', repoBase() + '/contents/' + encodeURIComponent(path), body);
  }
  function deleteFile(path, sha, message) {
    return api('DELETE', repoBase() + '/contents/' + encodeURIComponent(path), { message: message, sha: sha, branch: state.branch });
  }
  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  function uploadImage(file, dir) {
    return readFileAsDataURL(file).then(function (dataUrl) {
      var parts = dataUrl.split(',');
      var ext = (file.name.match(/\.(\w+)$/) || [null, 'jpg'])[1].toLowerCase().replace('jpeg', 'jpg');
      var name = Date.now() + '-' + slugify(file.name.replace(/\.[^.]+$/, '')).slice(0, 60) + '.' + ext;
      var path = 'public/uploads/' + dir + '/' + name;
      return putFile(path, parts[1], null, 'Ajout image ' + name).then(function (r) {
        if (r.ok) return path;
        throw new Error('Échec de l\u2019envoi de l\u2019image (HTTP ' + r.status + ')');
      });
    });
  }

  // ---------- chargement / sauvegarde du contenu ----------
  function loadContent() {
    return api('GET', repoBase()).then(function (r) {
      if (r.json && r.json.default_branch) state.branch = r.json.default_branch;
      return getFileObj('data/content.json');
    }).then(function (f) {
      if (!f) throw new Error('Le fichier data/content.json est introuvable dans le dépôt.');
      state.content = JSON.parse(f.text);
      state.fileSha = f.sha;
    });
  }
  function saveContent(message) {
    return putFile('data/content.json', b64encode(JSON.stringify(state.content, null, 2)), state.fileSha, message || 'Mise à jour du contenu du site')
      .then(function (r) {
        if (!r.ok) {
          var m = (r.json && r.json.message) || ('HTTP ' + r.status);
          throw new Error(m);
        }
        if (r.json && r.json.content && r.json.content.sha) state.fileSha = r.json.content.sha;
      });
  }

  // ---------- interface ----------
  function showFlash(msg, type) {
    var f = byId('flash');
    if (!f) return;
    f.innerHTML = '<p class="flash flash--' + (type || 'ok') + '">' + esc(msg) + '</p>';
  }
  function clearFlash() { var f = byId('flash'); if (f) f.innerHTML = ''; }

  var NAV = [
    { key: 'dashboard', label: 'Tableau de bord', desc: 'Vue d’ensemble', icon: 'M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-18v6h8V3h-8z' },
    { key: 'actualites', label: 'Actualités', desc: 'Créer, modifier, supprimer', icon: 'M4 4h16v3H4zM4 9h16v11H4zM7 12h4v2H7z' },
    { key: 'matchs', label: 'Résultats & matchs', desc: 'Scores et agenda', icon: 'M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3zm7 0v6h-6V7h2.3A7 7 0 0 0 12 5a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5c1.6 0 3.1.7 4 2V3h3z' },
    { key: 'photos', label: 'Photos', desc: 'Albums & images', icon: 'M3 5h18v14H3zM8 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM5 18l5-5 3 3 3-3 3 3' },
    { key: 'compositions', label: 'Compositions', desc: 'Week-end des équipes', icon: 'M8 5h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zm2 4v6m4-6v6M6 9h12' },
    { key: 'equipes', label: 'Équipes', desc: 'Effectifs & encadrement', icon: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5' },
    { key: 'classement', label: 'Classement N3', desc: 'Le tableau du championnat', icon: 'M4 4h16v16H4zM8 8h8v2H8zm0 4h8v2H8zm0 4h5v2H8z' },
    { key: 'reglages', label: 'Réglages', desc: 'Site, accès adhérents', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm10 4a8 8 0 0 0-.1-1l2-1.5-2-3.5-2.4 1A8 8 0 0 0 18 5.6L18.2 3h-4L14 5.6a8 8 0 0 0-1.5.9L10.1 5l-2 3.5 2 1.5a8 8 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.5.9l-.2 2.6h4L17.4 18a8 8 0 0 0 1.5-.9l2.4 1 2-3.5-2-1.5a8 8 0 0 0 .1-1z' },
  ];

  function renderNav() {
    var nav = byId('adminNav');
    nav.innerHTML = NAV.map(function (s) {
      return '<a class="admin-nav__item" href="#" data-section="' + s.key + '">' +
        '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="' + s.icon + '"/></svg>' +
        '<span class="admin-nav__label">' + s.label + '</span><span class="admin-nav__desc">' + s.desc + '</span></a>';
    }).join('');
    Array.prototype.forEach.call(nav.querySelectorAll('[data-section]'), function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openSection(a.getAttribute('data-section')); });
    });
  }

  function setActiveNav(key) {
    Array.prototype.forEach.call(byId('adminNav').querySelectorAll('[data-section]'), function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-section') === key);
    });
  }

  function pagehead(title, sub, actionHtml) {
    return '<div class="admin-pagehead"><div><h1 class="admin-title">' + esc(title) + '</h1>' +
      (sub ? '<p class="admin-subtitle">' + sub + '</p>' : '') + '</div>' +
      (actionHtml || '') + '</div>';
  }

  function backToList(key) {
    return '<p style="margin-bottom:16px"><a class="back-link" href="#" data-back="' + key + '">← Retour à la liste</a></p>';
  }

  function bindBack() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-back]'), function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openSection(a.getAttribute('data-back')); });
    });
  }

  function persist(msg) {
    return saveContent(msg).then(function () {
      showFlash('Modifications publiées sur GitHub. Le site est mis à jour dans environ 1 minute.', 'ok');
    }).catch(function (err) {
      showFlash('Erreur lors de la publication : ' + err.message, 'err');
      throw err;
    });
  }

  function openSection(key) {
    clearFlash();
    setActiveNav(key);
    var box = byId('content');
    if (key === 'dashboard') box.innerHTML = renderDashboard();
    else if (key === 'actualites') renderActualites(box);
    else if (key === 'matchs') renderMatchs(box);
    else if (key === 'equipes') renderEquipes(box);
    else if (key === 'photos') renderPhotos(box);
    else if (key === 'compositions') renderCompositions(box);
    else if (key === 'classement') renderClassement(box);
    else if (key === 'reglages') renderReglages(box);
    window.scrollTo(0, 0);
  }

  // ================= TABLEAU DE BORD =================
  function renderDashboard() {
    var c = state.content;
    var compsPub = c.compositions.filter(function (x) { return x.publie; }).length;
    var html = pagehead('Tableau de bord', 'Choisissez une section pour gérer le contenu du site. Chaque modification est publiée sur GitHub immédiatement.');
    html += '<div class="dash-stats">' +
      dashStat(c.actualites.length, 'Actualités', 'actualites') +
      dashStat(c.matchs.length, 'Matchs & résultats', 'matchs') +
      dashStat(compsPub + ' / ' + c.compositions.length, 'Compositions publiées', 'compositions') +
      dashStat(c.photos.length, 'Photos · ' + c.albums.length + ' albums', 'photos') +
      dashStat(c.equipes.length, 'Équipes', 'equipes') +
      '</div>';
    html += '<div class="dash-help"><h2 class="dash-help__title">Comment ça marche ?</h2><ol class="dash-help__list">' +
      '<li><strong>Actualités</strong> — publiez les infos du club (événements, tournois, annonces…).</li>' +
      '<li><strong>Résultats &amp; matchs</strong> — ajoutez un match avec ou sans score ; il apparaît automatiquement sur l’accueil et la page des résultats.</li>' +
      '<li><strong>Compositions</strong> — composez l’équipe du week-end puis publiez : visible dans l’espace adhérents.</li>' +
      '<li><strong>Photos</strong> — créez un album puis ajoutez vos photos.</li>' +
      '<li><strong>Équipes</strong> — modifiez les effectifs, entraîneurs et présentations.</li>' +
      '</ol></div>';
    return html;
  }
  function dashStat(v, l, key) {
    return '<a class="dash-stat" href="#" data-jump="' + key + '"><span class="dash-stat__value">' + esc(v) + '</span><span class="dash-stat__label">' + esc(l) + '</span></a>';
  }

  // ================= ACTUALITÉS =================
  function renderActualites(box) {
    box.innerHTML = pagehead('Actualités', 'Créez, modifiez ou supprimez les actualités du club.',
      '<a class="btn btn--primary" href="#" data-new>+ Nouvelle actualité</a>');
    var list = state.content.actualites.slice().sort(function (a, b) { return b.dateISO < a.dateISO ? -1 : 1; });
    box.innerHTML += '<ul class="admin-list">' + list.map(function (a) {
      return '<li class="admin-list__item"><div class="admin-list__thumb"><img src="' + esc(a.image || 'public/img/hero.jpg') + '" alt="" width="72" height="48"></div>' +
        '<div class="admin-list__body"><span class="admin-list__title">' + esc(a.titre) + '</span>' +
        '<span class="admin-list__meta"><span class="chip">' + esc(a.categorie) + '</span>' + (a.dateISO || '') +
        (a.publie === false ? ' <span class="badge-issue badge-issue--defaite">Brouillon</span>' : '') +
        (a.epingle ? ' <span class="badge-issue badge-issue--nul">À la une</span>' : '') + '</span></div>' +
        '<div class="admin-list__actions"><a class="btn btn--outline btn--sm" href="#" data-edit="' + a.id + '">Modifier</a>' +
        '<button class="btn btn--danger btn--sm" data-del="' + a.id + '" type="button">Supprimer</button></div></li>';
    }).join('') + '</ul>';
    box.querySelector('[data-new]').addEventListener('click', function (e) { e.preventDefault(); actualiteForm(box, null); });
    box.querySelectorAll('[data-edit]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); actualiteForm(box, b.getAttribute('data-edit')); });
    });
    box.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Supprimer cette actualité ?')) return;
        state.content.actualites = state.content.actualites.filter(function (x) { return x.id !== b.getAttribute('data-del'); });
        persist('Suppression actualité').then(function () { openSection('actualites'); }).catch(function () {});
      });
    });
  }

  function actualiteForm(box, id) {
    var a = id ? state.content.actualites.find(function (x) { return x.id === id; }) : { categorie: 'Vie du club', dateISO: todayISO(), publie: true };
    var cats = ['Vie du club', 'Événements', 'Jeunes', 'N3'];
    box.innerHTML = pagehead(id ? 'Modifier l’actualité' : 'Nouvelle actualité', 'Les champs marqués d’une étoile sont obligatoires.') + backToList('actualites') +
      '<form class="admin-form" id="f">' +
      '<div class="field"><label class="field__label">Titre *</label><input class="field__input" name="titre" type="text" value="' + esc(a.titre || '') + '" required></div>' +
      '<div class="form-row">' +
      '<div class="field"><label class="field__label">Catégorie</label><select class="field__input" name="categorie">' +
      cats.map(function (c) { return '<option' + (a.categorie === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label class="field__label">Date de publication *</label><input class="field__input" name="dateISO" type="date" value="' + (a.dateISO || todayISO()) + '" required></div></div>' +
      '<div class="field"><label class="field__label">Chapeau (affiché dans les listes)</label><textarea class="field__input" name="resume" rows="2">' + esc(a.resume || '') + '</textarea></div>' +
      '<div class="field"><label class="field__label">Contenu *</label><textarea class="field__input" name="contenu" rows="9" required>' + esc(a.contenu || '') + '</textarea><p class="field__hint">Séparez les paragraphes par une ligne vide.</p></div>' +
      '<div class="field"><label class="field__label">Image principale</label>' +
      (a.image ? '<p class="field__hint">Image actuelle : <img src="' + esc(a.image) + '" alt="" style="height:56px;vertical-align:middle;border-radius:6px;margin-left:6px"></p>' : '') +
      '<input class="field__input" name="image" type="file" accept="image/*"><p class="field__hint">Format paysage conseillé (ratio 16:10).</p></div>' +
      '<div class="form-checks">' +
      '<label class="check"><input type="checkbox" name="publie"' + (a.publie !== false ? ' checked' : '') + '> Publier</label>' +
      '<label class="check"><input type="checkbox" name="epingle"' + (a.epingle ? ' checked' : '') + '> Mettre à la une</label></div>' +
      '<div class="form-actions"><button class="btn btn--primary" type="submit">Enregistrer</button><a class="btn btn--outline" href="#" data-back="actualites">Annuler</a></div></form>';
    bindBack();
    box.querySelector('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var busy = f.querySelector('button[type=submit]');
      busy.disabled = true; busy.textContent = 'Publication…';
      var doSave = function () {
        var item = {
          titre: f.titre.value.trim() || 'Sans titre',
          categorie: f.categorie.value,
          dateISO: f.dateISO.value,
          resume: f.resume.value,
          contenu: f.contenu.value,
          publie: f.publie.checked,
          epingle: f.epingle.checked,
        };
        if (id) {
          Object.assign(state.content.actualites.find(function (x) { return x.id === id; }), item);
        } else {
          item.id = newId();
          item.slug = uniqSlug(item.titre, state.content.actualites.map(function (x) { return x.slug; }));
          item.demo = false;
          state.content.actualites.push(item);
        }
        return persist('Actualité : ' + item.titre);
      };
      var file = f.image.files[0];
      var p = file ? uploadImage(file, 'articles') : Promise.resolve(null);
      p.then(function (path) {
        if (path) {
          if (id) state.content.actualites.find(function (x) { return x.id === id; }).image = path;
        }
        return doSave();
      }).then(function () { openSection('actualites'); })
        .catch(function (err) { busy.disabled = false; busy.textContent = 'Enregistrer'; showFlash('Erreur : ' + err.message, 'err'); });
    });
  }

  // ================= MATCHS =================
  function renderMatchs(box) {
    box.innerHTML = pagehead('Résultats & matchs', 'Sans score : le match s’affiche dans « prochains matchs ». Avec score : dans les « résultats ».',
      '<a class="btn btn--primary" href="#" data-new>+ Nouveau match / résultat</a>');
    var list = state.content.matchs.slice().sort(function (a, b) { return b.dateISO < a.dateISO ? -1 : 1; });
    box.innerHTML += '<ul class="admin-list">' + list.map(function (m) {
      var scored = m.scorePour !== null && m.scorePour !== undefined && m.scorePour !== '';
      return '<li class="admin-list__item"><div class="admin-list__body"><span class="admin-list__title">' +
        esc(m.equipeLabel) + ' — Quévert vs ' + esc(m.adversaire) +
        (scored ? ' <strong class="admin-list__score">' + m.scorePour + ' – ' + m.scoreContre + '</strong>' : ' <span class="badge-issue badge-issue--nul">À venir</span>') +
        '</span><span class="admin-list__meta"><span class="chip">' + esc(m.competition) + '</span>' +
        (m.dateISO || '') + (m.heure ? ' · ' + esc(m.heure) : '') + (m.lieu ? ' · ' + esc(m.lieu) : '') +
        (m.publie === false ? ' <span class="badge-issue badge-issue--defaite">Masqué</span>' : '') + '</span></div>' +
        '<div class="admin-list__actions"><a class="btn btn--outline btn--sm" href="#" data-edit="' + m.id + '">Modifier</a>' +
        '<button class="btn btn--danger btn--sm" data-del="' + m.id + '" type="button">Supprimer</button></div></li>';
    }).join('') + '</ul>';
    box.querySelector('[data-new]').addEventListener('click', function (e) { e.preventDefault(); matchForm(box, null); });
    box.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); matchForm(box, b.getAttribute('data-edit')); }); });
    box.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Supprimer ce match ?')) return;
        state.content.matchs = state.content.matchs.filter(function (x) { return x.id !== b.getAttribute('data-del'); });
        persist('Suppression match').then(function () { openSection('matchs'); }).catch(function () {});
      });
    });
  }

  function matchForm(box, id) {
    var m = id ? state.content.matchs.find(function (x) { return x.id === id; }) : { competition: 'Championnat', domicile: true, dateISO: todayISO(), heure: '20:30', publie: true };
    var eq = state.content.equipes.map(function (e) {
      return '<option value="' + esc(e.slug) + '"' + (m.equipeSlug === e.slug ? ' selected' : '') + '>' + esc(e.nom) + ' (' + esc(e.categorie) + ')</option>';
    }).join('');
    var sp = (m.scorePour === null || m.scorePour === undefined || m.scorePour === '') ? '' : m.scorePour;
    var sc = (m.scoreContre === null || m.scoreContre === undefined || m.scoreContre === '') ? '' : m.scoreContre;
    box.innerHTML = pagehead(id ? 'Modifier le match' : 'Nouveau match / résultat', 'Laissez le score vide pour un match à venir.') + backToList('matchs') +
      '<form class="admin-form" id="f">' +
      '<div class="form-row">' +
      '<div class="field"><label class="field__label">Équipe *</label><select class="field__input" name="equipeSlug" required>' + eq + '</select></div>' +
      '<div class="field"><label class="field__label">Compétition</label><input class="field__input" name="competition" type="text" value="' + esc(m.competition || 'Championnat') + '"></div></div>' +
      '<div class="form-row">' +
      '<div class="field"><label class="field__label">Adversaire *</label><input class="field__input" name="adversaire" type="text" value="' + esc(m.adversaire || '') + '" required></div>' +
      '<div class="field"><label class="field__label">Domicile / extérieur</label><div class="seg">' +
      '<label class="seg__opt"><input type="radio" name="domicile" value="true"' + (m.domicile !== false ? ' checked' : '') + '> À domicile</label>' +
      '<label class="seg__opt"><input type="radio" name="domicile" value="false"' + (m.domicile === false ? ' checked' : '') + '> À l’extérieur</label></div></div></div>' +
      '<div class="form-row">' +
      '<div class="field"><label class="field__label">Date *</label><input class="field__input" name="dateISO" type="date" value="' + (m.dateISO || todayISO()) + '" required></div>' +
      '<div class="field"><label class="field__label">Heure</label><input class="field__input" name="heure" type="time" value="' + esc(m.heure || '') + '"></div>' +
      '<div class="field"><label class="field__label">Lieu</label><input class="field__input" name="lieu" type="text" value="' + esc(m.lieu || '') + '"></div></div>' +
      '<div class="form-row">' +
      '<div class="field"><label class="field__label">Score Quévert</label><input class="field__input" name="scorePour" type="number" min="0" value="' + sp + '" placeholder="—"></div>' +
      '<div class="field"><label class="field__label">Score adversaire</label><input class="field__input" name="scoreContre" type="number" min="0" value="' + sc + '" placeholder="—"></div></div>' +
      '<div class="field"><label class="field__label">Résumé (optionnel)</label><textarea class="field__input" name="resume" rows="3">' + esc(m.resume || '') + '</textarea></div>' +
      '<div class="form-checks"><label class="check"><input type="checkbox" name="publie"' + (m.publie !== false ? ' checked' : '') + '> Publier</label></div>' +
      '<div class="form-actions"><button class="btn btn--primary" type="submit">Enregistrer</button><a class="btn btn--outline" href="#" data-back="matchs">Annuler</a></div></form>';
    bindBack();
    box.querySelector('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var eqe = state.content.equipes.find(function (x) { return x.slug === f.equipeSlug.value; });
      var item = {
        equipeSlug: f.equipeSlug.value,
        equipeLabel: eqe ? eqe.nom : 'Équipe',
        competition: f.competition.value,
        adversaire: f.adversaire.value.trim(),
        domicile: f.domicile.value === 'true',
        dateISO: f.dateISO.value,
        heure: f.heure.value,
        lieu: f.lieu.value,
        scorePour: f.scorePour.value === '' ? null : parseInt(f.scorePour.value, 10),
        scoreContre: f.scoreContre.value === '' ? null : parseInt(f.scoreContre.value, 10),
        resume: f.resume.value,
        publie: f.publie.checked,
      };
      if (id) Object.assign(state.content.matchs.find(function (x) { return x.id === id; }), item);
      else { item.id = newId(); item.demo = false; state.content.matchs.push(item); }
      persist('Match : Quévert vs ' + item.adversaire).then(function () { openSection('matchs'); }).catch(function () {});
    });
  }

  // ================= ÉQUIPES =================
  function renderEquipes(box) {
    box.innerHTML = pagehead('Équipes', 'Modifiez les présentations, effectifs et encadrement de chaque équipe.');
    var list = state.content.equipes.slice().sort(function (a, b) { return (a.ordre || 99) - (b.ordre || 99); });
    box.innerHTML += '<ul class="admin-list">' + list.map(function (e) {
      return '<li class="admin-list__item"><div class="admin-list__thumb"><img src="' + esc(e.image || 'public/img/hero.jpg') + '" alt="" width="72" height="48"></div>' +
        '<div class="admin-list__body"><span class="admin-list__title">' + esc(e.nom) + ' <small class="admin-list__categ">· ' + esc(e.categorie) + '</small></span>' +
        '<span class="admin-list__meta">' + (e.joueurs || []).length + ' joueurs · ' + esc(e.entraineur) + (e.publie === false ? ' · masquée' : '') + '</span></div>' +
        '<div class="admin-list__actions"><a class="btn btn--outline btn--sm" href="#" data-edit="' + e.id + '">Modifier</a></div></li>';
    }).join('') + '</ul>';
    box.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); equipeForm(box, b.getAttribute('data-edit')); }); });
  }

  function equipeForm(box, id) {
    var e = state.content.equipes.find(function (x) { return x.id === id; });
    if (!e) return;
    var rows = ((e.joueurs && e.joueurs.length) ? e.joueurs : [{ numero: '', nom: '', poste: '' }]).map(function (j) {
      return '<div class="roster-editor__row"><input class="field__input roster-editor__num" name="jnum" type="text" placeholder="N°" value="' + esc(j.numero) + '">' +
        '<input class="field__input" name="jnom" type="text" placeholder="Nom du joueur" value="' + esc(j.nom) + '">' +
        '<input class="field__input roster-editor__poste" name="jposte" type="text" placeholder="Poste" value="' + esc(j.poste) + '">' +
        '<button type="button" class="btn btn--danger btn--sm roster-editor__remove">×</button></div>';
    }).join('');
    var statsHtml = '';
    if (e.slug === 'n3') {
      var s = e.stats || {};
      statsHtml = '<h2 class="admin-form__section">Statistiques de la N3</h2><div class="form-row">' +
        num('mj', 'Matchs joués', s.mj) + num('g', 'Victoires', s.g) + num('n', 'Nuls', s.n) + num('p', 'Défaites', s.p) +
        num('bp', 'Buts marqués', s.bp) + num('bc', 'Buts encaissés', s.bc) + '</div><div class="form-row">' +
        '<div class="field"><label class="field__label">Meilleur buteur</label><input class="field__input" name="meilleurButeur" type="text" value="' + esc(s.meilleurButeur || '') + '"></div>' +
        '<div class="field"><label class="field__label">Meilleur gardien</label><input class="field__input" name="meilleurGardien" type="text" value="' + esc(s.meilleurGardien || '') + '"></div></div>';
    }
    box.innerHTML = pagehead('Modifier l’équipe — ' + esc(e.nom), 'Les joueurs apparaissent dans l’effectif public de l’équipe.') + backToList('equipes') +
      '<form class="admin-form" id="f">' +
      '<div class="form-row"><div class="field"><label class="field__label">Nom de l’équipe *</label><input class="field__input" name="nom" type="text" value="' + esc(e.nom) + '" required></div>' +
      '<div class="field"><label class="field__label">Catégorie</label><input class="field__input" name="categorie" type="text" value="' + esc(e.categorie) + '"></div></div>' +
      '<div class="field"><label class="field__label">Slogan / accroche</label><input class="field__input" name="tagline" type="text" value="' + esc(e.tagline || '') + '"></div>' +
      '<div class="field"><label class="field__label">Présentation</label><textarea class="field__input" name="description" rows="4">' + esc(e.description || '') + '</textarea></div>' +
      '<div class="form-row"><div class="field"><label class="field__label">Entraîneur</label><input class="field__input" name="entraineur" type="text" value="' + esc(e.entraineur || '') + '"></div>' +
      '<div class="field"><label class="field__label">Staff complémentaire</label><input class="field__input" name="entraineurAdj" type="text" value="' + esc(e.entraineurAdj || '') + '"></div></div>' +
      '<div class="field"><label class="field__label">Photo de l’équipe</label>' +
      (e.image ? '<p class="field__hint">Image actuelle : <img src="' + esc(e.image) + '" alt="" style="height:56px;vertical-align:middle;border-radius:6px;margin-left:6px"></p>' : '') +
      '<input class="field__input" name="image" type="file" accept="image/*"></div>' +
      '<h2 class="admin-form__section">Effectif</h2><div class="roster-editor" id="roster">' + rows + '</div>' +
      '<button type="button" class="btn btn--outline btn--sm" id="addRow">+ Ajouter un joueur</button>' +
      statsHtml +
      '<div class="form-checks"><label class="check"><input type="checkbox" name="publie"' + (e.publie !== false ? ' checked' : '') + '> Équipe visible sur le site</label></div>' +
      '<div class="form-actions"><button class="btn btn--primary" type="submit">Enregistrer</button><a class="btn btn--outline" href="#" data-back="equipes">Annuler</a></div></form>';
    bindBack();
    function addRow() {
      box.querySelector('#roster').insertAdjacentHTML('beforeend',
        '<div class="roster-editor__row"><input class="field__input roster-editor__num" name="jnum" type="text" placeholder="N°">' +
        '<input class="field__input" name="jnom" type="text" placeholder="Nom du joueur">' +
        '<input class="field__input roster-editor__poste" name="jposte" type="text" placeholder="Poste">' +
        '<button type="button" class="btn btn--danger btn--sm roster-editor__remove">×</button></div>');
    }
    box.querySelector('#addRow').addEventListener('click', addRow);
    box.querySelector('#roster').addEventListener('click', function (ev) {
      var b = ev.target.closest('.roster-editor__remove'); if (b) b.closest('.roster-editor__row').remove();
    });
    box.querySelector('#f').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = ev.target;
      var joueurs = [];
      Array.prototype.forEach.call(box.querySelectorAll('#roster .roster-editor__row'), function (row) {
        var n = row.querySelector('[name=jnom]').value.trim();
        if (n) joueurs.push({ numero: row.querySelector('[name=jnum]').value.trim(), nom: n, poste: row.querySelector('[name=jposte]').value.trim() });
      });
      var patch = {
        nom: f.nom.value, categorie: f.categorie.value, tagline: f.tagline.value, description: f.description.value,
        entraineur: f.entraineur.value, entraineurAdj: f.entraineurAdj.value, joueurs: joueurs, publie: f.publie.checked,
      };
      if (e.slug === 'n3') {
        patch.stats = {
          mj: parseInt(f.mj.value, 10) || 0, g: parseInt(f.g.value, 10) || 0, n: parseInt(f.n.value, 10) || 0,
          p: parseInt(f.p.value, 10) || 0, bp: parseInt(f.bp.value, 10) || 0, bc: parseInt(f.bc.value, 10) || 0,
          meilleurButeur: f.meilleurButeur.value, meilleurGardien: f.meilleurGardien.value,
        };
      }
      var file = f.image.files[0];
      var p = file ? uploadImage(file, 'equipes') : Promise.resolve(null);
      p.then(function (path) { if (path) patch.image = path; Object.assign(e, patch); return persist('Équipe : ' + e.nom); })
        .then(function () { openSection('equipes'); }).catch(function () {});
    });
  }
  function num(name, label, val) {
    return '<div class="field"><label class="field__label">' + label + '</label><input class="field__input" name="' + name + '" type="number" min="0" value="' + (val || 0) + '"></div>';
  }

  // ================= PHOTOS =================
  function renderPhotos(box) {
    box.innerHTML = pagehead('Photos & albums', 'Créez un album, puis ajoutez vos photos à l’intérieur.');
    box.innerHTML += '<form class="admin-form admin-form--inline" id="newAlbum">' +
      '<input class="field__input" name="nom" type="text" placeholder="Nom du nouvel album (ex. Tournoi de Pâques)" required>' +
      '<input class="field__input" name="description" type="text" placeholder="Description (facultatif)">' +
      '<button class="btn btn--primary" type="submit">Créer l’album</button></form>';
    state.content.albums.forEach(function (al) {
      var photos = state.content.photos.filter(function (p) { return String(p.albumId) === String(al.id); });
      box.innerHTML += '<section class="album-admin" id="album-' + al.id + '">' +
        '<header class="album-admin__head">' +
        '<form class="album-admin__rename" data-rename="' + al.id + '"><input class="field__input" name="nom" type="text" value="' + esc(al.nom) + '" aria-label="Nom de l’album">' +
        '<button class="btn btn--outline btn--sm" type="submit">Renommer</button></form>' +
        '<span class="album-admin__count">' + photos.length + ' photo' + (photos.length > 1 ? 's' : '') + '</span>' +
        '<button class="btn btn--danger btn--sm" data-delalbum="' + al.id + '" type="button">Supprimer l’album</button></header>' +
        '<form class="admin-form admin-form--inline" data-upload="' + al.id + '"><input class="field__input" name="photos" type="file" accept="image/*" multiple required>' +
        '<button class="btn btn--primary" type="submit">Ajouter des photos</button></form>' +
        (photos.length ? '<div class="admin-photo-grid">' + photos.map(function (p) {
          return '<figure class="admin-photo"><img src="' + esc(p.fichier) + '" alt="" loading="lazy" width="180" height="120">' +
            '<button class="admin-photo__delete" data-delphoto="' + p.id + '" type="button" aria-label="Supprimer la photo">×</button></figure>';
        }).join('') + '</div>' : '<p class="empty-note">Aucune photo dans cet album.</p>') + '</section>';
    });
    box.querySelector('#newAlbum').addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = e.target.nom.value.trim();
      var al = { id: newId(), slug: uniqSlug(nom, state.content.albums.map(function (x) { return x.slug; })), nom: nom, description: e.target.description.value.trim(), dateISO: todayISO(), demo: false };
      state.content.albums.push(al);
      persist('Nouvel album : ' + nom).then(function () { openSection('photos'); }).catch(function () {});
    });
    box.querySelectorAll('[data-rename]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var al = state.content.albums.find(function (x) { return x.id === f.getAttribute('data-rename'); });
        al.nom = f.nom.value.trim();
        persist('Album renommé').then(function () { openSection('photos'); }).catch(function () {});
      });
    });
    box.querySelectorAll('[data-upload]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var alId = f.getAttribute('data-upload');
        var files = Array.prototype.slice.call(f.photos.files);
        if (!files.length) return;
        var btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Envoi…';
        var chain = Promise.resolve();
        files.forEach(function (file) {
          chain = chain.then(function () { return uploadImage(file, 'photos'); }).then(function (path) {
            state.content.photos.push({ id: newId(), albumId: alId, fichier: path, legende: '' });
          });
        });
        chain.then(function () { return persist('Photos ajoutées'); }).then(function () { openSection('photos'); }).catch(function () { openSection('photos'); });
      });
    });
    box.querySelectorAll('[data-delphoto]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Supprimer cette photo ?')) return;
        var p = state.content.photos.find(function (x) { return x.id === b.getAttribute('data-delphoto'); });
        state.content.photos = state.content.photos.filter(function (x) { return x.id !== p.id; });
        persist('Photo supprimée').then(function () { openSection('photos'); }).catch(function () {});
      });
    });
    box.querySelectorAll('[data-delalbum]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Supprimer cet album et toutes ses photos ?')) return;
        var id = b.getAttribute('data-delalbum');
        state.content.photos = state.content.photos.filter(function (x) { return String(x.albumId) !== id; });
        state.content.albums = state.content.albums.filter(function (x) { return x.id !== id; });
        persist('Album supprimé').then(function () { openSection('photos'); }).catch(function () {});
      });
    });
  }

  // ================= COMPOSITIONS =================
  function renderCompositions(box) {
    box.innerHTML = pagehead('Compositions du week-end', 'Composez l’équipe, puis publiez : visible immédiatement dans l’espace adhérents.',
      '<a class="btn btn--primary" href="#" data-new>+ Nouvelle composition</a>');
    var list = state.content.compositions.slice().sort(function (a, b) { return b.dateISO < a.dateISO ? -1 : 1; });
    box.innerHTML += '<ul class="admin-list">' + list.map(function (c) {
      return '<li class="admin-list__item"><div class="admin-list__body"><span class="admin-list__title">' +
        esc(c.equipeLabel) + ' — ' + esc(c.jour) + ' · Quévert vs ' + esc(c.adversaire) + '</span>' +
        '<span class="admin-list__meta">' + (c.dateISO || '') + (c.heure ? ' · ' + esc(c.heure) : '') + (c.lieu ? ' · ' + esc(c.lieu) : '') +
        (c.publie ? ' <span class="badge-issue badge-issue--victoire">Publiée</span>' : ' <span class="badge-issue badge-issue--defaite">Brouillon</span>') + '</span></div>' +
        '<div class="admin-list__actions"><a class="btn btn--outline btn--sm" href="#" data-edit="' + c.id + '">Modifier</a>' +
        (c.publie
          ? '<button class="btn btn--ghost-dark btn--sm" data-unpub="' + c.id + '" type="button">Dépublier</button>'
          : '<button class="btn btn--primary btn--sm" data-pub="' + c.id + '" type="button">Publier</button>') +
        '<button class="btn btn--danger btn--sm" data-del="' + c.id + '" type="button">Supprimer</button></div></li>';
    }).join('') + '</ul>';
    box.querySelector('[data-new]').addEventListener('click', function (e) { e.preventDefault(); compForm(box, null); });
    box.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); compForm(box, b.getAttribute('data-edit')); }); });
    box.querySelectorAll('[data-pub]').forEach(function (b) { b.addEventListener('click', function () { state.content.compositions.find(function (x) { return x.id === b.getAttribute('data-pub'); }).publie = true; persist('Composition publiée').then(function () { openSection('compositions'); }).catch(function () {}); }); });
    box.querySelectorAll('[data-unpub]').forEach(function (b) { b.addEventListener('click', function () { state.content.compositions.find(function (x) { return x.id === b.getAttribute('data-unpub'); }).publie = false; persist('Composition dépubliée').then(function () { openSection('compositions'); }).catch(function () {}); }); });
    box.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { if (!confirm('Supprimer cette composition ?')) return; state.content.compositions = state.content.compositions.filter(function (x) { return x.id !== b.getAttribute('data-del'); }); persist('Composition supprimée').then(function () { openSection('compositions'); }).catch(function () {}); }); });
  }

  function compForm(box, id) {
    var c = id ? state.content.compositions.find(function (x) { return x.id === id; }) : { jour: 'Samedi', dateISO: todayISO(), domicile: true, publie: true, joueurs: [] };
    var eq = state.content.equipes.map(function (e) {
      return '<option value="' + esc(e.slug) + '"' + (c.equipeSlug === e.slug ? ' selected' : '') + '>' + esc(e.nom) + ' (' + esc(e.categorie) + ')</option>';
    }).join('');
    var rows = ((c.joueurs && c.joueurs.length) ? c.joueurs : [{ nom: '', poste: 'Joueur' }, { nom: '', poste: 'Gardien' }]).map(function (j, i) {
      return '<div class="roster-editor__row"><input class="field__input" name="jnom" type="text" placeholder="Nom du joueur" value="' + esc(j.nom) + '">' +
        '<select class="field__input roster-editor__poste" name="jposte"><option value="Joueur"' + (j.poste === 'Joueur' ? ' selected' : '') + '>Joueur</option><option value="Gardien"' + (j.poste === 'Gardien' ? ' selected' : '') + '>Gardien</option></select>' +
        '<label class="check roster-editor__present"><input type="checkbox" name="jpres"' + (j.present !== false ? ' checked' : '') + '> Présent</label>' +
        '<button type="button" class="btn btn--danger btn--sm roster-editor__remove">×</button></div>';
    }).join('');
    box.innerHTML = pagehead(id ? 'Modifier la composition' : 'Nouvelle composition du week-end', 'Remplissez dans l’ordre, puis publiez. Simple et rapide.') + backToList('compositions') +
      '<form class="admin-form" id="f">' +
      '<div class="form-row">' +
      '<div class="field"><label class="field__label">1 · L’équipe *</label><select class="field__input" name="equipeSlug" id="cEquipe" required>' + eq + '</select></div>' +
      '<div class="field"><label class="field__label">2 · Le jour</label><select class="field__input" name="jour"><option' + (c.jour === 'Samedi' ? ' selected' : '') + '>Samedi</option><option' + (c.jour === 'Dimanche' ? ' selected' : '') + '>Dimanche</option></select></div>' +
      '<div class="field"><label class="field__label">Date *</label><input class="field__input" name="dateISO" type="date" value="' + (c.dateISO || todayISO()) + '" required></div></div>' +
      '<div class="form-row">' +
      '<div class="field"><label class="field__label">3 · L’adversaire *</label><input class="field__input" name="adversaire" type="text" value="' + esc(c.adversaire || '') + '" required></div>' +
      '<div class="field"><label class="field__label">L’heure</label><input class="field__input" name="heure" type="time" value="' + esc(c.heure || '') + '"></div>' +
      '<div class="field"><label class="field__label">Le lieu</label><input class="field__input" name="lieu" type="text" value="' + esc(c.lieu || '') + '"></div></div>' +
      '<div class="field"><div class="seg">' +
      '<label class="seg__opt"><input type="radio" name="domicile" value="true"' + (c.domicile !== false ? ' checked' : '') + '> À domicile</label>' +
      '<label class="seg__opt"><input type="radio" name="domicile" value="false"' + (c.domicile === false ? ' checked' : '') + '> À l’extérieur</label></div></div>' +
      '<h2 class="admin-form__section">4 · Les joueurs présents</h2><div class="roster-editor" id="compRoster">' + rows + '</div>' +
      '<div class="form-row form-row--inline"><button type="button" class="btn btn--outline btn--sm" id="addRow">+ Ajouter un joueur</button>' +
      '<button type="button" class="btn btn--outline btn--sm" id="fillRoster">Remplir depuis l’effectif de l’équipe</button></div>' +
      '<div class="field"><label class="field__label">5 · Les absents (un par ligne)</label><textarea class="field__input" name="absents" rows="3">' + esc((c.absents || []).join('\n')) + '</textarea></div>' +
      '<div class="field"><label class="field__label">Note pour les joueurs / parents (facultatif)</label><input class="field__input" name="note" type="text" value="' + esc(c.note || '') + '" placeholder="Ex. Rendez-vous 45 min avant le match"></div>' +
      '<div class="form-actions form-actions--split"><label class="check check--big"><input type="checkbox" name="publie"' + (c.publie !== false ? ' checked' : '') + '> Publier la composition maintenant</label>' +
      '<div><a class="btn btn--outline" href="#" data-back="compositions">Annuler</a><button class="btn btn--primary btn--big" type="submit">' + (id ? 'Enregistrer' : 'Publier la composition') + '</button></div></div></form>';
    bindBack();
    function addRow() {
      box.querySelector('#compRoster').insertAdjacentHTML('beforeend',
        '<div class="roster-editor__row"><input class="field__input" name="jnom" type="text" placeholder="Nom du joueur">' +
        '<select class="field__input roster-editor__poste" name="jposte"><option value="Joueur">Joueur</option><option value="Gardien">Gardien</option></select>' +
        '<label class="check roster-editor__present"><input type="checkbox" name="jpres" checked> Présent</label>' +
        '<button type="button" class="btn btn--danger btn--sm roster-editor__remove">×</button></div>');
    }
    box.querySelector('#addRow').addEventListener('click', addRow);
    box.querySelector('#compRoster').addEventListener('click', function (ev) {
      var b = ev.target.closest('.roster-editor__remove'); if (b) b.closest('.roster-editor__row').remove();
    });
    box.querySelector('#fillRoster').addEventListener('click', function () {
      var slug = box.querySelector('#cEquipe').value;
      var team = state.content.equipes.find(function (x) { return x.slug === slug; });
      if (!team || !team.joueurs || !team.joueurs.length) { alert('Aucun effectif enregistré pour cette équipe.'); return; }
      box.querySelector('#compRoster').innerHTML = team.joueurs.map(function (j, i) {
        var poste = i === 0 ? 'Gardien' : 'Joueur';
        return '<div class="roster-editor__row"><input class="field__input" name="jnom" type="text" value="' + esc(j.nom) + '">' +
          '<select class="field__input roster-editor__poste" name="jposte"><option value="Joueur"' + (poste === 'Joueur' ? ' selected' : '') + '>Joueur</option><option value="Gardien"' + (poste === 'Gardien' ? ' selected' : '') + '>Gardien</option></select>' +
          '<label class="check roster-editor__present"><input type="checkbox" name="jpres" checked> Présent</label>' +
          '<button type="button" class="btn btn--danger btn--sm roster-editor__remove">×</button></div>';
      }).join('');
    });
    box.querySelector('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var joueurs = [];
      Array.prototype.forEach.call(box.querySelectorAll('#compRoster .roster-editor__row'), function (row) {
        var n = row.querySelector('[name=jnom]').value.trim();
        if (n) joueurs.push({ nom: n, poste: row.querySelector('[name=jposte]').value, present: row.querySelector('[name=jpres]').checked });
      });
      var eqe = state.content.equipes.find(function (x) { return x.slug === f.equipeSlug.value; });
      var item = {
        equipeSlug: f.equipeSlug.value, equipeLabel: eqe ? eqe.nom : 'Équipe',
        jour: f.jour.value, dateISO: f.dateISO.value, adversaire: f.adversaire.value.trim(),
        domicile: f.domicile.value === 'true', heure: f.heure.value, lieu: f.lieu.value,
        joueurs: joueurs, absents: f.absents.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
        note: f.note.value, publie: f.publie.checked,
      };
      if (id) Object.assign(state.content.compositions.find(function (x) { return x.id === id; }), item);
      else { item.id = newId(); item.demo = false; state.content.compositions.push(item); }
      persist('Composition : ' + item.equipeLabel + ' vs ' + item.adversaire).then(function () { openSection('compositions'); }).catch(function () {});
    });
  }

  // ================= CLASSEMENT =================
  function renderClassement(box) {
    var rows = state.content.classement.slice().sort(function (a, b) { return a.pos - b.pos; });
    box.innerHTML = pagehead('Classement N3', 'Modifiez le tableau puis enregistrez. La première ligne = 1ʳᵉ place.');
    box.innerHTML += '<form class="admin-form" id="f"><div class="table-scroll"><table class="standing-table standing-table--edit">' +
      '<thead><tr><th>#</th><th class="ta-l">Équipe</th><th>Pts</th><th>J</th><th>G</th><th>N</th><th>P</th><th>BP</th><th>BC</th><th></th></tr></thead><tbody id="rows">' +
      rows.map(function (r) {
        return '<tr><td><span class="pos pos--' + (r.pos <= 3 ? 'top' : 'normal') + '">' + r.pos + '</span></td>' +
          '<td class="ta-l"><input class="field__input field__input--cell" name="equipe" type="text" value="' + esc(r.equipe) + '" required></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="pts" type="number" value="' + r.pts + '"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="j" type="number" value="' + r.j + '"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="g" type="number" value="' + r.g + '"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="n" type="number" value="' + r.n + '"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="p" type="number" value="' + r.p + '"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="bp" type="number" value="' + r.bp + '"></td>' +
          '<td><input class="field__input field__input--cell field__input--num" name="bc" type="number" value="' + r.bc + '"></td>' +
          '<td><button type="button" class="btn btn--danger btn--sm row-remove">×</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="form-actions"><button type="button" class="btn btn--outline" id="addRow">+ Ajouter une ligne</button>' +
      '<button class="btn btn--primary" type="submit">Enregistrer le classement</button></div></form>';
    box.querySelector('#addRow').addEventListener('click', function () {
      box.querySelector('#rows').insertAdjacentHTML('beforeend',
        '<tr><td><span class="pos">+</span></td><td class="ta-l"><input class="field__input field__input--cell" name="equipe" type="text" required></td>' +
        '<td><input class="field__input field__input--cell field__input--num" name="pts" type="number" value="0"></td>' +
        '<td><input class="field__input field__input--cell field__input--num" name="j" type="number" value="0"></td>' +
        '<td><input class="field__input field__input--cell field__input--num" name="g" type="number" value="0"></td>' +
        '<td><input class="field__input field__input--cell field__input--num" name="n" type="number" value="0"></td>' +
        '<td><input class="field__input field__input--cell field__input--num" name="p" type="number" value="0"></td>' +
        '<td><input class="field__input field__input--cell field__input--num" name="bp" type="number" value="0"></td>' +
        '<td><input class="field__input field__input--cell field__input--num" name="bc" type="number" value="0"></td>' +
        '<td><button type="button" class="btn btn--danger btn--sm row-remove">×</button></td></tr>');
    });
    box.querySelector('#rows').addEventListener('click', function (ev) {
      var b = ev.target.closest('.row-remove'); if (b) b.closest('tr').remove();
    });
    box.querySelector('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      var next = [];
      Array.prototype.forEach.call(box.querySelectorAll('#rows tr'), function (tr, i) {
        var g = function (n) { return tr.querySelector('[name=' + n + ']').value; };
        var equipe = g('equipe').trim();
        if (equipe) next.push({ pos: i + 1, equipe: equipe, pts: parseInt(g('pts'), 10) || 0, j: parseInt(g('j'), 10) || 0, g: parseInt(g('g'), 10) || 0, n: parseInt(g('n'), 10) || 0, p: parseInt(g('p'), 10) || 0, bp: parseInt(g('bp'), 10) || 0, bc: parseInt(g('bc'), 10) || 0 });
      });
      state.content.classement = next;
      persist('Classement N3 mis à jour').then(function () { openSection('classement'); }).catch(function () {});
    });
  }

  // ================= RÉGLAGES =================
  function renderReglages(box) {
    var s = state.content.settings;
    function f(name, label, val, type) {
      return '<div class="field"><label class="field__label">' + label + '</label><input class="field__input" name="' + name + '" type="' + (type || 'text') + '" value="' + esc(val || '') + '"></div>';
    }
    box.innerHTML = pagehead('Réglages du site', 'Identité du club, coordonnées, réseaux sociaux, accès adhérents.') +
      '<form class="admin-form" id="f">' +
      '<h2 class="admin-form__section">Identité du club</h2><div class="form-row">' +
      f('nomCourt', 'Nom court', s.nomCourt) + f('nomComplet', 'Nom complet', s.nomComplet) + '</div>' +
      '<div class="field"><label class="field__label">Sous-titre (en-tête du site)</label><input class="field__input" name="sousTitre" type="text" value="' + esc(s.sousTitre) + '"></div>' +
      '<div class="form-row">' + f('slogan', 'Slogan (grand titre de l’accueil)', s.slogan) + f('sloganDetail', 'Phrase d’accroche', s.sloganDetail) + '</div>' +
      '<div class="field"><label class="field__label">Présentation courte du club</label><textarea class="field__input" name="presentation" rows="3">' + esc(s.presentation) + '</textarea></div>' +
      '<h2 class="admin-form__section">Coordonnées</h2><div class="form-row">' +
      f('email', 'Email', s.email) + f('telephone', 'Téléphone', s.telephone) + '</div>' +
      '<div class="field"><label class="field__label">Adresse du siège</label><input class="field__input" name="adresse" type="text" value="' + esc(s.adresse) + '"></div>' +
      '<div class="form-row">' + f('salle', 'Salle des matchs', s.salle) + f('salleLien', 'Lien Google Maps de la salle', s.salleLien) + '</div>' +
      '<h2 class="admin-form__section">Réseaux sociaux</h2><div class="form-row">' +
      f('facebook', 'Facebook', s.facebook) + f('instagram', 'Instagram', s.instagram) + f('youtube', 'YouTube', s.youtube) + '</div>' +
      '<h2 class="admin-form__section">Partenaires (un par ligne)</h2>' +
      '<div class="field"><textarea class="field__input" name="partenaires" rows="4">' + esc((s.partenaires || []).join('\n')) + '</textarea></div>' +
      '<h2 class="admin-form__section">Accès espace adhérents</h2>' +
      '<div class="field"><label class="field__label">Code d’accès (laisser vide = accès libre)</label>' +
      '<input class="field__input" name="codeAdherent" type="text" value="' + esc(s.codeAdherent || '') + '" placeholder="Ex. 2026">' +
      '<p class="field__hint">Si un code est défini, les adhérents devront le saisir pour consulter les compositions.</p></div>' +
      '<div class="form-actions"><button class="btn btn--primary" type="submit">Enregistrer les réglages</button></div></form>';
    box.querySelector('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      Object.assign(s, {
        nomCourt: f.nomCourt.value, nomComplet: f.nomComplet.value, sousTitre: f.sousTitre.value,
        slogan: f.slogan.value, sloganDetail: f.sloganDetail.value, presentation: f.presentation.value,
        email: f.email.value, telephone: f.telephone.value, adresse: f.adresse.value,
        salle: f.salle.value, salleLien: f.salleLien.value,
        facebook: f.facebook.value, instagram: f.instagram.value, youtube: f.youtube.value,
        codeAdherent: f.codeAdherent.value.trim(),
        partenaires: f.partenaires.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean),
      });
      persist('Réglages mis à jour').then(function () { openSection('reglages'); }).catch(function () {});
    });
  }

  // ================= CONNEXION =================
  function showLogin(err) {
    byId('adminShell').hidden = true;
    byId('loginPanel').hidden = false;
    if (err) { var e = byId('loginError'); e.textContent = err; e.hidden = false; }
  }
  function showApp() {
    byId('loginPanel').hidden = true;
    byId('adminShell').hidden = false;
    byId('repoLabel').textContent = state.owner + '/' + state.repo;
    renderNav();
    openSection('dashboard');
    // navigation par les gros boutons du tableau de bord
    byId('content').addEventListener('click', function (ev) {
      var j = ev.target.closest('[data-jump]');
      if (j) { ev.preventDefault(); openSection(j.getAttribute('data-jump')); }
    });
  }

  // ================= démarrage =================
  byId('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var token = byId('token').value.trim();
    var owner = byId('owner').value.trim();
    var repo = byId('repo').value.trim();
    if (!token || !owner || !repo) return;
    state.token = token; state.owner = owner; state.repo = repo;
    sessionStorage.setItem('hcq-admin-token', token);
    localStorage.setItem('hcq-admin-owner', owner);
    localStorage.setItem('hcq-admin-repo', repo);
    var btn = byId('loginForm').querySelector('button'); btn.disabled = true; btn.textContent = 'Connexion…';
    loadContent().then(function () {
      btn.disabled = false; btn.textContent = 'Se connecter';
      showApp();
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = 'Se connecter';
      sessionStorage.removeItem('hcq-admin-token');
      showLogin('Connexion impossible : ' + err.message + ' — vérifiez la clé, le propriétaire et le nom du dépôt.');
    });
  });

  byId('logoutBtn').addEventListener('click', function () {
    sessionStorage.removeItem('hcq-admin-token');
    location.reload();
  });

  if (state.token && state.owner) {
    loadContent().then(showApp).catch(function () { showLogin('Connexion impossible : vérifiez votre clé GitHub.'); });
  } else {
    showLogin();
  }
})();
