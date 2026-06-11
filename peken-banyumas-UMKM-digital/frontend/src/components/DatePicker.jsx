/**
 * DatePicker — wrapper flatpickr dengan locale Indonesian.
 *
 * Props:
 *   value    : string  "YYYY-MM-DD" — nilai yang tersimpan/dikirim ke backend
 *   onChange : (isoString: string) => void
 *   placeholder : string (opsional)
 *   className   : string (opsional, diterapkan ke <input>)
 *
 * WARNING (dari plan): jangan pakai opsi `altInput` flatpickr di dalam React —
 * flatpickr akan inject input kedua lewat DOM langsung dan bentrok dengan
 * React re-render. Gunakan single-input pattern ini.
 */
import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import { Indonesian } from "flatpickr/dist/l10n/id.js";
import "flatpickr/dist/flatpickr.min.css";

/** Konversi Date object → "YYYY-MM-DD" tanpa efek timezone. */
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DatePicker({ value, onChange, placeholder = "Pilih tanggal", className = "" }) {
  const inputRef = useRef(null);
  const fpRef    = useRef(null);

  useEffect(() => {
    fpRef.current = flatpickr(inputRef.current, {
      locale:        Indonesian,
      dateFormat:    "l, j F Y",           // tampil: "Senin, 22 Juni 2026"
      defaultDate:   value ? new Date(`${value}T00:00:00`) : null,
      disableMobile: true,                 // pakai flatpickr juga di mobile
      onChange: (dates) => {
        onChange(dates[0] ? toISO(dates[0]) : "");
      },
    });

    return () => {
      fpRef.current?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);                                  // hanya mount/unmount

  // Sync value dari luar (misal saat modal dibuka dengan nilai baru)
  useEffect(() => {
    if (!fpRef.current) return;
    const current = fpRef.current.selectedDates[0];
    const currentISO = current ? toISO(current) : "";
    if (value !== currentISO) {
      fpRef.current.setDate(value ? new Date(`${value}T00:00:00`) : null, false);
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      readOnly
      placeholder={placeholder}
      className={className}
    />
  );
}
