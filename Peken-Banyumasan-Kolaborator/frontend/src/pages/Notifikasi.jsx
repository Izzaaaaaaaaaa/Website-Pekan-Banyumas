// Notifikasi.jsx — Peken Banyumasan Design System v2.0
import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Calendar, Info, Users, Trash2 } from 'lucide-react';
import { notifikasiApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';
import { useToast } from '../components/Toast';
import { STORAGE_EVENTS } from '../lib/storageKeys';
import { T } from '../lib/tokens';

// Peta tipe notifikasi → ikon & warna
const TYPE_META = {
  kolaborator_approved: { icon:Users,    style:{ background:T.successBg, color:T.success,  border:`1px solid ${T.successBorder}` } },
  event_assigned:       { icon:Calendar, style:{ background:T.accentBg,  color:T.sageDark, border:`1px solid ${T.accentBorder}` } },
  event_status_change:  { icon:Bell,     style:{ background:T.infoBg,    color:T.info,     border:`1px solid ${T.infoBorder}` } },
  story_deleted:        { icon:Trash2,   style:{ background:T.errorBg,   color:T.error,    border:`1px solid ${T.errorBorder}` } },
  event:                { icon:Calendar, style:{ background:T.accentBg,  color:T.sageDark, border:`1px solid ${T.accentBorder}` } },
  system:               { icon:Info,     style:{ background:T.accentBg,  color:T.text2,    border:`1px solid ${T.border}` } },
};

// Pemetaan tipe notifikasi ke kategori preferensi
// Digunakan untuk filter berdasarkan toggle di Pengaturan
const TYPE_TO_PREF = {
  kolaborator_approved:   'system',
  story_deleted:          'system',
  event_assigned:         'event',
  event_status_change:    'event',
  event:                  'event',
  event_invite:           'event',
  event_update:           'event',
  event_request_sent:     'event',
  event_request_approved: 'event',
  event_request_rejected: 'event',
  system:                 'system',
};

const NOTIF_PREF_KEY = 'peken_notif_pref';

function loadNotifPref() {
  try {
    const saved = localStorage.getItem(NOTIF_PREF_KEY);
    if (saved) return { ...{ event:true, system:true, digest:false }, ...JSON.parse(saved) };
  } catch (_) {}
  return { event:true, system:true, digest:false };
}

const fmtTime = iso => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d > 0) return `${d} hari lalu`;
  if (h > 0) return `${h} jam lalu`;
  if (m > 0) return `${m} menit lalu`;
  return 'Baru saja';
};

export default function Notifikasi() {
  const toast = useToast();
  const [list,   setList]   = useState([]);
  const [filter, setFilter] = useState('semua');
  const notifPref = loadNotifPref();

  const refresh = async () => {
    try {
      const remote = await notifikasiApi.list();
      setList(remote || []);
    } catch (err) { toast.error(extractError(err, 'Gagal memuat notifikasi')); }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baca = async (id) => {
    try {
      await notifikasiApi.baca(id);
      setList(l => l.map(n => n.id === id ? { ...n, read: true } : n));
      // Update badge di sidebar
      window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.NOTIF_UPDATE));
    } catch {}
  };

  const bacaSemua = async () => {
    try {
      await notifikasiApi.bacaSemua();
      setList(l => l.map(n => ({ ...n, read: true })));
      // Update badge di sidebar
      window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.NOTIF_UPDATE));
    } catch {}
  };

  // Terapkan filter preferensi: sembunyikan tipe yang dinonaktifkan user
  // Hanya kategori 'event' yang bisa dimatikan dari Pengaturan; tipe lain
  // (system dsb.) selalu tampil — toggle "Notifikasi Sistem" sudah dihapus,
  // jadi tanpa pengecualian ini notif system bisa tersembunyi selamanya bagi
  // user yang pernah mematikannya dulu.
  const prefFiltered = list.filter(n => {
    const pref = TYPE_TO_PREF[n.type] || 'system';
    return pref === 'event' ? notifPref.event !== false : true;
  });

  const unread = prefFiltered.filter(n => !n.read).length;

  const filtered = prefFiltered.filter(n => {
    if (filter === 'belum') return !n.read;
    if (filter === 'sudah') return n.read;
    return true;
  });

  const filterBtnStyle = active => active
    ? { background:T.sageDark, color:T.white, border:`1px solid ${T.sageDark}` }
    : { background:T.surface, border:`1px solid ${T.border}`, color:T.text2 };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-medium" style={{color:T.text1}}>Notifikasi</h1>
          {unread > 0 && (
            <p className="text-sm font-medium mt-0.5" style={{color:T.sageDark}}>
              {unread} belum dibaca
            </p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={bacaSemua}
            className="flex items-center gap-1.5 text-sm font-medium transition"
            style={{color:T.sageDark}}>
            <CheckCheck size={15}/> Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Info preferensi jika ada yang dinonaktifkan */}
      {!notifPref.event && (
        <div className="mb-3 px-3 py-2 rounded-xl text-xs"
          style={{background:T.accentBg, border:`1px solid ${T.accentBorder}`, color:T.sageDark}}>
          Beberapa notifikasi disembunyikan sesuai preferensi. Atur di{' '}
          <a href="/dashboard/pengaturan" style={{fontWeight:600, textDecoration:'underline'}}>
            Pengaturan
          </a>.
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        {[['semua','Semua'],['belum','Belum Dibaca'],['sudah','Sudah Dibaca']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition"
            style={filterBtnStyle(filter===v)}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-14 text-center"
          style={{background:T.surface, border:`1px solid ${T.border}`, boxShadow:T.shadowSm}}>
          <Bell size={36} className="mx-auto mb-3" style={{color:T.borderStrong}}/>
          <p className="text-sm" style={{color:T.textMuted}}>
            {filter==='belum' ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const isRead = n.read;
            const meta   = TYPE_META[n.type] || TYPE_META.system;
            const Icon   = meta.icon;
            return (
              <button key={n.id} onClick={() => baca(n.id)}
                className="w-full text-left flex gap-3 items-start p-4 rounded-2xl transition"
                style={{
                  background: !isRead ? T.surface : 'rgba(255,255,255,0.65)',
                  border:     !isRead ? `1px solid ${T.accentBorder}` : `1px solid ${T.border}`,
                  boxShadow:  !isRead ? T.shadowSm : 'none',
                  opacity:    isRead  ? .85 : 1,
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={meta.style}>
                  <Icon size={15}/>
                </div>
                <div className="flex-1 min-w-0">
                  {n.title && n.title !== n.message && (
                    <p className="text-xs font-bold mb-0.5"
                      style={{color: !isRead ? T.sageDeeper : T.textMuted}}>
                      {n.title}
                    </p>
                  )}
                  <p className="text-sm leading-snug"
                    style={{color: !isRead ? T.text1 : T.text2, fontWeight: !isRead ? 500 : 400}}>
                    {n.message}
                  </p>
                  <p className="text-xs mt-1" style={{color:T.textMuted}}>
                    {fmtTime(n.created_at)}
                  </p>
                </div>
                {!isRead && (
                  <div className="w-2 h-2 rounded-full shrink-0 mt-2"
                    style={{background:T.accent}}/>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
