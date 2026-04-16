import React, { useState } from 'react';
import { User, MapPin, Edit2, Save, X, CheckCircle, ExternalLink } from 'lucide-react';
import api, { getUser } from '../services/api';
import { useToast } from '../components/Toast';
import { SUBSEKTORS } from '../data/dummy';
import ImageUpload from '../components/ImageUpload';

export default function Profil() {
  const toast = useToast();
  const [user, setUser] = useState(getUser() || {});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nama: user.nama||'', kota: user.kota||'',
    bio: user.bio||'', subsektor: user.subsektor||[],
    foto_url: user.foto_url||''
  });
  const [saving, setSaving] = useState(false);

  const toggleSub = s => setForm(p => ({
    ...p, subsektor: p.subsektor.includes(s) ? p.subsektor.filter(x=>x!==s) : [...p.subsektor, s]
  }));

  const save = async () => {
    setSaving(true);
    try {
      await api.profil.update(form);
      setUser(u => ({...u, ...form}));
      setEditing(false);
      toast.success('Profil berhasil diperbarui');
    } catch { toast.error('Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const initial = (form.nama || 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Avatar card */}
      <div className="bg-white rounded-2xl p-6 border border-earth-100">
        <div className="flex items-start gap-4">
          {/* Avatar — shows upload if editing */}
          {editing ? (
            <div className="w-24 shrink-0">
              <ImageUpload
                value={form.foto_url}
                onChange={v => setForm(p => ({...p, foto_url: v}))}
                label=""
                shape="circle"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold">
              {form.foto_url
                ? <img src={form.foto_url} alt="" className="w-full h-full object-cover"/>
                : initial
              }
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl font-bold text-earth-900">{form.nama}</h2>
              <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                <CheckCircle size={10}/> Terverifikasi
              </span>
            </div>
            {form.kota && (
              <p className="text-earth-500 text-sm flex items-center gap-1 mt-1">
                <MapPin size={12}/> {form.kota}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(form.subsektor||[]).map(s => (
                <span key={s} className="px-2 py-0.5 bg-brand-50 border border-brand-200 text-brand-700 text-xs rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className={`shrink-0 p-2 rounded-xl border transition ${editing ? 'bg-red-50 border-red-200 text-red-500' : 'bg-earth-50 border-earth-200 text-earth-600 hover:bg-brand-50'}`}>
            {editing ? <X size={16}/> : <Edit2 size={16}/>}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white rounded-2xl p-6 border border-brand-200 space-y-4">
          <h3 className="font-display font-semibold text-earth-900">Edit Profil</h3>
          <div>
            <label className="text-earth-600 text-sm mb-1.5 block">Nama Lengkap</label>
            <input value={form.nama} onChange={e=>setForm(p=>({...p,nama:e.target.value}))}
              className="w-full border border-earth-200 rounded-xl px-4 py-2.5 text-earth-900 text-sm focus:outline-none focus:border-brand-400 transition bg-earth-50"/>
          </div>
          <div>
            <label className="text-earth-600 text-sm mb-1.5 block">Kota</label>
            <input value={form.kota} onChange={e=>setForm(p=>({...p,kota:e.target.value}))}
              className="w-full border border-earth-200 rounded-xl px-4 py-2.5 text-earth-900 text-sm focus:outline-none focus:border-brand-400 transition bg-earth-50"/>
          </div>
          <div>
            <label className="text-earth-600 text-sm mb-1.5 block">Bio</label>
            <textarea value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} rows={3}
              className="w-full border border-earth-200 rounded-xl px-4 py-2.5 text-earth-900 text-sm focus:outline-none focus:border-brand-400 transition bg-earth-50 resize-none"/>
          </div>
          <div>
            <label className="text-earth-600 text-sm mb-2 block">Subsektor</label>
            <div className="flex flex-wrap gap-2">
              {SUBSEKTORS.map(s => (
                <button key={s} onClick={()=>toggleSub(s)} type="button"
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                    ${form.subsektor.includes(s) ? 'bg-brand-500 border-brand-500 text-white' : 'border-earth-200 text-earth-600 hover:border-brand-400'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={saving}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm">
            {saving ? 'Menyimpan...' : <><Save size={15}/>Simpan Perubahan</>}
          </button>
        </div>
      )}

      {/* Bio display */}
      {!editing && form.bio && (
        <div className="bg-white rounded-2xl p-5 border border-earth-100">
          <h3 className="font-display font-semibold text-earth-900 mb-2">Tentang Saya</h3>
          <p className="text-earth-600 text-sm leading-relaxed">{form.bio}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[['Karya', user.total_karya||18, 'bg-brand-50 text-brand-700 border-brand-100'],
          ['Aktivitas', user.total_aktivitas||24, 'bg-batik-50 text-batik-700 border-batik-100'],
          ['Event', user.total_event||6,  'bg-earth-50 text-earth-700 border-earth-100']].map(([l,v,cls]) => (
          <div key={l} className={`rounded-2xl p-4 border text-center ${cls}`}>
            <p className="text-2xl font-bold font-display">{v}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{l}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-batik-50 border border-batik-100 rounded-2xl p-4">
        <p className="text-batik-700 text-xs font-medium mb-1">Info Akun</p>
        <p className="text-batik-500 text-xs">Terdaftar sejak {new Date(user.tanggal_daftar||'2024-03-15').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</p>
        <p className="text-batik-500 text-xs mt-0.5">{user.email}</p>
      </div>

      {/* 🆕 Lihat Profil Publik */}
      <a
        href={`/pelaku/${user.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-earth-200 rounded-2xl text-earth-500 hover:border-batik-400 hover:text-batik-700 transition text-sm font-medium"
      >
        <span>🌐</span> Lihat Profil Publik
      </a>
    </div>
  );
}
