/**
 * src/lib/supabase.js — Kolaborator Portal
 * ──────────────────────────────────────────
 * Supabase JS client untuk manajemen sesi kolaborator.
 *
 * ENV vars yang diperlukan (tambahkan ke .env / Vercel environment):
 *   VITE_SUPABASE_URL      = https://<project-ref>.supabase.co
 *   VITE_SUPABASE_ANON_KEY = <anon key dari Supabase Dashboard → Project Settings → API>
 *
 * PENTING: Gunakan ANON KEY (bukan service_role key) di frontend.
 * Anon key aman untuk disertakan di client-side code.
 *
 * storageKey 'sb-peken-kolaborator-auth' mengisolasi sesi Kolaborator dari
 * portal Gate (admin) dan UMKM (artisan) — tidak ada SSO lintas subdomain.
 *
 * Jika env vars kosong, supabase di-export sebagai null. auth.js akan
 * fallback ke localStorage-only mode (DUMMY_MODE tetap berjalan normal).
 */

import { createClient } from '@supabase/supabase-js';

const url     = import.meta.env.VITE_SUPABASE_URL     || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !anonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. ' +
    'Auth via Supabase non-aktif — pastikan sudah diisi di .env atau Vercel env vars saat deploy.'
  );
}

/**
 * supabase — auth client untuk Kolaborator session management.
 * null jika env vars belum diisi — auth.js fallback ke localStorage-only mode.
 */
export const supabase = (url && anonKey)
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-peken-kolaborator-auth',
      },
    })
  : null;
