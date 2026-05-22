import { useState } from "react";
import { Settings } from "lucide-react";
import ProfileForm from "../components/pengaturan/ProfileForm";
import SecurityForm from "../components/pengaturan/SecurityForm";
import Toast from "../components/Toast";
import "../assets/styles/settings.css";

export default function Pengaturan() {

  const [toast, setToast] = useState("");
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="st-page">
      {/* HEADER */}
      <div className="st-header">
        <div className="pg-eye"><Settings size={16} />Akun</div>
        <div className="pg-title">
          Pengaturan <em>Akun</em>
        </div>
        <div className="pg-sub">Ubah informasi dan preferensi kamu</div>
      </div>

      {/* GRID */}
      <div className="st-grid">
        <ProfileForm onToast={showToast} />
        <SecurityForm onToast={showToast} />
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}