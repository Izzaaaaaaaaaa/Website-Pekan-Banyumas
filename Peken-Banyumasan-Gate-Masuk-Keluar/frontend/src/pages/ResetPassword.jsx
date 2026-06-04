// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, CheckCircle, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { authApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';
import { supabase } from '../lib/supabase';

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

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if we have a valid recovery session.
  // Supabase automatically sets the session from the URL hash fragment.
  useEffect(() => {
    const checkSession = async () => {
      // In Supabase, clicking a recovery link logs the user in automatically
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there's no session and the URL doesn't have an access_token, we can't reset
      if (!session && !window.location.hash.includes('access_token')) {
        setError('Link reset password tidak valid atau sudah kedaluwarsa.');
      }
    };
    checkSession();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleReset = async (e) => {
    e.preventDefault();
    if (!formData.password || !formData.confirmPassword) {
      setError('Semua field wajib diisi');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password baru minimal 8 karakter');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await authApi.setNewPassword({ password_baru: formData.password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(extractError(err, 'Gagal mereset password. Silakan coba lagi atau minta link baru.'));
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
            Keamanan akun Anda sangat penting.
          </div>
          <p style={{ fontSize: 14, color: '#8a9278', lineHeight: 1.8 }}>
            Silakan buat password baru yang kuat dan mudah diingat agar Anda dapat mengakses kembali sistem manajemen Peken Banyumasan.
          </p>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: 10, color: '#3a4030', letterSpacing: '.04em' }}>
          &copy; {new Date().getFullYear()} Panitia Peken Banyumasan
        </div>
      </div>

      {/* ── RIGHT: Reset form ─────────────────────────────────────────── */}
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
              Reset Password
            </h2>
            <p style={{ fontSize: 13, color: '#8a9070', margin: 0 }}>
              Masukkan password baru untuk akun Anda.
            </p>
          </div>

          {/* Messages */}
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

          {success ? (
            <div style={{
              padding: '24px',
              background: '#eef4eb', border: '1px solid #c3ca96',
              borderRadius: 12, textAlign: 'center',
            }}>
              <CheckCircle size={48} className="mx-auto mb-3 text-[#7a8a52]" />
              <h3 className="text-[#1e2010] font-bold mb-1">Password Berhasil Direset</h3>
              <p className="text-sm text-[#5a6040]">Anda akan dialihkan ke dashboard sebentar lagi...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block', marginBottom: 6,
                  fontSize: 11, fontWeight: 600, color: '#5a6040',
                  textTransform: 'uppercase', letterSpacing: '.06em',
                }}>
                  Password Baru
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#8a9070', pointerEvents: 'none',
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'} name="password" required
                    value={formData.password} onChange={handleChange}
                    placeholder="Minimal 8 karakter"
                    className="peken-input"
                    style={{ paddingLeft: 40, paddingRight: 44, width: '100%',
                             border: '1px solid #e4e7d4', borderRadius: '12px', padding: '12px 14px 12px 40px',
                             fontSize: '14px', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#8a9070', padding: 4, display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{
                  display: 'block', marginBottom: 6,
                  fontSize: 11, fontWeight: 600, color: '#5a6040',
                  textTransform: 'uppercase', letterSpacing: '.06em',
                }}>
                  Konfirmasi Password
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#8a9070', pointerEvents: 'none',
                  }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required
                    value={formData.confirmPassword} onChange={handleChange}
                    placeholder="Ulangi password baru"
                    className="peken-input"
                    style={{ paddingLeft: 40, paddingRight: 44, width: '100%',
                             border: '1px solid #e4e7d4', borderRadius: '12px', padding: '12px 14px 12px 40px',
                             fontSize: '14px', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#8a9070', padding: 4, display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                <span>{isLoading ? 'Memproses...' : 'Simpan Password Baru'}</span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
