import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Home, Box, Book, Tag, FileText, Settings, User, Store } from "lucide-react";
import "../assets/styles/sidebar.css";
import logo from "../assets/images/logo.jpeg";
import ConfirmLogoutModal from "./modals/ConfirmLogoutModal";

export default function Sidebar({ open, setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);

  const menu = [
    { path: "/", label: "Dashboard", icon: <Home size={18} /> },
    { path: "/stok", label: "Manajemen Stok", icon: <Box size={18} />, badge: 2 },
    { path: "/kas", label: "Buku Kas", icon: <Book size={18} /> },
    { path: "/promo", label: "Promo & Diskon", icon: <Tag size={18} /> },
    { path: "/riwayat", label: "Riwayat", icon: <FileText size={18} /> },
  ];

  return (
    <>
      {/* OVERLAY untuk mobile */}
      {open && (
        <div className="sb-backdrop" onClick={() => setOpen(false)} />
      )}

      <aside className={`sb ${open ? "open" : ""}`}>

        {/* HEADER */}
        <div className="sb-top">
          <div className="sb-event">
            <img src={logo} />
            <span>PEKEN BANYUMAS 2026</span>
          </div>

          {/* BRAND TITLE */}
          <div className="sb-brand">
            <span className="sb-brand-icon"><Store size={20} /></span>
            <span className="sb-brand-dashboard">Dashboard</span>
            <span className="sb-brand-umkm">UMKM</span>
          </div>

          <div className="sb-kios">
            <p className="lbl">KIOS ANDA</p>
            <h3>Sate Blengong Bu Yati</h3>
            <span>Stand A-12 · Zona Kuliner</span>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="sb-divider" />

        {/* SCROLL AREA */}
        <div className="sb-scroll">

          {/* MENU */}
          <div className="sb-nav">
            <p className="lbl">MENU</p>
            {menu.map((item) => (
              <div
                key={item.path}
                className={`si ${location.pathname === item.path ? "active" : ""}`}
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
              >
                <span className="icon">{item.icon}</span>
                <span className="si-label">{item.label}</span>
                {item.badge && <span className="badge">{item.badge}</span>}
              </div>
            ))}
          </div>

          {/* AKUN */}
          <div className="sb-akun">
            <p className="lbl">AKUN</p>
            <div
              className={`si ${location.pathname === "/pengaturan" ? "active" : ""}`}
              onClick={() => { navigate("/pengaturan"); setOpen(false); }}
            >
              <span className="icon"><Settings size={18} /></span>
              <span className="si-label">Pengaturan</span>
            </div>

            <div
              className={`si ${location.pathname === "/profile" ? "active" : ""}`}
              onClick={() => { navigate("/profile"); setOpen(false); }}
            >
              <span className="icon"><User size={18} /></span>
              <span className="si-label">Profile</span>
            </div>
          </div>

        </div>

        {/* FOOTER PROFILE — klik untuk logout */}
        <div className="sb-divider" />
        <div className="sb-profile" onClick={() => setShowLogout(true)}>
          <div className="avatar">BY</div>
          <div className="sb-profile-info">
            <strong>Bu Yati</strong>
            <p>Pemilik · Stand A-12</p>
          </div>
          <span className="sb-profile-arrow">›</span>
        </div>

      </aside>

      {/* MODAL LOGOUT — pakai ConfirmLogoutModal */}
      <ConfirmLogoutModal
        show={showLogout}
        onClose={() => setShowLogout(false)}
        userName="Bu Yati"
      />
    </>
  );
}