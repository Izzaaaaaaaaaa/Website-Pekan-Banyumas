import { useState, useEffect } from "react";

export default function EditKasModal({ show, item, onClose, onSave }) {
  const [form, setForm] = useState({
    ket: "", jenis: "masuk", nominal: "", tgl: "", kategori: "Penjualan",
  });

  useEffect(() => {
    if (item) {
      setForm({
        ket      : item.ket      || "",
        jenis    : item.jenis    || "masuk",
        nominal  : item.nominal  || "",
        tgl      : item.tgl      || "",
        kategori : item.kategori || "Penjualan",
      });
    }
  }, [item]);

  if (!show) return null;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    onSave({ ...item, ...form, nominal: Number(form.nominal) });
  };

  return (
    <div className="bk-overlay">
      <div className="bk-modal">
        {/* HEADER */}
        <div className="bk-modal-hd">
          <div className="bk-modal-hd-left">
            <h3>Edit Transaksi Kas</h3>
            <span className="bk-stand-tag">Stand A-12</span>
          </div>
          <button className="bk-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* FORM */}
        <div className="bk-form-grid">
          <div className="bk-fg full">
            <label>Keterangan</label>
            <input
              value={form.ket}
              onChange={e => set("ket", e.target.value)}
            />
          </div>

          <div className="bk-fg">
            <label>Jenis</label>
            <select value={form.jenis} onChange={e => set("jenis", e.target.value)}>
              <option value="masuk">💚 Pemasukan</option>
              <option value="keluar">🔴 Pengeluaran</option>
            </select>
          </div>

          <div className="bk-fg">
            <label>Kategori</label>
            <select value={form.kategori} onChange={e => set("kategori", e.target.value)}>
              <option>Penjualan</option>
              <option>Restok Bahan</option>
              <option>Biaya Operasional</option>
              <option>Lainnya</option>
            </select>
          </div>

          <div className="bk-fg">
            <label>Nominal (Rp)</label>
            <input
              type="number"
              value={form.nominal}
              onChange={e => set("nominal", e.target.value)}
            />
          </div>

          <div className="bk-fg">
            <label>Tanggal</label>
            <input
              value={form.tgl}
              onChange={e => set("tgl", e.target.value)}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="bk-form-act">
          <button className="bk-btn-batal" onClick={onClose}>Batal</button>
          <button className="bk-btn-save" onClick={handleSubmit}>
            ✏️ Perbarui Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}