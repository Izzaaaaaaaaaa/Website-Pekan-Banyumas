// Register.jsx — Kolaborator registration — matches Artisan register style (light, stepper)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Check, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { SUBSEKTORS } from '../../data/dummy';
import { triggerNewKolaboratorRequest } from '../../lib/notifications';

const STEPS = [
  { id:1, label:'Akun',      icon:'👤' },
  { id:2, label:'Subsektor', icon:'🎨' },
  { id:3, label:'Konfirmasi',icon:'✅' },
];

const KOTA_LIST = ['Banyumas','Purwokerto','Cilacap','Purbalingga','Banjarnegara','Lainnya'];

export default function Register() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nama:'', email:'', password:'', kota:'', bio:'', subsektor:[]
  });

  const set = (k,v) => setForm(p => ({...p,[k]:v}));
  const toggleSub = s => set('subsektor', form.subsektor.includes(s) ? form.subsektor.filter(x=>x!==s) : [...form.subsektor, s]);

  const next = () => {
    setError('');
    if (step === 1) {
      if (!form.nama.trim()) { setError('Nama lengkap wajib diisi'); return; }
      if (!form.email.trim() || !form.email.includes('@')) { setError('Email tidak valid'); return; }
      if (form.password.length < 6) { setError('Password minimal 6 karakter'); return; }
    }
    if (step === 2) {
      if (form.subsektor.length === 0) { setError('Pilih minimal 1 subsektor'); return; }
    }
    setStep(s => s + 1);
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.auth.register(form);
      // Notify admin
      triggerNewKolaboratorRequest(form.nama);
      nav('/login', { state: { registered: true } });
    } catch(err) { setError(err.message || 'Gagal mendaftar. Coba lagi.'); }
    finally { setLoading(false); }
  };

  const passStrength = () => {
    const p = form.password;
    if (!p) return null;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 1) return { label:'Lemah', color:'#ef4444', w:'25%' };
    if (s === 2) return { label:'Cukup', color:'#f59e0b', w:'50%' };
    if (s === 3) return { label:'Kuat',  color:'#10b981', w:'75%' };
    return { label:'Sangat Kuat', color:'#2f6f4e', w:'100%' };
  };
  const strength = passStrength();

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Lora:wght@500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    .reg-root{min-height:100vh;background:#f0ede6;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px 60px;font-family:'DM Sans',system-ui,sans-serif}
    .reg-root::before{content:'';position:fixed;inset:0;background-image:radial-gradient(circle at 20% 20%,rgba(47,111,78,.06) 0%,transparent 50%),radial-gradient(circle at 80% 80%,rgba(196,137,48,.06) 0%,transparent 50%);pointer-events:none}
    .reg-wrap{width:100%;max-width:560px}
    .reg-brand{display:flex;align-items:center;gap:12px;margin-bottom:28px;cursor:pointer;text-decoration:none}
    .reg-brand-mark{width:42px;height:42px;background:linear-gradient(135deg,#2f6f4e,#4a9b6e);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(47,111,78,.25);font-size:18px}
    .reg-brand-name{font-family:'Lora',serif;font-size:18px;font-weight:700;color:#1a2e1f}
    .reg-brand-sub{font-size:12px;color:#6b7280;margin-top:1px}
    .stepper{display:flex;align-items:center;margin-bottom:24px;gap:0}
    .step-item{display:flex;flex-direction:column;align-items:center;flex:1;position:relative}
    .step-item:not(:last-child)::after{content:'';position:absolute;top:18px;left:60%;width:80%;height:2px;background:#e5e7eb;z-index:0;transition:background .3s}
    .step-item.done:not(:last-child)::after,.step-item.active:not(:last-child)::after{background:#2f6f4e}
    .step-circle{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;position:relative;z-index:1;transition:all .3s;border:2px solid #e5e7eb;background:#fff;color:#9ca3af}
    .step-item.active .step-circle{border-color:#2f6f4e;background:#2f6f4e;color:#fff;box-shadow:0 0 0 4px rgba(47,111,78,.15)}
    .step-item.done .step-circle{border-color:#2f6f4e;background:#2f6f4e;color:#fff}
    .step-label{font-size:10px;font-weight:600;margin-top:5px;color:#9ca3af;letter-spacing:.03em}
    .step-item.active .step-label{color:#2f6f4e}
    .step-item.done .step-label{color:#2f6f4e}
    .reg-card{background:#fff;border-radius:20px;padding:28px;box-shadow:0 4px 24px rgba(0,0,0,.07);border:1px solid rgba(0,0,0,.04)}
    .reg-card-title{font-family:'Lora',serif;font-size:20px;font-weight:700;color:#1a2e1f;margin-bottom:6px}
    .reg-card-sub{font-size:13px;color:#6b7280;margin-bottom:22px;line-height:1.5}
    .reg-field{margin-bottom:16px}
    .reg-label{font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;display:block}
    .reg-input{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:14px;outline:none;transition:border .15s;font-family:'DM Sans',system-ui,sans-serif;color:#1f2937;background:#fafafa}
    .reg-input:focus{border-color:#2f6f4e;background:#fff}
    .reg-input.err{border-color:#ef4444}
    .reg-input-wrap{position:relative}
    .reg-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#9ca3af;cursor:pointer;background:none;border:none;display:flex}
    .pass-bar{height:4px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-top:6px}
    .pass-fill{height:100%;border-radius:99px;transition:all .3s}
    .pass-label{font-size:11px;margin-top:4px}
    .reg-select{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:14px;outline:none;background:#fafafa;color:#1f2937;font-family:'DM Sans',system-ui,sans-serif;cursor:pointer}
    .reg-select:focus{border-color:#2f6f4e}
    .reg-textarea{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:14px;outline:none;resize:none;font-family:'DM Sans',system-ui,sans-serif;color:#1f2937;background:#fafafa;line-height:1.6}
    .reg-textarea:focus{border-color:#2f6f4e}
    .sub-grid{display:flex;flex-wrap:wrap;gap:8px}
    .sub-chip{padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid #e5e7eb;cursor:pointer;transition:all .15s;background:#fff;color:#374151}
    .sub-chip.sel{background:#2f6f4e;border-color:#2f6f4e;color:#fff}
    .sub-chip:not(.sel):hover{border-color:#2f6f4e;color:#2f6f4e}
    .confirm-box{background:#f8faf8;border:1px solid #c3dece;border-radius:14px;padding:16px 18px;margin-bottom:20px}
    .confirm-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #e5e7eb}
    .confirm-row:last-child{border-bottom:none}
    .confirm-label{color:#6b7280}
    .confirm-val{font-weight:600;color:#1a2e1f;text-align:right;max-width:60%}
    .reg-btn{width:100%;padding:13px;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'DM Sans',system-ui,sans-serif}
    .reg-btn-primary{background:#2f6f4e;color:#fff;border:none}
    .reg-btn-primary:hover{background:#245840}
    .reg-btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .reg-btn-secondary{background:transparent;color:#6b7280;border:1.5px solid #e5e7eb;margin-top:8px}
    .reg-btn-secondary:hover{border-color:#2f6f4e;color:#2f6f4e}
    .reg-error{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 14px;font-size:13px;color:#dc2626;margin-bottom:16px}
    .reg-footer{text-align:center;margin-top:16px;font-size:13px;color:#6b7280}
    .reg-footer a{color:#2f6f4e;font-weight:600;text-decoration:none}
    .reg-crosslink{margin-top:14px;padding-top:14px;border-top:1px solid #f3f4f6;text-align:center;font-size:12px;color:#9ca3af}
    .reg-crosslink a{color:#2f6f4e;font-weight:600;text-decoration:none}
  `;

  return (
    <div className="reg-root">
      <style>{CSS}</style>
      <div className="reg-wrap">
        {/* Brand */}
        <a href={import.meta.env.VITE_Artisan_URL || 'http://localhost:5174'} className="reg-brand">
          <div className="reg-brand-mark">🎨</div>
          <div><div className="reg-brand-name">Peken Banyumasan</div><div className="reg-brand-sub">Daftar sebagai Kolaborator</div></div>
        </a>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map(s => (
            <div key={s.id} className={`step-item ${step===s.id?'active':step>s.id?'done':''}`}>
              <div className="step-circle">
                {step > s.id ? <Check size={16}/> : s.icon}
              </div>
              <div className="step-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="reg-card">
          {error && <div className="reg-error">⚠ {error}</div>}

          {/* Step 1: Akun */}
          {step === 1 && (
            <>
              <div className="reg-card-title">Data Akun</div>
              <div className="reg-card-sub">Isi informasi dasar untuk membuat akun Kolaborator</div>

              <div className="reg-field">
                <label className="reg-label">Nama Lengkap *</label>
                <input className="reg-input" value={form.nama} onChange={e=>set('nama',e.target.value)} placeholder="Nama sesuai KTP"/>
              </div>
              <div className="reg-field">
                <label className="reg-label">Email *</label>
                <input className="reg-input" type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="nama@email.com"/>
              </div>
              <div className="reg-field">
                <label className="reg-label">Password *</label>
                <div className="reg-input-wrap">
                  <input className="reg-input" type={showPass?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min. 6 karakter" style={{paddingRight:40}}/>
                  <button type="button" className="reg-eye" onClick={()=>setShowPass(s=>!s)}>
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {strength && (
                  <>
                    <div className="pass-bar"><div className="pass-fill" style={{width:strength.w,background:strength.color}}/></div>
                    <div className="pass-label" style={{color:strength.color}}>Password: {strength.label}</div>
                  </>
                )}
              </div>
              <div className="reg-field">
                <label className="reg-label">Kota / Kabupaten</label>
                <select className="reg-select" value={form.kota} onChange={e=>set('kota',e.target.value)}>
                  <option value="">Pilih kota...</option>
                  {KOTA_LIST.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>

              <button className="reg-btn reg-btn-primary" onClick={next}>
                Lanjut <ChevronRight size={16}/>
              </button>
            </>
          )}

          {/* Step 2: Subsektor */}
          {step === 2 && (
            <>
              <div className="reg-card-title">Bidang Kebudayaan</div>
              <div className="reg-card-sub">Pilih subsektor yang sesuai dengan karya atau keahlianmu (bisa lebih dari satu)</div>

              <div className="reg-field">
                <div className="sub-grid">
                  {SUBSEKTORS.map(s => (
                    <button key={s} type="button" className={`sub-chip ${form.subsektor.includes(s)?'sel':''}`} onClick={()=>toggleSub(s)}>{s}</button>
                  ))}
                </div>
                {form.subsektor.length > 0 && (
                  <p style={{fontSize:12,color:'#2f6f4e',marginTop:10,fontWeight:600}}>✓ Dipilih: {form.subsektor.join(', ')}</p>
                )}
              </div>

              <div className="reg-field">
                <label className="reg-label">Bio Singkat <span style={{fontWeight:400,color:'#9ca3af'}}>(opsional)</span></label>
                <textarea className="reg-textarea" rows={3} value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="Ceritakan tentang diri dan karyamu..."/>
              </div>

              <button className="reg-btn reg-btn-primary" onClick={next}>Lanjut <ChevronRight size={16}/></button>
              <button className="reg-btn reg-btn-secondary" onClick={()=>setStep(1)}>← Kembali</button>
            </>
          )}

          {/* Step 3: Konfirmasi */}
          {step === 3 && (
            <>
              <div className="reg-card-title">Konfirmasi Data</div>
              <div className="reg-card-sub">Periksa kembali sebelum mendaftar</div>

              <div className="confirm-box">
                {[
                  ['Nama', form.nama],
                  ['Email', form.email],
                  ['Kota', form.kota || '—'],
                  ['Subsektor', form.subsektor.join(', ') || '—'],
                ].map(([l,v]) => (
                  <div key={l} className="confirm-row">
                    <span className="confirm-label">{l}</span>
                    <span className="confirm-val">{v}</span>
                  </div>
                ))}
              </div>

              <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:12,padding:'12px 14px',marginBottom:18,fontSize:12,color:'#92400e',lineHeight:1.6}}>
                ℹ Pendaftaran memerlukan verifikasi admin (1–2 hari kerja). Kamu akan mendapat notifikasi setelah disetujui.
              </div>

              <button className="reg-btn reg-btn-primary" onClick={submit} disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin"/> Mendaftar...</> : '🚀 Daftar Sekarang'}
              </button>
              <button className="reg-btn reg-btn-secondary" onClick={()=>setStep(2)}>← Kembali</button>
            </>
          )}

          <div className="reg-footer">
            Sudah punya akun? <Link to="/login">Masuk</Link>
          </div>
          <div className="reg-crosslink">
            Punya usaha Artisan?{' '}
            <a href={import.meta.env.VITE_Artisan_URL || 'http://localhost:5174/daftar'}>Daftar sebagai Artisan →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
