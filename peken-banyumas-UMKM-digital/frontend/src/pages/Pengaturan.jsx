import { useState } from "react";
import { Settings } from "lucide-react";
import ProfileForm from "../components/pengaturan/ProfileForm";
import SecurityForm from "../components/pengaturan/SecurityForm";
import PromoToast from "../components/PromoDiskon/PromoToast";
import "../assets/styles/settings.css";

export default function Pengaturan() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  return (
    <div className="st-page">
      {/* HEADER */}
      <div className="st-header">
        <div className="st-eyebrow"><Settings size={16} />Akun</div>
        <div className="st-title">
          Pengaturan <em>Akun</em>
        </div>
        <div className="st-subtitle">Ubah informasi dan preferensi kamu</div>
      </div>

      {/* GRID */}
      <div className="st-grid">
        <ProfileForm onToast={addToast} />
        <SecurityForm onToast={addToast} />
      </div>

      {/* TOAST STACK */}
      <div className="pd-toast-stack">
        {toasts.map((t) => (
          <PromoToast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </div>
  );
}