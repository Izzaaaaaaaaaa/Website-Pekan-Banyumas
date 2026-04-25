// Register.jsx — Kolaborator Portal, Peken Banyumasan Design System v2.1
// Embedded CSS removed → external register.css
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Check, ChevronRight } from 'lucide-react';
import { authApi } from '../../services/endpoints';
import { extractError } from '../../lib/unwrap';
import { SUBSEKTORS } from '../../data/dummy';
import { triggerNewKolaboratorRequest } from '../../lib/notifications';
import logo from '../../assets/logo.png';
import '../../assets/styles/register.css';

const STEPS = [
  { id: 1, label: 'Akun'       },
  { id: 2, label: 'Subsektor'  },
  { id: 3, label: 'Konfirmasi' },
];

const KOTA_LIST = ['Banyumas','Purwokerto','Cilacap','Purbalingga','Banjarnegara','Lainnya'];

const COMPANY_URL = import.meta.env.VITE_COMPANY_URL || 'http://localhost:5174';

export default function Register() {
  const nav = useNavigate();
  const [step,     setStep]    = useState(1);
  const [loading,  setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]   = useState('');
  const [form,     setForm]    = useState({
    nama: '', email: '', password: '', kota: '', bio: '', subsektor: [],
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleSub = s => set('subsektor',
    form.subsektor.includes(s)
      ? form.subsektor.filter(x => x !== s)
      : [...form.subsektor, s]
  );

  const next = () => {
    setError('');
    if (step === 1) {
      if (!form.nama.trim())                            { setError('Nama lengkap wajib diisi'); return; }
      if (!form.email.trim() || !form.email.includes('@')) { setError('Email tidak valid'); return; }
      if (form.password.length < 6)                    { setError('Password minimal 6 karakter'); return; }
    }
    if (step === 2 && form.subsektor.length === 0) { setError('Pilih minimal 1 subsektor'); return; }
    setStep(s => s + 1);
  };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await authApi.register(form);
      triggerNewKolaboratorRequest(form.nama);
      nav('/login', { state: { registered: true } });
    } catch (err) {
      setError(extractError(err, 'Gagal mendaftar. Coba lagi.'));
    } finally {
      setLoading(false);
    }
  };

  const passStrength = () => {
    const p = form.password;
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
  const strength = passStrength();

  return (
    <div className="rg-root">
      <div className="rg-wrap">

        {/* Brand */}
        <a href={COMPANY_URL} className="rg-brand">
          <div className="rg-brand-mark">
            <img src={logo} alt="Peken Banyumasan" />
          </div>
          <div>
            <div className="rg-brand-name">Peken Banyumasan</div>
            <div className="rg-brand-sub">Daftar sebagai Kolaborator</div>
          </div>
        </a>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map(s => (
            <div key={s.id} className={`step-item ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}>
              <div className="step-circle">
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              <div className="step-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rg-card">
          {error && <div className="rg-error">{error}</div>}

          {/* ── STEP 1: Akun ─────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="rg-card-title">Data Akun</div>
              <div className="rg-card-sub">Isi informasi dasar untuk membuat akun Kolaborator</div>

              <div className="rg-field">
                <label className="rg-label">Nama Lengkap *</label>
                <input className="rg-input" value={form.nama}
                  onChange={e => set('nama', e.target.value)}
                  placeholder="Nama sesuai KTP" />
              </div>

              <div className="rg-field">
                <label className="rg-label">Email *</label>
                <input className="rg-input" type="email" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="nama@email.com" />
              </div>

              <div className="rg-field">
                <label className="rg-label">Password *</label>
                <div className="rg-input-wrap">
                  <input
                    className="rg-input"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 6 karakter"
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" className="rg-eye" onClick={() => setShowPass(s => !s)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {strength && (
                  <>
                    <div className="pass-bar">
                      <div className="pass-fill" style={{ width: strength.w, background: strength.color }} />
                    </div>
                    <div className="pass-label" style={{ color: strength.color }}>
                      Kekuatan: {strength.label}
                    </div>
                  </>
                )}
              </div>

              <div className="rg-field">
                <label className="rg-label">Kota / Kabupaten</label>
                <select className="rg-select" value={form.kota} onChange={e => set('kota', e.target.value)}>
                  <option value="">Pilih kota...</option>
                  {KOTA_LIST.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>

              <button className="rg-btn rg-btn-primary" onClick={next}>
                Lanjut <ChevronRight size={15} />
              </button>
            </>
          )}

          {/* ── STEP 2: Subsektor ─────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="rg-card-title">Bidang Kebudayaan</div>
              <div className="rg-card-sub">Pilih subsektor yang sesuai dengan karya atau keahlianmu</div>

              <div className="rg-field">
                <div className="sub-grid">
                  {SUBSEKTORS.map(s => (
                    <button
                      key={s} type="button"
                      className={`sub-chip ${form.subsektor.includes(s) ? 'sel' : ''}`}
                      onClick={() => toggleSub(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {form.subsektor.length > 0 && (
                  <p style={{ fontSize: 11, color: '#7A8A52', marginTop: 10, fontWeight: 600 }}>
                    Dipilih: {form.subsektor.join(', ')}
                  </p>
                )}
              </div>

              <div className="rg-field">
                <label className="rg-label">
                  Bio Singkat{' '}
                  <span style={{ fontWeight: 400, color: '#c8ccb0', textTransform: 'none', letterSpacing: 0 }}>
                    (opsional)
                  </span>
                </label>
                <textarea
                  className="rg-textarea" rows={3}
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  placeholder="Ceritakan tentang diri dan karyamu..."
                />
              </div>

              <button className="rg-btn rg-btn-primary" onClick={next}>
                Lanjut <ChevronRight size={15} />
              </button>
              <button className="rg-btn rg-btn-secondary" onClick={() => setStep(1)}>
                Kembali
              </button>
            </>
          )}

          {/* ── STEP 3: Konfirmasi ────────────────────────────── */}
          {step === 3 && (
            <>
              <div className="rg-card-title">Konfirmasi Data</div>
              <div className="rg-card-sub">Periksa kembali sebelum mendaftar</div>

              <div className="confirm-box">
                {[
                  ['Nama',      form.nama],
                  ['Email',     form.email],
                  ['Kota',      form.kota || '—'],
                  ['Subsektor', form.subsektor.join(', ') || '—'],
                ].map(([l, v]) => (
                  <div key={l} className="confirm-row">
                    <span className="confirm-label">{l}</span>
                    <span className="confirm-val">{v}</span>
                  </div>
                ))}
              </div>

              <div className="rg-notice">
                Pendaftaran memerlukan verifikasi admin (1–2 hari kerja).
                Kamu akan mendapat notifikasi setelah disetujui.
              </div>

              <button className="rg-btn rg-btn-primary" onClick={submit} disabled={loading}>
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Mendaftar...</>
                  : 'Daftar Sekarang'
                }
              </button>
              <button className="rg-btn rg-btn-secondary" onClick={() => setStep(2)}>
                Kembali
              </button>
            </>
          )}

          <div className="rg-footer">
            Sudah punya akun? <Link to="/login">Masuk</Link>
          </div>
          <div className="rg-crosslink">
            Punya usaha Artisan?{' '}
            <a href={`${COMPANY_URL}/daftar`}>Daftar sebagai Artisan</a>
          </div>
        </div>
      </div>
    </div>
  );
}
