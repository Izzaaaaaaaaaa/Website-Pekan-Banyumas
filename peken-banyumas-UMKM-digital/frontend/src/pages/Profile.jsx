import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmLogoutModal from "../components/modals/ConfirmLogoutModal";
import "../assets/styles/profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  // 🔥 DATA DUMMY (sementara frontend aja)
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
        <div className="pf-eyebrow">👤 Akun</div>
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
            <span className="pf-stat-label">Total Produk</span>
          </div>
          <div className="pf-stat-divider" />
          <div className="pf-stat">
            <span className="pf-stat-num">{user.stats.transaksi}</span>
            <span className="pf-stat-label">Transaksi</span>
          </div>
          <div className="pf-stat-divider" />
          <div className="pf-stat">
            <span className="pf-stat-num">{user.stats.rating}</span>
            <span className="pf-stat-label">Rating</span>
          </div>
        </div>
      </div>

      <div className="pf-info-card">
        <div className="pf-info-title">Info Kios</div>
        <div className="pf-info-grid">
          <div className="pf-info-item">
            <span className="pf-info-label">NAMA KIOS</span>
            <span className="pf-info-value">{user.kios}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">NO. STAND</span>
            <span className="pf-info-value">{user.stand} · {user.zona}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">KATEGORI</span>
            <span className="pf-info-value">🪣 {user.kategori}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">STATUS</span>
            <span className="pf-status-pill">● {user.status}</span>
          </div>
        </div>
      </div>

      <div className="pf-actions">
        <button className="pf-btn-settings" onClick={() => navigate("/pengaturan")}>
          ⚙️ Pengaturan Akun
        </button>
        <button className="pf-btn-logout" onClick={() => setShowLogout(true)}>
          🚪 Logout
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