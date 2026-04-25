// Story.jsx — Peken Banyumasan Design System v2.0
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, X, Loader2, Clock, Hash, Tag } from 'lucide-react';
import { storyApi } from '../services/endpoints';
import { getUser } from '../lib/auth';
import { extractError } from '../lib/unwrap';
import { useToast } from '../components/Toast';
import ImageUpload from '../components/ImageUpload';
import { T } from '../lib/tokens';

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
const StoryCard = ({ story, onDelete }) => {
  const user = getUser();
  const initial = (user?.nama||'U').charAt(0).toUpperCase();
  return (
    <div className="rounded-2xl overflow-hidden group transition-shadow hover:shadow-md"
      style={{background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadowSm}}>
      {story.media_url && (
        <img src={story.media_url} alt="" className="w-full h-52 object-cover"/>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {user?.foto_url
              ? <img src={user.foto_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0"/>
              : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{background: T.sage, color: T.charcoal}}>{initial}</div>
            }
            <div>
              <p className="text-sm font-semibold leading-none" style={{color: T.text1}}>
                {user?.nama||'Kamu'}
              </p>
              <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{color: T.textMuted}}>
                <Clock size={10}/>{fmtDate(story.tanggal||story.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onDelete(story.id)}
            className="opacity-0 group-hover:opacity-100 transition p-1 rounded-lg"
            style={{color: T.error}}>
            <Trash2 size={14}/>
          </button>
        </div>

        <p className="text-sm leading-relaxed" style={{color: T.text2}}>{story.konten}</p>

        {story.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {story.tags.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-0.5"
                style={{background: T.accentBg, color: T.sageDark}}>
                <Hash size={8}/>{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── PostModal ─────────────────────────────────────────────────────────────────
function PostModal({ onClose, onPost }) {
  const [konten,   setKonten]   = useState('');
  const [foto,     setFoto]     = useState('');
  const [tags,     setTags]     = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving,   setSaving]   = useState(false);
  const toast = useToast();
  const user  = getUser();
  const initial = (user?.nama||'U').charAt(0).toUpperCase();

  const addTag = t => {
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

  const inputStyle = {
    width:'100%', fontFamily:'Montserrat, sans-serif', fontSize:13,
    border:`1px solid ${T.border}`, borderRadius:12,
    padding:'10px 13px', color: T.text1, background: T.surface, outline:'none',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{background:'rgba(13,13,13,0.55)'}}
      onClick={onClose}>
      <div className="rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        style={{background: T.surface, border: `1px solid ${T.border}`}}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{borderBottom: `1px solid ${T.border}`}}>
          <div className="flex items-center gap-3">
            {user?.foto_url
              ? <img src={user.foto_url} alt="" className="w-9 h-9 rounded-full object-cover"/>
              : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{background: T.sage, color: T.charcoal}}>{initial}</div>
            }
            <div>
              <p className="text-sm font-semibold leading-none" style={{color: T.text1}}>
                {user?.nama||'Kamu'}
              </p>
              <p className="text-[10px] mt-0.5" style={{color: T.textMuted}}>Berbagi ke komunitas</p>
            </div>
          </div>
          <button onClick={onClose} style={{color: T.textMuted}}><X size={20}/></button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <textarea
              value={konten}
              onChange={e => setKonten(e.target.value.slice(0,MAX))}
              rows={4}
              placeholder="Apa yang sedang kamu kerjakan hari ini? Ceritakan prosesnya..."
              autoFocus
              style={{
                ...inputStyle, resize:'none', lineHeight:1.7,
                padding:'12px 14px', borderRadius:14,
              }}
            />
            <p className="text-right text-xs mt-1"
              style={{color: konten.length > MAX*0.9 ? T.error : T.textMuted}}>
              {konten.length}/{MAX}
            </p>
          </div>

          <ImageUpload
            value={foto}
            onChange={setFoto}
            label="Foto (opsional)"
            hint="JPG, PNG · maks 5 MB"
            shape="wide"
          />

          {/* Tags */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
              style={{color: T.textMuted, display:'flex', letterSpacing:'.08em'}}>
              <Tag size={10}/> Tags (maks 5)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUBSEKTORS.slice(0,6).map(s => (
                <button key={s} type="button" onClick={() => addTag(s)}
                  disabled={tags.includes(s)||tags.length>=5}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold border transition"
                  style={tags.includes(s)
                    ? {background: T.sageDark, color: T.white, border: `1px solid ${T.sageDark}`}
                    : {background: T.surface, color: T.text2, border: `1px solid ${T.border}`}
                  }>
                  {s}
                </button>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter'||e.key===',') { e.preventDefault(); addTag(tagInput); } }}
              placeholder="Custom tag + Enter"
              style={inputStyle}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{background: T.accentBg, color: T.sageDeeper}}>
                    #{t}
                    <button onClick={() => setTags(l => l.filter(x => x !== t))}>
                      <X size={10}/>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 shrink-0 flex gap-3"
          style={{borderTop: `1px solid ${T.border}`}}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{border: `1px solid ${T.border}`, color: T.text2}}>
            Batal
          </button>
          <button onClick={post} disabled={!konten.trim()||saving}
            className="flex-1 text-white py-2.5 text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{background: T.sageDark, borderRadius:12}}>
            {saving
              ? <><Loader2 size={13} className="animate-spin"/>Posting...</>
              : 'Bagikan'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Story() {
  const toast = useToast();
  const [list,      setList]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const user = getUser();
  const initial = (user?.nama||'U').charAt(0).toUpperCase();

  useEffect(() => {
    (async () => {
      try {
        const items = await storyApi.list();
        setList(items || []);
      } catch (err) { toast.error(extractError(err, 'Gagal memuat story')); }
      finally { setLoading(false); }
    })();
  }, [toast]);

  const post = async data => {
    try {
      const created = await storyApi.create(data);
      setList(l => [created, ...l]);
      toast.success('Story berhasil diposting!');
    } catch (err) { toast.error(extractError(err, 'Gagal memposting story')); }
  };

  const del = async id => {
    if (!confirm('Hapus story ini?')) return;
    try {
      await storyApi.delete(id);
      setList(l => l.filter(x => x.id !== id));
      toast.success('Story dihapus');
    } catch (err) { toast.error(extractError(err, 'Gagal menghapus story')); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-medium" style={{color: T.text1}}>Story</h1>
          <p className="text-sm mt-0.5" style={{color: T.textMuted}}>
            Bagikan momen dan karya ke komunitas
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-white px-4 py-2.5 text-sm font-semibold transition shadow-sm"
          style={{background: T.sageDark, borderRadius:20}}>
          <Plus size={15}/> Tulis Story
        </button>
      </div>

      {/* Quick composer */}
      <button onClick={() => setShowModal(true)}
        className="w-full rounded-2xl p-4 flex items-center gap-3 mb-5 text-left group transition"
        style={{background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadowSm}}>
        {user?.foto_url
          ? <img src={user.foto_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0"/>
          : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{background: T.sage, color: T.charcoal}}>{initial}</div>
        }
        <span className="flex-1 text-sm" style={{color: T.textSoft}}>
          Apa yang sedang kamu kerjakan?
        </span>
        <Plus size={17} style={{color: T.textSoft, flexShrink:0}}/>
      </button>

      {/* Story list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_,i) => (
            <div key={i} className="rounded-2xl h-40 animate-pulse" style={{background: T.border}}/>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl p-14 text-center"
          style={{background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadowSm}}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{background: T.accentBg}}>
            <Plus size={28} style={{color: T.sageDark}}/>
          </div>
          <p className="font-semibold text-sm" style={{color: T.text2}}>Belum ada story</p>
          <p className="text-sm mt-1 mb-4" style={{color: T.textMuted}}>
            Bagikan momen pertamamu ke komunitas
          </p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold transition"
            style={{background: T.sageDark, borderRadius:20}}>
            <Plus size={14}/> Mulai Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(s => <StoryCard key={s.id} story={s} onDelete={del}/>)}
        </div>
      )}

      {showModal && <PostModal onClose={() => setShowModal(false)} onPost={post}/>}
    </div>
  );
}
