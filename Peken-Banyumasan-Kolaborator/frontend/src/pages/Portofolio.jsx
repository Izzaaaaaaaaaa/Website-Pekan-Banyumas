// Portofolio.jsx — Peken Banyumasan Design System v2.0
import React, { useState, useEffect } from 'react';
import { Plus, Image, Trash2, Star, Edit2, X, Save, Loader2 } from 'lucide-react';
import { portofolioApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';
import { useToast } from '../components/Toast';
import { SUBSEKTOR } from '../constants/subsektor';
import ImageUpload from '../components/ImageUpload';
import { T } from '../lib/tokens';

// Sage-tinted placeholder backgrounds cycling through hues
const CARD_BG  = ['#eef0e0','#eaf0f4','#f7f2e4','#eeeef8','#f7eeee','#eef4eb'];
const CARD_FG  = ['#4F5C30','#6B8FA3','#C4A24D','#7A80B0','#B87272','#7A9B6A'];

const KaryaCard = ({ karya, onEdit, onDelete, idx }) => (
  <div className="rounded-2xl overflow-hidden group relative"
    style={{
      border:'1px solid #e4e7d4',
      boxShadow:'0 1px 3px rgba(30,32,16,.06)',
      background:'#fff',
    }}>
    {karya.gambar_url
      ? <img src={karya.gambar_url} alt={karya.judul} className="w-full h-40 object-cover"/>
      : <div className="h-40 flex items-center justify-center"
          style={{background:CARD_BG[idx%6]}}>
          <Image size={36} style={{color:CARD_FG[idx%6], opacity:.4}}/>
        </div>
    }
    {karya.featured && (
      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
        style={{background:T.accent, color:T.charcoal}}>
        <Star size={9} fill={T.charcoal}/> Unggulan
      </div>
    )}
    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
      <button onClick={() => onEdit(karya)}
        className="w-7 h-7 rounded-lg flex items-center justify-center shadow transition"
        style={{background:'#fff', color:'#5a6040'}}>
        <Edit2 size={13}/>
      </button>
      <button onClick={() => onDelete(karya.id)}
        className="w-7 h-7 rounded-lg flex items-center justify-center shadow transition"
        style={{background:T.surface, color:T.error}}>
        <Trash2 size={13}/>
      </button>
    </div>
    <div className="p-4">
      <p className="font-semibold text-sm leading-tight" style={{color:T.text1}}>
        {karya.judul}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] font-medium" style={{color:CARD_FG[idx%6]}}>
          {karya.subsektor}
        </span>
        <span className="text-[11px]" style={{color:T.textMuted}}>{karya.tahun}</span>
      </div>
      <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{color:T.textMuted}}>
        {karya.deskripsi}
      </p>
    </div>
  </div>
);

const EMPTY = { judul:'', subsektor:'Kriya', deskripsi:'', tahun: new Date().getFullYear(), featured:false, gambar_url:'' };

const inputStyle = {
  width:'100%', padding:'11px 14px',
  border:`1px solid ${T.border}`, borderRadius:12,
  fontSize:14, fontFamily:'Montserrat, sans-serif',
  color:T.text1, background:T.surface, outline:'none',
};
const labelStyle = {
  display:'block', fontSize:11, fontWeight:600,
  color:T.text2, marginBottom:6,
  letterSpacing:'.04em', textTransform:'uppercase',
};

export default function Portofolio() {
  const toast = useToast();
  const [list,      setList]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const items = await portofolioApi.list();
        setList(items || []);
      } catch (err) { toast.error(extractError(err, 'Gagal memuat portofolio')); }
      finally { setLoading(false); }
    })();
  }, [toast]);

  const openAdd  = () => { setForm(EMPTY); setEditItem(null); setShowModal(true); };
  const openEdit = k  => { setForm({...k}); setEditItem(k); setShowModal(true); };

  const save = async () => {
    if (!form.judul.trim()) { toast.error('Judul karya wajib diisi'); return; }
    setSaving(true);
    // Create/PatchKaryaBody forbid extras — send only the editable fields
    // (the edit form carries id/owner_*/timestamps from the loaded Karya).
    const body = {
      judul:      form.judul,
      subsektor:  form.subsektor,
      deskripsi:  form.deskripsi,
      tahun:      form.tahun,
      featured:   form.featured,
      gambar_url: form.gambar_url || null,
    };
    try {
      if (editItem) {
        const updated = await portofolioApi.update(editItem.id, body);
        setList(l => l.map(x => x.id === editItem.id ? {...x,...body,...(updated||{})} : x));
        toast.success('Karya berhasil diperbarui');
      } else {
        const created = await portofolioApi.create(body);
        setList(l => [created, ...l]);
        toast.success('Karya berhasil ditambahkan');
      }
      setShowModal(false);
    } catch (err) { toast.error(extractError(err, 'Gagal menyimpan')); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Hapus karya ini?')) return;
    try {
      await portofolioApi.delete(id);
      setList(l => l.filter(x => x.id !== id));
      toast.success('Karya dihapus');
    } catch (err) { toast.error(extractError(err, 'Gagal menghapus karya')); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-medium" style={{color:T.text1}}>Portofolio</h1>
          <p className="text-sm mt-0.5" style={{color:T.textMuted}}>
            {list.length} karya — tampil di profil publik
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          style={{background:T.sageDark, borderRadius:20}}>
          <Plus size={15}/> Tambah Karya
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="rounded-2xl h-56 animate-pulse" style={{background:T.border}}/>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl p-12 text-center"
          style={{background:T.surface, border:`1px solid ${T.border}`, boxShadow:T.shadowSm}}>
          <Image size={40} className="mx-auto mb-3" style={{color:T.borderStrong}}/>
          <h3 className="font-semibold text-sm mb-1" style={{color:T.text2}}>
            Belum ada karya
          </h3>
          <p className="text-sm mb-4" style={{color:T.textMuted}}>
            Tambahkan karya pertamamu untuk ditampilkan di profil publik
          </p>
          <button onClick={openAdd}
            className="text-white px-5 py-2 text-sm font-semibold transition"
            style={{background:T.sageDark, borderRadius:20}}>
            <Plus size={14} className="inline mr-1"/> Tambah Karya Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {list.map((k, i) => (
            <KaryaCard key={k.id} karya={k} idx={i} onEdit={openEdit} onDelete={del}/>
          ))}
          <button onClick={openAdd}
            className="rounded-2xl h-48 flex flex-col items-center justify-center gap-2 transition-colors"
            style={{border:`1.5px dashed ${T.accentBorder}`, color:T.textMuted}}>
            <Plus size={22}/>
            <span className="text-sm font-medium">Tambah Karya</span>
          </button>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{background:'rgba(13,13,13,0.55)'}}
          onClick={() => setShowModal(false)}>
          <div className="rounded-2xl w-full max-w-md p-6 shadow-2xl"
            style={{background:T.surface, border:`1px solid ${T.border}`}}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-sm" style={{color:T.text1}}>
                {editItem ? 'Edit Karya' : 'Tambah Karya Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{color:T.textMuted}}>
                <X size={20}/>
              </button>
            </div>
            <div className="space-y-4">
              <ImageUpload
                value={form.gambar_url}
                onChange={v => setForm(p => ({...p, gambar_url:v}))}
                label="Foto Karya (opsional)"
                hint="JPG, PNG, WebP · maks 5 MB"
                shape="wide"
              />
              <div>
                <label style={labelStyle}>Judul Karya *</label>
                <input
                  value={form.judul}
                  onChange={e => setForm(p => ({...p, judul:e.target.value}))}
                  placeholder="Nama karya"
                  style={inputStyle}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Subsektor</label>
                  <select
                    value={form.subsektor}
                    onChange={e => setForm(p => ({...p, subsektor:e.target.value}))}
                    style={{...inputStyle, cursor:'pointer'}}>
                    {SUBSEKTOR.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tahun</label>
                  <input
                    type="number"
                    value={form.tahun}
                    onChange={e => setForm(p => ({...p, tahun:+e.target.value}))}
                    min="2000" max="2099"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Deskripsi</label>
                <textarea
                  value={form.deskripsi}
                  onChange={e => setForm(p => ({...p, deskripsi:e.target.value}))}
                  rows={3}
                  placeholder="Ceritakan tentang karya ini..."
                  style={{...inputStyle, resize:'none', lineHeight:1.6}}
                />
              </div>

              {/* Featured toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(p => ({...p, featured:!p.featured}))}
                  className="relative"
                  style={{
                    width:40, height:22, borderRadius:11,
                    background: form.featured ? T.sageDark : T.border,
                    transition:'background .18s', flexShrink:0,
                  }}>
                  <div style={{
                    position:'absolute', top:3,
                    left: form.featured ? 21 : 3,
                    width:16, height:16, borderRadius:'50%',
                    background:T.surface, boxShadow:'0 1px 2px rgba(0,0,0,.15)',
                    transition:'left .18s',
                  }}/>
                </div>
                <span className="text-sm font-medium" style={{color:T.text2}}>
                  Tampilkan sebagai karya unggulan
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
                  style={{border:`1px solid ${T.border}`, color:T.text2, background:T.surface}}>
                  Batal
                </button>
                <button onClick={save} disabled={saving}
                  className="flex-1 text-white py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2"
                  style={{background:T.sageDark, borderRadius:12}}>
                  {saving
                    ? <><Loader2 size={14} className="animate-spin"/>Menyimpan...</>
                    : <><Save size={14}/>Simpan</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
