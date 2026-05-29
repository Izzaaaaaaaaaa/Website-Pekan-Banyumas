// Kolaborator.jsx — Kelola Kolaborator dengan tab drawer (Info, Event, Portofolio, Aktivitas)
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, CheckCircle, XCircle, UserCheck, Users, MapPin, Eye,
  Mail, X, Plus, Trash2, Calendar, Loader2, Image, BookOpen, Star, StarOff,
  Edit3, Save
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { kolaboratorApi, eventApi, aktivitasApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';
import { SUBSEKTOR } from '../constants/subsektor';

const SUBSEKTORS = ['Semua', ...SUBSEKTOR];

const STATUS_MAP = {
  aktif:    { label:'Aktif',   cls:'bg-[#eef0e0] text-[#7a8a52] border-[#c8d09a]',  dot:'bg-[#7A9B6A]' },
  pending:  { label:'Pending', cls:'bg-[#f7f2e4] text-[#C4A24D] border-[#dcc882]',  dot:'bg-amber-400' },
  suspended:{ label:'Suspend', cls:'bg-[#f7eeee] text-[#B87272] border-[#dbb8b8]',  dot:'bg-red-400' },
};
const PERAN_CLS = {
  peserta:'bg-indigo-50 text-indigo-600', performer:'bg-purple-50 text-purple-700', panitia:'bg-orange-50 text-orange-600',
};

function useDebounce(v, d=300) {
  const [dv, setDv] = useState(v);
  useEffect(() => { const t=setTimeout(()=>setDv(v),d); return()=>clearTimeout(t); },[v,d]);
  return dv;
}

// ── AssignEventModal ──────────────────────────────────────────────────────────
function AssignEventModal({ kolaboratorId, existingIds, onClose, onAssign, allEvents }) {
  const [selected, setSelected] = useState(null);
  const [peran, setPeran] = useState('peserta');
  const [saving, setSaving] = useState(false);
  const available = (allEvents || []).filter(e =>
    ['published','berlangsung'].includes(e.status) && !existingIds.includes(e.id));

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await onAssign({ event_id: selected.id, peran });
      onClose();
    } catch {
      // error sudah di-toast oleh parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b"><h3 className="font-bold text-[#1e2010]">Assign ke Event</h3><button onClick={onClose}><X size={18} className="text-[#8a9070]"/></button></div>
        <div className="p-5 space-y-4">
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
            <label className="text-xs font-semibold text-[#8a9070] mb-1.5 block">Peran</label>
            <div className="flex gap-2">
              {['peserta','performer','panitia'].map(p => (
                <button key={p} onClick={() => setPeran(p)}
                  className={`flex-1 py-2 rounded-[12px] text-xs font-semibold border capitalize transition ${peran===p?'bg-[#7a8a52] text-white border-[#4f5c30]':'border-[#e4e7d4] text-[#5a6040]'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2 rounded-[12px] text-sm font-semibold">Batal</button>
            <button onClick={save} disabled={!selected||saving}
              className="flex-1 bg-[#7a8a52] text-white py-2 rounded-[12px] text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
              {saving?<Loader2 size={13} className="animate-spin"/>:<Plus size={13}/>} Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KolaboratorRow ────────────────────────────────────────────────────────────
const KolaboratorRow = React.memo(({ m, onApprove, onSuspend, onDetail, onDelete, isProcessing }) => {
  const st = STATUS_MAP[m.status] || STATUS_MAP.aktif;
  const fmt = d => new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
  return (
    <tr className="border-b border-gray-50 hover:bg-[#f7f8f2]/60 transition group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-[#7a5c1a] font-bold text-sm shrink-0">{m.nama.charAt(0)}</div>
          <div>
            <p className="font-semibold text-[#1e2010] text-sm">{m.nama}</p>
            <p className="text-[#8a9070] text-xs flex items-center gap-1"><Mail size={10}/>{m.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 text-[#8a9070] text-xs"><MapPin size={11}/>{m.kota}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {(m.subsektor||[]).slice(0,2).map(s => <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-medium">{s}</span>)}
          {(m.subsektor||[]).length>2 && <span className="text-[#8a9070] text-[10px]">+{(m.subsektor||[]).length-2}</span>}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`}/>{st.label}
        </span>
      </td>
      <td className="px-4 py-3.5 text-[#8a9070] text-sm">{m.total_karya}</td>
      <td className="px-4 py-3.5 text-[#8a9070] text-xs">{fmt(m.tanggal_daftar)}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onDetail(m)} className="p-1.5 rounded-lg text-[#8a9070] hover:text-indigo-600 hover:bg-indigo-50 transition" title="Detail"><Eye size={14}/></button>
          {m.status === 'pending'   && <button onClick={() => onApprove(m.id)} disabled={isProcessing===m.id} className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#7a8a52] hover:bg-[#eef0e0] transition" title="Setujui"><CheckCircle size={14}/></button>}
          {m.status === 'aktif'     && <button onClick={() => onSuspend(m.id)} disabled={isProcessing===m.id} className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#B87272] hover:bg-[#f7eeee] transition" title="Suspend"><XCircle size={14}/></button>}
          {m.status === 'suspended' && (
            <>
              <button onClick={() => onApprove(m.id)} disabled={isProcessing===m.id} className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#7a8a52] hover:bg-[#eef0e0] transition" title="Aktifkan"><UserCheck size={14}/></button>
              <button onClick={() => onDelete(m.id)} disabled={isProcessing===m.id} className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#B87272] hover:bg-[#f7eeee] transition" title="Hapus Akun"><Trash2 size={14}/></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

// ── DetailDrawer ──────────────────────────────────────────────────────────────
const DetailDrawer = ({ kolaborator, onClose, onApprove, onSuspend, onUpdate, allEvents }) => {
  const [tab, setTab] = useState('info');
  const [kolaboratorEvents, setKolaboratorEvents] = useState([]);
  const [kolaboratorRequests, setKolaboratorRequests] = useState([]);
  const [reqProcessing, setReqProcessing] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [stories, setStories] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [showAssignEvent, setShowAssignEvent] = useState(false);
  const [editInfo, setEditInfo] = useState(false);
  const [editFields, setEditFields] = useState({ nama:'', kota:'', bio:'', email:'', no_hp:'', subsektor:[], internal_notes:'' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!kolaborator) return;
    setTab('info');
    setEditInfo(false);
    setEditFields({ nama: kolaborator.nama || '', kota: kolaborator.kota || '', bio: kolaborator.bio || '', email: kolaborator.email || '', no_hp: kolaborator.no_hp || '', subsektor: kolaborator.subsektor || [], internal_notes: kolaborator.internal_notes || '' });
    setKolaboratorEvents([]);
    setKolaboratorRequests([]);
    setPortfolio([]);
    setStories([]);
  }, [kolaborator?.id]);

  // Load per-tab data on tab change
  useEffect(() => {
    if (!kolaborator) return;
    const loadTab = async () => {
      setTabLoading(true);
      try {
        if (tab === 'event') {
          const [list, reqs] = await Promise.all([
            kolaboratorApi.events(kolaborator.id),
            kolaboratorApi.requests(kolaborator.id),
          ]);
          setKolaboratorEvents(list || []);
          setKolaboratorRequests(reqs || []);
        } else if (tab === 'portofolio') {
          const list = await kolaboratorApi.portofolio(kolaborator.id);
          setPortfolio(list || []);
        } else if (tab === 'aktivitas') {
          const list = await kolaboratorApi.stories(kolaborator.id);
          setStories(list || []);
        }
      } catch (err) {
        toast.error(extractError(err, 'Gagal memuat data'));
      } finally {
        setTabLoading(false);
      }
    };
    if (tab !== 'info') loadTab();
  }, [tab, kolaborator?.id]);

  if (!kolaborator) return null;
  const st = STATUS_MAP[kolaborator.status] || STATUS_MAP.aktif;

  const handleAssignEvent = async ({ event_id, peran }) => {
    try {
      await eventApi.assignKolaborator(event_id, { kolaborator_id: kolaborator.id, peran });
      const updated = await kolaboratorApi.events(kolaborator.id);
      setKolaboratorEvents(updated || []);
      toast.success('Berhasil di-assign ke event');
    } catch (err) {
      toast.error(extractError(err, 'Gagal assign ke event'));
      throw err;
    }
  };

  const removeEvent = async (e) => {
    if (!confirm('Hapus dari event ini?')) return;
    try {
      await eventApi.removeKolaborator(e.event_id, e.id);
      setKolaboratorEvents(l => l.filter(x => x.id !== e.id));
      toast.success('Kolaborator dihapus dari event');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menghapus dari event'));
    }
  };

  // Approve/reject a kolaborator's event request straight from this panel
  // (no need to open Kelola Event). Re-fetch both lists after.
  const respondRequest = async (req, action) => {
    setReqProcessing(req.id);
    try {
      await eventApi.respondKolaboratorRequest(req.event_id, req.id, { action });
      const [list, reqs] = await Promise.all([
        kolaboratorApi.events(kolaborator.id),
        kolaboratorApi.requests(kolaborator.id),
      ]);
      setKolaboratorEvents(list || []);
      setKolaboratorRequests(reqs || []);
      toast.success(action === 'approve' ? 'Permintaan disetujui' : 'Permintaan ditolak');
    } catch (err) {
      toast.error(extractError(err, 'Gagal memproses permintaan'));
    } finally {
      setReqProcessing(null);
    }
  };

  const toggleFeatured = async (pid) => {
    const cur = portfolio.find(p => p.id === pid);
    if (!cur) return;
    const next = !cur.featured;
    setPortfolio(l => l.map(p => p.id === pid ? { ...p, featured: next } : p));
    try {
      await kolaboratorApi.featurePorto(kolaborator.id, pid, next);
      toast.success(next ? 'Ditandai sebagai featured' : 'Featured dilepas');
    } catch (err) {
      setPortfolio(l => l.map(p => p.id === pid ? { ...p, featured: cur.featured } : p));
      toast.error(extractError(err, 'Gagal update featured'));
    }
  };

  const deletePorto = async (pid) => {
    if (!confirm('Hapus karya ini dari portofolio?')) return;
    try {
      await kolaboratorApi.deletePorto(kolaborator.id, pid);
      setPortfolio(l => l.filter(p => p.id !== pid));
      toast.success('Karya dihapus');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menghapus karya'));
    }
  };

  const deleteAktivitas = async (sid) => {
    if (!confirm('Hapus aktivitas ini?')) return;
    try {
      await aktivitasApi.delete(sid);
      setStories(l => l.filter(s => s.id !== sid));
      toast.success('Aktivitas dihapus');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menghapus aktivitas'));
    }
  };

  const fmtTgl = d => new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
  const TABS = [['info','Info'],['event','Event'],['portofolio','Porto'],['aktivitas','Aktivitas']];

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40" onClick={onClose}/>
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col" style={{animation:'slideIn .26s cubic-bezier(.32,.72,0,1) both'}}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e7d4] bg-[#f7f8f2] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-[#7a5c1a] font-bold text-base shrink-0">{kolaborator.nama.charAt(0)}</div>
            <div>
              <p className="font-bold text-[#1e2010] text-sm leading-tight">{kolaborator.nama}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}/>{st.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a9070] hover:bg-gray-200 transition"><X size={18}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e4e7d4] shrink-0">
          {TABS.map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`flex-1 py-2.5 text-xs font-semibold transition border-b-2 ${tab===v?'border-[#7a8a52] text-[#7a8a52]':'border-transparent text-[#8a9070] hover:text-[#5a6040]'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* TAB: Info */}
          {tab === 'info' && (
            <div className="p-5 space-y-4">
              {editInfo ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Nama</label>
                    <input value={editFields.nama} onChange={e=>setEditFields(f=>({...f,nama:e.target.value}))}
                      className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]"/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Email</label>
                      <input type="email" value={editFields.email} onChange={e=>setEditFields(f=>({...f,email:e.target.value}))}
                        className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]"/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">No. HP</label>
                      <input type="tel" value={editFields.no_hp} onChange={e=>setEditFields(f=>({...f,no_hp:e.target.value}))}
                        className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Kota</label>
                    <input value={editFields.kota} onChange={e=>setEditFields(f=>({...f,kota:e.target.value}))}
                      className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52]"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Subsektor</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SUBSEKTOR.map(s => (
                        <button key={s} type="button" onClick={()=>setEditFields(f=>({...f,subsektor:f.subsektor.includes(s)?f.subsektor.filter(x=>x!==s):[...f.subsektor,s]}))}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${editFields.subsektor.includes(s)?'bg-indigo-600 text-white border-indigo-600':'bg-[#f7f8f2] text-[#5a6040] border-[#e4e7d4] hover:border-indigo-300'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Bio</label>
                    <textarea value={editFields.bio} onChange={e=>setEditFields(f=>({...f,bio:e.target.value}))} rows={3}
                      className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52] resize-none"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Catatan Internal (Admin Only)</label>
                    <textarea value={editFields.internal_notes} onChange={e=>setEditFields(f=>({...f,internal_notes:e.target.value}))} rows={2}
                      placeholder="Catatan hanya terlihat oleh admin..."
                      className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:border-[#7a8a52] resize-none bg-[#f7f2e4]"/>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-[#f7f8f2] rounded-[12px] p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[#5a6040]"><Mail size={13}/>{kolaborator.email}</div>
                    <div className="flex items-center gap-2 text-[#5a6040]"><MapPin size={13}/>{kolaborator.kota}</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-2">Subsektor</p>
                    <div className="flex flex-wrap gap-2">
                      {(kolaborator.subsektor||[]).map(s => <span key={s} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-medium">{s}</span>)}
                    </div>
                  </div>
                  {kolaborator.bio && (
                    <div>
                      <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-2">Bio</p>
                      <p className="text-[#5a6040] text-sm leading-relaxed">{kolaborator.bio}</p>
                    </div>
                  )}
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f7f2e4] border border-amber-100 rounded-[12px] p-3 text-center">
                  <p className="text-2xl font-bold text-[#C4A24D]">{kolaborator.total_karya}</p>
                  <p className="text-[#C4A24D] text-xs mt-0.5">Total Karya</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-[12px] p-3 text-center">
                  <p className="text-xs text-indigo-500 font-medium">Terdaftar</p>
                  <p className="text-indigo-700 text-xs mt-1">{new Date(kolaborator.tanggal_daftar).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator for data tabs */}
          {tab !== 'info' && tabLoading && (
            <div className="py-12 text-center text-[#8a9070] text-sm">
              <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#a8b07a]"/>Memuat...
            </div>
          )}

          {/* TAB: Event */}
          {tab === 'event' && !tabLoading && (
            <div>
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm text-[#8a9070]">{kolaboratorEvents.length} event</p>
                <button onClick={() => setShowAssignEvent(true)}
                  className="flex items-center gap-1.5 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-3 py-1.5 rounded-[12px] text-xs font-semibold transition">
                  <Plus size={12}/> Assign Event
                </button>
              </div>

              {/* Pending requests — approve/reject straight from this panel */}
              {kolaboratorRequests.length > 0 && (
                <div className="bg-amber-50/60 border-b border-amber-100">
                  <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                    Menunggu Persetujuan ({kolaboratorRequests.length})
                  </p>
                  <div className="divide-y divide-amber-100/70">
                    {kolaboratorRequests.map(r => (
                      <div key={r.id} className="px-5 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1e2010] text-sm leading-snug">{r.event_nama}</p>
                          <p className="text-[#8a9070] text-xs mt-0.5">{fmtTgl(r.tanggal)}{r.jam_mulai && <span className="ml-1 text-gray-300">· {r.jam_mulai.slice(0,5).replace(':','.')}{r.jam_selesai?`–${r.jam_selesai.slice(0,5).replace(':','.')}`:''} WIB</span>}</p>
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-700 uppercase">{r.peran}</span>
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

              {kolaboratorEvents.length === 0
                ? <div className="py-12 text-center text-[#8a9070] text-sm"><Calendar size={28} className="text-gray-200 mx-auto mb-2"/>Belum ada event</div>
                : <div className="divide-y divide-gray-50">
                    {kolaboratorEvents.map(e => (
                      <div key={e.id} className="px-5 py-3 flex items-start gap-3 group hover:bg-[#f7f8f2]/50 transition">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1e2010] text-sm leading-snug">{e.nama}</p>
                          <p className="text-[#8a9070] text-xs mt-0.5">{fmtTgl(e.tanggal)}{e.jam_mulai && <span className="ml-1 text-gray-300">· {e.jam_mulai.slice(0,5).replace(':','.')}{e.jam_selesai?`–${e.jam_selesai.slice(0,5).replace(':','.')}`:''} WIB</span>}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <select
                              value={e.peran}
                              onChange={ev => setKolaboratorEvents(l => l.map(x => x.id===e.id ? {...x,peran:ev.target.value} : x))}
                              className="text-[10px] border border-[#e4e7d4] rounded-lg px-1.5 py-1 focus:outline-none focus:border-[#7a8a52] bg-white"
                            >
                              <option value="peserta">Peserta</option>
                              <option value="performer">Performer</option>
                              <option value="panitia">Panitia</option>
                            </select>
                            <select
                              value={e.status_kehadiran}
                              onChange={ev => setKolaboratorEvents(l => l.map(x => x.id===e.id ? {...x,status_kehadiran:ev.target.value} : x))}
                              className={`text-[10px] border border-[#e4e7d4] rounded-lg px-1.5 py-1 focus:outline-none focus:border-[#7a8a52] bg-white ${e.status_kehadiran==='hadir'?'text-[#7a8a52]':e.status_kehadiran==='tidak_hadir'?'text-[#B87272]':'text-[#8a9070]'}`}
                            >
                              <option value="terdaftar">Terdaftar</option>
                              <option value="hadir">Hadir ✓</option>
                              <option value="tidak_hadir">Tidak Hadir</option>
                            </select>
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

          {/* TAB: Portofolio */}
          {tab === 'portofolio' && !tabLoading && (
            <div className="p-5">
              {portfolio.length === 0
                ? <div className="py-12 text-center text-[#8a9070] text-sm"><Image size={28} className="text-gray-200 mx-auto mb-2"/>Belum ada portofolio</div>
                : <div className="space-y-2.5">
                    {portfolio.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-[#f7f8f2] rounded-[12px] border border-[#e4e7d4]">
                        <div className="w-10 h-10 rounded-lg bg-[#f7f2e4] flex items-center justify-center text-[#C4A24D] shrink-0">
                          <Image size={16}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1e2010] text-sm">{p.judul}</p>
                          <p className="text-[#8a9070] text-xs">{p.kategori} · {p.tahun}</p>
                        </div>
                        <button onClick={() => toggleFeatured(p.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${p.featured?'bg-[#f7f2e4] text-yellow-600 border border-[#dcc882]':'bg-[#eef0e0] text-[#8a9070] border border-[#e4e7d4] hover:border-yellow-300'}`}>
                          {p.featured ? <><Star size={11} fill="currentColor"/>Featured</> : <><StarOff size={11}/>Feature</>}
                        </button>
                        <button onClick={() => deletePorto(p.id)}
                          className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#B87272] hover:bg-[#f7eeee] transition" title="Hapus karya">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* TAB: Aktivitas */}
          {tab === 'aktivitas' && !tabLoading && (
            <div className="p-5 space-y-3">
              {stories.length === 0
                ? <div className="py-12 text-center text-[#8a9070] text-sm"><BookOpen size={28} className="text-gray-200 mx-auto mb-2"/>Belum ada aktivitas</div>
                : stories.map(s => (
                    <div key={s.id} className="bg-[#f7f8f2] rounded-[12px] p-4 border border-[#e4e7d4] group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[#5a6040] text-sm leading-relaxed flex-1">{s.konten}</p>
                        <button onClick={() => deleteAktivitas(s.id)} className="opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-[#B87272] p-1">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#8a9070]">
                        <span>{new Date(s.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span>
                        <span>👏 {s.like_count}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${s.status==='aktif'?'text-[#7a8a52]':'text-[#B87272]'}`}>{s.status}</span>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#e4e7d4] shrink-0 space-y-2">
          {tab === 'info' && !editInfo && (
            <button onClick={() => setEditInfo(true)}
              className="w-full flex items-center justify-center gap-2 border border-[#e4e7d4] text-[#5a6040] py-2 rounded-[12px] font-semibold text-sm hover:bg-[#f7f8f2] transition">
              <Edit3 size={14}/> Edit Info
            </button>
          )}
          {tab === 'info' && editInfo && (
            <div className="flex gap-2">
              <button onClick={async () => {
                setSaving(true);
                try {
                  await onUpdate(kolaborator.id, editFields);
                  setEditInfo(false);
                  toast.success('Profil kolaborator diperbarui');
                } catch (err) {
                  toast.error(extractError(err, 'Gagal memperbarui profil'));
                } finally { setSaving(false); }
              }} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] font-semibold text-sm transition disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Simpan
              </button>
              <button onClick={() => { setEditInfo(false); setEditFields({ nama:kolaborator.nama||'', kota:kolaborator.kota||'', bio:kolaborator.bio||'', email:kolaborator.email||'', no_hp:kolaborator.no_hp||'', subsektor:kolaborator.subsektor||[], internal_notes:kolaborator.internal_notes||'' }); }}
                className="px-4 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] font-semibold text-sm hover:bg-[#f7f8f2] transition">
                Batal
              </button>
            </div>
          )}
          <div className="flex gap-2.5">
            {kolaborator.status === 'pending'   && <button onClick={() => { onApprove(kolaborator.id); onClose(); }} className="flex-1 flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#7a8a52] text-white py-2.5 rounded-[12px] font-semibold text-sm transition"><CheckCircle size={15}/> Setujui</button>}
            {kolaborator.status === 'aktif'     && <button onClick={() => { onSuspend(kolaborator.id); onClose(); }} className="flex-1 flex items-center justify-center gap-2 border border-[#dbb8b8] text-[#B87272] py-2.5 rounded-[12px] font-semibold text-sm hover:bg-[#f7eeee] transition"><XCircle size={15}/> Suspend</button>}
            {kolaborator.status === 'suspended' && <button onClick={() => { onApprove(kolaborator.id); onClose(); }} className="flex-1 flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#7a8a52] text-white py-2.5 rounded-[12px] font-semibold text-sm transition"><UserCheck size={15}/> Aktifkan</button>}
            <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] font-semibold text-sm hover:bg-[#f7f8f2] transition">Tutup</button>
          </div>
        </div>

        {showAssignEvent && (
          <AssignEventModal
            kolaboratorId={kolaborator.id}
            existingIds={kolaboratorEvents.map(e => e.event_id)}
            onClose={() => setShowAssignEvent(false)}
            onAssign={handleAssignEvent}
            allEvents={allEvents}
          />
        )}
      </div>
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Kolaborator() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [kolaborators, setKolaborators] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [kolaboratorIdsInSelectedEvent, setKolaboratorIdsInSelectedEvent] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterSub, setFilterSub] = useState('Semua');
  const [filterEvent, setFilterEvent] = useState('semua');
  const [sortBy, setSortBy] = useState('newest');
  const [detail, setDetail] = useState(null);
  const [processing, setProcessing] = useState(null);
  const dSearch = useDebounce(search);

  const load = async () => {
    try {
      setKolaborators(await kolaboratorApi.list() || []);
    } catch (err) {
      toast.error(extractError(err, 'Gagal memuat data kolaborator'));
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-open drawer saat ada ?openId= query param
  useEffect(() => {
    const openId = searchParams.get('openId');
    if (!openId) return;
    kolaboratorApi.detail(openId)
      .then(data => { if (data && data.id) setDetail(data); })
      .catch(() => {})
      .finally(() => {
        setSearchParams(prev => { prev.delete('openId'); return prev; }, { replace: true });
      });
  }, []);

  // Load events for filter dropdown
  useEffect(() => {
    eventApi.list().then(list => setAllEvents(list || [])).catch(() => {});
  }, []);

  // When filter event changes, fetch kolaborator IDs in that event
  useEffect(() => {
    if (filterEvent === 'semua') { setKolaboratorIdsInSelectedEvent([]); return; }
    eventApi.kolaborators(filterEvent)
      .then(list => setKolaboratorIdsInSelectedEvent((list || []).map(k => k.kolaborator_id)))
      .catch(() => setKolaboratorIdsInSelectedEvent([]));
  }, [filterEvent]);

  const approve = async (id) => {
    setProcessing(id);
    try {
      await kolaboratorApi.status(id, 'aktif');
      toast.success('Kolaborator berhasil disetujui');
      try {
        const m = kolaborators.find(x=>x.id===id);
        const { triggerKolaboratorApproved } = await import('../lib/notifications');
        if (m) triggerKolaboratorApproved(m.nama);
      } catch {}
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal menyetujui kolaborator'));
    } finally {
      setProcessing(null);
    }
  };

  const suspend = async (id) => {
    setProcessing(id);
    try {
      await kolaboratorApi.status(id, 'suspended');
      toast.error('Akun disuspend');
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal mensuspend akun'));
    } finally {
      setProcessing(null);
    }
  };

  const updateKolaborator = async (id, data) => {
    await kolaboratorApi.update(id, data);
    await load();
  };

  const deleteKolaborator = async (id) => {
    if (!confirm('Hapus akun ini secara permanen? Data akan diarsipkan dan tidak bisa dipulihkan.')) return;
    setProcessing(id);
    try {
      await kolaboratorApi.status(id, 'deleted');
      toast.error('Akun dihapus (diarsipkan)');
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal menghapus akun'));
    } finally {
      setProcessing(null);
    }
  };

  const SORT_FNS = {
    newest:    (a,b) => new Date(b.tanggal_daftar) - new Date(a.tanggal_daftar),
    oldest:    (a,b) => new Date(a.tanggal_daftar) - new Date(b.tanggal_daftar),
    name_asc:  (a,b) => a.nama.localeCompare(b.nama),
    name_desc: (a,b) => b.nama.localeCompare(a.nama),
    most_works:(a,b) => (b.total_karya||0) - (a.total_karya||0),
  };

  const filtered = kolaborators
    .filter(m => m.status !== 'deleted')
    .filter(m => {
      const matchQ = !dSearch || m.nama.toLowerCase().includes(dSearch.toLowerCase()) || m.email.toLowerCase().includes(dSearch.toLowerCase());
      const matchS = filterStatus==='semua' || m.status===filterStatus;
      const matchSub = filterSub==='Semua' || (m.subsektor||[]).includes(filterSub);
      const matchEv = filterEvent==='semua' || kolaboratorIdsInSelectedEvent.includes(m.id);
      return matchQ && matchS && matchSub && matchEv;
    })
    .sort(SORT_FNS[sortBy] || SORT_FNS.newest);

  const active = kolaborators.filter(m=>m.status!=='deleted');
  const counts = {
    semua:     active.length,
    aktif:     active.filter(m=>m.status==='aktif').length,
    pending:   active.filter(m=>m.status==='pending').length,
    suspended: active.filter(m=>m.status==='suspended').length,
  };

  return (
    <div className="space-y-5">
      <style>{`.animate-in{animation:slideIn .26s cubic-bezier(.32,.72,0,1) both}@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[['Total Kolaborator',counts.semua,'bg-indigo-600'],['Aktif',counts.aktif,'bg-[#7a8a52]'],['Pending',counts.pending,'bg-[#C4A24D]'],['Suspend',counts.suspended,'bg-[#B87272]']].map(([l,v,c]) => (
          <div key={l} className="bg-white rounded-[16px] p-4 border border-[#e4e7d4]">
            <p className="text-2xl font-bold text-[#1e2010]">{v}</p>
            <div className="flex items-center gap-2 mt-1"><div className={`w-2 h-2 rounded-full ${c}`}/><p className="text-[#8a9070] text-xs">{l}</p></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-[16px] border border-[#e4e7d4] overflow-hidden">

        {/* Row 1: Search */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9070]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama atau email..."
              className="w-full pl-9 pr-4 py-2.5 border border-[#e4e7d4] rounded-[12px] text-sm focus:outline-none focus:border-indigo-400 transition"/>
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold text-[#8a9070] uppercase tracking-wider shrink-0">Filter:</span>

          <div className="flex gap-1.5 flex-wrap">
            {['semua','aktif','pending','suspended'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border
                  ${filterStatus===s
                    ? s==='aktif' ? 'bg-[#7a8a52] text-white border-[#7a8a52]'
                    : s==='pending' ? 'bg-[#C4A24D] text-white border-amber-500'
                    : s==='suspended' ? 'bg-[#B87272] text-white border-red-500'
                    : 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-[#f7f8f2] text-[#5a6040] border-[#e4e7d4] hover:border-[#c8ccb0]'}`}>
                {s === 'semua' ? 'Semua' : STATUS_MAP[s]?.label || s}
                {s !== 'semua' && counts[s] > 0 && (
                  <span className="ml-1.5 opacity-75">({counts[s]})</span>
                )}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200 shrink-0"/>

          <select value={filterSub} onChange={e=>setFilterSub(e.target.value)}
            className="px-3 py-1.5 border border-[#e4e7d4] rounded-lg text-xs text-[#5a6040] bg-[#f7f8f2] focus:outline-none focus:border-indigo-400 transition">
            {SUBSEKTORS.map(s => <option key={s}>{s}</option>)}
          </select>

          <select value={filterEvent} onChange={e=>setFilterEvent(e.target.value)}
            className="px-3 py-1.5 border border-[#e4e7d4] rounded-lg text-xs text-[#5a6040] bg-[#f7f8f2] focus:outline-none focus:border-indigo-400 transition">
            <option value="semua">Semua Event</option>
            {allEvents.map(e => <option key={e.id} value={e.id}>{e.nama}</option>)}
          </select>
        </div>

        {/* Row 3: Sort */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <p className="text-xs text-[#8a9070]">
            {filtered.length} dari {active.length} anggota
            {filterEvent !== 'semua' && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-semibold">
                🎪 {allEvents.find(e=>e.id===filterEvent)?.nama?.slice(0,20)}
                <button onClick={()=>setFilterEvent('semua')} className="hover:text-[#B87272] ml-0.5">×</button>
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8a9070] uppercase tracking-wider">Urutkan:</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-[#e4e7d4] rounded-lg text-xs text-[#5a6040] bg-[#f7f8f2] focus:outline-none focus:border-indigo-400 transition">
              <option value="newest">Terbaru Daftar</option>
              <option value="oldest">Terlama Daftar</option>
              <option value="name_asc">Nama A–Z</option>
              <option value="name_desc">Nama Z–A</option>
              <option value="most_works">Terbanyak Karya</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#e4e7d4] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#e4e7d4] bg-[#f7f8f2]/80">
              {['Kolaborator','Subsektor / Kota','Status','Karya','Terdaftar','Aksi'].map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-[#8a9070] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} className="px-5 py-12 text-center text-[#8a9070] text-sm">Tidak ada hasil</td></tr>
              : filtered.map(m => <KolaboratorRow key={m.id} m={m} onApprove={approve} onSuspend={suspend} onDetail={setDetail} onDelete={deleteKolaborator} isProcessing={processing}/>)
            }
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-50 text-xs text-[#8a9070] flex items-center justify-between">
          <span>Menampilkan {filtered.length} dari {kolaborators.length} Kolaborator</span>
          {filterEvent !== 'semua' && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
              🎪 {allEvents.find(e=>e.id===filterEvent)?.nama}
              <button onClick={()=>setFilterEvent('semua')} className="hover:text-[#B87272] transition">×</button>
            </span>
          )}
        </div>
      </div>

      <DetailDrawer kolaborator={detail} onClose={() => setDetail(null)} onApprove={approve} onSuspend={suspend} onUpdate={updateKolaborator} allEvents={allEvents}/>
    </div>
  );
}
