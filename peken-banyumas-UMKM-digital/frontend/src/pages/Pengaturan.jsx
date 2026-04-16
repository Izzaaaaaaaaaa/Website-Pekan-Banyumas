import { useState } from "react";
import { Settings } from "lucide-react";
import ProfileForm from "../components/pengaturan/ProfileForm";
import SecurityForm from "../components/pengaturan/SecurityForm";
import "../assets/styles/settings.css";

export default function Pengaturan() {

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
        <ProfileForm />
        <SecurityForm />
      </div>
    </div>
  );
}