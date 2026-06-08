import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import logo from "../../assets/images/logo.png";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase mengirim token via URL hash (#access_token=...) setelah klik link email.
  // onAuthStateChange akan fire PASSWORD_RECOVERY ketika Supabase memproses hash tersebut.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirm) { setError("Semua field wajib diisi."); return; }
    if (password.length < 6)   { setError("Password minimal 6 karakter."); return; }
    if (password !== confirm)  { setError("Konfirmasi password tidak cocok."); return; }

    setLoading(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); return; }
      setDone(true);
      // Auto-redirect ke login setelah 3 detik
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setError("Gagal mengubah password. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f2f4e8",
      fontFamily: "var(--font-body, sans-serif)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "40px 36px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 4px 32px rgba(0,0,0,.08)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <img src={logo} alt="Peken Banyumas" style={{ width: 44, height: 44, borderRadius: 10 }} />
        </div>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <CheckCircle2 size={48} color="#6E7D47" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Password Berhasil Diubah</h2>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              Kamu akan diarahkan ke halaman login dalam beberapa detik...
            </p>
          </div>
        ) : !sessionReady ? (
          <div style={{ textAlign: "center", color: "#6b7280" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>Memverifikasi tautan reset password...</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Jika halaman ini tidak berubah, pastikan kamu membuka tautan langsung dari email.
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 600, textAlign: "center", marginBottom: 6 }}>
              Buat Password Baru
            </h2>
            <p style={{ color: "#6b7280", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
              Masukkan password baru untuk akunmu.
            </p>

            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#fef2f2", color: "#ef4444",
                borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16,
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Password baru */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Password Baru
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Min. 6 karakter"
                    style={{
                      width: "100%", padding: "10px 40px 10px 38px",
                      border: "1.5px solid #e5e7eb", borderRadius: 8,
                      fontSize: 14, boxSizing: "border-box",
                    }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Konfirmasi Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type={showCf ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                    placeholder="Ulangi password"
                    style={{
                      width: "100%", padding: "10px 40px 10px 38px",
                      border: "1.5px solid #e5e7eb", borderRadius: 8,
                      fontSize: 14, boxSizing: "border-box",
                    }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowCf(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                    {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "12px",
                  background: loading ? "#a3b18a" : "#6E7D47",
                  color: "#fff", border: "none", borderRadius: 8,
                  fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {loading
                  ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Menyimpan...</>
                  : "Simpan Password Baru"
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
