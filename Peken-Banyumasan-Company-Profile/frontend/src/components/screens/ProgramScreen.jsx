import { useState, useEffect } from 'react';
import PillButton from '../shared/PillButton.jsx';
import { Eyebrow } from '../shared/Typography.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import ScreenLoader from '../shared/ScreenLoader.jsx';
import { PROGRAMS } from '../../data/programs.js';
import { companyProfileApi } from '../../services/endpoints.js';

// Peken Banyumasan — Program screen · v1.2
// §3 — Program rows use mode="hover" (full pixel-step colourise).

export default function ProgramScreen({ onNavigate }) {
  const [programs, setPrograms] = useState(PROGRAMS);
  const [loading, setLoading] = useState(true);

  // Programs are company-profile content — read the `programs` section
  // (managed by the Gate "Kelola Company Profile" editor).
  useEffect(() => {
    companyProfileApi.get('programs')
      .then(data => { if (Array.isArray(data) && data.length) setPrograms(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ScreenLoader />;

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
        {programs.map((p, i) => (
          <ProgramRow key={p.n} program={p} flip={i % 2 === 1} onNavigate={onNavigate} />
        ))}
      </section>
    </main>
  );
}

function ProgramRow({ program, flip, onNavigate }) {
  /* §3 — Program photos use the hover treatment with caption:
     full pixel-step colourise + title/desc slide-in on hover. */
  const img = (
    <PhotoTile
      src={program.image_url}
      alt={program.title}
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
            {program.title}
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
          {program.title}
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
        {program.body}
      </p>
      <div>
        <PillButton onClick={() => onNavigate && onNavigate('PROGRAM_DETAIL', program.slug || program.n)}>Selengkapnya</PillButton>
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
