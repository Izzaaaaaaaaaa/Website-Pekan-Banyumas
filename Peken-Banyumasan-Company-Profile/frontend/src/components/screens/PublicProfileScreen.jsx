/**
 * PublicProfileScreen — profil publik kreator/artisan di company profile.
 * Layout persis mengikuti kolaborator dashboard PublicProfile:
 *   - Tanpa cover strip (langsung identity header)
 *   - Tab: Karya / Story / Event
 *   - Tanpa like/apresiasi
 *   - Satu tombol kembali (identity bar, kanan)
 * Dibungkus PekenNav + PekenFooter dari App.jsx.
 */

import { useState } from 'react';
import { MapPin, CheckCircle, Calendar, Share2 } from 'lucide-react';
import { getProfileByOwner } from '../../data/profiles.js';
import { Eyebrow } from '../shared/Typography.jsx';
import PillButton from '../shared/PillButton.jsx';
import PhotoTile from '../shared/PhotoTile.jsx';
import Modal from '../shared/Modal.jsx';

// ─── Helpers ─────────────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};
const fmtRel = (d) => {
    if (!d) return '';
    const days = Math.floor((Date.now() - new Date(d)) / 86400000);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    return fmtDate(d);
};

// ─── Avatar ───────────────────────────────────────────────────────
function Avatar({ foto, nama, size = 86 }) {
    const initial = (nama || '?').charAt(0).toUpperCase();
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: foto ? `url('${foto}') center/cover` : 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {!foto && (
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.38, color: 'var(--accent-ink)' }}>
          {initial}
        </span>
            )}
        </div>
    );
}

// ─── Karya lightbox ───────────────────────────────────────────────
function KaryaLightbox({ item, onClose }) {
    return (
        <Modal open={!!item} onClose={onClose} labelledBy="pp-lb" width={960} padded={false}>
            {item && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 440 }}>
                    <div style={{ background: `var(--bg-deep) url('${item.img}') center/contain no-repeat`, aspectRatio: '4/3' }} />
                    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Eyebrow style={{ color: 'var(--accent)' }}>{item.subsektor} · {item.tahun}</Eyebrow>
                            <button onClick={onClose} style={{ background: 'none', border: 0, color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
                        </div>
                        <h3 id="pp-lb" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 24, color: '#fff', margin: 0, lineHeight: 1.25 }}>{item.judul}</h3>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.85, color: 'var(--fg-secondary)', margin: 0 }}>{item.deskripsi}</p>
                        <div style={{ marginTop: 'auto', paddingTop: 12 }}><PillButton onClick={onClose}>Tutup Karya</PillButton></div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ─── Karya tile ───────────────────────────────────────────────────
function KaryaTile({ item, onClick }) {
    return (
        <PhotoTile
            src={item.img} alt={item.judul} aspect="4/5" mode="caption"
            onClick={() => onClick(item)} ariaLabel={`Buka detail ${item.judul}`}
            caption={
                <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{item.subsektor}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 15, color: '#fff', marginBottom: 4 }}>{item.judul}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--fg-secondary)' }}>{item.tahun}</div>
                </div>
            }
        />
    );
}

// ─── Story card (tanpa like) ──────────────────────────────────────
function StoryCard({ story }) {
    return (
        <article style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 24, paddingBlock: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {story.media_url && (
                <img src={story.media_url} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
            )}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.85, color: 'var(--fg-secondary)', margin: 0 }}>{story.konten}</p>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{fmtRel(story.tanggal)}</span>
        </article>
    );
}

// ─── Event card ───────────────────────────────────────────────────
const EV_COLOR = { upcoming: 'var(--accent)', berlangsung: '#7dd3fc', selesai: 'var(--fg-muted)' };
const EV_LABEL = { upcoming: 'Akan Datang', berlangsung: 'Berlangsung', selesai: 'Selesai' };

function EventCard({ ev }) {
    const col = EV_COLOR[ev.status] || 'var(--fg-muted)';
    return (
        <div style={{ borderLeft: `2px solid ${col}`, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Eyebrow style={{ color: col }}>{EV_LABEL[ev.status] || ev.status}</Eyebrow>
                {ev.peran && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--fg-muted)', border: '1px solid rgba(255,255,255,.1)', padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '.06em' }}>{ev.peran}</span>
                )}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 16, color: '#fff', lineHeight: 1.3 }}>{ev.nama}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {ev.tanggal && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--fg-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={11} /> {fmtDate(ev.tanggal)}
          </span>
                )}
                {ev.lokasi && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--fg-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={11} /> {ev.lokasi}
          </span>
                )}
            </div>
            {ev.deskripsi && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.7, color: 'var(--fg-muted)', margin: 0 }}>{ev.deskripsi}</p>
            )}
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ label }) {
    return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 56, color: 'rgba(195,202,150,.08)', marginBottom: 16 }}>—</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</p>
        </div>
    );
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function PublicProfileScreen({ ownerName, onBack }) {
    const profile = getProfileByOwner(ownerName);
    const [lightbox, setLightbox] = useState(null);
    const [tab, setTab] = useState('karya');

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) navigator.share({ title: `${profile?.nama} — Peken Banyumasan`, url });
        else navigator.clipboard?.writeText(url).then(() => alert('Link profil disalin!'));
    };

    if (!profile) return (
        <main style={{ background: 'var(--bg-page)', color: '#fff', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <Eyebrow style={{ color: 'var(--accent)', marginBottom: 24 }}>404 · PROFIL TIDAK DITEMUKAN</Eyebrow>
                <PillButton onClick={onBack}>← Kembali ke Karya</PillButton>
            </div>
        </main>
    );

    const featuredKarya = profile.karya.find(k => k.featured);
    const coverImg = featuredKarya?.img || null;

    const TABS = [
        { id: 'karya', label: `Karya (${profile.karya.length})` },
        { id: 'story', label: `Story (${profile.story.length})` },
        { id: 'event', label: `Event (${(profile.events || []).length})` },
    ];

    return (
        <main style={{ background: 'var(--bg-page)', color: '#fff' }}>
            <KaryaLightbox item={lightbox} onClose={() => setLightbox(null)} />

            {/* ── COVER ── */}
            <div style={{
                height: 200,
                background: coverImg
                    ? `linear-gradient(to bottom,rgba(13,13,13,.1),rgba(13,13,13,.75)),url('${coverImg}') center/cover`
                    : `linear-gradient(135deg,var(--bg-elevated) 0%,rgba(195,202,150,.06) 100%)`,
            }}>
                {!coverImg && (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 120 }}>
                        <span style={{ fontFamily: 'Inter', fontWeight: 300, fontSize: 100, color: 'rgba(195,202,150,.04)', userSelect: 'none' }}>PEKEN</span>
                    </div>
                )}
            </div>

            {/* ── IDENTITY BAR ── */}
            <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 120px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, transform: 'translateY(-44px)', marginBottom: -20 }}>
                        <Avatar foto={profile.foto} nama={profile.nama} size={86} />
                        <div style={{ flex: 1, paddingBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 28, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                                    {profile.nama}
                                </h1>
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 500, background: 'var(--accent)', color: 'var(--accent-ink)', padding: '3px 9px', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  {profile.role}
                </span>
                                {profile.verified && (
                                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 500, background: 'rgba(255,255,255,.07)', color: 'var(--fg-secondary)', padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '.07em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={9} /> Terverifikasi
                  </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                                {(profile.subsektor || []).map(s => (
                                    <span key={s} style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--fg-secondary)', border: '1px solid rgba(255,255,255,.1)', padding: '2px 8px' }}>{s}</span>
                                ))}
                                {profile.kota && (
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} /> {profile.kota}
                  </span>
                                )}
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--fg-muted)' }}>
                  Bergabung {profile.tahun_bergabung}
                </span>
                            </div>
                        </div>

                        {/* Aksi — share + satu tombol kembali */}
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
                            <button onClick={handleShare} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.15)', color: 'var(--fg-secondary)', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Share2 size={12} /> Bagikan
                            </button>
                            <PillButton inverse onClick={onBack}>← Kembali</PillButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BIO BAND (sage) ── */}
            <section style={{ background: 'var(--accent)', padding: '48px 120px' }}>
                <div style={{ maxWidth: 1060, margin: '0 auto', display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 48, alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 12, color: 'var(--accent-ink)', letterSpacing: '.03em' }}>PEKEN BANYUMASAN</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--peken-smoke)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 6 }}>
                            {profile.role} · {profile.tahun_bergabung}
                        </div>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.85, color: 'var(--accent-ink)', margin: 0, maxWidth: '52ch' }}>
                        {profile.bio}
                    </p>
                    <div style={{ display: 'flex', gap: 32 }}>
                        {[['Karya', profile.stats.karya], ['Story', profile.stats.story], ['Event', profile.stats.event]].map(([l, n]) => (
                            <div key={l} style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'Inter', fontWeight: 300, fontSize: 40, lineHeight: 1, color: 'var(--accent-ink)' }}>{n}</div>
                                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--peken-smoke)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TAB NAV ── */}
            <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid rgba(255,255,255,.06)', position: 'sticky', top: 80, zIndex: 40 }}>
                <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 120px', display: 'flex' }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            background: 'transparent', border: 0, cursor: 'pointer',
                            padding: '15px 0', marginRight: 32,
                            fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 11,
                            color: tab === t.id ? 'var(--accent)' : 'var(--fg-muted)',
                            textTransform: 'uppercase', letterSpacing: '.07em',
                            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                            transition: 'color 200ms ease, border-color 200ms ease',
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div style={{ maxWidth: 1060, margin: '0 auto', padding: '52px 120px 96px' }}>
                {tab === 'karya' && (
                    profile.karya.length === 0
                        ? <EmptyState label="Belum ada karya yang dipublikasikan." />
                        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                            {profile.karya.map(k => <KaryaTile key={k.id} item={k} onClick={setLightbox} />)}
                        </div>
                )}
                {tab === 'story' && (
                    profile.story.length === 0
                        ? <EmptyState label="Belum ada story yang ditulis." />
                        : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px 52px', maxWidth: 800 }}>
                            {profile.story.map(s => <StoryCard key={s.id} story={s} />)}
                        </div>
                )}
                {tab === 'event' && (
                    !(profile.events?.length)
                        ? <EmptyState label="Belum ada event yang diikuti." />
                        : <div style={{ display: 'grid', gap: 28, maxWidth: 720 }}>
                            {profile.events.map(ev => <EventCard key={ev.id} ev={ev} />)}
                        </div>
                )}
            </div>

            {/* ── FOOTER STRIP ── */}
            <div style={{ background: 'var(--bg-elevated)', borderTop: '1px solid rgba(255,255,255,.06)', padding: '24px 120px' }}>
                <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                        Peken Banyumasan · Ekosistem Kreatif Banyumas
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--fg-muted)' }}>
                        {profile.nama} · {profile.role}
                    </div>
                </div>
            </div>
        </main>
    );
}