/**
 * SecurityForm — Ganti password artisan via Supabase Auth.
 *
 * Flow:
 *  1. Re-auth dengan signInWithPassword(email, password_lama) → verifikasi lama
 *  2. Jika berhasil, updateUser({ password: password_baru })
 *
 * Tidak lagi kirim ke BE /api/artisan/pengaturan/password — bcrypt sudah dihapus.
 */

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";
import "../../assets/styles/settings.css";

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="st-fg st-full">
      <label>{label}</label>
      <div className="st-pass-wrap">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder || "••••••••"}
        />
        <button
          type="button"
          className="st-eye-btn"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function SecurityForm({ onToast }) {
  const [form, setForm]       = useState({ lama: "", baru: "", konfirmasi: "" });
  const [loading, setLoading] = useState(false);
  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.lama || !form.baru || !form.konfirmasi) {
      onToast("⚠️ Semua field wajib diisi!");
      return;
    }
    if (form.baru !== form.konfirmasi) {
      onToast("❌ Konfirmasi password tidak cocok!");
      return;
    }
    if (form.baru.length < 6) {
      onToast("⚠️ Password baru minimal 6 karakter!");
      return;
    }

    setLoading(true);
    try {
      // 1. Verifikasi password lama dengan re-auth
      const email = localStorage.getItem("email") || "";
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: form.lama,
      });
      if (authError) {
        onToast("❌ Password lama tidak sesuai!");
        setLoading(false);
        return;
      }

      // 2. Ganti password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.baru,
      });
      if (updateError) {
        onToast(`❌ ${updateError.message || "Gagal mengubah password"}`);
        setLoading(false);
        return;
      }

      setForm({ lama: "", baru: "", konfirmasi: "" });
      onToast("🔒 Password berhasil diubah!");
    } catch {
      onToast("❌ Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-card">
      <div className="st-card-hd">
        <h2>Keamanan</h2>
        <p>Ganti password akun</p>
      </div>

      <div className="st-form">
        <PasswordField
          label="Password Lama"
          value={form.lama}
          onChange={(e) => set("lama", e.target.value)}
        />
        <PasswordField
          label="Password Baru"
          value={form.baru}
          onChange={(e) => set("baru", e.target.value)}
        />
        <PasswordField
          label="Konfirmasi Password"
          value={form.konfirmasi}
          onChange={(e) => set("konfirmasi", e.target.value)}
        />

        <div className="st-form-act">
          <button
            className="st-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Ubah Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
