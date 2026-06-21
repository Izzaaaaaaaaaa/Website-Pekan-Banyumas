import { useState, useEffect } from 'react';
import PillButton from '../shared/PillButton.jsx';
import { Eyebrow, Wordmark } from '../shared/Typography.jsx';
import SectionHeader from '../shared/SectionHeader.jsx';
import WipeReveal from '../shared/WipeReveal.jsx';
import ScreenLoader from '../shared/ScreenLoader.jsx';
import { companyProfileApi, statsApi } from '../../services/endpoints.js';

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
          fontSize: 'clamp(40px, 10vw, 96px)',
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

const STATIC_PEOPLE = [
  { photo: '/assets/tokoh-portrait-1.png', role: 'FOUNDER', name: 'Gilang Ramadhan, S.Sn., M.Ds.', title: 'Founder & Program Director', bio: 'Menggagas Peken pada Februari 2022 dan mengawal kurasi setiap edisi sejak. Latar belakang antropologi pertunjukan, dengan fokus pada kesenian Banyumasan kontemporer.' },
  { photo: '/assets/tokoh-portrait-2.png', role: 'CURATOR', name: 'Galih Putra Pamungkas, S.Sn., M.Sn.', title: 'Curator — Artisan', bio: 'Mengkurasi artisan yang masuk ke setiap edisi Peken. Sebelumnya menjalankan kolektif batik di Sokaraja; membangun program pendampingan artisan dari hulu ke hilir.' },
  { photo: '/assets/tokoh-portrait-3.png', role: 'STRATEGIC PARTNER', name: 'Jakarta Tisam S.STP, M.Si', title: 'Strategic Partner & Community Lead', bio: 'Menjaga jaringan kolaborator, sponsor, dan mitra institusi — kampus, pemerintah daerah, swasta. Memegang rasio kolaborasi yang sehat antar enam helix.' },
];

const STATIC_STATS = [
  { n: '86', label: 'Edisi Peken diselenggarakan' },
  { n: '240', label: 'Kolaborator aktif' },
  { n: '1.2k', label: 'Artisan terlibat' },
  { n: '38k', label: 'Pengunjung setiap edisi' },
];

// Per-field fallback defaults for the `about` section — the current hardcoded
// copy. Multi-paragraph fields are \n\n-joined plain strings (rendered with
// whiteSpace: 'pre-line'); accent-heading fields are plain strings (the italic
// accent is intentionally dropped when DB content is present).
const ABOUT_DEFAULTS = {
  hero_headline:
    'Peken lahir dari keinginan untuk menghidupkan kembali denyut kota lama melalui seni, pasar, dan kebersamaan.',
  manifesto_col1:
    'Peken Banyumasan tumbuh dari percakapan kecil di sudut Kota Lama — antara seniman pertunjukan, pelaku Artisan, dan warga sekitar yang ingin menghidupkan kembali ruang publik sebagai tempat bertemu, bukan sekadar berdagang.\n\nDari obrolan itu, lahir gerakan dwi-mingguan yang konsisten sejak Februari 2022 — sebuah ritual kolektif yang mempertemukan tradisi, kerajinan, dan kuliner Banyumasan dalam satu malam.',
  manifesto_col2:
    'Kami percaya kebudayaan tidak perlu dipajang di balik kaca. Ia hidup ketika dirayakan secara rutin, dalam skala kecil, oleh orang-orang yang merasa memilikinya.\n\nSetiap edisi Peken adalah usaha sederhana untuk menjaga warisan tetap berdetak — sambil membuka ruang bagi karya baru tumbuh di atasnya.',
  mirapat_intro:
    'Peken Banyumasan bukan event satu-malam — ia adalah mirapat, kata Banyumasan yang berarti perjumpaan rutin yang dijaga bersama. Setiap edisi mempertemukan seniman pertunjukan tradisional, perajin muda, pelaku Artisan, akademisi, hingga warga sekitar dalam satu ruang yang sama.',
  mirapat_quote:
    '"Bukan pasar yang menjadi tujuan, melainkan perjumpaan yang menjadikan pasar itu bermakna."',
  mirapat_closing:
    'Tiga sumbu menjadi fondasi gerakan ini — pelestarian budaya, ruang berkarya bagi pelaku kreatif, dan ekonomi yang berputar di dalam komunitasnya sendiri.',
  pillars: [
    { n: '01', label: 'CULTURE', body: 'Melestarikan kearifan lokal, seni pertunjukan tradisional, dan warisan budaya takbenda Banyumas sebagai fondasi gerakan.' },
    { n: '02', label: 'CREATIVE', body: 'Memberikan ruang bagi seniman, perajin, dan kolektif muda untuk berkarya dan bertemu audiens yang sebenarnya.' },
    { n: '03', label: 'CIRCULAR', body: 'Mendorong ekonomi berputar di dalam komunitas — dari artisan lokal, bahan lokal, hingga pengunjung lokal.' },
  ],
  visi:
    'Menjadi ekosistem budaya dan ekonomi kreatif yang menjaga kearifan lokal Banyumas tetap berdetak — relevan, hidup, dan berkelanjutan.',
  tujuan:
    'Menyediakan ruang publik dwi-mingguan yang mempertemukan pelaku seni, Artisan, dan masyarakat — sehingga warisan budaya Banyumasan dirawat melalui praktik bersama, bukan sekadar dipamerkan.',
  sasaran:
    'Seniman pertunjukan tradisional, perajin & Artisan Banyumas, komunitas kreatif muda, akademisi, mitra pemerintah dan swasta, serta pengunjung lokal-regional yang menjadi audiens sekaligus pelaku.',
};

// Fallback for the hexa-helix cards (carried by the `tim` section).
const HEXA_DEFAULTS = [
  { name: 'Government', body: 'Pemerintah Kabupaten Banyumas dan instansi terkait sebagai mitra kebijakan dan ruang publik.' },
  { name: 'Academia', body: 'Kampus dan lembaga riset sebagai sumber kajian, kurikulum, dan tenaga kurasi muda.' },
  { name: 'Industry', body: 'Pelaku usaha skala Artisan hingga korporasi sebagai mitra ekonomi dan ekosistem produk.' },
  { name: 'Community', body: 'Warga, kolektif seni, dan komunitas hobi sebagai inti gerakan dan audiens setia Peken.' },
  { name: 'Media', body: 'Jejaring media independen dan jurnalisme budaya sebagai penjaga narasi gerakan.' },
  { name: 'Finance', body: 'Mitra pembiayaan — bank, koperasi, hingga skema gotong royong — yang menjaga sirkulasi ekonomi tetap sehat.' },
];

// Fallback for the two LEGALITAS columns (carried by the `tim` section).
const LEGALITAS_DUKUNGAN_DEFAULT =
  'Peken Banyumasan didukung oleh jaringan mitra lintas sektor: Pemerintah Kabupaten Banyumas dan Dinas Kebudayaan sebagai mitra kebijakan; Universitas Jenderal Soedirman sebagai mitra riset dan pendampingan kurasi; Bank BPD Jawa Tengah sebagai mitra pembiayaan Artisan; Komunitas Kota Lama Banyumas sebagai mitra penyelenggara di lokasi.\n\nDukungan ini terdokumentasi dalam Memorandum of Understanding yang diperbarui setiap dua tahun, dan operasional tahunan dilaporkan secara terbuka kepada para mitra sebagai bagian dari prinsip akuntabilitas gerakan.';

const LEGALITAS_HUKUM_DEFAULT =
  'Peken Banyumasan beroperasi di bawah payung Yayasan Peken Banyumasan, dengan landasan hukum nasional pada UU No. 5/2017 tentang Pemajuan Kebudayaan dan UU No. 24/2019 tentang Ekonomi Kreatif, serta payung daerah pada Peraturan Daerah Kabupaten Banyumas No. 6/2020 tentang Pemajuan Kebudayaan Daerah.\n\nYayasan terdaftar resmi dengan NPWP 00.000.000.0-000.000 dan NIB 0000000000000 (akan diperbarui pada handoff data legal sebenarnya), tunduk pada laporan keuangan dan tata kelola yayasan sebagaimana diatur dalam UU Yayasan.';

function fmtStat(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export default function AboutScreen() {
  const [timData, setTimData] = useState(null);
  const [aboutData, setAboutData] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gate the initial render on the `about` + `tim` sections (the screen's
  // primary content) so visitors never see bundled fallback copy flash to
  // real. `stats` is secondary — it fills in after without blocking.
  useEffect(() => {
    Promise.allSettled([
      companyProfileApi.get('tim').then(d => { if (d) setTimData(d); }),
      companyProfileApi.get('about').then(d => { if (d) setAboutData(d); }),
    ]).finally(() => setLoading(false));
    statsApi.public()
      .then(d => { if (d) setLiveStats(d); })
      .catch(() => {});
  }, []);

  // Merge CMS `about` content over the hardcoded defaults — any missing or
  // empty field falls back to the original copy, so nothing breaks.
  const a = { ...ABOUT_DEFAULTS, ...(aboutData || {}) };
  const pillars = a.pillars?.length ? a.pillars : ABOUT_DEFAULTS.pillars;
  const helix = timData?.hexa_helix?.length ? timData.hexa_helix : HEXA_DEFAULTS;

  const keyPeople = timData?.key_people?.length ? timData.key_people : STATIC_PEOPLE;

  // Live aggregate counts win. Fallback order for the CMS-curated numbers:
  // the `about` section (where the Gate "Statistik Ekosistem" editor saves),
  // then the `tim` section (where the seed places them), then static.
  const cmsStats = a.stats?.length
    ? a.stats
    : (timData?.stats?.length ? timData.stats : STATIC_STATS);
  const statsData = liveStats
    ? [
        { n: fmtStat(liveStats.edisi_count),        label: 'Edisi Peken diselenggarakan' },
        { n: fmtStat(liveStats.kolaborator_aktif),   label: 'Kolaborator aktif' },
        { n: fmtStat(liveStats.artisan_aktif),       label: 'Artisan terlibat' },
        { n: fmtStat(liveStats.pengunjung_total),    label: 'Pengunjung setiap edisi' },
      ]
    : cmsStats;

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
          padding: '0 var(--page-px)',
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
            fontSize: 'clamp(30px, 6vw, 56px)',
            lineHeight: 1.15,
            margin: '24px auto 0',
            maxWidth: 960,
          }}
        >
          {a.hero_headline}
        </h1>
      </div>
    </section>
  );

  const Manifesto = (
    <section
      style={{
        padding: '100px var(--page-px)',
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
            whiteSpace: 'pre-line',
          }}
        >
          {a.manifesto_col1}
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
          {a.manifesto_col2}
        </p>
      </div>
    </section>
  );

  if (loading) return <ScreenLoader />;

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
      <section style={{ padding: '120px var(--page-px) 60px', textAlign: 'center' }}>
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
          {a.mirapat_intro}
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
          {a.mirapat_quote}
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
          {a.mirapat_closing}
        </p>
      </section>

      {/* THREE PILLARS */}
      <section style={{ padding: '60px var(--page-px) 100px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 40,
          }}
        >
          {pillars.map((p, i) => (
            <Pillar key={i} n={p.n} label={p.label} body={p.body} />
          ))}
        </div>
      </section>

      {/* §6 — VISI · TUJUAN · SASARAN — sage band */}
      <section
        style={{
          padding: '120px var(--page-px)',
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
            {a.visi}
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
              {a.tujuan}
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
              {a.sasaran}
            </p>
          </div>
        </div>
      </section>

      {/* §7 — KEY PEOPLE */}
      <section style={{ padding: '120px var(--page-px)' }}>
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
          {keyPeople.map((p, i) => (
            <PersonCard
              key={i}
              photo={p.photo || p.foto_url}
              role={p.role}
              name={p.name || p.nama}
              title={p.title}
              bio={p.bio}
            />
          ))}
        </div>
      </section>

      {/* §9 — HEXA-HELIX */}
      <section
        style={{
          padding: '120px var(--page-px)',
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
          {helix.map((h, i) => (
            <HelixCard key={i} name={h.name} body={h.body} />
          ))}
        </div>
      </section>

      {/* §10 — LANDASAN LEGALITAS · 3 columns */}
      <section
        style={{
          padding: '120px var(--page-px)',
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
                whiteSpace: 'pre-line',
              }}
            >
              {timData?.legalitas_dukungan || LEGALITAS_DUKUNGAN_DEFAULT}
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
                whiteSpace: 'pre-line',
              }}
            >
              {timData?.legalitas_hukum || LEGALITAS_HUKUM_DEFAULT}
            </p>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section
        style={{
          padding: '100px var(--page-px)',
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
          {statsData.map((s, i) => (
            <Stat key={i} n={s.n} label={s.label} />
          ))}
        </div>
      </section>
    </main>
  );
}
