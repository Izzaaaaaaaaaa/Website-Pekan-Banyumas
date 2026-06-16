import { useState, useEffect } from 'react';
import { Eyebrow } from '../shared/Typography.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import Lightbox from '../shared/Lightbox.jsx';
import ScreenLoader from '../shared/ScreenLoader.jsx';
import { WORKS } from '../../data/works.js';
import { companyProfileApi, karyaApi } from '../../services/endpoints.js';

// Peken Banyumasan — PUBLICATION / Works screen · v1.3 (tab relabeled, UI only)
// Added: onViewProfile prop passed to Lightbox so clicking a creator
// name navigates to their public profile page.

export default function WorksScreen({ onNavigate }) {
  const [lightbox, setLightbox] = useState(null);
  const [works, setWorks] = useState(WORKS);
  const [loading, setLoading] = useState(true);

  // The Publication catalog combines two sources:
  //  1. real karya UPLOADED by kolaborator/artisan accounts (the `karya` table,
  //     served by /api/public/karya) — this is what was missing, so uploads
  //     never showed here; and
  //  2. the admin-curated `works` company-profile section (Gate "Kelola
  //     Company Profile"). Hidden entries (visible === false) are dropped.
  // Uploads are listed first; the static WORKS fallback is used only if both
  // sources are empty.
  useEffect(() => {
    Promise.allSettled([
      companyProfileApi.get('works'),
      karyaApi.list({ limit: 100 }),
    ])
      .then(([sec, kry]) => {
        // Manual (admin-curated) entries are NOT tied to an account → has_profile
        // false, so the lightbox renders the creator as plain text (no dead
        // "view profile" link). Real account uploads get has_profile true.
        const curated = (sec.status === 'fulfilled' && Array.isArray(sec.value))
          ? sec.value.filter(w => w.visible !== false).map(w => ({ ...w, has_profile: false }))
          : [];
        const uploaded = (kry.status === 'fulfilled' && Array.isArray(kry.value))
          ? kry.value.map(k => ({
              id:              k.id,
              judul:           k.judul,
              gambar_url:      k.gambar_url,
              owner:           k.owner,
              // owner_slug drives the "view profile" link (real DB slug);
              // fall back to owner_id only if a slug isn't present.
              owner_id:        k.owner_slug || k.owner_id,
              kategori_display: k.subsektor,
              tahun:           k.tahun,
              deskripsi:       k.deskripsi,
              has_profile:     true,
            }))
          : [];
        const merged = [...uploaded, ...curated];
        if (merged.length) setWorks(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleViewProfile = (ownerName) => {
    if (onNavigate) onNavigate('PUBLIC_PROFILE', ownerName);
  };

  if (loading) return <ScreenLoader />;

  return (
    <main style={{ background: 'var(--bg-page)', color: '#fff' }}>
      <section style={{ padding: '100px 120px 40px' }}>
        <Eyebrow style={{ color: 'var(--accent)' }}>
          PUBLICATION · KATALOG KOLABORATOR & ARTISAN
        </Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40, alignItems: 'flex-end', marginTop: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 56, lineHeight: 1.15, margin: 0, maxWidth: 900 }}>
            Karya kolaborator dan artisan yang pernah berproses di Peken.
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.9, color: 'var(--fg-secondary)', margin: 0 }}>
            Klik pada karya untuk melihat detail — foto besar, deskripsi karya, dan tautan ke profil kreatornya.
          </p>
        </div>
      </section>

      <section style={{ padding: '40px 60px 120px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {works.map((w) => (
            <PhotoTile
              key={w.id}
              src={w.gambar_url}
              alt={`${w.judul} oleh ${w.owner}`}
              aspect="4/5"
              mode="caption"
              onClick={() => setLightbox(w)}
              ariaLabel={`Buka detail karya ${w.judul} oleh ${w.owner}`}
              caption={
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {w.kategori_display}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 16, color: '#fff', marginBottom: 4 }}>
                    {w.owner}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-secondary)' }}>
                    {w.judul}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      </section>

      <Lightbox
        work={lightbox}
        onClose={() => setLightbox(null)}
        onViewProfile={handleViewProfile}
      />
    </main>
  );
}
