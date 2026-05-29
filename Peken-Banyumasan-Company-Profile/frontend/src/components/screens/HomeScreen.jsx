import { useState, useEffect, useRef } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion.js';
import PillButton from '../shared/PillButton.jsx';
import { Eyebrow, Wordmark } from '../shared/Typography.jsx';
import PixelFlicker from '../shared/PixelFlicker.jsx';
import SectionHeader from '../shared/SectionHeader.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import { LocationMarker } from '../shared/Atoms.jsx';
import ScreenLoader from '../shared/ScreenLoader.jsx';
import { HOME_PROGRAMS } from '../../data/programs.js';
import { getUpcomingEvent } from '../../data/events.js';
import { companyProfileApi, eventsApi } from '../../services/endpoints.js';

// Peken Banyumasan — Home screen · v1.3
// v1.3: hero slides, eyebrow, headline, manifesto, agenda and lokasi
//       now fetched from companyProfileApi.get('home') with static fallback.

/* ------------------------------------------------------------------
   DEFAULT_HOME — mirrors the API 'home' section schema.
   All fields used as fallback when the API is unavailable.
   ------------------------------------------------------------------ */
const DEFAULT_HOME = {
  hero_slides: [
    '/assets/banner-home-1.jpg',
    '/assets/banner-home-2.jpg',
    '/assets/banner-about.png',
  ],
  hero_eyebrow:       'MIRAPAT · BANYUMASAN · 2026',
  hero_headline_pre:  'Temukan',
  hero_headline_em:   'pertunjukan',
  hero_headline_post: ', karya artisan, dan cerita Banyumasan dalam satu ekosistem.',
  manifesto_col1:
    'Peken Banyumasan adalah sebuah ruang kreatif berbasis budaya\n' +
    'lokal yang dirancang sebagai wadah berkumpulnya masyarakat,\n' +
    'pelaku Artisan, seniman, dan komunitas dalam satu ekosistem yang\n' +
    'hidup, inklusif, dan berkelanjutan.\n\n' +
    'Peken tidak hanya berfungsi sebagai pasar atau tempat berkumpul\n' +
    'biasa, tetapi sebagai ruang interaksi yang menghadirkan\n' +
    'pengalaman budaya khas Banyumas melalui berbagai aktivitas\n' +
    'seperti pertunjukan seni, kuliner tradisional, produk kreatif,\n' +
    'hingga eksplorasi identitas lokal.',
  manifesto_col2:
    'Peken Banyumasan adalah ruang temu budaya dan ekonomi kreatif\n' +
    'di Banyumas yang mempertemukan seniman, Artisan, dan masyarakat\n' +
    'dalam satu perayaan kearifan lokal.\n\n' +
    'Menghadirkan kuliner tradisional, pertunjukan seni, serta\n' +
    'aktivitas komunitas, Peken menjadi tempat di mana budaya\n' +
    'tidak hanya dipamerkan, tetapi dirasakan dan dialami bersama.\n\n' +
    'Sejak pertama kali hadir pada Februari 2022 dan diselenggarakan\n' +
    'dua kali setiap bulan di kawasan Kota Lama Banyumas, Peken\n' +
    'terus berkembang sebagai ekosistem kreatif.',
  agenda_date:     '—',
  agenda_label:    'Agenda berikutnya akan diumumkan',
  agenda_lokasi:   '',
  agenda_deskripsi: 'Pantau terus informasi event Peken Banyumasan berikutnya.',
  lokasi_headline: 'Kawasan Kota Lama Banyumas.\nTaman Sari · Sudagaran.',
  lokasi_alamat:   'Banyumas, Sudagaran, Kec. Banyumas,\nKabupaten Banyumas, Jawa Tengah 53192',
  lokasi_trans:
    'Trans Banyumas Koridor 4 · Terminal Bulupitu\n' +
    'Trans Banyumas Koridor 4 · RS Margono — Halte Alun-alun\n' +
    'Operasional · 04:40 – 18:30 WIB',
  lokasi_trans1_url: 'https://maps.google.com/?q=Taman+Sari+Kecamatan+Banyumas+Kabupaten+Banyumas+Jawa+Tengah',
  lokasi_trans2_url: 'https://maps.google.com/?q=Trans+Banyumas+Koridor+4',
  lokasi_image_url: '',
};

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

// ── Agenda helpers ────────────────────────────────────────────────────────────
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function deriveAgenda(event) {
  if (!event) return null;
  const d = new Date(event.tanggal);
  const date    = String(d.getDate()).padStart(2, '0');
  const hari    = HARI[d.getDay()];
  const bulan   = BULAN[d.getMonth()];
  const tahun   = d.getFullYear();
  // API serializes time as "HH:MM:SS" — slice to "HH:MM" before swapping the
  // separator, otherwise replace() only hits the first colon ("15.00:00").
  const jamStr  = event.jam_mulai && event.jam_selesai
    ? ` · ${event.jam_mulai.slice(0, 5).replace(':', '.')}–${event.jam_selesai.slice(0, 5).replace(':', '.')} WIB`
    : '';
  return {
    agenda_date:      date,
    agenda_label:     `${hari} · ${bulan} ${tahun}${jamStr}`,
    agenda_lokasi:    event.lokasi || '',
    agenda_deskripsi: event.deskripsi || '',
  };
}

// Derive agenda from static events so Beranda always shows something meaningful.
const _staticUpcoming = getUpcomingEvent(1)[0] || null;
const DEFAULT_HOME_WITH_AGENDA = _staticUpcoming
  ? { ...DEFAULT_HOME, ...deriveAgenda(_staticUpcoming) }
  : DEFAULT_HOME;

export default function HomeScreen({ onNavigate }) {
  const [homePrograms, setHomePrograms] = useState(HOME_PROGRAMS);
  const [homeData, setHomeData]         = useState(DEFAULT_HOME_WITH_AGENDA);
  const [loading, setLoading]           = useState(true);

  // Program tiles read the `programs` company-profile section — the same
  // source as ProgramScreen/ProgramDetailScreen — so an admin edit in the
  // Gate "Kelola Company Profile" editor is reflected on the homepage too.
  useEffect(() => {
    companyProfileApi.get('programs')
      .then(data => { if (Array.isArray(data) && data.length) setHomePrograms(data.slice(0, 6)); })
      .catch(() => {});
  }, []);

  // The `home` section is the screen's primary content — gate the initial
  // render on it so visitors never see bundled fallback copy flash to real.
  useEffect(() => {
    companyProfileApi.get('home')
      .then(data => { if (data) setHomeData(prev => ({ ...prev, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Agenda Terdekat — auto-derived dari event upcoming terdekat.
  useEffect(() => {
    eventsApi.upcoming({ limit: 1 })
      .then(data => {
        const ev = Array.isArray(data) ? data[0] : data;
        const derived = deriveAgenda(ev);
        if (derived) setHomeData(prev => ({ ...prev, ...derived }));
      })
      .catch(() => {});
  }, []);

  if (loading) return <ScreenLoader />;

  return (
    <main style={{ background: 'var(--bg-page)' }}>
      {/* HERO — carousel + Wordmark + headline + CTAs. */}
      <HeroCarousel slides={homeData.hero_slides}>
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
            {homeData.hero_eyebrow}
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
              {homeData.hero_headline_pre}{' '}
              <em
                style={{
                  fontFamily: 'var(--font-italic)',
                  fontStyle: 'italic',
                  color: 'var(--accent)',
                }}
              >
                {homeData.hero_headline_em}
              </em>
              {homeData.hero_headline_post}
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
              whiteSpace: 'pre-line',
            }}
          >
            {homeData.manifesto_col1}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: 1.8,
              margin: 0,
              color: 'var(--accent-ink)',
              whiteSpace: 'pre-line',
            }}
          >
            {homeData.manifesto_col2}
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
              {homeData.agenda_date}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                marginTop: 12,
              }}
            >
              {homeData.agenda_label}
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
              {homeData.agenda_lokasi}
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
                whiteSpace: 'pre-line',
              }}
            >
              {homeData.agenda_deskripsi}
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
              src={p.image_url}
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
                    {p.body_short || p.body}
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
                whiteSpace: 'pre-line',
              }}
            >
              {homeData.lokasi_headline}
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
                    whiteSpace: 'pre-line',
                  }}
                >
                  {homeData.lokasi_alamat}
                </div>
                <div style={{ marginTop: 16 }}>
                  <PillButton onClick={() => homeData.lokasi_trans1_url && window.open(homeData.lokasi_trans1_url, '_blank', 'noopener,noreferrer')}>Rute Peken Banyumasan</PillButton>
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
                    whiteSpace: 'pre-line',
                  }}
                >
                  {homeData.lokasi_trans}
                </div>
                <div style={{ marginTop: 16 }}>
                  <PillButton onClick={() => homeData.lokasi_trans2_url && window.open(homeData.lokasi_trans2_url, '_blank', 'noopener,noreferrer')}>Trayek Trans Banyumas</PillButton>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              aspectRatio: '16/11',
              background: 'var(--bg-deep)',
              overflow: 'hidden',
            }}
          >
            <img
              src={homeData.lokasi_image_url || '/assets/map-kota-lama.png'}
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
          </div>
        </div>
      </section>
    </main>
  );
}
