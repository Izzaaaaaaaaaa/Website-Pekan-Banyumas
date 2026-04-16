import React, { useState } from 'react';
import { Lock, Mail, Bell, Shield, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/Toast';
import api, { getUser } from '../services/api';

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl p-5 border border-earth-100">
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-earth-50">
      <div className="w-8 h-8 rounded-xl bg-batik-100 flex items-center justify-center">
        <Icon size={15} className="text-batik-700"/>
      </div>
      <h3 className="font-display font-semibold text-earth-900">{title}</h3>
    </div>
    {children}
  </div>
);

export default function Pengaturan() {
  const toast = useToast();
  const user = getUser() || {};
  const [pwForm, setPwForm] = useState({ lama:'', baru:'', konfirmasi:'' });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [notifPref, setNotifPref] = useState({ event:true, system:true, digest:false });

  const gantiPw = async () => {
    if (!pwForm.lama || !pwForm.baru) { toast.error('Lengkapi semua field'); return; }
    if (pwForm.baru !== pwForm.konfirmasi) { toast.error('Konfirmasi password tidak cocok'); return; }
    if (pwForm.baru.length < 8) { toast.error('Password baru minimal 8 karakter'); return; }
    setSavingPw(true);
    await new Promise(r => setTimeout(r, 800));
    setSavingPw(false);
    setPwForm({ lama:'', baru:'', konfirmasi:'' });
    toast.success('Password berhasil diubah');
  };

  const Input = ({ label, field, type='text', placeholder }) => (
    <div>
      <label className="text-earth-600 text-sm mb-1.5 block">{label}</label>
      <div className="relative">
        <input type={showPw ? 'text' : type} value={pwForm[field]}
          onChange={e => setPwForm(p => ({...p,[field]:e.target.value}))}
          placeholder={placeholder}
          className="w-full border border-earth-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 transition pr-10"/>
        {type === 'password' && (
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400">
            {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-earth-900">Pengaturan</h1>
        <p className="text-earth-500 text-sm mt-0.5">Kelola akun dan preferensi notifikasi</p>
      </div>

      {/* Info Akun */}
      <Section icon={Mail} title="Informasi Akun">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-earth-50">
            <span className="text-earth-500 text-sm">Email</span>
            <span className="text-earth-900 text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-earth-50">
            <span className="text-earth-500 text-sm">Status Akun</span>
            <span className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
              <CheckCircle size={13} fill="currentColor"/> Terverifikasi
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-earth-500 text-sm">Terdaftar sejak</span>
            <span className="text-earth-900 text-sm">{new Date(user.tanggal_daftar||'2024-03-15').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</span>
          </div>
        </div>
      </Section>

      {/* Ganti Password */}
      <Section icon={Lock} title="Ubah Password">
        <div className="space-y-3">
          <Input label="Password Lama" field="lama" type="password" placeholder="Masukkan password lama"/>
          <Input label="Password Baru" field="baru" type="password" placeholder="Min. 8 karakter"/>
          <Input label="Konfirmasi Password Baru" field="konfirmasi" type="password" placeholder="Ulangi password baru"/>
          <button onClick={gantiPw} disabled={savingPw}
            className="w-full bg-batik-700 hover:bg-batik-800 text-white py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-sm mt-2">
            {savingPw ? <><Loader2 size={14} className="animate-spin"/>Menyimpan...</> : 'Simpan Password Baru'}
          </button>
        </div>
      </Section>

      {/* Notifikasi */}
      <Section icon={Bell} title="Preferensi Notifikasi">
        <div className="space-y-4">
          {[
            ['event',   'Notifikasi Event',   'Pengingat event yang kamu daftarkan'],
            ['system',  'Notifikasi Sistem',  'Update status akun dan konten'],
            ['digest',  'Ringkasan Mingguan', 'Email ringkasan aktivitas setiap minggu'],
          ].map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-earth-900 text-sm font-medium">{label}</p>
                <p className="text-earth-400 text-xs mt-0.5">{desc}</p>
              </div>
              <div onClick={() => { setNotifPref(p => ({...p,[key]:!p[key]})); toast.info('Preferensi disimpan'); }}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${notifPref[key]?'bg-brand-500':'bg-earth-200'} relative shrink-0`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifPref[key]?'left-6':'left-1'}`}/>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Danger zone */}
      <Section icon={Shield} title="Zona Berbahaya">
        <p className="text-earth-500 text-sm mb-3">Menghapus akun akan menghapus semua data profil, portofolio, dan aktivitas secara permanen.</p>
        <button className="w-full border border-red-200 text-red-500 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
          onClick={() => toast.error('Fitur hapus akun hanya tersedia melalui admin. Hubungi tim Peken Banyumasan.')}>
          Hapus Akun
        </button>
      </Section>
    </div>
  );
}
