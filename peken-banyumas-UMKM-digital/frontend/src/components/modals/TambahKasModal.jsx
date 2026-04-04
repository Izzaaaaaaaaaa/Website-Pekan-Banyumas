import { useState } from "react";

const todayISO = () => new Date().toISOString().split("T")[0];

export default function TambahKasModal({ show, onClose, onSave }) {
  const [form, setForm] = useState({
    ket: "", jenis: "masuk", nominal: "", tgl: todayISO(), kategori: "Penjualan",
  });

  if (!show) return null;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.ket || !form.nominal || !form.tgl) {
      alert("Keterangan, nominal, dan tanggal wajib diisi!");
      return;
    }

    // Format tanggal jadi "10 Mar 2026"
    const d = new Date(form.tgl);
    const tglFmt = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

    onSave({ ...form, nominal: Number(form.nominal), tgl: tglFmt });

    setForm({ ket: "", jenis: "masuk", nominal: "", tgl: todayISO(), kategori: "Penjualan" });
  };

  return (
    <div className="bk-overlay">
      <div className="bk-modal">
        {/* HEADER */}
        <div className="bk-modal-hd">
          <div className="bk-modal-hd-left">
            <h3>Tambah Transaksi Kas</h3>
            <span className="bk-stand-tag">Stand A-12</span>
          </div>
          <button className="bk-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* INFO */}
        <div className="bk-modal-info">
          🔄 Transaksi akan disimpan &amp; saldo otomatis diperbarui
        </div>

        {/* FORM */}
        <div className="bk-form-grid">
          {/* KETERANGAN */}
          <div className="bk-fg full">
            <label>Keterangan</label>
            <input
              placeholder="cth: Penjualan sate siang hari"
              value={form.ket}
              onChange={e => set("ket", e.target.value)}
            />
          </div>

          {/* JENIS */}
          <div className="bk-fg">
            <label>Jenis</label>
            <select value={form.jenis} onChange={e => set("jenis", e.target.value)}>
              <option value="masuk">💚 Pemasukan</option>
              <option value="keluar">🔴 Pengeluaran</option>
            </select>
          </div>

          {/* KATEGORI */}
          <div className="bk-fg">
            <label>Kategori</label>
            <select value={form.kategori} onChange={e => set("kategori", e.target.value)}>
              <option>Penjualan</option>
              <option>Restok Bahan</option>
              <option>Biaya Operasional</option>
              <option>Lainnya</option>
            </select>
          </div>

          {/* NOMINAL */}
          <div className="bk-fg">
            <label>Nominal (Rp)</label>
            <input
              type="number"
              placeholder="0"
              value={form.nominal}
              onChange={e => set("nominal", e.target.value)}
            />
          </div>

          {/* TANGGAL */}
          <div className="bk-fg">
            <label>Tanggal</label>
            <input
              type="date"
              value={form.tgl}
              onChange={e => set("tgl", e.target.value)}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="bk-form-act">
          <button className="bk-btn-batal" onClick={onClose}>Batal</button>
          <button className="bk-btn-save" onClick={handleSubmit}>
            💾 Simpan &amp; Update Saldo
          </button>
        </div>
      </div>
    </div>
  );
}