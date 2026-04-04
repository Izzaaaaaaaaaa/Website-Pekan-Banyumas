import { useEffect, useState } from "react";
import "../../assets/styles/promo.css";

/**
 * PromoToast — toast khusus halaman Promo & Diskon.
 * Tidak bergantung pada Toast.jsx milik BukuKas.
 *
 * Props:
 *  - message: string   → teks yang ditampilkan
 *  - type: "success" | "warning" | "danger"  (default: "success")
 */
export default function PromoToast({ message, type = "success" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // sedikit delay biar animasi slide-in kelihatan
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`pd-toast pd-toast-${type} ${visible ? "pd-toast-in" : ""}`}>
      {message}
    </div>
  );
}