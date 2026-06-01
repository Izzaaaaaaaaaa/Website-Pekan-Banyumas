import { useState, useEffect, useRef } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion.js';
import PillButton from '../shared/PillButton.jsx';
import { Eyebrow, Wordmark } from '../shared/Typography.jsx';
import PixelFlicker from '../shared/PixelFlicker.jsx';
import SectionHeader from '../shared/SectionHeader.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import { LocationMarker } from '../shared/Atoms.jsx';
import useFetch from '../../hooks/useFetch.js';
import { api } from '../../lib/api.js';

// Peken Banyumasan — Home screen · v1.2
// Implements:
//   §1 — pixel flicker (per-rect, in place) directly beneath carousel,
//        bottom-anchored so it merges seamlessly into the sage
//        manifesto section below.
//   §3 — Home image-run becomes 6 PROGRAM cards: each tile has a
//        title + description caption that slides in from below on
//        hover, and clicking the tile jumps to the PROGRAM page.
//   §4 — Carousel hero stays sticky during the wipe-up into manifesto
//        (handled inside WipeReveal — but Home keeps a hard pixel-band
//         seam because the user explicitly wanted seamless pixel→sage,
//         not a wipe here).

/* ------------------------------------------------------------------
   HeroCarousel — full-bleed bg image, dark gradient overlay,
   3 slides, 6s autoplay, cross-fade, pixel-square indicators.
   Pauses on hover, on tab blur, and on prefers-reduced-motion.
   ------------------------------------------------------------------ */
function HeroCarousel({ slides, children }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const timer = useRef(null);

  useEffect(() => {
    if (reduced || paused) return;
    timer.current = setInterval(
      () => setIdx((i) => (i + 1) % slides.length),
      6000
    );
    return () => clearInterval(timer.current);
  }, [paused, reduced, slides.length]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <div
      style={{ position: 'relative', minHeight: 640, overflow: 'hidden' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {slides.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== idx}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('${src}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 1200ms cubic-bezier(.22,.61,.36,1)',
          }}
        />
      ))}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(13,13,13,.45) 0%, rgba(13,13,13,.25) 35%, rgba(13,13,13,.85) 100%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, minHeight: 640 }}>
        {children}
      </div>
      <div
        role="tablist"
        aria-label="Pilih slide hero"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 24,
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          zIndex: 3,
        }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === idx}
            aria-label={`Slide ${i + 1} dari ${slides.length}`}
            onClick={() => setIdx(i)}
            style={{
              width: 12,
              height: 12,
              padding: 0,
              border: 0,
              cursor: 'pointer',
              background: i === idx ? 'var(--accent)' : 'rgba(255,255,255,.45)',
              transition: 'background 320ms cubic-bezier(.22,.61,.36,1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomeScreen({ onNavigate }) {
  const { data } = useFetch(() => api.getPrograms(), []);
  const homePrograms = (data || []).slice(0, 6).map((p, i) => ({
    ...p,
    n:    String(i + 1).padStart(2, '0'),
    img:  p.icon_url || `/assets/program-${p.slug}.jpg`,
    body: p.deskripsi,
  }));
  return (
    <main style={{ background: 'var(--bg-page)' }}>
      {/* HERO — carousel + Wordmark + headline + CTAs. */}
      <HeroCarousel
        slides={[
          '/assets/banner-home-1.jpg',
          '/assets/banner-home-2.jpg',
          '/assets/banner-about.png',
        ]}
      >
        {/* §1 — PixelFlicker overlay (v1.6). Covers the full carousel
            via fullHeight mode. Pattern designed with an empty upper-
            centre zone that naturally clears the button area. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <PixelFlicker fullHeight />
        </div>
        <section
          style={{
            position: 'relative',
            zIndex: 1,
            minHeight: 640,
            padding: '100px 120px 100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 48,
          }}
        >
          <Eyebrow style={{ color: 'var(--accent)' }}>
            MIRAPAT · BANYUMASAN · 2026
          </Eyebrow>
          <div style={{ textAlign: 'center' }}>
            <Wordmark size={28} gap={18} />
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: 64,
                color: '#fff',
                lineHeight: 1.1,
                margin: '28px 0 0',
                maxWidth: 980,
                textAlign: 'center',
              }}
            >
              Temukan{' '}
              <em
                style={{
                  fontFamily: 'var(--font-italic)',
                  fontStyle: 'italic',
                  color: 'var(--accent)',
                }}
              >
                pertunjukan
              </em>
              , karya artisan, dan cerita Banyumasan dalam satu ekosistem.
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <PillButton onClick={() => onNavigate('PROGRAM')}>
              Detail Agenda
            </PillButton>
            <PillButton inverse onClick={() => onNavigate('ABOUT')}>
              Tentang Peken
            </PillButton>
          </div>
        </section>
      </HeroCarousel>

      {/* MANIFESTO BLOCK — sage band right below the carousel. */}
      <section
        style={{
          padding: '80px 120px',
          background: 'var(--bg-inverse)',
          color: 'var(--accent-ink)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr 1fr',
            gap: 40,
            alignItems: 'flex-start',
          }}
        >
          <div>
            <Wordmark size={16} color="var(--accent-ink)" />
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: 1.8,
              margin: 0,
              color: 'var(--accent-ink)',
            }}
          >
            Peken Banyumasan adalah sebuah ruang kreatif berbasis budaya
            lokal yang dirancang sebagai wadah berkumpulnya masyarakat,
            pelaku UMKM, seniman, dan komunitas dalam satu ekosistem yang
            hidup, inklusif, dan berkelanjutan.
            <br />
            <br />
            Peken tidak hanya berfungsi sebagai pasar atau tempat berkumpul
            biasa, tetapi sebagai ruang interaksi yang menghadirkan
            pengalaman budaya khas Banyumas melalui berbagai aktivitas
            seperti pertunjukan seni, kuliner tradisional, produk kreatif,
            hingga eksplorasi identitas lokal.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: 1.8,
              margin: 0,
              color: 'var(--accent-ink)',
            }}
          >
            Peken Banyumasan adalah ruang temu budaya dan ekonomi kreatif
            di Banyumas yang mempertemukan seniman, UMKM, dan masyarakat
            dalam satu perayaan kearifan lokal.
            <br />
            <br />
            Menghadirkan kuliner tradisional, pertunjukan seni, serta
            aktivitas komunitas, Peken menjadi tempat di mana budaya
            tidak hanya dipamerkan, tetapi dirasakan dan dialami bersama.
            <br />
            <br />
            Sejak pertama kali hadir pada Februari 2022 dan diselenggarakan
            dua kali setiap bulan di kawasan Kota Lama Banyumas, Peken
            terus berkembang sebagai ekosistem kreatif.
          </p>
        </div>
      </section>

      {/* AGENDA TERDEKAT */}
      <section
        style={{
          padding: '100px 120px',
          background: 'var(--bg-page)',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }}
        >
          <div>
            <Eyebrow style={{ color: '#fff' }}>
              AGENDA
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  background: 'var(--accent)',
                  margin: '0 10px',
                  verticalAlign: '2px',
                }}
              />
              TERDEKAT
            </Eyebrow>
            <div
              style={{
                fontFamily: 'Inter',
                fontWeight: 300,
                fontSize: 128,
                lineHeight: 1,
                color: 'var(--accent)',
                marginTop: 24,
              }}
            >
              24
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                marginTop: 12,
              }}
            >
              Minggu · Maret 2026 · 15:30–20:30 WIB
            </div>
            <div
              style={{
                marginTop: 12,
                color: 'var(--fg-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}
            >
              Taman Sari · Kecamatan Banyumas
            </div>
          </div>
          <div>
            <img
              src="/assets/logo-peken-banyumasan.png"
              alt=""
              style={{ width: 30, height: 30, marginBottom: 20 }}
            />
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.9,
                color: 'var(--fg-secondary)',
                margin: 0,
                maxWidth: '44ch',
              }}
            >
              Edisi berikutnya kembali menghadirkan suasana Peken yang
              hangat dan hidup. Nikmati pertunjukan seni Banyumasan,
              jelajahi tenant UMKM pilihan, dan temukan karya-karya lokal
              dalam satu ruang yang penuh kebersamaan.
            </p>
            <div style={{ marginTop: 36 }}>
              <PillButton onClick={() => onNavigate('PROGRAM')}>
                Detail Agenda
              </PillButton>
            </div>
          </div>
        </div>
      </section>

      {/* §3 — PROGRAM TILES (replaces the old anonymous image-run). */}
      <section
        style={{
          background: 'var(--bg-page)',
          padding: '0 0 0 0',
        }}
      >
        <div style={{ padding: '100px 120px 40px' }}>
          <SectionHeader
            eyebrow="ENAM PROGRAM · TIAP EDISI"
            title={
              <>
                Setiap edisi Peken berputar pada{' '}
                <em
                  style={{
                    fontFamily: 'var(--font-italic)',
                    fontStyle: 'italic',
                    color: 'var(--accent)',
                  }}
                >
                  enam program
                </em>{' '}
                tetap.
              </>
            }
            right={
              <PillButton onClick={() => onNavigate('PROGRAM')}>
                Lihat Semua Program
              </PillButton>
            }
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 0,
          }}
        >
          {homePrograms.map((p, i) => (
            <PhotoTile
              key={p.n}
              src={p.img}
              alt={p.title}
              aspect="480/520"
              mode="hover"
              onClick={() => onNavigate('PROGRAM')}
              ariaLabel={`Buka program ${p.title}`}
              corner={i < 5 ? '✕' : null}
              caption={
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      color: 'var(--accent)',
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    PROGRAM · {p.n}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                      fontSize: 16,
                      color: '#fff',
                      marginBottom: 8,
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      color: 'var(--fg-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    {p.body}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      </section>

      {/* LOKASI */}
      <section
        id="lokasi"
        style={{
          padding: '100px 120px',
          background: 'var(--bg-elevated)',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
          }}
        >
          <div>
            <Eyebrow style={{ color: 'var(--accent)' }}>LOKASI</Eyebrow>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                fontWeight: 400,
                color: '#fff',
                marginTop: 16,
                lineHeight: 1.25,
              }}
            >
              Kawasan Kota Lama Banyumas.
              <br />
              Taman Sari · Sudagaran.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
                marginTop: 48,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      background: 'var(--accent)',
                      marginRight: 10,
                    }}
                  />
                  Perjalanan menuju Peken Banyumasan
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: 'var(--fg-secondary)',
                    lineHeight: 1.8,
                  }}
                >
                  Banyumas, Sudagaran, Kec. Banyumas,
                  <br />
                  Kabupaten Banyumas, Jawa Tengah 53192
                </div>
                <div style={{ marginTop: 16 }}>
                  <PillButton
                    href="https://maps.app.goo.gl/gKciZDAnY7Z9ezAN7"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Rute Peken Banyumasan
                  </PillButton>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      background: 'var(--accent)',
                      marginRight: 10,
                    }}
                  />
                  Halte Trans Banyumas Terdekat
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: 'var(--fg-secondary)',
                    lineHeight: 1.9,
                  }}
                >
                  Trans Banyumas Koridor 4 · Terminal Bulupitu
                  <br />
                  Trans Banyumas Koridor 4 · RS Margono — Halte Alun-alun
                  <br />
                  Operasional · 04:40 – 18:30 WIB
                </div>
                <div style={{ marginTop: 16 }}>
                  <PillButton
                    href="https://maps.app.goo.gl/jdg7ymWLtuEpqAuLA"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Trayek Trans Banyumas
                  </PillButton>
                </div>
              </div>
            </div>
          </div>

          <a
            href="https://maps.app.goo.gl/jdg7ymWLtuEpqAuLA"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka peta kawasan Kota Lama Banyumas di Google Maps"
            style={{
              position: 'relative',
              aspectRatio: '16/11',
              background: 'var(--bg-deep)',
              overflow: 'hidden',
              display: 'block',
              cursor: 'pointer',
            }}
          >
            <img
              src="/assets/map-kota-lama.png"
              alt="Peta kawasan Kota Lama Banyumas"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.6,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -60%)',
              }}
            >
              <LocationMarker
                label="TAMAN SARI · BANYUMAS"
                targetId="lokasi"
              />
            </div>
          </a>
        </div>
      </section>
    </main>
  );
}
