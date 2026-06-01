import Modal from '../shared/Modal.jsx';
import PillButton from '../shared/PillButton.jsx';
import { Eyebrow } from '../shared/Typography.jsx';

/**
 * Login role-select modal. Implements Raib §4.10. Centered modal (not
 * dropdown) with two equal role cards. Backdrop, blur, ESC-to-close,
 * focus trap all live in the shared <Modal>. Each CTA redirects to the
 * login page owned by each role's app.
 *
 * URL dikonfigurasi via .env:
 *   VITE_KOLABORATOR_URL  → app kolaborator (default: http://localhost:5175)
 *   VITE_ARTISAN_URL      → app artisan/UMKM (default: http://localhost:5174)
 */
export default function LoginModal({ open, onClose }) {
  const ROLE_URLS = {
    kolaborator: import.meta.env.VITE_KOLABORATOR_URL || 'http://localhost:5175',
    artisan:     import.meta.env.VITE_ARTISAN_URL     || 'http://localhost:5174',
  };

  const goRole = (role) => () => {
    onClose();
    window.open(`${ROLE_URLS[role]}/login`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="login-modal-title" width={760}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 24,
          }}
        >
          <div>
            <Eyebrow style={{ color: 'var(--accent)' }}>
              MASUK · PILIH PERAN
            </Eyebrow>
            <h2
              id="login-modal-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: 28,
                lineHeight: 1.25,
                color: '#fff',
                margin: '16px 0 0',
                maxWidth: '32ch',
              }}
            >
              Pilih peranmu untuk melanjutkan.
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            style={{
              background: 'transparent',
              border: 0,
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
              fontFamily: 'var(--font-display)',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <RoleCard
            role="Kolaborator"
            tagline="Profesional kreatif & institusi terkurasi"
            body="Untuk fotografer, jurnalis, kurator, brand, dan lembaga yang ingin berkontribusi karya editorial atau program kolaboratif ke ekosistem Peken."
            onClick={goRole('kolaborator')}
          />
          <RoleCard
            role="Artisan"
            tagline="UMKM, perajin, & tenant Peken"
            body="Untuk perajin, pelaku UMKM, dan tenant yang ingin memajang produk dan profil usaha sebagai bagian dari katalog karya Peken."
            onClick={goRole('artisan')}
          />
        </div>
        {/* §12 — "belum punya akun" footer removed in v1.2.
            Each /login/{role} route owns its own signup mechanism. */}
      </div>
    </Modal>
  );
}

function RoleCard({ role, tagline, body, onClick }) {
  return (
    <div
      style={{
        background: 'var(--bg-page)',
        border: '1px solid rgba(195,202,150,.25)',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: 280,
      }}
    >
      <img
        src="/assets/logo-peken-banyumasan.png"
        alt=""
        style={{ width: 32, height: 32 }}
      />
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 20,
            color: '#fff',
          }}
        >
          {role}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--accent)',
            marginTop: 4,
          }}
        >
          {tagline}
        </div>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          lineHeight: 1.7,
          color: 'var(--fg-secondary)',
          margin: 0,
        }}
      >
        {body}
      </p>
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <PillButton onClick={onClick}>Masuk sebagai {role}</PillButton>
      </div>
    </div>
  );
}
