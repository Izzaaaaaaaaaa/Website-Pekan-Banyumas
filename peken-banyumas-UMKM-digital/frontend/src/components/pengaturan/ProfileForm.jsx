import { useState, useEffect } from "react";
import QrisUploadSection from "../../components/pengaturan/QrisUploadSection";
import "../../assets/styles/settings.css";

const API = "http://127.0.0.1:8000/api/artisan/pengaturan/profil";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export default function ProfileForm({ onToast }) {
  const [form, setForm] = useState({
    nama_usaha: "",
    pemilik: "",
    no_hp: "",
    email: "",
    kota: "",
    kategori_usaha: [],
    deskripsi: "",
  });
  const [loading, setLoading] = useState(false);

  // ── Load profil dari API ──
  useEffect(() => {
    fetch(API, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data && data.nama_usaha) {
          setForm({
            nama_usaha:    data.nama_usaha || "",
            pemilik:       data.pemilik || "",
            no_hp:         data.no_hp || "",
            email:         data.email || "",
            kota:          data.kota || "",
            kategori_usaha: data.kategori_usaha || [],
            deskripsi:     data.deskripsi || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.nama_usaha || !form.pemilik) {
      onToast("⚠️ Nama kios dan pemilik wajib diisi!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          nama_usaha:    form.nama_usaha,
          pemilik:       form.pemilik,
          no_hp:         form.no_hp || "",
          email:         form.email || "",
          kota:          form.kota || "",
          kategori_usaha: form.kategori_usaha,
          deskripsi:     form.deskripsi || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { onToast(`❌ ${data.detail || "Gagal menyimpan"}`); return; }

      // update localStorage nama
      localStorage.setItem("nama", form.pemilik);
      onToast("✅ Data diri berhasil disimpan!");
    } catch {
      onToast("❌ Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-card">
      <div className="st-card-hd">
        <h2>Data Diri</h2>
        <p>Informasi pemilik kios</p>
      </div>

      <div className="st-form">
        <div className="st-fg st-full">
          <label>Nama Kios / Usaha</label>
          <input value={form.nama_usaha} onChange={e => set("nama_usaha", e.target.value)} placeholder="Nama usaha kamu" />
        </div>

        <div className="st-fg st-full">
          <label>Nama Pemilik</label>
          <input value={form.pemilik} onChange={e => set("pemilik", e.target.value)} placeholder="Nama lengkap kamu" />
        </div>

        <div className="st-row">
          <div className="st-fg">
            <label>No. Telepon</label>
            <input value={form.no_hp} onChange={e => set("no_hp", e.target.value)} placeholder="08xx-xxxx-xxxx" />
          </div>
          <div className="st-fg">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@contoh.com" />
          </div>
        </div>

        <div className="st-fg st-full">
          <label>Kota</label>
          <input value={form.kota} onChange={e => set("kota", e.target.value)} placeholder="Kota kamu" />
        </div>

        <div className="st-fg st-full">
          <label>Deskripsi Usaha</label>
          <textarea value={form.deskripsi} onChange={e => set("deskripsi", e.target.value)} placeholder="Ceritakan usaha kamu..." rows={3} />
        </div>

        <QrisUploadSection />

        <div className="st-form-act">
          <button className="st-btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
