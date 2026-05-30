// Event.jsx — Peken Banyumasan Design System v2.0
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, CheckCircle, Clock, Loader2, Users, X, Mic2, Store } from 'lucide-react';
import { eventApi } from '../services/endpoints';
import { getUser } from '../lib/auth';
import { extractError } from '../lib/unwrap';
import { useToast } from '../components/Toast';
import { T } from '../lib/tokens';

const PERAN_LABEL = { peserta:'Peserta', performer:'Performer', panitia:'Panitia' };

const STATUS_STYLE = {
  upcoming:    { background: T.accentBg,  border: `1px solid ${T.accentBorder}`, color: T.sageDeeper },
  berlangsung: { background: T.infoBg,    border: `1px solid ${T.infoBorder}`,   color: T.info },
  selesai:     { background: T.surfaceHover, border: `1px solid ${T.border}`,   color: T.textMuted },
};
const EV_LABEL = { upcoming: 'Akan Datang', berlangsung: 'Berlangsung', selesai: 'Selesai' };
// Display key from the backend-derived status_efektif (falls back to raw status
// for dummy mode). 'published' = scheduled → shown as "Akan Datang".
const dispStatus = (e) => {
  const s = e.status_efektif || e.status;
  return s === 'selesai' ? 'selesai'
    : s === 'berlangsung' ? 'berlangsung'
    : 'upcoming';
};

// ── EventDetailModal ──────────────────────────────────────────────────────────
function EventDetailModal({ event, onClose, onDaftar, loadingId }) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{background:'rgba(13,13,13,0.55)'}}
      onClick={onClose}>
      <div className="rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        style={{background: T.surface, border: `1px solid ${T.border}`}}
        onClick={e => e.stopPropagation()}>

        {event.banner_url
          ? <img src={event.banner_url} alt="" className="w-full h-40 object-cover rounded-t-2xl shrink-0"/>
          : <div className="w-full h-20 rounded-t-2xl shrink-0 flex items-center justify-center"
              style={{background: T.accentBg}}>
              <Calendar size={28} style={{color: T.sageDark, opacity:.5}}/>
            </div>
        }

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-start gap-2 justify-between">
            <h2 className="font-semibold text-base leading-snug" style={{color: T.text1}}>
              {event.nama}
            </h2>
            <button onClick={onClose} style={{color: T.textMuted, flexShrink:0}}><X size={20}/></button>
          </div>

          <div className="space-y-1.5 text-sm" style={{color: T.textMuted}}>
            <div className="flex items-center gap-2">
              <Calendar size={13}/>
              {new Date(event.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}
              {event.jam_mulai && (
                <span style={{color: T.textSoft}}>
                  · {event.jam_mulai}{event.jam_selesai ? ` – ${event.jam_selesai}` : ''} WIB
                </span>
              )}
            </div>
            <div className="flex items-center gap-2"><MapPin size={13}/>{event.lokasi}</div>
            <div className="flex items-center gap-2"><Users size={13}/>{event.peserta_count||0} terdaftar</div>
          </div>

          {(event.subsektor || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(event.subsektor || []).map(s => (
                <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{background: T.accentBg, border: `1px solid ${T.accentBorder}`, color: T.sageDeeper}}>
                  {s}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm leading-relaxed" style={{color: T.text2}}>{event.deskripsi}</p>
          {event.konten_lengkap && (
            <p className="text-sm leading-relaxed" style={{color: T.textMuted}}>{event.konten_lengkap}</p>
          )}

          {event.lineup?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{color: T.textMuted, letterSpacing:'.08em'}}>
                <Mic2 size={11}/> Akan Tampil
              </p>
              <div className="flex flex-wrap gap-2">
                {event.lineup.map(m => (
                  <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{background: T.exitBg, border: `1px solid ${T.exitBorder}`}}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{background: T.exit, color: T.white}}>{m.nama.charAt(0)}</div>
                    <span className="text-xs font-medium" style={{color: T.exit}}>{m.nama}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.artisan?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{color: T.textMuted, letterSpacing:'.08em'}}>
                <Store size={11}/> Artisan Peserta
              </p>
              <div className="flex flex-wrap gap-1.5">
                {event.artisan.map(u => (
                  <span key={u.id} className="px-2.5 py-1 rounded-full text-xs"
                    style={{background: T.successBg, border: `1px solid ${T.successBorder}`, color: T.success}}>
                    {u.nama_usaha}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 shrink-0" style={{borderTop: `1px solid ${T.border}`}}>
          {event.terdaftar ? (
            <span className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl"
              style={{background: T.successBg, border: `1px solid ${T.successBorder}`, color: T.success}}>
              <CheckCircle size={14} fill="currentColor"/>
              {event.peran ? `Diterima sebagai ${PERAN_LABEL[event.peran] || event.peran}` : 'Sudah Terdaftar'}
            </span>
          ) : event.request_status === 'pending' ? (
            <span className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl"
              style={{background: T.warningBg, border: `1px solid ${T.warningBorder}`, color: T.warning}}>
              <Clock size={14}/> Menunggu Persetujuan
            </span>
          ) : event.pending_request ? (
            <span className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl"
              style={{background: T.infoBg, border: `1px solid ${T.infoBorder}`, color: T.info}}>
              Menunggu Konfirmasi Admin
            </span>
          ) : event.status !== 'selesai' ? (
            <button onClick={() => onDaftar(event)} disabled={loadingId===event.id}
              className="w-full text-white py-2.5 text-sm font-semibold transition disabled:opacity-70 flex items-center justify-center gap-2"
              style={{background: T.sageDark, borderRadius:20}}>
              {loadingId===event.id
                ? <><Loader2 size={13} className="animate-spin"/>Mendaftar...</>
                : 'Daftar Sekarang'
              }
            </button>
          ) : (
            <p className="text-center text-sm" style={{color: T.textMuted}}>Event telah selesai</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── RoleRegisterModal ─────────────────────────────────────────────────────────
function RoleRegisterModal({ event, onClose, onConfirm, loading }) {
  const [peran, setPeran] = useState('peserta');
  const ROLES = [
    { value:'peserta',   label:'Peserta',    desc:'Hadir dan menikmati event sebagai pengunjung.' },
    { value:'performer', label:'Performer',  desc:'Tampil atau menampilkan karya. Admin akan konfirmasi.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{background:'rgba(13,13,13,0.55)'}}
      onClick={onClose}>
      <div className="rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl"
        style={{background: T.surface, border: `1px solid ${T.border}`}}
        onClick={e => e.stopPropagation()}>

        <div className="px-5 pt-5 pb-4" style={{borderBottom: `1px solid ${T.border}`}}>
          <h3 className="font-semibold text-sm" style={{color: T.text1}}>
            Daftar ke Event
          </h3>
          <p className="text-sm mt-0.5 line-clamp-1" style={{color: T.textMuted}}>{event.nama}</p>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{color: T.textMuted, letterSpacing:'.08em'}}>
            Saya ingin ikut sebagai:
          </p>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setPeran(r.value)}
              className="w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all"
              style={peran === r.value
                ? {border: `1.5px solid ${T.sageDark}`, background: T.accentBg}
                : {border: `1px solid ${T.border}`, background: T.surface}
              }>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{color: peran===r.value ? T.sageDeeper : T.text1}}>
                  {r.label}
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{color: T.textMuted}}>{r.desc}</p>
              </div>
              {peran === r.value && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{background: T.sageDark}}>
                  <CheckCircle size={12} fill="#fff" stroke="none"/>
                </div>
              )}
            </button>
          ))}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{border: `1px solid ${T.border}`, color: T.text2}}>
              Batal
            </button>
            <button onClick={() => onConfirm(event.id, peran)} disabled={loading}
              className="flex-1 text-white py-2.5 text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
              style={{background: T.sageDark, borderRadius:12}}>
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

// ── EventCard ─────────────────────────────────────────────────────────────────
const EventCard = ({ event, onDaftar, loadingId, onClick, showPeran }) => {
  const tgl = new Date(event.tanggal);
  const isLoading = loadingId === event.id;
  const ds  = dispStatus(event);
  const sts = STATUS_STYLE[ds];

  return (
    <div className="rounded-2xl cursor-pointer transition-shadow hover:shadow-md"
      style={{background: T.surface, border: event.terdaftar ? `1px solid ${T.accentBorder}` : `1px solid ${T.border}`,
              boxShadow: T.shadowSm}}
      onClick={onClick}>
      <div className="p-5 flex gap-4">
        {/* Date pill */}
        <div className="shrink-0 text-center w-14">
          <div className="rounded-xl py-2 px-1"
            style={{background: event.status==='selesai' ? T.border : T.sageDeeper}}>
            <p className="text-xl font-bold leading-none"
              style={{color: event.status==='selesai' ? T.textMuted : T.white}}>
              {tgl.getDate()}
            </p>
            <p className="text-[11px] font-medium mt-0.5 uppercase tracking-wide"
              style={{color: event.status==='selesai' ? T.textMuted : T.sageLight}}>
              {tgl.toLocaleDateString('id-ID',{month:'short'})}
            </p>
          </div>
          <p className="text-[10px] mt-1" style={{color: T.textMuted}}>{tgl.getFullYear()}</p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-sm leading-snug" style={{color: T.text1}}>
              {event.nama}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
              style={sts}>{EV_LABEL[ds]}</span>
          </div>
          <p className="text-xs flex items-center gap-1" style={{color: T.textMuted}}>
            <MapPin size={11}/>{event.lokasi}
          </p>
          <p className="text-xs mt-1.5 line-clamp-1" style={{color: T.textMuted}}>{event.deskripsi}</p>

          {showPeran && event.peran && (
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{background: T.exitBg, border: `1px solid ${T.exitBorder}`, color: T.exit}}>
                {PERAN_LABEL[event.peran]}
              </span>
            </div>
          )}

          {event.status !== 'selesai' && event.kapasitas && (
            <div className="mt-2">
              <div className="h-1 rounded-full overflow-hidden" style={{background: T.border}}>
                <div className="h-full rounded-full"
                  style={{width:`${Math.min(100,(event.peserta_count||0)/event.kapasitas*100)}%`,
                          background: T.accent}}/>
              </div>
            </div>
          )}

          <div className="mt-3" onClick={e => e.stopPropagation()}>
            {event.terdaftar ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{background: T.successBg, border: `1px solid ${T.successBorder}`, color: T.success}}>
                <CheckCircle size={11} fill="currentColor"/>
                {event.peran ? `Diterima sebagai ${PERAN_LABEL[event.peran] || event.peran}` : 'Sudah Terdaftar'}
              </span>
            ) : event.request_status === 'pending' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{background: T.warningBg, border: `1px solid ${T.warningBorder}`, color: T.warning}}>
                <Clock size={11}/> Menunggu Persetujuan
              </span>
            ) : event.pending_request ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{background: T.infoBg, border: `1px solid ${T.infoBorder}`, color: T.info}}>
                Menunggu Konfirmasi
              </span>
            ) : event.status !== 'selesai' ? (
              <button onClick={() => onDaftar(event)} disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-semibold transition disabled:opacity-70"
                style={{background: T.sageDark, borderRadius:20}}>
                {isLoading ? <Loader2 size={11} className="animate-spin"/> : null}
                {isLoading ? 'Mendaftar...' : 'Daftar Event'}
              </button>
            ) : (
              <span className="text-xs flex items-center gap-1" style={{color: T.textMuted}}>
                <Clock size={11}/> Event selesai
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Event() {
  const toast = useToast();
  const [list,          setList]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState('jelajahi');
  const [loadingId,     setLoadingId]     = useState(null);
  const [detailEvent,   setDetailEvent]   = useState(null);
  const [registerModal, setRegisterModal] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const items = await eventApi.list();
        setList(items || []);
      } catch (err) { toast.error(extractError(err, 'Gagal memuat daftar event')); }
      finally { setLoading(false); }
    })();
  }, [toast]);

  const daftar = async (eventId, peran = 'peserta') => {
    setLoadingId(eventId);
    try {
      await eventApi.requestJoin(eventId, peran);
      // Optimistically flip to the pending state so the card updates instantly;
      // the backend now also returns request_status so it survives a reload.
      setList(l => l.map(e => e.id===eventId ? {...e, request_status:'pending', peran} : e));
      toast.success(`Permintaan dikirim sebagai ${peran}. Menunggu konfirmasi admin.`);
      try {
        const user = getUser() || {};
        import('../lib/notifications').then(({ triggerKolaboratorEventRegister }) => {
          const ev = list.find(e => e.id === eventId);
          if (ev) triggerKolaboratorEventRegister(user.nama || 'Kolaborator', ev.nama);
        });
      } catch {}
    } catch (err) { toast.error(extractError(err, 'Gagal mengirim permintaan')); }
    finally { setLoadingId(null); }
  };

  const openRegister = event => setRegisterModal(event);

  // Use the backend-derived status_efektif so finished events leave the
  // browse/follow lists and land in "Selesai" (raw status is only draft|published).
  const effStatus = e => e.status_efektif || e.status;
  const jelajahi  = list.filter(e => ['published','berlangsung'].includes(effStatus(e)));
  const sayaIkuti = list.filter(e => (e.terdaftar || e.request_status === 'pending') && ['published','berlangsung'].includes(effStatus(e)));
  const selesai   = list.filter(e => effStatus(e)==='selesai' && e.terdaftar);
  const currentList = tab==='jelajahi' ? jelajahi : tab==='saya_ikuti' ? sayaIkuti : selesai;

  const tabStyle = active => active
    ? { background: T.surface, color: T.text1, boxShadow: T.shadowSm }
    : { background:'transparent', color: T.textMuted };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-xl font-medium" style={{color: T.text1}}>Event Budaya</h1>
        <p className="text-sm mt-0.5" style={{color: T.textMuted}}>
          {jelajahi.length} event tersedia · {sayaIkuti.length} saya ikuti
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl px-4 py-5 text-white"
          style={{background:`linear-gradient(135deg,${T.charcoal} 0%,${T.sageDeeper} 100%)`}}>
          <p className="text-xs font-medium mb-2" style={{color: T.sageLight}}>Event Tersedia</p>
          <p className="text-2xl font-bold">{jelajahi.length}</p>
        </div>
        <div className="rounded-2xl px-4 py-5"
          style={{background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadowSm}}>
          <p className="text-xs font-medium mb-2" style={{color: T.textMuted}}>Saya Terdaftar</p>
          <p className="text-2xl font-bold" style={{color: T.sageDeeper}}>{sayaIkuti.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{background: T.border}}>
        {[['jelajahi','Jelajahi'],['saya_ikuti','Saya Ikuti'],['selesai','Selesai']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition"
            style={tabStyle(tab===v)}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_,i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse" style={{background: T.border}}/>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="rounded-2xl p-10 text-center"
          style={{background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadowSm}}>
          <Calendar size={36} className="mx-auto mb-3" style={{color: T.textSoft}}/>
          <p className="text-sm" style={{color: T.textMuted}}>
            {tab==='jelajahi' ? 'Belum ada event tersedia'
              : tab==='saya_ikuti' ? 'Kamu belum terdaftar di event manapun'
              : 'Belum ada event selesai'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map(e => (
            <EventCard
              key={e.id} event={e}
              onDaftar={openRegister}
              loadingId={loadingId}
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
          onDaftar={e => { setDetailEvent(null); openRegister(e); }}
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
