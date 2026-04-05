import { useState } from "react";
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

  const user = {
    nama: "Bu Yati Wulandari",
    role: "Pemilik Kios",
    kios: "Sate Blengong Bu Yati",
    stand: "A-12",
    zona: "Zona Kuliner",
    kategori: "Kuliner Tradisional",
    status: "Aktif",
    inisial: "BY",
    stats: { produk: 6, transaksi: 134, rating: 4.9 },
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
        <div className="pf-avatar">{user.inisial}</div>
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
          <div className="pf-stat">
            <span className="pf-stat-num">{user.stats.rating}</span>
            <span className="pf-stat-label"><Star size={16} />Rating</span>
          </div>
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