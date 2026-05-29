// src/pages/auth/Login.jsx — Kolaborator Portal
// Left panel  → Gate-style (inline styles, dark charcoal, Clash Display, pixel motif)
// Right panel → Form + event strip dari API (dynamic)

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
    Mail, Lock, Eye, EyeOff, ArrowRight,
    Loader2, Globe, AlertCircle, Calendar, MapPin,
} from 'lucide-react';
import { authApi, eventApi } from '../../services/endpoints';
import { setToken, setUser, clearAuth } from '../../lib/auth';
import { extractError } from '../../lib/unwrap';
import { STORAGE_KEYS } from '../../lib/storageKeys';
import { writeRaw } from '../../lib/domainStorage';
import logo from '../../assets/logo.png';
import '../../assets/styles/login.css';

/* ─── Left panel decorative sub-components (all inline) ─── */

const DotGrid = () => (
    <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(#C3CA96 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none',
    }} />
);

const SageGlow = () => (
    <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(195,202,150,.14) 0%, transparent 70%)',
        pointerEvents: 'none',
    }} />
);

const PixelSkyline = () => (
    <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
        backgroundImage: 'url(/pixel-skyline.svg)',
        backgroundRepeat: 'repeat-x', backgroundPosition: 'bottom',
        backgroundSize: 'auto 80px', opacity: 0.12, pointerEvents: 'none',
    }} />
);

const FEATURES = [
    'Kelola portofolio dan karya kreatifmu',
    'Daftar dan ikuti event budaya Banyumasan',
    'Terhubung dengan sesama kolaborator kreatif',
];

export default function Login() {
    const nav = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');
    const [show,      setShow]      = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState('');
    const [nextEvent, setNextEvent] = useState(null);
    const justRegistered = location.state?.registered === true;

    // Ambil event mendatang — tidak perlu auth, gagal = strip tersembunyi.
    useEffect(() => {
        eventApi.list()
            .then(items => {
                const upcoming = (items || [])
                    .filter(e => ['upcoming', 'published', 'berlangsung'].includes(e.status))
                    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))[0];
                if (upcoming) setNextEvent(upcoming);
            })
            .catch(() => {});
    }, []);

    const submit = async e => {
        e.preventDefault();
        if (!email || !password) { setError('Email dan password wajib diisi'); return; }
        setLoading(true); setError('');
        try {
            const { token, user } = await authApi.login({ email, password });
            if (user?.role && user.role !== 'kolaborator') {
                clearAuth();
                setError('Email atau password salah');
                setLoading(false);
                return;
            }
            // Pending/suspended/rejected accounts must NOT reach the dashboard.
            // Sign out so no token lingers (which would spam 403s), then show
            // the status page with the ACTUAL status.
            if (user?.status && user.status !== 'aktif') {
                clearAuth();
                writeRaw(STORAGE_KEYS.REGISTER_STATUS, user.status);
                setLoading(false);
                nav('/status');
                return;
            }
            setToken(token);
            setUser(user);
            nav(searchParams.get('return') || '/dashboard');
        } catch (err) {
            setError(extractError(err, 'Email atau password salah'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', height: '100vh', overflow: 'hidden',
            fontFamily: 'var(--font-body)',
            background: '#f2f4e8',
        }}>

            {/* LEFT — Branding / Hero */}
            <div className="login-left-panel">
                <DotGrid />
                <SageGlow />
                <PixelSkyline />

                {/* Logo */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                        src={logo}
                        alt="Peken Banyumasan"
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover',
                            border: '1px solid rgba(255,255,255,.12)' }}
                    />
                    <div>
                        <div style={{
                            fontFamily: '"Clash Display", sans-serif',
                            fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1,
                        }}>
                            Peken Banyumasan
                        </div>
                        <div style={{
                            fontSize: 10, color: '#5a6258', marginTop: 4,
                            letterSpacing: '.08em', textTransform: 'uppercase',
                        }}>
                            Portal Kolaborator
                        </div>
                    </div>
                </div>

                {/* Hero copy */}
                <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
                    <div style={{
                        fontFamily: '"Clash Display", sans-serif',
                        fontSize: 32, fontWeight: 400, color: '#fff',
                        lineHeight: 1.25, marginBottom: 20, letterSpacing: '-.01em',
                    }}>
                        Tampilkan karya. Bergabung bersama kami.
                    </div>
                    <p style={{ fontSize: 14, color: '#8a9278', lineHeight: 1.8, margin: 0 }}>
                        Kelola portofolio, ikuti event budaya, dan terhubung dengan sesama
                        kolaborator kreatif Banyumas Raya dalam satu platform terintegrasi.
                    </p>
                    <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {FEATURES.map(text => (
                            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C3CA96', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: '#8a9278' }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ position: 'relative', zIndex: 1, fontSize: 10, color: '#3a4030', letterSpacing: '.04em' }}>
                    &copy; 2026 Panitia Peken Banyumasan
                </div>
            </div>

            {/* RIGHT — Login form */}
            <div className="login-right">
                <div style={{ position: 'absolute', top: 16, right: 20, zIndex: 10 }}>
                    <a href={import.meta.env.VITE_COMPANY_URL || 'http://localhost:5173'}
                       style={{ fontSize: 12, color: '#8a9070', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        ← Beranda Publik
                    </a>
                </div>
                <div className="login-card">

                    {/* Mobile logo */}
                    <div className="card-logos">
                        <img src={logo} alt="Peken Banyumasan" className="card-logo" />
                    </div>

                    <div className="logo-mark">
                        <Globe size={24} color="white" strokeWidth={1.8} />
                    </div>

                    <h2 className="card-title">Selamat datang!</h2>
                    <p className="card-sub">Masuk ke portal kolaborator Anda</p>

                    {justRegistered && (
                        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#166534', fontWeight:500 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Pendaftaran berhasil — silakan login untuk melanjutkan.
                        </div>
                    )}

                    {error && (
                        <div className="error-box">
                            <AlertCircle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div className="field">
                            <label className="field-label">Email</label>
                            <div className="input-wrap">
                                <span className="input-icon"><Mail size={16} strokeWidth={1.8} /></span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
                                    placeholder="nama@email.com"
                                    className="login-input"
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label className="field-label">Password</label>
                            <div className="input-wrap">
                                <span className="input-icon"><Lock size={16} strokeWidth={1.8} /></span>
                                <input
                                    type={show ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                                    placeholder="Masukkan password"
                                    className="login-input has-toggle"
                                    autoComplete="current-password"
                                />
                                <button type="button" className="toggle-pw" onClick={() => setShow(s => !s)}>
                                    {show ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                                </button>
                            </div>
                        </div>

                        <div className="forgot-row">
                            <span className="forgot-link" onClick={() => nav('/lupa-pass')}>
                                Lupa password?
                            </span>
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading
                                ? <><Loader2 size={16} className="spin" /> Memproses...</>
                                : <>Masuk ke Dashboard <ArrowRight size={16} /></>
                            }
                        </button>
                    </form>

                    <div className="divider">atau</div>

                    <p className="register-row">
                        Belum punya akun?{' '}
                        <Link to="/register" className="register-link">Daftar sekarang</Link>
                    </p>

                    {/* Event info strip — dynamic dari eventApi.list()
              dummy mode  → selalu tampil (dummyEndpoints punya data)
              real mode   → tampil jika backend running & ada event upcoming
              null        → strip tidak dirender sama sekali */}
                    {nextEvent && (
                        <div className="event-strip">
                            <div className="event-strip-left">
                                <img src={logo} alt="Peken Banyumasan" className="event-strip-logo" />
                            </div>
                            <div>
                                <div className="event-name">{nextEvent.nama}</div>
                                <div className="event-detail">
                                    <Calendar size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                    {new Date(nextEvent.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {nextEvent.jam_mulai && ` · ${nextEvent.jam_mulai}${nextEvent.jam_selesai ? `–${nextEvent.jam_selesai}` : ''} WIB`}
                                    {nextEvent.lokasi && (
                                        <><br /><MapPin size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{nextEvent.lokasi}</>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}