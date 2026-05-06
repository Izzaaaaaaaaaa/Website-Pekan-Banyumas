// Dashboard.jsx — Peken Banyumasan Design System v2.0
// Sage palette: #C3CA96 accent, charcoal/sage-deep hero, earth text
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PenLine, Image, Calendar, ArrowRight,
  MapPin, ChevronRight, BookOpen, Hash
} from 'lucide-react';
import { storyApi, eventApi } from '../services/endpoints';
import { getUser } from '../lib/auth';
import { extractError } from '../lib/unwrap';
import { useToast } from '../components/Toast';
import { T } from '../lib/tokens';

const fmtDate = d => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  if (diff < 7) return `${diff} hari lalu`;
  return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short'});
};

const PERAN_LABEL = { performer:'Performer', peserta:'Peserta', panitia:'Panitia' };

// ── Event countdown ───────────────────────────────────────────────────────────
function useEventCountdown(tanggal, jamMulai) {
  const [time, setTime] = React.useState({ d:'00', j:'00', m:'00' });
  const [selesai, setSelesai] = React.useState(false);
  React.useEffect(() => {
    if (!tanggal) return;
    const target = new Date(`${tanggal}T${jamMulai || '08:00'}:00+07:00`);
    function tick() {
      const diff = target - new Date();
      if (diff <= 0) { setTime({d:'00',j:'00',m:'00'}); setSelesai(true); return; }
      setSelesai(false);
      setTime({
        d: String(Math.floor(diff / 86400000)).padStart(2,'0'),
        j: String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0'),
      });
    }
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [tanggal]);
  return { time, selesai };
}

function EventCountdown({ tanggal, jamMulai }) {
  const { time, selesai } = useEventCountdown(tanggal, jamMulai);
  if (selesai) return (
    <span className="text-[10px] font-medium" style={{color: T.textMuted}}>Selesai</span>
  );
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {[['d','H'],['j','J'],['m','M']].map(([k,u]) => (
        <div key={k} className="rounded-md px-1.5 py-0.5 text-center min-w-[26px]"
          style={{background: T.sageDeeper}}>
          <div className="text-[11px] font-black leading-none text-white">{time[k]}</div>
          <div className="text-[8px] font-semibold leading-none mt-0.5"
            style={{color: T.sageLight, opacity:.7}}>{u}</div>
        </div>
      ))}
    </div>
  );
}

// ── Quick story compose ───────────────────────────────────────────────────────
function QuickCompose({ user, onPost }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onPost({ konten: text, tags: [] });
      setText(''); setOpen(false);
      toast.success('Story berhasil diposting!');
    } catch { toast.error('Gagal posting'); }
    finally { setSaving(false); }
  };

  const initial = (user.nama||'U').charAt(0).toUpperCase();
  const avatar = user.foto_url
    ? <img src={user.foto_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0"/>
    : <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{background: T.sage, color: T.charcoal}}>{initial}</div>;

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="w-full flex items-center gap-3 text-left rounded-2xl p-4 transition-all"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadowSm,
      }}
    >
      {avatar}
      <span className="flex-1 text-sm" style={{color: T.textSoft}}>
        Apa yang sedang kamu kerjakan?
      </span>
      <PenLine size={15} style={{color: T.textSoft, flexShrink:0}}/>
    </button>
  );

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{background: T.surface, border: `1px solid ${T.accentBorder}`, boxShadow: T.shadowSm}}>
      <div className="flex items-center gap-3">
        {avatar}
        <p className="text-sm font-semibold" style={{color: T.text1}}>{user.nama||'Kamu'}</p>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value.slice(0,500))} rows={3} autoFocus
        placeholder="Bagikan momen, proses karya, atau inspirasi hari ini..."
        className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none transition"
        style={{
          border: `1px solid ${T.border}`,
          color: T.text1,
          background: T.surface,
          fontFamily:'Montserrat, sans-serif',
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{color: T.textMuted}}>{text.length}/500</span>
        <div className="flex gap-2">
          <button
            onClick={() => { setOpen(false); setText(''); }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
            style={{color: T.text2}}
          >Batal</button>
          <button
            onClick={submit}
            disabled={!text.trim()||saving}
            className="px-4 py-1.5 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
            style={{background: T.sageDark}}
          >
            {saving ? 'Posting...' : 'Bagikan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const user = getUser() || {};
  const nav = useNavigate();
  const toast = useToast();
  const [stories, setStories] = useState([]);
  const [events,  setEvents]  = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [storyList, eventList] = await Promise.all([
          storyApi.list(),
          eventApi.list(),
        ]);
        setStories((storyList || []).slice(0, 4));
        setEvents((eventList || []).filter(e => ['upcoming','berlangsung'].includes(e.status)));
      } catch (err) {
        toast.error(extractError(err, 'Gagal memuat dashboard'));
      }
    })();
  }, [toast]);

  const postStory = async (data) => {
    try {
      const newStory = await storyApi.create(data);
      setStories(l => [{ ...newStory, like_count: newStory?.like_count ?? 0 }, ...l.slice(0, 3)]);
    } catch (err) {
      toast.error(extractError(err, 'Gagal memposting story'));
    }
  };

  const myEvents      = events.filter(e => e.terdaftar);
  const exploreEvents = events.filter(e => !e.terdaftar).slice(0, 2);
  const initial       = (user.nama||'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">

      {/* ── Profile hero — charcoal → sage-deeper gradient ── */}
      <div className="relative overflow-hidden rounded-2xl"
        style={{background:`linear-gradient(135deg,${T.charcoal} 0%,${T.sageDeeper} 100%)`}}>
        {/* Pixel-dot decorative overlay */}
        <div style={{
          position:'absolute', inset:0, opacity:.04,
          backgroundImage:`radial-gradient(circle, ${T.sage} 1px, transparent 1px)`,
          backgroundSize:'24px 24px', pointerEvents:'none',
        }}/>
        <div className="relative p-5">
          <div className="flex items-start gap-3">
            {user.foto_url
              ? <img src={user.foto_url} alt=""
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                  style={{boxShadow:'0 0 0 2px rgba(195,202,150,0.3)'}}/>
              : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
                  style={{background:'rgba(195,202,150,0.15)', color: T.sage,
                          fontFamily:'Clash Display, sans-serif'}}>
                  {initial}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-0.5" style={{color:'rgba(195,202,150,0.6)'}}>Selamat datang</p>
              <h1 className="font-semibold text-[17px] leading-tight truncate text-white"
                style={{fontFamily:'"Montserrat", system-ui, sans-serif'}}>
                {user.nama||'Kolaborator'}
              </h1>
              <p className="text-xs flex items-center gap-1 mt-0.5" style={{color:'rgba(255,255,255,0.45)'}}>
                <MapPin size={10}/>{user.kota||'—'}
              </p>
            </div>
            <Link to="/dashboard/profil"
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl transition"
              style={{background:'rgba(195,202,150,0.12)', color: T.sage,
                      border:'1px solid rgba(195,202,150,0.18)'}}>
              Edit
            </Link>
          </div>

          {(user.subsektor || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(user.subsektor || []).map(s => (
                <span key={s}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{background:'rgba(195,202,150,0.10)', border:'1px solid rgba(195,202,150,0.18)',
                          color:'rgba(195,202,150,0.8)'}}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              [user.total_karya||18,'Karya'],
              [user.total_story||24,'Story'],
              [user.total_event||6, 'Event'],
            ].map(([v,l]) => (
              <div key={l} className="rounded-xl px-2 py-3 text-center"
                style={{background:'rgba(255,255,255,0.05)'}}>
                <div className="font-bold text-base leading-tight text-white">{v}</div>
                <div className="text-[10px] font-medium mt-1"
                  style={{color:'rgba(255,255,255,0.4)'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
          style={{color: T.textMuted, letterSpacing:'.1em'}}>
          Aksi Cepat
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { to:'/dashboard/story',      icon:PenLine, l:'Tulis Story'  },
            { to:'/dashboard/portofolio', icon:Image,   l:'Tambah Karya' },
            { to:'/dashboard/event',      icon:Calendar,l:'Cari Event'   },
          ].map(a => {
            const Icon = a.icon;
            return (
              <Link key={a.to} to={a.to}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all"
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  color: T.text2,
                  boxShadow: T.shadowSm,
                }}>
                <Icon size={18} style={{color: T.sageDark}}/>
                <span className="text-[11px] font-semibold text-center leading-tight">{a.l}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Quick story compose ── */}
      <QuickCompose user={user} onPost={postStory}/>

      {/* ── Event Saya ── */}
      {myEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold flex items-center gap-1.5" style={{color: T.text1}}>
              <Calendar size={14} style={{color: T.sageDark}}/> Event Saya
            </h2>
            <Link to="/dashboard/event"
              className="text-xs font-semibold hover:underline flex items-center gap-1"
              style={{color: T.sageDark}}>
              Semua <ChevronRight size={12}/>
            </Link>
          </div>
          <div className="space-y-2">
            {myEvents.slice(0,2).map(e => (
              <div key={e.id} className="flex gap-3 p-3 rounded-2xl"
                style={{border: `1px solid ${T.accentBorder}`, background: T.surface, boxShadow: T.shadowSm}}>
                <div className="shrink-0 w-11 rounded-xl flex flex-col items-center justify-center py-2"
                  style={{background: T.sageDeeper}}>
                  <span className="text-base font-bold text-white leading-none">
                    {new Date(e.tanggal).getDate()}
                  </span>
                  <span className="text-[9px] font-semibold uppercase mt-0.5"
                    style={{color: T.sageLight}}>
                    {new Date(e.tanggal).toLocaleDateString('id-ID',{month:'short'})}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug line-clamp-1"
                    style={{color: T.text1}}>{e.nama}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-1"
                    style={{color: T.textMuted}}>
                    <MapPin size={9}/>{e.lokasi}
                  </p>
                  {e.peran && (
                    <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{background: T.accentBg, border: `1px solid ${T.accentBorder}`, color: T.sageDeeper}}>
                      {PERAN_LABEL[e.peran]}
                    </span>
                  )}
                  {e.status !== 'selesai' && (
                    <EventCountdown tanggal={e.tanggal} jamMulai={e.jam_mulai}/>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Explore events ── */}
      {myEvents.length === 0 && exploreEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold flex items-center gap-1.5" style={{color: T.text1}}>
              <Calendar size={13} style={{color: T.sageDark}}/> Event Mendatang
            </h2>
            <Link to="/dashboard/event"
              className="text-xs font-semibold hover:underline flex items-center gap-1"
              style={{color: T.sageDark}}>
              Jelajahi <ChevronRight size={12}/>
            </Link>
          </div>
          <div className="space-y-2">
            {exploreEvents.map(e => (
              <div key={e.id} className="flex gap-3 p-3 rounded-2xl"
                style={{background: T.surface, border: `1px solid ${T.border}`,
                        boxShadow: T.shadowSm}}>
                <div className="shrink-0 w-11 rounded-xl flex flex-col items-center justify-center py-2"
                  style={{background: T.border}}>
                  <span className="text-base font-bold leading-none" style={{color: T.text2}}>
                    {new Date(e.tanggal).getDate()}
                  </span>
                  <span className="text-[9px] font-semibold uppercase mt-0.5"
                    style={{color: T.textMuted}}>
                    {new Date(e.tanggal).toLocaleDateString('id-ID',{month:'short'})}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1" style={{color: T.text1}}>{e.nama}</p>
                  <p className="text-xs mt-0.5" style={{color: T.textMuted}}>{e.lokasi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Story feed ── */}
      {stories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold flex items-center gap-1.5" style={{color: T.text1}}>
              <BookOpen size={13} style={{color: T.sageDark}}/> Story Terbaru
            </h2>
            <Link to="/dashboard/story"
              className="text-xs font-semibold hover:underline flex items-center gap-1"
              style={{color: T.sageDark}}>
              Semua <ChevronRight size={12}/>
            </Link>
          </div>
          <div className="space-y-3">
            {stories.slice(0,2).map(s => (
              <div key={s.id} className="rounded-2xl p-4"
                style={{background: T.surface, border: `1px solid ${T.border}`,
                        boxShadow: T.shadowSm}}>
                {s.media_url && (
                  <img src={s.media_url} alt="" className="w-full h-32 object-cover rounded-xl mb-3"/>
                )}
                <p className="text-sm leading-relaxed line-clamp-2" style={{color: T.text2}}>
                  {s.konten}
                </p>
                {s.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.tags.slice(0,3).map(t => (
                      <span key={t} className="text-[10px] font-medium flex items-center gap-0.5"
                        style={{color: T.sageDark}}>
                        <Hash size={8}/>{t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 pt-2"
                  style={{borderTop: `1px solid ${T.border}`}}>
                  <span className="text-xs" style={{color: T.textMuted}}>{fmtDate(s.created_at||s.tanggal)}</span>
                  <span className="text-xs" style={{color: T.textMuted}}>+{s.like_count||s.suka||0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Portofolio CTA ── */}
      {(user.total_karya||0) < 3 && (
        <Link to="/dashboard/portofolio"
          className="flex items-center gap-4 rounded-2xl p-4 transition-opacity hover:opacity-90"
          style={{background:`linear-gradient(135deg,${T.charcoal} 0%,${T.sageDeeper} 100%)`}}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{background:'rgba(195,202,150,0.15)'}}>
            <Image size={18} style={{color: T.sage}}/>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-white">Lengkapi Portofolio</p>
            <p className="text-xs mt-0.5" style={{color:'rgba(195,202,150,0.6)'}}>
              Tampilkan karya ke publik dan menarik event
            </p>
          </div>
          <ChevronRight size={16} style={{color:'rgba(195,202,150,0.4)', flexShrink:0}}/>
        </Link>
      )}
    </div>
  );
}
