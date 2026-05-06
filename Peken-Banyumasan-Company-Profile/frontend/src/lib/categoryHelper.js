/**
 * categoryHelper.js — resolve category field by entity role/owner_type.
 * Artisan → kategori_usaha (UMKM 9), Kolaborator → subsektor (BEKRAF 17).
 */
export function getCategory(entity) {
  if (entity?.role === 'artisan' || entity?.owner_type === 'artisan') {
    return { key: 'kategori_usaha', label: 'Kategori Usaha', values: entity.kategori_usaha || [] };
  }
  return { key: 'subsektor', label: 'Subsektor', values: entity.subsektor || [] };
}
