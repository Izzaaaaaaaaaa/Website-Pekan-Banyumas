// ProfileSideDrawer.jsx — Read-only profile slide-in drawer
// Digunakan dari EventDetail > Permintaan tab agar admin bisa lihat profil
// lengkap tanpa keluar dari halaman event. Tidak ada navigasi, tidak ada edit.
import React from 'react';
import { X, Phone, Mail, MapPin, Calendar, ExternalLink, User } from 'lucide-react';

/**
 * Props:
 *   open      {boolean}  — apakah drawer visible
 *   onClose   {fn}       — callback untuk menutup drawer
 *   profile   {object}   — data profil dari detailCacheRef (sudah include _eventCount)
 *   type      {string}   — 'artisan' | 'kolaborator'
 *   entityId  {string}   — id entitas, untuk link "Buka halaman penuh"
 */
export default function ProfileSideDrawer({ open, onClose, profile, type, entityId }) {
  if (!open || !profile) return null;

  const isArtisan = type === 'artisan';

  // Normalisasi field dari shape artisan vs kolaborator
  const name       = profile.namaArtisan || profile.nama_usaha || profile.nama || '—';
  const bio        = profile.deskripsi   || profile.bio         || '';
  const noHp       = profile.no_hp       || '';
  const email      = profile.email       || '';
  const kota       = profile.kota        || '';
  const events     = profile._events     || [];
  const fotoUrl    = profile.foto_url    || null;

  // Kategori: artisan = kategori_usaha, kolaborator = subsektor
  const categoryLabel  = isArtisan ? 'Kategori Usaha' : 'Subsektor';
  const categoryValues = isArtisan
    ? (profile.kategori_usaha || [])
    : (profile.subsektor      || []);

  // Link ke halaman penuh (buka tab baru, tidak menavigasi keluar EventDetail)
  const fullPagePath = isArtisan
    ? `/artisan?openId=${entityId}`
    : `/kolaborator?openId=${entityId}`;

  const handleOpenFull = (e) => {
    e.stopPropagation();
    window.open(fullPagePath, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Backdrop semi-transparan — klik untuk tutup */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-screen w-[400px] max-w-full bg-white shadow-2xl z-50 flex flex-col"
        style={{ borderLeft: '1px solid #e4e7d4' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e7d4] shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isArtisan
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {isArtisan ? 'Artisan' : 'Kolaborator'}
            </span>
            <span className="text-xs text-[#8a9070]">Profil Lengkap</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[10px] hover:bg-[#f7f8f2] text-[#8a9070] hover:text-[#5a6040] transition"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Avatar + Nama */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center text-xl font-bold shrink-0 ${
              isArtisan
                ? 'bg-orange-50 text-orange-600'
                : 'bg-blue-50 text-blue-600'
            }`}>
              {fotoUrl
                ? <img src={fotoUrl} alt={name} className="w-full h-full object-cover rounded-[16px]" />
                : (name || '?').charAt(0).toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-bold text-[#1e2010] text-base leading-tight">{name}</h3>
              {kota && (
                <p className="flex items-center gap-1 text-[#8a9070] text-xs mt-1">
                  <MapPin size={11} /> {kota}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <div>
              <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-2">Bio</p>
              <p className="text-sm text-[#5a6040] leading-relaxed">{bio}</p>
            </div>
          )}

          {/* Kontak */}
          {(noHp || email) && (
            <div>
              <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-2">Kontak</p>
              <div className="space-y-1.5">
                {noHp && (
                  <div className="flex items-center gap-2 text-sm text-[#5a6040]">
                    <Phone size={13} className="text-[#8a9070] shrink-0" />
                    <span>{noHp}</span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2 text-sm text-[#5a6040]">
                    <Mail size={13} className="text-[#8a9070] shrink-0" />
                    <span>{email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Kategori chips */}
          {categoryValues.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-2">{categoryLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {categoryValues.map(v => (
                  <span key={v}
                    className="px-2.5 py-1 bg-[#eef0e0] text-[#5a6040] border border-[#c8d09a] rounded-full text-xs font-medium">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Riwayat Event — list lengkap group by tahun (descending) */}
          <div>
            <p className="text-xs font-semibold text-[#8a9070] uppercase tracking-wider mb-2">
              Riwayat Event {events.length > 0 && <span className="text-[#5a6040]">({events.length})</span>}
            </p>
            {events.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-[#8a9070]">
                <Calendar size={13} className="shrink-0" />
                <span>Belum ada riwayat event</span>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  [...events]
                    .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0))
                    .reduce((acc, ev) => {
                      const year = new Date(ev.tanggal || 0).getFullYear() || '—';
                      (acc[year] = acc[year] || []).push(ev);
                      return acc;
                    }, {})
                )
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, list]) => (
                    <div key={year}>
                      <p className="text-[10px] font-bold text-[#8a9070] tracking-wider mb-1.5">{year}</p>
                      <div className="space-y-1.5">
                        {list.map(ev => (
                          <div key={ev.id} className="border border-[#e4e7d4] rounded-[10px] px-3 py-2">
                            <p className="font-semibold text-[#1e2010] text-sm leading-tight">{ev.nama || 'Event'}</p>
                            <p className="text-xs text-[#8a9070] mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <Calendar size={11} />
                              {new Date(ev.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              {(ev.peran || ev.posisi_event || ev.stand_id) && (
                                <><span>·</span><span>{ev.peran || ev.posisi_event || ev.stand_id}</span></>
                              )}
                              {ev.status_request && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#eef0e0] text-[#5a6040]">{ev.status_request}</span>
                              )}
                              {ev.status_kehadiran && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#eef0e0] text-[#5a6040]">{ev.status_kehadiran}</span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer — link buka halaman penuh di tab baru */}
        <div className="shrink-0 px-5 py-4 border-t border-[#e4e7d4] bg-[#f7f8f2]">
          <button
            onClick={handleOpenFull}
            className="w-full flex items-center justify-center gap-2 bg-white border border-[#c8d09a] text-[#5a6040] hover:bg-[#eef0e0] hover:border-[#7a8a52] hover:text-[#1e2010] rounded-[12px] px-4 py-2.5 text-sm font-semibold transition"
          >
            <ExternalLink size={14} />
            Buka halaman penuh
          </button>
        </div>
      </div>
    </>
  );
}
