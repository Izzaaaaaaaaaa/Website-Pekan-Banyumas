import Modal from './Modal.jsx';
import PillButton from './PillButton.jsx';
import { Eyebrow } from './Typography.jsx';

/**
 * Lightbox — image-first modal used by Works (PUBLICATION catalog).
 * Owner name is now a clickable link to the creator's public profile.
 * Props:
 *   work          — work object from WORKS catalogue
 *   onClose       — close the lightbox
 *   onViewProfile — (ownerName: string) => void — navigate to profile
 */
export default function Lightbox({ work, onClose, onViewProfile }) {
  // Only account-linked works (has_profile) expose a clickable profile link.
  // Manual / admin-curated entries aren't tied to an account → the creator is
  // rendered as plain text instead of a dead link.
  const canViewProfile = !!onViewProfile && !!work?.has_profile;
  const handleProfile = () => {
    if (!work || !canViewProfile) return;
    onClose();
    // Use the work's canonical slug (owner_id) so the profile lookup matches
    // the DB slug exactly. Falling back to the display name only happens for
    // legacy items without owner_id (it gets slugified downstream).
    onViewProfile(work.owner_id || work.owner);
  };

  return (
    <Modal open={!!work} onClose={onClose} labelledBy="lightbox-title" width={1080} padded={false}>
      {work && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', minHeight: 'min(480px, 70vh)' }}>
          <div style={{ background: `var(--bg-deep) url('${work.gambar_url}') center/contain no-repeat`, aspectRatio: '4/3', minHeight: 200 }} />
          <div style={{ padding: 'clamp(24px, 5vw, 40px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <Eyebrow style={{ color: 'var(--accent)' }}>
                PUBLICATION · {(work.kategori_display || '').toUpperCase()} · {work.tahun}
              </Eyebrow>
              <button onClick={onClose} aria-label="Tutup lightbox" style={{ background: 'transparent', border: 0, color: '#fff', fontSize: 20, lineHeight: 1, cursor: 'pointer', fontFamily: 'var(--font-display)', padding: 4 }}>✕</button>
            </div>

            {/* Title */}
            <h2 id="lightbox-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 28, lineHeight: 1.25, color: '#fff', margin: 0 }}>
              {work.judul}
            </h2>

            {/* Creator — clickable profile link */}
            <div style={{ paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
              <button
                onClick={handleProfile}
                title={canViewProfile ? `Lihat profil publik ${work.owner}` : undefined}
                style={{
                  background: 'transparent', border: 0, padding: 0,
                  cursor: canViewProfile ? 'pointer' : 'default',
                  display: 'inline-flex', alignItems: 'center', gap: 10, textAlign: 'left',
                }}
              >
                {/* Mini avatar */}
                <span style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--accent)', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                  color: 'var(--accent-ink)', flexShrink: 0,
                }}>
                  {(work.owner || '?').charAt(0).toUpperCase()}
                </span>
                <span>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--accent)',
                    display: 'block', lineHeight: 1.25,
                    ...(canViewProfile ? { textDecoration: 'underline', textUnderlineOffset: 3, textDecorationColor: 'rgba(195,202,150,.45)' } : {}),
                  }}>
                    {work.owner}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {work.kategori_display || ''}{canViewProfile ? ' · Lihat profil →' : ''}
                  </span>
                </span>
              </button>
            </div>

            {/* Description */}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.8, color: 'var(--fg-secondary)', margin: 0 }}>
              {work.deskripsi || 'Karya ini dirilis sebagai bagian dari katalog kontributor Peken Banyumasan.'}
            </p>

            {/* Actions */}
            <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {canViewProfile && (
                <PillButton onClick={handleProfile}>
                  Profil Kolaborator
                </PillButton>
              )}
              <PillButton inverse onClick={onClose}>Tutup Karya</PillButton>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
