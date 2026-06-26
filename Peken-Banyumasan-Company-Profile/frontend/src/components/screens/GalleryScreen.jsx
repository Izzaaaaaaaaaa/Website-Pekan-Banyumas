import { useState, useEffect } from 'react';
import PillButton from '../shared/PillButton.jsx';
import { Eyebrow } from '../shared/Typography.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import WipeReveal from '../shared/WipeReveal.jsx';
import ScreenLoader from '../shared/ScreenLoader.jsx';
import { companyProfileApi } from '../../services/endpoints.js';

// Peken Banyumasan — Gallery screen · v1.3
// §3 — Gallery tiles → mode="static" (no hover at all)
// §4 — Documentation block transitions in via WipeReveal
//      instead of a hard gradient bridge.

const STATIC_IMAGES = [
  { filename: 'gallery-1',      label: 'Mrapat #01',        year: '2022' },
  { filename: 'gallery-2',      label: 'Mrapat #02',        year: '2022' },
  { filename: 'gallery-3',      label: 'Mrapat #03',        year: '2022' },
  { filename: 'gallery-4',      label: 'Mrapat #04',        year: '2023' },
  { filename: 'gallery-5',      label: 'Mrapat #05',        year: '2023' },
  { filename: 'gallery-6',      label: 'Mrapat #06',        year: '2023' },
  { filename: 'gallery-perform-1', label: 'Pertunjukan #01', year: '2024' },
  { filename: 'gallery-perform-2', label: 'Pertunjukan #02', year: '2024' },
  { filename: 'banner-home-1',  label: 'Banner Peken',     year: '2025' },
  { filename: 'banner-home-2',  label: 'Banner Mrapat',    year: '2025' },
];

const STATIC_DOC = {
  headline: 'Setiap edisi Peken didokumentasikan secara terbuka.',
  body: 'Foto-foto di laman ini diambil oleh tim dokumentasi Peken bersama relawan fotografer komunitas — dirilis di bawah lisensi Creative Commons BY-NC 4.0 untuk penggunaan non-komersial dengan atribusi.\n\nSetiap edisi dikemas sebagai paket gambar resolusi tinggi (RAW + JPEG terkurasi) yang dapat diunduh untuk keperluan riset, jurnalisme, atau kebutuhan komunitas.',
  ukuran: 'ZIP · ±420 MB per edisi',
  download_url: '',
};

/* ------------------------------------------------------------------
   GalleryScreen — masonry on dark; documentation block reveals
   below via WipeReveal (sticky last-screen + sage rises from bottom).
   §3: tiles are mode="static" — NO hover effect on Gallery photos.
   ------------------------------------------------------------------ */
export default function GalleryScreen() {
  const [images, setImages] = useState(STATIC_IMAGES);
  const [doc,    setDoc]    = useState(STATIC_DOC);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companyProfileApi.get('gallery')
      .then(data => {
        if (data?.images?.length) {
          setImages(data.images.filter(g => g.visible !== false));
        }
        if (data?.doc_headline) {
          setDoc({
            headline:     data.doc_headline,
            body:         data.doc_body         || STATIC_DOC.body,
            ukuran:       data.doc_ukuran       || STATIC_DOC.ukuran,
            download_url: data.doc_download_url || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* The "before" half — the gallery body flows naturally now. No
     height cap, no overflow hidden — so the masonry can be as tall
     as it needs to be, and user scrolls through ALL of it before
     hitting the gradient bridge to the documentation block. */
  const Body = (
    <div style={{ background: 'var(--bg-elevated)', color: '#fff' }}>
      <section style={{ padding: '100px var(--page-px) 40px' }}>
        <Eyebrow style={{ color: 'var(--accent)' }}>
          GALLERY · 2022 — 2026
        </Eyebrow>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 'clamp(30px, 6vw, 56px)',
            lineHeight: 1.15,
            margin: '24px 0 0',
            maxWidth: 1000,
          }}
        >
          Empat tahun Peken dalam gambar.
        </h1>
      </section>
      <section style={{ padding: '40px clamp(16px, 4vw, 60px) 80px' }}>
        <div style={{ columnCount: 3, columnGap: 24 }}>
          {images.map((item, i) => {
            const src = item.src || `/assets/${item.filename}.jpg`;
            return (
              <div key={item.id || item.filename} style={{ breakInside: 'avoid', marginBottom: 24 }}>
                <PhotoTile
                  src={src}
                  alt={item.label}
                  aspect="auto"
                  mode="static"
                  style={{ aspectRatio: 'auto', paddingBottom: '62%' }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: 'var(--fg-muted)',
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    marginTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{item.label}</span>
                  <span>{item.year}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  // The "after" — documentation block that wipes in over the body.
  const Documentation = (
    <section
      style={{
        padding: '100px var(--page-px) 120px',
        background: 'var(--accent)',
        color: 'var(--accent-ink)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
          gap: 60,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: '.04em',
              color: 'var(--peken-smoke)',
              textTransform: 'uppercase',
            }}
          >
            DOKUMENTASI · ARSIP TERBUKA
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 32,
              lineHeight: 1.25,
              color: 'var(--accent-ink)',
              maxWidth: '24ch',
            }}
          >
            {doc.headline}
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              lineHeight: 1.9,
              color: 'var(--accent-ink)',
              margin: '32px 0 0',
              maxWidth: '60ch',
              whiteSpace: 'pre-line',
            }}
          >
            {doc.body}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <PillButton inverse onClick={() => doc.download_url && window.open(doc.download_url, '_blank', 'noopener,noreferrer')}>Unduh Paket Dokumentasi</PillButton>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 400,
              color: 'var(--peken-smoke)',
              letterSpacing: '.04em',
              textTransform: 'uppercase',
            }}
          >
            {doc.ukuran}
          </div>
        </div>
      </div>
    </section>
  );

  // v1.8 — Gallery transition panel (100vh closing statement).
  const GalleryTransition = (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: 'var(--bg-elevated)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 var(--page-px)',
        textAlign: 'center',
      }}
    >
      <Eyebrow style={{ color: 'var(--accent)', marginBottom: 32 }}>
        ARSIP TERBUKA · CREATIVE COMMONS
      </Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: 'clamp(28px, 6vw, 48px)',
          lineHeight: 1.2,
          color: '#fff',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        Setiap foto di atas bebas{' '}
        <em
          style={{
            fontStyle: 'italic',
            fontFamily: 'var(--font-italic)',
            color: 'var(--accent)',
          }}
        >
          digunakan kembali
        </em>{' '}
        — untuk riset, jurnalisme, atau keperluan komunitas.
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.9,
          color: 'var(--fg-secondary)',
          margin: '40px auto 0',
          maxWidth: '52ch',
        }}
      >
        Dokumentasi Peken Banyumasan dirilis di bawah lisensi{' '}
        <span style={{ color: '#fff' }}>Creative Commons BY-NC 4.0</span> —
        gunakan dengan atribusi, jangan untuk komersial.
      </p>
    </section>
  );

  if (loading) return <ScreenLoader />;

  return (
    <main style={{ background: 'var(--bg-elevated)' }}>
      {Body}
      <WipeReveal
        before={GalleryTransition}
        after={Documentation}
        mode="sticky"
        pinHeight="200vh"
        fromColor="var(--bg-elevated)"
        toColor="var(--accent)"
      />
    </main>
  );
}
