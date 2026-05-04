// ZoneSelector.jsx — Klik untuk pilih stand dari peta zona event
import React from 'react';

export default function ZoneSelector({ value, onChange, zones, compact = false }) {
  // Defensive: pastikan zones selalu array, setiap zona punya stands array
  const safeZones = (Array.isArray(zones) ? zones : []).map(z => ({
    zona:   z.zona  || '?',
    label:  z.label || `Zona ${z.zona || '?'}`,
    warna:  z.warna || '#374151',
    stands: Array.isArray(z.stands) ? z.stands : [],
  }));

  if (safeZones.length === 0) {
    return (
      <div className="text-center py-5 text-gray-400 text-sm">
        <p className="text-xl mb-1">🗺️</p>
        <p className="text-xs">Belum ada zona. Konfigurasi di tab Kelola Zona.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {safeZones.map(z => {
        const free = z.stands.filter(s => !s.occupied).length;
        return (
          <div key={z.zona}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: z.warna }} />
              <p className={`font-bold text-[#5a6040] uppercase tracking-wider flex-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {z.label}
              </p>
              <span className="text-[10px] text-gray-400">{free}/{z.stands.length} bebas</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {z.stands.map(s => {
                const sel  = value === s.id;
                const occ  = Boolean(s.occupied);
                const pend = !occ && Boolean(s.pending);
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={occ && !sel}
                    onClick={() => { if (!occ) onChange(s.id); }}
                    title={pend ? 'Permintaan pending' : undefined}
                    className={[
                      'flex flex-col items-center rounded-lg border font-bold transition-all',
                      compact ? 'px-1.5 py-1 min-w-[40px] text-[10px]' : 'px-2 py-1.5 min-w-[52px] text-xs',
                      sel  ? 'bg-[#7a8a52] text-white border-[#7a8a52] ring-2 ring-green-200 shadow'
                           : occ  ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed'
                           : pend ? 'bg-orange-50 text-orange-500 border-orange-200 hover:border-orange-400'
                                  : 'bg-[#f7f8f2] text-gray-700 border-[#e4e7d4] hover:border-[#7a8a52] hover:bg-[#eef0e0]',
                    ].join(' ')}
                  >
                    <span>{s.id}</span>
                    <span className={`font-normal leading-none mt-0.5 ${compact ? 'text-[7px]' : 'text-[8px]'} ${sel ? 'text-[#7a8a52]' : occ ? 'text-red-300' : pend ? 'text-orange-400' : 'text-gray-400'}`}>
                      {occ ? '✕' : sel ? '✓' : pend ? '~' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {value && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7a8a52] bg-[#eef0e0] border border-[#7a8a52] rounded-lg px-3 py-1.5 w-fit">
          <span>📍</span><span>{value}</span>
          <button type="button" onClick={() => onChange('')}
            className="ml-1 text-[#7a8a52] hover:text-red-400 transition leading-none text-sm">×</button>
        </div>
      )}
    </div>
  );
}
