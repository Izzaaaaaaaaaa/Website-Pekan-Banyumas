import { useState, useEffect } from "react";

export default function EditBarangModal({ show, onClose, item, onSave }) {
  const [form, setForm] = useState({
    nama: "", kategori: "", harga: "", stok: "", satuan: "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        nama     : item.nama,
        kategori : item.kategori || "",
        harga    : item.harga,
        stok     : item.stok,
        satuan   : item.satuan || "",
      });
    }
  }, [item]);

  if (!show) return null;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    onSave({
      ...item,
      ...form,
      kategori: form.kategori || "Lainnya",
      stok: Number(form.stok),
      harga: Number(form.harga),
    });
    onClose();
  };

  return (
    <div className="ms-overlay">
      <div className="ms-modal">
        {/* HEADER */}
        <div className="ms-modal-hd">
          <div className="ms-modal-hd-left">
            <h3>Edit Barang</h3>
            <span className="ms-stand-tag">Stand A-12</span>
          </div>
          <button className="ms-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* FORM */}
        <div className="ms-form-grid">
          <div className="ms-fg full">
            <label>Nama Barang</label>
            <input name="nama" value={form.nama} onChange={handleChange} />
          </div>

          <div className="ms-fg">
            <label>Kategori</label>

            <input
              name="kategori"
              list="kategori-list"
              placeholder="Pilih / ketik kategori"
              value={form.kategori}
              onChange={handleChange}
            />

            <datalist id="kategori-list">
              <option value="Makanan" />
              <option value="Minuman" />
              <option value="Camilan" />
              <option value="Kriya" />
              <option value="Fashion" />
              <option value="Aksesoris" />
              <option value="Lainnya" />
            </datalist>
          </div>

          <div className="ms-fg">
            <label>Harga Jual</label>
            <input
              name="harga"
              type="number"
              value={form.harga}
              onChange={handleChange}
            />
          </div>

          <div className="ms-fg">
            <label>Update Stok</label>
            <input
              name="stok"
              type="number"
              value={form.stok}
              onChange={handleChange}
            />
          </div>

          <div className="ms-fg">
            <label>Satuan</label>
            <input name="satuan" value={form.satuan} onChange={handleChange} />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="ms-form-act">
          <button className="ms-btn-batal" onClick={onClose}>Batal</button>
          <button className="ms-btn-save" onClick={handleSubmit}>Perbarui Barang</button>
        </div>
      </div>
    </div>
  );
}