// Dashboard.jsx — Kolaborator dashboard — consistent with gate/Artisan green palette
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Image, BookOpen, Calendar, ArrowRight,
  MapPin, Sparkles, ChevronRight, Zap, Hash
} from 'lucide-react';
import api, { getUser } from '../services/api';
import { useToast } from '../components/Toast';

const fmtDate = d => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  if (diff < 7) return `${diff} hari lalu`;
  return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short'});
};

const PERAN_LABEL = { performer:'Performer', peserta:'Peserta', panitia:'Panitia' };
const PERAN_CLS = {
  performer:'bg-purple-50 text-purple-700 border-purple-200',
  peserta:  'bg-primary-50 text-primary-700 border-primary-200',
  panitia:  'bg-amber-50 text-amber-700 border-amber-200',
};


// ── Event countdown hook (HARI · JAM · MENIT, updates every minute) ──────────
function useEventCountdown(tanggal, jamMulai) {
  const [time, setTime] = React.useState({ d:'00', j:'00', m:'00' });
  const [selesai, setSelesai] = React.useState(false);
  React.useEffect(() => {
    if (!tanggal) return;
    const target = tanggal
      ? new Date(`${tanggal}T${jamMulai || '08:00'}:00+07:00`)
      : null;
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

// Compact countdown row: [01 H] [30 J] [45 M]
function EventCountdown({ tanggal, jamMulai }) {
  const { time, selesai } = useEventCountdown(tanggal, jamMulai);
  if (selesai) return <span className="text-[10px] text-earth-400 font-medium">Selesai</span>;
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {[['d','H'],['j','J'],['m','M']].map(([k,u]) => (
        <div key={k} className="bg-primary-700 text-white rounded-md px-1.5 py-0.5 text-center min-w-[26px]">
          <div className="text-[11px] font-black leading-none">{time[k]}</div>
          <div className="text-[8px] opacity-70 font-semibold leading-none mt-0.5">{u}</div>
        </div>
      ))}
    </div>
  );
}

// ── Quick compose ─────────────────────────────────────────────────────────────
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
      toast.success('Aktivitas berhasil diposting!');
    } catch { toast.error('Gagal posting'); }
    finally { setSaving(false); }
  };

  const initial = (user.nama||'U').charAt(0).toUpperCase();
  const avatar = user.foto_url
    ? <img src={user.foto_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0"/>
    : <div className="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold text-sm shrink-0">{initial}</div>;

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full flex items-center gap-3 bg-white border border-earth-100 rounded-2xl p-4 text-left hover:border-primary-300 hover:bg-primary-50/20 transition group">
      {avatar}
      <span className="text-earth-300 text-sm flex-1 group-hover:text-primary-500 transition">Apa yang sedang kamu kerjakan? ✍️</span>
      <Plus size={17} className="text-earth-200 group-hover:text-primary-400 transition shrink-0"/>
    </button>
  );

  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        {avatar}
        <p className="text-earth-700 text-sm font-semibold">{user.nama||'Kamu'}</p>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value.slice(0,500))} rows={3} autoFocus
        placeholder="Bagikan momen, proses karya, atau inspirasi hari ini..."
        className="w-full border border-earth-100 rounded-xl px-3 py-2.5 text-sm text-earth-700 focus:outline-none focus:border-primary-400 resize-none bg-earth-50/50"/>
      <div className="flex items-center justify-between">
        <span className="text-xs text-earth-300">{text.length}/500</span>
        <div className="flex gap-2">
          <button onClick={() => { setOpen(false); setText(''); }}
            className="px-3 py-1.5 text-earth-500 text-xs font-semibold hover:bg-earth-50 rounded-lg transition">Batal</button>
          <button onClick={submit} disabled={!text.trim()||saving}
            className="px-4 py-1.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50">
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
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.aktivitas.list().then(r => setStories(r.data.slice(0, 4)));
    api.event.list().then(r => {
      setEvents(r.data.filter(e => ['upcoming','berlangsung'].includes(e.status)));
    });
  }, []);

  const postAktivitas = async (data) => {
    const res = await api.aktivitas.create(data);
    setStories(l => [{ ...res.data, like_count: 0 }, ...l.slice(0, 3)]);
  };

  const myEvents = events.filter(e => e.terdaftar);
  const exploreEvents = events.filter(e => !e.terdaftar).slice(0, 2);

  const initial = (user.nama||'U').charAt(0).toUpperCase();

  return (
    <div className="space-y-5 pb-8">

      {/* ── Profile hero — green gradient matching gate ── */}
      <div className="relative overflow-hidden rounded-2xl"
        style={{background:'linear-gradient(135deg,#1a3a2a 0%,#2f6f4e 100%)'}}>
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 bg-white pointer-events-none"/>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-5 bg-white pointer-events-none"/>
        <div className="relative p-5">
          <div className="flex items-start gap-3">
            {user.foto_url
              ? <img src={user.foto_url} alt="" className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/20 shrink-0"/>
              : <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center text-white text-2xl font-bold shrink-0">{initial}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs mb-0.5">Selamat datang 👋</p>
              <h1 className="text-white font-display font-bold text-lg leading-tight truncate">{user.nama||'Kolaborator'}</h1>
              <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5"><MapPin size={10}/>{user.kota||'—'}</p>
            </div>
            <Link to="/dashboard/profil" className="shrink-0 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl transition border border-white/10">
              Edit
            </Link>
          </div>
          {(user.subsektor||[]).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(user.subsektor||[]).map(s => (
                <span key={s} className="px-2 py-0.5 bg-white/10 border border-white/10 rounded-full text-[11px] text-white/70 font-medium">{s}</span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[['🎨',user.total_karya||18,'Karya'],['✍️',user.total_aktivitas||24,'Aktivitas'],['📅',user.total_event||6,'Event']].map(([e,v,l]) => (
              <div key={l} className="bg-white/8 rounded-xl px-2 py-2 text-center">
                <div className="text-sm">{e}</div>
                <div className="text-white font-bold text-base leading-tight">{v}</div>
                <div className="text-white/50 text-[10px] font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p className="text-xs font-bold text-earth-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
          <Zap size={10}/> Aksi Cepat
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { to:'/dashboard/aktivitas',      e:'✍️', l:'Tulis Story',    cls:'bg-white border-earth-200 hover:border-primary-300 hover:bg-primary-50/20' },
            { to:'/dashboard/portofolio', e:'🎨', l:'Tambah Karya',   cls:'bg-white border-earth-200 hover:border-primary-300 hover:bg-primary-50/20' },
            { to:'/dashboard/event',      e:'📅', l:'Cari Event',     cls:'bg-white border-earth-200 hover:border-primary-300 hover:bg-primary-50/20' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 text-earth-700 transition ${a.cls}`}>
              <span className="text-xl">{a.e}</span>
              <span className="text-[11px] font-semibold text-center leading-tight">{a.l}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Quick aktivitas compose ── */}
      <QuickCompose user={user} onPost={postAktivitas}/>

      {/* ── Event Saya ── */}
      {myEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-earth-900 flex items-center gap-1.5">
              <Calendar size={14} className="text-primary-600"/> Event Saya
            </h2>
            <Link to="/dashboard/event" className="text-primary-600 text-xs font-semibold hover:underline flex items-center gap-1">
              Semua <ChevronRight size={12}/>
            </Link>
          </div>
          <div className="space-y-2">
            {myEvents.slice(0,2).map(e => (
              <div key={e.id} className="flex gap-3 p-3 rounded-2xl border border-primary-200 bg-primary-50/30">
                <div className="shrink-0 w-11 rounded-xl flex flex-col items-center justify-center py-2 bg-primary-700">
                  <span className="text-base font-bold text-white leading-none">{new Date(e.tanggal).getDate()}</span>
                  <span className="text-[9px] font-semibold uppercase text-primary-200 mt-0.5">{new Date(e.tanggal).toLocaleDateString('id-ID',{month:'short'})}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-earth-900 text-sm leading-snug line-clamp-1">{e.nama}</p>
                  <p className="text-earth-400 text-xs mt-0.5 flex items-center gap-1"><MapPin size={9}/>{e.lokasi}</p>
                  {e.peran && (
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PERAN_CLS[e.peran]}`}>
                      {PERAN_LABEL[e.peran]}
                    </span>
                  )}
                  {e.status !== 'selesai' && <EventCountdown tanggal={e.tanggal} jamMulai={e.jam_mulai}/>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Explore events (if none registered) ── */}
      {myEvents.length === 0 && exploreEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-earth-900 flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand-500"/> Event Mendatang
            </h2>
            <Link to="/dashboard/event" className="text-primary-600 text-xs font-semibold hover:underline flex items-center gap-1">
              Jelajahi <ChevronRight size={12}/>
            </Link>
          </div>
          <div className="space-y-2">
            {exploreEvents.map(e => (
              <div key={e.id} className="flex gap-3 p-3 rounded-2xl border border-earth-100 bg-white">
                <div className="shrink-0 w-11 rounded-xl flex flex-col items-center justify-center py-2 bg-earth-100">
                  <span className="text-base font-bold text-earth-600 leading-none">{new Date(e.tanggal).getDate()}</span>
                  <span className="text-[9px] font-semibold uppercase text-earth-400 mt-0.5">{new Date(e.tanggal).toLocaleDateString('id-ID',{month:'short'})}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-earth-900 text-sm line-clamp-1">{e.nama}</p>
                  <p className="text-earth-400 text-xs mt-0.5">{e.lokasi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Aktivitas feed ── */}
      {stories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-earth-900 flex items-center gap-1.5">
              <BookOpen size={13} className="text-primary-600"/> Aktivitas Terbaru
            </h2>
            <Link to="/dashboard/aktivitas" className="text-primary-600 text-xs font-semibold hover:underline flex items-center gap-1">
              Semua <ChevronRight size={12}/>
            </Link>
          </div>
          <div className="space-y-3">
            {stories.slice(0,2).map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-earth-100 p-4">
                {s.media_url && <img src={s.media_url} alt="" className="w-full h-32 object-cover rounded-xl mb-3"/>}
                <p className="text-earth-700 text-sm leading-relaxed line-clamp-2">{s.konten}</p>
                {s.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.tags.slice(0,3).map(t => (
                      <span key={t} className="text-[10px] text-primary-600 font-medium flex items-center gap-0.5">
                        <Hash size={8}/>{t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-earth-50">
                  <span className="text-earth-400 text-xs">{fmtDate(s.created_at||s.tanggal)}</span>
                  <span className="text-earth-400 text-xs">👏 {s.like_count||s.suka||0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Portofolio CTA ── */}
      {(user.total_karya||0) < 3 && (
        <Link to="/dashboard/portofolio"
          className="flex items-center gap-4 rounded-2xl p-4 transition hover:opacity-90"
          style={{background:'linear-gradient(135deg,#2f6f4e,#4a9b6e)'}}>
          <span className="text-2xl">🎨</span>
          <div className="flex-1">
            <p className="font-semibold text-sm text-white">Lengkapi Portofolio</p>
            <p className="text-white/60 text-xs mt-0.5">Tampilkan karya ke publik dan menarik event</p>
          </div>
          <ChevronRight size={16} className="text-white/40 shrink-0"/>
        </Link>
      )}
    </div>
  );
}
