// Stockage JSON simple, sans dépendance externe.
// Les collections : actualites, matchs, equipes, albums, photos, compositions, classement, users
// settings : objet de configuration du site.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let cache = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  if (cache) return cache;
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    cache = {
      settings: {},
      users: [],
      actualites: [],
      matchs: [],
      equipes: [],
      albums: [],
      photos: [],
      compositions: [],
      classement: [],
    };
    save();
    return cache;
  }
  try {
    cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    cache = JSON.parse(fs.readFileSync(DB_FILE + '.bak', 'utf8'));
  }
  for (const col of ['users', 'actualites', 'matchs', 'equipes', 'albums', 'photos', 'compositions', 'classement']) {
    if (!Array.isArray(cache[col])) cache[col] = [];
  }
  if (typeof cache.settings !== 'object' || cache.settings === null) cache.settings = {};
  return cache;
}

function save() {
  ensureDir();
  // sauvegarde de sécurité avant écriture
  if (fs.existsSync(DB_FILE)) {
    try { fs.copyFileSync(DB_FILE, DB_FILE + '.bak'); } catch (e) {}
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2));
}

function get(collection) {
  const db = load();
  return db[collection];
}

function find(collection, id) {
  return get(collection).find((x) => String(x.id) === String(id));
}

function insert(collection, obj) {
  const col = get(collection);
  obj.id = generateId(col);
  obj.createdAt = new Date().toISOString();
  obj.updatedAt = obj.createdAt;
  col.push(obj);
  save();
  return obj;
}

function update(collection, id, patch) {
  const obj = find(collection, id);
  if (!obj) return null;
  Object.assign(obj, patch);
  obj.updatedAt = new Date().toISOString();
  save();
  return obj;
}

function remove(collection, id) {
  const db = load();
  db[collection] = get(collection).filter((x) => String(x.id) !== String(id));
  save();
}

function generateId(col) {
  let id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  while (col.some((x) => x.id === id)) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  return id;
}

function getSettings() {
  return load().settings;
}

function saveSettings(patch) {
  Object.assign(load().settings, patch);
  save();
  return load().settings;
}

module.exports = { load, save, get, find, insert, update, remove, getSettings, saveSettings, DB_FILE, DATA_DIR };
