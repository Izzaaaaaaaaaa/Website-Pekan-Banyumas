import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, Store, MapPin, Tag, CheckCircle, Package, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmLogoutModal from "../components/modals/ConfirmLogoutModal";
import "../assets/styles/profile.css";

const BASE       = import.meta.env.VITE_API_URL || "http://127.0.0.1:8004";
const API_PROFIL = `${BASE}/api/artisan/pengaturan/profil`;
const API_STOK   = `${BASE}/api/artisan/stok`;
const API_KAS    = `${BASE}/api/artisan/kas`;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function Profile() {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);

  const [showLogout, setShowLogout] = useState(false);
  const [profil,     setProfil]     = useState(null);
  const [totalProduk, setTotalProduk] = useState(0);
  const [totalTrx,    setTotalTrx]    = useState(0);
  const [photo,      setPhoto]      = useState(localStorage.getItem("profilePhoto") || null);

  useEffect(() => {
    // Fetch profil
    fetch(API_PROFIL, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d?.id) setProfil(d); })
      .catch(() => {});

    // Fetch total produk
    fetch(API_STOK, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTotalProduk(Array.isArray(d) ? d.length : 0))
      .catch(() => {});

    // Fetch total transaksi (kas masuk)
    fetch(API_KAS, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTotalTrx(Array.isArray(d) ? d.filter(k => k.jenis === "masuk").length : 0))
      .catch(() => {});
  }, []);

  const nama     = profil?.pemilik     || localStorage.getItem("nama") || "Artisan";
  const kios     = profil?.nama_usaha  || "—";
  const kategori = (profil?.kategori_usaha || []).join(", ") || "—";
  const status   = profil?.status      || "aktif";
  const inisial  = nama.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // Stand dari event_artisans (ambil dari myEvents jika ada)
  const stand = "—";

  return (
    <div className="pf-page">
      <div className="pf-header">
        <div className="pg-eye"><User size={14} />Akun</div>
        <div className="pg-title">Profile <em>Saya</em></div>
      </div>

      <div className="pf-card">
        <div className="pf-avatar-wrap" onClick={() => !photo && fileInputRef.current.click()}>
          <div className="pf-avatar">
            {photo ? <img src={photo} alt="profile" className="pf-avatar-img" /> : inisial}
          </div>
          <div className="pf-avatar-overlay" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const img    = new Image();
            const reader = new FileReader();
            reader.onload = (ev) => {
              img.src = ev.target.result;
              img.onload = () => {
                const SIZE   = 300;
                const canvas = document.createElement("canvas");
                canvas.width = SIZE; canvas.height = SIZE;
                const ctx    = canvas.getContext("2d");
                const srcSize = Math.min(img.width, img.height);
                const srcX    = (img.width  - srcSize) / 2;
                const srcY    = (img.height - srcSize) / 2;
                ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE);
                const compressed = canvas.toDataURL("image/jpeg", 0.7);
                setPhoto(compressed);
                localStorage.setItem("profilePhoto", compressed);
              };
            };
            reader.readAsDataURL(file);
          }}
        />

        {photo && (
          <button className="pf-remove-photo" onClick={() => { setPhoto(null); localStorage.removeItem("profilePhoto"); }}>
            Hapus Foto
          </button>
        )}

        <div className="pf-name">{nama}</div>
        <div className="pf-role">Pemilik Kios · {kios}</div>

        <div className="pf-stats">
          <div className="pf-stat">
            <span className="pf-stat-num">{totalProduk}</span>
            <span className="pf-stat-label"><Package size={16} />Total Produk</span>
          </div>
          <div className="pf-stat-divider" />
          <div className="pf-stat">
            <span className="pf-stat-num">{totalTrx}</span>
            <span className="pf-stat-label"><Receipt size={16} />Transaksi</span>
          </div>
        </div>
      </div>

      <div className="pf-info-card">
        <div className="pf-info-title">Info Kios</div>
        <div className="pf-info-grid">
          <div className="pf-info-item">
            <span className="pf-info-label">NAMA KIOS</span>
            <span className="pf-info-value"><Store size={16} />{kios}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">EMAIL</span>
            <span className="pf-info-value"><MapPin size={16} />{profil?.email || "—"}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">KATEGORI</span>
            <span className="pf-info-value"><Tag size={16} />{kategori}</span>
          </div>
          <div className="pf-info-item">
            <span className="pf-info-label">STATUS</span>
            <span className="pf-status-pill"><CheckCircle size={14} />{status}</span>
          </div>
          {profil?.kota && (
            <div className="pf-info-item">
              <span className="pf-info-label">KOTA</span>
              <span className="pf-info-value"><MapPin size={16} />{profil.kota}</span>
            </div>
          )}
          {profil?.no_hp && (
            <div className="pf-info-item">
              <span className="pf-info-label">NO. HP</span>
              <span className="pf-info-value">{profil.no_hp}</span>
            </div>
          )}
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
        userName={nama}
      />
    </div>
  );
}
