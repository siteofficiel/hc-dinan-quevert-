// Publication sur GitHub — envoie les contenus du site (db.json + photos) vers un dépôt.
// Utilisé par le bouton « Publier sur GitHub » de l'espace administrateur.
// Aucune dépendance externe : requêtes en https natif.

const https = require('https');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const util = require('./util');

// ---- Lecture des identifiants GitHub depuis les variables d'environnement ----
function getGithubConfig() {
  return {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || 'hc-dinan-quevert',
  };
}

function isConfigured() {
  const c = getGithubConfig();
  return !!(c.token && c.owner);
}

// ---- Petit client HTTPS (JSON) ----
function request(method, host, urlPath, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method,
        hostname: host,
        path: urlPath,
        headers: Object.assign({ 'User-Agent': 'hc-dinan-quevert', Accept: 'application/vnd.github+json' }, headers),
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(data); } catch (e) { json = null; }
          resolve({ status: res.statusCode, json, raw: data });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function api(method, urlPath, body) {
  const c = getGithubConfig();
  const headers = {
    Authorization: 'token ' + c.token,
    'Content-Type': 'application/json',
  };
  return request(method, 'api.github.com', urlPath, headers, body ? JSON.stringify(body) : null);
}

// ---- Obtient le SHA d'un fichier du dépôt (ou null s'il n'existe pas) ----
async function getFileSha(filePath, branch) {
  const c = getGithubConfig();
  const res = await api('GET', `/repos/${c.owner}/${c.repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`);
  if (res.status === 200 && res.json && res.json.sha) return res.json.sha;
  return null;
}

// ---- Récupère la branche par défaut du dépôt ----
async function getDefaultBranch() {
  const c = getGithubConfig();
  const res = await api('GET', `/repos/${c.owner}/${c.repo}`);
  if (res.status === 200 && res.json && res.json.default_branch) return res.json.default_branch;
  return 'main';
}

// ---- Liste des fichiers à publier ----
function listFiles() {
  const files = [];
  const add = (repoPath, localPath) => {
    if (fs.existsSync(localPath)) files.push({ repoPath, localPath });
  };

  // Contenu éditorial (données)
  add('data/db.json', db.DB_FILE);

  // Photos téléversées (actualités, équipes, albums)
  const uploadRoot = path.join(__dirname, '..', 'public', 'uploads');
  ['articles', 'equipes', 'photos'].forEach((dir) => {
    const d = path.join(uploadRoot, dir);
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach((f) => {
      const local = path.join(d, f);
      if (fs.statSync(local).isFile()) {
        files.push({ repoPath: 'public/uploads/' + dir + '/' + f, localPath: local });
      }
    });
  });

  return files;
}

// ---- Exécute la publication ----
async function publish() {
  if (!isConfigured()) {
    throw new Error('GitHub non configuré. Définissez GITHUB_TOKEN et GITHUB_OWNER (voir README).');
  }
  const branch = await getDefaultBranch();
  const files = listFiles();
  const results = [];

  for (const f of files) {
    const content = fs.readFileSync(f.localPath);
    const b64 = content.toString('base64');
    const sha = await getFileSha(f.repoPath, branch);
    const res = await api('PUT', `/repos/${getGithubConfig().owner}/${getGithubConfig().repo}/contents/${encodeURIComponent(f.repoPath)}`, {
      message: 'Mise à jour du contenu du site depuis l’administration',
      content: b64,
      branch,
      ...(sha ? { sha } : {}),
    });
    results.push({ file: f.repoPath, ok: res.status === 200 || res.status === 201, status: res.status });
  }

  const okCount = results.filter((r) => r.ok).length;
  return { branch, ok: okCount, total: results.length, results };
}

module.exports = { publish, isConfigured, getGithubConfig, listFiles };
