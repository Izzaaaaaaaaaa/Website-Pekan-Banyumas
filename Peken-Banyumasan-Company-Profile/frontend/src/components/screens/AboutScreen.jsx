import { useState } from 'react';
import PillButton from '../shared/PillButton.jsx';
import { Eyebrow, Wordmark } from '../shared/Typography.jsx';
import SectionHeader from '../shared/SectionHeader.jsx';
import WipeReveal from '../shared/WipeReveal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { api } from '../../lib/api.js';

// Peken Banyumasan — About screen · v1.2
// Implements:
//   §4 — WipeReveal between hero and manifesto echo (powerpoint
//        wipe-from-bottom: hero stays sticky, sage gradient slides
//        up from bottom to cover it).
//   §5 — #MIRAPAT tag + intro now CENTERED.
//   §6 — NEW VISI · TUJUAN · SASARAN block, sage band.
//   §7 — KeyPeople cards now have an elevated bg + sage hairline.
//   §8 — PixelSkyline animation removed from About entirely.
//   §9 — Hexa-helix cards: Peken logomark removed; hover brightens body.
//   §10 — Landasan Legalitas restructured: 3 columns.

function PersonCard({ photo, role, name, title, bio }) {
  const [open, setOpen] = useState(false);
  return (
    <article
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid rgba(195,202,150,.22)',
        outlineOffset: 2,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 320ms cubic-bezier(.22,.61,.36,1)',
      }}
    >
      <div
        style={{
          aspectRatio: '1/1',
          background: `url('${photo}') center/cover`,
          borderBottom: '1px solid rgba(195,202,150,.22)',
        }}
      />
      <div style={{ padding: 24 }}>
        <Eyebrow style={{ color: 'var(--accent)' }}>{role}</Eyebrow>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 500,
            color: '#fff',
            marginTop: 8,
            lineHeight: 1.3,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--fg-secondary)',
            marginTop: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            maxHeight: open ? 280 : 0,
            opacity: open ? 1 : 0,
            overflow: 'hidden',
            transition:
              'max-height 320ms cubic-bezier(.22,.61,.36,1), opacity 320ms cubic-bezier(.22,.61,.36,1) 80ms',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: 1.8,
              color: '#fff',
              margin: '20px 0 0',
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,.08)',
            }}
          >
            {bio}
          </p>
        </div>
      </div>
    </article>
  );
}

function HelixCard({ name, body }) {
  return (
    <div
      className="helix-card"
      tabIndex={0}
      style={{
        borderTop: '1px solid rgba(255,255,255,.15)',
        paddingTop: 24,
        paddingInline: 16,
        paddingBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        outlineOffset: 2,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 18,
          color: 'var(--accent)',
          letterSpacing: '.02em',
        }}
      >
        {name}
      </div>
      <p
        className="helix-body"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          lineHeight: 1.8,
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  );
}

function Pillar({ n, label, body }) {
  return (
    <div
      style={{
        borderTop: '1px solid rgba(255,255,255,.15)',
        paddingTop: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 14,
            color: 'var(--accent)',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: 'Inter',
            fontWeight: 300,
            fontSize: 14,
            color: 'var(--fg-muted)',
          }}
        >
          {n}
        </div>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--fg-secondary)',
          margin: '24px 0 0',
          maxWidth: '42ch',
        }}
      >
        {body}
      </p>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'Inter',
          fontWeight: 300,
          fontSize: 96,
          lineHeight: 1,
          color: 'var(--accent)',
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          color: 'var(--fg-secondary)',
          marginTop: 12,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function AboutScreen() {
  const { data: about } = useFetch(() => api.getSection('about'), []);
  const { data: tim }   = useFetch(() => api.getSection('tim'),   []);

  // Fallback ke data statis kalau API belum ada isinya
  const members  = tim?.members  || [];
  const stats    = about?.stats  || [
    { n: '86',   label: 'Edisi Peken diselenggarakan' },
    { n: '240',  label: 'Seniman & kolektif tampil' },
    { n: '1.2k', label: 'UMKM & tenant terlibat' },
    { n: '38k',  label: 'Pengunjung setiap edisi' },
  ];
  const pillars  = about?.pillars || [
    { n: '01', label: 'CULTURE',  body: 'Melestarikan kearifan lokal, seni pertunjukan tradisional, dan warisan budaya takbenda Banyumas sebagai fondasi gerakan.' },
    { n: '02', label: 'CREATIVE', body: 'Memberikan ruang bagi seniman, perajin, dan kolektif muda untuk berkarya dan bertemu audiens yang sebenarnya.' },
    { n: '03', label: 'CIRCULAR', body: 'Mendorong ekonomi berputar di dalam komunitas — dari tenant lokal, bahan lokal, hingga pengunjung lokal.' },
  ];
  const helix    = about?.helix   || [
    { name: 'Government', body: 'Pemerintah Kabupaten Banyumas dan instansi terkait sebagai mitra kebijakan dan ruang publik.' },
    { name: 'Academia',   body: 'Kampus dan lembaga riset sebagai sumber kajian, kurikulum, dan tenaga kurasi muda.' },
    { name: 'Industry',   body: 'Pelaku usaha skala UMKM hingga korporasi sebagai mitra ekonomi dan ekosistem produk.' },
    { name: 'Community',  body: 'Warga, kolektif seni, dan komunitas hobi sebagai inti gerakan dan audiens setia Peken.' },
    { name: 'Media',      body: 'Jejaring media independen dan jurnalisme budaya sebagai penjaga narasi gerakan.' },
    { name: 'Finance',    body: 'Mitra pembiayaan — bank, koperasi, hingga skema gotong royong — yang menjaga sirkulasi ekonomi tetap sehat.' },
  ];

  const heroTitle        = about?.hero_title        || 'Peken lahir dari keinginan untuk menghidupkan kembali denyut kota lama melalui seni, pasar, dan kebersamaan.';
  const manifestoLeft    = about?.manifesto_left    || '';
  const manifestoRight   = about?.manifesto_right   || '';
  const intro            = about?.intro             || '';
  const quote            = about?.quote             || '';
  const visi             = about?.visi              || '';
  const tujuan           = about?.tujuan            || '';
  const sasaran          = about?.sasaran           || '';
  const legalDukungan    = about?.legalitas_dukungan || '';
  const legalHukum       = about?.legalitas_hukum   || '';
  const Hero = (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundImage: "url('/assets/banner-about.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(13,13,13,.6)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          padding: '0 120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Eyebrow style={{ color: 'var(--accent)' }}>
          ABOUT · TENTANG KAMI
        </Eyebrow>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 56,
            lineHeight: 1.15,
            margin: '24px auto 0',
            maxWidth: 960,
          }}
        >
          {heroTitle}
        </h1>
      </div>
    </section>
  );

  const Manifesto = (
    <section
      style={{
        padding: '100px 120px',
        background: 'var(--accent)',
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
          {(manifestoLeft || '').split('\n\n').map((p, i) => (
            <span key={i}>{p}{i === 0 && <><br /><br /></>}</span>
          ))}
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
          {(manifestoRight || '').split('\n\n').map((p, i) => (
            <span key={i}>{p}{i === 0 && <><br /><br /></>}</span>
          ))}
        </p>
      </div>
    </section>
  );

  return (
    <main style={{ background: 'var(--bg-page)', color: '#fff' }}>
      {/* §4 — Sticky-pin transition (v1.5). */}
      <WipeReveal
        before={Hero}
        after={Manifesto}
        mode="sticky"
        pinHeight="200vh"
        fromColor="var(--bg-page)"
        toColor="var(--accent)"
      />

      {/* §5 — #MIRAPAT tag + extended intro, all CENTERED */}
      <section style={{ padding: '120px 120px 60px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: '.04em',
            color: 'var(--accent)',
            padding: '6px 12px',
            border: '1px solid var(--accent)',
            marginBottom: 40,
          }}
        >
          #MIRAPAT
          <span
            aria-hidden="true"
            style={{ width: 4, height: 4, background: 'var(--accent)' }}
          />
          BANYUMASAN
        </div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            lineHeight: 1.9,
            color: 'var(--fg-secondary)',
            margin: '0 auto',
            maxWidth: '62ch',
          }}
        >
          {intro}
        </p>
        <blockquote
          style={{
            margin: '60px auto',
            padding: '32px 0',
            borderTop: '1px solid rgba(255,255,255,.15)',
            borderBottom: '1px solid rgba(255,255,255,.15)',
            fontFamily: 'var(--font-italic)',
            fontStyle: 'italic',
            fontSize: 28,
            lineHeight: 1.5,
            color: '#fff',
            maxWidth: '44ch',
          }}
        >
          "{quote}"
        </blockquote>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            lineHeight: 1.9,
            color: 'var(--fg-secondary)',
            margin: '0 auto',
            maxWidth: '62ch',
          }}
        >
          Tiga sumbu menjadi fondasi gerakan ini — pelestarian budaya, ruang
          berkarya bagi pelaku kreatif, dan ekonomi yang berputar di dalam
          komunitasnya sendiri.
        </p>
      </section>

      {/* THREE PILLARS */}
      <section style={{ padding: '60px 120px 100px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 40,
          }}
        >
          {pillars.map((p) => (
            <Pillar key={p.n} n={p.n} label={p.label} body={p.body} />
          ))}
        </div>
      </section>

      {/* §6 — VISI · TUJUAN · SASARAN — sage band */}
      <section
        style={{
          padding: '120px 120px',
          background: 'var(--accent)',
          color: 'var(--accent-ink)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: 80,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: '.08em',
              color: 'var(--peken-smoke)',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            VISI
          </div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 32,
              lineHeight: 1.4,
              color: 'var(--accent-ink)',
              margin: 0,
              maxWidth: '44ch',
            }}
          >
            {visi}
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 48,
            paddingTop: 60,
            borderTop: '1px solid rgba(13,13,13,.18)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                letterSpacing: '.08em',
                color: 'var(--peken-smoke)',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              TUJUAN
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.9,
                margin: 0,
                color: 'var(--accent-ink)',
                maxWidth: '56ch',
              }}
            >
              {tujuan}
            </p>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                letterSpacing: '.08em',
                color: 'var(--peken-smoke)',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              SASARAN
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.9,
                margin: 0,
                color: 'var(--accent-ink)',
                maxWidth: '56ch',
              }}
            >
              {sasaran}
            </p>
          </div>
        </div>
      </section>

      {/* §7 — KEY PEOPLE */}
      <section style={{ padding: '120px 120px' }}>
        <SectionHeader
          eyebrow="KEY PEOPLE · TIM INTI"
          title={
            <>
              Orang-orang yang menjaga{' '}
              <em
                style={{
                  fontFamily: 'var(--font-italic)',
                  fontStyle: 'italic',
                  color: 'var(--accent)',
                }}
              >
                denyut
              </em>{' '}
              Peken setiap edisi.
            </>
          }
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          {members.map((m) => (
            <PersonCard
              key={m.name}
              photo={m.photo}
              role={m.role}
              name={m.name}
              title={m.title}
              bio={m.bio}
            />
          ))}
        </div>
      </section>

      {/* §9 — HEXA-HELIX */}
      <section
        style={{
          padding: '120px 120px',
          background: 'var(--bg-elevated)',
          color: '#fff',
        }}
      >
        <SectionHeader
          eyebrow="MODEL KOLABORASI · HEXA-HELIX"
          title={
            <>
              Enam pilar yang menjaga Peken tetap{' '}
              <em
                style={{
                  fontFamily: 'var(--font-italic)',
                  fontStyle: 'italic',
                  color: 'var(--accent)',
                }}
              >
                berimbang
              </em>{' '}
              — bukan hanya berjalan.
            </>
          }
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            rowGap: 20,
            columnGap: 0,
          }}
        >
          {helix.map((h) => (
            <HelixCard key={h.name} name={h.name} body={h.body} />
          ))}
        </div>
      </section>

      {/* §10 — LANDASAN LEGALITAS · 3 columns */}
      <section
        style={{
          padding: '120px 120px',
          background: 'var(--bg-page)',
          color: '#fff',
        }}
      >
        <SectionHeader
          eyebrow="LEGALITAS & DUKUNGAN"
          title="Landasan hukum dan jaringan dukungan kelembagaan."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 60,
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                letterSpacing: '.08em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              Dukungan Kelembagaan
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.9,
                color: 'var(--fg-secondary)',
                margin: 0,
              }}
            >
              {legalDukungan}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: 40,
              alignSelf: 'center',
            }}
          >
            <img
              src="/assets/logo-peken-banyumasan.png"
              alt="Logo Peken Banyumasan"
              style={{ width: 100, height: 100 }}
            />
          </div>

          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                letterSpacing: '.08em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              Landasan Legalitas
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.9,
                color: 'var(--fg-secondary)',
                margin: 0,
              }}
            >
              {legalHukum}
            </p>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section
        style={{
          padding: '100px 120px',
          background: 'var(--bg-elevated)',
        }}
      >
        <Eyebrow style={{ color: 'var(--accent)', marginBottom: 40 }}>
          EKOSISTEM PEKEN · SEJAK FEBRUARI 2022
        </Eyebrow>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 40,
          }}
        >
          {stats.map((s) => (
            <Stat key={s.label} n={s.n} label={s.label} />
          ))}
        </div>
      </section>
    </main>
  );
}
