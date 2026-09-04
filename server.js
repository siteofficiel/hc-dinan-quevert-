// HC Dinan-Quévert — site du club de rink hockey
// Express + EJS + stockage JSON (aucune dépendance lourde).

const path = require('path');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');

const db = require('./lib/db');
const util = require('./lib/util');
const github = require('./lib/github');
const { seed, migrate } = require('./lib/seed');
const { requireAuth, csrfToken, csrfProtect } = require('./middleware/auth');

// Initialisation des données de démonstration au premier démarrage + migrations
if (!fs.existsSync(db.DB_FILE)) seed();
migrate();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(express.urlencoded({ extended: true, limit: '4mb' }));
app.use(express.json({ limit: '4mb' }));

const secret = db.getSettings().sessionSecret || crypto.randomBytes(32).toString('hex');
app.use(
  session({
    name: 'hcq.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 h
    },
  })
);

app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d', etag: true }));

// ---- Helpers globaux pour les vues ----
app.use((req, res, next) => {
  res.locals.site = db.getSettings();
  res.locals.util = util;
  res.locals.db = db;
  res.locals.path = req.path;
  res.locals.query = req.query;
  res.locals.isAdmin = !!(req.session && req.session.user);
  res.locals.isAdherent = !!(req.session && req.session.adherentOk);
  next();
});

app.use(csrfToken);

// ---- Upload d'images ----
function makeUpload(dir) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const d = path.join(__dirname, 'public', 'uploads', dir);
      fs.mkdirSync(d, { recursive: true });
      cb(null, d);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const base = util.slugify(path.basename(file.originalname, path.extname(file.originalname))) || 'image';
      cb(null, `${Date.now()}-${base}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Seules les images sont acceptées.'));
    },
  });
}
const uploadArticle = makeUpload('articles');
const uploadEquipe = makeUpload('equipes');
const uploadPhotos = makeUpload('photos');

// ---- Garde espace adhérents (code partagé optionnel) ----
function gateAdherent(req, res, next) {
  const code = db.getSettings().codeAdherent;
  if (!code || (req.session && req.session.adherentOk)) return next();
  if (req.method === 'POST' && req.body && req.body.code) {
    if (String(req.body.code).trim() === String(code).trim()) {
      req.session.adherentOk = true;
      return res.redirect(req.path);
    }
    return res.status(200).render('adherents/code', {
      pageTitle: 'Espace adhérents',
      error: 'Code incorrect, réessayez.',
      csrfToken: res.locals.csrfToken,
    });
  }
  return res.render('adherents/code', { pageTitle: 'Espace adhérents', error: null, csrfToken: res.locals.csrfToken });
}

// =========================================================
//  ROUTES PUBLIQUES
// =========================================================

// ---- Accueil ----
app.get('/', (req, res) => {
  const matchs = db.get('matchs').filter((m) => m.publie);
  const prochains = matchs.filter((m) => util.isFuture(m)).sort((a, b) => a.dateISO.localeCompare(b.dateISO)).slice(0, 4);
  const resultats = matchs.filter((m) => m.scorePour !== null && m.scorePour !== undefined && m.scorePour !== '').sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  const dernier = resultats[0] || null;
  const actus = db.get('actualites').filter((a) => a.publie).sort((a, b) => (b.epingle ? 1 : 0) - (a.epingle ? 1 : 0) || b.dateISO.localeCompare(a.dateISO)).slice(0, 3);
  const albums = db.get('albums').map((al) => ({
    ...al,
    cover: db.get('photos').find((p) => String(p.albumId) === String(al.id)) || null,
    count: db.get('photos').filter((p) => String(p.albumId) === String(al.id)).length,
  })).slice(0, 3);
  const n3 = db.get('equipes').find((e) => e.slug === 'n3');
  res.render('index', {
    pageTitle: 'Accueil',
    prochains, dernier, actus, albums, n3,
  });
});

// ---- Le club ----
app.get('/club', (req, res) => {
  res.render('club', { pageTitle: 'Le club' });
});

// ---- Équipes ----
app.get('/equipes', (req, res) => {
  const equipes = db.get('equipes').filter((e) => e.publie !== false).sort((a, b) => (a.ordre || 99) - (b.ordre || 99));
  const groupes = {};
  for (const e of equipes) {
    const cat = e.categorie || 'Autres';
    (groupes[cat] = groupes[cat] || []).push(e);
  }
  res.render('equipes', { pageTitle: 'Équipes', equipes, groupes });
});

app.get('/equipes/:slug', (req, res) => {
  const equipe = db.get('equipes').find((e) => e.slug === req.params.slug);
  if (!equipe) return res.status(404).render('404', { pageTitle: 'Page introuvable' });
  const matchs = db.get('matchs').filter((m) => m.publie && m.equipeSlug === equipe.slug).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const prochains = matchs.filter((m) => util.isFuture(m));
  const resultats = matchs.filter((m) => m.scorePour !== null && m.scorePour !== undefined && m.scorePour !== '').reverse();
  res.render('equipe', { pageTitle: equipe.nom, equipe, prochains, resultats });
});

// ---- N3 ----
app.get('/n3', (req, res) => {
  const equipe = db.get('equipes').find((e) => e.slug === 'n3');
  const matchs = db.get('matchs').filter((m) => m.publie && m.equipeSlug === 'n3').sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const prochains = matchs.filter((m) => util.isFuture(m));
  const resultats = matchs.filter((m) => m.scorePour !== null && m.scorePour !== undefined && m.scorePour !== '').reverse();
  const classement = db.get('classement').slice().sort((a, b) => a.pos - b.pos);
  const album = db.get('albums').find((a) => /^n3/i.test(a.slug)) || db.get('albums')[0];
  const photos = album ? db.get('photos').filter((p) => String(p.albumId) === String(album.id)) : [];
  res.render('n3', { pageTitle: 'Équipe N3', equipe, prochains, resultats, classement, album, photos });
});

// ---- Actualités ----
app.get('/actualites', (req, res) => {
  const cat = req.query.cat || '';
  const tab = req.query.tab || 'actualites';
  let actus = db.get('actualites').filter((a) => a.publie).sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  const categories = [...new Set(actus.map((a) => a.categorie).filter(Boolean))];
  if (cat) actus = actus.filter((a) => a.categorie === cat);
  let resultats = [];
  if (tab === 'resultats') {
    resultats = db.get('matchs').filter((m) => m.publie && m.scorePour !== null && m.scorePour !== undefined && m.scorePour !== '').sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  }
  res.render('actualites', { pageTitle: 'Actualités', actus, categories, cat, tab, resultats });
});

app.get('/actualites/:slug', (req, res) => {
  const article = db.get('actualites').find((a) => a.slug === req.params.slug && a.publie !== false);
  if (!article) return res.status(404).render('404', { pageTitle: 'Article introuvable' });
  const autres = db.get('actualites').filter((a) => a.publie && a.id !== article.id).sort((a, b) => b.dateISO.localeCompare(a.dateISO)).slice(0, 3);
  res.render('article', { pageTitle: article.titre, article, autres });
});

app.get('/resultats', (req, res) => {
  const resultats = db.get('matchs').filter((m) => m.publie && m.scorePour !== null && m.scorePour !== undefined && m.scorePour !== '').sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  res.render('resultats', { pageTitle: 'Résultats', resultats });
});

// ---- Photos ----
app.get('/photos', (req, res) => {
  const albums = db.get('albums').map((al) => ({
    ...al,
    cover: db.get('photos').find((p) => String(p.albumId) === String(al.id)) || null,
    count: db.get('photos').filter((p) => String(p.albumId) === String(al.id)).length,
  }));
  res.render('photos', { pageTitle: 'Photos', albums });
});

app.get('/photos/:slug', (req, res) => {
  const album = db.get('albums').find((a) => a.slug === req.params.slug);
  if (!album) return res.status(404).render('404', { pageTitle: 'Album introuvable' });
  const photos = db.get('photos').filter((p) => String(p.albumId) === String(album.id));
  const albums = db.get('albums').map((al) => ({
    ...al,
    cover: db.get('photos').find((p) => String(p.albumId) === String(al.id)) || null,
    count: db.get('photos').filter((p) => String(p.albumId) === String(al.id)).length,
  }));
  res.render('album', { pageTitle: album.nom, album, photos, albums });
});

// ---- Espace adhérents ----
app.get('/adherents', gateAdherent, (req, res) => {
  const comps = db.get('compositions').filter((c) => c.publie).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  res.render('adherents/index', { pageTitle: 'Espace adhérents', comps });
});

app.get('/compositions', gateAdherent, (req, res) => {
  const comps = db.get('compositions').filter((c) => c.publie).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const prochaines = comps.filter((c) => util.isUpcoming(c.dateISO));
  res.render('adherents/compositions', { pageTitle: 'Compositions du week-end', comps, prochaines });
});

// ---- Pages légales ----
app.get('/mentions-legales', (req, res) => res.render('mentions-legales', { pageTitle: 'Mentions légales' }));
app.get('/confidentialite', (req, res) => res.render('confidentialite', { pageTitle: 'Politique de confidentialité' }));

// =========================================================
//  ADMINISTRATION
// =========================================================

app.get('/admin/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('admin/login', { pageTitle: 'Connexion', error: null, layout: 'admin' });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.get('users').find((u) => u.username === String(username || '').trim());
  if (user && bcrypt.compareSync(String(password || ''), user.passwordHash)) {
    req.session.user = { username: user.username, role: user.role };
    return res.redirect('/admin');
  }
  res.status(401).render('admin/login', { pageTitle: 'Connexion', error: 'Identifiants incorrects.', layout: 'admin' });
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.get('/admin', requireAuth, (req, res) => {
  const counts = {
    actualites: db.get('actualites').length,
    matchs: db.get('matchs').length,
    equipes: db.get('equipes').length,
    albums: db.get('albums').length,
    photos: db.get('photos').length,
    compositions: db.get('compositions').length,
    publiees: db.get('compositions').filter((c) => c.publie).length,
  };
  res.render('admin/dashboard', { pageTitle: 'Tableau de bord', layout: 'admin', counts });
});

// ---- Admin : actualités ----
app.get('/admin/actualites', requireAuth, (req, res) => {
  const actus = db.get('actualites').sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  res.render('admin/actualites', { pageTitle: 'Gérer les actualités', layout: 'admin', actus });
});

app.get('/admin/actualites/nouveau', requireAuth, (req, res) => {
  res.render('admin/actualite-form', { pageTitle: 'Nouvelle actualité', layout: 'admin', article: {}, editing: false });
});

app.post('/admin/actualites', uploadArticle.single('image'), csrfProtect, requireAuth, (req, res) => {
  const b = req.body;
  const article = {
    titre: b.titre || 'Sans titre',
    categorie: b.categorie || 'Vie du club',
    dateISO: b.dateISO || util.todayISO(),
    resume: b.resume || '',
    contenu: b.contenu || '',
    publie: b.publie === 'on' || b.publie === '1' || b.publie === 'true',
    epingle: b.epingle === 'on' || b.epingle === '1' || b.epingle === 'true',
    demo: false,
  };
  if (req.file) article.image = '/uploads/articles/' + req.file.filename;
  const existing = db.get('actualites').map((a) => a.slug);
  article.slug = util.ensureUniqueSlug(article.titre, existing);
  db.insert('actualites', article);
  res.redirect('/admin/actualites');
});

app.get('/admin/actualites/:id', requireAuth, (req, res) => {
  const article = db.find('actualites', req.params.id);
  if (!article) return res.redirect('/admin/actualites');
  res.render('admin/actualite-form', { pageTitle: 'Modifier l’actualité', layout: 'admin', article, editing: true });
});

app.post('/admin/actualites/:id', uploadArticle.single('image'), csrfProtect, requireAuth, (req, res) => {
  const b = req.body;
  const patch = {
    titre: b.titre,
    categorie: b.categorie,
    dateISO: b.dateISO,
    resume: b.resume,
    contenu: b.contenu,
    publie: b.publie === 'on' || b.publie === '1' || b.publie === 'true',
    epingle: b.epingle === 'on' || b.epingle === '1' || b.epingle === 'true',
  };
  if (req.file) patch.image = '/uploads/articles/' + req.file.filename;
  db.update('actualites', req.params.id, patch);
  res.redirect('/admin/actualites');
});

app.post('/admin/actualites/:id/supprimer', csrfProtect, requireAuth, (req, res) => {
  db.remove('actualites', req.params.id);
  res.redirect('/admin/actualites');
});

// ---- Admin : résultats & matchs ----
app.get('/admin/matchs', requireAuth, (req, res) => {
  const matchs = db.get('matchs').sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  res.render('admin/matchs', { pageTitle: 'Résultats & matchs', layout: 'admin', matchs });
});

app.get('/admin/matchs/nouveau', requireAuth, (req, res) => {
  const equipes = db.get('equipes');
  res.render('admin/match-form', { pageTitle: 'Nouveau match / résultat', layout: 'admin', match: {}, equipes, editing: false });
});

app.post('/admin/matchs', csrfProtect, requireAuth, (req, res) => {
  const b = req.body;
  const equipe = db.find('equipes', b.equipeSlug) || {};
  const match = {
    equipeSlug: b.equipeSlug || '',
    equipeLabel: b.equipeLabel || equipe.nom || 'Équipe',
    competition: b.competition || 'Championnat',
    adversaire: b.adversaire || 'Adversaire',
    domicile: b.domicile === 'true' || b.domicile === 'on' || b.domicile === '1',
    dateISO: b.dateISO || util.todayISO(),
    heure: b.heure || '20:30',
    lieu: b.lieu || '',
    scorePour: (b.scorePour === '' || b.scorePour === undefined) ? null : parseInt(b.scorePour, 10),
    scoreContre: (b.scoreContre === '' || b.scoreContre === undefined) ? null : parseInt(b.scoreContre, 10),
    resume: b.resume || '',
    publie: b.publie === 'on' || b.publie === '1' || b.publie === 'true',
    demo: false,
  };
  db.insert('matchs', match);
  res.redirect('/admin/matchs');
});

app.get('/admin/matchs/:id', requireAuth, (req, res) => {
  const match = db.find('matchs', req.params.id);
  if (!match) return res.redirect('/admin/matchs');
  const equipes = db.get('equipes');
  res.render('admin/match-form', { pageTitle: 'Modifier le match', layout: 'admin', match, equipes, editing: true });
});

app.post('/admin/matchs/:id', csrfProtect, requireAuth, (req, res) => {
  const b = req.body;
  const equipe = db.find('equipes', b.equipeSlug) || {};
  db.update('matchs', req.params.id, {
    equipeSlug: b.equipeSlug,
    equipeLabel: b.equipeLabel || equipe.nom || 'Équipe',
    competition: b.competition,
    adversaire: b.adversaire,
    domicile: b.domicile === 'true' || b.domicile === 'on' || b.domicile === '1',
    dateISO: b.dateISO,
    heure: b.heure,
    lieu: b.lieu,
    scorePour: (b.scorePour === '' || b.scorePour === undefined) ? null : parseInt(b.scorePour, 10),
    scoreContre: (b.scoreContre === '' || b.scoreContre === undefined) ? null : parseInt(b.scoreContre, 10),
    resume: b.resume,
    publie: b.publie === 'on' || b.publie === '1' || b.publie === 'true',
  });
  res.redirect('/admin/matchs');
});

app.post('/admin/matchs/:id/supprimer', csrfProtect, requireAuth, (req, res) => {
  db.remove('matchs', req.params.id);
  res.redirect('/admin/matchs');
});

// ---- Admin : équipes ----
app.get('/admin/equipes', requireAuth, (req, res) => {
  const equipes = db.get('equipes').sort((a, b) => (a.ordre || 99) - (b.ordre || 99));
  res.render('admin/equipes', { pageTitle: 'Gérer les équipes', layout: 'admin', equipes });
});

app.get('/admin/equipes/:id', requireAuth, (req, res) => {
  const equipe = db.find('equipes', req.params.id);
  if (!equipe) return res.redirect('/admin/equipes');
  res.render('admin/equipe-form', { pageTitle: 'Modifier l’équipe', layout: 'admin', equipe, editing: true });
});

function parseJoueurs(body) {
  const nom = [].concat(body['joueurs[nom]'] || []);
  const numero = [].concat(body['joueurs[numero]'] || []);
  const poste = [].concat(body['joueurs[poste]'] || []);
  const joueurs = [];
  nom.forEach((n, i) => {
    if (String(n).trim()) {
      joueurs.push({ numero: (numero[i] || '').trim(), nom: String(n).trim(), poste: (poste[i] || '').trim() });
    }
  });
  return joueurs;
}

app.post('/admin/equipes/:id', uploadEquipe.single('image'), csrfProtect, requireAuth, (req, res) => {
  const b = req.body;
  const patch = {
    nom: b.nom,
    categorie: b.categorie,
    tagline: b.tagline,
    description: b.description,
    entraineur: b.entraineur,
    entraineurAdj: b.entraineurAdj,
    publie: b.publie === 'on' || b.publie === '1' || b.publie === 'true',
    joueurs: parseJoueurs(b),
  };
  if (b.stats) {
    patch.stats = {
      mj: parseInt(b.mj, 10) || 0,
      g: parseInt(b.g, 10) || 0,
      n: parseInt(b.n, 10) || 0,
      p: parseInt(b.p, 10) || 0,
      bp: parseInt(b.bp, 10) || 0,
      bc: parseInt(b.bc, 10) || 0,
      meilleurButeur: b.meilleurButeur || '',
      meilleurGardien: b.meilleurGardien || '',
    };
  }
  if (req.file) patch.image = '/uploads/equipes/' + req.file.filename;
  db.update('equipes', req.params.id, patch);
  res.redirect('/admin/equipes');
});

// ---- Admin : photos & albums ----
app.get('/admin/photos', requireAuth, (req, res) => {
  const albums = db.get('albums').map((al) => ({
    ...al,
    cover: db.get('photos').find((p) => String(p.albumId) === String(al.id)) || null,
    count: db.get('photos').filter((p) => String(p.albumId) === String(al.id)).length,
  }));
  res.render('admin/photos', { pageTitle: 'Gérer les photos', layout: 'admin', albums });
});

app.post('/admin/albums', csrfProtect, requireAuth, (req, res) => {
  const nom = (req.body.nom || '').trim();
  if (!nom) return res.redirect('/admin/photos');
  const existing = db.get('albums').map((a) => a.slug);
  db.insert('albums', {
    nom,
    description: (req.body.description || '').trim(),
    slug: util.ensureUniqueSlug(nom, existing),
    dateISO: util.todayISO(),
    demo: false,
  });
  res.redirect('/admin/photos');
});

app.post('/admin/albums/:id', csrfProtect, requireAuth, (req, res) => {
  db.update('albums', req.params.id, { nom: req.body.nom, description: req.body.description });
  res.redirect('/admin/photos');
});

app.post('/admin/albums/:id/supprimer', csrfProtect, requireAuth, (req, res) => {
  const photos = db.get('photos').filter((p) => String(p.albumId) === String(req.params.id));
  photos.forEach((p) => {
    const f = path.join(__dirname, 'public', p.fichier);
    if (fs.existsSync(f)) { try { fs.unlinkSync(f); } catch (e) {} }
  });
  db.get('photos').forEach((p) => { if (String(p.albumId) === String(req.params.id)) db.remove('photos', p.id); });
  db.remove('albums', req.params.id);
  res.redirect('/admin/photos');
});

app.post('/admin/albums/:id/photos', uploadPhotos.array('photos', 30), csrfProtect, requireAuth, (req, res) => {
  (req.files || []).forEach((f) => {
    db.insert('photos', { albumId: req.params.id, fichier: '/uploads/photos/' + f.filename, legende: '' });
  });
  res.redirect('/admin/photos?album=' + req.params.id + '#album-' + req.params.id);
});

app.post('/admin/photos/:id/supprimer', csrfProtect, requireAuth, (req, res) => {
  const p = db.find('photos', req.params.id);
  const albumId = p ? p.albumId : null;
  if (p) {
    const f = path.join(__dirname, 'public', p.fichier);
    if (fs.existsSync(f)) { try { fs.unlinkSync(f); } catch (e) {} }
    db.remove('photos', req.params.id);
  }
  res.redirect(albumId ? '/admin/photos?album=' + albumId + '#album-' + albumId : '/admin/photos');
});

// ---- Admin : compositions ----
app.get('/admin/compositions', requireAuth, (req, res) => {
  const comps = db.get('compositions').sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  res.render('admin/compositions', { pageTitle: 'Compositions du week-end', layout: 'admin', comps });
});

app.get('/admin/compositions/nouveau', requireAuth, (req, res) => {
  const equipes = db.get('equipes');
  const equipe = db.get('equipes').find((e) => e.slug === 'n3');
  res.render('admin/composition-form', { pageTitle: 'Nouvelle composition', layout: 'admin', comp: {}, equipes, equipe, editing: false });
});

app.post('/admin/compositions', csrfProtect, requireAuth, (req, res) => {
  const b = req.body;
  const equipe = db.find('equipes', b.equipeSlug) || {};
  const nom = [].concat(b['joueurs[nom]'] || []);
  const poste = [].concat(b['joueurs[poste]'] || []);
  const present = [].concat(b['joueurs[present]'] || []);
  const joueurs = [];
  nom.forEach((n, i) => {
    if (String(n).trim()) joueurs.push({ nom: String(n).trim(), poste: (poste[i] || 'Joueur').trim(), present: present.includes(String(i)) });
  });
  const absents = String(b.absents || '').split('\n').map((s) => s.trim()).filter(Boolean);
  db.insert('compositions', {
    equipeSlug: b.equipeSlug,
    equipeLabel: b.equipeLabel || equipe.nom || 'Équipe',
    jour: b.jour || 'Samedi',
    dateISO: b.dateISO || util.todayISO(),
    adversaire: b.adversaire || '',
    domicile: b.domicile === 'on' || b.domicile === '1' || b.domicile === 'true',
    heure: b.heure || '',
    lieu: b.lieu || '',
    joueurs,
    absents,
    note: b.note || '',
    publie: b.publie === 'on' || b.publie === '1' || b.publie === 'true',
    demo: false,
  });
  res.redirect('/admin/compositions');
});

app.get('/admin/compositions/:id', requireAuth, (req, res) => {
  const comp = db.find('compositions', req.params.id);
  if (!comp) return res.redirect('/admin/compositions');
  const equipes = db.get('equipes');
  const equipe = db.get('equipes').find((e) => e.slug === comp.equipeSlug);
  res.render('admin/composition-form', { pageTitle: 'Modifier la composition', layout: 'admin', comp, equipes, equipe, editing: true });
});

app.post('/admin/compositions/:id', csrfProtect, requireAuth, (req, res) => {
  const b = req.body;
  const equipe = db.find('equipes', b.equipeSlug) || {};
  const nom = [].concat(b['joueurs[nom]'] || []);
  const poste = [].concat(b['joueurs[poste]'] || []);
  const present = [].concat(b['joueurs[present]'] || []);
  const joueurs = [];
  nom.forEach((n, i) => {
    if (String(n).trim()) joueurs.push({ nom: String(n).trim(), poste: (poste[i] || 'Joueur').trim(), present: present.includes(String(i)) });
  });
  db.update('compositions', req.params.id, {
    equipeSlug: b.equipeSlug,
    equipeLabel: b.equipeLabel || equipe.nom || 'Équipe',
    jour: b.jour,
    dateISO: b.dateISO,
    adversaire: b.adversaire,
    domicile: b.domicile === 'on' || b.domicile === '1' || b.domicile === 'true',
    heure: b.heure,
    lieu: b.lieu,
    joueurs,
    absents: String(b.absents || '').split('\n').map((s) => s.trim()).filter(Boolean),
    note: b.note,
    publie: b.publie === 'on' || b.publie === '1' || b.publie === 'true',
  });
  res.redirect('/admin/compositions');
});

app.post('/admin/compositions/:id/publier', csrfProtect, requireAuth, (req, res) => {
  db.update('compositions', req.params.id, { publie: true });
  res.redirect('/admin/compositions');
});

app.post('/admin/compositions/:id/depublier', csrfProtect, requireAuth, (req, res) => {
  db.update('compositions', req.params.id, { publie: false });
  res.redirect('/admin/compositions');
});

app.post('/admin/compositions/:id/supprimer', csrfProtect, requireAuth, (req, res) => {
  db.remove('compositions', req.params.id);
  res.redirect('/admin/compositions');
});

// ---- Admin : classement N3 ----
app.get('/admin/classement', requireAuth, (req, res) => {
  const classement = db.get('classement').slice().sort((a, b) => a.pos - b.pos);
  res.render('admin/classement', { pageTitle: 'Classement N3', layout: 'admin', classement });
});

app.post('/admin/classement', csrfProtect, requireAuth, (req, res) => {
  const noms = [].concat(req.body['equipe'] || []);
  const pts = [].concat(req.body['pts'] || []);
  const j = [].concat(req.body['j'] || []);
  const g = [].concat(req.body['g'] || []);
  const n = [].concat(req.body['n'] || []);
  const p = [].concat(req.body['p'] || []);
  const bp = [].concat(req.body['bp'] || []);
  const bc = [].concat(req.body['bc'] || []);
  db.get('classement').forEach((row) => db.remove('classement', row.id));
  noms.forEach((nom, i) => {
    if (!String(nom).trim()) return;
    db.insert('classement', {
      pos: i + 1,
      equipe: String(nom).trim(),
      pts: parseInt(pts[i], 10) || 0,
      j: parseInt(j[i], 10) || 0,
      g: parseInt(g[i], 10) || 0,
      n: parseInt(n[i], 10) || 0,
      p: parseInt(p[i], 10) || 0,
      bp: parseInt(bp[i], 10) || 0,
      bc: parseInt(bc[i], 10) || 0,
    });
  });
  res.redirect('/admin/classement');
});

// ---- Admin : réglages ----
app.get('/admin/reglages', requireAuth, (req, res) => {
  res.render('admin/reglages', { pageTitle: 'Réglages du site', layout: 'admin' });
});

app.post('/admin/reglages', csrfProtect, requireAuth, (req, res) => {
  const b = req.body;
  db.saveSettings({
    nomCourt: b.nomCourt,
    nomComplet: b.nomComplet,
    sousTitre: b.sousTitre,
    slogan: b.slogan,
    sloganDetail: b.sloganDetail,
    presentation: b.presentation,
    email: b.email,
    telephone: b.telephone,
    adresse: b.adresse,
    salle: b.salle,
    salleLien: b.salleLien,
    facebook: b.facebook,
    instagram: b.instagram,
    youtube: b.youtube,
    codeAdherent: String(b.codeAdherent || '').trim(),
    partenaires: String(b.partenaires || '').split('\n').map((s) => s.trim()).filter(Boolean),
  });
  if (b.newPassword) {
    const user = db.get('users')[0];
    if (user) db.update('users', user.id, { passwordHash: bcrypt.hashSync(String(b.newPassword), 10) });
  }
  res.redirect('/admin/reglages?ok=1');
});

// ---- Admin : publication GitHub ----
app.get('/admin/github', requireAuth, (req, res) => {
  res.render('admin/github', {
    pageTitle: 'Publication GitHub',
    layout: 'admin',
    configured: github.isConfigured(),
    config: github.getGithubConfig(),
    lastPush: db.getSettings().githubLastPush || null,
  });
});

app.post('/admin/github/publish', csrfProtect, requireAuth, (req, res) => {
  if (!github.isConfigured()) {
    return res.render('admin/github', {
      pageTitle: 'Publication GitHub',
      layout: 'admin',
      configured: false,
      config: github.getGithubConfig(),
      lastPush: db.getSettings().githubLastPush || null,
      error: 'GitHub n’est pas configuré. Définissez GITHUB_TOKEN et GITHUB_OWNER (voir README, section « Publication GitHub »).',
    });
  }
  github.publish()
    .then((result) => {
      db.saveSettings({ githubLastPush: new Date().toISOString() });
      res.render('admin/github', {
        pageTitle: 'Publication GitHub',
        layout: 'admin',
        configured: true,
        config: github.getGithubConfig(),
        lastPush: db.getSettings().githubLastPush,
        success: `${result.ok}/${result.total} fichier(s) publié(s) sur la branche « ${result.branch} ».`,
      });
    })
    .catch((err) => {
      console.error('[github]', err);
      res.render('admin/github', {
        pageTitle: 'Publication GitHub',
        layout: 'admin',
        configured: true,
        config: github.getGithubConfig(),
        lastPush: db.getSettings().githubLastPush || null,
        error: 'La publication a échoué : ' + (err.message || 'erreur inconnue'),
      });
    });
});

app.post('/admin/github/update-code', csrfProtect, requireAuth, (req, res) => {
  const token = String(req.body.token || '').trim();
  const owner = String(req.body.owner || '').trim();
  const repo = String(req.body.repo || '').trim() || 'hc-dinan-quevert';

  if (token) process.env.GITHUB_TOKEN = token;
  if (owner) process.env.GITHUB_OWNER = owner;
  if (repo) process.env.GITHUB_REPO = repo;

  db.saveSettings({ githubLastPush: null });
  res.redirect('/admin/github?saved=1');
});

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Page introuvable' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HC Dinan-Quévert — site disponible sur http://localhost:${PORT}`);
});
