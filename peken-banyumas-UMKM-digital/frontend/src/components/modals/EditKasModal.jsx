import { useState, useEffect, useRef } from "react";
import {
  X, Save, QrCode, ImagePlus, Trash2,
  Receipt, RefreshCw, ArrowLeft, Loader2
} from "lucide-react";
import { uploadBuktiKas } from "../../lib/uploadBukti";
import DatePicker from "../DatePicker";

export default function EditKasModal({ show, item, onClose, onSave, items, standLabel }) {
  const buktiRef = useRef();

  const [qrisImage] = useState(() => localStorage.getItem("qrisImage") || null);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [uploadingBukti, setUploadingBukti] = useState(false);
  const [buktiError, setBuktiError]         = useState("");

  const [form, setForm] = useState({
    jenis     : "masuk",
    pelanggan : "",
    barangId  : "",
    namaBarang: "",
    qty       : 1,
    metode    : "tunai",
    kategori  : "Penjualan",
    ket       : "",
    nominal   : "",
    tgl       : "",
    buktiUrl  : null,
  });

  useEffect(() => {
    if (!item) return;

    const matchedBarang = items?.find(i => i.nama === item.barang);

    setForm({
      jenis     : item.jenis      || "masuk",
      pelanggan : item.pelanggan  || "",
      barangId  : matchedBarang?.id ? String(matchedBarang.id) : "",
      namaBarang: item.barang     || "",
      qty       : item.qty        ?? 1,
      metode    : item.metode     || "tunai",
      kategori  : item.kategori   || (item.jenis === "masuk" ? "Penjualan" : ""),
      ket       : item.ket        || "",
      nominal   : item.nominal    || "",
      tgl       : item.tgl        || "",
      buktiUrl  : item.buktiUrl   || null,
    });
  }, [item, items]);

  if (!show) return null;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleBarang = (id) => {
    const barang = items?.find(i => String(i.id) === String(id));
    setForm(prev => ({
      ...prev,
      barangId  : id,
      namaBarang: barang?.nama || "",
      nominal   : barang ? barang.harga * prev.qty : prev.nominal,
    }));
  };

  const handleQty = (val) => {
    const barang = items?.find(i => String(i.id) === String(form.barangId));
    setForm(prev => ({
      ...prev,
      qty    : val,
      nominal: barang ? barang.harga * val : prev.nominal,
    }));
  };

  // Warning real-time jika qty melebihi stok
  // Untuk edit: stok tersedia = stok di DB + qty lama (yang akan dikembalikan)
  const selectedBarang = items?.find(i => String(i.id) === String(form.barangId));
  const qtyLama = item?.qty ?? 0;
  const stokTersedia = selectedBarang
    ? Number(selectedBarang.stok) + (form.jenis === "masuk" ? Number(qtyLama) : 0)
    : 0;
  const stokWarning = selectedBarang && form.jenis === "masuk" && Number(form.qty) > stokTersedia
    ? `Stok hanya ${selectedBarang.stok} (+ ${qtyLama} dikembalikan = ${stokTersedia}) — qty ${form.qty} melebihi stok!`
    : null;

  const handleBuktiChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBuktiError("");
    setUploadingBukti(true);
    try {
      const url = await uploadBuktiKas(file);
      set("buktiUrl", url);
    } catch (err) {
      setBuktiError(err.message || "Upload gagal, coba lagi.");
    } finally {
      setUploadingBukti(false);
      if (buktiRef.current) buktiRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (form.jenis === "masuk" && (!form.namaBarang || form.qty <= 0)) {
      alert("Produk dan qty wajib diisi!"); return;
    }
    if (stokWarning) {
      alert(stokWarning); return;
    }
    if (form.jenis === "keluar" && (!form.ket || Number(form.nominal) <= 0)) {
      alert("Pengeluaran belum lengkap!"); return;
    }
    if (!form.nominal || Number(form.nominal) <= 0) {
      alert("Nominal wajib diisi!"); return;
    }

    onSave({
      ...item,
      jenis     : form.jenis,
      pelanggan : form.pelanggan,
      barang    : form.namaBarang,
      barang_id : form.barangId || null,
      qty       : Number(form.qty),
      metode    : form.metode,
      kategori  : form.jenis === "masuk" ? "Penjualan" : form.kategori,
      ket       : form.jenis === "masuk"
                    ? `${form.namaBarang} x${form.qty} (${form.metode.toUpperCase()})`
                    : form.ket,
      nominal   : Number(form.nominal),
      tgl       : form.tgl,
      buktiUrl  : form.buktiUrl || null,
    });
  };

  const QrisModal = () => (
    <div className="bk-qris-overlay" onClick={() => setShowQrisModal(false)}>
      <div className="bk-qris-modal" onClick={e => e.stopPropagation()}>
        <div className="bk-qris-hd">
          <div className="bk-qris-hd-text">
            <QrCode size={20} className="bk-qris-icon-svg" />
            <div>
              <h4>Scan QRIS</h4>
              <p>Minta pelanggan scan QR di bawah</p>
            </div>
          </div>
          <button className="bk-qris-close" onClick={() => setShowQrisModal(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="bk-qris-body">
          {qrisImage ? (
            <img src={qrisImage} alt="QRIS" className="bk-qris-img" />
          ) : (
            <div className="bk-qris-empty">
              <QrCode size={40} strokeWidth={1} />
              <p>Gambar QRIS belum diatur</p>
              <small>Upload QRIS di <strong>Pengaturan → Data Diri</strong></small>
            </div>
          )}
        </div>
        <div className="bk-qris-foot">
          <button className="bk-qris-confirm" onClick={() => setShowQrisModal(false)}>
            Pembayaran Diterima
          </button>
        </div>
      </div>
    </div>
  );

  const isMasuk = form.jenis === "masuk";

  return (
    <div className="bk-overlay">
      <div className="bk-modal">

        {showQrisModal && <QrisModal />}

        {/* HEADER */}
        <div className="bk-modal-hd">
          <div className="bk-modal-hd-left">
            <h3>Edit Transaksi Kas</h3>
            {standLabel && <span className="bk-stand-tag">{standLabel}</span>}
          </div>
          <button className="bk-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* INFO */}
        <div className="bk-modal-info">
          <RefreshCw size={13} />
          Perubahan akan memperbarui data transaksi
        </div>

        {/* FORM DINAMIS */}
        <div className="bk-form-grid">

          {/* JENIS — bisa diubah */}
          <div className="bk-fg full">
            <label>Jenis Transaksi</label>
            <div className="bk-jenis-toggle">
              <button
                type="button"
                className={`bk-jenis-toggle-btn masuk ${isMasuk ? "active" : ""}`}
                onClick={() => set("jenis", "masuk")}
              >
                Pemasukan
              </button>
              <button
                type="button"
                className={`bk-jenis-toggle-btn keluar ${!isMasuk ? "active" : ""}`}
                onClick={() => set("jenis", "keluar")}
              >
                Pengeluaran
              </button>
            </div>
          </div>

          {/* PELANGGAN (masuk) / KETERANGAN (keluar) */}
          <div className="bk-fg full">
            <label>{isMasuk ? "Pelanggan" : "Keterangan"}</label>
            <input
              placeholder={isMasuk ? "Nama pelanggan (opsional)" : "cth: Beli bahan baku"}
              value={isMasuk ? form.pelanggan : form.ket}
              onChange={e => isMasuk
                ? set("pelanggan", e.target.value)
                : set("ket", e.target.value)
              }
            />
          </div>

          {/* PRODUK — masuk only */}
          {isMasuk && (
            <div className="bk-fg">
              <label>Produk</label>
              <select value={form.barangId} onChange={e => handleBarang(e.target.value)}>
                <option value="">Pilih Produk</option>
                {items?.map(i => (
                  <option key={i.id} value={String(i.id)}>{i.nama}</option>
                ))}
              </select>
            </div>
          )}

          {/* QTY — masuk only */}
          {isMasuk && (
            <div className="bk-fg">
              <label>Jumlah (Qty)</label>
              <input
                type="number" min={1}
                value={form.qty}
                onChange={e => handleQty(Number(e.target.value))}
                style={stokWarning ? { borderColor: "#ef4444" } : {}}
              />
              {stokWarning && (
                <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                  ⚠️ {stokWarning}
                </div>
              )}
              {selectedBarang && !stokWarning && (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Stok tersedia: {selectedBarang.stok}
                </div>
              )}
            </div>
          )}

          {/* KATEGORI */}
          <div className="bk-fg">
            <label>Kategori</label>
            {isMasuk ? (
              <input value="Penjualan" disabled />
            ) : (
              <select value={form.kategori} onChange={e => set("kategori", e.target.value)}>
                <option value="">Pilih Kategori</option>
                <option>Restok Bahan</option>
                <option>Biaya Operasional</option>
                <option>Transportasi</option>
                <option>Lainnya</option>
              </select>
            )}
          </div>

          {/* METODE — masuk only */}
          {isMasuk && (
            <div className="bk-fg">
              <label>Metode Pembayaran</label>
              <div className="bk-metode-group">
                <select
                  value={form.metode}
                  onChange={e => {
                    set("metode", e.target.value);
                    if (e.target.value === "qris") setShowQrisModal(true);
                  }}
                >
                  <option value="tunai">Tunai</option>
                  <option value="qris">QRIS</option>
                </select>
                {form.metode === "qris" && (
                  <button
                    type="button"
                    className="bk-qris-preview-btn"
                    onClick={() => setShowQrisModal(true)}
                  >
                    <QrCode size={13} /> Lihat QRIS
                  </button>
                )}
              </div>
            </div>
          )}

          {/* NOMINAL */}
          <div className="bk-fg">
            <label>Nominal (Rp)</label>
            <input
              type="number"
              value={form.nominal}
              onChange={e => set("nominal", e.target.value)}
              disabled={isMasuk && !!form.barangId} // auto-hitung jika produk dipilih
            />
          </div>

          {/* TANGGAL */}
          <div className="bk-fg">
            <label>Tanggal</label>
            <DatePicker
              value={form.tgl}
              onChange={(iso) => set("tgl", iso)}
              className="bk-date-input"
            />
          </div>

          {/* BUKTI PEMBAYARAN — masuk only */}
          {isMasuk && (
            <div className="bk-fg full">
              <label>
                Bukti Pembayaran
                <span className="bk-label-opt"> · Opsional</span>
              </label>

              {uploadingBukti ? (
                <div className="bk-bukti-dropzone" style={{ cursor: "default" }}>
                  <Loader2 size={22} className="bk-bukti-dz-icon" style={{ animation: "spin 1s linear infinite" }} />
                  <p>Mengupload foto...</p>
                </div>
              ) : form.buktiUrl ? (
                <div className="bk-bukti-preview">
                  <img src={form.buktiUrl} alt="Bukti" className="bk-bukti-img" />
                  <div className="bk-bukti-actions">
                    <button
                      type="button"
                      className="bk-bukti-btn-change"
                      onClick={() => buktiRef.current?.click()}
                    >
                      <ImagePlus size={13} /> Ganti
                    </button>
                    <button
                      type="button"
                      className="bk-bukti-btn-del"
                      onClick={() => {
                        set("buktiUrl", null);
                        setBuktiError("");
                        if (buktiRef.current) buktiRef.current.value = "";
                      }}
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="bk-bukti-dropzone"
                  onClick={() => buktiRef.current?.click()}
                >
                  <Receipt size={22} className="bk-bukti-dz-icon" />
                  <p>Klik untuk upload foto struk / bukti transfer</p>
                  <small>JPG, PNG · Maks 3MB</small>
                </div>
              )}

              {buktiError && (
                <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>
                  ⚠️ {buktiError}
                </div>
              )}

              <input
                ref={buktiRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleBuktiChange}
              />
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="bk-form-act">
          <button className="bk-btn-batal" onClick={onClose}>
            <ArrowLeft size={14} /> Batal
          </button>
          <button className="bk-btn-save" onClick={handleSubmit} disabled={uploadingBukti}>
            {uploadingBukti
              ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Mengupload...</>
              : <><Save size={14} /> Perbarui Transaksi</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}