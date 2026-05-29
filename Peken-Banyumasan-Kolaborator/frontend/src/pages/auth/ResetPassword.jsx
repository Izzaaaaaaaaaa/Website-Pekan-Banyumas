// ResetPassword.jsx — Kolaborator Portal
// Target of the Supabase password-reset email link. detectSessionInUrl parses
// the recovery token from the URL into a session; here the user sets a new
// password (supabase.auth.updateUser via authApi.completePasswordReset).
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { authApi } from "../../services/endpoints";
import { extractError } from "../../lib/unwrap";
import logo from "../../assets/logo.png";

const wrap = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dash-bg, #f2f4e8)", padding: 24, fontFamily: "var(--font-body, sans-serif)" };
const card = { background: "#fff", borderRadius: 20, padding: "36px 32px", maxWidth: 420, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.08)", border: "1px solid var(--dash-border, #e4e7d4)" };

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(null); // null=checking · true=recovery session · false=invalid
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let resolved = false;
    const sub = supabase?.auth?.onAuthStateChange?.((_event, session) => {
      if (session) { resolved = true; setReady(true); }
    });
    (async () => {
      try {
        const res = await supabase?.auth?.getSession?.();
        if (res?.data?.session) { resolved = true; setReady(true); }
      } catch { /* ignore */ }
    })();
    const t = setTimeout(() => { if (!resolved) setReady(false); }, 2500);
    return () => { clearTimeout(t); sub?.data?.subscription?.unsubscribe?.(); };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (pass.length < 8) { setError("Password minimal 8 karakter"); return; }
    if (pass !== confirm) { setError("Konfirmasi password tidak cocok"); return; }
    setError(""); setSaving(true);
    try {
      await authApi.completePasswordReset(pass);
      try { await supabase.auth.signOut(); } catch { /* fresh login next */ }
      setDone(true);
    } catch (err) {
      setError(extractError(err, "Gagal mengubah password."));
    } finally {
      setSaving(false);
    }
  };

  const brand = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <img src={logo} alt="Peken Banyumasan" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
      <div>
        <div style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: 16, fontWeight: 600, color: "#1e2010", lineHeight: 1 }}>Reset Password</div>
        <div style={{ fontSize: 10.5, color: "#8a9070", marginTop: 3, letterSpacing: ".06em", textTransform: "uppercase" }}>Portal Kolaborator</div>
      </div>
    </div>
  );

  if (done) {
    return (
      <div style={wrap}><div style={{ ...card, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle2 size={26} color="#166534" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e2010", marginBottom: 10 }}>Password Diperbarui</h2>
        <p style={{ fontSize: 13.5, color: "#5a6040", lineHeight: 1.7, marginBottom: 24 }}>Password Anda berhasil diubah. Silakan masuk dengan password baru.</p>
        <button onClick={() => navigate("/login")} style={{ width: "100%", background: "#7a8a52", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Masuk Sekarang</button>
      </div></div>
    );
  }

  if (ready === false) {
    return (
      <div style={wrap}><div style={{ ...card, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", border: "2px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <AlertCircle size={26} color="#b91c1c" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e2010", marginBottom: 10 }}>Tautan Tidak Valid</h2>
        <p style={{ fontSize: 13.5, color: "#5a6040", lineHeight: 1.7, marginBottom: 24 }}>Tautan reset tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.</p>
        <button onClick={() => navigate("/lupa-pass")} style={{ width: "100%", background: "#7a8a52", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Minta Tautan Baru</button>
      </div></div>
    );
  }

  if (ready === null) {
    return (
      <div style={wrap}><div style={{ ...card, textAlign: "center" }}>
        <Loader2 size={26} className="spin" style={{ color: "#7a8a52", margin: "0 auto 12px", display: "block" }} />
        <p style={{ fontSize: 13.5, color: "#5a6040" }}>Memverifikasi tautan reset…</p>
      </div></div>
    );
  }

  return (
    <div style={wrap}><div style={card}>
      {brand}
      <p style={{ fontSize: 13.5, color: "#5a6040", lineHeight: 1.7, marginBottom: 20 }}>Buat password baru untuk akun Anda.</p>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontSize: 13, color: "#b91c1c" }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}
      <form onSubmit={submit}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#5a6040", marginBottom: 6, display: "block" }}>Password Baru</label>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a9070" }}><Lock size={16} /></span>
          <input type={show ? "text" : "password"} value={pass} autoFocus
            onChange={(e) => { setPass(e.target.value); if (error) setError(""); }}
            placeholder="Min. 8 karakter"
            style={{ width: "100%", padding: "11px 40px 11px 38px", borderRadius: 12, border: "1px solid #e4e7d4", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          <button type="button" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8a9070" }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#5a6040", marginBottom: 6, display: "block" }}>Konfirmasi Password</label>
        <div style={{ position: "relative", marginBottom: 18 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a9070" }}><Lock size={16} /></span>
          <input type={show ? "text" : "password"} value={confirm}
            onChange={(e) => { setConfirm(e.target.value); if (error) setError(""); }}
            placeholder="Ulangi password baru"
            style={{ width: "100%", padding: "11px 12px 11px 38px", borderRadius: 12, border: "1px solid #e4e7d4", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <button type="submit" disabled={saving}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#7a8a52", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? <><Loader2 size={16} className="spin" /> Menyimpan…</> : <><ShieldCheck size={15} /> Simpan Password Baru</>}
        </button>
      </form>
    </div></div>
  );
}
