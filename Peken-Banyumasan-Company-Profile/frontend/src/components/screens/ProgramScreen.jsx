import { useState } from 'react';
import PillButton from '../shared/PillButton.jsx';
import { Eyebrow } from '../shared/Typography.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import useFetch from '../../hooks/useFetch.js';
import { api } from '../../lib/api.js';

// Peken Banyumasan — Program screen · v1.3
// Tambahan: halaman detail program saat "Selengkapnya" diklik.

// Data statis target & durasi per slug
const PROGRAM_META = {
  'banyumasan-fashionshow': { target: 'Umum',              durasi: '±90 menit' },
  'bring-your-own-bowl':    { target: 'Umum',              durasi: 'Sepanjang event' },
  'local-market':           { target: 'Umum',              durasi: 'Sepanjang event' },
  'pitutur-banyumasan':     { target: 'Umum',              durasi: '±60 menit' },
  'coffee-and-conversation':{ target: 'Komunitas & undangan', durasi: '±120 menit' },
  'makers-workshop':        { target: 'Umum (maks 20 orang)', durasi: '±120 menit' },
};

export default function ProgramScreen() {
  const { data, loading } = useFetch(() => api.getPrograms(), []);
  const [selected, setSelected] = useState(null);

  const programs = (data || []).map((p, i) => ({
    ...p,
    n:    String(i + 1).padStart(2, '0'),
    img:  p.icon_url || `/assets/program-${p.slug}.jpg`,
    body: p.deskripsi,
    ...(PROGRAM_META[p.slug] || { target: 'Umum', durasi: '-' }),
  }));

  // Tampilkan halaman detail kalau ada program yang dipilih
  if (selected) {
    return (
      <ProgramDetail
        program={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <main style={{ background: 'var(--bg-page)', color: '#fff' }}>
      <section style={{ padding: '100px 120px 60px' }}>
        <Eyebrow style={{ color: 'var(--accent)' }}>
          PROGRAM · ENAM PILAR PEKEN
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
          Enam program yang berulang setiap edisi — dari peragaan busana
          hingga panggung cerita lisan.
        </h1>
      </section>

      <section style={{ padding: '40px 120px 100px' }}>
        {loading ? (
          <div style={{ color: 'var(--fg-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, textAlign: 'center', padding: '80px 0' }}>
            Memuat program…
          </div>
        ) : (
          programs.map((p, i) => (
            <ProgramRow
              key={p.id || p.n}
              program={p}
              flip={i % 2 === 1}
              onDetail={() => setSelected(p)}
            />
          ))
        )}
      </section>
    </main>
  );
}

/* ── Detail page ── */
function ProgramDetail({ program, onBack }) {
  return (
    <main style={{ background: 'var(--bg-page)', color: '#fff' }}>

      {/* Hero banner */}
      <div
        style={{
          position: 'relative',
          height: '50vh',
          minHeight: 320,
          backgroundImage: `url('${program.img}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(13,13,13,.55)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            padding: '0 120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: 36,
          }}
        >
          <Eyebrow style={{ color: 'var(--accent)', marginBottom: 12 }}>
            PROGRAM · {program.n}
          </Eyebrow>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 52,
              lineHeight: 1.1,
              margin: 0,
              color: '#fff',
            }}
          >
            {program.nama}
          </h1>
        </div>
      </div>

      {/* Body */}
      <section style={{ padding: '60px 120px 100px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: 80,
            alignItems: 'flex-start',
          }}
        >
          {/* Kiri — deskripsi + tombol kembali */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                lineHeight: 1.9,
                color: 'var(--fg-secondary)',
                margin: 0,
                maxWidth: '52ch',
              }}
            >
              {program.deskripsi}
            </p>
            <div>
              <PillButton onClick={onBack}>← Kembali ke Program</PillButton>
            </div>
          </div>

          {/* Kanan — metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <MetaItem label="TARGET PESERTA" value={program.target} />
            <MetaItem label="DURASI"         value={program.durasi} />
            <MetaItem
              label="PROGRAM"
              value="Enam program berulang setiap edisi Peken Banyumasan"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--fg-secondary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ── Program row (list view) ── */
function ProgramRow({ program, flip, onDetail }) {
  const img = (
    <PhotoTile
      src={program.img}
      alt={program.nama}
      aspect="16/9"
      mode="hover"
      style={{ width: '100%' }}
      caption={
        <div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--accent)',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            PROGRAM · {program.n}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 18,
              color: '#fff',
            }}
          >
            {program.nama}
          </div>
        </div>
      }
    />
  );

  const text = (
    <div
      style={{
        padding: '40px 40px 40px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
        <div
          style={{
            fontFamily: 'Inter',
            fontWeight: 300,
            fontSize: 64,
            lineHeight: 1,
            color: 'var(--accent)',
          }}
        >
          {program.n}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            color: '#fff',
          }}
        >
          {program.nama}
        </div>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.9,
          color: 'var(--fg-secondary)',
          margin: 0,
          maxWidth: '52ch',
        }}
      >
        {program.deskripsi}
      </p>
      <div>
        <PillButton onClick={onDetail}>Selengkapnya</PillButton>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: flip ? '1fr 1.2fr' : '1.2fr 1fr',
        gap: 40,
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,.08)',
        paddingBlock: 24,
      }}
    >
      {flip ? text : img}
      {flip ? img : text}
    </div>
  );
}
