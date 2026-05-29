// LupaPass.jsx — Kolaborator Portal · email-based password reset (Supabase native)
// Step 1 here (request email). The new password is set on /reset-password,
// reached via the link Supabase emails to the user.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { authApi } from "../../services/endpoints";
import { extractError } from "../../lib/unwrap";
import logo from "../../assets/logo.png";

const wrap = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dash-bg, #f2f4e8)", padding: 24, fontFamily: "var(--font-body, sans-serif)" };
const card = { background: "#fff", borderRadius: 20, padding: "36px 32px", maxWidth: 420, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.08)", border: "1px solid var(--dash-border, #e4e7d4)" };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email wajib diisi"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Format email tidak valid"); return; }
    setError(""); setLoading(true);
    try {
      await authApi.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(extractError(err, "Gagal mengirim email reset. Coba lagi."));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle2 size={26} color="#166534" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e2010", marginBottom: 10 }}>Cek Email Anda</h2>
          <p style={{ fontSize: 13.5, color: "#5a6040", lineHeight: 1.7, marginBottom: 24 }}>
            Jika <strong>{email}</strong> terdaftar, kami telah mengirim tautan untuk mengatur ulang password. Buka tautan itu untuk membuat password baru. Pastikan ejaan email sudah benar, dan cek juga folder spam.
          </p>
          <button onClick={() => navigate("/login")}
            style={{ width: "100%", background: "#7a8a52", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Kembali ke Login
          </button>
          <p style={{ fontSize: 12.5, color: "#8a9070", marginTop: 14 }}>
            Tidak menerima email?{" "}
            <span onClick={() => setSent(false)} style={{ color: "#7a8a52", fontWeight: 600, cursor: "pointer" }}>Kirim ulang</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <img src={logo} alt="Peken Banyumasan" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
          <div>
            <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: 16, fontWeight: 600, color: "#1e2010", lineHeight: 1 }}>Lupa Password</div>
            <div style={{ fontSize: 10.5, color: "#8a9070", marginTop: 3, letterSpacing: ".06em", textTransform: "uppercase" }}>Portal Kolaborator</div>
          </div>
        </div>

        <p style={{ fontSize: 13.5, color: "#5a6040", lineHeight: 1.7, marginBottom: 20 }}>
          Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru.
        </p>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontSize: 13, color: "#b91c1c" }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <form onSubmit={submit}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#5a6040", marginBottom: 6, display: "block" }}>Email</label>
          <div style={{ position: "relative", marginBottom: 18 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a9070" }}><Mail size={16} /></span>
            <input type="email" value={email} autoFocus
              onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
              placeholder="nama@email.com"
              style={{ width: "100%", padding: "11px 12px 11px 38px", borderRadius: 12, border: "1px solid #e4e7d4", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#7a8a52", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 size={16} className="spin" /> Mengirim…</> : <><Send size={15} /> Kirim Tautan Reset</>}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13 }}>
          <span onClick={() => navigate("/login")} style={{ color: "#7a8a52", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ArrowLeft size={14} /> Kembali ke Login
          </span>
        </p>
      </div>
    </div>
  );
}
