// Event.jsx — Revisi: Jelajahi | Saya Ikuti | Selesai
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, CheckCircle, Clock, Loader2, Users, Tag, X, Image, Mic2, Store } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_CLS = {
  upcoming:    'bg-brand-50 text-brand-700 border-brand-200',
  berlangsung: 'bg-blue-50 text-blue-600 border-blue-200',
  selesai:     'bg-earth-50 text-earth-500 border-earth-200',
};

const PERAN_LABEL = { peserta:'Peserta', performer:'Performer', panitia:'Panitia' };

// ── EventDetailModal ─────────────────────────────────────────────────────────
function EventDetailModal({ event, onClose, onDaftar, loadingId }) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
        {/* Banner */}
        {event.banner_url
          ? <img src={event.banner_url} alt="" className="w-full h-40 object-cover rounded-t-2xl shrink-0"/>
          : <div className="w-full h-24 bg-gradient-to-br from-batik-700/30 to-earth-200 rounded-t-2xl shrink-0 flex items-center justify-center">
              <Calendar size={32} className="text-batik-700/40"/>
            </div>
        }
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-start gap-2 justify-between">
            <h2 className="font-display font-bold text-earth-900 text-lg leading-snug">{event.nama}</h2>
            <button onClick={onClose}><X size={20} className="text-earth-400 hover:text-earth-700 transition"/></button>
          </div>
          <div className="space-y-1.5 text-sm text-earth-500">
            <div className="flex items-center gap-2"><Calendar size={13}/>{new Date(event.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}{event.jam_mulai && <span className="ml-1 text-earth-400">· {event.jam_mulai.replace(':','.')}{event.jam_selesai ? ` – ${event.jam_selesai.replace(':','.')}` : ''} WIB</span>}</div>
            <div className="flex items-center gap-2"><MapPin size={13}/>{event.lokasi}</div>
            <div className="flex items-center gap-2"><Users size={13}/>{event.peserta_count||0} terdaftar</div>
          </div>
          {event.subsektor?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.subsektor.map(s => <span key={s} className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-medium">{s}</span>)}
            </div>
          )}
          <p className="text-earth-600 text-sm leading-relaxed">{event.deskripsi}</p>
          {event.konten_lengkap && <p className="text-earth-500 text-sm leading-relaxed">{event.konten_lengkap}</p>}
          {/* Lineup */}
          {event.lineup?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-earth-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Mic2 size={11}/>Akan Tampil</p>
              <div className="flex flex-wrap gap-2">
                {event.lineup.map(m => (
                  <div key={m.id} className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
                    <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-[10px] font-bold">{m.nama.charAt(0)}</div>
                    <span className="text-purple-700 text-xs font-medium">{m.nama}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* UMKM */}
          {event.umkm?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-earth-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Store size={11}/>UMKM Peserta</p>
              <div className="flex flex-wrap gap-1.5">
                {event.umkm.map(u => (
                  <span key={u.id} className="px-2.5 py-1 bg-green-50 border border-green-100 text-green-700 rounded-full text-xs">{u.nama_usaha}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-earth-50 shrink-0">
          {event.terdaftar
            ? <span className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl"><CheckCircle size={14} fill="currentColor"/>Sudah Terdaftar</span>
            : event.status !== 'selesai'
              ? <button onClick={() => onDaftar(event.id)} disabled={loadingId===event.id}
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-70 flex items-center justify-center gap-2">
                  {loadingId===event.id ? <><Loader2 size={13} className="animate-spin"/>Mendaftar...</> : 'Daftar Sekarang'}
                </button>
              : <p className="text-center text-earth-400 text-sm">Event telah selesai</p>
          }
        </div>
      </div>
    </div>
  );
}

// ── EventCard ─────────────────────────────────────────────────────────────────
const EventCard = ({ event, onDaftar, loadingId, onClick, showPeran }) => {
  const tgl = new Date(event.tanggal);
  const isLoading = loadingId === event.id;
  const s = STATUS_CLS[event.status] || STATUS_CLS.upcoming;

  return (
    <div className={`bg-white rounded-2xl border cursor-pointer hover:shadow-md transition-shadow ${event.terdaftar ? 'border-green-200' : 'border-earth-100'}`} onClick={onClick}>
      <div className="p-5 flex gap-4">
        {/* Date pill */}
        <div className="shrink-0 text-center w-14">
          <div className={`rounded-xl py-2 px-1 ${event.status==='selesai'?'bg-earth-100':'bg-primary-700'}`}>
            <p className={`text-xl font-bold font-display leading-none ${event.status==='selesai'?'text-earth-500':'text-white'}`}>{tgl.getDate()}</p>
            <p className={`text-[11px] font-medium mt-0.5 uppercase tracking-wide ${event.status==='selesai'?'text-earth-400':'text-primary-200'}`}>{tgl.toLocaleDateString('id-ID',{month:'short'})}</p>
          </div>
          <p className={`text-[10px] mt-1 ${event.status==='selesai'?'text-earth-400':'text-earth-500'}`}>{tgl.getFullYear()}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <h3 className="font-display font-semibold text-earth-900 text-sm leading-snug">{event.nama}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${s}`}>{event.status}</span>
          </div>
          <p className="text-earth-500 text-xs flex items-center gap-1"><MapPin size={11}/>{event.lokasi}</p>
          <p className="text-earth-400 text-xs mt-1.5 line-clamp-1">{event.deskripsi}</p>
          {showPeran && event.peran && (
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] rounded-full font-medium">{PERAN_LABEL[event.peran]}</span>
              <span className={`text-[10px] ${event.assigned_by==='admin'?'text-blue-500':'text-earth-400'}`}>
                {event.assigned_by==='admin'?'Ditugaskan Admin':'Mandiri'}
              </span>
            </div>
          )}
          {/* Kapasitas bar (jika bukan selesai) */}
          {event.status !== 'selesai' && event.kapasitas && (
            <div className="mt-2">
              <div className="h-1 bg-earth-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-700/50 rounded-full" style={{width:`${Math.min(100,(event.peserta_count||0)/event.kapasitas*100)}%`}}/>
              </div>
            </div>
          )}
          <div className="mt-3" onClick={e => e.stopPropagation()}>
            {event.terdaftar
              ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full"><CheckCircle size={11} fill="currentColor"/>Sudah Terdaftar</span>
              : event.status !== 'selesai'
                ? <button onClick={() => onDaftar(event.id)} disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold rounded-xl transition disabled:opacity-70">
                    {isLoading?<Loader2 size={11} className="animate-spin"/>:null}
                    {isLoading?'Mendaftar...':'Daftar Event'}
                  </button>
                : <span className="text-earth-400 text-xs flex items-center gap-1"><Clock size={11}/>Event selesai</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
// ── RoleRegisterModal — member picks role before registering ──────────────────
function RoleRegisterModal({ event, onClose, onConfirm, loading }) {
  const [peran, setPeran] = useState('peserta');

  const ROLES = [
    {
      value:'peserta',
      label:'Peserta',
      icon:'🎟️',
      desc:'Hadir dan menikmati event sebagai pengunjung/peserta.',
    },
    {
      value:'performer',
      label:'Performer',
      icon:'🎭',
      desc:'Tampil atau menampilkan karya di event ini. Admin akan konfirmasi.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-4 border-b border-earth-100">
          <h3 className="font-display font-bold text-earth-900 text-lg">Daftar ke Event</h3>
          <p className="text-earth-500 text-sm mt-0.5 line-clamp-1">{event.nama}</p>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs font-bold text-earth-400 uppercase tracking-widest">Saya ingin ikut sebagai:</p>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setPeran(r.value)}
              className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition
                ${peran === r.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-earth-100 bg-white hover:border-primary-300'}`}>
              <span className="text-xl shrink-0 mt-0.5">{r.icon}</span>
              <div>
                <p className={`font-bold text-sm ${peran===r.value?'text-primary-700':'text-earth-900'}`}>{r.label}</p>
                <p className="text-earth-500 text-xs mt-0.5 leading-relaxed">{r.desc}</p>
              </div>
              {peran === r.value && (
                <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-primary-700 flex items-center justify-center mt-0.5">
                  <span className="text-white text-[10px] font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 border border-earth-200 text-earth-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-earth-50 transition">
              Batal
            </button>
            <button onClick={() => onConfirm(event.id, peran)} disabled={loading}
              className="flex-1 bg-primary-700 hover:bg-primary-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 size={13} className="animate-spin"/>Mendaftar...</>
                : 'Daftar Sekarang'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Event() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('jelajahi');
  const [loadingId, setLoadingId] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);

  useEffect(() => {
    api.event.list().then(r => { setList(r.data); setLoading(false); });
  }, []);

  const [registerModal, setRegisterModal] = useState(null);

  const daftar = async (eventId, peran = 'peserta') => {
    setLoadingId(eventId);
    try {
      await api.event.daftar(eventId);
      setList(l => l.map(e => e.id===eventId ? {...e, terdaftar:true, peran} : e));
      toast.success(`Berhasil mendaftar sebagai ${peran}!`);
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        import('../lib/notifications').then(({ triggerMemberEventRegister }) => {
          const ev = list.find(e => e.id === eventId);
          if (ev) triggerMemberEventRegister(user.nama || 'Member', ev.nama);
        });
      } catch {}
    } catch { toast.error('Gagal mendaftar'); }
    finally { setLoadingId(null); }
  };

  const openRegister = (event) => setRegisterModal(event);

  const jelajahi = list.filter(e => ['upcoming','berlangsung'].includes(e.status));
  const sayaIkuti = list.filter(e => e.terdaftar && ['upcoming','berlangsung'].includes(e.status));
  const selesai   = list.filter(e => e.status === 'selesai' && e.terdaftar);

  const currentList = tab === 'jelajahi' ? jelajahi : tab === 'saya_ikuti' ? sayaIkuti : selesai;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-earth-900">Event Budaya</h1>
        <p className="text-earth-500 text-sm mt-0.5">{jelajahi.length} event tersedia · {sayaIkuti.length} saya ikuti</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-primary-700 rounded-2xl p-4 text-white">
          <p className="text-batik-300 text-xs font-medium mb-1">Event Tersedia</p>
          <p className="text-3xl font-bold font-display">{jelajahi.length}</p>
        </div>
        <div className="bg-white border border-earth-100 rounded-2xl p-4">
          <p className="text-earth-500 text-xs font-medium mb-1">Saya Terdaftar</p>
          <p className="text-3xl font-bold font-display text-brand-600">{sayaIkuti.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-earth-100 p-1 rounded-xl mb-5">
        {[['jelajahi','Jelajahi'],['saya_ikuti','Saya Ikuti'],['selesai','Selesai']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${tab===v?'bg-white text-earth-900 shadow-sm':'text-earth-500 hover:text-earth-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="bg-earth-100 rounded-2xl h-28 animate-pulse"/>)}</div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-100 p-10 text-center">
          <Calendar size={36} className="text-earth-200 mx-auto mb-3"/>
          <p className="text-earth-500 text-sm">
            {tab === 'jelajahi' ? 'Belum ada event tersedia' : tab === 'saya_ikuti' ? 'Kamu belum terdaftar di event manapun' : 'Belum ada event selesai'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map(e => (
            <EventCard key={e.id} event={e} onDaftar={openRegister} loadingId={loadingId}
              showPeran={tab !== 'jelajahi'}
              onClick={() => setDetailEvent(e)}
            />
          ))}
        </div>
      )}

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onDaftar={openRegister}
          loadingId={loadingId}
        />
      )}

      {registerModal && (
        <RoleRegisterModal
          event={registerModal}
          onClose={() => setRegisterModal(null)}
          onConfirm={(id, peran) => { daftar(id, peran); setRegisterModal(null); }}
          loading={loadingId === registerModal?.id}
        />
      )}
    </div>
  );
}
