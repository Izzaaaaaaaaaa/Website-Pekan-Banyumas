// Profil.jsx — Peken Banyumasan Design System v2.0
import React, { useState } from 'react';
import { User, MapPin, Edit2, Save, X, CheckCircle, ExternalLink } from 'lucide-react';
import { profilApi } from '../services/endpoints';
import { getUser, setUser as setAuthUser } from '../lib/auth';
import { extractError } from '../lib/unwrap';
import { useToast } from '../components/Toast';
import { SUBSEKTOR } from '../constants/subsektor';
import ImageUpload from '../components/ImageUpload';
import { T } from '../lib/tokens';
import { profileUrl } from '../lib/slug';

export default function Profil() {
  const toast = useToast();
  const [user,    setUser]  = useState(getUser() || {});
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({
    nama:      user.nama||'',
    kota:      user.kota||'',
    bio:       user.bio||'',
    subsektor: user.subsektor || [],
    foto_url:  user.foto_url||'',
    cover_url: user.cover_url||'',
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await profilApi.get();
        if (data && mounted) {
          setUser(prev => {
            const merged = { ...prev, ...data };
            setAuthUser(merged);
            setForm({
              nama:      merged.nama||'',
              kota:      merged.kota||'',
              bio:       merged.bio||'',
              subsektor: merged.subsektor || [],
              foto_url:  merged.foto_url||'',
              cover_url: merged.cover_url||'',
            });
            return merged;
          });
        }
      } catch (err) {
        if (mounted) toast.error(extractError(err, 'Gagal memuat profil terbaru'));
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  const toggleSub = s => setForm(p => ({
    ...p,
    subsektor: p.subsektor.includes(s)
      ? p.subsektor.filter(x => x !== s)
      : [...p.subsektor, s],
  }));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await profilApi.update(form);
      const merged  = { ...user, ...form, ...(updated || {}) };
      setUser(merged);
      setAuthUser(merged);
      setEditing(false);
      toast.success('Profil berhasil diperbarui');
    } catch (err) { toast.error(extractError(err, 'Gagal menyimpan')); }
    finally { setSaving(false); }
  };

  const initial = (form.nama || 'U').charAt(0).toUpperCase();
  const cardStyle = {
    background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:16, boxShadow:T.shadowSm,
  };
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
    fontFamily:'Montserrat, sans-serif',
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* ── Avatar card ── */}
      <div style={cardStyle} className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
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
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold"
              style={{background:T.accent, color:T.charcoal, fontFamily:'Clash Display, sans-serif'}}>
              {form.foto_url
                ? <img src={form.foto_url} alt="" className="w-full h-full object-cover"/>
                : initial
              }
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-base" style={{color:T.text1}}>
                {form.nama}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                style={{background:T.successBg, border:`1px solid ${T.successBorder}`, color:T.success}}>
                <CheckCircle size={10}/> Terverifikasi
              </span>
            </div>
            {form.kota && (
              <p className="text-sm flex items-center gap-1 mt-1" style={{color:T.textMuted}}>
                <MapPin size={12}/> {form.kota}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(form.subsektor||[]).map(s => (
                <span key={s}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{background:T.accentBg, border:`1px solid ${T.accentBorder}`, color:T.sageDeeper}}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="shrink-0 p-2 rounded-xl border transition-colors"
            style={editing
              ? {background:T.surfaceHover, border:`1px solid ${T.border}`, color:T.text2}
              : {background:T.accentBg, border:`1px solid ${T.border}`, color:T.text2}
            }
          >
            {editing ? <X size={16}/> : <Edit2 size={16}/>}
          </button>
        </div>
      </div>

      {/* ── Edit form ── */}
      {editing && (
        <div style={{...cardStyle, border:`1px solid ${T.accentBorder}`}} className="p-6 space-y-4">
          <h3 className="font-semibold text-sm" style={{color:T.text1}}>Edit Profil</h3>

          <div>
            <label style={labelStyle}>Nama Lengkap</label>
            <input
              value={form.nama}
              onChange={e => setForm(p => ({...p, nama:e.target.value}))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Kota</label>
            <input
              value={form.kota}
              onChange={e => setForm(p => ({...p, kota:e.target.value}))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({...p, bio:e.target.value}))}
              rows={3}
              style={{...inputStyle, resize:'none', lineHeight:1.6}}
            />
          </div>

          <div>
            <label style={labelStyle}>Foto Cover (opsional)</label>
            <ImageUpload
              value={form.cover_url}
              onChange={v => setForm(p => ({...p, cover_url: v}))}
              label=""
              shape="wide"
            />
          </div>

          <div>
            <label style={labelStyle}>Subsektor</label>
            <div className="flex flex-wrap gap-2">
              {SUBSEKTOR.map(s => (
                <button key={s} onClick={() => toggleSub(s)} type="button"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={form.subsektor.includes(s)
                    ? {background:T.sageDark, border:`1px solid ${T.sageDark}`, color:T.white}
                    : {background:T.surface, border:`1px solid ${T.border}`, color:T.text2}
                  }>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm text-white"
            style={{background:T.sageDark, borderRadius:20}}
          >
            {saving ? 'Menyimpan...' : <><Save size={15}/>Simpan Perubahan</>}
          </button>
        </div>
      )}

      {/* ── Bio display ── */}
      {!editing && form.bio && (
        <div style={cardStyle} className="p-5">
          <h3 className="font-semibold text-sm mb-2" style={{color:T.text1}}>Tentang Saya</h3>
          <p className="text-sm leading-relaxed" style={{color:T.text2}}>{form.bio}</p>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Karya', user.total_karya||18, {background:T.accentBg,  border:`1px solid ${T.accentBorder}`, color:T.sageDeeper}],
          ['Story', user.total_story||24, {background:T.infoBg,    border:`1px solid ${T.infoBorder}`,   color:T.info}],
          ['Event', user.total_event||6,  {background:T.warningBg, border:`1px solid ${T.warningBorder}`, color:T.warning}],
        ].map(([l,v,style]) => (
          <div key={l} className="rounded-2xl px-4 py-5 text-center" style={style}>
            <p className="text-2xl font-bold">{v}</p>
            <p className="text-xs font-medium mt-1" style={{opacity:.75}}>{l}</p>
          </div>
        ))}
      </div>

      {/* ── Info ── */}
      <div className="rounded-2xl p-4" style={{background:T.accentBg, border:`1px solid ${T.accentBorder}`}}>
        <p className="text-xs font-semibold mb-1" style={{color:T.sageDeeper}}>Info Akun</p>
        <p className="text-xs" style={{color:T.sageDark}}>
          Terdaftar sejak{' '}
          {new Date(user.tanggal_daftar||'2024-03-15').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}
        </p>
        <p className="text-xs mt-0.5" style={{color:T.sageDark}}>{user.email}</p>
      </div>

      {/* ── Link profil publik ── */}
      <a
        href={profileUrl(user.nama, import.meta.env.VITE_COMPANY_URL || '')}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-medium transition-colors"
        style={{
          border:`1.5px dashed ${T.accentBorder}`,
          color:T.sageDark,
          background:'transparent',
        }}
      >
        <ExternalLink size={14}/> Lihat Profil Publik
      </a>
    </div>
  );
}
