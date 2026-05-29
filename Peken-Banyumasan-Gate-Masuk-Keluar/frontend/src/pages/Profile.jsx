// src/pages/Profile.jsx — Peken Banyumasan Design System v2.0
import React, { useEffect, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

const normalizePublicUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return raw;
  return `https://${raw}`;
};

export default function Profile() {
  const targetUrl = useMemo(() => normalizePublicUrl(
    import.meta.env.VITE_ARTISAN_URL || '/'
  ), []);

  useEffect(() => { window.location.replace(targetUrl); }, [targetUrl]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      background: '#f2f4e8',
      fontFamily: '"Montserrat", system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#fff',
        border: '1px solid #e4e7d4',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 4px 12px rgba(30,32,16,.08)',
        textAlign: 'center',
      }}>
        <img
          src="/favicon.png"
          alt="Peken Banyumasan"
          style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', marginBottom: 16, display: 'inline-block' }}
        />
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#1e2010', fontFamily: '"Clash Display", sans-serif' }}>
          Mengalihkan halaman…
        </h1>
        <p style={{ margin: '0 0 24px', color: '#8a9070', lineHeight: 1.7, fontSize: 13 }}>
          Anda akan diarahkan ke halaman publik Artisan dan event Peken Banyumasan.
        </p>
        <a
          href={targetUrl}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 20,
            background: '#7a8a52', color: '#fff',
            fontWeight: 600, fontSize: 13,
            textDecoration: 'none',
            transition: 'background 180ms ease',
          }}
        >
          Buka Halaman Publik <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
