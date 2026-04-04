import { useState, useEffect, useRef } from "react";
import "../../assets/styles/promo.css";

export default function EditPromoModal({ show, item, onClose, onSave, onToast }) {
  const [form, setForm] = useState({
    nama: "", tipe: "Persentase", nilai: "", mulai: "", akhir: "", status: "aktif", poster: null,
  });
  const [posterPreview, setPosterPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (item) {
      setForm({
        nama: item.nama || "",
        tipe: item.tipe || "Persentase",
        nilai: item.nilai || "",
        mulai: item.mulai || "",
        akhir: item.akhir || "",
        status: item.status || "aktif",
        poster: item.poster || null,
      });
      setPosterPreview(item.poster || null);
    }
  }, [item]);

  if (!show) return null;

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPosterPreview(ev.target.result);
      set("poster", ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!form.nama || !form.nilai || !form.mulai || !form.akhir) {
      onToast("⚠️ Semua field wajib diisi!", "warning");
      return;
    }
    onSave({ ...item, ...form });
  };

  return (
    <div className="pd-overlay">
      <div className="pd-modal">
        {/* HEADER */}
        <div className="pd-modal-hd">
          <div>
            <h3 className="pd-modal-title">Edit Promo</h3>
          </div>
          <div className="pd-modal-hd-right">
            <span className="pd-kios-tag">Stand A-12</span>
            <button className="pd-modal-x" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* BODY */}
        <div className="pd-form-grid">
          <div className="pd-fg pd-full">
            <label>Nama Promo</label>
            <input value={form.nama} onChange={(e) => set("nama", e.target.value)} />
          </div>

          <div className="pd-fg">
            <label>Tipe Diskon</label>
            <select value={form.tipe} onChange={(e) => set("tipe", e.target.value)}>
              <option value="Persentase">Persentase (%)</option>
              <option value="Nominal">Nominal (Rp)</option>
              <option value="BeliXGratisY">Beli X Gratis Y</option>
            </select>
          </div>

          <div className="pd-fg">
            <label>Nilai</label>
            <input value={form.nilai} onChange={(e) => set("nilai", e.target.value)} />
          </div>

          <div className="pd-fg">
            <label>Berlaku Mulai</label>
            <input type="date" value={form.mulai} onChange={(e) => set("mulai", e.target.value)} />
          </div>
          <div className="pd-fg">
            <label>Berlaku Hingga</label>
            <input type="date" value={form.akhir} onChange={(e) => set("akhir", e.target.value)} />
          </div>

          <div className="pd-fg">
            <label>Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>

          {/* Upload Poster */}
          <div className="pd-fg pd-full">
            <label>Poster Promo <span className="pd-label-opt">(opsional)</span></label>
            {posterPreview ? (
              <div className="pd-poster-preview">
                <img src={posterPreview} alt="preview" />
                <button className="pd-poster-remove" onClick={() => { setPosterPreview(null); set("poster", null); }}>
                  ✕ Hapus Gambar
                </button>
              </div>
            ) : (
              <div className="pd-upload-zone" onClick={() => fileRef.current.click()}>
                <span className="pd-upload-icon">🖼️</span>
                <span>Klik untuk upload poster promo</span>
                <span className="pd-upload-hint">JPG, PNG – maks 2MB</span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </div>
        </div>

        <div className="pd-form-act">
          <button className="pd-btn-outline" onClick={onClose}>Batal</button>
          <button className="pd-btn-primary" onClick={handleSubmit}>Simpan</button>
        </div>
      </div>
    </div>
  );
}