// src/pages/Settings.jsx
// Halaman pengaturan akun untuk admin/petugas Gate.
// Endpoint: PUT /api/auth/profile (ganti nama), PUT /api/auth/password (ganti password)
// Bisa diakses oleh semua role yang sudah login (admin & petugas).
import React, { useState, useEffect } from 'react';
import { User, KeyRound, CheckCircle, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { authApi } from '../services/endpoints';
import { getUser, setUser } from '../lib/auth';
import { extractError } from '../lib/unwrap';
import { useToast } from '../components/Toast';

// ── Sub-komponen: Card wrapper ────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, title, subtitle, children }) => (
    <div className="bg-white rounded-[16px] shadow-sm border border-[#e4e7d4] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e4e7d4] flex items-center gap-3 bg-[#f7f8f2]/50">
            <div className="w-9 h-9 rounded-[12px] bg-[#eef4eb] text-[#7a8a52] flex items-center justify-center shrink-0">
                <Icon size={18} />
            </div>
            <div>
                <h3 className="font-bold text-[#1e2010] text-base leading-tight">{title}</h3>
                <p className="text-xs text-[#8a9070] mt-0.5">{subtitle}</p>
            </div>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

// ── Sub-komponen: Form input ──────────────────────────────────────────────────
const FormInput = ({ label, type = 'text', value, onChange, placeholder, suffix, disabled }) => (
    <div>
        <label className="block text-sm font-semibold text-[#5a6040] mb-1.5">{label}</label>
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm text-[#1e2010]
                           focus:outline-none focus:ring-2 focus:ring-[#7a8a52] focus:border-transparent
                           disabled:bg-[#f7f8f2] disabled:text-[#8a9070] disabled:cursor-not-allowed
                           transition pr-10"
            />
            {suffix && (
                <button
                    type="button"
                    onClick={suffix.onClick}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a9070] hover:text-[#5a6040] transition"
                    tabIndex={-1}
                >
                    {suffix.icon}
                </button>
            )}
        </div>
    </div>
);

// ── Password strength indicator ───────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
    if (!password) return null;
    const len = password.length;
    let strength = 0;
    if (len >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ['Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
    const colors = ['bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-[#7A9B6A]'];
    const textColors = ['text-[#B87272]', 'text-[#C4A24D]', 'text-blue-500', 'text-[#7a8a52]'];

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? colors[strength - 1] : 'bg-[#e4e7d4]'}`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${textColors[strength - 1] || 'text-[#8a9070]'}`}>
                {strength > 0 ? labels[strength - 1] : ''}
            </p>
        </div>
    );
};

// ── Halaman Settings ──────────────────────────────────────────────────────────

const Settings = () => {
    const toast = useToast();

    // Data user dari localStorage
    const [userData, setUserData] = useState({ nama: '', email: '', role: '' });

    // State form ganti nama
    const [namaBaru, setNamaBaru]         = useState('');
    const [isUpdatingNama, setIsUpdatingNama] = useState(false);

    // State form ganti password
    const [pwLama, setPwLama]             = useState('');
    const [pwBaru, setPwBaru]             = useState('');
    const [pwKonfirmasi, setPwKonfirmasi] = useState('');
    const [showPwLama, setShowPwLama]     = useState(false);
    const [showPwBaru, setShowPwBaru]     = useState(false);
    const [showPwKonfirmasi, setShowPwKonfirmasi] = useState(false);
    const [isUpdatingPw, setIsUpdatingPw] = useState(false);

    useEffect(() => {
        const u = getUser();
        if (u) {
            setUserData(u);
            setNamaBaru(u.nama || '');
        }
    }, []);

    // ── Handler: ganti nama ───────────────────────────────────────────────────
    const handleUpdateNama = async (e) => {
        e.preventDefault();
        const nama = namaBaru.trim();
        if (!nama) {
            toast.error('Nama tidak boleh kosong');
            return;
        }
        if (nama === userData.nama) {
            toast.warning('Nama tidak berubah');
            return;
        }
        try {
            setIsUpdatingNama(true);
            // authApi.updateProfile returns the unwrapped updated-user subset.
            // Pakai nilai lokal sebagai fallback supaya nama tidak pernah jadi
            // undefined di localStorage walau bentuk response berubah.
            const data = await authApi.updateProfile({ nama });
            const newUser = { ...userData, nama: data?.nama || nama };
            // setUser writes to localStorage AND dispatches STORAGE_EVENTS.USER_UPDATE,
            // so AdminLayout's sidebar updates reactively — no manual dispatch needed.
            setUser(newUser);
            setUserData(newUser);
            toast.success('Nama berhasil diperbarui');
        } catch (error) {
            toast.error(extractError(error, 'Gagal memperbarui nama'));
        } finally {
            setIsUpdatingNama(false);
        }
    };

    // ── Handler: ganti password ───────────────────────────────────────────────
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!pwLama || !pwBaru || !pwKonfirmasi) {
            toast.error('Semua field password wajib diisi');
            return;
        }
        if (pwBaru.length < 8) {
            toast.error('Password baru minimal 8 karakter');
            return;
        }
        if (pwBaru !== pwKonfirmasi) {
            toast.error('Konfirmasi password tidak cocok');
            return;
        }
        if (pwBaru === pwLama) {
            toast.error('Password baru tidak boleh sama dengan password lama');
            return;
        }
        try {
            setIsUpdatingPw(true);
            await authApi.updatePassword({
                password_lama: pwLama,
                password_baru: pwBaru,
            });
            toast.success('Password berhasil diubah. Silakan login ulang jika perlu.');
            // Reset form
            setPwLama('');
            setPwBaru('');
            setPwKonfirmasi('');
        } catch (error) {
            toast.error(extractError(error, 'Gagal mengubah password. Periksa password lama Anda.'));
        } finally {
            setIsUpdatingPw(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* Info Akun */}
            <div className="bg-white rounded-[16px] shadow-sm border border-[#e4e7d4] p-6 flex items-center gap-5">
                <div className="w-14 h-14 rounded-[16px] bg-[#7a8a52] text-white flex items-center justify-center text-2xl font-bold shrink-0">
                    {(userData.nama || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-[#1e2010] text-lg leading-tight truncate">{userData.nama || '—'}</p>
                    <p className="text-sm text-[#8a9070] truncate">{userData.email || '—'}</p>
                    <span className={`inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full
                        ${userData.role === 'admin'
                        ? 'bg-[#eeeef8] text-[#7A80B0] border border-[#b8badc]'
                        : 'bg-blue-100 text-[#6B8FA3] border border-[#b0c8d8]'
                    }`}>
                        <ShieldCheck size={11} />
                        {userData.role === 'admin' ? 'Admin' : 'Petugas'}
                    </span>
                </div>
            </div>

            {/* Form Ganti Nama */}
            <SectionCard
                icon={User}
                title="Ganti Nama Tampilan"
                subtitle="Nama ini muncul di sidebar dan header sistem"
            >
                <form onSubmit={handleUpdateNama} className="space-y-4">
                    <FormInput
                        label="Nama Baru"
                        value={namaBaru}
                        onChange={e => setNamaBaru(e.target.value)}
                        placeholder="Masukkan nama baru"
                        disabled={isUpdatingNama}
                    />
                    <button
                        type="submit"
                        disabled={isUpdatingNama || !namaBaru.trim() || namaBaru.trim() === userData.nama}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30]
                                   disabled:bg-[#a8b07a] disabled:cursor-not-allowed text-white font-semibold
                                   px-6 py-2.5 rounded-[12px] transition text-sm"
                    >
                        {isUpdatingNama
                            ? <><Loader2 size={16} className="animate-spin" /> Menyimpan…</>
                            : <><CheckCircle size={16} /> Simpan Nama</>
                        }
                    </button>
                </form>
            </SectionCard>

            {/* Form Ganti Password */}
            <SectionCard
                icon={KeyRound}
                title="Ganti Password"
                subtitle="Verifikasi password lama diperlukan untuk keamanan akun"
            >
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <FormInput
                        label="Password Lama"
                        type={showPwLama ? 'text' : 'password'}
                        value={pwLama}
                        onChange={e => setPwLama(e.target.value)}
                        placeholder="Masukkan password saat ini"
                        disabled={isUpdatingPw}
                        suffix={{
                            onClick: () => setShowPwLama(v => !v),
                            icon: showPwLama ? <EyeOff size={16} /> : <Eye size={16} />,
                        }}
                    />
                    <div>
                        <FormInput
                            label="Password Baru"
                            type={showPwBaru ? 'text' : 'password'}
                            value={pwBaru}
                            onChange={e => setPwBaru(e.target.value)}
                            placeholder="Minimal 8 karakter"
                            disabled={isUpdatingPw}
                            suffix={{
                                onClick: () => setShowPwBaru(v => !v),
                                icon: showPwBaru ? <EyeOff size={16} /> : <Eye size={16} />,
                            }}
                        />
                        <PasswordStrength password={pwBaru} />
                    </div>
                    <FormInput
                        label="Konfirmasi Password Baru"
                        type={showPwKonfirmasi ? 'text' : 'password'}
                        value={pwKonfirmasi}
                        onChange={e => setPwKonfirmasi(e.target.value)}
                        placeholder="Ulangi password baru"
                        disabled={isUpdatingPw}
                        suffix={{
                            onClick: () => setShowPwKonfirmasi(v => !v),
                            icon: showPwKonfirmasi ? <EyeOff size={16} /> : <Eye size={16} />,
                        }}
                    />
                    {/* Match indicator */}
                    {pwBaru && pwKonfirmasi && (
                        <p className={`text-xs font-medium flex items-center gap-1 ${pwBaru === pwKonfirmasi ? 'text-[#7a8a52]' : 'text-[#B87272]'}`}>
                            {pwBaru === pwKonfirmasi
                                ? <><CheckCircle size={12} /> Password cocok</>
                                : '✕ Password tidak cocok'
                            }
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isUpdatingPw || !pwLama || !pwBaru || !pwKonfirmasi}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30]
                                   disabled:bg-[#a8b07a] disabled:cursor-not-allowed text-white font-semibold
                                   px-6 py-2.5 rounded-[12px] transition text-sm"
                    >
                        {isUpdatingPw
                            ? <><Loader2 size={16} className="animate-spin" /> Mengubah…</>
                            : <><KeyRound size={16} /> Ubah Password</>
                        }
                    </button>
                </form>
            </SectionCard>

        </div>
    );
};

export default Settings;