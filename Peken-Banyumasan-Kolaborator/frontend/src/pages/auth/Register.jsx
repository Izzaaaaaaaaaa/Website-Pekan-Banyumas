// Register.jsx — Kolaborator Portal · Peken Banyumasan Design System v2.2
// UI structure identik dengan artisan portal. Hanya konten field yang berbeda:
//   artisan  → kategori_usaha (UMKM 9)
//   kolaborator → subsektor (BEKRAF 17)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, ClipboardList, CheckCircle2,
  Check, AlertCircle, ChevronLeft, ChevronRight,
  Send, Loader2, Eye, EyeOff, Mail, Lock, User, MapPin,
} from 'lucide-react';
import { authApi } from '../../services/endpoints';
import { extractError } from '../../lib/unwrap';
import { SUBSEKTOR } from '../../constants/subsektor';
import { KOTA_LIST } from '../../constants/kotaList';
import { triggerNewKolaboratorRequest } from '../../lib/notifications';
import { STORAGE_KEYS } from '../../lib/storageKeys';
import { writeRaw } from '../../lib/domainStorage';
import logo from '../../assets/logo.png';
import '../../assets/styles/register.css';

/* ─── CONSTANTS ─── */

const STEPS = [
  { id: 1, label: 'Data Akun',    Icon: Globe },
  { id: 2, label: 'Spesialisasi', Icon: ClipboardList },
  { id: 3, label: 'Konfirmasi',   Icon: CheckCircle2 },
];

const COMPANY_URL = import.meta.env.VITE_COMPANY_URL || 'http://localhost:5173';

/* ─── COMPONENT ─── */

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep]             = useState(1);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passStrength = (p) => {
    if (!p) return null;
    let s = 0;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p))  s++;
    if (s <= 1) return { label: 'Lemah',       color: '#B87272', w: '25%' };
    if (s === 2) return { label: 'Cukup',       color: '#C4A24D', w: '50%' };
    if (s === 3) return { label: 'Kuat',        color: '#7A8A52', w: '75%' };
    return              { label: 'Sangat Kuat', color: '#4F5C30', w: '100%' };
  };

  const [formData, setFormData] = useState({
    nama: '', email: '', password: '', konfirmPassword: '',
    kota: '', subsektor: [], bio: '', setuju: false,
  });

  /* helpers */
  const set = (key, val) => {
    setFormData((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: '' }));
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  };
  const toggleSubsektor = (s) => {
    setFormData((p) => ({
      ...p,
      subsektor: p.subsektor.includes(s)
        ? p.subsektor.filter(x => x !== s)
        : [...p.subsektor, s],
    }));
    if (errors.subsektor) setErrors((p) => ({ ...p, subsektor: '' }));
  };

  /* validation */
  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!formData.nama.trim())     e.nama     = 'Nama lengkap wajib diisi';
      else if (formData.nama.trim().length < 2) e.nama = 'Nama lengkap minimal 2 karakter';
      if (!formData.email.trim())    e.email    = 'Email wajib diisi';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Format email tidak valid';
      if (!formData.password)        e.password = 'Password wajib diisi';
      else if (formData.password.length < 8) e.password = 'Password minimal 8 karakter';
      if (formData.password !== formData.konfirmPassword) e.konfirmPassword = 'Password tidak cocok';
      if (!formData.kota)              e.kota     = 'Kota/kabupaten wajib dipilih';
    }
    if (step === 2) {
      if (formData.subsektor.length === 0) e.subsektor = 'Pilih minimal 1 Subsektor';
    }
    if (step === 3 && !formData.setuju) {
      e.setuju = 'Anda harus menyetujui syarat & ketentuan';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validate()) setStep((p) => p + 1); };
  const prevStep = () => setStep((p) => p - 1);

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setErrors((p) => ({ ...p, _global: '' }));
    try {
      // konfirmPassword tidak dikirim ke backend (validasi FE only).
      // role wajib dikirim: BE register endpoint memvalidasi role IN ('artisan','kolaborator').
      const { konfirmPassword: _skip, setuju: _setuju, ...rest } = formData;
      const payload = { ...rest, role: 'kolaborator' };
      await authApi.register(payload);
      writeRaw(STORAGE_KEYS.REGISTER_STATUS, 'pending');
      try { triggerNewKolaboratorRequest(formData.nama); } catch {}
      setRegSuccess(true);
    } catch (err) {
      const msg = extractError(err, 'Gagal mendaftar. Silakan coba lagi.');
      // Email sudah terpakai (409) → kembali ke Step 1 dan tandai di field email
      if (/sudah terdaftar|sudah digunakan|sudah terpakai|already|duplicate/i.test(msg)) {
        setErrors({ email: msg });
        setStep(1);
      } else {
        setErrors((p) => ({ ...p, _global: msg }));
      }
      setSubmitting(false);
    }
  };

  /* ── Success screen ── */
  if (regSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dash-bg, #f2f4e8)', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,.08)', border: '1px solid var(--dash-border, #e4e7d4)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display, sans-serif)', fontWeight: 600, fontSize: 22, color: '#1e2010', marginBottom: 10 }}>Pendaftaran Berhasil!</h2>
          <p style={{ fontSize: 14, color: '#5a6040', lineHeight: 1.7, marginBottom: 28 }}>
            Data kamu sedang menunggu verifikasi admin (1–2 hari kerja). Kamu akan mendapat notifikasi setelah disetujui.
          </p>
          <button
            onClick={() => navigate('/status')}
            style={{ width: '100%', background: '#7a8a52', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
            Cek Status Pendaftaran
          </button>
          <p style={{ fontSize: 13, color: '#8a9070', margin: 0 }}>
            Sudah punya akun?{' '}
            <span onClick={() => navigate('/login')} style={{ color: '#7a8a52', fontWeight: 600, cursor: 'pointer' }}>Masuk di sini</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-root">
      <a href={COMPANY_URL}
         style={{ position: 'fixed', top: 14, right: 18, fontSize: 12, color: '#8a9070', textDecoration: 'none', zIndex: 99 }}>
        ← Beranda Publik
      </a>
      <div className="reg-wrapper">

        {/* Brand */}
        <a href={COMPANY_URL} className="reg-brand">
          <div className="reg-brand-mark">
            <img src={logo} alt="Peken Banyumasan" />
          </div>
          <div>
            <div className="reg-brand-name">Peken Banyumasan</div>
            <div className="reg-brand-sub">Daftar sebagai Kolaborator</div>
          </div>
        </a>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map(({ id, label, Icon }) => {
            const isDone   = step > id;
            const isActive = step === id;
            return (
              <div key={id} className={`step-item${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}>
                <div className="step-circle">
                  {isDone ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={2} />}
                </div>
                <div className="step-label">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
        </div>

        {/* Card */}
        <div className="reg-card" key={step}>

          {/* ══════════════════════════════ */}
          {/* STEP 1 — Data Akun            */}
          {/* ══════════════════════════════ */}
          {step === 1 && (
            <>
              <div className="step-chip"><Globe size={12} /> Langkah 1 dari 3</div>
              <h2 className="step-title">Data Akun</h2>
              <p className="step-desc">Isi informasi dasar untuk membuat akun Kolaborator Peken Banyumasan</p>

              {/* Nama */}
              <div className="field">
                <label className="field-label">Nama Lengkap <span>*</span></label>
                <div className="input-wrap">
                  <span className="input-icon"><User size={16} /></span>
                  <input type="text" name="nama" value={formData.nama}
                    onChange={handleChange} placeholder="Nama sesuai KTP"
                    className={`reg-input with-icon${errors.nama ? ' err' : ''}`} />
                </div>
                {errors.nama && <div className="err-msg"><AlertCircle size={12} />{errors.nama}</div>}
              </div>

              {/* Email */}
              <div className="field">
                <label className="field-label">Email <span>*</span></label>
                <div className="input-wrap">
                  <span className="input-icon"><Mail size={16} /></span>
                  <input type="email" name="email" value={formData.email}
                    onChange={handleChange}
                    onBlur={() => { if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) setErrors((p) => ({ ...p, email: 'Format email tidak valid' })); }}
                    placeholder="nama@email.com"
                    className={`reg-input with-icon${errors.email ? ' err' : ''}`} />
                </div>
                {errors.email && <div className="err-msg"><AlertCircle size={12} />{errors.email}</div>}
              </div>

              {/* Password pair */}
              <div className="field-row-2">
                <div className="field">
                  <label className="field-label">Password <span>*</span></label>
                  <div className="input-wrap">
                    <span className="input-icon"><Lock size={16} /></span>
                    <input type={showPass ? 'text' : 'password'} name="password"
                      value={formData.password} onChange={handleChange}
                      placeholder="Min. 8 karakter"
                      className={`reg-input with-icon with-toggle${errors.password ? ' err' : ''}`} />
                    <button type="button" className="toggle-btn" onClick={() => setShowPass((p) => !p)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <div className="err-msg"><AlertCircle size={12} />{errors.password}</div>}
                  {(() => { const st = passStrength(formData.password); return st ? (
                    <>
                      <div style={{ height: 4, background: '#e4e7d4', borderRadius: 9999, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: st.w, background: st.color, borderRadius: 9999, transition: 'width .25s, background .25s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: st.color, fontWeight: 600, marginTop: 4 }}>Kekuatan: {st.label}</div>
                    </>
                  ) : null; })()}
                </div>
                <div className="field">
                  <label className="field-label">Konfirmasi Password <span>*</span></label>
                  <div className="input-wrap">
                    <span className="input-icon"><Lock size={16} /></span>
                    <input type={showConfirm ? 'text' : 'password'} name="konfirmPassword"
                      value={formData.konfirmPassword} onChange={handleChange}
                      placeholder="Ulangi password"
                      className={`reg-input with-icon with-toggle${errors.konfirmPassword ? ' err' : ''}`} />
                    <button type="button" className="toggle-btn" onClick={() => setShowConfirm((p) => !p)}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.konfirmPassword && <div className="err-msg"><AlertCircle size={12} />{errors.konfirmPassword}</div>}
                </div>
              </div>

              {/* Kota */}
              <div className="field">
                <label className="field-label">Kota / Kabupaten <span>*</span></label>
                <div className="input-wrap">
                  <span className="input-icon"><MapPin size={16} /></span>
                  <select name="kota" value={formData.kota} onChange={handleChange}
                    className={`reg-select with-icon${errors.kota ? ' err' : ''}`}>
                    <option value="">Pilih kota / kabupaten</option>
                    {KOTA_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                {errors.kota && <div className="err-msg"><AlertCircle size={12} />{errors.kota}</div>}
              </div>
            </>
          )}

          {/* ══════════════════════════════ */}
          {/* STEP 2 — Spesialisasi          */}
          {/* ══════════════════════════════ */}
          {step === 2 && (
            <>
              <div className="step-chip"><ClipboardList size={12} /> Langkah 2 dari 3</div>
              <h2 className="step-title">Spesialisasi</h2>
              <p className="step-desc">Pilih subsektor yang sesuai dengan karya atau keahlianmu</p>

              {/* Subsektor chips — gunakan CSS class sama dengan kategori artisan */}
              <div className="field">
                <label className="field-label">Subsektor (BEKRAF) <span>*</span></label>
                <div className="kategori-grid">
                  {SUBSEKTOR.map((s) => (
                    <button type="button" key={s}
                      className={`kategori-chip${formData.subsektor.includes(s) ? ' selected' : ''}`}
                      onClick={() => toggleSubsektor(s)}>
                      {formData.subsektor.includes(s) && <Check size={12} strokeWidth={3} />}
                      {s}
                    </button>
                  ))}
                </div>
                {formData.subsektor.length > 0 && (
                  <p style={{ fontSize: 11, color: '#7a8a52', marginTop: 6, fontWeight: 600 }}>
                    Dipilih: {formData.subsektor.join(', ')}
                  </p>
                )}
                {errors.subsektor && <div className="err-msg"><AlertCircle size={12} />{errors.subsektor}</div>}
              </div>

              {/* Bio */}
              <div className="field">
                <label className="field-label">Bio Singkat
                  <span className="field-note"> — opsional</span>
                </label>
                <textarea name="bio" value={formData.bio} onChange={handleChange}
                  placeholder="Ceritakan tentang dirimu dan karyamu..."
                  className="reg-textarea" />
              </div>
            </>
          )}

          {/* ══════════════════════════════ */}
          {/* STEP 3 — S&K + Konfirmasi     */}
          {/* ══════════════════════════════ */}
          {step === 3 && (
            <>
              <div className="step-chip"><CheckCircle2 size={12} /> Langkah 3 dari 3</div>
              <h2 className="step-title">Konfirmasi Data</h2>
              <p className="step-desc">Baca ketentuan, lalu periksa kembali sebelum mengirimkan pendaftaran</p>

              {/* S&K */}
              <div className="terms-box">
                <span className="terms-heading">Ketentuan Kolaborator — Peken Banyumasan</span>
                <ul>
                  <li>Data yang diberikan adalah benar, akurat, dan dapat dipertanggungjawabkan.</li>
                  <li>Kolaborator berpartisipasi sukarela dan tidak dipungut biaya pendaftaran.</li>
                  <li>Peken Banyumasan berhak menggunakan dokumentasi karya untuk keperluan promosi non-komersial dengan menyebut kreator.</li>
                  <li>Akun dapat dinonaktifkan jika terbukti melanggar kode etik komunitas kreatif.</li>
                </ul>
              </div>

              <label
                className={`checkbox-row${formData.setuju ? ' checked' : ''}${errors.setuju ? ' err' : ''}`}
                onClick={() => set('setuju', !formData.setuju)}
              >
                <div className={`custom-checkbox${formData.setuju ? ' checked' : ''}`}>
                  {formData.setuju && <Check size={11} strokeWidth={3} color="white" />}
                </div>
                <span className="checkbox-label">
                  Saya telah membaca dan <strong>menyetujui ketentuan</strong> yang berlaku untuk kolaborator Peken Banyumasan
                </span>
              </label>
              {errors.setuju && <div className="err-msg" style={{ marginTop: 8 }}><AlertCircle size={12} />{errors.setuju}</div>}

              {/* Summary */}
              <div className="confirm-section" style={{ marginTop: 18 }}>
                <div className="confirm-header">
                  <Globe size={14} color="#6b7280" strokeWidth={2} />
                  <span className="confirm-header-title">DATA KOLABORATOR</span>
                </div>
                <div className="confirm-body">
                  {[
                    ['Nama',      formData.nama],
                    ['Email',     formData.email],
                    ['Kota',      formData.kota || '—'],
                    ['Subsektor', formData.subsektor.join(', ') || '—'],
                  ].map(([k, v]) => (
                    <div className="confirm-row" key={k}>
                      <span className="confirm-key">{k}</span>
                      <span className="confirm-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="nav-row" style={step === 1 ? { justifyContent: 'flex-end' } : undefined}>
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
                  : <><Send size={15} /> Daftar Sekarang</>
                }
              </button>
            )}
          </div>
          {errors._global && (
            <div className="err-msg" style={{ marginTop: 12 }}>
              <AlertCircle size={12} />{errors._global}
            </div>
          )}
        </div>

        <p className="reg-footer">
          Sudah punya akun?{' '}
          <span className="reg-footer-link" onClick={() => navigate('/login')}>Masuk di sini</span>
        </p>
        <p className="reg-footer" style={{ marginTop: 4 }}>
          <a href={COMPANY_URL} className="reg-footer-link">← Kembali ke Beranda Publik</a>
        </p>
      </div>
    </div>
  );
}
