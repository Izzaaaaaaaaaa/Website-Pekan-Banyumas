// Login.jsx — Split-panel design matching UMKM login style exactly
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const UMKM_URL = import.meta.env.VITE_UMKM_URL || 'http://localhost:5174';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif}

.ml-root{min-height:100vh;display:flex;font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#f0ede6}

/* ── LEFT PANEL ── */
.ml-left{display:none;position:relative;width:46%;background:#1a3a2a;overflow:hidden;
  flex-direction:column;justify-content:flex-end;padding:52px 48px}
@media(min-width:900px){.ml-left{display:flex}}

.ml-blob{position:absolute;border-radius:50%;filter:blur(72px);opacity:.22;pointer-events:none}
.ml-blob-1{width:360px;height:360px;background:#4a9b6e;top:-80px;right:-100px}
.ml-blob-2{width:260px;height:260px;background:#c48930;bottom:-60px;left:-60px}
.ml-blob-3{width:180px;height:180px;background:#2d8865;top:40%;left:30%}

.ml-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.18);border-radius:20px;padding:6px 14px;
  font-size:11px;font-weight:600;color:rgba(255,255,255,.8);letter-spacing:.05em;
  text-transform:uppercase;margin-bottom:24px}
.ml-badge span{width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block}

.ml-heading{font-family:'Playfair Display',Georgia,serif;font-size:clamp(28px,4vw,42px);font-weight:700;
  color:#fff;line-height:1.2;margin-bottom:14px;letter-spacing:-.02em}
.ml-heading em{font-style:italic;color:#86efac}

.ml-sub{font-size:14px;color:rgba(255,255,255,.6);line-height:1.75;margin-bottom:32px;max-width:340px}

.ml-stats{display:flex;gap:10px;flex-wrap:wrap}
.ml-stat{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
  border-radius:14px;padding:14px 18px;flex:1;min-width:100px}
.ml-stat-n{font-size:22px;font-weight:800;color:#fff;line-height:1;margin-bottom:4px}
.ml-stat-l{font-size:11px;color:rgba(255,255,255,.5);font-weight:500}

/* ── RIGHT PANEL ── */
.ml-right{flex:1;display:flex;align-items:center;justify-content:center;
  padding:36px 24px;background:#f0ede6;position:relative}

.ml-card{position:relative;background:#fff;border-radius:26px;padding:44px 40px;
  width:100%;max-width:430px;box-shadow:0 0 0 1px rgba(0,0,0,.05),0 8px 32px rgba(0,0,0,.07)}

.ml-logo{width:44px;height:44px;background:linear-gradient(135deg,#2f6f4e,#4a9b6e);
  border-radius:13px;display:flex;align-items:center;justify-content:center;
  margin-bottom:22px;font-size:20px;box-shadow:0 4px 12px rgba(47,111,78,.25)}

.ml-title{font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:700;color:#1c2b1f;margin-bottom:6px;letter-spacing:-.02em}
.ml-sub2{font-size:14px;color:#6b7280;margin-bottom:30px;line-height:1.5}

.ml-err{background:#fef2f2;border:1px solid #fecaca;border-radius:11px;padding:11px 14px;
  font-size:13px;color:#c53030;margin-bottom:18px;display:flex;align-items:center;gap:8px}

.ml-field{margin-bottom:16px}
.ml-label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:7px;letter-spacing:.01em}
.ml-wrap{position:relative}
.ml-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);
  color:#9ca3af;pointer-events:none;display:flex;align-items:center}
.ml-input{width:100%;padding:13px 14px 13px 42px;border:1.5px solid #e5e7eb;border-radius:12px;
  font-size:14px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#fafafa;color:#1c2b1f;
  outline:none;transition:border-color .2s,box-shadow .2s,background .2s;line-height:1.5;-webkit-appearance:none}
.ml-input:focus{border-color:#2f6f4e;background:#fff;box-shadow:0 0 0 3px rgba(47,111,78,.1)}
.ml-input::placeholder{color:#c0c7d4}
.ml-input-pr{padding-right:44px}
.ml-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;color:#9ca3af;display:flex;
  padding:4px;border-radius:6px;transition:color .15s;line-height:1}
.ml-eye:hover{color:#2f6f4e}

.ml-btn{width:100%;padding:14px;background:linear-gradient(135deg,#276749,#2f855a);
  color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:600;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;cursor:pointer;transition:all .15s;
  display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:.01em;margin-top:6px}
.ml-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 16px rgba(47,111,78,.3)}
.ml-btn:disabled{opacity:.65;cursor:not-allowed}

.ml-footer{text-align:center;margin-top:20px;font-size:13px;color:#6b7280}
.ml-footer a{color:#2f6f4e;font-weight:600;text-decoration:none}
.ml-footer a:hover{text-decoration:underline}
.ml-divider{border:none;border-top:1px solid #f3f4f6;margin:16px 0}
.ml-cross{text-align:center;font-size:12px;color:#9ca3af}
.ml-cross a{color:#2f6f4e;font-weight:600;text-decoration:none}
.ml-demo{font-size:11px;color:#c4baa8;text-align:center;margin-top:16px;font-style:italic}

.ml-back{position:fixed;top:16px;left:16px;z-index:200;display:flex;align-items:center;
  gap:6px;padding:7px 14px;background:rgba(255,255,255,.9);backdrop-filter:blur(8px);
  border:1px solid rgba(0,0,0,.08);border-radius:20px;font-size:12px;font-weight:600;
  color:#5a4a30;text-decoration:none;transition:all .15s;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.ml-back:hover{background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.08)}

@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin .7s linear infinite}

@media(max-width:600px){
  .ml-card{padding:32px 24px;border-radius:20px}
  .ml-title{font-size:22px}
}
`;

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const submit = async e => {
    e.preventDefault();
    if (!email || !password) { setError('Email dan password wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      await api.auth.login(email, password);
      nav('/dashboard');
    } catch(err) { setError(err.message || 'Email atau password salah'); }
    finally { setLoading(false); }
  };

  return (
    <div className="ml-root">
      <style>{CSS}</style>

      {/* Back to home */}
      <a href={UMKM_URL} className="ml-back">← Beranda</a>

      {/* LEFT */}
      <div className="ml-left">
        <div className="ml-blob ml-blob-1"/>
        <div className="ml-blob ml-blob-2"/>
        <div className="ml-blob ml-blob-3"/>
        <div style={{position:'relative',zIndex:1}}>
          <div className="ml-badge"><span/>Platform Kreator</div>
          <h1 className="ml-heading">
            Tampilkan karya<br/>dan bergabung <em>bersama</em>
          </h1>
          <p className="ml-sub">
            Kelola portofolio, ikut event budaya, dan terhubung dengan sesama kreator Banyumas Raya.
          </p>
          <div className="ml-stats">
            <div className="ml-stat">
              <div className="ml-stat-n">127+</div>
              <div className="ml-stat-l">Kreator</div>
            </div>
            <div className="ml-stat">
              <div className="ml-stat-n">12</div>
              <div className="ml-stat-l">Event Digelar</div>
            </div>
            <div className="ml-stat">
              <div className="ml-stat-n">17</div>
              <div className="ml-stat-l">Subsektor Budaya</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="ml-right">
        <div className="ml-card">
          <div className="ml-logo">🎨</div>
          <h2 className="ml-title">Selamat datang!</h2>
          <p className="ml-sub2">Masuk ke dashboard kreator</p>

          {error && <div className="ml-err">⚠ {error}</div>}

          <form onSubmit={submit}>
            <div className="ml-field">
              <label className="ml-label">Email</label>
              <div className="ml-wrap">
                <span className="ml-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input className="ml-input" type="email" value={email}
                  onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com"
                  autoComplete="email" autoFocus/>
              </div>
            </div>
            <div className="ml-field">
              <label className="ml-label">Password</label>
              <div className="ml-wrap">
                <span className="ml-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input className={`ml-input ml-input-pr`} type={show?'text':'password'} value={password}
                  onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
                  autoComplete="current-password"/>
                <button type="button" className="ml-eye" onClick={()=>setShow(s=>!s)}>
                  {show
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <button type="submit" className="ml-btn" disabled={loading}>
              {loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
              {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div className="ml-footer">
            Belum punya akun? <Link to="/daftar">Daftar sekarang</Link>
          </div>
          <hr className="ml-divider"/>
          <div className="ml-cross">
            Punya usaha UMKM? <a href={`${UMKM_URL}/login`}>Login sebagai UMKM →</a>
          </div>
          <p className="ml-demo">Mode demo — masukkan email &amp; password apapun</p>
        </div>
      </div>
    </div>
  );
}
