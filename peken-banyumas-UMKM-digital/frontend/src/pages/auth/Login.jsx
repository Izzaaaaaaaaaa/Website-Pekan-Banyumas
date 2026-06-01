import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  ArrowRight, Loader2, Store,
} from "lucide-react";
import logobanyumas from "../../assets/images/logo-banyumas.png";
import logo from "../../assets/images/logo.png";
import "../../assets/styles/login.css";

/* ── Left panel decorative sub-components (inline styles, zero class dependency) ── */

const DotGrid = () => (
  <div style={{
    position: "absolute", inset: 0, opacity: 0.04,
    backgroundImage: "radial-gradient(#C3CA96 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    pointerEvents: "none",
  }} />
);

const SageGlow = () => (
  <div style={{
    position: "absolute", top: -80, right: -80,
    width: 320, height: 320, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(195,202,150,.14) 0%, transparent 70%)",
    pointerEvents: "none",
  }} />
);

const PixelSkyline = () => (
  <div style={{
    position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
    backgroundImage: "url(/pixel-skyline.svg)",
    backgroundRepeat: "repeat-x",
    backgroundPosition: "bottom",
    backgroundSize: "auto 80px",
    opacity: 0.12,
    pointerEvents: "none",
  }} />
);

const FEATURES = [
  "Kelola stok dan produk kios secara real-time",
  "Pantau omzet dan transaksi harian dengan mudah",
  "Daftar event dan jadwal tampil di satu tempat",
];

/* ── Main component ── */

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]                 = useState({ email: "", password: "" });
  const [error, setError]               = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Semua field harus diisi!"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Email atau password salah!");
        setLoading(false);
        return;
      }
      // simpan token dan info user
      localStorage.setItem("isLogin", "true");
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("nama", data.nama);
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);
      navigate("/");
    } catch (err) {
      setError("Gagal terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      fontFamily: "var(--font-body)",
      background: "#f2f4e8",
    }}>

      {/* ══════════════════════════════════════════════════════
          LEFT — Branding panel (charcoal dark, inline styles)
          ══════════════════════════════════════════════════════ */}
      <div className="login-left-panel">
        <DotGrid />
        <SageGlow />
        <PixelSkyline />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={logo}
            alt="Peken Banyumasan"
            style={{
              width: 44, height: 44, borderRadius: 10, objectFit: "cover",
              border: "1px solid rgba(255,255,255,.12)",
            }}
          />
          <div>
            <div style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: 18, fontWeight: 600, color: "#fff", lineHeight: 1,
            }}>
              Peken Banyumasan
            </div>
            <div style={{
              fontSize: 10, color: "#5a6258", marginTop: 4,
              letterSpacing: ".08em", textTransform: "uppercase",
            }}>
              Platform Artisan UMKM
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 420 }}>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: 32, fontWeight: 400, color: "#fff",
            lineHeight: 1.25, marginBottom: 20, letterSpacing: "-.01em",
          }}>
            Wujudkan karya artisanmu bersama kami.
          </div>
          <p style={{ fontSize: 14, color: "#8a9278", lineHeight: 1.8, margin: 0 }}>
            Platform khusus artisan Peken Banyumas — kelola kios, pantau penjualan,
            dan tampilkan produk terbaikmu dalam satu dasbor yang simpel dan terintegrasi.
          </p>

          {/* Feature bullets */}
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
            {FEATURES.map(text => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#C3CA96", flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: "#8a9278" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: "relative", zIndex: 1,
          fontSize: 10, color: "#3a4030", letterSpacing: ".04em",
        }}>
          &copy; 2026 Panitia Peken Banyumasan
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT — Login form (CSS classes, light krem)
          ══════════════════════════════════════════════════════ */}
      <div className="login-right">
        <div style={{ position: 'absolute', top: 16, right: 20 }}>
          <span
            onClick={() => navigate("/")}
            style={{
              fontSize: 12,
              color: "#8a9070",
              cursor: "pointer"
            }}
          >
            ← Beranda Publik
          </span>
        </div>
        <div className="login-card">

          {/* Mobile logo (hidden on desktop) */}
          <div className="card-logos">
            <img src={logobanyumas} alt="Kabupaten Banyumas" className="card-logo" />
            <div className="card-logo-sep" />
            <img src={logo} alt="Peken Banyumas" className="card-logo peken" />
          </div>

          {/* Icon mark */}
          <div className="logo-mark">
            <Store size={24} color="white" strokeWidth={2} />
          </div>

          <h2 className="card-title">Selamat datang!</h2>
          <p className="card-sub">Masuk ke dashboard artisan Anda</p>

          {/* Error */}
          {error && (
            <div className="error-box">
              <AlertCircle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>

            <div className="field">
              <label className="field-label">Email</label>
              <div className="input-wrap">
                <span className="input-icon"><Mail size={16} strokeWidth={1.8} /></span>
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="nama@email.com"
                  className="login-input" autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon"><Lock size={16} strokeWidth={1.8} /></span>
                <input
                  type={showPassword ? "text" : "password"} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="Masukkan password"
                  className="login-input has-toggle" autoComplete="current-password"
                />
                <button
                  type="button" className="toggle-pw"
                  onClick={() => setShowPassword(p => !p)} tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff size={16} strokeWidth={1.8} />
                    : <Eye    size={16} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            <div className="forgot-row">
              <span className="forgot-link" onClick={() => navigate("/lupa-pass")}>
                Lupa password?
              </span>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading
                ? <><Loader2 size={16} className="spin" /> Memverifikasi...</>
                : <>Masuk ke Dashboard <ArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Divider */}
          <div className="divider">atau</div>

          {/* Register CTA */}
          <p className="register-row">
            Belum punya akun?{" "}
            <span className="register-link" onClick={() => navigate("/register")}>
              Daftar sebagai Artisan
            </span>
          </p>

          {/* Event strip — static */}
          <div className="event-strip">
            <div className="event-strip-left">
              <img src={logo} alt="Peken Banyumas" className="event-strip-logo" />
            </div>
            <div>
              <div className="event-name">Peken Banyumas</div>
              <div className="event-detail">22–24 Maret · Taman Sari Kota Lama Banyumas · Masuk Gratis</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}