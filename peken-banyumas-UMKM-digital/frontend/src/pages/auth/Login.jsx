import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  ArrowRight, Loader2, Calendar, MapPin, Ticket,
  Users, Store,
} from "lucide-react";
import logobanyumas from "../../assets/images/logo-banyumas.png";
import logo from "../../assets/images/logo.jpeg";
import "../../assets/styles/login.css";

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

  const handleLogin = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Semua field harus diisi!"); return; }
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
    <div className="login-root">

      {/* ═══════════════════════════════ */}
      {/*  LEFT PANEL                     */}
      {/* ═══════════════════════════════ */}
      <div className="login-left">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="dot-grid" />

        <div className="left-content">

          {/* Logos */}
          <div className="left-logo-bar">
            <img src={logobanyumas} alt="Kabupaten Banyumas" className="left-logo" />
            <div className="left-logo-divider" />
            <img src={logo} alt="Peken Banyumas" className="left-logo peken" />
          </div>

          {/* Badge */}
          <div className="left-badge">
            <span className="badge-dot" />
            Peken Banyumas 2026
          </div>

          {/* Headline */}
          <h1 className="left-heading">
            Wujudkan karya<br />artisanmu bersama <em>kami</em>
          </h1>

          {/* Sub */}
          <p className="left-sub">
            Platform khusus artisan Peken Banyumas kelola kios, pantau penjualan,
            dan tampilkan produk terbaikmu dalam satu dasbor yang simpel dan intuitif.
          </p>

          {/* Stats */}
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-icon"><Users    size={15} color="#86efac" strokeWidth={2} /></div>
              <div className="stat-num">320+</div>
              <div className="stat-label">Artisan Terdaftar</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Calendar size={15} color="#86efac" strokeWidth={2} /></div>
              <div className="stat-num">3 Hari</div>
              <div className="stat-label">22–24 Maret 2026</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Ticket   size={15} color="#86efac" strokeWidth={2} /></div>
              <div className="stat-num">100%</div>
              <div className="stat-label">Masuk Gratis</div>
            </div>
          </div>

          {/* Venue */}
          <div className="venue-pill">
            <MapPin size={13} color="#86efac" strokeWidth={2} />
            Alun-alun Banyumas, Jawa Tengah
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════ */}
      {/*  RIGHT PANEL                    */}
      {/* ═══════════════════════════════ */}
      <div className="login-right">
        <div className="login-card">

          {/* Mobile-only logos */}
          <div className="card-logos">
            <img src={logobanyumas} alt="Kabupaten Banyumas" className="card-logo" />
            <div className="card-logo-sep" />
            <img src={logo} alt="Peken Banyumas" className="card-logo peken" />
          </div>

          {/* Store icon mark */}
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

            {/* Email */}
            <div className="field">
              <label className="field-label">Email</label>
              <div className="input-wrap">
                <span className="input-icon"><Mail size={17} strokeWidth={1.8} /></span>
                <input type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="nama@email.com"
                  className="login-input" autoComplete="email" />
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon"><Lock size={17} strokeWidth={1.8} /></span>
                <input type={showPassword ? "text" : "password"} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="Masukkan password"
                  className="login-input has-toggle" autoComplete="current-password" />
                <button type="button" className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword
                    ? <EyeOff size={17} strokeWidth={1.8} />
                    : <Eye    size={17} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="forgot-row">
              <span 
                className="forgot-link" 
                onClick={() => navigate("/lupa-pass")}
              >
                Lupa password?
              </span>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading
                ? <><Loader2 size={18} className="spin" /> Memverifikasi...</>
                : <>Masuk ke Dashboard <ArrowRight size={17} /></>
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

          {/* Event strip */}
          <div className="event-strip">
            <div className="event-strip-left">
              <img src={logo} alt="Peken Banyumas" className="event-strip-logo" />
            </div>
            <div>
              <div className="event-name">Peken Banyumas 2026</div>
              <div className="event-detail">22–24 Maret · Alun-alun Banyumas · Masuk Gratis</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}