// Contenu de démarrage (données de DÉMONSTRATION uniquement).
// Les vraies infos (effectifs, résultats, photos) seront saisies par le club via l'administration.
// Exécuté automatiquement au premier démarrage si data/db.json n'existe pas.

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');

const IMG_DIR = path.join(__dirname, '..', 'public', 'uploads', 'photos');
const PLACEHOLDERS = path.join(__dirname, '..', 'public', 'img');

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// ---- Placeholders photo (SVG clairement identifiés, légers, aux couleurs du club) ----
function placeholderSVG(label, hue) {
  const h = hue || 212;
  const c1 = `hsl(${h}, 62%, 16%)`;
  const c2 = `hsl(${h}, 70%, 30%)`;
  const c3 = `hsl(${h}, 80%, 46%)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="Emplacement photo">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="s" width="80" height="80" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <rect width="80" height="80" fill="transparent"/>
      <line x1="0" y1="0" x2="0" y2="80" stroke="rgba(255,255,255,0.05)" stroke-width="40"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <rect width="1200" height="800" fill="url(#s)"/>
  <g transform="translate(600 330)">
    <circle r="150" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="26"/>
    <circle r="150" fill="none" stroke="${c3}" stroke-width="12" stroke-dasharray="40 26"/>
    <circle r="52" fill="rgba(255,255,255,0.92)"/>
    <circle r="18" fill="${c2}"/>
  </g>
  <text x="600" y="560" font-family="Barlow, Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text>
  <text x="600" y="612" font-family="Barlow, Arial, sans-serif" font-size="26" font-weight="500" fill="rgba(255,255,255,0.72)" text-anchor="middle">Emplacement réservé — photo à intégrer</text>
  <text x="600" y="668" font-family="Barlow, Arial, sans-serif" font-size="22" font-weight="600" fill="rgba(255,255,255,0.5)" text-anchor="middle">HC DINAN-QUÉVERT</text>
</svg>`;
}

function writePlaceholder(name, label, hue) {
  const file = path.join(IMG_DIR, name);
  if (!fs.existsSync(file)) fs.writeFileSync(file, placeholderSVG(label, hue));
  return name;
}

function seed() {
  const dbFile = db.DB_FILE;
  const exists = fs.existsSync(dbFile);
  const settings = db.getSettings();

  ensureDir(IMG_DIR);
  ensureDir(PLACEHOLDERS);

  // ---- Placeholders photos ----
  const ph = [
    writePlaceholder('n3-01.svg', 'Photo N3 — match', 210),
    writePlaceholder('n3-02.svg', 'Photo N3 — action', 205),
    writePlaceholder('n3-03.svg', 'Photo N3 — vestiaire', 218),
    writePlaceholder('match-01.svg', 'Photo match — salle Némée', 200),
    writePlaceholder('match-02.svg', 'Photo match — supporters', 208),
    writePlaceholder('match-03.svg', 'Photo match — engagement', 214),
    writePlaceholder('jeunes-01.svg', 'Photo école de rink', 190),
    writePlaceholder('jeunes-02.svg', 'Photo jeunes — entraînement', 186),
    writePlaceholder('club-01.svg', 'Photo vie du club — événement', 220),
    writePlaceholder('club-02.svg', 'Photo vie du club — bénévoles', 224),
    writePlaceholder('club-03.svg', 'Photo tournoi', 196),
    writePlaceholder('club-04.svg', 'Photo soirée du club', 230),
  ];

  // ---- Réglages ----
  const seedSettings = {
    nomCourt: 'HC Dinan-Quévert',
    nomComplet: 'Hockey Club Dinan-Quévert Côtes d’Armor',
    sousTitre: 'Rink hockey · Pays de Dinan · depuis 1987',
    slogan: 'L’esprit bleu & blanc',
    sloganDetail: 'Un club familial et compétitif, au cœur des Côtes-d’Armor.',
    presentation:
      'Fondé en 1987 à Quévert, le Hockey Club Dinan-Quévert est l’un des grands noms du rink hockey français : onze titres de champion de France, six Coupes de France et une école de patinage qui forme les générations de demain.',
    email: 'contact@hcdinan-quevert.fr',
    telephone: '02 96 XX XX XX',
    adresse: 'Maison des associations, 1 rue du Val — 22100 Quévert',
    salle: 'Salle Némée (salle omnisports) — Dinan (Côtes-d’Armor)',
    salleLien: 'https://www.google.com/maps/search/Salle+N%C3%A9m%C3%A9e+Dinan',
    codeAdherent: '',
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    youtube: 'https://www.youtube.com/',
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    githubLastPush: null,
    partenaires: [
      'Team Cordon',
      'Ville de Dinan',
      'Ville de Quévert',
      'Département des Côtes-d’Armor',
      'Région Bretagne',
    ],
    palmares: [
      { value: '11', label: 'Titres de champion de France' },
      { value: '6', label: 'Coupes de France' },
      { value: '1987', label: 'Année de création' },
      { value: '1 600', label: 'Places à la salle Némée' },
    ],
    histoire: [
      { annee: '1987', texte: 'Création du HC Quévert à l’initiative de Thierry Lemarié et Yannick Ricaille, avec le soutien de la commune de Quévert. L’école de patinage accueille plus de 80 enfants dès le premier mois.' },
      { annee: '1992', texte: 'Champion de France de Nationale 2 : le club accède à la N1, qu’il ne quittera plus.' },
      { annee: '1997–2000', texte: 'Première grande époque : quatre titres de champion de France en quatre saisons (1997, 1998, 1999, 2000).' },
      { annee: '2008', texte: 'Année historique : doublé championnat – Coupe de France, et 9ᵉ place au Mondial des clubs.' },
      { annee: '2024–2025', texte: 'Le club ajoute deux nouvelles Coupes de France à son palmarès (2024, 2025) et brille sur la scène européenne.' },
      { annee: 'Aujourd’hui', texte: 'Un club formateur fort de ses équipes N1 Élite, N3 et de toute sa filière jeunes, porté par ses bénévoles.' },
    ],
  };
  Object.assign(settings, seedSettings);
  db.save();

  // ---- Compte administrateur (par défaut, À MODIFIER) ----
  if (db.get('users').length === 0) {
    db.insert('users', {
      username: 'admin',
      passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'quevert2026', 10),
      role: 'admin',
      displayName: 'Administrateur',
    });
  }

  // ---- Équipes ----
  if (db.get('equipes').length === 0) {
    const teams = [
      {
        slug: 'n1-elite', nom: 'N1 Élite', categorie: 'Séniors', ordre: 1,
        tagline: 'L’équipe fanion', couleur: '#14509A',
        description: 'L’équipe fanion évolue au plus haut niveau français, la N1 Élite. Onze fois champion de France, le HC Dinan-Quévert fait partie des clubs majeurs du rink hockey hexagonal et porte fièrement les couleurs bretonnes sur les parquets et en coupe d’Europe.',
        entraineur: 'Entraîneur : à compléter', entraineurAdj: '',
        image: '/img/hero.jpg',
        joueurs: [{ numero: '', nom: 'Effectif à compléter', poste: '' }],
        publie: true, miseEnAvant: false,
      },
      {
        slug: 'n3', nom: 'N3', categorie: 'Séniors — réserve', ordre: 2,
        tagline: 'La réserve compétitive du club', couleur: '#0B2A54',
        description: 'La Nationale 3 est la réserve du club : un savant mélange de jeunes formés à Quévert qui frappent à la porte de la N1 et de cadres expérimentés. Une équipe compétitive qui joue les premiers rôles de son championnat et a déjà qualifié le club en Coupe de France.',
        entraineur: 'Entraîneur : à compléter', entraineurAdj: 'Staff : à compléter',
        image: '/img/n3-team.webp',
        joueurs: [
          { numero: '1', nom: 'Maxime Perrot', poste: 'Gardien' },
          { numero: '12', nom: 'Enzo Le Bihan', poste: 'Gardien' },
          { numero: '3', nom: 'Baptiste Rouxel', poste: 'Défenseur' },
          { numero: '4', nom: 'Théo Guichard', poste: 'Défenseur' },
          { numero: '5', nom: 'Lucas Corbel', poste: 'Attaquant' },
          { numero: '7', nom: 'Maël Le Saux', poste: 'Attaquant' },
          { numero: '8', nom: 'Romain Quéméner', poste: 'Attaquant' },
          { numero: '9', nom: 'Nathan Derrien', poste: 'Attaquant' },
          { numero: '10', nom: 'Tom Berthou', poste: 'Défenseur' },
          { numero: '11', nom: 'Yanis Le Corre', poste: 'Attaquant' },
        ],
        stats: { mj: 5, g: 5, n: 0, p: 0, bp: 41, bc: 12, meilleurButeur: '— (démo)', meilleurGardien: '— (démo)' },
        publie: true, miseEnAvant: true,
      },
      {
        slug: 'u19', nom: 'U19', categorie: 'Jeunes', ordre: 3,
        tagline: 'L’antichambre des séniors', couleur: '#14509A',
        description: 'Les U19 constituent le dernier étage de la formation quévertoise avant le monde sénior. Encadrement exigeant et esprit de compétition pour préparer la relève bleu et blanc.',
        entraineur: 'Entraîneur : à compléter', entraineurAdj: '',
        image: '/uploads/photos/jeunes-01.svg',
        joueurs: [{ numero: '', nom: 'Effectif à compléter', poste: '' }],
        publie: true, miseEnAvant: false,
      },
      {
        slug: 'u17', nom: 'U17', categorie: 'Jeunes', ordre: 4,
        tagline: 'La génération montante', couleur: '#14509A',
        description: 'Les U17 poursuivent leur apprentissage du haut niveau, entre technique individuelle, jeu collectif et plaisir sur les parquets.',
        entraineur: 'Entraîneur : à compléter', entraineurAdj: '',
        image: '/uploads/photos/jeunes-02.svg',
        joueurs: [{ numero: '', nom: 'Effectif à compléter', poste: '' }],
        publie: true, miseEnAvant: false,
      },
      {
        slug: 'u15', nom: 'U15', categorie: 'Jeunes', ordre: 5,
        tagline: 'Le creuset de la formation', couleur: '#14509A',
        description: 'Chez les U15, les jeunes Quévertois consolident leurs fondamentaux et découvrent l’intensité de la compétition régionale et nationale.',
        entraineur: 'Entraîneur : à compléter', entraineurAdj: '',
        image: '/uploads/photos/jeunes-01.svg',
        joueurs: [{ numero: '', nom: 'Effectif à compléter', poste: '' }],
        publie: true, miseEnAvant: false,
      },
      {
        slug: 'u13', nom: 'U13', categorie: 'Jeunes', ordre: 6,
        tagline: 'La relève en mouvement', couleur: '#14509A',
        description: 'Les U13 découvrent la compétition dans un cadre ludique et formateur, fidèle à l’esprit familial du club.',
        entraineur: 'Entraîneur : à compléter', entraineurAdj: '',
        image: '/uploads/photos/jeunes-02.svg',
        joueurs: [{ numero: '', nom: 'Effectif à compléter', poste: '' }],
        publie: true, miseEnAvant: false,
      },
      {
        slug: 'u11', nom: 'U11', categorie: 'Jeunes', ordre: 7,
        tagline: 'Les graines de champions', couleur: '#14509A',
        description: 'Jeux, patinage et premières passes : les U11 s’initient au rink hockey dans la joie et la bonne humeur.',
        entraineur: 'Entraîneur : à compléter', entraineurAdj: '',
        image: '/uploads/photos/jeunes-01.svg',
        joueurs: [{ numero: '', nom: 'Effectif à compléter', poste: '' }],
        publie: true, miseEnAvant: false,
      },
      {
        slug: 'u9', nom: 'U9', categorie: 'Jeunes', ordre: 8,
        tagline: 'Premiers coups de crosse', couleur: '#14509A',
        description: 'La première équipe pour les plus petits : on apprend à patiner, à tenir une crosse et surtout à prendre du plaisir.',
        entraineur: 'Entraîneur : à compléter', entraineurAdj: '',
        image: '/uploads/photos/jeunes-02.svg',
        joueurs: [{ numero: '', nom: 'Effectif à compléter', poste: '' }],
        publie: true, miseEnAvant: false,
      },
      {
        slug: 'ecole-de-patinage', nom: 'École de patinage', categorie: 'Loisirs & découverte', ordre: 9,
        tagline: 'Dès 4 ans, chausse les patins !', couleur: '#0E7C86',
        description: 'L’école de patinage accueille les enfants dès 4 ans pour découvrir la glisse et le rink hockey en toute sécurité, encadrés par des bénévoles passionnés.',
        entraineur: 'Animateurs : à compléter', entraineurAdj: '',
        image: '/uploads/photos/jeunes-01.svg',
        joueurs: [{ numero: '', nom: 'Groupe école de patinage', poste: '' }],
        publie: true, miseEnAvant: false,
      },
    ];
    teams.forEach((t) => db.insert('equipes', t));
  }

  // ---- Matchs (résultats + prochains matchs) — DÉMO ----
  if (db.get('matchs').length === 0) {
    const matchs = [
      {
        equipeSlug: 'n3', equipeLabel: 'N3', competition: 'Match amical',
        adversaire: 'RAC Saint-Brieuc', domicile: true, dateISO: '2026-08-30', heure: '18:00',
        lieu: 'Salle Némée, Dinan', scorePour: 4, scoreContre: 3, resume: 'Les Quévertois s’imposent sur le fil dans un derby disputé. Une victoire encourageante pour la préparation.', publie: true, demo: true,
      },
      {
        equipeSlug: 'n1-elite', equipeLabel: 'N1 Élite', competition: 'Tournoi de préparation',
        adversaire: 'ASTA Nantes', domicile: true, dateISO: '2026-08-23', heure: '20:30',
        lieu: 'Salle Némée, Dinan', scorePour: 3, scoreContre: 3, resume: 'Match nul spectaculaire (3-3) face à Nantes pour conclure le tournoi de préparation.', publie: true, demo: true,
      },
      {
        equipeSlug: 'n3', equipeLabel: 'N3', competition: 'Match amical',
        adversaire: 'Ploufragan', domicile: false, dateISO: '2026-08-16', heure: '15:00',
        lieu: 'Ploufragan', scorePour: 5, scoreContre: 2, resume: 'Belle victoire à l’extérieur (5-2) : la N3 confirme sa montée en puissance.', publie: true, demo: true,
      },
      {
        equipeSlug: 'n1-elite', equipeLabel: 'N1 Élite', competition: 'Match de gala',
        adversaire: 'Équipe de France', domicile: true, dateISO: '2026-09-24', heure: '19:30',
        lieu: 'Salle Némée, Dinan', scorePour: null, scoreContre: null, resume: '', publie: true, demo: false,
      },
      {
        equipeSlug: 'n3', equipeLabel: 'N3', competition: 'Match amical',
        adversaire: 'Ergué-Gabéric', domicile: true, dateISO: '2026-09-19', heure: '18:00',
        lieu: 'Salle Némée, Dinan', scorePour: null, scoreContre: null, resume: '', publie: true, demo: true,
      },
      {
        equipeSlug: 'n3', equipeLabel: 'N3', competition: 'Match amical',
        adversaire: 'Quintin', domicile: false, dateISO: '2026-09-27', heure: '15:00',
        lieu: 'Quintin', scorePour: null, scoreContre: null, resume: '', publie: true, demo: true,
      },
    ];
    matchs.forEach((m) => db.insert('matchs', m));
  }

  // ---- Actualités — DÉMO ----
  if (db.get('actualites').length === 0) {
    const news = [
      {
        slug: 'gala-equipe-de-france-salle-nemee', titre: 'Gala de rentrée : le HC Dinan-Quévert défie l’équipe de France',
        categorie: 'Événements', dateISO: '2026-09-03',
        image: '/img/hero.jpg', resume: 'Jeudi 24 septembre à 19 h 30, la salle Némée accueille un match de gala exceptionnel entre le HC Dinan-Quévert et l’équipe de France, en pleine préparation du Mondial.',
        contenu: 'La saison 2026-2027 démarre en beauté à Dinan ! Jeudi 24 septembre à 19 h 30, l’équipe fanion reçoit l’équipe de France à la salle Némée, dans le cadre de la préparation des Bleus au championnat du monde.\n\nCe sera l’occasion de découvrir les recrues de la saison et de retrouver l’ambiance si particulière de la salle Némée.\n\nBilletterie et informations à la salle le soir du match. Venez nombreux, en bleu et blanc !', publie: true, epingle: true, demo: true,
      },
      {
        slug: 'reprise-entrainement-saison-2026-2027', titre: 'Reprise de l’entraînement : la saison 2026-2027 est lancée',
        categorie: 'Vie du club', dateISO: '2026-08-28',
        image: '/uploads/photos/club-02.svg', resume: 'Toutes les catégories ont retrouvé le chemin des parquets. Retrouvez les créneaux d’entraînement et les informations d’inscription.',
        contenu: 'Après la pause estivale, toutes les équipes du HC Dinan-Quévert ont repris l’entraînement à la salle Némée et au gymnase de Quévert.\n\nLes créneaux par catégorie sont affichés à la salle et communiqués par les responsables d’équipe. Les inscriptions restent ouvertes toute l’année pour l’école de patinage.\n\nPrêt ? Chaussez les patins !', publie: true, epingle: false, demo: true,
      },
      {
        slug: 'recrues-2026-2027', titre: 'Trois recrues pour la saison 2026-2027',
        categorie: 'Vie du club', dateISO: '2026-08-20',
        image: '/uploads/photos/club-01.svg', resume: 'Lluc Vila, Adria Ballart et Xavier Cardoso rejoignent les bords de la Rance pour la nouvelle saison.',
        contenu: 'Le HC Dinan-Quévert accueille trois nouveaux joueurs pour la saison 2026-2027 : deux Espagnols, Lluc Vila et Adria Ballart, et le Portugais Xavier Cardoso, joueur expérimenté passé par la sélection portugaise.\n\nBienvenue à eux sous les couleurs bleu et blanc !', publie: true, epingle: false, demo: true,
      },
      {
        slug: 'la-n3-lance-sa-saison', titre: 'La N3 lance sa saison en amical',
        categorie: 'N3', dateISO: '2026-08-16',
        image: '/uploads/photos/n3-01.svg', resume: 'Victoire encourageante à Ploufragan (5-2) pour l’équipe de Nationale 3, qui prépare un championnat ambitieux.',
        contenu: 'L’équipe de Nationale 3 a bien lancé sa préparation avec une victoire 5-2 à Ploufragan. Un premier galop d’essai prometteur pour un groupe mêlant jeunesse et expérience.\n\nProchain rendez-vous : la réception d’Ergué-Gabéric le samedi 19 septembre à la salle Némée.', publie: true, epingle: false, demo: true,
      },
      {
        slug: 'portes-ouvertes-ecole-patinage', titre: 'Journée portes ouvertes de l’école de patinage',
        categorie: 'Jeunes', dateISO: '2026-08-30',
        image: '/uploads/photos/jeunes-01.svg', resume: 'Samedi 12 septembre, venez découvrir le rink hockey dès 4 ans : prêt de matériel et encadrement assurés.',
        contenu: 'L’école de patinage du HC Dinan-Quévert ouvre ses portes le samedi 12 septembre. Les enfants dès 4 ans pourront chausser les patins, essayer la crosse et découvrir le rink hockey dans une ambiance familiale.\n\nMatériel prêté sur place. Inscriptions possibles sur place ou auprès du club.', publie: true, epingle: false, demo: true,
      },
    ];
    news.forEach((n) => db.insert('actualites', n));
  }

  // ---- Albums & photos — DÉMO ----
  if (db.get('albums').length === 0) {
    const albums = [
      { slug: 'n3-saison-2026-2027', nom: 'N3 — saison 2026-2027', description: 'Toute la saison de la Nationale 3 en images.', photos: ['n3-01.svg', 'n3-02.svg', 'n3-03.svg'] },
      { slug: 'matchs-salle-nemee', nom: 'Matchs à la salle Némée', description: 'L’ambiance des soirs de match à Dinan.', photos: ['match-01.svg', 'match-02.svg', 'match-03.svg'] },
      { slug: 'ecole-de-rink-les-jeunes', nom: 'École de rink — les jeunes', description: 'Les premiers coups de crosse de nos jeunes pousses.', photos: ['jeunes-01.svg', 'jeunes-02.svg'] },
      { slug: 'vie-du-club-evenements', nom: 'Vie du club & événements', description: 'Tournois, soirées, animations : la vie du HCQ.', photos: ['club-01.svg', 'club-02.svg', 'club-03.svg', 'club-04.svg'] },
    ];
    albums.forEach((a) => {
      const album = db.insert('albums', {
        slug: a.slug, nom: a.nom, description: a.description, dateISO: '2026-09-01', demo: true,
      });
      a.photos.forEach((p) => {
        db.insert('photos', { albumId: album.id, fichier: '/uploads/photos/' + p, legende: '' });
      });
    });
  }

  // ---- Classement N3 — DÉMO ----
  if (db.get('classement').length === 0) {
    const classement = [
      { pos: 1, equipe: 'HC Dinan-Quévert', pts: 15, j: 5, g: 5, n: 0, p: 0, bp: 41, bc: 12 },
      { pos: 2, equipe: 'Ploufragan', pts: 12, j: 5, g: 4, n: 0, p: 1, bp: 33, bc: 18 },
      { pos: 3, equipe: 'Quintin', pts: 9, j: 5, g: 3, n: 0, p: 2, bp: 27, bc: 22 },
      { pos: 4, equipe: 'RAC Saint-Brieuc', pts: 9, j: 5, g: 3, n: 0, p: 2, bp: 24, bc: 24 },
      { pos: 5, equipe: 'Ergué-Gabéric', pts: 6, j: 5, g: 2, n: 0, p: 3, bp: 21, bc: 28 },
      { pos: 6, equipe: 'Pacé', pts: 3, j: 5, g: 1, n: 0, p: 4, bp: 19, bc: 30 },
      { pos: 7, equipe: 'Plonéour-Lanvern', pts: 1, j: 5, g: 0, n: 1, p: 4, bp: 15, bc: 36 },
      { pos: 8, equipe: 'Saint-Grégoire', pts: 0, j: 5, g: 0, n: 0, p: 5, bp: 10, bc: 40 },
    ];
    classement.forEach((c) => db.insert('classement', c));
  }

  // ---- Compositions — DÉMO ----
  if (db.get('compositions').length === 0) {
    db.insert('compositions', {
      equipeSlug: 'n3', equipeLabel: 'N3', jour: 'Samedi', dateISO: '2026-09-19',
      adversaire: 'Ergué-Gabéric', domicile: true, heure: '18:00', lieu: 'Salle Némée, Dinan',
      joueurs: [
        { nom: 'Maxime Perrot', poste: 'Gardien', present: true },
        { nom: 'Baptiste Rouxel', poste: 'Joueur', present: true },
        { nom: 'Théo Guichard', poste: 'Joueur', present: true },
        { nom: 'Lucas Corbel', poste: 'Joueur', present: true },
        { nom: 'Maël Le Saux', poste: 'Joueur', present: true },
        { nom: 'Romain Quéméner', poste: 'Joueur', present: true },
        { nom: 'Nathan Derrien', poste: 'Joueur', present: true },
      ],
      absents: ['Tom Berthou', 'Yanis Le Corre'],
      note: 'Rendez-vous à 17 h 15 à la salle. Maillot bleu.',
      publie: true, demo: true,
    });
    db.insert('compositions', {
      equipeSlug: 'u15', equipeLabel: 'U15', jour: 'Samedi', dateISO: '2026-09-19',
      adversaire: 'Ploufragan', domicile: false, heure: '14:30', lieu: 'Ploufragan',
      joueurs: [
        { nom: 'Groupe U15', poste: 'Joueur', present: true },
      ],
      absents: [],
      note: 'Départ en covoiturage à 13 h 15 devant la salle.',
      publie: true, demo: true,
    });
  }

  console.log('[seed] Base de données initialisée avec des contenus de démonstration.');
  console.log('[seed] Identifiants admin par défaut : admin / quevert2026 (à modifier).');
}

// Migration légère : ajoute les clés de réglages manquantes sur une base existante.
function migrate() {
  const settings = db.getSettings();
  const defaults = { githubLastPush: null };
  let changed = false;
  Object.keys(defaults).forEach((k) => {
    if (settings[k] === undefined) {
      settings[k] = defaults[k];
      changed = true;
    }
  });
  if (changed) db.save();
}

module.exports = { seed, migrate };
