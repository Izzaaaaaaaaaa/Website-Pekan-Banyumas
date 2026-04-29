import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import PillButton from '../shared/PillButton.jsx';
import { Eyebrow } from '../shared/Typography.jsx';
import { PROGRAMS } from '../../data/programs.js';
import { programsApi } from '../../services/endpoints.js';

export default function ProgramDetailScreen({ programId, onBack }) {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    programsApi.detail(programId)
      .then(data => { if (data) setProgram(data); })
      .catch(() => {
        const fallback = PROGRAMS.find(p => p.slug === programId || p.n === programId);
        if (fallback) setProgram(fallback);
      })
      .finally(() => setLoading(false));
  }, [programId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', background: 'var(--bg-page)' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid rgba(195,202,150,.2)',
        borderTopColor: 'var(--accent, #C3CA96)',
        animation: 'spin .8s linear infinite',
      }} />
    </div>
  );

  if (!program) {
    return (
      <main style={{ background: 'var(--bg-page)', color: '#fff', padding: '120px', textAlign: 'center' }}>
        <Eyebrow style={{ color: 'var(--accent)' }}>PROGRAM · TIDAK DITEMUKAN</Eyebrow>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--fg-secondary)', marginTop: 24 }}>
          Program tidak ditemukan.
        </p>
        <div style={{ marginTop: 36 }}>
          <PillButton onClick={onBack}>← Kembali ke Program</PillButton>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: 'var(--bg-page)', color: '#fff' }}>
      {/* Hero */}
      <section
        style={{
          position: 'relative',
          height: '60vh',
          background: `url('${program.image_url}') center/cover no-repeat`,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(13,13,13,.3), rgba(13,13,13,.85))',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '60px 120px',
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
              lineHeight: 1.15,
              margin: 0,
              maxWidth: 900,
            }}
          >
            {program.title}
          </h1>
        </div>
      </section>

      {/* Body */}
      <section style={{ padding: '80px 120px 120px', maxWidth: 1200 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 80 }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                lineHeight: 2,
                color: 'var(--fg-secondary)',
              }}
            >
              <ReactMarkdown>{program.body || program.body_short || ''}</ReactMarkdown>
            </div>
            <div style={{ marginTop: 48 }}>
              <PillButton onClick={onBack}>← Kembali ke Program</PillButton>
            </div>
          </div>

          {/* Meta sidebar */}
          <div
            style={{
              borderLeft: '1px solid rgba(255,255,255,.08)',
              paddingLeft: 48,
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
            }}
          >
            {program.target_peserta && (
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    marginBottom: 8,
                  }}
                >
                  Target Peserta
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: 'var(--fg-secondary)',
                    margin: 0,
                  }}
                >
                  {program.target_peserta}
                </p>
              </div>
            )}
            {program.durasi && (
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    marginBottom: 8,
                  }}
                >
                  Durasi
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: 'var(--fg-secondary)',
                    margin: 0,
                  }}
                >
                  {program.durasi}
                </p>
              </div>
            )}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  marginBottom: 8,
                }}
              >
                Program
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'var(--fg-secondary)',
                  margin: 0,
                }}
              >
                Enam program berulang setiap edisi Peken Banyumasan
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
