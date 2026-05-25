/**
 * src/lib/supabase.js
 * ───────────────────
 * Supabase JS client untuk Gate Frontend.
 * Digunakan HANYA untuk Realtime subscription (tabel kunjungan).
 * Semua operasi data tetap lewat Gate Backend API (axios/api.js).
 *
 * ENV vars yang diperlukan (tambahkan ke .env / Vercel environment):
 *   VITE_SUPABASE_URL      = https://kyaxslefkmgfknesiawy.supabase.co
 *   VITE_SUPABASE_ANON_KEY = <anon key dari Supabase Dashboard → Project Settings → API>
 *
 * PENTING: Gunakan ANON KEY (bukan service_role key) di frontend.
 * Anon key aman untuk disertakan di client-side code.
 *
 * SETUP REALTIME di Supabase (wajib sekali, jalankan di SQL Editor):
 *   ALTER PUBLICATION supabase_realtime ADD TABLE kunjungan;
 * Atau aktifkan di Dashboard → Database → Replication → kunjungan.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// ── SINGLETON PATTERN: CREATE CLIENT ONLY ONCE ──────────────────────────────

/**
 * supabaseRealtime — SINGLETON client Supabase untuk subscription saja.
 * ✅ Dibuat HANYA SATU KALI saat module load
 * ✅ Tidak di-recreate per component mount
 * ✅ null jika env vars belum dikonfigurasi (fallback ke polling)
 *
 * Log: "CREATE SUPABASE REALTIME CLIENT" → hanya muncul 1x saat app start
 */
let _supabaseRealtimeInstance = null;

function getSupabaseRealtimeClient() {
  if (_supabaseRealtimeInstance === null && supabaseUrl && supabaseAnon) {
    console.log("CREATE SUPABASE REALTIME CLIENT (singleton)");
    _supabaseRealtimeInstance = createClient(supabaseUrl, supabaseAnon, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });
  }
  return _supabaseRealtimeInstance || null;
}

export const supabaseRealtime = getSupabaseRealtimeClient();

/**
 * isRealtimeReady — helper untuk cek apakah Realtime bisa dipakai.
 */
export const isRealtimeReady = () => Boolean(supabaseRealtime);

// ── AUTH CLIENT SINGLETON ──────────────────────────────────────────────────

/**
 * supabase — SINGLETON auth client untuk Gate admin/petugas session management.
 * ✅ Dibuat HANYA SATU KALI saat module load
 * ✅ storageKey 'sb-peken-admin-auth' mengisolasi sesi Gate dari portal lain
 * ✅ Tidak ada SSO lintas subdomain
 * ✅ null jika env vars belum diisi → auth.js fallback ke localStorage-only
 *
 * Log: "CREATE SUPABASE AUTH CLIENT" → hanya muncul 1x saat app start
 */
let _supabaseAuthInstance = null;

function getSupabaseAuthClient() {
  if (_supabaseAuthInstance === null && supabaseUrl && supabaseAnon) {
    console.log("CREATE SUPABASE AUTH CLIENT (singleton)");
    _supabaseAuthInstance = createClient(supabaseUrl, supabaseAnon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "sb-peken-admin-auth",
      },
    });
  }
  return _supabaseAuthInstance || null;
}

export const supabase = getSupabaseAuthClient();
