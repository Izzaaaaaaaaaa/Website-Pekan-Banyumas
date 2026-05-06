// Petugas.jsx — Kelola Akun Petugas (Admin only)
import React, { useState, useEffect, memo } from 'react';
import {
  Search, UserCog, CheckCircle, XCircle, Edit3, Save, Loader2,
  Plus, X, Mail, Calendar, Key, AlertCircle,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { petugasApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';

const fmtTgl = d => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTglTime = d => d ? new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
function useDebounce(v, d = 300) { const [r, s] = useState(v); useEffect(() => { const t = setTimeout(() => s(v), d); return () => clearTimeout(t); }, [v, d]); return r; }

const STATUS_MAP = {
  aktif:    { label: 'Aktif',    cls: 'bg-[#eef0e0] text-[#7a8a52] border-[#c8d09a]', dot: 'bg-[#7A9B6A]' },
  disabled: { label: 'Disabled', cls: 'bg-[#f7eeee] text-[#B87272] border-[#dbb8b8]', dot: 'bg-red-400' },
};

// ── CreatePetugasModal ────────────────────────────────────────────────────────
function CreatePetugasModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ nama: '', email: '', password: '', jabatan: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const valid = form.nama.trim() && form.email.trim() && form.password.length >= 8;

  const save = async () => {
    setSaving(true);
    try {
      const payload = { nama: form.nama.trim(), email: form.email.trim(), password: form.password };
      if (form.jabatan.trim()) payload.jabatan = form.jabatan.trim();
      const result = await onCreate(payload);
      if (result) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[20px] w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e7d4]">
          <div className="flex items-center gap-2">
            <UserCog size={18} className="text-[#7a8a52]" />
            <h3 className="font-bold text-[#1e2010] text-sm">Tambah Petugas Baru</h3>
          </div>
          <button onClick={onClose} className="text-[#8a9070] hover:text-[#5a6040]"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Nama Lengkap *</label>
            <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="cth: Budi Santoso"
              className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Email *</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              type="email" placeholder="cth: budi@pekenbanyumasan.id"
              className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Password Awal * (min. 8 karakter)</label>
            <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              type="password" placeholder="Minimal 8 karakter"
              className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Jabatan (opsional)</label>
            <input value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
              placeholder="cth: Petugas Pintu Masuk"
              className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52]" />
          </div>
          <div className="bg-[#f7f2e4] border border-[#dcc882] rounded-[12px] p-3 text-xs text-[#C4A24D]">
            Petugas dapat mengganti password sendiri di halaman Pengaturan Akun setelah login pertama.
          </div>
        </div>

        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-semibold hover:bg-[#f7f8f2] transition">
            Batal
          </button>
          <button onClick={save} disabled={!valid || saving}
            className="flex-1 flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Buat Akun
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ResetPasswordModal ────────────────────────────────────────────────────────
function ResetPasswordModal({ petugas, onClose, onReset }) {
  const [mode, setMode] = useState('temp_password');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const doReset = async () => {
    setSaving(true);
    try {
      const data = await onReset(petugas.id, mode);
      setResult(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={result ? onClose : undefined}>
      <div className="bg-white rounded-[20px] w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e7d4]">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-[#7a8a52]" />
            <h3 className="font-bold text-[#1e2010] text-sm">Reset Password</h3>
          </div>
          <button onClick={onClose} className="text-[#8a9070] hover:text-[#5a6040]"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-[#5a6040]">Reset password untuk <strong>{petugas.nama}</strong>:</p>

          {!result ? (
            <>
              <div className="space-y-2">
                {[
                  ['temp_password', 'Password Sementara', 'Generate password acak — tampil sekali, relay ke petugas.'],
                  ['email_link', 'Link via Email', 'Kirim link reset ke email petugas.'],
                ].map(([val, label, desc]) => (
                  <button key={val} onClick={() => setMode(val)}
                    className={`w-full text-left px-4 py-3 rounded-[12px] border text-sm transition ${mode === val ? 'border-[#7a8a52] bg-[#eef0e0]' : 'border-[#e4e7d4] hover:border-[#c8d09a]'}`}>
                    <div className="font-semibold text-[#1e2010]">{label}</div>
                    <div className="text-xs text-[#8a9070] mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2.5">
                <button onClick={onClose}
                  className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-semibold hover:bg-[#f7f8f2] transition">
                  Batal
                </button>
                <button onClick={doReset} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                  Reset
                </button>
              </div>
            </>
          ) : (
            <>
              {result.temp_password ? (
                <div className="space-y-3">
                  <p className="text-xs text-[#8a9070]">Password sementara (tampil sekali saja):</p>
                  <div className="bg-[#f7f8f2] border border-[#e4e7d4] rounded-[12px] px-4 py-3 text-center">
                    <code className="text-lg font-bold text-[#1e2010] tracking-widest select-all">{result.temp_password}</code>
                  </div>
                  <div className="bg-[#f7f2e4] border border-[#dcc882] rounded-[12px] p-3 text-xs text-[#C4A24D]">
                    Salin password ini sekarang — tidak akan ditampilkan lagi. Relay ke petugas dan minta mereka menggantinya segera.
                  </div>
                </div>
              ) : (
                <div className="bg-[#eef0e0] border border-[#c8d09a] rounded-[12px] p-4 text-center">
                  <CheckCircle size={24} className="text-[#7a8a52] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#1e2010]">Link terkirim</p>
                  <p className="text-xs text-[#8a9070] mt-1">{result.message}</p>
                </div>
              )}
              <button onClick={onClose}
                className="w-full bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition">
                Tutup
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PetugasRow ────────────────────────────────────────────────────────────────
const PetugasRow = memo(({ p, onEdit, onToggleStatus, onResetPw, isProcessing }) => {
  const st = STATUS_MAP[p.status] || STATUS_MAP.aktif;
  return (
    <tr className="border-b border-gray-50 hover:bg-[#f7f8f2]/60 transition group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-[#eef4eb] flex items-center justify-center text-[#4f5c30] font-bold text-sm shrink-0">
            {p.nama.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#1e2010] text-sm">{p.nama}</p>
            <p className="text-[#8a9070] text-xs">{p.jabatan || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-[#5a6040] text-sm">
          <Mail size={12} className="text-[#8a9070]" />
          {p.email}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />{st.label}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-xs text-[#8a9070]">{fmtTglTime(p.last_sign_in_at)}</p>
        <p className="text-[10px] text-gray-300 mt-0.5">Dibuat {fmtTgl(p.created_at)}</p>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onEdit(p)}
            className="p-1.5 rounded-lg text-[#8a9070] hover:text-indigo-600 hover:bg-indigo-50 transition" title="Edit">
            <Edit3 size={14} />
          </button>
          <button onClick={() => onResetPw(p)}
            className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#C4A24D] hover:bg-[#f7f2e4] transition" title="Reset Password">
            <Key size={14} />
          </button>
          {p.status === 'aktif'
            ? <button onClick={() => onToggleStatus(p, 'disabled')} disabled={isProcessing === p.id}
                className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#B87272] hover:bg-[#f7eeee] transition" title="Disable Akun">
                <XCircle size={14} />
              </button>
            : <button onClick={() => onToggleStatus(p, 'aktif')} disabled={isProcessing === p.id}
                className="p-1.5 rounded-lg text-[#8a9070] hover:text-[#7a8a52] hover:bg-[#eef0e0] transition" title="Aktifkan Akun">
                <CheckCircle size={14} />
              </button>
          }
        </div>
      </td>
    </tr>
  );
});

// ── EditDrawer ────────────────────────────────────────────────────────────────
const EditDrawer = ({ petugas, onClose, onSave }) => {
  const [form, setForm] = useState({ nama: '', jabatan: '', email: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!petugas) return;
    setForm({ nama: petugas.nama || '', jabatan: petugas.jabatan || '', email: petugas.email || '' });
  }, [petugas?.id]);

  if (!petugas) return null;

  const save = async () => {
    setSaving(true);
    try {
      const payload = { nama: form.nama.trim() };
      payload.jabatan = form.jabatan.trim() || null;
      if (form.email.trim() !== petugas.email) payload.email = form.email.trim();
      await onSave(petugas.id, payload);
      onClose();
    } catch {
      // error sudah di-toast oleh parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl z-50 flex flex-col"
        style={{ animation: 'slideIn .26s cubic-bezier(.32,.72,0,1) both' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e7d4] bg-[#f7f8f2] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#eef4eb] flex items-center justify-center text-[#7a8a52] font-bold shrink-0">
              {petugas.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-[#1e2010] text-sm leading-tight">{petugas.nama}</p>
              <p className="text-[#8a9070] text-xs">{petugas.jabatan || 'Petugas'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8a9070] hover:bg-[#eef0e0] transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider">Status:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${(STATUS_MAP[petugas.status] || STATUS_MAP.aktif).cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_MAP[petugas.status] || STATUS_MAP.aktif).dot}`} />
              {(STATUS_MAP[petugas.status] || STATUS_MAP.aktif).label}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Nama Lengkap</label>
            <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Jabatan</label>
            <input value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))}
              placeholder="cth: Petugas Pintu Masuk"
              className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-1.5 block">Email</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              type="email"
              className="w-full border border-[#e4e7d4] rounded-[12px] px-3 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52]" />
          </div>

          <div className="bg-[#f7f8f2] rounded-[12px] p-4 space-y-1.5 text-xs text-[#8a9070]">
            <div className="flex justify-between"><span>Dibuat</span><span className="text-[#5a6040]">{fmtTgl(petugas.created_at)}</span></div>
            <div className="flex justify-between"><span>Login terakhir</span><span className="text-[#5a6040]">{fmtTglTime(petugas.last_sign_in_at)}</span></div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e4e7d4] shrink-0 flex gap-2.5">
          <button onClick={save} disabled={saving || !form.nama.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] font-semibold text-sm transition disabled:opacity-70">
            {saving ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</> : <><Save size={14} />Simpan</>}
          </button>
          <button onClick={onClose}
            className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-semibold hover:bg-[#f7f8f2] transition">
            Tutup
          </button>
        </div>
      </div>
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PetugasPage() {
  const toast = useToast();
  const [petugas, setPetugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [processing, setProcessing] = useState(null);
  const dSearch = useDebounce(search);

  const load = async () => {
    try {
      setPetugas(await petugasApi.list() || []);
    } catch (err) {
      toast.error(extractError(err, 'Gagal memuat data petugas'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data) => {
    try {
      const created = await petugasApi.create(data);
      toast.success(`Akun petugas ${data.nama} berhasil dibuat`);
      await load();
      setShowCreate(false);
      return created;
    } catch (err) {
      toast.error(extractError(err, 'Gagal membuat akun petugas'));
      return null;
    }
  };

  const handleSaveEdit = async (id, data) => {
    try {
      await petugasApi.update(id, data);
      toast.success('Data petugas diperbarui');
      await load();
    } catch (err) {
      toast.error(extractError(err, 'Gagal memperbarui data petugas'));
      throw err;
    }
  };

  const handleToggleStatus = async (p, newStatus) => {
    const label = newStatus === 'disabled' ? 'disable' : 'aktifkan';
    if (!confirm(`${newStatus === 'disabled' ? 'Disable' : 'Aktifkan kembali'} akun ${p.nama}?`)) return;
    setProcessing(p.id);
    try {
      await petugasApi.status(p.id, newStatus);
      toast.success(`Akun ${p.nama} berhasil di-${label}`);
      await load();
    } catch (err) {
      toast.error(extractError(err, `Gagal ${label} akun`));
    } finally {
      setProcessing(null);
    }
  };

  const handleResetPassword = async (id, mode) => {
    try {
      const data = await petugasApi.resetPassword(id, mode);
      if (mode === 'email_link') toast.success('Link reset password terkirim');
      return data;
    } catch (err) {
      toast.error(extractError(err, 'Gagal mereset password'));
      throw err;
    }
  };

  const filtered = petugas.filter(p =>
    !dSearch
    || p.nama.toLowerCase().includes(dSearch.toLowerCase())
    || p.email.toLowerCase().includes(dSearch.toLowerCase())
    || (p.jabatan || '').toLowerCase().includes(dSearch.toLowerCase())
  );

  const aktifCount    = petugas.filter(p => p.status === 'aktif').length;
  const disabledCount = petugas.filter(p => p.status === 'disabled').length;

  return (
    <div className="space-y-5">
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          ['Total Petugas', petugas.length,  'text-[#1e2010]', 'bg-white'],
          ['Aktif',         aktifCount,       'text-[#7a8a52]', 'bg-[#eef4eb]'],
          ['Disabled',      disabledCount,    'text-[#B87272]', 'bg-[#f7eeee]'],
        ].map(([l, v, tc, bg]) => (
          <div key={l} className={`${bg} border border-[#e4e7d4] rounded-[16px] p-4`}>
            <p className={`font-bold text-lg ${tc}`}>{v}</p>
            <p className="text-[#8a9070] text-xs mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-[16px] border border-[#e4e7d4] overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9070]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, email, jabatan..."
              className="w-full pl-9 pr-4 py-2.5 border border-[#e4e7d4] rounded-[12px] text-sm focus:outline-none focus:border-[#7a8a52] transition" />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-4 py-2.5 rounded-[12px] text-sm font-semibold transition shrink-0">
            <Plus size={15} /> Tambah Petugas
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-[#8a9070] text-sm">
            <Loader2 size={24} className="animate-spin mx-auto mb-3 text-[#a8b07a]" />
            Memuat data petugas...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e4e7d4] bg-[#f7f8f2]/80">
                {['Nama & Jabatan', 'Email', 'Status', 'Login Terakhir', 'Aksi'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-[#8a9070] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#8a9070] text-sm">
                    {petugas.length === 0
                      ? <><UserCog size={32} className="text-gray-200 mx-auto mb-2" />Belum ada akun petugas. Klik "Tambah Petugas" untuk membuat.</>
                      : 'Tidak ada hasil pencarian.'
                    }
                  </td>
                </tr>
              ) : filtered.map(p => (
                <PetugasRow key={p.id} p={p}
                  onEdit={setEditItem}
                  onToggleStatus={handleToggleStatus}
                  onResetPw={setResetTarget}
                  isProcessing={processing}
                />
              ))}
            </tbody>
          </table>
        )}

        <div className="px-5 py-3 border-t border-gray-50 text-xs text-[#8a9070]">
          {filtered.length} dari {petugas.length} petugas
        </div>
      </div>

      {/* Modals / Drawer */}
      {showCreate && (
        <CreatePetugasModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {resetTarget && (
        <ResetPasswordModal
          petugas={resetTarget}
          onClose={() => setResetTarget(null)}
          onReset={handleResetPassword}
        />
      )}

      <EditDrawer petugas={editItem} onClose={() => setEditItem(null)} onSave={handleSaveEdit} />
    </div>
  );
}
