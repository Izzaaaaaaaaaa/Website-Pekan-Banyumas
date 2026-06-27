// Artisan.jsx — Kelola Artisan + tab drawer (Usaha, Event, Profil Publik)
import React, { useState, useEffect, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Search, CheckCircle, XCircle, Store, AlertCircle, UserCheck,
  ChevronDown, ChevronUp, Percent, MapPin, Phone, Mail,
  FileText, X, TrendingUp, Wallet, Edit3, Save, Loader2,
  Plus, Trash2, Calendar, Image, Tag
} from 'lucide-react';
import { useToast } from '../components/Toast';
import ZoneSelector from '../components/ZoneSelector';
import { getEventZones } from '../lib/eventZones';
import { STORAGE_KEYS, STORAGE_EVENTS } from '../lib/storageKeys';
import { artisanApi, eventApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';
import { KATEGORI_USAHA } from '../constants/kategoriUsaha';

// Money fields arrive from the API as Decimal strings ("1910000.00"); coerce
// with Number() so toLocaleString formats them (and reduces don't string-concat).
const fmtRupiah = v => 'Rp ' + Number(v || 0).toLocaleString('id-ID');
const fmtTgl = d => new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
function useDebounce(v,d=300){const[r,s]=useState(v);useEffect(()=>{const t=setTimeout(()=>s(v),d);return()=>clearTimeout(t)},[v,d]);return r}

// ── PosisiSelectModal ─────────────────────────────────────────────────────────
function PosisiSelectModal({ value, onClose, onChange, eventId }) {
  const [local, setLocal] = useState(value || '');
  const zones = eventId ? getEventZones(eventId) : [];
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e7d4]">
          <p className="font-bold text-[#1e2010] text-sm">Pilih Posisi Stand</p>
          <button onClick={onClose} className="text-[#8a9070] hover:text-[#5a6040]"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <ZoneSelector value={local} onChange={setLocal} zones={zones} compact/>
          <div className="pt-2 border-t border-[#e4e7d4]">
            <label className="text-xs font-semibold text-[#8a9070] mb-1.5 block uppercase tracking-wider">Atau ketik manual</label>
            <input value={local} onChange={e => setLocal(e.target.value)} placeholder="cth: Zona A - Stand 5"
              className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]"/>
          </div>
        </div>
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-semibold hover:bg-[#f7f8f2] transition">Batal</button>
          <button onClick={() => { onChange(local); onClose(); }} disabled={!local}
            className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition disabled:opacity-50">
            Simpan Posisi
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PosisiInlineEditor ────────────────────────────────────────────────────────
function PosisiInlineEditor({ value, onChange, eventId }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 text-xs font-medium transition rounded-lg px-2 py-1 border
          ${value
            ? 'text-[#7a8a52] bg-[#eef0e0] border-[#c8d09a] hover:bg-[#eef4eb]'
            : 'text-[#8a9070] border-dashed border-[#c8ccb0] hover:border-[#c8d09a] hover:text-[#7a8a52]'}`}>
        <span>📍</span>
        <span className="max-w-[100px] truncate">{value || 'Pilih stand'}</span>
        <span className="text-gray-300 text-[9px]">▼</span>
      </button>
      {open && <PosisiSelectModal value={value} onClose={() => setOpen(false)} onChange={onChange} eventId={eventId}/>}
    </>
  );
}

function AssignEventModal({ artisanId, existingIds, onClose, onAssign, allEvents }) {
  const [selected, setSelected] = useState(null);
  const [posisi, setPosisi] = useState('');
  const [saving, setSaving] = useState(false);
  const available = (allEvents || []).filter(e =>
    ['published','berlangsung'].includes(e.status_efektif || e.status) && !existingIds.includes(e.id));

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await onAssign({ event_id: selected.id, posisi_event: posisi });
      onClose();
    } catch {
      // error sudah di-toast oleh parent
    } finally {
      setSaving(false);
    }
  };

  // Portal ke <body>: drawer induk memakai transform (animasi slide) sehingga
  // jadi containing block untuk position:fixed — tanpa portal modal terjebak di
  // dalam drawer & tombol Assign bisa ketutup/keluar layar (apalagi ZoneSelector
  // membuat modal tinggi). Body scrollable + footer tetap terlihat.
  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b shrink-0"><h3 className="font-bold text-[#1e2010]">Assign ke Event</h3><button onClick={onClose}><X size={18} className="text-[#8a9070]"/></button></div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {available.length === 0
              ? <p className="text-[#8a9070] text-sm text-center py-4">Tidak ada event tersedia</p>
              : available.map(e => (
                <button key={e.id} onClick={() => setSelected(e)}
                  className={`w-full text-left px-3 py-2.5 rounded-[12px] border text-sm transition ${selected?.id===e.id?'border-[#7a8a52] bg-[#eef0e0]':'border-[#e4e7d4] hover:border-[#c8ccb0]'}`}>
                  {e.nama}
                </button>
              ))
            }
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8a9070] mb-2 block">Posisi Stand di Event</label>
            <ZoneSelector value={posisi} onChange={setPosisi} zones={selected ? getEventZones(selected.id) : []} compact/>
            <div className="mt-2">
              <input value={posisi} onChange={e=>setPosisi(e.target.value)} placeholder="Atau ketik manual: cth Zona A - Stand 5"
                className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-xs focus:outline-none focus:border-[#7a8a52]"/>
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t shrink-0">
          <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2 rounded-[12px] text-sm font-semibold">Batal</button>
          <button onClick={save} disabled={!selected||saving}
            className="flex-1 bg-[#7a8a52] text-white py-2 rounded-[12px] text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
            {saving?<Loader2 size={13} className="animate-spin"/>:<Plus size={13}/>} Assign
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── PendingCard ───────────────────────────────────────────────────────────────
const PendingCard = memo(({ t, onApprove, onReject, isProcessing }) => {
  const [exp, setExp] = useState(false);
  const [komisi, setKomisi] = useState(10);
  return (
    <div className="bg-white border border-[#dcc882] rounded-[16px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-[#f7f2e4] border-b border-[#dcc882] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/><span className="text-[#C4A24D] text-xs font-semibold">Menunggu Persetujuan</span></div>
        <span className="text-[#C4A24D] text-xs">{fmtTgl(t.tanggal_daftar)}</span>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#f7f2e4] flex items-center justify-center text-[#C4A24D] font-bold shrink-0">{t.nama_usaha.charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1e2010]">{t.nama_usaha}</p>
            <p className="text-[#8a9070] text-sm">{t.pemilik} · {t.kota}</p>
            <span className="mt-1 inline-block px-2 py-0.5 bg-[#eef0e0] border border-[#c8d09a] text-[#7a8a52] text-[10px] rounded font-medium">{(t.kategori_usaha||[]).join(', ')}</span>
          </div>
          <button onClick={() => setExp(!exp)} className="text-[#8a9070] hover:text-[#5a6040]">{exp?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>
        </div>
        {exp && (
          <div className="mt-4 space-y-3">
            <p className="text-[#8a9070] text-sm">{t.deskripsi}</p>
            <div className="bg-[#f7f8f2] rounded-[12px] p-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-[#5a6040]"><Phone size={12}/>{t.no_hp}</div>
              <div className="flex items-center gap-2 text-[#5a6040]"><Mail size={12}/>{t.email}</div>
              <div className="flex items-center gap-2 text-[#5a6040]"><MapPin size={12}/>{t.kota}</div>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#5a6040] mb-2 block flex items-center gap-1.5"><Percent size={14}/>Komisi Default (%)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="0" max="30" value={komisi} onChange={e=>setKomisi(+e.target.value)} className="flex-1"/>
                <div className="w-14 border border-[#e4e7d4] rounded-lg px-2 py-1.5 text-center font-bold text-indigo-700 text-sm bg-indigo-50">{komisi}%</div>
              </div>
              <p className="text-[10px] text-[#8a9070] mt-1">Bisa diubah nanti di halaman detail artisan</p>
            </div>
          </div>
        )}
        <div className="flex gap-2.5 mt-4">
          <button onClick={() => onApprove(t.id, { komisi_persen:komisi })} disabled={isProcessing===t.id}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#7a8a52] hover:bg-[#7a8a52] text-white py-2.5 rounded-[12px] font-semibold text-sm transition disabled:opacity-60">
            {isProcessing===t.id?<Loader2 size={13} className="animate-spin"/>:<CheckCircle size={13}/>} Setujui
          </button>
          <button onClick={() => onReject(t.id)} className="flex-1 flex items-center justify-center gap-1.5 border border-[#dbb8b8] text-[#B87272] py-2.5 rounded-[12px] font-semibold text-sm hover:bg-[#f7eeee] transition">
            <XCircle size={13}/> Tolak
          </button>
        </div>
      </div>
    </div>
  );
});

const STATUS_MAP = {
  aktif:    { label:'Aktif',   cls:'bg-[#eef0e0] text-[#7a8a52] border-[#c8d09a]', dot:'bg-[#7A9B6A]' },
  pending:  { label:'Pending', cls:'bg-[#f7f2e4] text-[#C4A24D] border-[#dcc882]', dot:'bg-amber-400' },
  suspended:{ label:'Suspend', cls:'bg-[#f7eeee] text-[#B87272] border-[#dbb8b8]', dot:'bg-red-400' },
};

const ArtisanRow = memo(({ t, onEdit, onApprove, onSuspend, onDelete, isProcessing }) => {
  const st = STATUS_MAP[t.status] || STATUS_MAP.aktif;
  return (
    <tr className="border-b border-gray-50 hover:bg-[#f7f8f2]/60 transition group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-[#eef4eb] flex items-center justify-center text-[#4f5c30] font-bold text-sm shrink-0">{t.nama_usaha.charAt(0)}</div>
          <div><p className="font-semibold text-[#1e2010] text-sm">{t.nama_usaha}</p><p className="text-[#8a9070] text-xs">{t.pemilik}</p></div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="px-2 py-0.5 bg-[#eef0e0] border border-[#eef0e0] text-[#7a8a52] rounded text-[11px] font-medium">{(t.kategori_usaha||[t.kategori]).join(', ')}</span>
        <p className="text-[#8a9070] text-xs flex items-center gap-1 mt-1"><MapPin size={10}/>{t.kota}</p>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`}/>{st.label}
        </span>
      </td>
      <td className="px-4 py-3.5"><span className="flex items-center gap-1 text-sm font-semibold text-indigo-700"><Percent size={12}/>{t.komisi_persen}%</span></td>
      <td className="px-4 py-3.5">
        <p className="text-sm font-semibold text-[#1e2010]">{fmtRupiah(t.total_penjualan)}</p>
        <p className="text-xs text-emerald-600 font-medium">{fmtRupiah(t.komisi_terkumpul)} komisi</p>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onEdit(t)} className="p-1.5 rounded-lg text-[#8a9070] hover:text-indigo-600 hover:bg-indigo-50 transition" title="Edit"><Edit3 size={14}/></button>
          {t.status === 'aktif'     && <button onClick={() => onSuspend(t.id)} disabled={isProcessing===t.id} className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#B87272] hover:bg-[#f7eeee] transition" title="Suspend"><XCircle size={14}/></button>}
          {t.status === 'suspended' && (
            <>
              <button onClick={() => onApprove(t.id)} disabled={isProcessing===t.id} className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#7a8a52] hover:bg-[#eef0e0] transition" title="Aktifkan"><UserCheck size={14}/></button>
              <button onClick={() => onDelete(t.id)}  disabled={isProcessing===t.id} className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#B87272] hover:bg-[#f7eeee] transition" title="Hapus Akun"><Trash2 size={14}/></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

// ── EditDrawer ────────────────────────────────────────────────────────────────
const EditDrawer = ({ artisan, onClose, onSave, allEvents }) => {
  const [tab, setTab] = useState('usaha');
  const [komisi, setKomisi] = useState(artisan?.komisi_persen||0);
  const [saving, setSaving] = useState(false);
  const [savingProfil, setSavingProfil] = useState(false);
  const [artisanEvents, setArtisanEvents] = useState([]);
  const [artisanRequests, setArtisanRequests] = useState([]);
  const [reqProcessing, setReqProcessing] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [profilEdit, setProfilEdit] = useState({ nama_usaha:'', kota:'', no_hp:'', email:'', deskripsi:'', kategori_usaha:[], internal_notes:'' });
  const toast = useToast();

  useEffect(() => {
    if (!artisan) return;
    setKomisi(artisan.komisi_persen||0);
    setProfilEdit({ nama_usaha: artisan.nama_usaha||'', kota: artisan.kota||'', no_hp: artisan.no_hp||'', email: artisan.email||'', deskripsi: artisan.deskripsi||'', kategori_usaha: artisan.kategori_usaha||[], internal_notes: artisan.internal_notes||'' });
    setTab('usaha');
    setEventsLoading(true);
    Promise.all([artisanApi.events(artisan.id), artisanApi.requests(artisan.id)])
      .then(([list, reqs]) => { setArtisanEvents(list || []); setArtisanRequests(reqs || []); })
      .catch(() => { setArtisanEvents([]); setArtisanRequests([]); })
      .finally(() => setEventsLoading(false));
  }, [artisan?.id]);

  if (!artisan) return null;

  // GATE-5: revenue summary must react to the commission slider, not the
  // stored komisi_terkumpul. Preview the commission/net at the *current*
  // slider rate so the admin sees the effect before saving.
  const totalPenjualan = Number(artisan.total_penjualan || 0);
  const estimasiKomisi = Math.round(totalPenjualan * (komisi / 100));
  const estimasiDiterima = totalPenjualan - estimasiKomisi;
  const komisiBelumDisimpan = Number(komisi) !== Number(artisan.komisi_persen || 0);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(artisan.id, { komisi_persen: komisi });
      onClose();
    } catch {
      // error sudah di-toast oleh parent
    } finally {
      setSaving(false);
    }
  };

  const removeEvent = async (e) => {
    if (!confirm('Hapus dari event ini?')) return;
    try {
      await eventApi.removeArtisan(e.event_id, e.id);
      setArtisanEvents(l => l.filter(x => x.id !== e.id));
      toast.success('Artisan dihapus dari event');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menghapus dari event'));
    }
  };

  // Approve/reject an artisan's event request from this panel. Approve reuses
  // the requested stand (backend falls back to req.posisi_event when no
  // stand_id is sent), so the admin can one-click confirm.
  const respondRequest = async (req, action) => {
    setReqProcessing(req.id);
    try {
      await eventApi.respondArtisanRequest(req.event_id, req.id, { action });
      const [list, reqs] = await Promise.all([
        artisanApi.events(artisan.id),
        artisanApi.requests(artisan.id),
      ]);
      setArtisanEvents(list || []);
      setArtisanRequests(reqs || []);
      toast.success(action === 'approve' ? 'Permintaan disetujui' : 'Permintaan ditolak');
    } catch (err) {
      toast.error(extractError(err, 'Gagal memproses permintaan'));
    } finally {
      setReqProcessing(null);
    }
  };

  const handleAssignEvent = async ({ event_id, posisi_event }) => {
    try {
      await eventApi.assignArtisan(event_id, { artisan_id: artisan.id, posisi_event });
      const updated = await artisanApi.events(artisan.id);
      setArtisanEvents(updated || []);
      toast.success('Artisan berhasil di-assign ke event');
    } catch (err) {
      toast.error(extractError(err, 'Gagal assign ke event'));
      throw err;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40" onClick={onClose}/>
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col" style={{animation:'slideIn .26s cubic-bezier(.32,.72,0,1) both'}}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e7d4] bg-[#f7f8f2] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#eef4eb] flex items-center justify-center text-[#7a8a52] font-bold shrink-0">{artisan.nama_usaha.charAt(0)}</div>
            <div>
              <p className="font-bold text-[#1e2010] text-sm leading-tight">{artisan.nama_usaha}</p>
              <p className="text-[#8a9070] text-xs">{artisan.pemilik} · {artisan.kota}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a9070] hover:bg-[#eef0e0] transition"><X size={18}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e4e7d4] shrink-0">
          {[['usaha','Usaha'],['event','Event'],['profil','Profil Publik']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`flex-1 py-2.5 text-xs font-semibold transition border-b-2 ${tab===v?'border-[#7a8a52] text-[#7a8a52]':'border-transparent text-[#8a9070] hover:text-[#5a6040]'}`}>{l}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* TAB: Usaha */}
          {tab === 'usaha' && (
            <div className="p-5 space-y-5">
              <div className="bg-[#eef4eb] border border-emerald-100 rounded-[12px] p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[#7A9B6A] text-xs font-semibold uppercase tracking-wide">Ringkasan Revenue</p>
                  {komisiBelumDisimpan && (
                    <span className="text-[10px] font-semibold text-[#C4A24D] bg-[#f7f2e4] border border-[#dcc882] rounded-full px-2 py-0.5 whitespace-nowrap">Estimasi · belum disimpan</span>
                  )}
                </div>
                {[['Total Penjualan', fmtRupiah(totalPenjualan),'text-[#1e2010]'],
                  ['Komisi Terkumpul (tersimpan)', fmtRupiah(artisan.komisi_terkumpul),'text-[#7A9B6A]'],
                  [`Estimasi Komisi (${komisi}%)`, fmtRupiah(estimasiKomisi),'text-[#7A9B6A]'],
                  ['Estimasi Diterima Artisan', fmtRupiah(estimasiDiterima),'text-indigo-700'],
                ].map(([l,v,c]) => (
                  <div key={l} className="flex justify-between text-sm"><span className="text-[#5a6040]">{l}</span><span className={`font-semibold ${c}`}>{v}</span></div>
                ))}
              </div>
              <div>
                <label className="text-sm font-semibold text-[#5a6040] mb-2 block flex items-center gap-1.5"><Percent size={14}/>Persentase Komisi</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="30" value={komisi} onChange={e=>setKomisi(+e.target.value)} className="flex-1"/>
                  <div className="w-16 border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-center font-bold text-indigo-700 text-sm bg-indigo-50">{komisi}%</div>
                </div>
              </div>
              <div className="bg-[#eaf0f4] border border-[#b0c8d8] rounded-[12px] p-3 text-xs text-[#6B8FA3] leading-relaxed">
                📍 <strong>Posisi stand</strong> dikelola per-event dari tab <em>Event</em> di sini atau dari halaman <em>Kelola Event</em>. Tidak ada posisi default — setiap event memiliki zona dan stand yang berbeda.
              </div>
              <div className="bg-[#f7f8f2] rounded-[12px] p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider">Kontak</p>
                <div className="flex items-center gap-2 text-[#5a6040]"><Phone size={13}/>{artisan.no_hp}</div>
                <div className="flex items-center gap-2 text-[#5a6040]"><Mail size={13}/>{artisan.email}</div>
              </div>
            </div>
          )}

          {/* TAB: Event */}
          {tab === 'event' && (
            <div>
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm text-[#8a9070]">{artisanEvents.length} event</p>
                <button onClick={() => setShowAssign(true)}
                  className="flex items-center gap-1.5 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-3 py-1.5 rounded-[12px] text-xs font-semibold transition">
                  <Plus size={12}/> Assign Event
                </button>
              </div>

              {/* Pending requests — approve/reject straight from this panel */}
              {artisanRequests.length > 0 && (
                <div className="bg-amber-50/60 border-b border-amber-100">
                  <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                    Menunggu Persetujuan ({artisanRequests.length})
                  </p>
                  <div className="divide-y divide-amber-100/70">
                    {artisanRequests.map(r => (
                      <div key={r.id} className="px-5 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1e2010] text-sm leading-snug">{r.event_nama}</p>
                          <p className="text-[#8a9070] text-xs mt-0.5">{fmtTgl(r.tanggal)}{r.jam_mulai && <span className="ml-1 text-gray-300">· {r.jam_mulai.slice(0,5).replace(':','.')}{r.jam_selesai?`–${r.jam_selesai.slice(0,5).replace(':','.')}`:''} WIB</span>}</p>
                          {(r.posisi_event || r.change_request) && (
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-700">
                              {r.status_request === 'pending_change' ? `Pindah → ${r.change_request}` : `Posisi: ${r.posisi_event}`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button disabled={reqProcessing===r.id} onClick={() => respondRequest(r,'approve')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7a8a52] hover:bg-[#4f5c30] text-white disabled:opacity-50 transition">Setujui</button>
                          <button disabled={reqProcessing===r.id} onClick={() => respondRequest(r,'reject')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#B87272] hover:bg-[#f7eeee] disabled:opacity-50 transition">Tolak</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {eventsLoading
                ? <div className="py-12 text-center text-[#8a9070] text-sm"><Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#a8b07a]"/>Memuat event...</div>
                : artisanEvents.length === 0
                  ? <div className="py-12 text-center text-[#8a9070] text-sm"><Calendar size={28} className="text-gray-200 mx-auto mb-2"/>Belum ada event</div>
                  : <div className="divide-y divide-gray-50">
                      {artisanEvents.map(e => (
                        <div key={e.id} className="px-5 py-3 flex items-start gap-3 group hover:bg-[#f7f8f2]/50 transition">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1e2010] text-sm">{e.nama}</p>
                            <p className="text-[#8a9070] text-xs mt-0.5">{fmtTgl(e.tanggal)}{e.jam_mulai && <span className="ml-1 text-gray-300">· {e.jam_mulai.slice(0,5).replace(':','.')}{e.jam_selesai?`–${e.jam_selesai.slice(0,5).replace(':','.')}`:''} WIB</span>}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <PosisiInlineEditor
                                value={e.posisi_event}
                                onChange={val => setArtisanEvents(l => l.map(x => x.id===e.id ? {...x,posisi_event:val} : x))}
                                eventId={e.event_id}
                              />
                              <span className={`text-[10px] ${e.assigned_by==='admin'?'text-blue-500':'text-[#8a9070]'}`}>
                                {e.assigned_by==='admin'?'Oleh Admin':'Mandiri'}
                              </span>
                            </div>
                          </div>
                          <button onClick={() => removeEvent(e)} className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg text-gray-300 hover:text-[#B87272] hover:bg-[#f7eeee]">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      ))}
                    </div>
              }
            </div>
          )}

          {/* TAB: Profil Publik */}
          {tab === 'profil' && (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Nama Usaha</label>
                <input value={profilEdit.nama_usaha} onChange={e=>setProfilEdit(f=>({...f,nama_usaha:e.target.value}))}
                  className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">No. HP</label>
                  <input value={profilEdit.no_hp} onChange={e=>setProfilEdit(f=>({...f,no_hp:e.target.value}))}
                    className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]" type="tel"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Email</label>
                  <input value={profilEdit.email} onChange={e=>setProfilEdit(f=>({...f,email:e.target.value}))}
                    className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]" type="email"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Kota</label>
                <input value={profilEdit.kota} onChange={e=>setProfilEdit(f=>({...f,kota:e.target.value}))}
                  className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Kategori Usaha</label>
                <div className="flex flex-wrap gap-1.5">
                  {KATEGORI_USAHA.map(s => (
                    <button key={s} type="button" onClick={()=>setProfilEdit(f=>({...f,kategori_usaha:f.kategori_usaha.includes(s)?f.kategori_usaha.filter(x=>x!==s):[...f.kategori_usaha,s]}))}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${profilEdit.kategori_usaha.includes(s)?'bg-[#7a8a52] text-white border-[#4f5c30]':'bg-[#f7f8f2] text-[#5a6040] border-[#e4e7d4] hover:border-[#c8d09a]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Deskripsi</label>
                <textarea value={profilEdit.deskripsi} onChange={e=>setProfilEdit(f=>({...f,deskripsi:e.target.value}))} rows={3}
                  className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52] resize-none"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Catatan Internal (Admin Only)</label>
                <textarea value={profilEdit.internal_notes} onChange={e=>setProfilEdit(f=>({...f,internal_notes:e.target.value}))} rows={2}
                  placeholder="Catatan hanya terlihat oleh admin..."
                  className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52] resize-none bg-[#f7f2e4]"/>
              </div>
              <div className="bg-[#f7f2e4] border border-[#dcc882] rounded-[12px] p-3 text-xs text-[#C4A24D]">
                Galeri dan foto profil dapat diupload dari halaman Company Profile di dashboard Artisan.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e4e7d4] shrink-0 flex gap-2.5">
          {tab === 'usaha' && (
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#7a8a52] text-white py-2.5 rounded-[12px] font-semibold text-sm transition disabled:opacity-70">
              {saving?<><Loader2 size={14} className="animate-spin"/>Menyimpan...</>:<><Save size={14}/>Simpan</>}
            </button>
          )}
          {tab === 'profil' && (
            <button onClick={async () => {
              setSavingProfil(true);
              try {
                await onSave(artisan.id, profilEdit);
                onClose();
              } catch {
                // error sudah di-toast oleh parent
              } finally { setSavingProfil(false); }
            }} disabled={savingProfil}
              className="flex-1 flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] font-semibold text-sm transition disabled:opacity-70">
              {savingProfil?<><Loader2 size={14} className="animate-spin"/>Menyimpan...</>:<><Save size={14}/>Simpan Profil</>}
            </button>
          )}
          <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-semibold hover:bg-[#f7f8f2] transition">Tutup</button>
        </div>

        {showAssign && (
          <AssignEventModal
            artisanId={artisan.id}
            existingIds={artisanEvents.map(e => e.event_id)}
            onClose={() => setShowAssign(false)}
            onAssign={handleAssignEvent}
            allEvents={allEvents}
          />
        )}
      </div>
    </>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ArtisanPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [artisans, setArtisans] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [artisanIdsInSelectedEvent, setArtisanIdsInSelectedEvent] = useState([]);
  const [tab, setTab] = useState('aktif');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterEvent, setFilterEvent] = useState('semua');
  const [editItem, setEditItem] = useState(null);
  const [processing, setProcessing] = useState(null);
  const dSearch = useDebounce(search);

  const load = async () => {
    try {
      setArtisans(await artisanApi.list() || []);
    } catch (err) {
      toast.error(extractError(err, 'Gagal memuat data artisan'));
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-open drawer saat ada ?openId= query param
  useEffect(() => {
    const openId = searchParams.get('openId');
    if (!openId) return;
    artisanApi.detail(openId)
      .then(data => { if (data && data.id) setEditItem(data); })
      .catch(() => {})
      .finally(() => {
        // Hapus openId dari URL setelah drawer dibuka
        setSearchParams(prev => { prev.delete('openId'); return prev; }, { replace: true });
      });
  }, []);

  // Load events for filter dropdown
  useEffect(() => {
    eventApi.list().then(list => setAllEvents(list || [])).catch(() => {});
  }, []);

  // When filter event changes, fetch artisan IDs in that event
  useEffect(() => {
    if (filterEvent === 'semua') { setArtisanIdsInSelectedEvent([]); return; }
    eventApi.artisans(filterEvent)
      .then(list => setArtisanIdsInSelectedEvent((list || []).map(a => a.artisan_id)))
      .catch(() => setArtisanIdsInSelectedEvent([]));
  }, [filterEvent]);

  const pending   = artisans.filter(t => t.status === 'pending');
  const aktif     = artisans.filter(t => t.status === 'aktif');
  const suspended = artisans.filter(t => t.status === 'suspended');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_ARTISAN, String(pending.length));
      window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.PENDING_ARTISAN_UPDATE,{detail:{count:pending.length}}));
    } catch {}
  }, [pending.length]);

  const approve = async (id, extra={}) => {
    setProcessing(id);
    try {
      await artisanApi.status(id, 'aktif');
      if (extra && Object.keys(extra).length) await artisanApi.update(id, extra);
      toast.success('Artisan berhasil disetujui');
      try {
        const t = artisans.find(x=>x.id===id);
        const { triggerArtisanApproved } = await import('../lib/notifications');
        if (t) triggerArtisanApproved(t.nama_usaha);
      } catch {}
      await load();
      if (tab === 'pending' && pending.length === 1) setTab('aktif');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menyetujui artisan'));
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (id) => {
    if (!confirm('Tolak pendaftaran ini?')) return;
    setProcessing(id);
    try {
      await artisanApi.status(id, 'rejected');
      toast.error('Pendaftaran ditolak');
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal menolak pendaftaran'));
    } finally {
      setProcessing(null);
    }
  };

  const suspend = async (id) => {
    if (!confirm('Suspend artisan ini? Mereka tidak dapat login hingga diaktifkan kembali.')) return;
    setProcessing(id);
    try {
      await artisanApi.status(id, 'suspended');
      toast.error('Artisan disuspend');
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal mensuspend artisan'));
    } finally {
      setProcessing(null);
    }
  };

  const deleteArtisan = async (id) => {
    if (!confirm('Hapus akun artisan ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
    setProcessing(id);
    try {
      await artisanApi.delete(id);
      toast.error('Akun artisan berhasil dihapus');
      await load();
      if (tab === 'suspended' && suspended.length === 1) setTab('aktif');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menghapus artisan'));
    } finally {
      setProcessing(null);
    }
  };

  const saveEdit = async (id, data) => {
    try {
      await artisanApi.update(id, data);
      toast.success('Data artisan diperbarui');
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal memperbarui artisan'));
      throw err; // drawer tetap terbuka jika gagal
    }
  };

  const SORT_FNS = {
    newest:       (a,b) => new Date(b.tanggal_daftar)-new Date(a.tanggal_daftar),
    oldest:       (a,b) => new Date(a.tanggal_daftar)-new Date(b.tanggal_daftar),
    name_asc:     (a,b) => a.nama_usaha.localeCompare(b.nama_usaha),
    name_desc:    (a,b) => b.nama_usaha.localeCompare(a.nama_usaha),
    most_revenue: (a,b) => (b.total_penjualan||0)-(a.total_penjualan||0),
    most_komisi:  (a,b) => (b.komisi_terkumpul||0)-(a.komisi_terkumpul||0),
    komisi_rate:  (a,b) => (b.komisi_persen||0)-(a.komisi_persen||0),
  };

  const filtered = aktif
    .filter(t => (!dSearch
      || t.nama_usaha.toLowerCase().includes(dSearch.toLowerCase())
      || t.pemilik.toLowerCase().includes(dSearch.toLowerCase()))
      && (filterEvent === 'semua' || artisanIdsInSelectedEvent.includes(t.id))
    )
    .sort(SORT_FNS[sortBy] || SORT_FNS.newest);

  const totalPenjualan = aktif.reduce((s,t) => s + Number(t.total_penjualan||0), 0);
  const totalKomisi    = aktif.reduce((s,t) => s + Number(t.komisi_terkumpul||0), 0);

  return (
    <div className="space-y-5">
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[['Total Artisan',aktif.length,'text-[#1e2010]','bg-white'],
          ['Pending',pending.length,'text-[#C4A24D]','bg-[#f7f2e4]'],
          ['Total Penjualan',fmtRupiah(totalPenjualan),'text-[#1e2010]','bg-white'],
          ['Komisi Terkumpul',fmtRupiah(totalKomisi),'text-[#7A9B6A]','bg-[#eef4eb]'],
        ].map(([l,v,tc,bg]) => (
          <div key={l} className={`${bg} border border-[#e4e7d4] rounded-[16px] p-4`}>
            <p className={`font-bold text-lg ${tc}`}>{v}</p>
            <p className="text-[#8a9070] text-xs mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          ['pending',  `Menunggu (${pending.length})`,   pending.length > 0],
          ['aktif',    'Artisan Aktif',                  false],
          ['suspended',`Suspended (${suspended.length})`, suspended.length > 0],
        ].map(([v,l,pulse]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-[12px] text-sm font-semibold transition border ${tab===v?'bg-[#7a8a52] text-white border-[#4f5c30]':'bg-white text-[#5a6040] border-[#e4e7d4] hover:border-[#c8d09a]'}`}>
            {l}{pulse && <span className="ml-2 w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse"/>}
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        pending.length === 0
          ? <div className="bg-white rounded-[16px] border border-[#e4e7d4] p-12 text-center text-[#8a9070] text-sm"><CheckCircle size={36} className="text-[#a8b07a] mx-auto mb-2"/>Tidak ada pendaftaran</div>
          : <div className="grid sm:grid-cols-2 gap-4">{pending.map(t => <PendingCard key={t.id} t={t} onApprove={approve} onReject={reject} isProcessing={processing}/>)}</div>
      )}

      {tab === 'suspended' && (
        suspended.length === 0
          ? <div className="bg-white rounded-[16px] border border-[#e4e7d4] p-12 text-center text-[#8a9070] text-sm"><CheckCircle size={36} className="text-[#a8b07a] mx-auto mb-2"/>Tidak ada artisan yang disuspend</div>
          : <div className="bg-white rounded-[16px] border border-[#e4e7d4] overflow-hidden">
              <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-[#e4e7d4] bg-[#f7f8f2]/80">
                    {['Usaha','Kategori & Kota','Status','Komisi','Revenue','Aksi'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-[#8a9070] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suspended.map(t => (
                    <ArtisanRow key={t.id} t={t} onEdit={setEditItem}
                      onApprove={approve} onSuspend={suspend} onDelete={deleteArtisan} isProcessing={processing}/>
                  ))}
                </tbody>
              </table></div>
            </div>
      )}

      {tab === 'aktif' && (
        <>
          <div className="bg-white rounded-[16px] border border-[#e4e7d4] overflow-hidden">
            {/* Row 1: Search */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-50">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9070]"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama usaha atau pemilik..."
                  className="w-full pl-9 pr-4 py-2.5 border border-[#e4e7d4] rounded-[12px] text-sm focus:outline-none focus:border-[#7a8a52] transition"/>
              </div>
            </div>

            {/* Row 2: Filter by event */}
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
              <span className="text-[11px] font-bold text-[#8a9070] uppercase tracking-wider shrink-0">Filter:</span>
              <select value={filterEvent} onChange={e=>setFilterEvent(e.target.value)}
                className="px-3 py-1.5 border border-[#e4e7d4] rounded-lg text-xs text-[#5a6040] bg-[#f7f8f2] focus:outline-none focus:border-[#7a8a52] transition">
                <option value="semua">Semua Event</option>
                {allEvents.map(e => <option key={e.id} value={e.id}>{e.nama}</option>)}
              </select>
              {filterEvent !== 'semua' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#eef0e0] text-[#7a8a52] rounded-full text-[10px] font-semibold">
                  🎪 {allEvents.find(e=>e.id===filterEvent)?.nama?.slice(0,25)}
                  <button onClick={()=>setFilterEvent('semua')} className="hover:text-[#B87272] ml-0.5">×</button>
                </span>
              )}
            </div>

            {/* Row 3: Sort */}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <p className="text-xs text-[#8a9070]">{filtered.length} dari {aktif.length} Artisan aktif</p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#8a9070] uppercase tracking-wider">Urutkan:</span>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="px-3 py-1.5 border border-[#e4e7d4] rounded-lg text-xs text-[#5a6040] bg-[#f7f8f2] focus:outline-none focus:border-[#7a8a52] transition">
                  <option value="newest">Terbaru Daftar</option>
                  <option value="oldest">Terlama Daftar</option>
                  <option value="name_asc">Nama A–Z</option>
                  <option value="name_desc">Nama Z–A</option>
                  <option value="most_revenue">Revenue Tertinggi</option>
                  <option value="most_komisi">Komisi Terbanyak</option>
                  <option value="komisi_rate">Tarif Komisi ↓</option>
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[16px] border border-[#e4e7d4] overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-[#e4e7d4] bg-[#f7f8f2]/80">
                  {['Usaha','Kategori & Kota','Status','Komisi','Revenue','Aksi'].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-[#8a9070] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={6} className="px-5 py-12 text-center text-[#8a9070] text-sm">Tidak ada hasil</td></tr>
                  : filtered.map(t => (
                      <ArtisanRow key={t.id} t={t} onEdit={setEditItem}
                        onApprove={approve} onSuspend={suspend} onDelete={deleteArtisan} isProcessing={processing}/>
                    ))
                }
              </tbody>
            </table></div>
            <div className="px-5 py-3 border-t border-gray-50 text-xs text-[#8a9070]">{filtered.length} Artisan aktif</div>
          </div>
        </>
      )}

      <EditDrawer artisan={editItem} onClose={() => setEditItem(null)} onSave={saveEdit} allEvents={allEvents}/>
    </div>
  );
}
