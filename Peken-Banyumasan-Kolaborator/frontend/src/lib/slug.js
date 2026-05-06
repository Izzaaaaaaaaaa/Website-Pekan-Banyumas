/**
 * slug.js — Canonical slug derivation utility.
 * Shared logic: kolaborator-output and Peken-Banyumasan-Company-Profile use
 * the same algorithm so public profile URLs always match what the dashboard
 * generates for the "Lihat Profil Publik" link.
 *
 * Rules:
 *  1. Lowercase
 *  2. Remove diacritics (é → e, ñ → n, etc.)
 *  3. Replace whitespace sequences with a single hyphen
 *  4. Strip anything that is not [a-z0-9-]
 *  5. Collapse consecutive hyphens
 *  6. Trim leading/trailing hyphens
 */

/**
 * @param {string} str — raw name or any string
 * @returns {string} URL-safe lowercase kebab slug
 */
export function toSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Derive the public-profile URL for a kolaborator/artisan.
 * @param {string} nama — user's display name
 * @param {string} [base] — base URL of the public site (VITE_COMPANY_URL or '')
 * @returns {string}
 */
export function profileUrl(nama, base = '') {
  const slug = toSlug(nama);
  return `${base}/#/@${slug}`;
}
