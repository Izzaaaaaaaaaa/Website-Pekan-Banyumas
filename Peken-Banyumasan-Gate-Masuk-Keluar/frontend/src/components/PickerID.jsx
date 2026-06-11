// PickerID.jsx — date/time picker berbahasa Indonesia, UI identik di semua
// browser (flatpickr; picker native browser mengikuti bahasa OS/browser user
// dan tampilannya beda-beda per browser — tidak bisa dikontrol via kode).
// Value yang dikirim ke parent TETAP format kanonik: 'YYYY-MM-DD' / 'HH:MM',
// sama persis dengan <input type="date|time"> yang digantikan.
import React, { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import { Indonesian } from 'flatpickr/dist/l10n/id.js';
import 'flatpickr/dist/flatpickr.css';

const INPUT_CLASS = 'w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition bg-white';

const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function TanggalInput({ value, onChange }) {
  // SATU input saja — tanpa altInput. altInput membuat elemen input kedua via
  // manipulasi DOM langsung dan itu bentrok dengan re-render/StrictMode React
  // (input asli ikut tampil -> dua kotak bertumpuk). Di sini format Indonesia
  // dirender di input yang sama; nilai ISO 'YYYY-MM-DD' dihitung dari objek
  // Date sehingga kontrak state/BE tidak berubah.
  const ref = useRef(null);
  const fpRef = useRef(null);

  useEffect(() => {
    fpRef.current = flatpickr(ref.current, {
      locale: Indonesian,
      dateFormat: 'l, j F Y',                     // tampilan: "Senin, 22 Juni 2026"
      defaultDate: value ? new Date(`${value}T00:00:00`) : null,
      disableMobile: true,
      onChange: (dates) => onChange(dates[0] ? toISO(dates[0]) : ''),
    });
    return () => { try { fpRef.current?.destroy(); } catch (_) { /* sudah ter-destroy */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkron saat parent mengganti nilai dari luar (mis. buka modal edit)
  useEffect(() => {
    const fp = fpRef.current;
    if (!fp) return;
    const cur = fp.selectedDates[0] ? toISO(fp.selectedDates[0]) : '';
    if (cur !== (value || '')) {
      fp.setDate(value ? new Date(`${value}T00:00:00`) : null, false);
    }
  }, [value]);

  return <input ref={ref} className={INPUT_CLASS} placeholder="Pilih tanggal" />;
}

export function JamInput({ value, onChange }) {
  const ref = useRef(null);
  const fpRef = useRef(null);

  useEffect(() => {
    fpRef.current = flatpickr(ref.current, {
      locale: Indonesian,
      enableTime: true,
      noCalendar: true,
      time_24hr: true,              // selalu 24 jam, tanpa AM/PM
      dateFormat: 'H:i',
      defaultDate: value || null,
      disableMobile: true,
      onChange: (_d, str) => onChange(str),
    });
    return () => { try { fpRef.current?.destroy(); } catch (_) { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fp = fpRef.current;
    if (fp && (fp.input.value || '') !== (value || '')) {
      fp.setDate(value || null, false);
    }
  }, [value]);

  return <input ref={ref} className={INPUT_CLASS} placeholder="--:--" />;
}
