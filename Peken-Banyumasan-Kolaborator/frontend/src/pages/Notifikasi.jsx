import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Calendar, Info, Users, Trash2, FileText } from 'lucide-react';
import { getNotifs, markRead, markAllRead } from '../lib/notifications';
import api from '../services/api';

const TYPE_ICON = {
  member_approved:     { icon:Users,    cls:'bg-green-50 text-green-600'  },
  event_assigned:      { icon:Calendar, cls:'bg-brand-50 text-brand-600'  },
  event_status_change: { icon:Bell,     cls:'bg-blue-50 text-blue-600'    },
  story_deleted:       { icon:Trash2,   cls:'bg-red-50 text-red-500'      },
  event:               { icon:Calendar, cls:'bg-brand-50 text-brand-600'  },
  system:              { icon:Info,     cls:'bg-earth-100 text-earth-600' },
};

const fmtTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d > 0) return `${d} hari lalu`;
  if (h > 0) return `${h} jam lalu`;
  if (m > 0) return `${m} menit lalu`;
  return 'Baru saja';
};

export default function Notifikasi() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('semua'); // semua | belum | sudah

  const refresh = () => {
    const local = getNotifs('member');
    // Merge with dummy if local is empty (first visit)
    if (local.length === 0) {
      api.notifikasi.list().then(r => {
        setList(r.data.map(n => ({
          ...n, id: n.id, type: n.tipe || 'system', read: n.dibaca,
          title: n.pesan, message: n.pesan, created_at: new Date().toISOString(),
          icon: '🔔',
        })));
      });
    } else {
      setList(local);
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener('pekan_notif_update', refresh);
    return () => window.removeEventListener('pekan_notif_update', refresh);
  }, []);

  const baca = (id) => { markRead('member', id); refresh(); };
  const bacaSemua = () => { markAllRead('member'); refresh(); };
  const unread = list.filter(n => !n.read && !n.dibaca).length;

  const filtered = list.filter(n => {
    const isRead = n.read || n.dibaca;
    if (filter === 'belum') return !isRead;
    if (filter === 'sudah') return isRead;
    return true;
  });

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-earth-900">Notifikasi</h1>
          {unread > 0 && <p className="text-brand-600 text-sm font-medium mt-0.5">{unread} belum dibaca</p>}
        </div>
        {unread > 0 && (
          <button onClick={bacaSemua} className="flex items-center gap-1.5 text-sm text-batik-600 hover:text-batik-800 font-medium transition">
            <CheckCheck size={15}/> Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[['semua','Semua'],['belum','Belum Dibaca'],['sudah','Sudah Dibaca']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition
              ${filter===v ? 'bg-brand-700 text-white border-brand-700' : 'bg-white border-earth-200 text-earth-600 hover:border-brand-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-100 p-14 text-center">
          <Bell size={36} className="text-earth-200 mx-auto mb-3"/>
          <p className="text-earth-500 text-sm">
            {filter === 'belum' ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const isRead = n.read || n.dibaca;
            const meta = TYPE_ICON[n.type] || TYPE_ICON.system;
            const Icon = meta.icon;
            return (
              <button key={n.id} onClick={() => baca(n.id)}
                className={`w-full text-left flex gap-3 items-start p-4 rounded-2xl border transition
                  ${!isRead ? 'bg-white border-brand-200 shadow-sm' : 'bg-white/70 border-earth-100 opacity-80'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.cls}`}>
                  <Icon size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                  {n.title && n.title !== n.message && (
                    <p className={`text-xs font-bold mb-0.5 ${!isRead ? 'text-brand-700' : 'text-earth-500'}`}>
                      {n.icon} {n.title}
                    </p>
                  )}
                  <p className={`text-sm leading-snug ${!isRead ? 'text-earth-900 font-medium' : 'text-earth-600'}`}>
                    {n.message || n.pesan}
                  </p>
                  <p className="text-earth-400 text-xs mt-1">
                    {n.created_at ? fmtTime(n.created_at) : n.waktu}
                  </p>
                </div>
                {!isRead && <div className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2"/>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
