import { useState, useRef, useEffect } from "react";
import { QrCode, Upload, Trash2, CheckCircle2, ImagePlus } from "lucide-react";

const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON   = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BASE            = import.meta.env.VITE_API_URL;
const API_QRIS        = `${BASE}/api/artisan/pengaturan/qris`;
const API_PROFIL      = `${BASE}/api/artisan/pengaturan/profil`;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function QrisUploadSection() {
  const [preview,    setPreview]    = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [file,       setFile]       = useState(null);
  const fileRef = useRef();

  // Load QRIS dari backend
  useEffect(() => {
    fetch(API_PROFIL, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data?.qris_url) {
          setPreview(data.qris_url);
          setSaved(true);
          localStorage.setItem("qrisImage", data.qris_url);
        }
      })
      .catch(() => {});
  }, []);

  const processFile = (f) => {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("File harus berupa gambar (JPG, PNG, WebP)."); return; }
    if (f.size > 2 * 1024 * 1024) { setError("Ukuran gambar maksimal 2MB."); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSaved(false);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); };

  const handleSave = async () => {
    if (!file && !preview) return;
    setLoading(true);
    setError("");

    try {
      let qrisUrl = preview;

      // Upload ke Supabase Storage kalau ada file baru
      if (file && SUPABASE_URL && SUPABASE_ANON) {
        const userId   = localStorage.getItem("user_id") || "unknown";
        const ext      = file.name.split(".").pop();
        const fileName = `${userId}/qris.${ext}`;

        const uploadRes = await fetch(
          `${SUPABASE_URL}/storage/v1/object/qris/${fileName}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${SUPABASE_ANON}`,
              "Content-Type": file.type,
              "x-upsert": "true",
            },
            body: file,
          }
        );

        if (!uploadRes.ok) {
          // Fallback: simpan base64 kalau storage gagal
          const reader = new FileReader();
          qrisUrl = await new Promise(resolve => {
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        } else {
          qrisUrl = `${SUPABASE_URL}/storage/v1/object/public/qris/${fileName}`;
        }
      } else if (file) {
        // Tidak ada Supabase config — pakai base64
        const reader = new FileReader();
        qrisUrl = await new Promise(resolve => {
          reader.onload = e => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      }

      // Simpan URL ke backend
      const res  = await fetch(API_QRIS, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ qris_url: qrisUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Gagal menyimpan QRIS"); return; }

      setPreview(qrisUrl);
      localStorage.setItem("qrisImage", qrisUrl);
      window.dispatchEvent(new Event("qrisUpdated"));
      setSaved(true);
      setFile(null);
    } catch (e) {
      setError("Gagal menyimpan QRIS: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch(API_QRIS, { method: "DELETE", headers: authHeaders() });
      localStorage.removeItem("qrisImage");
      window.dispatchEvent(new Event("qrisUpdated"));
      setPreview(null);
      setFile(null);
      setSaved(false);
      setError("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Gagal menghapus QRIS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qris-section">
      <div className="qris-section-hd">
        <div className="qris-section-hd-icon"><QrCode size={16} /></div>
        <div>
          <h4>QRIS Pembayaran</h4>
          <p>Upload kode QRIS untuk ditampilkan saat transaksi · <em>Opsional</em></p>
        </div>
        {saved && preview && <span className="qris-saved-badge"><CheckCircle2 size={12} /> Tersimpan</span>}
      </div>

      <div className="qris-content">
        {preview ? (
          <div className="qris-preview-wrap">
            <img src={preview} alt="QRIS Preview" className="qris-preview-img" />
            <div className="qris-preview-actions">
              <button type="button" className="qris-btn-change" onClick={() => fileRef.current?.click()} disabled={loading}>
                <ImagePlus size={13} /> Ganti QRIS
              </button>
              <button type="button" className="qris-btn-delete" onClick={handleDelete} disabled={loading}>
                <Trash2 size={13} /> Hapus
              </button>
              {!saved && (
                <button type="button" className="qris-btn-save" onClick={handleSave} disabled={loading}>
                  <CheckCircle2 size={13} /> {loading ? "Menyimpan..." : "Simpan QRIS"}
                </button>
              )}
            </div>
            {saved && <p className="qris-info-saved">QRIS aktif — akan muncul saat metode QRIS dipilih di Buku Kas</p>}
          </div>
        ) : (
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
        {error && <p className="qris-error">⚠️ {error}</p>}
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
    </div>
  );
}
