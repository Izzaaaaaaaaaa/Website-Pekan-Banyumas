import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone, MessageCircle, KeyRound, Lock, Eye, EyeOff,
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  Loader2, RefreshCw, ShieldCheck,
} from "lucide-react";
import logobanyumas from "../../assets/images/logo-banyumas.png";
import logo         from "../../assets/images/logo.jpeg";
import "../../assets/styles/lupapass.css";

/* ─── CONFIG ─── */
const ADMIN_PHONE = "6282192058122"; // nomor WA admin
const OTP_LENGTH  = 4;
const DUMMY_OTP   = "1234"; // untuk simulasi — di produksi admin kirim manual

/* ─── STEPS ─── */
const STEPS = [
  { id: 1, label: "No. HP",    Icon: Phone },
  { id: 2, label: "Kirim WA", Icon: MessageCircle },
  { id: 3, label: "Kode OTP", Icon: KeyRound },
  { id: 4, label: "Password Baru", Icon: Lock },
];

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]       = useState(1);
  const [phone, setPhone]     = useState("");
  const [phoneError, setPhoneError] = useState("");

  // OTP state — array of single chars
  const [otp, setOtp]         = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  // New password state
  const [newPass, setNewPass]       = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passError, setPassError]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);

  /* ── cooldown timer ── */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* ── STEP 1: validate phone ── */
  const handlePhoneNext = () => {
    const clean = phone.replace(/\D/g, "");
    if (!clean) { setPhoneError("Nomor HP wajib diisi"); return; }
    if (clean.length < 9 || clean.length > 15) { setPhoneError("Nomor HP tidak valid"); return; }
    setPhoneError("");
    setStep(2);
  };

  /* ── STEP 2: open WA ── */
  const handleOpenWA = () => {
    const clean = phone.replace(/\D/g, "");
    const msg   = `Halo Admin Peken Banyumas,\n\nSaya ingin mereset password akun artisan saya.\n\n📱 *No. HP Terdaftar:* ${phone}\n\nMohon kirimkan kode OTP untuk reset password. Terima kasih!`;
    window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
    setResendCooldown(60);
  };

  const handleWANext = () => setStep(3);

  /* ── STEP 3: OTP input ── */
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return; // digits only
    const next = [...otp];
    next[idx]  = val.slice(-1); // max 1 char
    setOtp(next);
    setOtpError("");
    // auto-focus next
    if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    e.preventDefault();
  };

  const handleVerifyOtp = () => {
    const entered = otp.join("");
    if (entered.length < OTP_LENGTH) { setOtpError("Masukkan kode OTP lengkap"); return; }
    setOtpVerifying(true);
    setTimeout(() => {
      if (entered === DUMMY_OTP) {
        setOtpError("");
        setOtpVerifying(false);
        setStep(4);
      } else {
        setOtpError("Kode OTP salah. Coba lagi.");
        setOtpVerifying(false);
        setOtp(Array(OTP_LENGTH).fill(""));
        otpRefs.current[0]?.focus();
      }
    }, 1000);
  };

  /* ── STEP 4: new password ── */
  const handleSavePassword = () => {
    if (!newPass) { setPassError("Password baru wajib diisi"); return; }
    if (newPass.length < 6) { setPassError("Password minimal 6 karakter"); return; }
    if (newPass !== confirmPass) { setPassError("Konfirmasi password tidak cocok"); return; }
    setPassError("");
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setDone(true);
      // redirect to login after 2s
      setTimeout(() => navigate("/login"), 2200);
    }, 1200);
  };

  /* ── password strength ── */
  const strength = (() => {
    if (!newPass) return 0;
    let s = 0;
    if (newPass.length >= 6)  s++;
    if (newPass.length >= 10) s++;
    if (/[A-Z]/.test(newPass)) s++;
    if (/[0-9]/.test(newPass)) s++;
    if (/[^A-Za-z0-9]/.test(newPass)) s++;
    return s;
  })();

  const strengthLabel = ["", "Lemah", "Cukup", "Sedang", "Kuat", "Sangat Kuat"][strength] || "";
  const strengthColor = ["", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#16a34a"][strength] || "";

  return (
    <div className="fp-root">

      {/* ── Background blobs ── */}
      <div className="fp-blob fp-blob-1" />
      <div className="fp-blob fp-blob-2" />
      <div className="fp-dot-grid" />

      <div className="fp-wrapper">

        {/* ── Brand ── */}
        <div className="fp-brand">
          <img src={logobanyumas} alt="Kabupaten Banyumas" className="fp-brand-logo" />
          <div className="fp-brand-sep" />
          <img src={logo} alt="Peken Banyumas" className="fp-brand-logo peken" />
        </div>

        {/* ── Stepper ── */}
        <div className="fp-stepper">
          {STEPS.map(({ id, label, Icon }) => {
            const isDone   = step > id;
            const isActive = step === id;
            return (
              <div key={id} className={`fp-step${isDone ? " done" : ""}${isActive ? " active" : ""}`}>
                <div className="fp-step-circle">
                  {isDone
                    ? <CheckCircle2 size={14} strokeWidth={2.5} />
                    : <Icon         size={14} strokeWidth={2} />
                  }
                </div>
                <div className="fp-step-label">{label}</div>
              </div>
            );
          })}
        </div>

        {/* ── Progress bar ── */}
        <div className="fp-progress-wrap">
          <div className="fp-progress-fill" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
        </div>

        {/* ══════════════════════════════════════ */}
        {/*  CARD                                  */}
        {/* ══════════════════════════════════════ */}
        <div className="fp-card" key={step}>

          {/* ── STEP 1: Input No. HP ── */}
          {step === 1 && (
            <>
              <div className="fp-icon-wrap">
                <Phone size={22} color="white" strokeWidth={2} />
              </div>
              <h2 className="fp-title">Lupa Password?</h2>
              <p className="fp-desc">
                Masukkan nomor HP yang terdaftar pada akun artisanmu. Admin akan mengirimkan kode OTP melalui WhatsApp.
              </p>

              <div className="fp-field">
                <label className="fp-label">Nomor HP Terdaftar</label>
                <div className="fp-input-wrap">
                  <span className="fp-input-icon"><Phone size={17} strokeWidth={1.8} /></span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handlePhoneNext()}
                    placeholder="08xxxxxxxxxx"
                    className={`fp-input${phoneError ? " err" : ""}`}
                    autoFocus
                  />
                </div>
                {phoneError && <div className="fp-err"><AlertCircle size={12} />{phoneError}</div>}
                <p className="fp-hint">
                  Gunakan nomor HP yang kamu daftarkan saat membuat akun artisan.
                </p>
              </div>

              <button className="fp-btn-primary" onClick={handlePhoneNext}>
                Lanjut <ArrowRight size={16} />
              </button>

              <button className="fp-btn-ghost" onClick={() => navigate("/login")}>
                <ArrowLeft size={15} /> Kembali ke Login
              </button>
            </>
          )}

          {/* ── STEP 2: Buka WA Admin ── */}
          {step === 2 && (
            <>
              <div className="fp-icon-wrap wa">
                <MessageCircle size={22} color="white" strokeWidth={2} />
              </div>
              <h2 className="fp-title">Hubungi Admin via WhatsApp</h2>
              <p className="fp-desc">
                Klik tombol di bawah untuk membuka WhatsApp dan mengirim permintaan reset password ke admin. Admin akan membalas dengan kode OTP 4 digit.
              </p>

              {/* Info card */}
              <div className="fp-wa-card">
                <div className="fp-wa-header">
                  <div className="fp-wa-avatar">
                    <img src={logo} alt="Admin" />
                  </div>
                  <div>
                    <div className="fp-wa-name">Admin Peken Banyumas</div>
                    <div className="fp-wa-status">
                      <span className="fp-wa-dot" /> Online
                    </div>
                  </div>
                </div>
                <div className="fp-wa-bubble">
                  <span>Halo Admin, saya ingin reset password akun artisan saya.</span>
                  <span>📱 No. HP: <strong>{phone}</strong></span>
                  <span>Mohon kirimkan kode OTP. Terima kasih!</span>
                </div>
              </div>

              <button className="fp-btn-wa" onClick={handleOpenWA}>
                <MessageCircle size={18} /> Buka WhatsApp Admin
              </button>

              {resendCooldown > 0 ? (
                <p className="fp-cooldown">
                  Kirim ulang dalam {resendCooldown} detik...
                </p>
              ) : (
                <button className="fp-btn-resend" onClick={handleOpenWA}>
                  <RefreshCw size={13} /> Kirim ulang permintaan
                </button>
              )}

              <div className="fp-divider" />

              <p className="fp-wa-note">
                Sudah menerima kode OTP dari admin?
              </p>
              <button className="fp-btn-primary" onClick={handleWANext}>
                Sudah Terima Kode OTP <ArrowRight size={16} />
              </button>

              <button className="fp-btn-ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={15} /> Kembali
              </button>
            </>
          )}

          {/* ── STEP 3: Input OTP ── */}
          {step === 3 && (
            <>
              <div className="fp-icon-wrap otp">
                <KeyRound size={22} color="white" strokeWidth={2} />
              </div>
              <h2 className="fp-title">Masukkan Kode OTP</h2>
              <p className="fp-desc">
                Masukkan kode <strong>{OTP_LENGTH} digit</strong> yang sudah dikirimkan admin melalui WhatsApp ke nomor <strong>{phone}</strong>.
              </p>

              {/* OTP boxes */}
              <div className="fp-otp-row" onPaste={handleOtpPaste}>
                {otp.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className={`fp-otp-box${val ? " filled" : ""}${otpError ? " err" : ""}`}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {otpError && (
                <div className="fp-err center">
                  <AlertCircle size={13} />{otpError}
                </div>
              )}

              <p className="fp-hint center">
                Kode OTP berlaku selama 10 menit. Jika belum menerima, hubungi admin kembali.
              </p>

              <button
                className="fp-btn-primary"
                onClick={handleVerifyOtp}
                disabled={otpVerifying || otp.join("").length < OTP_LENGTH}
              >
                {otpVerifying
                  ? <><Loader2 size={17} className="spin" /> Memverifikasi...</>
                  : <>Verifikasi OTP <ShieldCheck size={16} /></>
                }
              </button>

              <button className="fp-btn-ghost" onClick={() => { setOtp(Array(OTP_LENGTH).fill("")); setStep(2); }}>
                <ArrowLeft size={15} /> Kembali
              </button>

              {/* Simulasi label */}
              <div className="fp-sim-note">
                <span>🔧 Simulasi: gunakan kode <strong>{DUMMY_OTP}</strong></span>
              </div>
            </>
          )}

          {/* ── STEP 4: Password Baru / Done ── */}
          {step === 4 && (
            <>
              {done ? (
                /* Success state */
                <div className="fp-success">
                  <div className="fp-success-icon">
                    <CheckCircle2 size={36} color="#2f855a" strokeWidth={2} />
                  </div>
                  <h2 className="fp-title">Password Berhasil Diubah!</h2>
                  <p className="fp-desc">
                    Password akun artisanmu sudah diperbarui. Kamu akan diarahkan ke halaman login secara otomatis.
                  </p>
                  <div className="fp-success-bar">
                    <div className="fp-success-bar-fill" />
                  </div>
                  <button className="fp-btn-primary" onClick={() => navigate("/login")}>
                    Masuk Sekarang <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="fp-icon-wrap newpass">
                    <Lock size={22} color="white" strokeWidth={2} />
                  </div>
                  <h2 className="fp-title">Buat Password Baru</h2>
                  <p className="fp-desc">
                    Buat password baru yang kuat untuk mengamankan akun artisanmu.
                  </p>

                  {/* New Password */}
                  <div className="fp-field">
                    <label className="fp-label">Password Baru</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon"><Lock size={17} strokeWidth={1.8} /></span>
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPass}
                        onChange={(e) => { setNewPass(e.target.value); setPassError(""); }}
                        placeholder="Min. 6 karakter"
                        className={`fp-input with-toggle${passError ? " err" : ""}`}
                      />
                      <button type="button" className="fp-toggle" onClick={() => setShowNew((p) => !p)}>
                        {showNew ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {newPass && (
                      <div className="fp-strength">
                        <div className="fp-strength-bars">
                          {[1,2,3,4,5].map((n) => (
                            <div
                              key={n}
                              className="fp-strength-bar"
                              style={{ background: n <= strength ? strengthColor : "#e5e7eb" }}
                            />
                          ))}
                        </div>
                        <span className="fp-strength-label" style={{ color: strengthColor }}>
                          {strengthLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="fp-field">
                    <label className="fp-label">Konfirmasi Password</label>
                    <div className="fp-input-wrap">
                      <span className="fp-input-icon"><Lock size={17} strokeWidth={1.8} /></span>
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPass}
                        onChange={(e) => { setConfirmPass(e.target.value); setPassError(""); }}
                        placeholder="Ulangi password baru"
                        className={`fp-input with-toggle${passError ? " err" : ""}`}
                      />
                      <button type="button" className="fp-toggle" onClick={() => setShowConfirm((p) => !p)}>
                        {showConfirm ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                      </button>
                    </div>

                    {/* Match indicator */}
                    {confirmPass && (
                      <div className={`fp-match${newPass === confirmPass ? " match" : " no-match"}`}>
                        {newPass === confirmPass
                          ? <><CheckCircle2 size={12} /> Password cocok</>
                          : <><AlertCircle  size={12} /> Password tidak cocok</>
                        }
                      </div>
                    )}
                  </div>

                  {passError && (
                    <div className="fp-err">
                      <AlertCircle size={12} />{passError}
                    </div>
                  )}

                  <button className="fp-btn-primary" onClick={handleSavePassword} disabled={saving}>
                    {saving
                      ? <><Loader2 size={17} className="spin" /> Menyimpan...</>
                      : <>Simpan Password Baru <ArrowRight size={16} /></>
                    }
                  </button>

                  <button className="fp-btn-ghost" onClick={() => setStep(3)}>
                    <ArrowLeft size={15} /> Kembali
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="fp-footer">
          Ingat password kamu?{" "}
          <span className="fp-footer-link" onClick={() => navigate("/login")}>Masuk di sini</span>
        </p>
      </div>
    </div>
  );
}