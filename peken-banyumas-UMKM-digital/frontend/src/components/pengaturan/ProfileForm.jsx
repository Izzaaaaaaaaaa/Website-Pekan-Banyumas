import { useState } from "react";
import QrisUploadSection from "../../components/pengaturan/QrisUploadSection";
import "../../assets/styles/settings.css";

export default function ProfileForm({ onToast }) {
  const [form, setForm] = useState({
    kios: "Sate Blengong Bu Yati",
    nama: "Bu Yati Wulandari",
    telepon: "0812-3456-7890",
    email: "yati@email.com",

    kategori: "Kuliner",
    deskripsi: ""
  });
  const [original] = useState({ ...form });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.nama || !form.telepon || !form.email || !form.kios) {
      onToast("⚠️ Semua field wajib diisi!", "warning");
      return;
    }
    onToast("✅ Data diri berhasil disimpan!");
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleCancel = () => setForm({ ...original });

  return (
    <div className="st-card">
      <div className="st-card-hd">
        <h2>Data Diri</h2>
        <p>Informasi pemilik kios</p>
      </div>

      <div className="st-form">
        {/* 🔥 NAMA KIOS */}
        <div className="st-fg st-full">
          <label>Nama Kios</label>
          <input
            value={form.kios}
            onChange={(e) => set("kios", e.target.value)}
            placeholder="Nama usaha kamu"
          />
        </div>
        
        {/* NAMA */}
        <div className="st-fg st-full">
          <label>Nama Lengkap</label>
          <input
            value={form.nama}
            onChange={(e) => set("nama", e.target.value)}
            placeholder="Nama lengkap kamu"
          />
        </div>

        {/* TELEPON & EMAIL */}
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

        {/* 🔥 KATEGORI */}
        <div className="st-fg st-full">
          <label>Kategori Usaha</label>
          <select
            value={form.kategori}
            onChange={(e) => set("kategori", e.target.value)}
          >
            <option value="Kuliner">Kuliner</option>
            <option value="Fashion">Fashion</option>
            <option value="Kriya">Kriya</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        {/* 🔥 DESKRIPSI */}
        <div className="st-fg st-full">
          <label>Deskripsi Usaha</label>
          <textarea
            value={form.deskripsi}
            onChange={(e) => set("deskripsi", e.target.value)}
            placeholder="Ceritakan usaha kamu..."
            rows={3}
          />
        </div>

        <QrisUploadSection />

        {/* BUTTON */}
        <div className="st-form-act">
          <button className="st-btn-outline" onClick={handleCancel}>Batal</button>
          <button className="st-btn-primary" onClick={handleSave}>Simpan</button>
        </div>
      </div>
    </div>
  );
}