// src/pages/PublicProfile.jsx
// Profile publik kreator (Kolaborator / Artisan) — diakses tanpa login di /pelaku/:slug
// Tema sepenuhnya mengikuti company profile Peken Banyumasan:
//   dark bg #1b1b1b, sage accent #C3CA96, Clash Display + Montserrat, zero-radius.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, ArrowLeft, Heart, Calendar, Share2 } from 'lucide-react';
import api, { getToken } from '../services/api';

// ── Design tokens (matching company profile CSS vars exactly) ─────────────────
const T = {
    bgPage:      '#1b1b1b',
    bgElevated:  '#111111',
    bgDeep:      '#0d0d0d',
    accent:      '#c3ca96',
    accentInk:   '#0d0d0d',
    fgPrimary:   '#ffffff',
    fgSecondary: '#b2b2b2',
    fgMuted:     '#5b5b5b',
    fontDisplay: '"Clash Display","Inter",system-ui,sans-serif',
    fontBody:    '"Montserrat",system-ui,sans-serif',
};

const fmtDate = d => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const fmtRel = d => {
    if (!d) return '';
    const days = Math.floor((Date.now() - new Date(d)) / 86400000);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7)  return `${days} hari lalu`;
    return fmtDate(d);
};

// ── Tiny atoms ────────────────────────────────────────────────────────────────
const Eyebrow = ({ children, style }) => (
    <div style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 400,
        letterSpacing: '.07em', color: T.fgSecondary, textTransform: 'uppercase', ...style }}>
        {children}
    </div>
);

const PillBtn = ({ children, onClick, inverse }) => {
    const [hov, setHov] = useState(false);
    const bg = inverse ? T.accentInk : T.accent;
    const fg = inverse ? T.accent    : T.accentInk;
    const db = inverse ? T.accent    : T.accentInk;
    const dd = inverse ? T.accentInk : T.accent;
    return (
        <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                style={{ display:'inline-flex', alignItems:'center', justifyContent:'space-between',
                    gap:16, height:29, padding:'0 0 0 16px', background:bg, color:fg,
                    border:0, cursor:'pointer', fontFamily:T.fontDisplay, fontWeight:500,
                    fontSize:12, textTransform:'uppercase', letterSpacing:'.04em' }}>
            <span>{children}</span>
            <span aria-hidden style={{ width:29, height:29, background:db, display:'grid', placeItems:'center',
                transform: hov ? 'translateX(-6px)' : 'translateX(0)',
                transition:'transform 320ms cubic-bezier(.22,.61,.36,1)' }}>
        <span style={{ width:9, height:9, background:dd, display:'block' }} />
      </span>
        </button>
    );
};

// ── Karya lightbox ────────────────────────────────────────────────────────────
function KaryaModal({ item, onClose }) {
    if (!item) return null;
    return (
        <div onClick={onClose} style={{ position:'fixed', inset:0,
            background:'rgba(13,13,13,.88)', backdropFilter:'blur(6px)',
            display:'grid', placeItems:'center', zIndex:100, padding:24,
            animation:'fadeIn .25s ease-out' }}>
            <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
            <div onClick={e=>e.stopPropagation()} style={{ background:T.bgElevated,
                maxWidth:860, width:'100%', display:'grid',
                gridTemplateColumns:'1.4fr 1fr', overflow:'hidden' }}>
                <div style={{ background:`${T.bgDeep} url('${item.gambar||item.img||''}') center/contain no-repeat`,
                    aspectRatio:'4/3' }} />
                <div style={{ padding:36, display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <Eyebrow style={{ color:T.accent }}>{item.subsektor} · {item.tahun}</Eyebrow>
                        <button onClick={onClose} style={{ background:'none', border:0,
                            color:T.fgPrimary, fontSize:18, cursor:'pointer' }}>✕</button>
                    </div>
                    <h3 style={{ fontFamily:T.fontDisplay, fontWeight:400, fontSize:22,
                        color:T.fgPrimary, margin:0, lineHeight:1.3 }}>{item.judul}</h3>
                    <p style={{ fontFamily:T.fontBody, fontSize:13, lineHeight:1.85,
                        color:T.fgSecondary, margin:0 }}>
                        {item.deskripsi || 'Karya ini adalah bagian dari portofolio kreator di ekosistem Peken Banyumasan.'}
                    </p>
                    <div style={{ marginTop:'auto', paddingTop:12 }}>
                        <PillBtn inverse onClick={onClose}>Tutup</PillBtn>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ foto, nama, size=96 }) {
    const initial = (nama||'?').charAt(0).toUpperCase();
    return (
        <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
            background: foto ? `url('${foto}') center/cover` : T.accent,
            border:`3px solid ${T.bgPage}`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            {!foto && <span style={{ fontFamily:T.fontDisplay, fontWeight:700,
                fontSize:size*.38, color:T.accentInk }}>{initial}</span>}
        </div>
    );
}

// ── Karya tile ────────────────────────────────────────────────────────────────
function KaryaTile({ item, onClick }) {
    const [hov, setHov] = useState(false);
    const img = item.gambar || item.img;
    return (
        <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
             onClick={()=>onClick(item)}
             style={{ cursor:'pointer', position:'relative', overflow:'hidden',
                 background:T.bgDeep, aspectRatio:'4/5' }}>
            {img
                ? <img src={img} alt={item.judul} style={{ width:'100%', height:'100%',
                    objectFit:'cover', display:'block',
                    filter: hov ? 'none' : 'grayscale(0.25)', transition:'filter 400ms ease' }} />
                : <div style={{ width:'100%', height:'100%', display:'flex',
                    alignItems:'center', justifyContent:'center', background:`${T.accent}14` }}>
            <span style={{ fontFamily:T.fontDisplay, fontWeight:700,
                fontSize:48, color:`${T.accent}35` }}>
              {(item.judul||'K').charAt(0)}
            </span>
                </div>
            }
            <div style={{ position:'absolute', left:0, right:0, bottom:0,
                padding:'40px 20px 20px',
                background:'linear-gradient(to top, rgba(13,13,13,.92) 0%, rgba(13,13,13,0) 100%)',
                opacity: hov ? 1 : 0, transform: hov ? 'translateY(0)' : 'translateY(8px)',
                transition:'opacity 280ms ease, transform 280ms ease' }}>
                <div style={{ fontFamily:T.fontBody, fontSize:10, color:T.accent,
                    textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5 }}>
                    {item.subsektor}
                </div>
                <div style={{ fontFamily:T.fontDisplay, fontWeight:500, fontSize:14,
                    color:T.fgPrimary, lineHeight:1.25 }}>{item.judul}</div>
                <div style={{ fontFamily:T.fontBody, fontSize:11, color:T.fgMuted, marginTop:3 }}>
                    {item.tahun}
                </div>
            </div>
        </div>
    );
}

// ── Story card ────────────────────────────────────────────────────────────────
function StoryCard({ story }) {
    return (
        <article style={{ borderLeft:`2px solid ${T.accent}`, paddingLeft:24,
            display:'flex', flexDirection:'column', gap:10 }}>
            {story.media_url && (
                <img src={story.media_url} alt=""
                     style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block' }} />
            )}
            <p style={{ fontFamily:T.fontBody, fontSize:13, lineHeight:1.85,
                color:T.fgSecondary, margin:0 }}>{story.konten}</p>
            <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontFamily:T.fontBody, fontSize:10, color:T.fgMuted,
            textTransform:'uppercase', letterSpacing:'.06em' }}>
          {fmtRel(story.created_at||story.tanggal)}
        </span>
                <span style={{ fontFamily:T.fontDisplay, fontSize:11, color:T.accent,
                    display:'flex', alignItems:'center', gap:4 }}>
          <Heart size={11} fill={T.accent} strokeWidth={0}/> {story.like_count ?? 0}
        </span>
                {(story.tags||[]).map(tag => (
                    <span key={tag} style={{ fontFamily:T.fontBody, fontSize:10, color:T.fgMuted,
                        border:'1px solid rgba(255,255,255,.1)', padding:'1px 7px' }}>{tag}</span>
                ))}
            </div>
        </article>
    );
}

// ── Event card ────────────────────────────────────────────────────────────────
const EV_COLOR = { upcoming:T.accent, berlangsung:'#7dd3fc', selesai:T.fgMuted };
const EV_LABEL = { upcoming:'Akan Datang', berlangsung:'Berlangsung', selesai:'Selesai' };

function EventCard({ ev }) {
    const col = EV_COLOR[ev.status] || T.fgMuted;
    return (
        <div style={{ borderLeft:`2px solid ${col}`, paddingLeft:24,
            display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <Eyebrow style={{ color:col }}>{EV_LABEL[ev.status]||ev.status}</Eyebrow>
                {ev.peran && (
                    <span style={{ fontFamily:T.fontBody, fontSize:10, color:T.fgMuted,
                        border:'1px solid rgba(255,255,255,.1)', padding:'1px 7px',
                        textTransform:'uppercase', letterSpacing:'.06em' }}>{ev.peran}</span>
                )}
            </div>
            <div style={{ fontFamily:T.fontDisplay, fontWeight:400, fontSize:16,
                color:T.fgPrimary, lineHeight:1.3 }}>{ev.nama}</div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                {ev.tanggal && (
                    <span style={{ fontFamily:T.fontBody, fontSize:11, color:T.fgSecondary,
                        display:'flex', alignItems:'center', gap:5 }}>
            <Calendar size={11}/> {fmtDate(ev.tanggal)}
          </span>
                )}
                {ev.lokasi && (
                    <span style={{ fontFamily:T.fontBody, fontSize:11, color:T.fgSecondary,
                        display:'flex', alignItems:'center', gap:5 }}>
            <MapPin size={11}/> {ev.lokasi}
          </span>
                )}
            </div>
            {ev.deskripsi && (
                <p style={{ fontFamily:T.fontBody, fontSize:12, lineHeight:1.7,
                    color:T.fgMuted, margin:0 }}>{ev.deskripsi}</p>
            )}
        </div>
    );
}

function EmptyState({ label }) {
    return (
        <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontFamily:'Inter', fontWeight:300, fontSize:56,
                color:'rgba(195,202,150,.08)', marginBottom:16 }}>—</div>
            <p style={{ fontFamily:T.fontBody, fontSize:12, color:T.fgMuted,
                textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</p>
        </div>
    );
}

// ── Mini nav ──────────────────────────────────────────────────────────────────
function MiniNav({ nama }) {
    const nav = useNavigate();
    const loggedIn = !!getToken();

    const share = () => {
        if (navigator.share) {
            navigator.share({ title:`${nama} — Peken Banyumasan`, url:window.location.href });
        } else {
            navigator.clipboard?.writeText(window.location.href);
        }
    };

    return (
        <nav style={{ position:'sticky', top:0, zIndex:50, height:64,
            padding:'0 80px', display:'flex', alignItems:'center', justifyContent:'space-between',
            background:T.bgPage, borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            <button onClick={()=>nav(-1)} style={{ background:'transparent', border:0,
                cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                fontFamily:T.fontDisplay, fontSize:11, color:T.fgSecondary,
                textTransform:'uppercase', letterSpacing:'.06em' }}>
                <ArrowLeft size={14}/> Kembali
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:8,
                fontFamily:T.fontDisplay, fontWeight:500, fontSize:12, color:T.fgPrimary,
                letterSpacing:'.03em' }}>
                <img src="/assets/logo-peken-banyumasan.png" alt=""
                     style={{ width:20, height:20 }}
                     onError={e=>{ e.target.style.display='none'; }}/>
                PEKEN BANYUMASAN
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <button onClick={share} style={{ background:'transparent', border:0,
                    cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                    fontFamily:T.fontDisplay, fontSize:11, color:T.fgMuted,
                    textTransform:'uppercase', letterSpacing:'.06em' }}>
                    <Share2 size={12}/> Bagikan
                </button>
                {loggedIn
                    ? <button onClick={()=>nav('/dashboard')} style={{ background:'transparent',
                        border:0, cursor:'pointer', fontFamily:T.fontDisplay, fontSize:11,
                        color:T.accent, textTransform:'uppercase', letterSpacing:'.06em' }}>
                        Dashboard →
                    </button>
                    : <button onClick={()=>nav('/login')} style={{ background:'transparent',
                        border:0, cursor:'pointer', fontFamily:T.fontDisplay, fontSize:11,
                        color:T.fgSecondary, textTransform:'uppercase', letterSpacing:'.06em' }}>
                        Login
                    </button>
                }
            </div>
        </nav>
    );
}

// ── Profile builder ───────────────────────────────────────────────────────────
const buildProfile = (user, porto, stories, events) => ({
    id:              user.id || 'u001',
    nama:            user.nama || 'Kreator Peken',
    role:            user.role === 'artisan' ? 'Artisan' : 'Kolaborator',
    subsektor:       user.subsektor || [],
    kota:            user.kota || 'Banyumas',
    bio:             user.bio || 'Kreator yang berkolaborasi dengan Peken Banyumasan.',
    foto:            user.foto_url || null,
    verified:        user.status === 'aktif',
    tahun_bergabung: user.tanggal_daftar ? new Date(user.tanggal_daftar).getFullYear() : '2024',
    stats: {
        karya: porto?.length   ?? user.total_karya ?? 0,
        story: stories?.length ?? user.total_story ?? 0,
        event: events?.filter(e=>e.terdaftar)?.length ?? user.total_event ?? 0,
    },
    karya:  porto   || [],
    story:  stories || [],
    events: (events || []).filter(e => e.terdaftar),
});

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function PublicProfile() {
    const { slug }  = useParams();
    const nav       = useNavigate();

    const [profile,    setProfile]    = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [notFound,   setNotFound]   = useState(false);
    const [karyaModal, setKaryaModal] = useState(null);
    const [tab,        setTab]        = useState('karya');

    useEffect(() => {
        const load = async () => {
            setLoading(true); setNotFound(false);
            try {
                const [pRes, portRes, storyRes, evRes] = await Promise.all([
                    api.profil.get(),
                    api.portofolio.list(),
                    api.story.list(),
                    api.event.list(),
                ]);
                setProfile(buildProfile(pRes.data, portRes.data, storyRes.data, evRes.data));
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

    if (loading) return (
        <div style={{ background:T.bgPage, minHeight:'100vh',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ textAlign:'center' }}>
                <div style={{ width:32, height:32, border:`2px solid ${T.accent}`,
                    borderTopColor:'transparent', borderRadius:'50%',
                    animation:'spin .8s linear infinite', margin:'0 auto 16px' }}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ fontFamily:T.fontBody, fontSize:11, color:T.fgMuted,
                    textTransform:'uppercase', letterSpacing:'.07em' }}>Memuat profil...</p>
            </div>
        </div>
    );

    if (notFound || !profile) return (
        <div style={{ background:T.bgPage, minHeight:'100vh' }}>
            <MiniNav nama="?"/>
            <div style={{ padding:'120px 80px', textAlign:'center' }}>
                <Eyebrow style={{ color:T.accent, marginBottom:20 }}>404 · PROFIL TIDAK DITEMUKAN</Eyebrow>
                <p style={{ fontFamily:T.fontBody, fontSize:14, color:T.fgSecondary,
                    margin:'0 auto 32px', maxWidth:'36ch', lineHeight:1.8 }}>
                    Kreator yang Anda cari tidak ditemukan atau belum terdaftar di Peken Banyumasan.
                </p>
                <PillBtn onClick={()=>nav(-1)}>← Kembali</PillBtn>
            </div>
        </div>
    );

    const isArtisan    = profile.role === 'Artisan';
    const roleColor    = isArtisan ? '#fcd34d' : T.accent;
    const featuredKarya = profile.karya.find(k=>k.featured);
    const coverImg     = featuredKarya?.gambar || featuredKarya?.img || null;

    const TABS = [
        { id:'karya', label:`Karya (${profile.karya.length})` },
        { id:'story', label:`Story (${profile.story.length})` },
        { id:'event', label:`Event (${profile.events.length})` },
    ];

    return (
        <div style={{ background:T.bgPage, color:T.fgPrimary, minHeight:'100vh' }}>
            <MiniNav nama={profile.nama}/>
            {karyaModal && <KaryaModal item={karyaModal} onClose={()=>setKaryaModal(null)}/>}

            {/* COVER */}
            <div style={{ height:200,
                background: coverImg
                    ? `linear-gradient(to bottom,rgba(13,13,13,.1),rgba(13,13,13,.75)),url('${coverImg}') center/cover`
                    : `linear-gradient(135deg,${T.bgElevated} 0%,rgba(195,202,150,.06) 100%)` }}>
                {!coverImg && (
                    <div style={{ height:'100%', display:'flex', alignItems:'center',
                        justifyContent:'flex-end', paddingRight:80 }}>
            <span style={{ fontFamily:'Inter', fontWeight:300, fontSize:100,
                color:'rgba(195,202,150,.04)', userSelect:'none' }}>PEKEN</span>
                    </div>
                )}
            </div>

            {/* IDENTITY BAR */}
            <div style={{ background:T.bgElevated, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                <div style={{ maxWidth:1060, margin:'0 auto', padding:'0 80px' }}>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:24,
                        transform:'translateY(-44px)', marginBottom:-20 }}>
                        <Avatar foto={profile.foto} nama={profile.nama} size={86}/>
                        <div style={{ flex:1, paddingBottom:14 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                                <h1 style={{ fontFamily:T.fontDisplay, fontWeight:400, fontSize:26,
                                    color:T.fgPrimary, margin:0, lineHeight:1.1 }}>{profile.nama}</h1>
                                <span style={{ fontFamily:T.fontDisplay, fontSize:9, fontWeight:500,
                                    background:roleColor, color:'#0d0d0d', padding:'3px 9px',
                                    textTransform:'uppercase', letterSpacing:'.07em' }}>
                  {profile.role}
                </span>
                                {profile.verified && (
                                    <span style={{ fontFamily:T.fontDisplay, fontSize:9, fontWeight:500,
                                        background:'rgba(255,255,255,.07)', color:T.fgSecondary,
                                        padding:'3px 8px', textTransform:'uppercase', letterSpacing:'.07em',
                                        display:'flex', alignItems:'center', gap:4 }}>
                    <CheckCircle size={9}/> Terverifikasi
                  </span>
                                )}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:10,
                                marginTop:10, flexWrap:'wrap' }}>
                                {profile.subsektor.map(s => (
                                    <span key={s} style={{ fontFamily:T.fontBody, fontSize:11,
                                        color:T.fgSecondary, border:'1px solid rgba(255,255,255,.1)',
                                        padding:'2px 8px' }}>{s}</span>
                                ))}
                                {profile.kota && (
                                    <span style={{ fontFamily:T.fontBody, fontSize:11, color:T.fgMuted,
                                        display:'flex', alignItems:'center', gap:4 }}>
                    <MapPin size={11}/> {profile.kota}
                  </span>
                                )}
                                <span style={{ fontFamily:T.fontBody, fontSize:11, color:T.fgMuted }}>
                  Bergabung {profile.tahun_bergabung}
                </span>
                            </div>
                        </div>
                        <div style={{ paddingBottom:14, flexShrink:0 }}>
                            <PillBtn inverse onClick={()=>nav(-1)}>← Kembali</PillBtn>
                        </div>
                    </div>
                </div>
            </div>

            {/* BIO — sage/amber band */}
            <section style={{ background:roleColor, padding:'48px 80px' }}>
                <div style={{ maxWidth:1060, margin:'0 auto',
                    display:'grid', gridTemplateColumns:'200px 1fr auto', gap:48, alignItems:'flex-start' }}>
                    <div>
                        <div style={{ fontFamily:T.fontDisplay, fontWeight:500, fontSize:12,
                            color:'#0d0d0d', letterSpacing:'.03em' }}>PEKEN BANYUMASAN</div>
                        <div style={{ fontFamily:T.fontBody, fontSize:10, color:'#5b5b5b',
                            textTransform:'uppercase', letterSpacing:'.06em', marginTop:6 }}>
                            {profile.role} · {profile.tahun_bergabung}
                        </div>
                    </div>
                    <p style={{ fontFamily:T.fontBody, fontSize:13, lineHeight:1.85,
                        color:'#0d0d0d', margin:0, maxWidth:'52ch' }}>{profile.bio}</p>
                    <div style={{ display:'flex', gap:28 }}>
                        {[['Karya',profile.stats.karya],['Story',profile.stats.story],['Event',profile.stats.event]].map(([l,n])=>(
                            <div key={l} style={{ textAlign:'center' }}>
                                <div style={{ fontFamily:'Inter', fontWeight:300, fontSize:38,
                                    lineHeight:1, color:'#0d0d0d' }}>{n}</div>
                                <div style={{ fontFamily:T.fontBody, fontSize:10, color:'#5b5b5b',
                                    textTransform:'uppercase', letterSpacing:'.06em', marginTop:4 }}>{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TAB NAV */}
            <div style={{ background:T.bgElevated, borderBottom:'1px solid rgba(255,255,255,.06)',
                position:'sticky', top:64, zIndex:40 }}>
                <div style={{ maxWidth:1060, margin:'0 auto', padding:'0 80px', display:'flex' }}>
                    {TABS.map(t=>(
                        <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:'transparent',
                            border:0, cursor:'pointer', padding:'15px 0', marginRight:32,
                            fontFamily:T.fontDisplay, fontWeight:400, fontSize:11,
                            color: tab===t.id ? T.accent : T.fgMuted,
                            textTransform:'uppercase', letterSpacing:'.07em',
                            borderBottom: tab===t.id ? `2px solid ${T.accent}` : '2px solid transparent',
                            transition:'color 200ms ease, border-color 200ms ease' }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT */}
            <div style={{ maxWidth:1060, margin:'0 auto', padding:'52px 80px 96px' }}>
                {tab==='karya' && (
                    profile.karya.length===0 ? <EmptyState label="Belum ada karya yang dipublikasikan."/>
                        : <div style={{ display:'grid',
                            gridTemplateColumns:`repeat(${Math.min(profile.karya.length,3)},1fr)`, gap:20 }}>
                            {profile.karya.map(k=><KaryaTile key={k.id} item={k} onClick={setKaryaModal}/>)}
                        </div>
                )}
                {tab==='story' && (
                    profile.story.length===0 ? <EmptyState label="Belum ada story yang ditulis."/>
                        : <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                            gap:'28px 52px', maxWidth:800 }}>
                            {profile.story.map(s=><StoryCard key={s.id} story={s}/>)}
                        </div>
                )}
                {tab==='event' && (
                    profile.events.length===0 ? <EmptyState label="Belum ada event yang diikuti."/>
                        : <div style={{ display:'grid', gap:28, maxWidth:720 }}>
                            {profile.events.map(ev=><EventCard key={ev.id} ev={ev}/>)}
                        </div>
                )}
            </div>

            {/* FOOTER STRIP */}
            <div style={{ background:T.bgElevated, borderTop:'1px solid rgba(255,255,255,.06)',
                padding:'24px 80px' }}>
                <div style={{ maxWidth:1060, margin:'0 auto',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    flexWrap:'wrap', gap:16 }}>
                    <div style={{ fontFamily:T.fontBody, fontSize:10, color:T.fgMuted,
                        textTransform:'uppercase', letterSpacing:'.07em' }}>
                        Peken Banyumasan · Ekosistem Kreatif Banyumas
                    </div>
                    <PillBtn inverse onClick={()=>nav(-1)}>Kembali</PillBtn>
                </div>
            </div>
        </div>
    );
}
