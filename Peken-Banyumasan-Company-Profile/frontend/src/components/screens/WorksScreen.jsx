import { useState, useEffect } from 'react';
import { Eyebrow } from '../shared/Typography.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import Lightbox from '../shared/Lightbox.jsx';
import { WORKS } from '../../data/works.js';
import { karyaApi } from '../../services/endpoints.js';

// Peken Banyumasan — KARYA / Works screen · v1.3
// Added: onViewProfile prop passed to Lightbox so clicking a creator
// name navigates to their public profile page.

export default function WorksScreen({ onNavigate }) {
  const [lightbox, setLightbox] = useState(null);
  const [works, setWorks] = useState(WORKS);

  useEffect(() => {
    karyaApi.list().then(data => { if (data?.length) setWorks(data); }).catch(() => {});
  }, []);

  const handleViewProfile = (ownerName) => {
    if (onNavigate) onNavigate('PUBLIC_PROFILE', ownerName);
  };

  return (
    <main style={{ background: 'var(--bg-page)', color: '#fff' }}>
      <section style={{ padding: '100px 120px 40px' }}>
        <Eyebrow style={{ color: 'var(--accent)' }}>
          KARYA · KATALOG KOLABORATOR & ARTISAN
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
                    {w.role}
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
