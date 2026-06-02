import { useState } from 'react';
import { Eyebrow } from '../shared/Typography.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import Lightbox from '../shared/Lightbox.jsx';
import useFetch from '../../hooks/useFetch.js';
import { api } from '../../lib/api.js';

// Peken Banyumasan — KARYA / Works screen · v1.3
// Added: onViewProfile prop passed to Lightbox so clicking a creator
// name navigates to their public profile page.

export default function WorksScreen({ onNavigate, mode = 'KARYA' }) {
  const isPublication = mode === 'PUBLICATION';
  const [lightbox, setLightbox] = useState(null);
  const { data, loading } = useFetch(() => api.getKarya(), []);
  const works = data || [];

  const handleViewProfile = (ownerName) => {
    if (onNavigate) onNavigate('PUBLIC_PROFILE', ownerName);
  };

  // Normalise API shape → shape yang dipakai Lightbox & PhotoTile
  const normalise = (w) => ({
    ...w,
    img:   w.gambar_url,
    title: w.judul,
    owner: w.owner      || '',
    role:  w.owner_type === 'kolaborator' ? `Kolaborator · ${w.subsektor}` : `Artisan · ${w.subsektor}`,
  });

  return (
    <main style={{ background: 'var(--bg-page)', color: '#fff' }}>
      <section style={{ padding: '100px 120px 40px' }}>
        <Eyebrow style={{ color: 'var(--accent)' }}>
          {isPublication
            ? 'PUBLICATION · KATALOG KOLABORATOR & ARTISAN'
            : 'KARYA · KATALOG KOLABORATOR & ARTISAN'}
        </Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40, alignItems: 'flex-end', marginTop: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 56, lineHeight: 1.15, margin: 0, maxWidth: 900 }}>
            {isPublication
              ? 'Karya kolaborator dan artisan yang pernah berproses di Peken.'
              : 'Karya kolaborator dan artisan yang pernah berproses di Peken.'}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.9, color: 'var(--fg-secondary)', margin: 0 }}>
            {isPublication
              ? 'Publikasi karya — foto besar, deskripsi karya, dan tautan ke profil kreatornya.'
              : 'Klik pada karya untuk melihat detail — foto besar, deskripsi karya, dan tautan ke profil kreatornya.'}
          </p>
        </div>
      </section>

      <section style={{ padding: '40px 60px 120px' }}>
        {loading ? (
          <div style={{ color: 'var(--fg-secondary)', fontFamily: 'var(--font-body)', fontSize: 13, textAlign: 'center', padding: '80px 0' }}>
            Memuat karya…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {works.map((w) => {
              const item = normalise(w);
              return (
                <PhotoTile
                  key={item.id}
                  src={item.img}
                  alt={`${item.title} oleh ${item.owner}`}
                  aspect="4/5"
                  mode="caption"
                  onClick={() => setLightbox(item)}
                  ariaLabel={`Buka detail karya ${item.title} oleh ${item.owner}`}
                  caption={
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                        {item.role}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 16, color: '#fff', marginBottom: 4 }}>
                        {item.owner}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-secondary)' }}>
                        {item.title}
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      <Lightbox
        work={lightbox}
        onClose={() => setLightbox(null)}
        onViewProfile={handleViewProfile}
        label={isPublication ? 'PUBLICATION' : 'KARYA'}
      />
    </main>
  );
}
