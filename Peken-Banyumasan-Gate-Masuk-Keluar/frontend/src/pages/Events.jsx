// Events.jsx — Kelola Event + Publikasi ke Beranda (revisi dengan field baru)
import React, { useState, useEffect } from 'react';
import {
  Plus, Calendar, MapPin, Edit3, Trash2, Eye, EyeOff, X, Save, Loader2,
  Users, Tag, FileText, Settings, Bell
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import { eventApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';
import { SUBSEKTOR } from '../constants/subsektor';


// ── Preview tanggal Indonesia ────────────────────────────────────────────────
// Picker native <input type=date/time> tampil mengikuti BAHASA BROWSER user
// (tidak bisa dipaksa via kode). Preview ini menjamin pembacaan Indonesia
// (Senin, 22 Juni 2026 · 09.00-21.00 WIB) apa pun locale browser-nya.
import { TanggalInput, JamInput } from '../components/PickerID';

const HARI_ID  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const fmtTglIndo = (iso) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d)) return '';
  return `${HARI_ID[d.getDay()]}, ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
};
const fmtJadwalIndo = (f) => {
  const tgl = fmtTglIndo(f.tanggal);
  if (!tgl) return '';
  const akhir = f.tanggal_selesai && f.tanggal_selesai !== f.tanggal ? ` — ${fmtTglIndo(f.tanggal_selesai)}` : '';
  const jam = f.jam_mulai ? ` · ${f.jam_mulai.slice(0,5).replace(':','.')}${f.jam_selesai ? `–${f.jam_selesai.slice(0,5).replace(':','.')}` : ''} WIB` : '';
  return `${tgl}${akhir}${jam}`;
};

const EMPTY = { nama:'', tanggal:'', jam_mulai:'08:00', jam_selesai:'22:00', tanggal_selesai:'', lokasi:'', deskripsi:'', konten_lengkap:'', kapasitas:100, status:'draft', subsektor:[], banner_url:'', galeri:[] };
const fmtTgl = d => d ? new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '';
const STATUS_CLS = {
  published:   'bg-[#eef0e0] text-[#7a8a52] border-[#c8d09a]',
  draft:       'bg-[#f7f8f2] text-[#8a9070] border-[#e4e7d4]',
  selesai:     'bg-[#f7f2e4] text-[#C4A24D] border-[#dcc882]',
  berlangsung: 'bg-[#eaf0f4] text-[#6B8FA3] border-[#b0c8d8]',
};
const STATUS_LABEL = {
  published:   'Akan Datang',
  draft:       'Draf',
  berlangsung: 'Berlangsung',
  selesai:     'Selesai',
};
// Effective status (derived from schedule) drives display; raw `status`
// (draft|published) still drives the publish/hide toggle.
const evStatus = (ev) => ev.status_efektif || ev.status;

function EventFormModal({ editItem, onClose, onSave }) {
  const [form, setForm] = useState(editItem ? {...editItem} : EMPTY);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleSub = (s) => set('subsektor', (form.subsektor||[]).includes(s)
    ? form.subsektor.filter(x => x !== s)
    : [...(form.subsektor||[]), s]);

  const save = async () => {
    if (!form.nama || !form.tanggal || !form.jam_mulai) { toast.error('Nama, tanggal, dan jam mulai wajib diisi'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      // error sudah di-toast oleh handleSave di parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#e4e7d4] shrink-0">
          <h3 className="font-bold text-[#1e2010]">{editItem ? 'Edit Event' : 'Buat Event Baru'}</h3>
          <button onClick={onClose} className="text-[#8a9070] hover:text-[#5a6040]"><X size={20}/></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">Nama Event *</label>
            <input value={form.nama} onChange={e => set('nama', e.target.value)} placeholder="Nama event"
              className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">Tanggal Mulai *</label>
              <TanggalInput value={form.tanggal} onChange={v => set('tanggal', v)} />
            </div>
            <div>
              <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">Tanggal Selesai</label>
              <TanggalInput value={form.tanggal_selesai} onChange={v => set('tanggal_selesai', v)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">🕐 Jam Mulai *</label>
              <JamInput value={form.jam_mulai} onChange={v => set('jam_mulai', v)} />
            </div>
            <div>
              <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">🕐 Jam Selesai</label>
              <JamInput value={form.jam_selesai} onChange={v => set('jam_selesai', v)} />
            </div>
          </div>
          {fmtJadwalIndo(form) && (
            <p className="text-[11px] font-medium text-[#7a8a52] -mt-1.5">
              📅 {fmtJadwalIndo(form)}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">Lokasi</label>
              <input value={form.lokasi} onChange={e => set('lokasi', e.target.value)} placeholder="Nama tempat"
                className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition"/>
            </div>
            <div>
              <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">Kapasitas</label>
              <input type="number" value={form.kapasitas} onChange={e => set('kapasitas', +e.target.value)}
                className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition"/>
            </div>
          </div>
          <div>
            <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">Status Publikasi</label>
            <select value={form.status === 'draft' ? 'draft' : 'published'} onChange={e => set('status', e.target.value)}
              className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition bg-white">
              <option value="draft">Draf — belum tampil ke publik</option>
              <option value="published">Published — tampil ke publik</option>
            </select>
            <p className="text-[11px] text-[#8a9070] mt-1.5">
              Status acara (Akan Datang / Berlangsung / Selesai) dihitung otomatis dari tanggal &amp; jam.
            </p>
          </div>
          {/* Banner photo upload */}
          <ImageUpload
            value={form.banner_url}
            onChange={v => set('banner_url', v)}
            label="Foto Banner Event"
            hint="JPG, PNG, WebP · maks 5 MB · disarankan 16:9"
            shape="wide"
          />
          <div>
            <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">Deskripsi Singkat</label>
            <textarea value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} rows={2}
              className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition resize-none"/>
          </div>
          <div>
            <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block flex items-center gap-1.5"><FileText size={12}/>Konten Lengkap</label>
            <textarea value={form.konten_lengkap} onChange={e => set('konten_lengkap', e.target.value)} rows={4}
              placeholder="Deskripsi detail, jadwal, informasi tambahan..."
              className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition resize-none"/>
          </div>
          <div>
            <label className="text-[#5a6040] text-xs font-semibold mb-2 block flex items-center gap-1.5"><Tag size={12}/>Subsektor Budaya</label>
            <div className="flex flex-wrap gap-1.5">
              {SUBSEKTOR.map(s => (
                <button key={s} type="button" onClick={() => toggleSub(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${(form.subsektor||[]).includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-[#f7f8f2] text-[#5a6040] border-[#e4e7d4] hover:border-indigo-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[#e4e7d4] shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-semibold hover:bg-[#f7f8f2] transition">Batal</button>
          <button onClick={save} disabled={saving}
            className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin"/>Menyimpan...</> : <><Save size={14}/>Simpan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [pendingCounts, setPendingCounts] = useState({});

  const fetchPendingCounts = async (eventList) => {
    const counts = {};
    await Promise.allSettled(
      eventList.map(async (ev) => {
        try {
          const reqs = await eventApi.artisanRequests(ev.id);
          counts[ev.id] = (reqs || []).filter(r => r.status_request === 'pending').length;
        } catch { counts[ev.id] = 0; }
      })
    );
    setPendingCounts(counts);
  };

  const load = async () => {
    try {
      const list = await eventApi.list();
      setEvents(list || []);
      fetchPendingCounts(list || []);
    } catch (err) {
      toast.error(extractError(err, 'Gagal memuat daftar event'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditItem(null); setModal(true); };
  const openEdit = (e, ev) => { e.stopPropagation(); setEditItem({...ev}); setModal(true); };

  const handleSave = async (form) => {
    try {
      // CreateEventBody forbids extras — drop every read-only/derived field the
      // edit form carries from the loaded Event (id, peserta_count, the derived
      // status_efektif, and timestamps). Sending status_efektif tripped a 422
      // on save. Default tanggal_selesai to the start date for single-day events.
      const { id, peserta_count, status_efektif, created_at, updated_at, ...body } = form;
      if (!body.tanggal_selesai) body.tanggal_selesai = body.tanggal;
      if (editItem) {
        await eventApi.update(editItem.id, body);
        toast.success('Event diperbarui');
      } else {
        await eventApi.create(body);
        toast.success('Event dibuat');
      }
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal menyimpan event'));
      throw err; // modal tetap terbuka jika gagal
    }
  };

  const del = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Hapus event ini?')) return;
    try {
      await eventApi.delete(id);
      toast.success('Event dihapus');
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal menghapus event'));
    }
  };

  const togglePublish = async (e, id) => {
    e.stopPropagation();
    const ev = events.find(ev => ev.id === id);
    const next = ev?.status === 'published' ? 'draft' : 'published';
    try {
      await eventApi.status(id, next);
      toast.success(next === 'published' ? 'Event dipublikasikan' : 'Event disembunyikan');
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal mengubah status'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Draf',        events.filter(e=>e.status==='draft').length,            'bg-[#f7f8f2] text-[#5a6040]'],
          ['Akan Datang', events.filter(e=>evStatus(e)==='published').length,     'bg-[#eef0e0] text-[#7a8a52]'],
          ['Berlangsung', events.filter(e=>evStatus(e)==='berlangsung').length,   'bg-[#eaf0f4] text-[#6B8FA3]'],
          ['Selesai',     events.filter(e=>evStatus(e)==='selesai').length,       'bg-[#f7f2e4] text-[#C4A24D]'],
        ].map(([l,v,cls]) => (
          <div key={l} className={`${cls} rounded-[16px] p-4 border border-white/60`}>
            <p className="text-2xl font-bold">{v}</p>
            <p className="text-sm font-medium opacity-80 mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[#8a9070] text-sm">{loading ? '…' : `${events.length} total event`}</p>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-4 py-2.5 rounded-[12px] text-sm font-semibold transition">
          <Plus size={16}/> Buat Event Baru
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#8a9070]">
          <Loader2 size={20} className="animate-spin mr-2"/> Memuat event...
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {events.map(ev => (
            <div key={ev.id} className={`bg-white rounded-[16px] border overflow-hidden hover:shadow-md transition-shadow
              ${evStatus(ev)==='published' ? 'border-[#c8d09a]' : evStatus(ev)==='berlangsung' ? 'border-[#b0c8d8]' : 'border-[#e4e7d4]'}`}>
              <div className="w-full h-2 bg-gradient-to-r from-green-200 via-yellow-100 to-orange-100"/>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-[#1e2010] text-sm leading-snug">{ev.nama}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_CLS[evStatus(ev)]}`}>{STATUS_LABEL[evStatus(ev)] || evStatus(ev)}</span>
                      {pendingCounts[ev.id] > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Bell size={9} /> {pendingCounts[ev.id]} pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[#8a9070] text-xs"><Calendar size={11}/>{fmtTgl(ev.tanggal)}{ev.tanggal_selesai && ev.tanggal_selesai !== ev.tanggal && ` — ${fmtTgl(ev.tanggal_selesai)}`}{ev.jam_mulai && ` · ${ev.jam_mulai.replace(':','.')}${ev.jam_selesai ? ` – ${ev.jam_selesai.replace(':','.')}` : ''} WIB`}</div>
                    <div className="flex items-center gap-1 text-[#8a9070] text-xs mt-0.5"><MapPin size={11}/>{ev.lokasi}</div>
                  </div>
                </div>
                {(ev.subsektor || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(ev.subsektor || []).slice(0,3).map(s => <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded font-medium">{s}</span>)}
                    {(ev.subsektor || []).length > 3 && <span className="text-[#8a9070] text-[10px]">+{(ev.subsektor || []).length-3}</span>}
                  </div>
                )}
                <p className="text-[#8a9070] text-xs leading-relaxed line-clamp-2">{ev.deskripsi}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#8a9070] flex items-center gap-1"><Users size={11}/>{ev.peserta_count} / {ev.kapasitas} peserta</span>
                    <span className="text-xs font-semibold text-[#7a8a52]">{Math.round(ev.peserta_count/ev.kapasitas*100)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#eef0e0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7a8a52] rounded-full" style={{width:`${Math.min(100,ev.peserta_count/ev.kapasitas*100)}%`}}/>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between gap-1.5">
                <Link to={`/events/${ev.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eef0e0] hover:bg-[#eef4eb] text-[#7a8a52] rounded-lg text-xs font-semibold transition">
                  <Settings size={12}/> Kelola
                </Link>
                <div className="flex items-center gap-1">
                  {evStatus(ev) !== 'selesai' && (
                    <button onClick={(e) => togglePublish(e, ev.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition
                        ${ev.status==='published' ? 'text-[#8a9070] hover:bg-[#eef0e0]' : 'text-[#7a8a52] hover:bg-[#eef0e0]'}`}>
                      {ev.status==='published' ? <><EyeOff size={13}/>Sembunyikan</> : <><Eye size={13}/>Publikasi</>}
                    </button>
                  )}
                  <button onClick={(e) => openEdit(e, ev)}
                    className="p-1.5 rounded-lg text-[#8a9070] hover:text-indigo-600 hover:bg-indigo-50 transition"><Edit3 size={14}/></button>
                  <button onClick={(e) => del(e, ev.id)}
                    className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#B87272] hover:bg-[#f7eeee] transition"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <EventFormModal editItem={editItem} onClose={() => setModal(false)} onSave={handleSave}/>}
    </div>
  );
}
