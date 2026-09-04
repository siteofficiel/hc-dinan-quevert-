# Publier le site sur GitHub Pages & le mettre à jour facilement

Guide pas-à-pas, à destination d'une personne **non technique**.

Le site est **100 % statique** : il n'y a **rien à installer**. Tout se passe sur GitHub.

---

## A. Une seule fois : mettre le site en ligne

### 1. Créer un compte GitHub
- Allez sur **https://github.com** → *Sign up*.
- Choisissez un identifiant (ex. `HC-Dinan-Quevert`).

### 2. Créer le dépôt (le « dossier en ligne »)
- Cliquez sur **+** (en haut à droite) → **New repository**.
- Nom : `hc-dinan-quevert`
- Cochez **Private** (recommandé pour un club).
- Cliquez sur **Create repository**.

### 3. Déposer les fichiers du site
- Téléchargez l'archive `hc-dinan-quevert-site.zip` (fournie), décompressez-la.
- Sur la page du dépôt : **Add file → Upload files**, puis **glissez-déposez tous les fichiers** du dossier (les `.html`, les dossiers `data/`, `public/`, `tools/`…).
- Cliquez sur **Commit changes**.

### 4. Activer GitHub Pages (mettre le site en ligne)
- Dans le dépôt : **Settings → Pages**.
- **Source** : choisissez **« Deploy from a branch »**.
- **Branch** : `main` · dossier **`/ (root)`** · **Save**.
- Au bout de 1 à 2 minutes, GitHub affiche l'adresse du site :
  `https://votre-compte.github.io/hc-dinan-quevert/`

### 5. Créer la clé (token) qui sert de connexion à l'administration
- En haut à droite : votre photo → **Settings**.
- Tout en bas à gauche : **Developer settings**.
- **Personal access tokens → Fine-grained tokens → Generate new token**.
- Nom du token : `Admin site HCQ`.
- **Expiration** : `90 days` (vous pourrez en recréer un).
- **Repository access** : *Only select repositories* → cochez `hc-dinan-quevert`.
- **Permissions → Repository permissions → Contents** : choisissez **Read and write**.
- Cliquez **Generate token** puis **copiez** le code affiché (il commence par `github_pat_`).
- **Gardez ce code précieusement** : il ne s'affiche qu'une seule fois.

---

## B. Tous les jours : mettre à jour les actualités, photos, résultats…

1. Ouvrez le site puis cliquez sur **« Espace administrateur »** (en bas de n'importe quelle page), ou allez directement sur `…/admin.html`.
2. Connectez-vous avec la **clé GitHub**, votre **identifiant** (propriétaire) et le nom du **dépôt**.
3. Ajoutez / modifiez vos **actualités**, **résultats**, **photos**, **compositions**, **équipes**, **classement**.
4. Cliquez sur **Enregistrer** : c'est publié !

→ Le site se met à jour **en environ 1 minute** (le temps que GitHub Pages redéploie).

> Le bouton « Publier » est automatique : chaque « Enregistrer » envoie directement le contenu dans le dépôt GitHub, qui est ainsi sauvegardé et versionné.

---

## C. Sécurité

- La clé est **mémorisée sur votre appareil** (dans le navigateur) pour ne pas avoir à la ressaisir à chaque connexion. Le bouton « Déconnexion » permet de l'effacer.
- Ne la partagez jamais par email ni sur les réseaux sociaux.
- Si elle est compromise : *Developer settings → Tokens → Revoke*, puis recréez-en une.
- Le site étant hébergé sur GitHub Pages, pensez à **changer régulièrement la clé** (tous les 90 jours).

---

## D. En cas de souci

- L'administration affiche désormais un **message précis** en cas de problème : « clé invalide ou expirée », « dépôt introuvable », « permission manquante », etc.
- **« Clé invalide ou expirée »** : la clé a été révoquée ou expirée — recréez-en une (section A.5).
- **« Dépôt introuvable »** : vérifiez l'orthographe exacte du propriétaire et du nom du dépôt.
- **« Permission manquante »** : le droit **Contents : Read and write** n'est pas coché sur la clé.
- **Pour essayer sans rien configurer** : cliquez sur **« Mode démo (sans GitHub) »** sur l'écran de connexion.
- Si le fichier `data/content.json` manque dans le dépôt, il est **créé automatiquement** à la première connexion.
- **Le site ne s'affiche pas** : vérifiez Settings → Pages (source = branche `main`, dossier root).
- **Une image ne s'affiche pas** : vérifiez qu'elle a bien été envoyée depuis l'administration (section Photos).
