import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Send, ArrowLeft, CheckCircle2,
  AlertCircle, Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import logobanyumas from "../../assets/images/logo-banyumas.png";
import logo         from "../../assets/images/logo.png";
import "../../assets/styles/lupapass.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail]           = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [serverError, setServerError] = useState("");

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email wajib diisi");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setEmailError("Format email tidak valid");
      return;
    }

    setEmailError("");
    setServerError("");
    setLoading(true);

    try {
      // Supabase kirim email reset password gratis — tidak perlu call BE
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Supabase tidak membedakan email terdaftar / tidak demi keamanan —
        // tetap tampilkan sukses agar tidak bocorkan info akun
        console.error("[LupaPass] resetPasswordForEmail error:", error.message);
      }

      // Selalu tampilkan sukses (best practice anti-enumeration)
      setSent(true);
    } catch {
      setServerError("Gagal terhubung. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-root">
      <div className="fp-blob fp-blob-1" />
      <div className="fp-blob fp-blob-2" />
      <div className="fp-dot-grid" />

      <div className="fp-wrapper">

        <div className="fp-brand">
          <img src={logobanyumas} alt="Kabupaten Banyumas" className="fp-brand-logo" />
          <div className="fp-brand-sep" />
          <img src={logo} alt="Peken Banyumas" className="fp-brand-logo peken" />
        </div>

        <div className="fp-card">

          {sent ? (
            <div className="fp-success">
              <div className="fp-success-icon">
                <CheckCircle2 size={36} strokeWidth={2} />
              </div>

              <h2 className="fp-title">Email Terkirim!</h2>
              <p className="fp-desc">
                Jika email <strong>{email}</strong> terdaftar, tautan reset password
                sudah dikirim.<br />
                Periksa kotak masuk atau folder spam kamu.
              </p>

              <div className="fp-success-bar">
                <div className="fp-success-bar-fill" />
              </div>

              <button className="fp-btn-primary" onClick={() => navigate("/login")}>
                Kembali ke Login <ArrowLeft size={16} />
              </button>

              <button
                className="fp-btn-ghost"
                onClick={() => { setSent(false); setEmail(""); }}
              >
                Kirim ulang ke email lain
              </button>
            </div>

          ) : (
            <>
              <div className="fp-icon-wrap">
                <Mail size={22} color="white" strokeWidth={2} />
              </div>

              <h2 className="fp-title">Lupa Password?</h2>
              <p className="fp-desc">
                Masukkan email akun kamu. Kami akan mengirim tautan untuk membuat password baru.
              </p>

              {serverError && (
                <div className="fp-err" style={{ marginBottom: 16 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="fp-field">
                  <label className="fp-label" htmlFor="fp-email">Email</label>
                  <div className="fp-input-wrap">
                    <span className="fp-input-icon">
                      <Mail size={17} strokeWidth={1.8} />
                    </span>
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                        setServerError("");
                      }}
                      placeholder="nama@email.com"
                      className={`fp-input${emailError ? " err" : ""}`}
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                  {emailError && (
                    <div className="fp-err">
                      <AlertCircle size={12} />
                      {emailError}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="fp-btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? <><Loader2 size={17} className="spin" /> Mengirim...</>
                    : <><Send size={16} /> Kirim Tautan Reset</>
                  }
                </button>
              </form>

              <button className="fp-btn-ghost" onClick={() => navigate("/login")}>
                <ArrowLeft size={15} /> Kembali ke Login
              </button>
            </>
          )}
        </div>

        <p className="fp-footer">
          Ingat password kamu?{" "}
          <span className="fp-footer-link" onClick={() => navigate("/login")}>
            Masuk di sini
          </span>
        </p>

      </div>
    </div>
  );
}
