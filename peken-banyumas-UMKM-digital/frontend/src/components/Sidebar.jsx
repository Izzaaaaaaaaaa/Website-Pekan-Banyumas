import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import { Home, Box, Book, Ticket, FileText, Settings, User, Globe } from "lucide-react";
import "../assets/styles/sidebar.css";
import logo from "../assets/images/logo.png";
import ConfirmLogoutModal from "./modals/ConfirmLogoutModal";

export default function Sidebar({ open, setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);

  const nama  = localStorage.getItem("nama")  || "Artisan";
  const email = localStorage.getItem("email") || "";
  const initials = nama.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const [profilePhoto, setProfilePhoto] = useState(
    localStorage.getItem("profilePhoto")
  );

  useEffect(() => {
    const sync = () => {
      setProfilePhoto(localStorage.getItem("profilePhoto"));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const menu = [
    { path: "/", label: "Dashboard", icon: <Home size={18} /> },
    { path: "/stok", label: "Manajemen Stok", icon: <Box size={18} /> },
    { path: "/kas", label: "Buku Kas", icon: <Book size={18} /> },
    { path: "/event", label: "Event", icon: <Ticket size={18} /> },
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

          {/* BRAND HEADER — logo + nama app */}
          <div className="sb-header">
            <div className="sb-header-logo">
              <img src={logo} alt="logo" />
            </div>
            <div className="sb-header-text">
              <span className="sb-header-title">Dashboard <em>ARTISAN</em></span>
              <span className="sb-header-sub">PEKEN BANYUMASAN</span>
            </div>
          </div>

          <div className="sb-kios">
            <p className="lbl">KIOS ANDA</p>
            <h3>{nama}</h3>
            <span>{email}</span>
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
        <div
            className="si"
            onClick={() => {
              window.open(import.meta.env.VITE_COMPANY_URL || "http://localhost:5173", "_blank");
              setOpen(false);
            }}
          >
            <span className="icon"><Globe size={15} /></span>
            <span className="si-label">Beranda Publik</span>
          </div>
        <div className="sb-profile" onClick={() => setShowLogout(true)}>
          <div className="avatar">{profilePhoto ? (
            <img src={profilePhoto} alt="profile" 
            className="sb-avatar-img"
            />): initials}
          </div>
          <div className="sb-profile-info">
            <strong>{nama}</strong>
            <p>{email}</p>
          </div>
          <span className="sb-profile-arrow">›</span>
        </div>

      </aside>

      {/* MODAL LOGOUT — pakai ConfirmLogoutModal */}
      <ConfirmLogoutModal
        show={showLogout}
        onClose={() => setShowLogout(false)}
        userName={nama}
      />
    </>
  );
}