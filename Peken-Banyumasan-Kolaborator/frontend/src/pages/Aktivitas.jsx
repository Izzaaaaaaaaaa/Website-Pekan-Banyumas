// Aktivitas.jsx — with file upload (FileReader), tags, 👏 apresiasi
import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, X, Loader2, BookOpen, Clock, Tag, Hash, MapPin } from 'lucide-react';
import api, { getUser } from '../services/api';
import { useToast } from '../components/Toast';
import ImageUpload from '../components/ImageUpload';

const SUBSEKTORS = ['Kuliner','Kriya','Fashion','Musik','Seni Pertunjukan','Fotografi','Desain Produk','Seni Rupa','Film & Animasi'];
const MAX = 500;

const fmtDate = d => {
  if (!d) return '';
  const dt = new Date(d);
  const diff = Math.floor((new Date() - dt) / 86400000);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  if (diff < 7) return `${diff} hari lalu`;
  return dt.toLocaleDateString('id-ID',{day:'numeric',month:'long'});
};

// ── StoryCard ─────────────────────────────────────────────────────────────────
const StoryCard = ({ story, onDelete, onLike }) => {
  const user = getUser();
  return (
    <div className="bg-white rounded-2xl border border-earth-100 overflow-hidden group hover:shadow-sm transition">
      {/* Foto story */}
      {story.media_url && (
        <img src={story.media_url} alt="" className="w-full h-52 object-cover"/>
      )}
      <div className="p-4">
        {/* Author row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {user?.foto_url
              ? <img src={user.foto_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0"/>
              : <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                  {(user?.nama||'U').charAt(0)}
                </div>
            }
            <div>
              <p className="text-earth-900 text-sm font-semibold leading-none">{user?.nama||'Kamu'}</p>
              <p className="text-earth-400 text-[11px] flex items-center gap-1 mt-0.5">
                <Clock size={10}/>{fmtDate(story.tanggal||story.created_at)}
              </p>
            </div>
          </div>
          <button onClick={() => onDelete(story.id)}
            className="opacity-0 group-hover:opacity-100 transition text-earth-300 hover:text-red-400 p-1 rounded-lg hover:bg-red-50">
            <Trash2 size={14}/>
          </button>
        </div>

        <p className="text-earth-700 text-sm leading-relaxed">{story.konten}</p>

        {/* Tags */}
        {story.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {story.tags.map(t => (
              <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-full text-[10px] font-medium flex items-center gap-0.5">
                <Hash size={8}/>{t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-earth-50">
          <button onClick={() => onLike(story.id)}
            className={`flex items-center gap-1.5 text-sm transition px-2 py-1 rounded-lg ${story.liked ? 'text-brand-700 bg-brand-50' : 'text-earth-400 hover:text-brand-600 hover:bg-brand-50'}`}>
            <span className="text-base">{story.liked ? '👏' : '👋'}</span>
            <span className="font-medium">{(story.like_count||story.suka||0) + (story.liked ? 1 : 0)}</span>
            <span className="text-xs hidden sm:inline">apresiasi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── PostModal ─────────────────────────────────────────────────────────────────
function PostModal({ onClose, onPost }) {
  const [konten, setKonten] = useState('');
  const [foto, setFoto] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const addTag = (t) => {
    const clean = t.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean) && tags.length < 5) setTags(l => [...l, clean]);
    setTagInput('');
  };

  const post = async () => {
    if (!konten.trim()) { toast.error('Tulis sesuatu dulu'); return; }
    setSaving(true);
    try {
      await onPost({ konten, media_url: foto || null, tags });
      onClose();
    } catch { toast.error('Gagal posting'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-earth-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
              {(getUser()?.nama||'U').charAt(0)}
            </div>
            <div>
              <p className="text-earth-900 text-sm font-semibold leading-none">{getUser()?.nama||'Kamu'}</p>
              <p className="text-earth-400 text-[10px] mt-0.5">Berbagi ke komunitas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-earth-400 hover:text-earth-700 p-1"><X size={20}/></button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Textarea */}
          <div>
            <textarea value={konten} onChange={e => setKonten(e.target.value.slice(0,MAX))} rows={4}
              placeholder="Apa yang sedang kamu kerjakan hari ini? Ceritakan prosesnya, ilhamu, atau momen spesialmu..."
              className="w-full border border-earth-200 rounded-2xl px-4 py-3 text-sm text-earth-700 focus:outline-none focus:border-brand-400 transition resize-none bg-earth-50/50"
              autoFocus/>
            <p className={`text-right text-xs mt-1 ${konten.length > MAX*0.9 ? 'text-red-500' : 'text-earth-300'}`}>
              {konten.length}/{MAX}
            </p>
          </div>

          {/* Photo upload */}
          <ImageUpload
            value={foto}
            onChange={setFoto}
            label="Foto (opsional)"
            hint="JPG, PNG · maks 5 MB"
            shape="wide"
          />

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-earth-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <Tag size={11}/> Tags (maks 5)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUBSEKTORS.slice(0,6).map(s => (
                <button key={s} type="button" onClick={() => addTag(s)} disabled={tags.includes(s)||tags.length>=5}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition
                    ${tags.includes(s)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 disabled:opacity-40'}`}>
                  {s}
                </button>
              ))}
            </div>
            <input
              value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }}}
              placeholder="Custom tag + Enter"
              className="w-full border border-earth-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400 transition"/>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                    #{t}
                    <button onClick={() => setTags(l => l.filter(x => x !== t))}><X size={10}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-earth-100 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-earth-200 text-earth-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-earth-50 transition">
            Batal
          </button>
          <button onClick={post} disabled={!konten.trim() || saving}
            className="flex-1 bg-primary-700 hover:bg-primary-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={13} className="animate-spin"/>Posting...</> : '✈️ Bagikan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Story() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.aktivitas.list().then(r => {
      setList(r.data.map(s => ({ ...s, liked: false, like_count: s.suka || s.like_count || 0 })));
      setLoading(false);
    });
  }, []);

  const post = async (data) => {
    const res = await api.aktivitas.create(data);
    setList(l => [{ ...res.data, liked: false, like_count: 0 }, ...l]);
    toast.success('Story berhasil diposting!');
  };

  const del = async (id) => {
    if (!confirm('Hapus story ini?')) return;
    await api.aktivitas.delete(id);
    setList(l => l.filter(x => x.id !== id));
    toast.success('Story dihapus');
  };

  const like = (id) => setList(l => l.map(s => s.id === id ? { ...s, liked: !s.liked } : s));

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-earth-900">Story</h1>
          <p className="text-earth-400 text-sm mt-0.5">Bagikan momen dan karya ke komunitas</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
          <Plus size={15}/> Tulis Story
        </button>
      </div>

      {/* Quick composer */}
      <button onClick={() => setShowModal(true)}
        className="w-full bg-white border border-earth-100 rounded-2xl p-4 flex items-center gap-3 mb-5 hover:border-brand-200 hover:bg-brand-50/30 transition text-left group">
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold shrink-0">
          {(getUser()?.nama||'U').charAt(0)}
        </div>
        <span className="text-earth-300 text-sm flex-1 group-hover:text-brand-400 transition">
          Apa yang sedang kamu kerjakan? 📸✍️
        </span>
        <Plus size={18} className="text-earth-200 group-hover:text-brand-300 transition shrink-0"/>
      </button>

      {/* Story list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_,i) => <div key={i} className="bg-earth-100 rounded-2xl h-40 animate-pulse"/>)}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-100 p-14 text-center">
          <div className="text-5xl mb-4">✍️</div>
          <p className="text-earth-500 font-display font-semibold">Belum ada story</p>
          <p className="text-earth-400 text-sm mt-1 mb-4">Bagikan momen pertamamu ke komunitas</p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-xl hover:bg-primary-800 transition">
            <Plus size={14}/> Mulai Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(s => <StoryCard key={s.id} story={s} onDelete={del} onLike={like}/>)}
        </div>
      )}

      {showModal && <PostModal onClose={() => setShowModal(false)} onPost={post}/>}
    </div>
  );
}
