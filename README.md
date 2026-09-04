# HC Dinan-Quévert — Site du club de rink hockey

Site complet, moderne et responsive pour le **Hockey Club Dinan-Quévert** (rink hockey, Quévert / Dinan — Côtes-d'Armor, Bretagne).

C'est une **proposition professionnelle** destinée à être présentée au club : identité « bleu & blanc », ton sportif et familial, expérience mobile soignée, et une administration volontairement très simple.

---

## Lancer le site

```bash
npm install      # première fois uniquement
node server.js   # ou : npm start
```

Le site est alors accessible sur `http://localhost:3000`.

Au premier démarrage, une base de données de démonstration est créée automatiquement dans `data/db.json`.

## Espace administrateur

- URL : `/admin/login`
- Identifiants par défaut : **admin** / **quevert2026**

> ⚠️ **Changez le mot de passe dès la première connexion** (onglet *Réglages → Sécurité*).

---

## Pages publiques

| Page | Contenu |
| --- | --- |
| Accueil | Hero photo, prochains matchs, dernier résultat, actualités, aperçu photos, focus N3, accès adhérents, partenaires |
| Le club | Histoire, valeurs, présentation du rink hockey, catégories, infrastructures, infos pratiques |
| Équipes | Toutes les catégories (N1 Élite, N3, U19 → U9, école de patinage) |
| N3 | Page dédiée : stats, matchs, résultats, classement, effectif, galerie |
| Actualités | Rubrique avec catégories (Vie du club, Événements, Jeunes, N3) + onglet Résultats |
| Photos | Albums et galerie plein écran (navigation précédent/suivant) |
| Espace adhérents | Compositions du week-end, infos pratiques, contacts |

## Espace adhérents

- Accessible depuis le bouton **« Espace adhérents »** du menu.
- Rubrique **« Compositions du week-end »** : un parent ou un joueur voit en quelques secondes *où je joue, contre qui, à quelle heure et avec qui* (Samedi/Dimanche, équipe, adversaire, date, heure, lieu, composition, absents, note).
- **Code d'accès optionnel** : laissez le champ vide dans *Réglages* pour un accès libre, ou définissez un code partagé (ex. l'année) que les adhérents saisiront.

## Administration (volontairement simple)

Le tableau de bord regroupe 8 sections :

1. **Actualités** — créer / modifier / supprimer, choisir la catégorie, ajouter une photo, publier ou non.
2. **Résultats & matchs** — ajouter un match : *sans score* → « prochains matchs » ; *avec score* → « résultats ».
3. **Photos** — créer un album, ajouter des photos, renommer, supprimer.
4. **Compositions** — choisir l'équipe, le jour, la date, l'adversaire, l'heure, le lieu, les joueurs présents et les absents, puis **Publier** / **Dépublier**.
5. **Équipes** — modifier présentation, encadrement et effectifs (dont les stats de la N3).
6. **Classement N3** — modifier le tableau du championnat.
7. **Réglages** — identité du club, coordonnées, réseaux sociaux, partenaires, code adhérents, mot de passe.

---

## Remplacer les contenus de démonstration

Tous les contenus fournis (textes, effectifs, résultats, compositions, classement) sont des **exemples** signalés par un bandeau « Site de démonstration ». Ne les présentez pas comme réels.

Pour intégrer les vrais contenus du club :

1. Connectez-vous à l'administration et remplacez les éléments un par un (ou effacez `data/db.json` puis repartez de zéro via `lib/seed.js`).
2. **Photos** : fournissez les vraies photos du club. Les images de démonstration sont :
   - des **placeholders SVG** clairement identifiés (« Emplacement réservé — photo à intégrer ») ;
   - quelques **photos de presse** (`public/img/hero.jpg`, `n3-team.webp`, `club.jpg`, `logo.jpg`) utilisées pendant la conception, à remplacer par les visuels officiels (le logo haute définition, les photos de l'équipe, etc.).
3. **Logo** : remplacez `public/img/logo.jpg` par le logo officiel haute définition (fond blanc recommandé).

### Dimensions conseillées pour les images

- Photo d'actualité : 1200 × 750 (ratio 16:10)
- Photo d'équipe / album : 1200 × 800 (ratio 3:2)
- Logo : fond blanc, format carré ou légèrement rectangulaire

Les images sont servies avec cache et les vignettes sont chargées en `lazy`. Le site reste rapide sans bibliothèque lourde.

---

## Publication GitHub (mise à jour facile des actualités, photos, résultats…)

Pour que le club puisse **mettre à jour le contenu du site facilement** sans toucher au code :

1. **Créez un dépôt GitHub** (privé recommandé) pour ce projet.
2. **Créez un token GitHub** : *GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens*. Cochez le dépôt concerné et le droit **Contents : Read and write**.
3. Lancez le site avec les variables d'environnement (ou saisissez les identifiants directement dans l'admin) :

```bash
GITHUB_TOKEN=votre_token GITHUB_OWNER=votre_compte node server.js
```

4. Dans l'administration, ouvrez la rubrique **« Publier sur GitHub »** (nouveau gros bouton du tableau de bord) et cliquez sur **« Publier sur GitHub »**.

Ce bouton envoie `data/db.json` (actualités, résultats, compositions, équipes, classement…) et toutes les photos téléversées vers le dépôt — les contenus sont ainsi sauvegardés et versionnés, et un déploiement automatique peut les remettre en ligne.

### Déploiement automatique (optionnel)

Un workflow est fourni dans `.github/workflows/deploy.yml` (GitHub Actions). Sur un hébergeur Node, il installe les dépendances et démarre le serveur après chaque mise à jour du dépôt. Adaptez la commande de lancement à votre hébergeur (voir commentaires dans le fichier).

> 🔑 **Sécurité** : le token GitHub n'est jamais enregistré sur le disque — il n'est utilisé qu'en mémoire pendant la session. Sur un hébergement persistant, préférez le définir en variable d'environnement.

---

## Architecture

```
server.js            — application Express (routes publiques + admin)
lib/db.js            — stockage JSON (data/db.json), sauvegarde automatique
lib/seed.js          — contenus de démonstration
lib/github.js        — publication du contenu vers GitHub (bouton admin)
lib/util.js          — helpers (slugs, dates…)
middleware/auth.js   — session, CSRF, garde admin
views/               — pages EJS (publique + admin)
public/css/style.css — design system complet (bleu & blanc, touche dorée)
public/js/           — interactions (menu, lightbox, formulaires admin)
public/fonts/        — Barlow / Barlow Condensed auto-hébergées
public/uploads/      — photos téléversées par le club
public/img/          — logo et visuels de démonstration
```

### Évolutions prévues (faciles à ajouter)

Calendrier complet, classement d'autres championnats, notifications, inscriptions en ligne, boutique, nouveaux partenaires, nouvelles équipes : l'architecture (collections JSON + pages + administration) est pensée pour évoluer.

---

## Sécurité & production

- Authentification par session + mot de passe **haché (bcrypt)**.
- Protection **CSRF** sur tous les formulaires d'administration.
- Seuls les comptes administrateurs accèdent à `/admin`.
- Pour une mise en production :
  - définir `ADMIN_PASSWORD` (variable d'environnement) au premier lancement ;
  - servir en HTTPS ;
  - remplacer la session en mémoire par un store persistant (ex. `connect-sqlite3` / Redis) ;
  - adapter `site.domain` et les URL de partage dans les vues si le domaine change.

---

## SEO

Titres et meta descriptions par page, `canonical`, Open Graph, données structurées `SportsOrganization` (schema.org), URLs propres (`/n3`, `/club`, `/equipes/...`), balises H1/H2, alt sur les images, et mots-clés locaux (Rink Hockey Quévert, Rink Hockey Dinan, HC Dinan Quévert, Côtes-d'Armor, Bretagne).
