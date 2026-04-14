import { useState, useRef } from "react";
import { QrCode, Upload, Trash2, CheckCircle2, ImagePlus } from "lucide-react";

/**
 * QrisUploadSection
 * Tambahkan komponen ini di dalam ProfileForm.jsx,
 * letakkan di bawah field Deskripsi Usaha sebelum tombol Batal/Simpan.
 *
 * Cara pakai di ProfileForm.jsx:
 *   import QrisUploadSection from "./QrisUploadSection";
 *   ...
 *   <QrisUploadSection />
 */
export default function QrisUploadSection() {
  const [qrisImage, setQrisImage] = useState(
    () => localStorage.getItem("qrisImage") || null
  );
  const [preview, setPreview]   = useState(qrisImage);
  const [isDragging, setIsDragging] = useState(false);
  const [saved, setSaved]       = useState(!!qrisImage);
  const [error, setError]       = useState("");
  const fileRef                 = useRef();

  const processFile = (file) => {
    setError("");
    if (!file) return;

    // Validasi tipe
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG, PNG, WebP).");
      return;
    }
    // Validasi ukuran max 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleSave = () => {
    if (!preview) return;
    localStorage.setItem("qrisImage", preview);
    // Trigger event agar komponen lain (TambahKasModal) bisa sync
    window.dispatchEvent(new Event("qrisUpdated"));
    setSaved(true);
    setQrisImage(preview);
  };

  const handleDelete = () => {
    localStorage.removeItem("qrisImage");
    window.dispatchEvent(new Event("qrisUpdated"));
    setPreview(null);
    setQrisImage(null);
    setSaved(false);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="qris-section">
      {/* Header */}
      <div className="qris-section-hd">
        <div className="qris-section-hd-icon">
          <QrCode size={16} />
        </div>
        <div>
          <h4>QRIS Pembayaran</h4>
          <p>Upload kode QRIS untuk ditampilkan saat transaksi · <em>Opsional</em></p>
        </div>
        {saved && qrisImage && (
          <span className="qris-saved-badge">
            <CheckCircle2 size={12} /> Tersimpan
          </span>
        )}
      </div>

      <div className="qris-content">
        {/* Preview jika sudah ada gambar */}
        {preview ? (
          <div className="qris-preview-wrap">
            <img src={preview} alt="QRIS Preview" className="qris-preview-img" />
            <div className="qris-preview-actions">
              {/* Ganti gambar */}
              <button
                type="button"
                className="qris-btn-change"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus size={13} /> Ganti QRIS
              </button>
              {/* Hapus */}
              <button
                type="button"
                className="qris-btn-delete"
                onClick={handleDelete}
              >
                <Trash2 size={13} /> Hapus
              </button>
              {/* Simpan — hanya muncul jika belum disimpan */}
              {!saved && (
                <button
                  type="button"
                  className="qris-btn-save"
                  onClick={handleSave}
                >
                  <CheckCircle2 size={13} /> Simpan QRIS
                </button>
              )}
            </div>
            {saved && (
              <p className="qris-info-saved">
                ✅ QRIS aktif — akan muncul otomatis saat metode QRIS dipilih di Buku Kas
              </p>
            )}
          </div>
        ) : (
          /* Drop zone */
          <div
            className={`qris-dropzone ${isDragging ? "dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload size={28} className="qris-dropzone-icon" />
            <p className="qris-dropzone-title">Klik atau seret gambar QRIS ke sini</p>
            <p className="qris-dropzone-sub">PNG, JPG, WebP · Maks. 2MB</p>
          </div>
        )}

        {/* Error */}
        {error && <p className="qris-error">⚠️ {error}</p>}
      </div>

      {/* Input file hidden */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}