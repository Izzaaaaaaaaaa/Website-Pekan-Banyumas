import { useState, useEffect, useRef } from "react";
import {
  RefreshCw, TrendingUp, TrendingDown, ArrowLeft,
  Save, QrCode, X, ImagePlus, Trash2, Receipt
} from "lucide-react";

const todayISO = () => new Date().toISOString().split("T")[0];

export default function TambahKasModal({ show, onClose, onSave, items }) {
  const [step, setStep] = useState("pilih");
  const [showQrisModal, setShowQrisModal] = useState(false);
  const buktiRef = useRef();
  const [customKategori, setCustomKategori] = useState("");

  const [qrisImage, setQrisImage] = useState(
    () => localStorage.getItem("qrisImage") || null
  );

  useEffect(() => {
    setQrisImage(localStorage.getItem("qrisImage") || null);
    const handleQrisUpdate = () => {
      setQrisImage(localStorage.getItem("qrisImage") || null);
    };
    window.addEventListener("qrisUpdated", handleQrisUpdate);
    return () => window.removeEventListener("qrisUpdated", handleQrisUpdate);
  }, []);

  const [form, setForm] = useState({
    jenis: "",
    kategori: "",
    barangId: "",
    namaBarang: "",
    qty: 1,
    pelanggan: "",
    metode: "tunai",
    ket: "",
    nominal: 0,
    tgl: todayISO(),
    buktiUrl: null,
  });

  useEffect(() => {
    if (show) {
      setStep("pilih");
      setShowQrisModal(false);
    }
  }, [show]);

  if (!show) return null;

  const handleBarang = (id) => {
    const barang = items?.find(i => String(i.id) === String(id));
    setForm(prev => ({
      ...prev,
      barangId: id,
      namaBarang: barang?.nama || "",
      nominal: barang ? barang.harga * prev.qty : 0,
      ket: barang ? `${barang.nama} x${prev.qty}` : ""
    }));
  };

  const handleQty = (val) => {
    const barang = items?.find(i => i.id == form.barangId);
    setForm(prev => ({
      ...prev,
      qty: val,
      nominal: barang ? barang.harga * val : 0,
      ket: barang ? `${barang.nama} x${val}` : ""
    }));
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleJenis = (jenis) => {
    setForm(prev => ({
      ...prev,
      jenis,
      kategori: jenis === "masuk" ? "Penjualan" : "",
      barangId: "",
      namaBarang: "",
      qty: 1,
      nominal: 0,
      ket: "",
      buktiUrl: null,
    }));
    setStep("form");
  };

  const handleMetodeChange = (val) => {
    set("metode", val);
    if (val === "qris") setShowQrisModal(true);
  };

  const handleBuktiChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => set("buktiUrl", ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (form.jenis === "masuk") {
      if (!form.namaBarang || form.qty <= 0) {
        alert("Produk dan qty wajib diisi!");
        return;
      }
    }
    if (form.jenis === "keluar") {
      if (!form.ket || form.nominal <= 0) {
        alert("Pengeluaran belum lengkap!");
        return;
      }
    }
    if (!form.tgl) {
      alert("Tanggal wajib diisi!");
      return;
    }

    const d = new Date(form.tgl);
    const tglFmt = d.toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    });

    onSave({
      id: Date.now(),
      jenis: form.jenis,
      kategori: form.jenis === "masuk" ? "Penjualan" : form.kategori,
      pelanggan: form.pelanggan,
      barang: form.namaBarang,
      qty: Number(form.qty),
      metode: form.metode,
      nominal: Number(form.nominal),
      tgl: tglFmt,
      buktiUrl: form.buktiUrl || null,
      ket: form.jenis === "masuk"
        ? `${form.namaBarang} x${form.qty} (${form.metode.toUpperCase()})`
        : form.ket,
    });

    setForm({
      jenis: "", kategori: "", barangId: "", namaBarang: "",
      qty: 1, pelanggan: "", metode: "tunai", ket: "",
      nominal: 0, tgl: todayISO(), buktiUrl: null,
    });
    onClose();
  };

  // ── QRIS INNER MODAL ──────────────────────────────────────────
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
              <small>Upload QRIS di menu <strong>Pengaturan → Data Diri</strong></small>
            </div>
          )}
        </div>

        <div className="bk-qris-foot">
          <div className="bk-qris-nominal">
            {form.nominal > 0 && (
              <span>
                Tagihan:{" "}
                <strong>Rp {new Intl.NumberFormat("id-ID").format(form.nominal)}</strong>
              </span>
            )}
          </div>
          <button className="bk-qris-confirm" onClick={() => setShowQrisModal(false)}>
            Pembayaran Diterima
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bk-overlay">
      <div className="bk-modal">

        {showQrisModal && <QrisModal />}

        {/* HEADER */}
        <div className="bk-modal-hd">
          <div className="bk-modal-hd-left">
            <h3>Tambah Transaksi Kas</h3>
            <span className="bk-stand-tag">Stand A-12</span>
          </div>
          <button className="bk-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* INFO */}
        <div className="bk-modal-info">
          <RefreshCw size={13} />
          Transaksi akan disimpan &amp; saldo otomatis diperbarui
        </div>

        {/* STEP: PILIH */}
        {step === "pilih" ? (
          <div className="bk-jenis-grid">
            <button className="bk-jenis-card masuk" onClick={() => handleJenis("masuk")}>
              <TrendingUp size={28} className="bk-jenis-card-icon-svg masuk" />
              <span className="bk-jenis-card-title">Pemasukan</span>
              <span className="bk-jenis-card-desc">Catat hasil penjualan produk</span>
            </button>
            <button className="bk-jenis-card keluar" onClick={() => handleJenis("keluar")}>
              <TrendingDown size={28} className="bk-jenis-card-icon-svg keluar" />
              <span className="bk-jenis-card-title">Pengeluaran</span>
              <span className="bk-jenis-card-desc">Catat biaya &amp; pengeluaran usaha</span>
            </button>
          </div>
        ) : (

        <div className="bk-form-grid">
          {/* PELANGGAN / KETERANGAN */}
          <div className="bk-fg full">
            <label>{form.jenis === "masuk" ? "Pelanggan" : "Keterangan"}</label>
            <input
              placeholder={form.jenis === "masuk" ? "Nama pelanggan (opsional)" : "cth: Beli bahan baku"}
              value={form.jenis === "masuk" ? form.pelanggan : form.ket}
              onChange={e => form.jenis === "masuk"
                ? set("pelanggan", e.target.value)
                : set("ket", e.target.value)
              }
            />
          </div>

          {/* PRODUK — masuk only */}
          {form.jenis === "masuk" && (
            <div className="bk-fg">
              <label>Produk</label>
              <select value={form.barangId} onChange={e => handleBarang(e.target.value)}>
                <option value="">Pilih Produk</option>
                {items?.map(i => (
                  <option key={i.id} value={i.id}>{i.nama}</option>
                ))}
              </select>
            </div>
          )}

          {/* QTY — masuk only */}
          {form.jenis === "masuk" && (
            <div className="bk-fg">
              <label>Jumlah (Qty)</label>
              <input
                type="number" min={1}
                value={form.qty}
                onChange={e => handleQty(Number(e.target.value))}
              />
            </div>
          )}

          {/* KATEGORI */}
          <div className="bk-fg">
            <label>Kategori</label>
            {form.jenis === "masuk" ? (
            <input value="Penjualan" disabled />
          ) : (
            <>
              <select
                value={form.kategori}
                onChange={(e) => {
                  set("kategori", e.target.value);
                  if (e.target.value !== "Lainnya") {
                    setCustomKategori("");
                  }
                }}
              >
                <option value="">Pilih Kategori</option>
                <option>Restok Bahan</option>
                <option>Biaya Operasional</option>
                <option>Transportasi</option>
                <option>Lainnya</option>
              </select>
            </>
          )}
          </div>
          

          {/* METODE — masuk only */}
          {form.jenis === "masuk" && (
            <div className="bk-fg">
              <label>Metode Pembayaran</label>
              <div className="bk-metode-group">
                <select value={form.metode} onChange={e => handleMetodeChange(e.target.value)}>
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
              {form.metode === "qris" && !qrisImage && (
                <p className="bk-qris-warn">
                  QRIS belum diupload. Tambahkan di{" "}
                  <strong>Pengaturan → Data Diri</strong>.
                </p>
              )}
            </div>
          )}

          {/* NOMINAL */}
          <div className="bk-fg">
            <label>Nominal (Rp)</label>
            <input
              type="number"
              value={form.nominal}
              onChange={e => set("nominal", e.target.value)}
              disabled={form.jenis === "masuk"}
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

          {/* BUKTI PEMBAYARAN — masuk only */}
          {form.jenis === "masuk" && (
            <div className="bk-fg full">
              <label>
                Bukti Pembayaran
                <span className="bk-label-opt"> · Opsional</span>
              </label>

              {form.buktiUrl ? (
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
        )}

        {/* ACTIONS */}
        {step === "form" && (
          <div className="bk-form-act">
            <button className="bk-btn-batal" onClick={() => setStep("pilih")}>
              <ArrowLeft size={14} /> Kembali
            </button>
            <button className="bk-btn-save" onClick={handleSubmit}>
              Simpan &amp; Update Saldo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}