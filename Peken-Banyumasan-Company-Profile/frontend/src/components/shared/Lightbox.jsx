import Modal from './Modal.jsx';
import PillButton from './PillButton.jsx';
import { Eyebrow } from './Typography.jsx';

/**
 * Lightbox — image-first modal used by Works (KARYA). Big image
 * left, metadata right (title, creator/role, year, description).
 * Uses the shared Modal a11y (focus trap, ESC, backdrop click).
 */
export default function Lightbox({ work, onClose }) {
  return (
    <Modal
      open={!!work}
      onClose={onClose}
      labelledBy="lightbox-title"
      width={1080}
      padded={false}
    >
      {work && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            minHeight: 480,
          }}
        >
          <div
            style={{
              background: `var(--bg-deep) url('${work.img}') center/contain no-repeat`,
              aspectRatio: '4/3',
            }}
          />
          <div
            style={{
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <Eyebrow style={{ color: 'var(--accent)' }}>
                KARYA · {work.role.toUpperCase()} · {work.year}
              </Eyebrow>
              <button
                onClick={onClose}
                aria-label="Tutup lightbox"
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#fff',
                  fontSize: 20,
                  lineHeight: 1,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>
            <h2
              id="lightbox-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: 28,
                lineHeight: 1.25,
                color: '#fff',
                margin: 0,
              }}
            >
              {work.title}
            </h2>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                color: 'var(--accent)',
                paddingBottom: 20,
                borderBottom: '1px solid rgba(255,255,255,.12)',
              }}
            >
              {work.owner}{' '}
              <span style={{ color: 'var(--fg-secondary)' }}>
                · {work.role}
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                lineHeight: 1.8,
                color: 'var(--fg-secondary)',
                margin: 0,
              }}
            >
              {work.description ||
                'Karya ini dirilis sebagai bagian dari katalog kontributor Peken Banyumasan. Hubungi kreator melalui kanal kontak resmi untuk informasi pemesanan, lisensi, atau kolaborasi lebih lanjut.'}
            </p>
            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
              <PillButton onClick={onClose}>Tutup Karya</PillButton>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
