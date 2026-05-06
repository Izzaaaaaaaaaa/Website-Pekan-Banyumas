// src/pages/auth/Status.jsx — Peken Banyumasan Design System v2.1 (Kolaborator)
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle2, Clock, XCircle, MapPin, Calendar, Globe } from 'lucide-react';
import { STORAGE_KEYS } from '../../lib/storageKeys';
import { readRaw, writeRaw } from '../../lib/domainStorage';

const STATUS_CONFIG = {
  pending: {
    Icon:      Clock,
    iconBg:    'var(--peken-warning-bg)',
    iconColor: 'var(--peken-warning)',
    badge:     'Menunggu Konfirmasi',
    badgeClass: 'warning',
    title:     'Pendaftaran Sedang Diproses',
    desc:      'Admin sedang memverifikasi data pendaftaranmu. Silakan tunggu hingga status diperbarui. Proses verifikasi biasanya 1×24 jam.',
    infos: [
      { color: 'var(--peken-warning)', text: 'Proses verifikasi biasanya 1×24 jam' },
    ],
  },
  rejected: {
    Icon:      XCircle,
    iconBg:    'var(--peken-error-bg)',
    iconColor: 'var(--peken-error)',
    badge:     'Tidak Disetujui',
    badgeClass: 'error',
    title:     'Pendaftaran Ditolak',
    desc:      'Pendaftaranmu belum bisa diproses. Hubungi admin untuk informasi lebih lanjut.',
    infos: [
      { color: 'var(--peken-error)', text: 'Hubungi admin untuk informasi lebih lanjut' },
    ],
  },
  approved: {
    Icon:      CheckCircle2,
    iconBg:    'var(--peken-success-bg)',
    iconColor: 'var(--peken-success)',
    badge:     'Disetujui',
    badgeClass: 'success',
    title:     'Selamat, Pendaftaran Berhasil!',
    desc:      'Pendaftaranmu telah disetujui. Kamu sekarang bisa mengakses portal Kolaborator dan mulai mengelola portofolio dan story.',
    infos: [
      { color: 'var(--peken-success)', text: 'Kelola portofolio dan story' },
      { color: 'var(--peken-success)', text: 'Bergabung dengan event budaya' },
    ],
  },
};

export default function Status() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(
    () => readRaw(STORAGE_KEYS.REGISTER_STATUS) || 'pending'
  );

  const sim = (s) => { writeRaw(STORAGE_KEYS.REGISTER_STATUS, s); setStatus(s); };
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const { Icon } = cfg;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--dash-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        animation: 'fadeInUp var(--dur-base) var(--ease-out-brand) both',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40,
            background: 'var(--dash-accent-dark)', color: '#fff',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-accent)',
          }}>
            <Globe size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--dash-text-primary)', lineHeight: 1 }}>
              Peken Banyumasan
            </div>
            <div style={{ fontSize: 10, color: 'var(--dash-text-muted)', marginTop: 3, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Portal Kolaborator
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--dash-surface)',
          border: '1px solid var(--dash-border)',
          borderRadius: 20, padding: '40px 36px',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
        }}>
          {/* Status icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: cfg.iconBg, color: cfg.iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: `0 0 0 8px ${cfg.iconBg}`,
          }}>
            <Icon size={36} strokeWidth={1.5} />
          </div>

          {/* Badge */}
          <div style={{ marginBottom: 12 }}>
            <span className={`peken-badge peken-badge-${cfg.badgeClass}`} style={{ fontSize: 12, padding: '4px 14px' }}>
              {cfg.badge}
            </span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--dash-text-primary)', marginBottom: 10 }}>
            {cfg.title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--dash-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
            {cfg.desc}
          </p>

          {/* Info bullets */}
          <div style={{
            background: 'var(--dash-accent-bg)', border: '1px solid var(--dash-accent-border)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 28, textAlign: 'left',
          }}>
            {cfg.infos.map(({ color, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < cfg.infos.length - 1 ? 8 : 0, fontSize: 13, color: 'var(--dash-text-secondary)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {text}
              </div>
            ))}
            {/* Event info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 13, color: 'var(--dash-text-secondary)' }}>
              <Calendar size={13} color="var(--dash-accent-dark)" style={{ flexShrink: 0 }} />
              22–24 Maret 2026 · Taman Sari Kota Lama
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 13, color: 'var(--dash-text-secondary)' }}>
              <MapPin size={13} color="var(--dash-accent-dark)" style={{ flexShrink: 0 }} />
              Banyumas, Jawa Tengah
            </div>
          </div>

          {/* Action button */}
          {status === 'approved' && (
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: '13px', marginBottom: 12,
                background: 'var(--dash-accent-dark)', color: '#fff',
                border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 700,
                fontFamily: 'var(--font-body)', cursor: 'pointer',
                boxShadow: 'var(--shadow-accent)',
                transition: 'background var(--dur-fast) var(--ease-out-brand)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--dash-accent-deeper)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--dash-accent-dark)'}
            >
              Masuk ke Portal Kolaborator
            </button>
          )}
          {status === 'rejected' && (
            <button
              onClick={() => navigate('/register')}
              style={{
                width: '100%', padding: '13px', marginBottom: 12,
                background: 'var(--peken-error-bg)', color: 'var(--peken-error)',
                border: '1.5px solid var(--peken-error-border)',
                borderRadius: 20, fontSize: 14, fontWeight: 700,
                fontFamily: 'var(--font-body)', cursor: 'pointer',
                transition: 'background var(--dur-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--peken-error-border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--peken-error-bg)'}
            >
              Daftar Ulang
            </button>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--dash-border)', margin: '20px 0' }} />

          {/* Dev simulator */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--dash-text-muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Simulasi Status Admin
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'pending',  label: 'Pending',   cls: 'peken-badge-warning' },
                { key: 'rejected', label: 'Ditolak',   cls: 'peken-badge-error' },
                { key: 'approved', label: 'Disetujui', cls: 'peken-badge-success' },
              ].map(({ key, label, cls }) => (
                <button
                  key={key}
                  onClick={() => sim(key)}
                  className={`peken-badge ${cls}`}
                  style={{
                    flex: 1, padding: '7px 4px', cursor: 'pointer',
                    border: '1px solid', borderRadius: 10, fontSize: 11,
                    fontFamily: 'var(--font-body)', fontWeight: 700,
                    opacity: status === key ? 1 : 0.6,
                    outline: status === key ? '2px solid currentColor' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--dash-text-muted)' }}>
          <span
            onClick={() => navigate('/login')}
            style={{ color: 'var(--dash-accent-dark)', fontWeight: 600, cursor: 'pointer' }}
          >
            ← Kembali ke Login
          </span>
        </div>
      </div>
    </div>
  );
}
