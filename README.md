# HC Dinan-Quévert — Site du club de rink hockey

Site internet **statique** du **Hockey Club Dinan-Quévert** (rink hockey, Quévert / Dinan — Côtes-d'Armor, Bretagne).

Il est conçu pour être publié **directement sur GitHub Pages** : **aucun serveur, aucune base de données, aucune installation** n'est nécessaire. Toutes les fonctionnalités sont conservées — actualités, résultats, photos, équipes, classement, espace adhérents, compositions du week-end — et restent **administrables sans compétence technique** grâce à une administration qui écrit directement dans le dépôt GitHub.

---

## Publier le site sur GitHub (résumé)

Le guide pas-à-pas complet (avec création du compte et de la clé) est dans **[GUIDE-GITHUB.md](GUIDE-GITHUB.md)**. En résumé :

1. Créez un dépôt GitHub (privé recommandé) et déposez-y **tous les fichiers** de ce dossier (glisser-déposer possible).
2. **Settings → Pages → Source : « Deploy from a branch » → branche `main` → dossier `/ (root)` → Save.**
3. Le site est en ligne sur `https://votre-compte.github.io/hc-dinan-quevert/` (l'URL exacte s'affiche dans Settings → Pages).

> Note : le site fonctionne aussi localement en ouvrant simplement `index.html`… sauf le chargement du contenu qui nécessite un petit serveur local (`python3 -m http.server`). Pour un usage réel, passez par GitHub Pages.

## Administration

- URL : `admin.html` (bouton « Espace administrateur » en bas de chaque page).
- Connexion avec la **clé GitHub (token)**, le propriétaire et le nom du dépôt. La clé est **mémorisée sur l'appareil** (reconnexion automatique ; « Déconnexion » l'efface).
- Chaque enregistrement (actualité, résultat, photo, composition…) est **immédiatement publié** dans le dépôt GitHub. Le site se met à jour en **≈ 1 minute** (temps de redéploiement de GitHub Pages).
- **Mode démo (sans GitHub)** : un bouton sur l'écran de connexion ouvre l'administration sans clé, pour l'essayer. Les modifications y sont téléchargées sous forme de fichier `content.json` (à déposer dans le dépôt), pas publiées automatiquement.
- Les erreurs de connexion sont explicites : « clé invalide ou expirée », « dépôt introuvable », « permission manquante », etc. Si le fichier `data/content.json` manque dans le dépôt, il est **créé automatiquement** à la première connexion.

Sections de l'administration : **Tableau de bord · Actualités · Résultats & matchs · Photos · Compositions · Équipes · Classement N3 · Réglages**.

## Contenu du site

| Fichier | Rôle |
| --- | --- |
| `data/content.json` | **Tout le contenu** : réglages du site, actualités, matchs/résultats, équipes, albums/photos, compositions, classement |
| `public/uploads/…` | Photos (articles, équipes, albums) — stockées dans le dépôt |
| `public/img/…` | Logo et visuels de démonstration |
| `*.html` | Pages du site (accueil, club, équipes, N3, actualités, photos, adhérents…) |
| `admin.html` | Espace administrateur |

## Contenu de démonstration

Les textes, effectifs, résultats, compositions et classements fournis sont des **exemples** signalés par un bandeau « Site de démonstration ». Remplacez-les depuis l'administration (ou éditez `data/content.json`).

Les images de démonstration à remplacer par les vraies photos du club :
- `public/img/logo.jpg` (logo officiel haute définition), `hero.jpg`, `n3-team.webp`, `club.jpg` ;
- les placeholders `public/uploads/photos/*.svg` (« Emplacement réservé — photo à intégrer »).

### Dimensions conseillées

- Photo d'actualité : 1200 × 750 (ratio 16:10)
- Photo d'équipe / album : 1200 × 800 (ratio 3:2)
- Logo : fond blanc, carré ou légèrement rectangulaire

## Architecture

```
*.html              — pages statiques (générées par tools/build-pages.js)
data/content.json   — contenu unique du site (modifié par l'administration)
admin.html          — administration (écrit dans GitHub via l'API)
public/css/style.css — design system (bleu & blanc, touche dorée)
public/js/site.js   — rendu des pages côté client (lecture de content.json)
public/js/admin.js  — logique de l'administration (API GitHub)
public/fonts/       — Barlow / Barlow Condensed auto-hébergées
public/img/         — logo et visuels
public/uploads/     — photos du club
tools/build-pages.js — régénère les pages HTML (node tools/build-pages.js)
```

## Points à connaître

- **Espace adhérents** : protégé par un code (défini dans *Réglages* ; par défaut : `HC*QUEVERT*_2026`). Il s'agit d'une protection légère côté navigateur, adaptée à un usage associatif.
- **Sécurité de l'administration** : la clé GitHub **est** le mot de passe. Elle est mémorisée sur l'appareil de l'administrateur (navigateur) pour ne pas avoir à la ressaisir — le bouton « Déconnexion » l'efface. Ne la partagez jamais.
- **Délai de mise à jour** : après un enregistrement, le site se met à jour en environ une minute (redéploiement GitHub Pages).
- **SEO** : titres et meta descriptions par page, balises H1/H2, alt sur les images, mots-clés locaux (Rink Hockey Quévert, Rink Hockey Dinan, HC Dinan Quévert, Côtes-d'Armor, Bretagne).
