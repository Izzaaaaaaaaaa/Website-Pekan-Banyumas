import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, ClipboardList, MapPin, CheckCircle2,
  Check, AlertCircle, ChevronLeft, ChevronRight,
  Send, Lightbulb, Home, Loader2, Eye, EyeOff,
  ImagePlus, X, User, Mail, Lock, Filter, Search,
} from "lucide-react";
import "../../assets/styles/register.css";

/* ─── CONSTANTS ─── */

const STEPS = [
  { id: 1, label: "Data Artisan", Icon: Store },
  { id: 2, label: "S & K",        Icon: ClipboardList },
  { id: 3, label: "Konfirmasi",   Icon: CheckCircle2 },
];

const KATEGORI_OPTIONS = [
  { value: "fnb",     label: "F&B" },
  { value: "kriya",   label: "Kriya" },
  { value: "fashion", label: "Fashion" },
  { value: "lainnya", label: "Lainnya" },
];

const KATEGORI_LABEL = { fnb: "F&B", kriya: "Kriya", fashion: "Fashion", lainnya: "Lainnya" };

const VENUE_OPTIONS = ["Semua", "Zona Utama", "Zona Tengah", "Zona Pojok"];

const KIOS_DATA = [
  { id: "U-01", venue: "Zona Utama",  kategori: "fnb",     harga: 600000, status: "available", ukuran: "3×3m" },
  { id: "U-02", venue: "Zona Utama",  kategori: "fnb",     harga: 600000, status: "full",      ukuran: "3×3m" },
  { id: "U-03", venue: "Zona Utama",  kategori: "fashion", harga: 600000, status: "available", ukuran: "3×3m" },
  { id: "U-04", venue: "Zona Utama",  kategori: "kriya",   harga: 600000, status: "available", ukuran: "3×3m" },
  { id: "T-01", venue: "Zona Tengah", kategori: "fnb",     harga: 500000, status: "available", ukuran: "3×3m" },
  { id: "T-02", venue: "Zona Tengah", kategori: "kriya",   harga: 500000, status: "full",      ukuran: "3×3m" },
  { id: "T-03", venue: "Zona Tengah", kategori: "fashion", harga: 500000, status: "available", ukuran: "4×3m" },
  { id: "T-04", venue: "Zona Tengah", kategori: "lainnya", harga: 500000, status: "available", ukuran: "4×3m" },
  { id: "P-01", venue: "Zona Pojok",  kategori: "kriya",   harga: 400000, status: "available", ukuran: "2×3m" },
  { id: "P-02", venue: "Zona Pojok",  kategori: "fnb",     harga: 400000, status: "available", ukuran: "2×3m" },
  { id: "P-03", venue: "Zona Pojok",  kategori: "fashion", harga: 400000, status: "full",      ukuran: "2×3m" },
  { id: "P-04", venue: "Zona Pojok",  kategori: "lainnya", harga: 400000, status: "available", ukuran: "2×3m" },
];

/* ─── COMPONENT ─── */

export default function Register() {
  const navigate   = useNavigate();
  const photoRef   = useRef(null);

  const [step, setStep]               = useState(1);
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* filter state */
  const [filterVenue,    setFilterVenue]    = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterStatus,   setFilterStatus]   = useState("Semua");
  const [filterHarga,    setFilterHarga]    = useState("Semua");

  const [formData, setFormData] = useState({
    namaArtisan: "", email: "", username: "",
    password: "", konfirmPassword: "",
    kategori: "", kategoriCustom: "",
    deskripsi: "",
    photos: [],   // { file, preview }[]
    setuju: false,
    kios: null,
  });

  /* helpers */
  const set = (key, val) => {
    setFormData((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === "checkbox" ? checked : value);
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    const next  = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setFormData((p) => ({ ...p, photos: [...p.photos, ...next].slice(0, 5) }));
    if (errors.photos) setErrors((p) => ({ ...p, photos: "" }));
    e.target.value = "";
  };

  const handlePhotoRemove = (idx) => {
    setFormData((p) => {
      const arr = [...p.photos];
      URL.revokeObjectURL(arr[idx].preview);
      arr.splice(idx, 1);
      return { ...p, photos: arr };
    });
  };

  /* validation */
  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!formData.namaArtisan.trim()) e.namaArtisan = "Nama artisan wajib diisi";
      if (!formData.email.trim())       e.email       = "Email wajib diisi";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Format email tidak valid";
      if (!formData.username.trim())    e.username    = "Username wajib diisi";
      if (!formData.password)           e.password    = "Password wajib diisi";
      else if (formData.password.length < 6) e.password = "Password minimal 6 karakter";
      if (formData.password !== formData.konfirmPassword) e.konfirmPassword = "Password tidak cocok";
      if (!formData.kategori)           e.kategori    = "Pilih kategori usaha";
      if (formData.kategori === "lainnya" && !formData.kategoriCustom.trim())
        e.kategoriCustom = "Isi kategori kamu";
    }
    if (step === 2 && !formData.setuju) {
      e.setuju = "Anda harus menyetujui syarat & ketentuan";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validate()) setStep((p) => p + 1); };
  const prevStep = () => setStep((p) => p - 1);

  const handleSubmit = () => {
    setSubmitting(true);

    localStorage.setItem("status", "pending");

    setTimeout(() => {
      navigate("/status");
    }, 800);
  };

  /* kios filter */
  const filteredKios = KIOS_DATA.filter((k) => {
    if (filterVenue    !== "Semua" && k.venue    !== filterVenue)    return false;
    if (filterKategori !== "Semua" && k.kategori !== filterKategori) return false;
    if (filterStatus === "Tersedia" && k.status !== "available")     return false;
    if (filterStatus === "Terisi"   && k.status !== "full")          return false;
    if (filterHarga === "< 500rb"   && k.harga  >= 500000)           return false;
    if (filterHarga === "500rb+"    && k.harga  <  500000)           return false;
    return true;
  });

  const displayKategori = formData.kategori === "lainnya"
    ? (formData.kategoriCustom || "Lainnya")
    : KATEGORI_LABEL[formData.kategori] || "—";

  return (
    <div className="reg-root">
      <div className="reg-wrapper">

        {/* Brand */}
        <div className="reg-brand">
          <div className="reg-brand-mark">
            <Store size={20} color="white" strokeWidth={2} />
          </div>
          <div>
            <div className="reg-brand-name">Peken Banyumas 2026</div>
            <div className="reg-brand-sub">Pendaftaran Artisan · 22–24 Maret 2026</div>
          </div>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map(({ id, label, Icon }) => {
            const isDone   = step > id;
            const isActive = step === id;
            return (
              <div key={id} className={`step-item${isDone ? " done" : ""}${isActive ? " active" : ""}`}>
                <div className="step-circle">
                  {isDone ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={2} />}
                </div>
                <div className="step-label">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
        </div>

        {/* Card */}
        <div className="reg-card" key={step}>

          {/* ══════════════════════════════ */}
          {/* STEP 1 — Data Artisan          */}
          {/* ══════════════════════════════ */}
          {step === 1 && (
            <>
              <div className="step-chip"><Store size={12} /> Langkah 1 dari 3</div>
              <h2 className="step-title">Data Artisan</h2>
              <p className="step-desc">Isi informasi usahamu untuk mendaftar sebagai artisan Peken Banyumas</p>

              {/* Nama Artisan */}
              <div className="field">
                <label className="field-label">Nama Artisan / Usaha <span>*</span></label>
                <div className="input-wrap">
                  <span className="input-icon"><Store size={16} /></span>
                  <input type="text" name="namaArtisan" value={formData.namaArtisan}
                    onChange={handleChange} placeholder="Contoh: Batik Nusantara Bu Siti"
                    className={`reg-input with-icon${errors.namaArtisan ? " err" : ""}`} />
                </div>
                {errors.namaArtisan && <div className="err-msg"><AlertCircle size={12} />{errors.namaArtisan}</div>}
              </div>

              {/* Email */}
              <div className="field">
                <label className="field-label">Email <span>*</span></label>
                <div className="input-wrap">
                  <span className="input-icon"><Mail size={16} /></span>
                  <input type="email" name="email" value={formData.email}
                    onChange={handleChange} placeholder="nama@email.com"
                    className={`reg-input with-icon${errors.email ? " err" : ""}`} />
                </div>
                {errors.email && <div className="err-msg"><AlertCircle size={12} />{errors.email}</div>}
              </div>

              {/* Username */}
              <div className="field">
                <label className="field-label">Username Artisan <span>*</span></label>
                <div className="input-wrap">
                  <span className="input-icon at-sign">@</span>
                  <input type="text" name="username" value={formData.username}
                    onChange={handleChange} placeholder="batiknusantara"
                    className={`reg-input with-icon${errors.username ? " err" : ""}`} />
                </div>
                {errors.username && <div className="err-msg"><AlertCircle size={12} />{errors.username}</div>}
              </div>

              {/* Password pair */}
              <div className="field-row-2">
                <div className="field">
                  <label className="field-label">Password <span>*</span></label>
                  <div className="input-wrap">
                    <span className="input-icon"><Lock size={16} /></span>
                    <input type={showPass ? "text" : "password"} name="password"
                      value={formData.password} onChange={handleChange}
                      placeholder="Min. 6 karakter"
                      className={`reg-input with-icon with-toggle${errors.password ? " err" : ""}`} />
                    <button type="button" className="toggle-btn" onClick={() => setShowPass((p) => !p)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <div className="err-msg"><AlertCircle size={12} />{errors.password}</div>}
                </div>
                <div className="field">
                  <label className="field-label">Konfirmasi Password <span>*</span></label>
                  <div className="input-wrap">
                    <span className="input-icon"><Lock size={16} /></span>
                    <input type={showConfirm ? "text" : "password"} name="konfirmPassword"
                      value={formData.konfirmPassword} onChange={handleChange}
                      placeholder="Ulangi password"
                      className={`reg-input with-icon with-toggle${errors.konfirmPassword ? " err" : ""}`} />
                    <button type="button" className="toggle-btn" onClick={() => setShowConfirm((p) => !p)}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.konfirmPassword && <div className="err-msg"><AlertCircle size={12} />{errors.konfirmPassword}</div>}
                </div>
              </div>

              {/* Kategori chips */}
              <div className="field">
                <label className="field-label">Kategori Usaha <span>*</span></label>
                <div className="kategori-grid">
                  {KATEGORI_OPTIONS.map(({ value, label }) => (
                    <button type="button" key={value}
                      className={`kategori-chip${formData.kategori === value ? " selected" : ""}`}
                      onClick={() => { set("kategori", value); if (value !== "lainnya") set("kategoriCustom", ""); }}>
                      {formData.kategori === value && <Check size={12} strokeWidth={3} />}
                      {label}
                    </button>
                  ))}
                </div>
                {errors.kategori && <div className="err-msg"><AlertCircle size={12} />{errors.kategori}</div>}
              </div>

              {/* Custom kategori */}
              {formData.kategori === "lainnya" && (
                <div className="field">
                  <label className="field-label">Isi Kategori Kamu <span>*</span></label>
                  <input type="text" name="kategoriCustom" value={formData.kategoriCustom}
                    onChange={handleChange} placeholder="Contoh: Tanaman Hias, Aksesori, dll."
                    className={`reg-input${errors.kategoriCustom ? " err" : ""}`} />
                  {errors.kategoriCustom && <div className="err-msg"><AlertCircle size={12} />{errors.kategoriCustom}</div>}
                </div>
              )}

              {/* Deskripsi */}
              <div className="field">
                <label className="field-label">Deskripsi Usaha</label>
                <textarea name="deskripsi" value={formData.deskripsi} onChange={handleChange}
                  placeholder="Ceritakan produk atau layanan yang kamu tawarkan..."
                  className="reg-textarea" />
              </div>

              {/* Photo upload */}
              <div className="field">
                <label className="field-label">
                  Foto Produk / Logo
                  <span className="field-note"> — opsional, maks. 5 foto</span>
                </label>

                {formData.photos.length > 0 ? (
                  <div className="photo-grid">
                    {formData.photos.map((p, i) => (
                      <div className="photo-thumb" key={i}>
                        <img src={p.preview} alt={`foto-${i}`} />
                        <button type="button" className="photo-remove" onClick={() => handlePhotoRemove(i)}>
                          <X size={10} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                    {formData.photos.length < 5 && (
                      <label className="photo-add-slot">
                        <input type="file" multiple accept="image/*" onChange={handlePhotoAdd} style={{ display: "none" }} />
                        <ImagePlus size={20} color="#9ca3af" />
                        <span>Tambah</span>
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="upload-zone">
                    <input ref={photoRef} type="file" multiple accept="image/*"
                      onChange={handlePhotoAdd} style={{ display: "none" }} />
                    <div className="upload-icon-wrap">
                      <ImagePlus size={26} strokeWidth={1.5} />
                    </div>
                    <div className="upload-title">Upload Foto Produk / Logo</div>
                    <div className="upload-sub">JPG atau PNG · Maks. 5 foto · 5MB per foto</div>
                    <span className="upload-btn">
                      <ImagePlus size={13} /> Pilih Foto
                    </span>
                  </label>
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════ */}
          {/* STEP 2 — Syarat & Ketentuan   */}
          {/* ══════════════════════════════ */}
          {step === 2 && (
            <>
              <div className="step-chip"><ClipboardList size={12} /> Langkah 2 dari 3</div>
              <h2 className="step-title">Syarat & Ketentuan</h2>
              <p className="step-desc">Baca dan setujui ketentuan sebelum melanjutkan pendaftaran</p>

              <div className="terms-box">
                <p className="terms-heading">Ketentuan Pendaftaran Artisan — Peken Banyumas 2026</p>
                <ul>
                  <li>Data artisan yang diberikan adalah benar, akurat, dan dapat dipertanggungjawabkan.</li>

                  <li>
                    Keikutsertaan dalam Peken Banyumas tidak dipungut biaya pendaftaran. 
                    Namun, setiap artisan wajib memberikan kontribusi bagi hasil sebesar 
                    <strong>10% dari total penjualan</strong> selama event berlangsung kepada pihak penyelenggara.
                  </li>
                </ul>
              </div>

              <label
                className={`checkbox-row${formData.setuju ? " checked" : ""}${errors.setuju ? " err" : ""}`}
                onClick={() => set("setuju", !formData.setuju)}
              >
                <div className={`custom-checkbox${formData.setuju ? " checked" : ""}`}>
                  {formData.setuju && <Check size={11} strokeWidth={3} color="white" />}
                </div>
                <span className="checkbox-label">
                  Saya telah membaca dan <strong>menyetujui seluruh syarat & ketentuan</strong> yang berlaku untuk Peken Banyumas 2026
                </span>
              </label>
              {errors.setuju && <div className="err-msg" style={{ marginTop: 8 }}><AlertCircle size={12} />{errors.setuju}</div>}
            </>
          )}

          {/* ══════════════════════════════ */}
          {/* STEP 3 — Konfirmasi            */}
          {/* ══════════════════════════════ */}
          {step === 3 && (
            <>
              <div className="step-chip"><CheckCircle2 size={12} /> Langkah 3 dari 3</div>
              <h2 className="step-title">Konfirmasi Data</h2>
              <p className="step-desc">Periksa kembali sebelum mengirimkan pendaftaran</p>

              {/* Data Artisan */}
              <div className="confirm-section">
                <div className="confirm-header">
                  <Store size={14} color="#6b7280" strokeWidth={2} />
                  <span className="confirm-header-title">DATA ARTISAN</span>
                </div>
                <div className="confirm-body">
                  {[
                    ["Nama Artisan", formData.namaArtisan],
                    ["Email",        formData.email],
                    ["Username",     `@${formData.username}`],
                    ["Kategori",     displayKategori],
                    ["Deskripsi",    formData.deskripsi || "—"],
                  ].map(([k, v]) => (
                    <div className="confirm-row" key={k}>
                      <span className="confirm-key">{k}</span>
                      <span className="confirm-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foto */}
              {formData.photos.length > 0 && (
                <div className="confirm-section">
                  <div className="confirm-header">
                    <ImagePlus size={14} color="#6b7280" strokeWidth={2} />
                    <span className="confirm-header-title">FOTO PRODUK / LOGO</span>
                  </div>
                  <div className="confirm-body">
                    <div className="photo-grid">
                      {formData.photos.map((p, i) => (
                        <div className="photo-thumb readonly" key={i}>
                          <img src={p.preview} alt={`foto-${i}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Navigation */}
          <div className="nav-row">
            {step > 1 && (
              <button className="btn-back" onClick={prevStep}>
                <ChevronLeft size={16} /> Kembali
              </button>
            )}
            {step < 3 ? (
              <button className="btn-next" onClick={nextStep}>
                Lanjut <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? <><Loader2 size={16} className="spin" /> Mengirim...</>
                  : <><Send size={15} /> Submit Pendaftaran</>
                }
              </button>
            )}
          </div>
        </div>

        <p className="reg-footer">
          Sudah punya akun?{" "}
          <span className="reg-footer-link" onClick={() => navigate("/login")}>Masuk di sini</span>
        </p>
      </div>
    </div>
  );
}