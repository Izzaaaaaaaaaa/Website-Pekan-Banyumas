import { useState } from "react";
import "../../assets/styles/settings.css";

export default function ProfileForm({ onToast }) {
  const [form, setForm] = useState({
    nama: "Bu Yati Wulandari",
    telepon: "0812-3456-7890",
    email: "yati@email.com",
  });
  const [original] = useState({ ...form });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.nama || !form.telepon || !form.email) {
      onToast("⚠️ Semua field wajib diisi!", "warning");
      return;
    }
    onToast("✅ Data diri berhasil disimpan!");
  };

  const handleCancel = () => setForm({ ...original });

  return (
    <div className="st-card">
      <div className="st-card-hd">
        <h2>Data Diri</h2>
        <p>Informasi pemilik kios</p>
      </div>

      <div className="st-form">
        <div className="st-fg st-full">
          <label>Nama Lengkap</label>
          <input
            value={form.nama}
            onChange={(e) => set("nama", e.target.value)}
            placeholder="Nama lengkap kamu"
          />
        </div>

        <div className="st-row">
          <div className="st-fg">
            <label>No. Telepon</label>
            <input
              value={form.telepon}
              onChange={(e) => set("telepon", e.target.value)}
              placeholder="08xx-xxxx-xxxx"
            />
          </div>
          <div className="st-fg">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@contoh.com"
            />
          </div>
        </div>

        <div className="st-form-act">
          <button className="st-btn-outline" onClick={handleCancel}>Batal</button>
          <button className="st-btn-primary" onClick={handleSave}>Simpan</button>
        </div>
      </div>
    </div>
  );
}