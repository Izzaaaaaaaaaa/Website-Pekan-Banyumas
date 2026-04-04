import { useState } from "react";
import "../../assets/styles/settings.css";
import { Eye, EyeOff } from "lucide-react";

// Simulasi password lama user (di real app ini dari backend/auth)
const CURRENT_PASSWORD = "password123";

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
  const [form, setForm] = useState({ lama: "", baru: "", konfirmasi: "" });
  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.lama || !form.baru || !form.konfirmasi) {
      onToast("⚠️ Semua field wajib diisi!", "warning");
      return;
    }
    if (form.lama !== CURRENT_PASSWORD) {
      onToast("❌ Password lama tidak sesuai!", "danger");
      return;
    }
    if (form.baru !== form.konfirmasi) {
      onToast("❌ Konfirmasi password tidak cocok!", "danger");
      return;
    }
    if (form.baru.length < 6) {
      onToast("⚠️ Password baru minimal 6 karakter!", "warning");
      return;
    }
    setForm({ lama: "", baru: "", konfirmasi: "" });
    onToast("🔒 Password berhasil diubah!");
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
          <button className="st-btn-primary" onClick={handleSubmit}>
            Ubah Password
          </button>
        </div>
      </div>
    </div>
  );
}