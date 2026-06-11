import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, XCircle, CheckCircle2,
  CheckCircle, Search, Lock, AlertTriangle,
  Phone, Package, CalendarDays, ArrowRight,
  RefreshCw, LogOut, FileCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import logo from "../../assets/images/logo.png";

/* ─────────────────────────────────────────────────────────────
   Inline CSS — sepenuhnya menggunakan token design system
   Peken Banyumasan (colors_and_type.css sudah di-load global)
───────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap');

  *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* Page */
  .sv-root {
    min-height: 100vh;
    background: var(--dash-bg, #f2f4e8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-8, 40px) var(--sp-4, 16px);
    font-family: var(--font-body, "Montserrat", sans-serif);
    position: relative;
    overflow: hidden;
  }

  /* Decorative background blobs */
  .sv-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      radial-gradient(ellipse at 20% 20%, rgba(195,202,150,.12) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 80%, rgba(122,138,82,.08) 0%, transparent 55%);
    pointer-events: none;
  }

  /* Card */
  .sv-card {
    position: relative;
    background: var(--dash-surface, #fff);
    border: 1px solid var(--dash-border, #e4e7d4);
    border-radius: var(--r-lg, 16px);
    padding: var(--sp-9, 48px) var(--sp-8, 40px);
    width: 100%;
    max-width: 480px;
    box-shadow: var(--shadow-lg, 0 8px 24px rgba(30,32,16,.10));
    text-align: center;
    animation: sv-card-in var(--dur-slow, 560ms) var(--ease-out, cubic-bezier(.22,.61,.36,1)) both;
  }
  @keyframes sv-card-in {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 520px) {
    .sv-card { padding: var(--sp-7, 32px) var(--sp-6, 24px); }
  }

  /* Brand header */
  .sv-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-3, 12px);
    margin-bottom: var(--sp-8, 40px);
  }
  .sv-brand-logo {
    width: 36px;
    height: 36px;
    border-radius: var(--r-md, 12px);
    object-fit: cover;
    border: 1px solid var(--dash-border, #e4e7d4);
    box-shadow: var(--shadow-sm);
  }
  .sv-brand-name {
    font-family: var(--font-body, "Montserrat", sans-serif);
    font-size: var(--fs-14, 14px);
    font-weight: 700;
    color: var(--dash-text-primary, #1e2010);
    line-height: 1;
  }
  .sv-brand-sub {
    font-size: var(--fs-11, 11px);
    color: var(--dash-text-muted, #8a9070);
    margin-top: 3px;
    letter-spacing: var(--ls-wide, .06em);
    text-transform: uppercase;
  }

  /* Status icon ring */
  .sv-icon-ring {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--sp-6, 24px);
    animation: sv-pop var(--dur-base, 320ms) .12s var(--ease-out, cubic-bezier(.22,.61,.36,1)) both;
  }
  @keyframes sv-pop {
    from { opacity: 0; transform: scale(.55); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* Pending — amber/warning palette */
  .sv-icon-ring.pending {
    background: var(--dash-warning-bg, #f7f2e4);
    box-shadow: 0 0 0 8px rgba(196,162,77,.14);
  }
  /* Ditolak — error palette */
  .sv-icon-ring.rejected {
    background: var(--dash-error-bg, #f7eeee);
    box-shadow: 0 0 0 8px rgba(184,114,114,.14);
  }
  /* Disetujui — success palette */
  .sv-icon-ring.approved {
    background: var(--dash-success-bg, #eef4eb);
    box-shadow: 0 0 0 8px rgba(122,155,106,.14);
  }

  /* Spin animation for pending Clock icon */
  .sv-icon-spin {
    animation: sv-icon-rotate 8s linear infinite;
  }
  @keyframes sv-icon-rotate { to { transform: rotate(360deg); } }

  /* Badge pill */
  .sv-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2, 8px);
    padding: 5px var(--sp-4, 16px);
    border-radius: var(--r-full, 9999px);
    font-size: var(--fs-12, 12px);
    font-weight: 700;
    letter-spacing: var(--ls-label, .02em);
    margin-bottom: var(--sp-3, 12px);
    text-transform: uppercase;
  }
  .sv-badge-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .sv-badge.pending  {
    background: var(--dash-warning-bg, #f7f2e4);
    color: var(--dash-warning, #C4A24D);
    border: 1px solid var(--dash-warning-border, #dcc882);
  }
  .sv-badge.rejected {
    background: var(--dash-error-bg, #f7eeee);
    color: var(--dash-error, #B87272);
    border: 1px solid var(--dash-error-border, #dbb8b8);
  }
  .sv-badge.approved {
    background: var(--dash-success-bg, #eef4eb);
    color: var(--dash-success, #7A9B6A);
    border: 1px solid var(--dash-success-border, #b8d4b0);
  }
  .sv-badge-dot.pending  { background: var(--dash-warning, #C4A24D); animation: sv-pulse 2s ease-in-out infinite; }
  .sv-badge-dot.rejected { background: var(--dash-error, #B87272); }
  .sv-badge-dot.approved { background: var(--dash-success, #7A9B6A); }
  @keyframes sv-pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }

  /* Title & description */
  .sv-title {
    font-family: var(--font-body, "Montserrat", sans-serif);
    font-size: var(--fs-20, 20px);
    font-weight: 700;
    color: var(--dash-text-primary, #1e2010);
    margin-bottom: var(--sp-2, 8px);
    line-height: var(--lh-snug, 1.3);
  }
  .sv-desc {
    font-size: var(--fs-13, 13px);
    color: var(--dash-text-secondary, #5a6040);
    line-height: var(--lh-relaxed, 1.7);
    margin-bottom: var(--sp-6, 24px);
    max-width: 340px;
    margin-left: auto;
    margin-right: auto;
  }

  /* Info card / infobox */
  .sv-info-card {
    background: var(--dash-surface-hover, #f7f8f2);
    border: 1px solid var(--dash-border, #e4e7d4);
    border-radius: var(--r-md, 12px);
    padding: var(--sp-4, 16px) var(--sp-5, 20px);
    margin-bottom: var(--sp-6, 24px);
    text-align: left;
  }
  .sv-info-row {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3, 12px);
    font-size: var(--fs-13, 13px);
    color: var(--dash-text-secondary, #5a6040);
    line-height: var(--lh-normal, 1.5);
  }
  .sv-info-row + .sv-info-row { margin-top: var(--sp-3, 12px); }
  .sv-info-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    margin-top: 1px;
  }
  .sv-info-icon.warning { background: var(--dash-warning-bg, #f7f2e4); color: var(--dash-warning, #C4A24D); }
  .sv-info-icon.info    { background: var(--dash-info-bg, #eaf0f4);    color: var(--dash-info, #6B8FA3); }
  .sv-info-icon.error   { background: var(--dash-error-bg, #f7eeee);   color: var(--dash-error, #B87272); }
  .sv-info-icon.success { background: var(--dash-success-bg, #eef4eb); color: var(--dash-success, #7A9B6A); }

  /* Rejection reason box */
  .sv-reject-reason {
    background: var(--dash-error-bg, #f7eeee);
    border: 1px solid var(--dash-error-border, #dbb8b8);
    border-radius: var(--r-md, 12px);
    padding: var(--sp-4, 16px) var(--sp-5, 20px);
    margin-bottom: var(--sp-6, 24px);
    text-align: left;
  }
  .sv-reject-reason-label {
    font-size: var(--fs-11, 11px);
    font-weight: 700;
    color: var(--dash-error, #B87272);
    text-transform: uppercase;
    letter-spacing: var(--ls-wide, .06em);
    margin-bottom: var(--sp-2, 8px);
  }
  .sv-reject-reason-text {
    font-size: var(--fs-13, 13px);
    color: var(--dash-text-secondary, #5a6040);
    line-height: var(--lh-relaxed, 1.7);
  }

  /* Divider */
  .sv-divider {
    height: 1px;
    background: var(--dash-border, #e4e7d4);
    margin: var(--sp-6, 24px) 0;
  }

  /* Buttons */
  .sv-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2, 8px);
    width: 100%;
    padding: 13px var(--sp-5, 20px);
    background: var(--dash-accent-dark, #7A8A52);
    color: var(--peken-white, #fff);
    border: none;
    border-radius: var(--r-xl, 20px);
    font-family: var(--font-body, "Montserrat", sans-serif);
    font-size: var(--fs-14, 14px);
    font-weight: 700;
    cursor: pointer;
    transition: background var(--dur-fast, 180ms) var(--ease-out),
                box-shadow var(--dur-fast, 180ms) var(--ease-out),
                transform var(--dur-fast, 180ms) var(--ease-out);
    box-shadow: var(--shadow-accent, 0 4px 14px rgba(122,138,82,.25));
    margin-bottom: var(--sp-3, 12px);
  }
  .sv-btn-primary:hover {
    background: var(--dash-accent-deeper, #4f5c30);
    box-shadow: 0 6px 20px rgba(79,92,48,.32);
    transform: translateY(-1px);
  }

  .sv-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2, 8px);
    width: 100%;
    padding: 12px var(--sp-5, 20px);
    background: transparent;
    color: var(--dash-accent-dark, #7A8A52);
    border: 1.5px solid var(--dash-accent-border, #c8d09a);
    border-radius: var(--r-xl, 20px);
    font-family: var(--font-body, "Montserrat", sans-serif);
    font-size: var(--fs-14, 14px);
    font-weight: 600;
    cursor: pointer;
    transition: background var(--dur-fast, 180ms) var(--ease-out),
                transform var(--dur-fast, 180ms) var(--ease-out);
    margin-bottom: var(--sp-3, 12px);
  }
  .sv-btn-ghost:hover {
    background: var(--dash-accent-bg, #eef0e0);
    transform: translateY(-1px);
  }

  /* Footer note */
  .sv-footer-note {
    font-size: var(--fs-12, 12px);
    color: var(--dash-text-muted, #8a9070);
    line-height: var(--lh-normal, 1.5);
    margin-top: var(--sp-2, 8px);
  }
  .sv-footer-note a, .sv-footer-note span.link {
    color: var(--dash-accent-dark, #7A8A52);
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
  }
  .sv-footer-note a:hover, .sv-footer-note span.link:hover {
    color: var(--dash-accent-deeper, #4f5c30);
    text-decoration: underline;
  }

  /* Loading skeleton */
  .sv-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-4, 16px);
    padding: var(--sp-7, 32px) 0;
  }
  .sv-spinner {
    width: 36px; height: 36px;
    border: 3px solid var(--dash-border, #e4e7d4);
    border-top-color: var(--dash-accent-dark, #7A8A52);
    border-radius: 50%;
    animation: sv-spin .7s linear infinite;
  }
  @keyframes sv-spin { to { transform: rotate(360deg); } }
  .sv-loading-text {
    font-size: var(--fs-13, 13px);
    color: var(--dash-text-muted, #8a9070);
  }

  /* Estimasi waktu chip */
  .sv-eta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--dash-warning-bg, #f7f2e4);
    border: 1px solid var(--dash-warning-border, #dcc882);
    border-radius: var(--r-full, 9999px);
    padding: 4px 14px;
    font-size: var(--fs-11, 11px);
    font-weight: 600;
    color: var(--dash-warning, #C4A24D);
    letter-spacing: var(--ls-label, .02em);
    margin: 0 auto var(--sp-6, 24px);
    width: fit-content;
  }
`;

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function Status() {
  const navigate = useNavigate();

  // Baca status dari localStorage yang di-set saat register / login
  const [status, setStatus]           = useState(localStorage.getItem("status") || "pending");
  const [rejectionReason, setRejection] = useState(null);
  const [checking, setChecking]       = useState(true);

  // Cek status terbaru dari server saat halaman dibuka
  useEffect(() => {
    let cancelled = false;

    const checkStatus = async () => {
      try {
        // Coba ambil session Supabase (kalau masih ada token sementara)
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Tidak ada session → pakai nilai localStorage (bisa dari redirect pasca-register)
          setChecking(false);
          return;
        }

        const BASE = import.meta.env.VITE_API_URL;
        const res = await fetch(`${BASE}/api/auth/me/status`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const s = data.status || "pending";
          if (!cancelled) {
            setStatus(s);
            localStorage.setItem("status", s);
            if (data.catatan_penolakan) setRejection(data.catatan_penolakan);
          }
        }
      } catch {
        // Gagal fetch → tetap gunakan nilai localStorage
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkStatus();
    return () => { cancelled = true; };
  }, []);

  const handleGoToDashboard = () => {
    localStorage.setItem("isLogin", "true");
    navigate("/");
  };

  const handleReregister = () => {
    localStorage.removeItem("status");
    navigate("/register");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/login");
  };

  /* ── Render ── */
  return (
    <>
      <style>{CSS}</style>
      <div className="sv-root">
        <div className="sv-card">

          {/* Brand */}
          <div className="sv-brand">
            <img src={logo} alt="Peken Banyumas" className="sv-brand-logo" />
            <div>
              <div className="sv-brand-name">Peken Banyumasan</div>
              <div className="sv-brand-sub">Platform Artisan UMKM</div>
            </div>
          </div>

          {/* Loading state */}
          {checking ? (
            <div className="sv-loading">
              <div className="sv-spinner" />
              <div className="sv-loading-text">Memeriksa status pendaftaran…</div>
            </div>
          ) : (
            <>
              {/* ══════════════════════════════════════
                  PENDING
              ══════════════════════════════════════ */}
              {status === "pending" && (
                <>
                  {/* Icon */}
                  <div className="sv-icon-ring pending">
                    <Clock size={36} strokeWidth={1.5} color="var(--dash-warning, #C4A24D)" className="sv-icon-spin" />
                  </div>

                  {/* Badge */}
                  <div className="sv-badge pending">
                    <span className="sv-badge-dot pending" />
                    Menunggu Konfirmasi
                  </div>

                  <h2 className="sv-title">Pendaftaran Sedang Diverifikasi</h2>
                  <p className="sv-desc">
                    Data UMKM kamu telah berhasil dikirim dan sedang dalam proses
                    verifikasi oleh Admin Peken Banyumas. Harap bersabar.
                  </p>

                  {/* Estimasi waktu */}
                  <div className="sv-eta">
                    <Clock size={12} strokeWidth={2} />
                    Estimasi verifikasi: 1 × 24 jam kerja
                  </div>

                  {/* Info bullets */}
                  <div className="sv-info-card">
                    <div className="sv-info-row">
                      <span className="sv-info-icon warning"><FileCheck size={12} strokeWidth={2.5} /></span>
                      <span>Data pendaftaran UMKM kamu telah berhasil dikirim.</span>
                    </div>
                    <div className="sv-info-row">
                      <span className="sv-info-icon info"><Search size={12} strokeWidth={2.5} /></span>
                      <span>Admin Peken Banyumas sedang meninjau kelengkapan data.</span>
                    </div>
                    <div className="sv-info-row">
                      <span className="sv-info-icon warning"><Lock size={12} strokeWidth={2.5} /></span>
                      <span>Dashboard UMKM hanya dapat diakses setelah akun disetujui oleh Admin.</span>
                    </div>
                  </div>

                  <div className="sv-divider" />

                  <div className="sv-footer-note">
                    Sudah mendapat konfirmasi?{" "}
                    <span
                      className="link"
                      onClick={() => { setChecking(true); window.location.reload(); }}
                    >
                      Perbarui status
                    </span>
                  </div>
                  <div className="sv-footer-note" style={{ marginTop: 10 }}>
                    <span className="link" onClick={handleLogout}>
                      <LogOut size={11} style={{ display:"inline", verticalAlign:"middle", marginRight:4 }} />
                      Keluar
                    </span>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════
                  DITOLAK
              ══════════════════════════════════════ */}
              {status === "rejected" && (
                <>
                  {/* Icon */}
                  <div className="sv-icon-ring rejected">
                    <XCircle size={36} strokeWidth={1.5} color="var(--dash-error, #B87272)" />
                  </div>

                  {/* Badge */}
                  <div className="sv-badge rejected">
                    <span className="sv-badge-dot rejected" />
                    Pendaftaran Ditolak
                  </div>

                  <h2 className="sv-title">Pendaftaran Tidak Disetujui</h2>
                  <p className="sv-desc">
                    Maaf, pendaftaran UMKM kamu belum dapat disetujui oleh
                    Admin Peken Banyumas. Kamu dapat memperbaiki data dan
                    mengajukan ulang pendaftaran.
                  </p>

                  {/* Alasan penolakan (jika ada) */}
                  {rejectionReason && (
                    <div className="sv-reject-reason">
                      <div className="sv-reject-reason-label">Alasan Penolakan</div>
                      <div className="sv-reject-reason-text">{rejectionReason}</div>
                    </div>
                  )}

                  {/* Info bullets */}
                  <div className="sv-info-card">
                    <div className="sv-info-row">
                      <span className="sv-info-icon error"><AlertTriangle size={12} strokeWidth={2.5} /></span>
                      <span>Periksa kembali kelengkapan dan kebenaran data yang kamu daftarkan.</span>
                    </div>
                    <div className="sv-info-row">
                      <span className="sv-info-icon info"><Phone size={12} strokeWidth={2.5} /></span>
                      <span>Hubungi panitia Peken Banyumas untuk informasi lebih lanjut sebelum mendaftar ulang.</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="sv-btn-primary" onClick={handleReregister}>
                    <RefreshCw size={16} strokeWidth={2} />
                    Daftar Ulang
                  </button>

                  <div className="sv-divider" />

                  <div className="sv-footer-note">
                    <span className="link" onClick={handleLogout}>
                      <LogOut size={11} style={{ display:"inline", verticalAlign:"middle", marginRight:4 }} />
                      Keluar dari akun
                    </span>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════
                  DISETUJUI
              ══════════════════════════════════════ */}
              {status === "approved" && (
                <>
                  {/* Icon */}
                  <div className="sv-icon-ring approved">
                    <CheckCircle2 size={36} strokeWidth={1.5} color="var(--dash-success, #7A9B6A)" />
                  </div>

                  {/* Badge */}
                  <div className="sv-badge approved">
                    <span className="sv-badge-dot approved" />
                    Disetujui
                  </div>

                  <h2 className="sv-title">Selamat, Kamu Diterima!</h2>
                  <p className="sv-desc">
                    Pendaftaran UMKM kamu telah disetujui oleh Admin Peken Banyumas.
                    Kamu sekarang dapat mengakses Dashboard dan mulai mengelola kiosmu.
                  </p>

                  {/* Info bullets */}
                  <div className="sv-info-card">
                    <div className="sv-info-row">
                      <span className="sv-info-icon success"><CheckCircle size={12} strokeWidth={2.5} /></span>
                      <span>Akun UMKM kamu aktif dan siap digunakan.</span>
                    </div>
                    <div className="sv-info-row">
                      <span className="sv-info-icon success"><Package size={12} strokeWidth={2.5} /></span>
                      <span>Pantau stok, transaksi, dan jadwal event di dashboard.</span>
                    </div>
                    <div className="sv-info-row">
                      <span className="sv-info-icon info"><CalendarDays size={12} strokeWidth={2.5} /></span>
                      <span>Acara Peken Banyumas dimulai 22 Maret 2026 di Taman Sari Kota Lama.</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="sv-btn-primary" onClick={handleGoToDashboard}>
                    Masuk ke Dashboard UMKM
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </button>

                  <div className="sv-divider" />

                  <div className="sv-footer-note">
                    <span className="link" onClick={handleLogout}>
                      <LogOut size={11} style={{ display:"inline", verticalAlign:"middle", marginRight:4 }} />
                      Keluar dari akun
                    </span>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
