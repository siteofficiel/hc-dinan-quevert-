// Utilitaires partagés : slugs, formats de dates, helpers EJS

function slugify(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// "2026-10-10" -> Date locale (midi pour éviter les décalages de fuseau)
function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function formatDateLong(iso) {
  const d = parseDate(iso);
  if (!d) return '';
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(iso) {
  const d = parseDate(iso);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDateDay(iso) {
  const d = parseDate(iso);
  if (!d) return '';
  return `${d.getDate()} ${MOIS[d.getMonth()].slice(0, 4)}.`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isUpcoming(iso) {
  return iso && iso >= todayISO();
}

function isFuture(match) {
  return match.scorePour === null && match.scorePour !== 0 && isUpcoming(match.dateISO);
}

function excerpt(text, max = 160) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).trimEnd() + '…';
}

function ensureUniqueSlug(base, existingSlugs) {
  let slug = slugify(base) || 'element';
  let i = 2;
  const seen = new Set(existingSlugs);
  while (seen.has(slug)) {
    slug = `${slugify(base) || 'element'}-${i}`;
    i++;
  }
  return slug;
}

module.exports = {
  slugify,
  parseDate,
  formatDateLong,
  formatDateShort,
  formatDateDay,
  todayISO,
  isUpcoming,
  isFuture,
  excerpt,
  ensureUniqueSlug,
  JOURS,
  MOIS,
};
