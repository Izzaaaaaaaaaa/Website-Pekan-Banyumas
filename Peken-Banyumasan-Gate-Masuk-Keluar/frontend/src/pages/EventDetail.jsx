// EventDetail.jsx — Detail Event + Kelola Kolaborator, Artisan, dan Zona
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, MapPin, Users, Image, Tag, FileText,
  Plus, Trash2, Search, X, Loader2,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import ZoneSelector from '../components/ZoneSelector';
import ZoneEditor from '../components/ZoneEditor';
import { getEventZones, syncOccupiedFromArtisans } from '../lib/eventZones';

// ── DUMMY DATA ────────────────────────────────────────────────────────────────
const DUMMY_EVENTS = {
  e1: {
    id:'e1', nama:'Festival Budaya Banyumasan 2025',
    tanggal:'2025-05-17', jam_mulai:'08:00', jam_selesai:'22:00', tanggal_selesai:'2025-05-19',
    lokasi:'Alun-Alun Purwokerto', status:'published', kapasitas:200, peserta_count:34,
    deskripsi:'Festival tahunan menampilkan seni, kuliner, dan kerajinan khas Banyumas.',
    konten_lengkap:'Festival Budaya Banyumasan mempertemukan seniman, pengrajin, dan pelaku kuliner dari seluruh eks-Karesidenan Banyumas.',
    banner_url:null, galeri:[], subsektor:['Kriya','Musik','Seni Pertunjukan','Kuliner'],
  },
  e2: {
    id:'e2', nama:'Workshop Batik & Tenun Nusantara',
    tanggal:'2025-04-26', jam_mulai:'09:00', jam_selesai:'17:00', tanggal_selesai:'2025-04-27',
    lokasi:'Gedung Kebudayaan Cilacap', status:'published', kapasitas:30, peserta_count:18,
    deskripsi:'Pelatihan intensif 2 hari teknik batik tulis dan tenun lurik.',
    konten_lengkap:'Workshop intensif dibimbing maestro batik dari Banyumas.',
    banner_url:null, galeri:[], subsektor:['Kriya','Fashion'],
  },
  e3: {
    id:'e3', nama:'Pameran Kriya Ekraf Regional',
    tanggal:'2025-06-10', jam_mulai:'10:00', jam_selesai:'21:00', tanggal_selesai:'2025-06-12',
    lokasi:'Mall Cilacap Raya', status:'draft', kapasitas:500, peserta_count:0,
    deskripsi:'Pameran dan bazaar produk ekonomi kreatif se-eks Karesidenan Banyumas.',
    konten_lengkap:'Pameran terbesar menampilkan lebih dari 100 produk unggulan.',
    banner_url:null, galeri:[], subsektor:['Kriya','Desain Produk','Fashion'],
  },
  e4: {
    id:'e4', nama:'Peken Banyumasan #12',
    tanggal:'2025-03-20', jam_mulai:'16:00', jam_selesai:'22:00', tanggal_selesai:'2025-03-20',
    lokasi:'Amphitheater GOR Satria', status:'selesai', kapasitas:500, peserta_count:145,
    deskripsi:'Pasar budaya mingguan dengan penampilan seniman lokal.',
    konten_lengkap:'Peken Banyumasan edisi ke-12 sukses digelar.',
    banner_url:null, galeri:[], subsektor:['Musik','Kuliner','Seni Pertunjukan'],
  },
};

const DUMMY_KOLABORATOR_ALL = [
  { id:'m1', nama:'Sari Dewi Rahayu',  subsektor:['Kriya','Fashion'] },
  { id:'m2', nama:'Ahmad Fauzi',        subsektor:['Musik'] },
  { id:'m4', nama:'Nurul Hidayah',      subsektor:['Kuliner'] },
  { id:'m7', nama:'Budi Santoso',       subsektor:['Film & Animasi'] },
];
const DUMMY_ARTISAN_ALL = [
  { id:'t1', nama_usaha:'Batik Sari Rahayu',  kategori:'Kriya & Fashion' },
  { id:'t2', nama_usaha:'Calung Mas',          kategori:'Seni Pertunjukan' },
  { id:'t4', nama_usaha:'Tenun Lurik Cilacap', kategori:'Kriya & Fashion' },
  { id:'t5', nama_usaha:'Keripik Tempe Mrisi', kategori:'Kuliner' },
];
const DUMMY_KOLABORATOR_EVENT = {
  e1: [
    { id:'em1', kolaborator_id:'m1', nama:'Sari Dewi Rahayu', subsektor:['Kriya'], peran:'performer', status_kehadiran:'terdaftar', assigned_by:'admin' },
    { id:'em2', kolaborator_id:'m2', nama:'Ahmad Fauzi',       subsektor:['Musik'], peran:'performer', status_kehadiran:'terdaftar', assigned_by:'self'  },
  ],
  e2: [{ id:'em4', kolaborator_id:'m1', nama:'Sari Dewi Rahayu', subsektor:['Kriya'], peran:'panitia', status_kehadiran:'hadir', assigned_by:'admin' }],
  e3: [], e4: [],
};
const DUMMY_ARTISAN_EVENT = {
  e1: [
    { id:'et1', artisan_id:'t1', nama_usaha:'Batik Sari Rahayu',  kategori:'Kriya & Fashion', posisi_event:'A-3', assigned_by:'admin' },
    { id:'et2', artisan_id:'t5', nama_usaha:'Keripik Tempe Mrisi', kategori:'Kuliner',         posisi_event:'B-1', assigned_by:'self'  },
  ],
  e2: [],
  e3: [{ id:'et3', artisan_id:'t4', nama_usaha:'Tenun Lurik Cilacap', kategori:'Kriya & Fashion', posisi_event:'A-1', assigned_by:'admin' }],
  e4: [{ id:'et4', artisan_id:'t1', nama_usaha:'Batik Sari Rahayu', kategori:'Kriya & Fashion', posisi_event:'A-2', assigned_by:'admin' }],
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '—';
const STATUS_CLS = {
  draft:'bg-[#f7f8f2] text-[#8a9070] border-[#e4e7d4]',
  published:'bg-[#eef0e0] text-[#7a8a52] border-[#c8d09a]',
  berlangsung:'bg-[#eaf0f4] text-[#6B8FA3] border-[#b0c8d8]',
  selesai:'bg-[#f7f2e4] text-[#C4A24D] border-[#dcc882]',
};
const HADIR_CLS = { terdaftar:'text-[#8a9070]', hadir:'text-[#7a8a52]', tidak_hadir:'text-[#B87272]' };

// ── Modals — semua terima `zones` sebagai prop, tidak akses closure luar ──────

function AssignKolaboratorModal({ onClose, onAssign, existingIds }) {
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState(null);
  const [peran, setPeran] = useState('peserta');
  const [saving, setSaving] = useState(false);
  const list = DUMMY_KOLABORATOR_ALL.filter(m => !existingIds.includes(m.id) &&
    m.nama.toLowerCase().includes(search.toLowerCase()));
  const save = async () => {
    if (!sel) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    onAssign({ ...sel, peran, status_kehadiran:'terdaftar', assigned_by:'admin', id:'em'+Date.now() });
    setSaving(false); onClose();
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
                  <p className="text-[#8a9070] text-xs">{m.subsektor.join(', ')}</p>
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

function AssignArtisanModal({ onClose, onAssign, existingIds, zones }) {
  const [search, setSearch] = useState('');
  const [sel, setSel]       = useState(null);
  const [posisi, setPosisi] = useState('');
  const [useMap, setUseMap] = useState(true);
  const [saving, setSaving] = useState(false);
  const safeZones = Array.isArray(zones) ? zones : [];
  const list = DUMMY_ARTISAN_ALL.filter(t => !existingIds.includes(t.id) &&
    t.nama_usaha.toLowerCase().includes(search.toLowerCase()));
  const save = async () => {
    if (!sel) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    onAssign({ ...sel, posisi_event: posisi, assigned_by:'admin', id:'et'+Date.now() });
    setSaving(false); onClose();
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
                  <p className="text-[#8a9070] text-xs">{t.kategori}</p>
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

  const [event,    setEvent]    = useState(null);
  const [kolaborators,  setKolaborators]  = useState([]);
  const [Artisan,  setArtisans]  = useState([]);
  const [zones,    setZones]    = useState([]);
  const [tab,      setTab]      = useState('kolaborators');
  const [showAddM, setShowAddM] = useState(false);
  const [showAddT, setShowAddT] = useState(false);
  const [loading,  setLoading]  = useState(true);

  // Load data and zones
  useEffect(() => {
    const t = setTimeout(() => {
      const ev = DUMMY_EVENTS[id] || null;
      const ms = DUMMY_KOLABORATOR_EVENT[id] || [];
      const ts = DUMMY_ARTISAN_EVENT[id]  || [];
      setEvent(ev);
      setKolaborators(ms);
      setArtisans(ts);
      // Load global zones merged with this event's occupied state
      try {
        const z = syncOccupiedFromArtisans(id, ts.map(t => ({ posisi_event: t.posisi_event })));
        setZones(z);
      } catch {
        setZones(getEventZones(id));
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [id]);

  // Re-sync zones when Artisan change
  const refreshZones = (updatedArtisans) => {
    try {
      const z = syncOccupiedFromArtisans(id, updatedArtisans.map(t => ({ posisi_event: t.posisi_event })));
      setZones(z);
    } catch {}
  };

  const assignKolaborator = async (data) => {
    const updated = [...kolaborators, { ...data, kolaborator_id: data.id }];
    setKolaborators(updated);
    toast.success(`${data.nama} di-assign sebagai ${data.peran}`);
    try {
      const { triggerEventAssignedToKolaborator } = await import('../lib/notifications');
      triggerEventAssignedToKolaborator(event.nama, data.peran);
    } catch {}
  };

  const removeKolaborator = (emId) => {
    if (!confirm('Hapus dari event ini?')) return;
    setKolaborators(l => l.filter(m => m.id !== emId));
    toast.success('Kolaborator dihapus');
  };

  const assignArtisan = async (data) => {
    const updated = [...Artisan, { ...data, artisan_id: data.id }];
    setArtisans(updated);
    refreshZones(updated);
    toast.success(`${data.nama_usaha} berhasil di-assign`);
    try {
      const { triggerArtisanEventAssigned } = await import('../lib/notifications');
      triggerArtisanEventAssigned(event.nama, data.posisi_event || '—');
    } catch {}
  };

  const removeArtisan = (etId) => {
    if (!confirm('Hapus dari event ini?')) return;
    const updated = Artisan.filter(t => t.id !== etId);
    setArtisans(updated);
    refreshZones(updated);
    toast.success('Artisan dihapus');
  };

  const updateArtisanStand = (etId, val) => {
    const updated = Artisan.map(t => t.id === etId ? { ...t, posisi_event: val } : t);
    setArtisans(updated);
    refreshZones(updated);
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

          {event.subsektor?.length > 0 && (
            <div className="bg-white rounded-[16px] p-5 border border-[#e4e7d4]">
              <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag size={12}/> Subsektor
              </p>
              <div className="flex flex-wrap gap-2">
                {event.subsektor.map(s=>(
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
              { v:'Artisan', l:'Artisan',            n:Artisan.length },
              { v:'zones',   l:'Kelola Zona',     n:zones.length   },
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
                          {m.nama.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1e2010] text-sm">{m.nama}</p>
                          <p className="text-[#8a9070] text-[10px]">{m.assigned_by==='admin'?'Oleh Admin':'Mandiri'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select value={m.peran}
                            onChange={e=>setKolaborators(l=>l.map(x=>x.id===m.id?{...x,peran:e.target.value}:x))}
                            className="text-xs border border-[#e4e7d4] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#7a8a52] bg-white text-[#5a6040]">
                            <option value="peserta">Peserta</option>
                            <option value="performer">Performer</option>
                            <option value="panitia">Panitia</option>
                          </select>
                          <select value={m.status_kehadiran}
                            onChange={e=>setKolaborators(l=>l.map(x=>x.id===m.id?{...x,status_kehadiran:e.target.value}:x))}
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
          {tab === 'Artisan' && (
            <div>
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                <p className="text-sm text-[#8a9070]">{Artisan.length} Artisan</p>
                <button onClick={()=>setShowAddT(true)}
                  className="flex items-center gap-1.5 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-3.5 py-2 rounded-[12px] text-xs font-semibold transition">
                  <Plus size={13}/> Assign Artisan
                </button>
              </div>
              {Artisan.length === 0
                ? <div className="py-16 text-center text-[#8a9070] text-sm">
                    <Plus size={32} className="text-gray-200 mx-auto mb-3"/>Belum ada Artisan
                  </div>
                : <div className="divide-y divide-gray-50">
                    {Artisan.map(t=>(
                      <div key={t.id} className="px-5 py-3.5 flex items-center gap-3 group hover:bg-[#f7f8f2]/60 transition">
                        <div className="w-9 h-9 rounded-[12px] bg-[#eef4eb] flex items-center justify-center text-[#7a8a52] font-bold text-sm shrink-0">
                          {t.nama_usaha.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1e2010] text-sm">{t.nama_usaha}</p>
                          <span className="px-1.5 py-0.5 bg-[#eef0e0] text-[#7a8a52] text-[10px] rounded font-medium">{t.kategori}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* zones prop explicit, tidak pernah undefined */}
                          <StandEditor
                            value={t.posisi_event}
                            onChange={val=>updateArtisanStand(t.id, val)}
                            zones={zones}
                          />
                          <button onClick={()=>removeArtisan(t.id)}
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

        </div>{/* end col-span-3 */}
      </div>{/* end grid */}

      {/* Modals */}
      {showAddM && (
        <AssignKolaboratorModal
          onClose={()=>setShowAddM(false)}
          onAssign={assignKolaborator}
          existingIds={kolaborators.map(m=>m.kolaborator_id)}
        />
      )}
      {showAddT && (
        <AssignArtisanModal
          onClose={()=>setShowAddT(false)}
          onAssign={assignArtisan}
          existingIds={Artisan.map(t=>t.artisan_id)}
          zones={zones}
        />
      )}
    </div>
  );
}
