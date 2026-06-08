import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    "VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY wajib diisi di frontend/.env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession:     true,
    autoRefreshToken:   true,
    // Wajib untuk /reset-password — Supabase kirim token lewat URL hash
    detectSessionInUrl: true,
    // Isolasi sesi dari portal lain (Gate, Kolaborator) di subdomain yang sama
    storageKey: "sb-peken-artisan-auth",
  },
});
