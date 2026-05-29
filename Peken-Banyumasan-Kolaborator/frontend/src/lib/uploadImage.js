/**
 * src/lib/uploadImage.js
 * ──────────────────────
 * Upload an image to Supabase Storage (bucket `peken-uploads`) and return its
 * PUBLIC URL — far lighter than embedding base64 in the DB/JSON.
 *
 * The authenticated `supabase` client carries the logged-in session, which the
 * bucket's RLS requires for INSERT (public READ is open). If Storage is somehow
 * unavailable (env missing, network), it falls back to a base64 data URL so a
 * save is never blocked — the field still works exactly as before.
 */
import { supabase } from './supabase';

const BUCKET = 'peken-uploads';
const MAX_BYTES = 5 * 1024 * 1024;

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * @param {File} file
 * @param {string} [folder] logical subfolder (e.g. 'profil', 'karya', 'story')
 * @returns {Promise<string>} public URL (or base64 data URL on fallback)
 */
export async function uploadImage(file, folder = 'misc') {
  if (!file) return '';
  if (!file.type?.startsWith('image/')) throw new Error('File harus berupa gambar (JPG/PNG/WebP).');
  if (file.size > MAX_BYTES) throw new Error('Ukuran gambar maksimal 5 MB.');

  if (supabase) {
    try {
      const ext = ((file.name?.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')) || 'png';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    } catch (e) {
      // Non-fatal: degrade to base64 so the save still succeeds.
      console.warn('[uploadImage] Storage upload failed, using base64 fallback:', e?.message || e);
    }
  }
  return toDataUrl(file);
}
