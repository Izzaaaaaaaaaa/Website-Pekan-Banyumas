// Pengaturan.jsx — Peken Banyumasan Design System v2.0
import React, { useState, useCallback } from 'react';
import { Lock, Mail, Bell, Shield, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/Toast';
import { authApi } from '../services/endpoints';
import { getUser } from '../lib/auth';
import { extractError } from '../lib/unwrap';
import { T } from '../lib/tokens';

const cardStyle = {
  background:T.surface,
  border:`1px solid ${T.border}`,
  borderRadius:16,
  boxShadow:T.shadowSm,
};

const inputBase = {
  width:'100%', padding:'11px 14px',
  border:`1px solid ${T.border}`, borderRadius:12,
  fontSize:14, fontFamily:'Montserrat, sans-serif',
  color:T.text1, background:T.surface, outline:'none',
  transition:'border-color .18s, box-shadow .18s',
};

const labelStyle = {
  display:'block', fontSize:11, fontWeight:600,
  color:T.text2, marginBottom:6,
  letterSpacing:'.04em', textTransform:'uppercase',
  fontFamily:'Montserrat, sans-serif',
};

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, children }) => (
  <div style={cardStyle} className="p-5">
    <div className="flex items-center gap-2.5 mb-4 pb-3"
      style={{borderBottom:`1px solid ${T.accentBg}`}}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{background:T.accentBg}}>
        <Icon size={15} style={{color:T.sageDark}}/>
      </div>
      <h3 className="font-semibold text-sm" style={{color:T.text1}}>{title}</h3>
    </div>
    {children}
  </div>
);

// ── BUG-1 FIX: InputField dipindah ke LUAR komponen Pengaturan ────────────────
// Sebelumnya didefinisikan di dalam → re-render parent = komponen baru → focus hilang
const InputField = ({ label, field, type='text', placeholder, value, showPw, onShowPw, onChange }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div className="relative">
      <input
        type={type === 'password' ? (showPw ? 'text' : 'password') : type}
        value={value}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
        style={{...inputBase, paddingRight: type==='password' ? 44 : 14}}
      />
      {type === 'password' && (
        <button
          type="button"
          onClick={onShowPw}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{color:T.textMuted}}>
          {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
        </button>
      )}
    </div>
  </div>
);

// ── BUG-2 FIX: Baca & tulis notifPref dari localStorage ──────────────────────
const NOTIF_PREF_KEY = 'peken_notif_pref';

function loadNotifPref() {
  try {
    const saved = localStorage.getItem(NOTIF_PREF_KEY);
    if (saved) return { ...{ event:true, system:true, digest:false }, ...JSON.parse(saved) };
  } catch (_) { /* ignore */ }
  return { event:true, system:true, digest:false };
}

export default function Pengaturan() {
  const toast = useToast();
  const user  = getUser() || {};
  const [pwForm,  setPwForm]  = useState({ lama:'', baru:'', konfirmasi:'' });
  const [showPw,  setShowPw]  = useState(false);
  const [savingPw,setSavingPw]= useState(false);

  // BUG-2 FIX: initialise dari localStorage agar persist lintas tab
  const [notifPref, setNotifPref] = useState(loadNotifPref);

  const gantiPw = async () => {
    if (!pwForm.lama || !pwForm.baru) { toast.error('Lengkapi semua field'); return; }
    if (pwForm.baru !== pwForm.konfirmasi) { toast.error('Konfirmasi password tidak cocok'); return; }
    if (pwForm.baru.length < 8) { toast.error('Password baru minimal 8 karakter'); return; }
    setSavingPw(true);
    try {
      await authApi.updatePassword({ password_lama:pwForm.lama, password_baru:pwForm.baru });
      setPwForm({ lama:'', baru:'', konfirmasi:'' });
      toast.success('Password berhasil diubah');
    } catch (err) {
      toast.error(extractError(err, 'Gagal mengubah password. Periksa password lama Anda.'));
    } finally { setSavingPw(false); }
  };

  // BUG-1 FIX: handler stabil dengan useCallback, tidak recreate tiap render
  const handlePwChange = useCallback((field, value) => {
    setPwForm(p => ({ ...p, [field]: value }));
  }, []);

  const toggleShowPw = useCallback(() => setShowPw(v => !v), []);

  // BUG-2 FIX: toggle juga simpan ke localStorage
  const toggleNotif = useCallback((key) => {
    setNotifPref(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(NOTIF_PREF_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
    toast.info('Preferensi disimpan');
  }, [toast]);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-xl font-medium" style={{color:T.text1}}>Pengaturan</h1>
        <p className="text-sm mt-0.5" style={{color:T.textMuted}}>
          Kelola akun dan preferensi notifikasi
        </p>
      </div>

      {/* ── Info Akun ── */}
      <Section icon={Mail} title="Informasi Akun">
        <div className="space-y-3">
          {[
            ['Email', user.email],
            ['Status Akun', null],
            ['Terdaftar sejak', new Date(user.tanggal_daftar||'2024-03-15').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})],
          ].map(([label, val], i) => (
            <div key={label} className="flex items-center justify-between py-2"
              style={i < 2 ? {borderBottom:`1px solid ${T.accentBg}`} : {}}>
              <span className="text-sm" style={{color:T.textMuted}}>{label}</span>
              {label === 'Status Akun' ? (
                <span className="flex items-center gap-1.5 text-sm font-medium"
                  style={{color:T.success}}>
                  <CheckCircle size={13} fill="currentColor"/> Terverifikasi
                </span>
              ) : (
                <span className="text-sm font-medium" style={{color:T.text1}}>{val}</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Ubah Password ── */}
      <Section icon={Lock} title="Ubah Password">
        <div className="space-y-3">
          <InputField
            label="Password Lama" field="lama" type="password"
            placeholder="Masukkan password lama"
            value={pwForm.lama} showPw={showPw}
            onShowPw={toggleShowPw} onChange={handlePwChange}
          />
          <InputField
            label="Password Baru" field="baru" type="password"
            placeholder="Min. 8 karakter"
            value={pwForm.baru} showPw={showPw}
            onShowPw={toggleShowPw} onChange={handlePwChange}
          />
          <InputField
            label="Konfirmasi Password Baru" field="konfirmasi" type="password"
            placeholder="Ulangi password baru"
            value={pwForm.konfirmasi} showPw={showPw}
            onShowPw={toggleShowPw} onChange={handlePwChange}
          />
          <button onClick={gantiPw} disabled={savingPw}
            className="w-full text-white py-2.5 font-semibold transition flex items-center justify-center gap-2 text-sm mt-2"
            style={{background:T.sageDark, borderRadius:20}}>
            {savingPw
              ? <><Loader2 size={14} className="animate-spin"/>Menyimpan...</>
              : 'Simpan Password Baru'
            }
          </button>
        </div>
      </Section>

      {/* ── Preferensi Notifikasi ── */}
      <Section icon={Bell} title="Preferensi Notifikasi">
        <div className="space-y-4">
          {[
            ['event',  'Notifikasi Event',   'Pengingat event yang kamu daftarkan',       false],
            ['system', 'Notifikasi Sistem',  'Update status akun dan konten',              false],
            ['digest', 'Ringkasan Mingguan', 'Email ringkasan aktivitas setiap minggu',    true],
          ].map(([key, label, desc, comingSoon]) => (
            <div key={key} className="flex items-center justify-between"
              style={comingSoon ? { opacity: 0.5 } : {}}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{color:T.text1}}>{label}</p>
                  {comingSoon && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{background:T.accentBg, color:T.sageDark, border:`1px solid ${T.accentBorder}`}}>
                      Segera Hadir
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{color:T.textMuted}}>{desc}</p>
              </div>
              <div
                onClick={() => !comingSoon && toggleNotif(key)}
                className="relative shrink-0"
                style={{
                  width:40, height:22, borderRadius:11,
                  background: notifPref[key] && !comingSoon ? T.sageDark : T.border,
                  transition:'background .18s',
                  cursor: comingSoon ? 'not-allowed' : 'pointer',
                }}>
                <div style={{
                  position:'absolute', top:3,
                  left: notifPref[key] && !comingSoon ? 21 : 3,
                  width:16, height:16, borderRadius:'50%',
                  background:T.surface, boxShadow:'0 1px 2px rgba(30,32,16,.20)',
                  transition:'left .18s',
                }}/>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Zona Berbahaya ── */}
      <Section icon={Shield} title="Zona Berbahaya">
        <p className="text-sm mb-3" style={{color:T.textMuted}}>
          Menghapus akun akan menghapus semua data profil, portofolio, dan story secara permanen.
        </p>
        <button
          onClick={() => toast.error('Fitur hapus akun hanya tersedia melalui admin. Hubungi tim Peken Banyumasan.')}
          className="w-full py-2.5 text-sm font-semibold transition"
          style={{border:`1px solid ${T.errorBorder}`, color:T.error, borderRadius:12, background:'transparent'}}>
          Hapus Akun
        </button>
      </Section>
    </div>
  );
}
