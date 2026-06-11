// src/pages/Login.jsx — Peken Banyumasan Design System v2.0
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert } from 'lucide-react';
import { authApi } from '../services/endpoints';
import { setToken, setUser } from '../lib/auth';
import { extractError } from '../lib/unwrap';

// Pixel skyline SVG motif (brand mark strip)
const PixelAccent = () => (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
    backgroundImage: 'url(/pixel-skyline.svg)',
    backgroundRepeat: 'repeat-x', backgroundPosition: 'bottom',
    backgroundSize: 'auto 80px',
    opacity: .15, pointerEvents: 'none',
  }} />
);

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { token, user } = await authApi.login(formData);
      setToken(token);
      setUser(user);
      navigate('/');
    } catch (err) {
      setError(extractError(err, 'Email atau password salah. Silakan coba lagi.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: '"Montserrat", system-ui, sans-serif',
      background: '#f2f4e8',
    }}>

      {/* ── LEFT: Branding panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex" style={{
        width: '50%', minWidth: 480,
        background: '#1B1B1B',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle dot grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: .04,
          backgroundImage: 'radial-gradient(#C3CA96 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }} />

        {/* Sage glow top-right */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(195,202,150,.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Pixel skyline at bottom */}
        <PixelAccent />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/favicon.png"
            alt="Logo Peken Banyumasan"
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
          />
          <div>
            <div style={{
              fontFamily: '"Clash Display", sans-serif',
              fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1,
            }}>
              Peken Banyumasan
            </div>
            <div style={{ fontSize: 11, color: '#6a7258', marginTop: 3, letterSpacing: '.06em' }}>
              SISTEM MANAJEMEN EVENT
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
            Kelola pengunjung event dengan lebih cerdas.
          </div>
          <p style={{ fontSize: 14, color: '#8a9278', lineHeight: 1.8 }}>
            Pantau data real-time, kelola pengunjung dan optimalkan operasional event Peken Banyumasan dalam satu platform terintegrasi.
          </p>

          {/* Feature dots */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Tap NFC & entri manual pengunjung',
              'Real-time statistik masuk & keluar',
              'Laporan komprehensif per event',
            ].map(text => (
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

      {/* ── RIGHT: Login form ─────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
        position: 'relative',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <img src="/favicon.png" alt="Logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <span style={{ fontFamily: '"Clash Display", sans-serif', fontSize: 16, fontWeight: 600, color: '#1e2010' }}>
              Peken Banyumasan
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: '"Clash Display", sans-serif',
              fontSize: 26, fontWeight: 500, color: '#1e2010',
              margin: '0 0 6px', letterSpacing: '-.01em',
            }}>
              Masuk ke Dashboard
            </h2>
            <p style={{ fontSize: 13, color: '#8a9070', margin: 0 }}>
              Silakan masuk dengan akun admin atau petugas Anda.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              marginBottom: 20, padding: '12px 16px',
              background: '#f7eeee', border: '1px solid #dbb8b8',
              borderRadius: 12, fontSize: 12, color: '#B87272',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <ShieldAlert size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', marginBottom: 6,
                fontSize: 11, fontWeight: 600, color: '#5a6040',
                textTransform: 'uppercase', letterSpacing: '.06em',
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#8a9070', pointerEvents: 'none',
                }} />
                <input
                  type="email" name="email" required
                  value={formData.email} onChange={handleChange}
                  placeholder="nama@email.com"
                  className="peken-input"
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', marginBottom: 6,
                fontSize: 11, fontWeight: 600, color: '#5a6040',
                textTransform: 'uppercase', letterSpacing: '.06em',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#8a9070', pointerEvents: 'none',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'} name="password" required
                  value={formData.password} onChange={handleChange}
                  placeholder="Masukkan password"
                  className="peken-input"
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#8a9070', padding: 4, display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#5a6040'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8a9070'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: isLoading ? '#a8b07a' : '#7a8a52',
                color: '#fff',
                border: 'none', borderRadius: 20,
                padding: '13px 28px',
                fontSize: 13, fontWeight: 700,
                fontFamily: '"Montserrat", sans-serif',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background 180ms ease, box-shadow 180ms ease',
                boxShadow: isLoading ? 'none' : '0 4px 14px rgba(122,138,82,.3)',
                letterSpacing: '.01em',
                width: '100%',
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#4f5c30'; }}
              onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#7a8a52'; }}
            >
              {isLoading ? 'Memproses...' : (
                <><span>Masuk ke Dashboard</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div style={{
            marginTop: 28, paddingTop: 20,
            borderTop: '1px solid #e4e7d4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 11, color: '#8a9070',
          }}>
            <ShieldAlert size={12} />
            Akses dibatasi hanya untuk Panitia dan Petugas Event.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
