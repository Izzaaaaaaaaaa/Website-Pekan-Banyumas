// Login.jsx — Kolaborator Dashboard
// UI: identik dengan Artisan login (split-panel, Lora + DM Sans, warm cream)
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  ArrowRight, Loader2, Calendar, MapPin, Ticket,
  Users, Palette,
} from "lucide-react";
import logobanyumas from "../../assets/images/logo-banyumas.png";
import logo from "../../assets/images/logo.jpeg";
import "../../assets/styles/login.css";
import api from "../../services/api";

const ARTISAN_URL = import.meta.env.VITE_ARTISAN_URL || "http://localhost:5174";

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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Semua field harus diisi!"); return; }
    setLoading(true);
    try {
      await api.auth.login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Email atau password salah!");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-root">
      {/* LEFT PANEL */}
      <div className="login-left">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="dot-grid" />
        <div className="left-content">
          <div className="left-logo-bar">
            <img src={logobanyumas} alt="Kabupaten Banyumas" className="left-logo" />
            <div className="left-logo-divider" />
            <img src={logo} alt="Peken Banyumas" className="left-logo peken" />
          </div>
          <div className="left-badge">
            <span className="badge-dot" />
            Platform Kolaborator Budaya
          </div>
          <h1 className="left-heading">
            Tampilkan karya<br />dan bergabung <em>bersama</em>
          </h1>
          <p className="left-sub">
            Kelola portofolio, ikut event budaya, dan terhubung dengan sesama
            kolaborator kreatif Banyumas Raya melalui platform Peken Banyumasan.
          </p>
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-icon"><Users size={15} color="#86efac" strokeWidth={2} /></div>
              <div className="stat-num">127+</div>
              <div className="stat-label">Kolaborator</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Calendar size={15} color="#86efac" strokeWidth={2} /></div>
              <div className="stat-num">3 Hari</div>
              <div className="stat-label">22–24 Maret 2026</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Ticket size={15} color="#86efac" strokeWidth={2} /></div>
              <div className="stat-num">17</div>
              <div className="stat-label">Subsektor<br/>Budaya</div>
            </div>
          </div>
          <div className="venue-pill">
            <MapPin size={13} color="#86efac" strokeWidth={2} />
            Alun-alun Banyumas, Jawa Tengah
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-card">
          <div className="card-logos">
            <img src={logobanyumas} alt="Kabupaten Banyumas" className="card-logo" />
            <div className="card-logo-sep" />
            <img src={logo} alt="Peken Banyumas" className="card-logo peken" />
          </div>
          <div className="logo-mark">
            <Palette size={24} color="white" strokeWidth={2} />
          </div>
          <h2 className="card-title">Selamat datang!</h2>
          <p className="card-sub">Masuk ke dashboard kolaborator Anda</p>

          {error && (
            <div className="error-box">
              <AlertCircle size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="field-label">Email</label>
              <div className="input-wrap">
                <span className="input-icon"><Mail size={17} strokeWidth={1.8} /></span>
                <input type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="nama@email.com"
                  className="login-input" autoComplete="email" autoFocus />
              </div>
            </div>
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
                  {showPassword ? <EyeOff size={17} strokeWidth={1.8} /> : <Eye size={17} strokeWidth={1.8} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading
                ? <><Loader2 size={18} className="spin" /> Memverifikasi...</>
                : <>Masuk ke Dashboard <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="divider">atau</div>
          <p className="register-row">
            Belum punya akun?{" "}
            <Link to="/daftar" className="register-link">Daftar sebagai Kolaborator</Link>
          </p>
          <p style={{textAlign:'center',fontSize:12,color:'#6b7280',marginTop:8}}>
            Punya usaha artisan?{' '}
            <a href={`${ARTISAN_URL}/login`} style={{color:'#2f6f4e',fontWeight:600,textDecoration:'none'}}>
              Login sebagai Artisan &rarr;
            </a>
          </p>
          <div className="event-strip">
            <div className="event-strip-left">
              <img src={logo} alt="Peken Banyumas" className="event-strip-logo" />
            </div>
            <div>
              <div className="event-name">Peken Banyumas 2026</div>
              <div className="event-detail">22-24 Maret · Alun-alun Banyumas · Masuk Gratis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
