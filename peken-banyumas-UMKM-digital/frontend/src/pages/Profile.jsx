import { useState } from "react";
import { useRef } from "react";
import { User,
  Settings,
  LogOut,
  Store,
  MapPin,
  Tag,
  CheckCircle,
  Package,
  Receipt,
  Star 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmLogoutModal from "../components/modals/ConfirmLogoutModal";
import "../assets/styles/profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const fileInputRef = useRef(null);
  const [photo, setPhoto] = useState(null);

  const user = {
    nama: "Bu Yati Wulandari",
    role: "Pemilik Kios",
    kios: "Sate Blengong Bu Yati",
    stand: "A-12",
    zona: "Zona Kuliner",
    kategori: "Kuliner Tradisional",
    status: "Aktif",
    inisial: "BY",
    stats: { produk: 6, transaksi: 134 },
  };

  return (
    <div className="pf-page">
      <div className="pf-header">
        <div className="pf-eyebrow"><User size={14} />Akun</div>
        <div className="pf-title">
          Profile <em>Saya</em>
        </div>
      </div>

      <div className="pf-card">
        <div className="pf-avatar-wrap" onClick={() => fileInputRef.current.click()}>
          <div className="pf-avatar">
            {photo ? (
              <img src={photo} alt="profile" className="pf-avatar-img" />
            ) : (
              user.inisial
            )}
          </div>
          <div className="pf-avatar-overlay">
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          const img = new Image();
          const reader = new FileReader();

          reader.onload = (ev) => {
            img.src = ev.target.result;
            img.onload = () => {
            const SIZE = 300; 
            const canvas = document.createElement("canvas");
            canvas.width = SIZE;
            canvas.height = SIZE;

            const ctx = canvas.getContext("2d");

            // hitung crop center
            const srcSize = Math.min(img.width, img.height); // ambil sisi terpendek
            const srcX = (img.width  - srcSize) / 2;         // center horizontal
            const srcY = (img.height - srcSize) / 2;         // center vertical

            // gambar dengan center-crop → dipaksa jadi kotak 200x200
            ctx.drawImage(
              img,
              srcX, srcY, srcSize, srcSize, // source: crop tengah
              0,    0,    SIZE,   SIZE      // dest: 200x200
            );

            const compressed = canvas.toDataURL("image/jpeg", 0.7);
            setPhoto(compressed);
          };
          };

          reader.readAsDataURL(file);
        }}
        />

        {photo && (
          <button className="pf-remove-photo" onClick={() => setPhoto(null)}>
            Hapus Foto
          </button>
        )}
        <div className="pf-name">{user.nama}</div>
        <div className="pf-role">
          {user.role} · {user.kios} · Stand {user.stand}
        </div>

        <div className="pf-stats">
          <div className="pf-stat">
            <span className="pf-stat-num">{user.stats.produk}</span>
            <span className="pf-stat-label"><Package size={16} />Total Produk</span>
          </div>
          <div className="pf-stat-divider" />
          <div className="pf-stat">
            <span className="pf-stat-num">{user.stats.transaksi}</span>
            <span className="pf-stat-label"><Receipt size={16} />Transaksi</span>
          </div>
          <div className="pf-stat-divider" />
        </div>
      </div>

      <div className="pf-info-card">
        <div className="pf-info-title">Info Kios</div>
        <div className="pf-info-grid">
          <div className="pf-info-item">
            <span className="pf-info-label">NAMA KIOS</span>
            <span className="pf-info-value"><Store size={16} />{user.kios}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">NO. STAND</span>
            <span className="pf-info-value"><MapPin size={16} />{user.stand} · {user.zona}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">KATEGORI</span>
            <span className="pf-info-value"><Tag size={16} />{user.kategori}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">STATUS</span>
            <span className="pf-status-pill"><CheckCircle size={14} />{user.status}</span>
          </div>
        </div>
      </div>

      <div className="pf-actions">
        <button className="pf-btn-settings" onClick={() => navigate("/pengaturan")}>
          <Settings size={16} />Pengaturan Akun
        </button>
        <button className="pf-btn-logout" onClick={() => setShowLogout(true)}>
          <LogOut size={16} />Logout
        </button>
      </div>

      <ConfirmLogoutModal
        show={showLogout}
        onClose={() => setShowLogout(false)}
        userName={user.nama}
      />
    </div>
  );
}