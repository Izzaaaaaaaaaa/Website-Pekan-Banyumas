import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Semua field harus diisi!");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (form.email === "proyekabadi@gmail.com" && form.password === "123456") {
        localStorage.setItem("isLogin", "true");
        navigate("/");
      } else {
        setError("Email atau password salah!");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f0ede6;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          display: none;
          position: relative;
          width: 48%;
          background: #1e5c3a;
          overflow: hidden;
          flex-direction: column;
          justify-content: flex-end;
          padding: 56px 52px;
        }
        @media (min-width: 900px) { .login-left { display: flex; } }

        /* wavy blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(72px);
          opacity: 0.25;
          pointer-events: none;
        }
        .blob-1 { width: 500px; height: 500px; background: #4ade80; top: -120px; right: -100px; }
        .blob-2 { width: 360px; height: 360px; background: #d97706; bottom: 80px; left: -80px; }
        .blob-3 { width: 260px; height: 260px; background: #86efac; top: 55%; left: 40%; }

        /* dot grid texture */
        .dot-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .left-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          color: #d1fae5;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 24px;
          width: fit-content;
        }
        .left-badge span { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: block; }

        .left-heading {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(32px, 4vw, 46px);
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
          margin-bottom: 20px;
        }
        .left-heading em { color: #86efac; font-style: normal; }

        .left-sub {
          color: rgba(255,255,255,0.65);
          font-size: 15px;
          line-height: 1.75;
          max-width: 360px;
          margin-bottom: 48px;
        }

        /* Stats row */
        .stat-row {
          display: flex;
          gap: 16px;
        }
        .stat-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 18px 22px;
          flex: 1;
        }
        .stat-num {
          font-family: 'Lora', serif;
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
        }

        /* ── RIGHT PANEL ── */
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #f0ede6;
          position: relative;
        }

        /* subtle paper texture */
        .login-right::before {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.6;
        }

        .login-card {
          position: relative;
          background: #ffffff;
          border-radius: 28px;
          padding: 48px 44px;
          width: 100%;
          max-width: 440px;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.05),
            0 8px 24px rgba(0,0,0,0.06),
            0 32px 64px rgba(0,0,0,0.06);
          animation: cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* logo mark */
        .logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #2f855a, #48bb78);
          border-radius: 16px;
          margin-bottom: 28px;
          box-shadow: 0 8px 20px rgba(47,133,90,0.35);
        }
        .logo-mark svg { width: 26px; height: 26px; fill: none; stroke: white; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

        .card-title {
          font-family: 'Lora', serif;
          font-size: 26px;
          font-weight: 700;
          color: #1a2e1f;
          margin-bottom: 6px;
        }
        .card-sub {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 36px;
        }

        /* Error */
        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff1f0;
          border: 1px solid #fca5a5;
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 24px;
          font-size: 13.5px;
          color: #b91c1c;
          font-weight: 500;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        /* Field */
        .field { margin-bottom: 20px; }
        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
        }
        .input-wrap { position: relative; }
        .input-icon {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
          display: flex;
        }
        .input-icon svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

        .login-input {
          width: 100%;
          padding: 13px 14px 13px 44px;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14.5px;
          font-family: 'DM Sans', sans-serif;
          background: #fafafa;
          color: #1a2e1f;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          outline: none;
          -webkit-appearance: none;
        }
        .login-input::placeholder { color: #b0b7c3; }
        .login-input:focus {
          border-color: #2f855a;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(47,133,90,0.12);
        }
        .login-input.has-toggle { padding-right: 46px; }

        .toggle-pw {
          position: absolute;
          right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.15s;
        }
        .toggle-pw:hover { color: #2f855a; }
        .toggle-pw svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

        /* Forgot */
        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -12px;
          margin-bottom: 28px;
        }
        .forgot-link {
          font-size: 12.5px;
          color: #2f855a;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .forgot-link:hover { opacity: 0.7; }

        /* Submit button */
        .btn-submit {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #276749, #2f855a);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 6px 20px rgba(47,133,90,0.38);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          letter-spacing: 0.01em;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(47,133,90,0.45);
        }
        .btn-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 28px 0;
          color: #d1d5db;
          font-size: 12px;
          font-weight: 500;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e9eaeb;
        }

        /* Register CTA */
        .register-row {
          text-align: center;
          font-size: 13.5px;
          color: #6b7280;
        }
        .register-link {
          color: #2f855a;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .register-link:hover { opacity: 0.7; text-decoration: underline; }

        /* Event badge bottom of card */
        .event-strip {
          margin-top: 32px;
          background: linear-gradient(90deg, #f0fdf4, #dcfce7);
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .event-dot {
          width: 36px; height: 36px;
          background: #2f855a;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 16px;
        }
        .event-name {
          font-size: 13px;
          font-weight: 700;
          color: #1a4731;
        }
        .event-detail {
          font-size: 11.5px;
          color: #4b7a5e;
          margin-top: 1px;
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT ── */}
        <div className="login-left">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="dot-grid" />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="left-badge">
              <span />
              Peken Banyumas 2026
            </div>

            <h1 className="left-heading">
              Kelola kios UMKM<br />
              kamu dengan <em>mudah</em>
            </h1>

            <p className="left-sub">
              Pantau stok, transaksi, dan pendapatan — semua dalam satu dashboard yang simpel dan intuitif.
            </p>

            <div className="stat-row">
              <div className="stat-card">
                <div className="stat-num">320+</div>
                <div className="stat-label">UMKM Terdaftar</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">3 Hari</div>
                <div className="stat-label">22–24 Maret 2026</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">100%</div>
                <div className="stat-label">Masuk Gratis</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="login-right">
          <div className="login-card">

            {/* Logo */}
            <div className="logo-mark">
              <svg viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>

            <h2 className="card-title">Selamat datang!</h2>
            <p className="card-sub">Masuk ke dashboard UMKM Anda</p>

            {/* Error */}
            {error && (
              <div className="error-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="field">
                <label className="field-label">Email</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    className="login-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    className="login-input has-toggle"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div className="forgot-row">
                <span className="forgot-link">Lupa password?</span>
              </div>

              {/* Submit */}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <><div className="spinner" /> Memverifikasi...</>
                ) : (
                  <>Masuk ke Dashboard</>
                )}
              </button>
            </form>

            <div className="divider">atau</div>

            <p className="register-row">
              Belum punya akun?{" "}
              <span className="register-link" onClick={() => navigate("/register")}>
                Daftar sekarang
              </span>
            </p>

            {/* Event strip */}
            <div className="event-strip">
              <div className="event-dot">🎪</div>
              <div>
                <div className="event-name">Peken Banyumas 2026</div>
                <div className="event-detail">22–24 Maret · Alun-alun Banyumas · Masuk Gratis</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}