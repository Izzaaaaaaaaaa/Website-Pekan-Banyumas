/**
 * categoryHelper.js — resolve the category field by entity role/owner_type.
 * Artisan → kategori_usaha (UMKM 9), Kolaborator → subsektor (BEKRAF 17).
 *
 * Profiles carry `kategori_usaha[]` / `subsektor[]` as arrays; a `karya`
 * carries a single `subsektor` (or `kategori_usaha`) STRING. `values` is
 * therefore always normalised to an array so callers can safely
 * `.map()` / `.join()` it.
 */
export function getCategory(entity) {
  const isArtisan = entity?.role === 'artisan' || entity?.owner_type === 'artisan';
  const raw = isArtisan
    ? (entity?.kategori_usaha ?? entity?.subsektor)
    : (entity?.subsektor ?? entity?.kategori_usaha);
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return {
    key: isArtisan ? 'kategori_usaha' : 'subsektor',
    label: isArtisan ? 'Kategori Usaha' : 'Subsektor',
    values,
  };
}
