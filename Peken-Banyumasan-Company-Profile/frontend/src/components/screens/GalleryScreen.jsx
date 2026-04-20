import PillButton from '../shared/PillButton.jsx';
import { Eyebrow } from '../shared/Typography.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import WipeReveal from '../shared/WipeReveal.jsx';

// Peken Banyumasan — Gallery screen · v1.2
// §3 — Gallery tiles → mode="static" (no hover at all)
// §4 — Documentation block transitions in via WipeReveal
//      instead of a hard gradient bridge.

const GALLERY_IMAGES = [
  'gallery-1',
  'gallery-2',
  'gallery-3',
  'gallery-4',
  'gallery-5',
  'gallery-6',
  'gallery-perform-1',
  'gallery-perform-2',
  'banner-home-1',
  'banner-home-2',
];

/* ------------------------------------------------------------------
   GalleryScreen — masonry on dark; documentation block reveals
   below via WipeReveal (sticky last-screen + sage rises from bottom).
   §3: tiles are mode="static" — NO hover effect on Gallery photos.
   ------------------------------------------------------------------ */
export default function GalleryScreen() {
  /* The "before" half — the gallery body flows naturally now. No
     height cap, no overflow hidden — so the masonry can be as tall
     as it needs to be, and user scrolls through ALL of it before
     hitting the gradient bridge to the documentation block. */
  const Body = (
    <div style={{ background: 'var(--bg-elevated)', color: '#fff' }}>
      <section style={{ padding: '100px 120px 40px' }}>
        <Eyebrow style={{ color: 'var(--accent)' }}>
          GALLERY · 2022 — 2026
        </Eyebrow>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 56,
            lineHeight: 1.15,
            margin: '24px 0 0',
            maxWidth: 1000,
          }}
        >
          Empat tahun Peken dalam gambar.
        </h1>
      </section>
      <section style={{ padding: '40px 60px 80px' }}>
        <div style={{ columnCount: 3, columnGap: 24 }}>
          {GALLERY_IMAGES.concat(GALLERY_IMAGES).map((n, i) => (
            <div key={i} style={{ breakInside: 'avoid', marginBottom: 24 }}>
              <PhotoTile
                src={`/assets/${n}.jpg`}
                alt={`Edisi #${String(i + 1).padStart(2, '0')}`}
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
                <span>Edisi #{String(i + 1).padStart(2, '0')}</span>
                <span>202{(i % 4) + 2}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  // The "after" — documentation block that wipes in over the body.
  const Documentation = (
    <section
      style={{
        padding: '100px 120px 120px',
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
            Setiap edisi Peken didokumentasikan secara terbuka.
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              lineHeight: 1.9,
              color: 'var(--accent-ink)',
              margin: '32px 0 0',
              maxWidth: '60ch',
            }}
          >
            Foto-foto di laman ini diambil oleh tim dokumentasi Peken
            bersama relawan fotografer komunitas — dirilis di bawah
            lisensi Creative Commons BY-NC 4.0 untuk penggunaan
            non-komersial dengan atribusi.
            <br />
            <br />
            Setiap edisi dikemas sebagai paket gambar resolusi tinggi
            (RAW + JPEG terkurasi) yang dapat diunduh untuk keperluan
            riset, jurnalisme, atau kebutuhan komunitas.
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
          <PillButton inverse>Unduh Paket Dokumentasi</PillButton>
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
            ZIP · ±420 MB per edisi
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
        padding: '0 120px',
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
          fontSize: 48,
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
