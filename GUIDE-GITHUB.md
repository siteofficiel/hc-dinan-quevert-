# Publier le site sur GitHub & le mettre à jour facilement

Guide pas-à-pas, à destination d'une personne **non technique**.

## A. Une seule fois : mettre le site sur GitHub

### 1. Créer un compte GitHub
- Allez sur **https://github.com** → *Sign up*.
- Choisissez un identifiant (ex. `HC-Dinan-Quevert`).

### 2. Créer le dépôt (le « dossier en ligne »)
- Cliquez sur **+** (en haut à droite) → **New repository**.
- Nom : `hc-dinan-quevert`
- Cochez **Private** (recommandé pour un club).
- Cliquez sur **Create repository**.

### 3. Déposer les fichiers du site
- Téléchargez l'archive `hc-dinan-quevert-site.zip` (fournie).
- Sur la page du dépôt, cliquez sur **Add file → Upload files**, puis glissez l'archive décompressée (ou utilisez `git push` si vous êtes à l'aise).
- Cliquez sur **Commit changes**.

> Vous pouvez aussi simplement « glisser-déposer » tout le contenu de l'archive directement dans le navigateur : GitHub l'accepte.

### 4. Créer la clé (token) qui permet au site d'envoyer ses mises à jour
- En haut à droite : votre photo → **Settings**.
- Tout en bas à gauche : **Developer settings**.
- **Personal access tokens → Fine-grained tokens → Generate new token**.
- Nom du token : `Site HCQ`.
- **Expiration** : choisissez `90 days` (vous pourrez en recréer un).
- **Repository access** : *Only select repositories* → cochez `hc-dinan-quevert`.
- **Permissions → Repository permissions → Contents** : choisissez **Read and write**.
- Cliquez **Generate token** puis **copiez** le code affiché (il commence par `github_pat_`).
- **Gardez ce code précieusement** : il ne s'affiche qu'une seule fois.

### 5. Donner la clé au site
Deux possibilités :

**Option 1 — depuis l'administration (le plus simple)**
1. Connectez-vous à l'admin du site (`/admin/login`).
2. Ouvrez la rubrique **« Publier sur GitHub »** (dans le menu de gauche).
3. Collez le token dans le champ **Token GitHub**, indiquez le **propriétaire** (votre identifiant) et le **dépôt** (`hc-dinan-quevert`).
4. Cliquez **Enregistrer les identifiants**, puis **Publier sur GitHub**.

**Option 2 — variable d'environnement (hébergement)**
```bash
GITHUB_TOKEN=votre_token GITHUB_OWNER=votre_identifiant node server.js
```

## B. Tous les jours : mettre à jour les actualités, photos, résultats…

1. Connectez-vous à l'administration.
2. Ajoutez / modifiez vos **actualités**, **résultats**, **photos**, **compositions** comme d'habitude.
3. Allez dans **« Publier sur GitHub »** → cliquez sur **« Publier sur GitHub »**.

→ Les contenus (`data/db.json` + toutes les photos) sont envoyés sur GitHub : ils sont **sauvegardés et versionnés**. Le workflow de déploiement (`.github/workflows/deploy.yml`) peut ensuite remettre le site à jour automatiquement sur l'hébergeur.

## C. Sécurité
- Le token n'est **jamais enregistré sur le disque** : il n'est utilisé qu'en mémoire pendant la session (ou en variable d'environnement sur le serveur).
- Ne partagez jamais le token par email ou sur les réseaux sociaux.
- S'il est compromis : *Developer settings → Tokens → Revoke*, puis recréez-en un.
