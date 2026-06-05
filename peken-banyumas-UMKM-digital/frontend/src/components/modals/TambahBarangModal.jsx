export default function TambahBarangModal({
  show,
  onClose,
  form,
  handleChange,
  handleSubmit,
  namaUsaha,
}) {
  if (!show) return null;

  return (
    <div className="ms-overlay">
      <div className="ms-modal">
        {/* HEADER */}
        <div className="ms-modal-hd">
          <div className="ms-modal-hd-left">
            <h3>Tambah Barang</h3>
          </div>
          <button className="ms-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* INFO */}
        <div className="ms-modal-info">
          Barang ini akan ditambahkan ke stok <strong>{namaUsaha || "Kios Saya"}</strong>
        </div>

        {/* FORM */}
        <div className="ms-form-grid">
          <div className="ms-fg full">
            <label>Nama Barang</label>
            <input
              name="nama"
              placeholder="cth: Sate Blengong Spesial"
              value={form.nama}
              onChange={handleChange}
            />
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
              placeholder="Rp 0"
              value={form.harga}
              onChange={handleChange}
            />
          </div>

          <div className="ms-fg">
            <label>Stok Awal</label>
            <input
              name="stok"
              type="number"
              placeholder="0"
              value={form.stok}
              onChange={handleChange}
            />
          </div>

          <div className="ms-fg">
            <label>Satuan</label>
            <input
              name="satuan"
              placeholder="porsi / pcs / cup"
              value={form.satuan}
              onChange={handleChange}
            />
          </div>

          <div className="ms-fg">
            <label>Stok Minimum (Alert)</label>
            <input
              name="stok_min"
              type="number"
              placeholder="5"
              value={form.stok_min ?? 5}
              onChange={handleChange}
            />
          </div>

          <div className="ms-fg full">
            <label>Keterangan</label>
            <textarea
              name="deskripsi"
              placeholder="Deskripsi singkat produk..."
              value={form.deskripsi}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="ms-form-act">
          <button className="ms-btn-batal" onClick={onClose}>Batal</button>
          <button className="ms-btn-save" onClick={handleSubmit}>Simpan Barang</button>
        </div>
      </div>
    </div>
  );
}