// EventDetail.jsx — Detail Event + Kelola Kolaborator, artisans, dan Zona
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Image, Tag, FileText,
  Plus, Trash2, Search, X, Loader2, ChevronDown, ChevronUp, Phone, Mail,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import ZoneSelector from '../components/ZoneSelector';
import ZoneEditor from '../components/ZoneEditor';
import ProfileSideDrawer from '../components/ProfileSideDrawer';
import { getEventZones, syncOccupiedFromArtisans, syncPendingFromRequests } from '../lib/eventZones';
import { eventApi, kolaboratorApi, artisanApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';

const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '—';
const STATUS_CLS = {
  draft:'bg-[#f7f8f2] text-[#8a9070] border-[#e4e7d4]',
  published:'bg-[#eef0e0] text-[#7a8a52] border-[#c8d09a]',
  berlangsung:'bg-[#eaf0f4] text-[#6B8FA3] border-[#b0c8d8]',
  selesai:'bg-[#f7f2e4] text-[#C4A24D] border-[#dcc882]',
};
const HADIR_CLS = { terdaftar:'text-[#8a9070]', hadir:'text-[#7a8a52]', tidak_hadir:'text-[#B87272]' };

// ── Modals ────────────────────────────────────────────────────────────────────

function AssignKolaboratorModal({ onClose, onAssign, existingIds, allKolaborators }) {
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState(null);
  const [peran, setPeran] = useState('peserta');
  const [saving, setSaving] = useState(false);
  const list = (allKolaborators || []).filter(m => !existingIds.includes(m.id) &&
    m.nama.toLowerCase().includes(search.toLowerCase()));
  const save = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      await onAssign({ kolaborator_id: sel.id, peran });
      onClose();
    } catch {
      // error sudah di-toast oleh parent
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#e4e7d4]">
          <h3 className="font-bold text-[#1e2010]">Assign Kolaborator</h3>
          <button onClick={onClose}><X size={18} className="text-[#8a9070] hover:text-[#5a6040]"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9070]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari kolaborator..."
              className="w-full pl-8 pr-3 py-2 border border-[#e4e7d4] rounded-[12px] text-sm focus:outline-none focus:border-[#7a8a52]"/>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1.5">
            {list.length === 0
              ? <p className="text-[#8a9070] text-sm text-center py-3">Tidak ada tersedia</p>
              : list.map(m=>(
                <button key={m.id} onClick={()=>setSel(m)}
                  className={`w-full text-left px-3 py-2.5 rounded-[12px] border text-sm transition ${sel?.id===m.id?'border-[#7a8a52] bg-[#eef0e0]':'border-[#e4e7d4] hover:border-[#c8ccb0]'}`}>
                  <p className="font-semibold text-[#1e2010]">{m.nama}</p>
                  <p className="text-[#8a9070] text-xs">{(m.subsektor||[]).join(', ')}</p>
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            {['peserta','performer','panitia'].map(p=>(
              <button key={p} onClick={()=>setPeran(p)}
                className={`flex-1 py-2 rounded-[12px] text-xs font-semibold border capitalize transition ${peran===p?'bg-[#7a8a52] text-white border-[#4f5c30]':'border-[#e4e7d4] text-[#5a6040] hover:border-[#c8d09a]'}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-semibold hover:bg-[#f7f8f2] transition">Batal</button>
            <button onClick={save} disabled={!sel||saving}
              className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>} Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignArtisanModal({ onClose, onAssign, existingIds, zones, allartisanss }) {
  const [search, setSearch] = useState('');
  const [sel, setSel]       = useState(null);
  const [posisi, setPosisi] = useState('');
  const [useMap, setUseMap] = useState(true);
  const [saving, setSaving] = useState(false);
  const safeZones = Array.isArray(zones) ? zones : [];
  const list = (allartisanss || []).filter(t => !existingIds.includes(t.id) &&
    t.nama_usaha.toLowerCase().includes(search.toLowerCase()));
  const save = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      await onAssign({ artisan_id: sel.id, stand_id: posisi });
      onClose();
    } catch {
      // error sudah di-toast oleh parent
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl max-h-[88vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#e4e7d4] shrink-0">
          <h3 className="font-bold text-[#1e2010]">Assign Artisan ke Event</h3>
          <button onClick={onClose}><X size={18} className="text-[#8a9070] hover:text-[#5a6040]"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9070]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama usaha..."
              className="w-full pl-8 pr-3 py-2 border border-[#e4e7d4] rounded-[12px] text-sm focus:outline-none focus:border-[#7a8a52]"/>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5">
            {list.length === 0
              ? <p className="text-[#8a9070] text-sm text-center py-3">Tidak ada tersedia</p>
              : list.map(t=>(
                <button key={t.id} onClick={()=>setSel(t)}
                  className={`w-full text-left px-3 py-2.5 rounded-[12px] border text-sm transition ${sel?.id===t.id?'border-[#7a8a52] bg-[#eef0e0]':'border-[#e4e7d4] hover:border-[#c8ccb0]'}`}>
                  <p className="font-semibold text-[#1e2010]">{t.nama_usaha}</p>
                  <p className="text-[#8a9070] text-xs">{(t.kategori_usaha||[]).join(', ')}</p>
                </button>
              ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wide">Posisi Stand</label>
              <button onClick={()=>setUseMap(p=>!p)} className="text-xs text-[#7a8a52] hover:underline">
                {useMap ? 'Input manual' : 'Pilih dari peta'}
              </button>
            </div>
            {useMap
              ? <ZoneSelector value={posisi} onChange={setPosisi} zones={safeZones} compact/>
              : <input value={posisi} onChange={e=>setPosisi(e.target.value)} placeholder="cth: A-5"
                  className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]"/>
            }
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-[#e4e7d4] shrink-0">
          <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-semibold hover:bg-[#f7f8f2] transition">Batal</button>
          <button onClick={save} disabled={!sel||saving}
            className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>} Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// Stand picker modal — terima zones sebagai prop eksplisit
function StandPickerModal({ value, onClose, onConfirm, zones }) {
  const [local, setLocal] = useState(value || '');
  const safeZones = Array.isArray(zones) ? zones : [];
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e7d4] shrink-0">
          <p className="font-bold text-[#1e2010] text-sm">Pilih Stand</p>
          <button onClick={onClose}><X size={17} className="text-[#8a9070] hover:text-[#5a6040]"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          <ZoneSelector value={local} onChange={setLocal} zones={safeZones} compact/>
          <div className="pt-2 border-t border-[#e4e7d4]">
            <label className="text-xs font-semibold text-[#8a9070] mb-1.5 block">Atau ketik manual</label>
            <input value={local} onChange={e=>setLocal(e.target.value)} placeholder="A-5"
              className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]"/>
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-4 shrink-0">
          <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-semibold hover:bg-[#f7f8f2] transition">Batal</button>
          <button onClick={()=>{ onConfirm(local); onClose(); }}
            className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition">
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline stand editor button — terima zones sebagai prop
function StandEditor({ value, onChange, zones }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={()=>setOpen(true)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition whitespace-nowrap ${
          value ? 'border-[#c8d09a] bg-[#eef0e0] text-[#7a8a52] hover:bg-[#eef4eb]'
                : 'border-dashed border-[#c8ccb0] text-[#8a9070] hover:border-[#c8d09a] hover:text-[#7a8a52]'}`}>
        <span>📍</span>
        <span className="max-w-[80px] truncate">{value || 'Pilih stand'}</span>
      </button>
      {open && (
        <StandPickerModal
          value={value}
          onClose={()=>setOpen(false)}
          onConfirm={onChange}
          zones={zones}
        />
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EventDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [event,           setEvent]          = useState(null);
  const [kolaborators,    setKolaborators]    = useState([]);
  const [artisans,        setartisanss]        = useState([]);
  const [allKolaborators, setAllKolaborators] = useState([]);
  const [allartisanss,     setAllartisanss]     = useState([]);
  const [zones,           setZones]           = useState([]);
  const [artisanRequests,      setartisansRequests]      = useState([]);
  const [kolaboratorRequests,  setKolaboratorRequests]   = useState([]);
  const [tab,                  setTab]                   = useState('kolaborators');
  const [showAddM,        setShowAddM]        = useState(false);
  const [showAddT,        setShowAddT]        = useState(false);
  const [loading,         setLoading]         = useState(true);
  // Permintaan tab — inline expand state
  const [expandedReqId,   setExpandedReqId]   = useState(null);
  const [expandDetail,    setExpandDetail]     = useState({});  // { [reqId]: profileObj | 'loading' | 'error' }
  const detailCacheRef = useRef({});
  // Permintaan tab — slide-in profile drawer
  const [sideDrawer, setSideDrawer] = useState(null); // { profile, type, entityId } | null

  const refreshZones = (updatedartisanss, updatedRequests) => {
    try {
      let z = syncOccupiedFromArtisans(id, updatedartisanss.map(t => ({ posisi_event: t.stand_id || t.posisi_event })));
      if (updatedRequests) z = syncPendingFromRequests(id, updatedRequests);
      setZones(z);
    } catch {}
  };

  const loadRelations = async () => {
    try {
      const [kols, arts, reqs, kReqs] = await Promise.all([
        eventApi.kolaborators(id),
        eventApi.artisans(id),
        eventApi.artisanRequests(id),
        eventApi.kolaboratorRequests(id),
      ]);
      setKolaborators(kols || []);
      setartisanss(arts || []);
      setartisansRequests(reqs || []);
      setKolaboratorRequests(kReqs || []);
      refreshZones(arts || [], reqs || []);
    } catch (err) {
      toast.error(extractError(err, 'Gagal memuat data peserta'));
    }
  };

  // Initial load — paralel: event detail + relations + dropdown lists
  useEffect(() => {
    (async () => {
      try {
        const [ev, kols, arts, allKols, allArts, reqs, kReqs] = await Promise.all([
          eventApi.detail(id),
          eventApi.kolaborators(id),
          eventApi.artisans(id),
          kolaboratorApi.list(),
          artisanApi.list(),
          eventApi.artisanRequests(id),
          eventApi.kolaboratorRequests(id),
        ]);
        setEvent(ev || null);
        setKolaborators(kols || []);
        setartisanss(arts || []);
        setAllKolaborators(allKols || []);
        setAllartisanss(allArts || []);
        setartisansRequests(reqs || []);
        setKolaboratorRequests(kReqs || []);
        try {
          let z = syncOccupiedFromArtisans(id, (arts || []).map(t => ({ posisi_event: t.stand_id || t.posisi_event })));
          z = syncPendingFromRequests(id, reqs || []);
          setZones(z);
        } catch {
          setZones(getEventZones(id));
        }
      } catch (err) {
        toast.error(extractError(err, 'Gagal memuat detail event'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const assignKolaborator = async ({ kolaborator_id, peran }) => {
    try {
      await eventApi.assignKolaborator(id, { kolaborator_id, peran });
      toast.success('Kolaborator berhasil di-assign');
      await loadRelations();
      try {
        const k = allKolaborators.find(x => x.id === kolaborator_id);
        const { triggerEventAssignedToKolaborator } = await import('../lib/notifications');
        triggerEventAssignedToKolaborator(event?.nama || '', peran);
      } catch {}
    } catch (err) {
      toast.error(extractError(err, 'Gagal assign kolaborator'));
      throw err;
    }
  };

  // Pessimistic: state hanya berubah setelah server konfirmasi, lalu toast —
  // sehingga admin selalu tahu perubahan benar-benar tersimpan di DB.
  const updateKolaboratorField = async (emId, data) => {
    try {
      await eventApi.updateKolaborator(id, emId, data);
      setKolaborators(l => l.map(x => x.id === emId ? { ...x, ...data } : x));
      toast.success('Perubahan kolaborator tersimpan');
    } catch (err) {
      toast.error(extractError(err, 'Gagal memperbarui kolaborator'));
      await loadRelations();
    }
  };

  const removeKolaborator = async (emId) => {
    if (!confirm('Hapus dari event ini?')) return;
    try {
      await eventApi.removeKolaborator(id, emId);
      toast.success('Kolaborator dihapus');
      await loadRelations();
    } catch (err) {
      toast.error(extractError(err, 'Gagal menghapus kolaborator'));
    }
  };

  const assignartisans = async ({ artisan_id, stand_id }) => {
    try {
      await eventApi.assignArtisan(id, { artisan_id, stand_id });
      toast.success('Artisan berhasil di-assign');
      await loadRelations();
      try {
        const { triggerArtisanEventAssigned } = await import('../lib/notifications');
        triggerArtisanEventAssigned(event?.nama || '', stand_id || '—');
      } catch {}
    } catch (err) {
      toast.error(extractError(err, 'Gagal assign artisan'));
      throw err;
    }
  };

  const respondRequest = async (rid, action, standId) => {
    try {
      await eventApi.respondArtisanRequest(id, rid, { action, stand_id: standId });
      toast.success(action === 'approve' ? 'Permintaan disetujui' : 'Permintaan ditolak');
      await loadRelations();
    } catch (err) {
      toast.error(extractError(err, 'Gagal merespons permintaan'));
    }
  };

  const respondPositionChange = async (rid, action) => {
    try {
      await eventApi.respondPositionChange(id, rid, { action });
      toast.success(action === 'approve' ? 'Perubahan posisi disetujui' : 'Perubahan posisi ditolak');
      await loadRelations();
    } catch (err) {
      toast.error(extractError(err, 'Gagal merespons perubahan posisi'));
    }
  };

  // Backend route /events/:id/artisan/:aid mem-filter kolom artisan_id —
  // jadi yang dikirim HARUS t.artisan_id, bukan id baris junction (t.id).
  const removeartisans = async (t) => {
    if (!confirm('Hapus dari event ini?')) return;
    try {
      await eventApi.removeArtisan(id, t.artisan_id);
      toast.success('Artisan dihapus');
      await loadRelations();
    } catch (err) {
      toast.error(extractError(err, 'Gagal menghapus artisan'));
    }
  };

  // Pessimistic + kirim artisan_id (BE filter kolom artisan_id, bukan id junction).
  // stand_id = kolom kanonik; posisi_event hanya alias tampilan — tulis keduanya.
  const updateartisansStand = async (row, val) => {
    try {
      await eventApi.updateArtisan(id, row.artisan_id, { stand_id: val, posisi_event: val });
      const updated = artisans.map(t => t.id === row.id ? { ...t, stand_id: val, posisi_event: val } : t);
      setartisanss(updated);
      refreshZones(updated);
      toast.success('Posisi stand tersimpan');
    } catch (err) {
      toast.error(extractError(err, 'Gagal memperbarui posisi stand'));
      await loadRelations();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#7a8a52]"/>
    </div>
  );
  if (!event) return (
    <div className="text-center py-20 text-[#8a9070]">
      <p>Event tidak ditemukan.</p>
      <button onClick={()=>navigate('/events')} className="mt-3 text-[#7a8a52] hover:underline text-sm">← Kembali</button>
    </div>
  );

  const pct = Math.min(100, Math.round(kolaborators.length / (event.kapasitas||1) * 100));

  return (
    <div className="space-y-5">
      {/* Tombol kembali */}
      <button onClick={()=>navigate('/events')}
        className="flex items-center gap-2 text-[#8a9070] hover:text-[#1e2010] text-sm transition">
        <ArrowLeft size={15}/> Kembali ke Daftar Event
      </button>

      <div className="grid lg:grid-cols-5 gap-5 items-start">

        {/* ── Kolom kiri: Info ── */}
        <div className="lg:col-span-2 space-y-4">
          {event.banner_url
            ? <img src={event.banner_url} alt="banner" className="w-full h-40 object-cover rounded-[16px]"/>
            : <div className="w-full h-40 bg-gradient-to-br from-green-100 to-green-200 rounded-[16px] flex items-center justify-center">
                <Image size={36} className="text-[#a8b07a]"/>
              </div>
          }

          <div className="bg-white rounded-[16px] p-5 border border-[#e4e7d4] space-y-3">
            <div className="flex items-start gap-3 justify-between">
              <h1 className="font-bold text-[#1e2010] text-lg leading-snug">{event.nama}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${STATUS_CLS[event.status]||STATUS_CLS.draft}`}>
                {event.status}
              </span>
            </div>
            <div className="space-y-1.5 text-sm text-[#8a9070]">
              <div className="flex items-center gap-2">
                <Calendar size={13}/>
                {fmtDate(event.tanggal)}
                {event.tanggal_selesai && event.tanggal_selesai!==event.tanggal && ` — ${fmtDate(event.tanggal_selesai)}`}
                {event.jam_mulai && <span className="ml-1">· {event.jam_mulai.replace(':','.')}{event.jam_selesai?` – ${event.jam_selesai.replace(':','.')}`:''} WIB</span>}
              </div>
              <div className="flex items-center gap-2"><MapPin size={13}/>{event.lokasi}</div>
              <div className="flex items-center gap-2"><Users size={13}/>{kolaborators.length} / {event.kapasitas} peserta</div>
            </div>
            <div>
              <div className="h-1.5 bg-[#eef0e0] rounded-full overflow-hidden">
                <div className="h-full bg-[#7a8a52] rounded-full" style={{width:`${pct}%`}}/>
              </div>
              <p className="text-xs text-[#8a9070] mt-1">{pct}% kapasitas</p>
            </div>
          </div>

          <div className="bg-white rounded-[16px] p-5 border border-[#e4e7d4]">
            <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={12}/> Deskripsi
            </p>
            <p className="text-[#5a6040] text-sm leading-relaxed">{event.deskripsi}</p>
            {event.konten_lengkap && event.konten_lengkap !== event.deskripsi && (
              <p className="text-[#8a9070] text-sm leading-relaxed mt-2">{event.konten_lengkap}</p>
            )}
          </div>

          {(event.subsektor || []).length > 0 && (
            <div className="bg-white rounded-[16px] p-5 border border-[#e4e7d4]">
              <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag size={12}/> Subsektor Budaya
              </p>
              <div className="flex flex-wrap gap-2">
                {(event.subsektor || []).map(s=>(
                  <span key={s} className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              ['Kapasitas', event.kapasitas,  'text-[#5a6040]'],
              ['Terdaftar', kolaborators.length,   'text-[#7a8a52]'],
              ['Hadir',     kolaborators.filter(m=>m.status_kehadiran==='hadir').length, 'text-[#6B8FA3]'],
            ].map(([l,v,c])=>(
              <div key={l} className="bg-white border border-[#e4e7d4] rounded-[16px] p-3 text-center">
                <p className={`text-xl font-bold ${c}`}>{v}</p>
                <p className="text-[#8a9070] text-[11px] mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Kolom kanan: Tabs ── */}
        <div className="lg:col-span-3 bg-white rounded-[16px] border border-[#e4e7d4] overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-[#e4e7d4]">
            {[
              { v:'kolaborators', l:'Kolaborator', n:kolaborators.length },
              { v:'artisan',       l:'Artisan',     n:artisans.length },
              { v:'zones',        l:'Kelola Zona',  n:zones.length },
              { v:'permintaan',   l:'Permintaan',   n:artisanRequests.filter(r=>r.status_request==='pending'||r.status_request==='pending_change').length + kolaboratorRequests.filter(r=>r.status==='pending').length },
            ].map(({ v, l, n }) => (
              <button key={v} onClick={()=>setTab(v)}
                className={`flex-1 py-3.5 text-sm font-semibold transition border-b-2 ${tab===v ? 'border-[#7a8a52] text-[#7a8a52] bg-[#eef0e0]/50' : 'border-transparent text-[#8a9070] hover:text-[#5a6040]'}`}>
                {l}
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#eef0e0] text-[#8a9070]">{n}</span>
              </button>
            ))}
          </div>

          {/* ── Tab: Kolaborator ── */}
          {tab === 'kolaborators' && (
            <div>
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                <p className="text-sm text-[#8a9070]">{kolaborators.length} kolaborator</p>
                <button onClick={()=>setShowAddM(true)}
                  className="flex items-center gap-1.5 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-3.5 py-2 rounded-[12px] text-xs font-semibold transition">
                  <Plus size={13}/> Assign
                </button>
              </div>
              {kolaborators.length === 0
                ? <div className="py-16 text-center text-[#8a9070] text-sm">
                    <Users size={32} className="text-gray-200 mx-auto mb-3"/>Belum ada kolaborator
                  </div>
                : <div className="divide-y divide-gray-50">
                    {kolaborators.map(m=>(
                      <div key={m.id} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-[#f7f8f2]/60 transition">
                        <div className="w-9 h-9 rounded-[12px] bg-[#f7f2e4] flex items-center justify-center text-[#C4A24D] font-bold text-sm shrink-0">
                          {(m.nama||'?').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1e2010] text-sm">{m.nama}</p>
                          <p className="text-[#8a9070] text-[10px]">{m.assigned_by==='admin'?'Oleh Admin':'Mandiri'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select value={m.peran}
                            onChange={e=>updateKolaboratorField(m.id, { peran: e.target.value })}
                            className="text-xs border border-[#e4e7d4] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#7a8a52] bg-white text-[#5a6040]">
                            <option value="peserta">Peserta</option>
                            <option value="performer">Performer</option>
                            <option value="panitia">Panitia</option>
                          </select>
                          <select value={m.status_kehadiran}
                            onChange={e=>updateKolaboratorField(m.id, { status_kehadiran: e.target.value })}
                            className={`text-xs border border-[#e4e7d4] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#7a8a52] bg-white ${HADIR_CLS[m.status_kehadiran]||''}`}>
                            <option value="terdaftar">Terdaftar</option>
                            <option value="hadir">Hadir</option>
                            <option value="tidak_hadir">Tidak Hadir</option>
                          </select>
                          <button onClick={()=>removeKolaborator(m.id)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-[#B87272] hover:bg-[#f7eeee] transition opacity-0 group-hover:opacity-100">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* ── Tab: Artisan ── */}
          {tab === 'artisan' && (
            <div>
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                <p className="text-sm text-[#8a9070]">{artisans.length} Artisan</p>
                <button onClick={()=>setShowAddT(true)}
                  className="flex items-center gap-1.5 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-3.5 py-2 rounded-[12px] text-xs font-semibold transition">
                  <Plus size={13}/> Assign Artisan
                </button>
              </div>
              {artisans.length === 0
                ? <div className="py-16 text-center text-[#8a9070] text-sm">
                    <Plus size={32} className="text-gray-200 mx-auto mb-3"/>Belum ada Artisan
                  </div>
                : <div className="divide-y divide-gray-50">
                    {artisans.map(t=>(
                      <div key={t.id} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-[#f7f8f2]/60 transition">
                        <div className="w-9 h-9 rounded-[12px] bg-[#eef4eb] flex items-center justify-center text-[#7a8a52] font-bold text-sm shrink-0">
                          {(t.nama_usaha||'?').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1e2010] text-sm">{t.nama_usaha}</p>
                          <span className="px-1.5 py-0.5 bg-[#eef0e0] text-[#7a8a52] text-[10px] rounded font-medium">{(t.kategori_usaha||[]).join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StandEditor
                            value={t.stand_id || t.posisi_event}
                            onChange={val=>updateartisansStand(t, val)}
                            zones={zones}
                          />
                          <button onClick={()=>removeartisans(t)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-[#B87272] hover:bg-[#f7eeee] transition opacity-0 group-hover:opacity-100">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* ── Tab: Kelola Zona ── */}
          {tab === 'zones' && (
            <div className="p-5">
              <ZoneEditor
                zones={zones}
                onZonesChange={() => {
                  try { setZones(getEventZones(id)); } catch {}
                }}
              />
            </div>
          )}

          {/* ── Tab: Permintaan ── */}
          {tab === 'permintaan' && (() => {
            const activeArtisan = artisanRequests.filter(r=>r.status_request==='pending'||r.status_request==='pending_change');
            const activeKolab   = kolaboratorRequests.filter(r=>r.status==='pending');
            const totalActive   = activeArtisan.length + activeKolab.length;
            const noRequests    = artisanRequests.length === 0 && kolaboratorRequests.length === 0;

            const respondKolaborator = async (rid, action) => {
              try {
                await eventApi.respondKolaboratorRequest(id, rid, { action });
                toast.success(action === 'approve' ? 'Permintaan kolaborator disetujui' : 'Permintaan kolaborator ditolak');
                await loadRelations();
              } catch (err) {
                toast.error(extractError(err, 'Gagal merespons permintaan kolaborator'));
              }
            };

            // Inline expand toggle — lazy fetch profile detail + event count
            const toggleExpand = async (reqId, entityId, type) => {
              if (expandedReqId === reqId) { setExpandedReqId(null); return; }
              setExpandedReqId(reqId);
              if (detailCacheRef.current[reqId]) return; // already cached
              setExpandDetail(prev => ({ ...prev, [reqId]: 'loading' }));
              try {
                const api  = type === 'artisan' ? artisanApi : kolaboratorApi;
                const [profile, evList] = await Promise.allSettled([
                  api.detail(entityId),
                  api.events(entityId),
                ]);
                const prof   = profile.status === 'fulfilled' ? profile.value : {};
                const events = evList.status === 'fulfilled' ? (evList.value || []) : [];
                const result = { ...prof, _events: events, _eventCount: events.length };
                detailCacheRef.current[reqId] = result;
                setExpandDetail(prev => ({ ...prev, [reqId]: result }));
              } catch {
                setExpandDetail(prev => ({ ...prev, [reqId]: 'error' }));
              }
            };

            const ExpandPanel = ({ reqId, entityId, type, onViewFull }) => {
              const detail = expandDetail[reqId] ?? detailCacheRef.current[reqId];
              if (!detail) return null;
              if (detail === 'loading') return (
                <div className="pl-12 pb-3 flex items-center gap-2 text-[#8a9070] text-xs">
                  <Loader2 size={13} className="animate-spin"/> Memuat profil...
                </div>
              );
              if (detail === 'error') return (
                <div className="pl-12 pb-3 text-xs text-[#B87272]">Gagal memuat profil.</div>
              );
              const bio    = detail.deskripsi || detail.bio || '';
              const hp     = detail.no_hp || '';
              const em     = detail.email || '';
              const cnt    = detail._eventCount ?? 0;
              const evList = Array.isArray(detail._events) ? detail._events : [];
              const sorted = [...evList].sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
              return (
                <div className="pl-12 pb-4 space-y-2">
                  {bio && (
                    <p className="text-xs text-[#5a6040] leading-relaxed line-clamp-3">{bio}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {hp && (
                      <span className="flex items-center gap-1 text-xs text-[#8a9070]">
                        <Phone size={11}/> {hp}
                      </span>
                    )}
                    {em && (
                      <span className="flex items-center gap-1 text-xs text-[#8a9070]">
                        <Mail size={11}/> {em}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-[#8a9070]">
                      <Calendar size={11}/>
                      {cnt > 0 ? `${cnt} event diikuti` : 'Belum ada riwayat event'}
                    </span>
                  </div>
                  {evList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {sorted.slice(0, 3).map((ev, i) => (
                        <span key={ev.id || i}
                          className="px-2 py-0.5 bg-[#eef0e0] text-[#5a6040] border border-[#c8d09a] rounded-full text-[10px] font-medium">
                          {ev.nama || 'Event'} · {new Date(ev.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      ))}
                      {evList.length > 3 && (
                        <span className="text-[10px] text-[#8a9070] self-center">
                          +{evList.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  )}
                  <div className="pt-1">
                    <button
                      onClick={e => { e.stopPropagation(); onViewFull(detail, entityId); }}
                      className="text-xs text-[#7a8a52] hover:text-[#4f5c30] underline underline-offset-2 font-medium">
                      Lihat profil lengkap →
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <div>
                <div className="px-5 py-4 border-b border-gray-50">
                  <p className="text-sm text-[#8a9070]">{totalActive} permintaan aktif</p>
                </div>
                {noRequests
                  ? <div className="py-16 text-center text-[#8a9070] text-sm">
                      <Clock size={32} className="text-gray-200 mx-auto mb-3"/>Tidak ada permintaan
                    </div>
                  : <div className="divide-y divide-gray-50">

                      {/* Artisan requests */}
                      {artisanRequests.map(req => {
                        const isPending       = req.status_request === 'pending';
                        const isPendingChange = req.status_request === 'pending_change';
                        const isRejected      = req.status_request === 'rejected';
                        const isActive        = isPending || isPendingChange;
                        const isExpanded      = expandedReqId === req.id;
                        return (
                          <div key={req.id} className="py-1">
                            <div
                              className="px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-[#f7f8f2]/60 transition"
                              onClick={() => toggleExpand(req.id, req.artisan_id, 'artisan')}>
                              <div className="w-9 h-9 rounded-[12px] bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                                {(req.nama_usaha||'?').charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-[#1e2010] text-sm">{req.nama_usaha}</p>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">Artisan</span>
                                </div>
                                <p className="text-[#8a9070] text-[10px] mt-0.5">Kategori Usaha: {(req.kategori_usaha||[]).join(', ') || '—'}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                                isPending       ? 'bg-[#fef9c3] text-[#854d0e] border-yellow-200' :
                                isPendingChange ? 'bg-[#eff6ff] text-[#1d4ed8] border-blue-200'   :
                                isRejected      ? 'bg-[#fee2e2] text-[#991b1b] border-red-200'     :
                                'bg-[#f0fdf4] text-[#166534] border-green-200'
                              }`}>
                                {isPending ? 'Pending' : isPendingChange ? 'Ubah Posisi' : isRejected ? 'Ditolak' : 'Disetujui'}
                              </span>
                              <span className="text-[#8a9070] shrink-0 mt-0.5">
                                {isExpanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#8a9070] px-5 pb-1 pl-[68px]">
                              <span>Posisi: <strong className="text-[#5a6040]">{req.posisi_event||'—'}</strong></span>
                              {isPendingChange && <span>→ <strong className="text-[#1d4ed8]">{req.change_request}</strong></span>}
                              <span>{fmtDate(req.created_at)}</span>
                            </div>
                            {isExpanded && <ExpandPanel reqId={req.id} entityId={req.artisan_id} type="artisan" onViewFull={(profile, entityId) => setSideDrawer({ profile, type: 'artisan', entityId })}/>}
                            {isActive && (
                              <div className="flex gap-2 px-5 pb-3 pl-[68px]" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => isPendingChange
                                    ? respondPositionChange(req.id, 'approve')
                                    : respondRequest(req.id, 'approve', req.posisi_event)}
                                  className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-3 py-1.5 rounded-[10px] text-xs font-semibold transition">
                                  Setujui
                                </button>
                                <button
                                  onClick={() => isPendingChange
                                    ? respondPositionChange(req.id, 'reject')
                                    : respondRequest(req.id, 'reject')}
                                  className="flex-1 border border-[#e4e7d4] text-[#8a9070] hover:text-[#B87272] hover:border-[#f5c6c6] px-3 py-1.5 rounded-[10px] text-xs font-semibold transition">
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Kolaborator requests */}
                      {kolaboratorRequests.map(req => {
                        const isPending  = req.status === 'pending';
                        const isRejected = req.status === 'rejected';
                        const isExpanded = expandedReqId === req.id;
                        return (
                          <div key={req.id} className="py-1">
                            <div
                              className="px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-[#f7f8f2]/60 transition"
                              onClick={() => toggleExpand(req.id, req.kolaborator_id, 'kolaborator')}>
                              <div className="w-9 h-9 rounded-[12px] bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                {(req.nama||'?').charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-[#1e2010] text-sm">{req.nama}</p>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Kolaborator</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#eef0e0] text-[#7a8a52] border border-[#c8d09a] capitalize">{req.peran}</span>
                                </div>
                                <p className="text-[#8a9070] text-[10px] mt-0.5">Subsektor: {(req.subsektor||[]).join(', ') || '—'}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                                isPending  ? 'bg-[#fef9c3] text-[#854d0e] border-yellow-200' :
                                isRejected ? 'bg-[#fee2e2] text-[#991b1b] border-red-200'    :
                                'bg-[#f0fdf4] text-[#166534] border-green-200'
                              }`}>
                                {isPending ? 'Pending' : isRejected ? 'Ditolak' : 'Disetujui'}
                              </span>
                              <span className="text-[#8a9070] shrink-0 mt-0.5">
                                {isExpanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#8a9070] px-5 pb-1 pl-[68px]">
                              <span>{fmtDate(req.created_at)}</span>
                            </div>
                            {isExpanded && <ExpandPanel reqId={req.id} entityId={req.kolaborator_id} type="kolaborator" onViewFull={(profile, entityId) => setSideDrawer({ profile, type: 'kolaborator', entityId })}/>}
                            {isPending && (
                              <div className="flex gap-2 px-5 pb-3 pl-[68px]" onClick={e => e.stopPropagation()}>
                                <button onClick={() => respondKolaborator(req.id, 'approve')}
                                  className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-3 py-1.5 rounded-[10px] text-xs font-semibold transition">
                                  Setujui
                                </button>
                                <button onClick={() => respondKolaborator(req.id, 'reject')}
                                  className="flex-1 border border-[#e4e7d4] text-[#8a9070] hover:text-[#B87272] hover:border-[#f5c6c6] px-3 py-1.5 rounded-[10px] text-xs font-semibold transition">
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                }
              </div>
            );
          })()}

        </div>{/* end col-span-3 */}
      </div>{/* end grid */}

      {/* Modals */}
      {showAddM && (
        <AssignKolaboratorModal
          onClose={()=>setShowAddM(false)}
          onAssign={assignKolaborator}
          existingIds={kolaborators.map(m=>m.kolaborator_id)}
          allKolaborators={allKolaborators}
        />
      )}
      {showAddT && (
        <AssignArtisanModal
          onClose={()=>setShowAddT(false)}
          onAssign={assignartisans}
          existingIds={artisans.map(t=>t.artisan_id)}
          zones={zones}
          allartisanss={allartisanss}
        />
      )}

      {/* Profile Slide-in Drawer — tetap di halaman event, tidak navigasi */}
      <ProfileSideDrawer
        open={!!sideDrawer}
        onClose={() => setSideDrawer(null)}
        profile={sideDrawer?.profile}
        type={sideDrawer?.type}
        entityId={sideDrawer?.entityId}
      />
    </div>
  );
}
