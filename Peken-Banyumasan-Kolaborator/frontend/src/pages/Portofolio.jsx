import React, { useState, useEffect } from 'react';
import { Plus, Image, Trash2, Star, Edit2, X, Save, Loader2, Palette } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { SUBSEKTORS } from '../data/dummy';
import ImageUpload from '../components/ImageUpload';

const COLORS = ['bg-brand-100','bg-batik-100','bg-earth-100','bg-green-100','bg-rose-100','bg-sky-100'];
const TEXTS  = ['text-brand-700','text-batik-700','text-earth-700','text-green-700','text-rose-700','text-sky-700'];

const KaryaCard = ({ karya, onEdit, onDelete, idx }) => (
  <div className={`${COLORS[idx%6]} rounded-2xl overflow-hidden border border-white/60 group relative`}>
    {/* Gambar karya atau placeholder */}
    {karya.gambar
      ? <img src={karya.gambar} alt={karya.judul} className="w-full h-40 object-cover"/>
      : <div className={`${COLORS[idx%6]} h-40 flex items-center justify-center`}>
          <Palette size={36} className={`${TEXTS[idx%6]} opacity-40`}/>
        </div>
    }
    {karya.featured && (
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-brand-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
        <Star size={9} fill="white"/> Featured
      </div>
    )}
    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
      <button onClick={() => onEdit(karya)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow text-earth-600 hover:text-batik-700 transition">
        <Edit2 size={13}/>
      </button>
      <button onClick={() => onDelete(karya.id)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow text-earth-600 hover:text-red-500 transition">
        <Trash2 size={13}/>
      </button>
    </div>
    <div className="p-4">
      <p className="font-display font-semibold text-earth-900 text-sm leading-tight">{karya.judul}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-[11px] font-medium ${TEXTS[idx%6]}`}>{karya.subsektor}</span>
        <span className="text-earth-400 text-[11px]">{karya.tahun}</span>
      </div>
      <p className="text-earth-500 text-xs mt-2 line-clamp-2 leading-relaxed">{karya.deskripsi}</p>
    </div>
  </div>
);

const EMPTY = { judul:'', subsektor:'Kriya', deskripsi:'', tahun: new Date().getFullYear(), featured:false, gambar:'' };

export default function Portofolio() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.portofolio.list().then(r => { setList(r.data); setLoading(false); });
  }, []);

  const openAdd  = () => { setForm(EMPTY); setEditItem(null); setShowModal(true); };
  const openEdit = (k) => { setForm({...k}); setEditItem(k); setShowModal(true); };

  const save = async () => {
    if (!form.judul.trim()) { toast.error('Judul karya wajib diisi'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await api.portofolio.update(editItem.id, form);
        setList(l => l.map(x => x.id === editItem.id ? {...x,...form} : x));
        toast.success('Karya berhasil diperbarui');
      } else {
        const res = await api.portofolio.create(form);
        setList(l => [res.data, ...l]);
        toast.success('Karya berhasil ditambahkan');
      }
      setShowModal(false);
    } catch { toast.error('Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Hapus karya ini?')) return;
    await api.portofolio.delete(id);
    setList(l => l.filter(x => x.id !== id));
    toast.success('Karya dihapus');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-earth-900">Portofolio</h1>
          <p className="text-earth-500 text-sm mt-0.5">{list.length} karya • tampil di profil publik</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
          <Plus size={16}/> Tambah Karya
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="bg-earth-100 rounded-2xl h-56 animate-pulse"/>)}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-100 p-12 text-center">
          <Image size={40} className="text-earth-200 mx-auto mb-3"/>
          <h3 className="font-display text-earth-700 font-semibold mb-1">Belum ada karya</h3>
          <p className="text-earth-400 text-sm mb-4">Tambahkan karya pertamamu untuk ditampilkan di profil publik</p>
          <button onClick={openAdd} className="bg-brand-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-600 transition">
            <Plus size={14} className="inline mr-1"/> Tambah Karya Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {list.map((k, i) => <KaryaCard key={k.id} karya={k} idx={i} onEdit={openEdit} onDelete={del}/>)}
          <button onClick={openAdd}
            className="border-2 border-dashed border-earth-200 rounded-2xl h-48 flex flex-col items-center justify-center gap-2 text-earth-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50 transition">
            <Plus size={24}/>
            <span className="text-sm font-medium">Tambah Karya</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-earth-900">{editItem ? 'Edit Karya' : 'Tambah Karya Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-earth-400 hover:text-earth-600"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              {/* Foto karya */}
              <ImageUpload
                value={form.gambar}
                onChange={v => setForm(p => ({...p, gambar: v}))}
                label="Foto Karya (opsional)"
                hint="JPG, PNG, WebP · maks 5 MB"
                shape="wide"
              />
              <div>
                <label className="text-earth-600 text-sm mb-1.5 block">Judul Karya *</label>
                <input value={form.judul} onChange={e=>setForm(p=>({...p,judul:e.target.value}))}
                  placeholder="Nama karya kamu" className="w-full border border-earth-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 transition"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-earth-600 text-sm mb-1.5 block">Subsektor</label>
                  <select value={form.subsektor} onChange={e=>setForm(p=>({...p,subsektor:e.target.value}))}
                    className="w-full border border-earth-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 transition bg-white">
                    {SUBSEKTORS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-earth-600 text-sm mb-1.5 block">Tahun</label>
                  <input type="number" value={form.tahun} onChange={e=>setForm(p=>({...p,tahun:+e.target.value}))}
                    min="2000" max="2099" className="w-full border border-earth-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 transition"/>
                </div>
              </div>
              <div>
                <label className="text-earth-600 text-sm mb-1.5 block">Deskripsi</label>
                <textarea value={form.deskripsi} onChange={e=>setForm(p=>({...p,deskripsi:e.target.value}))} rows={3}
                  placeholder="Ceritakan tentang karya ini..." className="w-full border border-earth-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 transition resize-none"/>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm(p=>({...p,featured:!p.featured}))}
                  className={`w-10 h-6 rounded-full transition-colors ${form.featured?'bg-brand-500':'bg-earth-200'} relative`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.featured?'left-5':'left-1'}`}/>
                </div>
                <span className="text-earth-700 text-sm font-medium">Tampilkan sebagai karya unggulan</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-earth-200 text-earth-600 py-2.5 rounded-xl text-sm font-medium hover:bg-earth-50 transition">Batal</button>
                <button onClick={save} disabled={saving}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={14} className="animate-spin"/>Menyimpan...</> : <><Save size={14}/>Simpan</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
