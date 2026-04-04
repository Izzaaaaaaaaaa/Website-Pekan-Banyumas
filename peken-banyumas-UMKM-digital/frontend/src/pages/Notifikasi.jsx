import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, X, Package, ShoppingCart, AlertTriangle, Info, ChevronRight, Calendar, Clock, Tag } from "lucide-react";
import "../assets/styles/notifikasi.css";

// ── DATA DUMMY ──────────────────────────────────────────────
const NOTIF_DATA = [
  {
    id: 1,
    title: "Stok Mendoan Jumbo Hampir Habis",
    desc: "Sisa 4 pcs — di bawah batas minimum (20 pcs). Segera lakukan restok.",
    type: "stok",
    time: "13 Mar 2026, 07:00",
    read: false,
    detail: {
      produk: "Mendoan Jumbo",
      stokSisa: "4 pcs",
      stokMinimum: "20 pcs",
      kategori: "Camilan",
      saran: "Segera hubungi supplier atau tambah stok manual.",
    },
  },
  {
    id: 2,
    title: "Transaksi Baru Berhasil",
    desc: "Transaksi #TRX-2026-0313-004 senilai Rp 15.000 berhasil diproses.",
    type: "transaksi",
    time: "13 Mar 2026, 15:20",
    read: false,
    detail: {
      idTrx: "#TRX-2026-0313-004",
      nilai: "Rp 15.000",
      pelanggan: "Mas Andi",
      barang: "Sate Blengong × 1",
      status: "Selesai",
    },
  },
  {
    id: 3,
    title: "Stok Minuman Jahe Kritis",
    desc: "Sisa 2 pcs — jauh di bawah batas minimum (15 pcs).",
    type: "stok",
    time: "12 Mar 2026, 09:30",
    read: false,
    detail: {
      produk: "Minuman Jahe",
      stokSisa: "2 pcs",
      stokMinimum: "15 pcs",
      kategori: "Minuman",
      saran: "Prioritas restok sebelum acara dimulai.",
    },
  },
  {
    id: 4,
    title: "Promo Sate Campur Aktif",
    desc: "Diskon 10% untuk Sate Campur berlaku mulai hari ini hingga 15 Mar.",
    type: "promo",
    time: "11 Mar 2026, 08:00",
    read: true,
    detail: {
      produk: "Sate Campur",
      diskon: "10%",
      berlaku: "11 Mar – 15 Mar 2026",
      syarat: "Tidak dapat digabung dengan promo lain.",
    },
  },
  {
    id: 5,
    title: "Transaksi Berhasil — Ibu Rini",
    desc: "Mendoan Jumbo × 5 senilai Rp 25.000 telah selesai.",
    type: "transaksi",
    time: "10 Mar 2026, 10:58",
    read: true,
    detail: {
      idTrx: "#TRX-2026-0310-003",
      nilai: "Rp 25.000",
      pelanggan: "Ibu Rini",
      barang: "Mendoan Jumbo × 5",
      status: "Selesai",
    },
  },
  {
    id: 6,
    title: "Laporan Kas Mingguan Tersedia",
    desc: "Ringkasan kas minggu 3–10 Mar 2026 sudah bisa dilihat di Buku Kas.",
    type: "info",
    time: "10 Mar 2026, 08:00",
    read: true,
    detail: {
      periode: "3 – 10 Mar 2026",
      totalMasuk: "Rp 420.000",
      totalKeluar: "Rp 95.000",
      saldo: "Rp 325.000",
    },
  },
];

// ── TYPE CONFIG ─────────────────────────────────────────────
const TYPE_META = {
  stok: { label: "Stok", color: "#f97316", bg: "#fff7ed", icon: <Package size={16} /> },
  transaksi: { label: "Transaksi", color: "#2f6f4e", bg: "#eef5ef", icon: <ShoppingCart size={16} /> },
  promo: { label: "Promo", color: "#7c3aed", bg: "#f5f3ff", icon: <Tag size={16} /> },
  info: { label: "Info", color: "#0ea5e9", bg: "#f0f9ff", icon: <Info size={16} /> },
};

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum Dibaca" },
  { key: "sudah", label: "Sudah Dibaca" },
];

// ── ICON AVATAR ──────────────────────────────────────────────
function NotifAvatar({ type }) {
  const meta = TYPE_META[type];
  return (
    <div className="notif-avatar" style={{ background: meta.bg, color: meta.color }}>
      {type === "stok" && <AlertTriangle size={20} />}
      {type === "transaksi" && <ShoppingCart size={20} />}
      {type === "promo" && <Tag size={20} />}
      {type === "info" && <Info size={20} />}
    </div>
  );
}

// ── DETAIL MODAL ─────────────────────────────────────────────
function DetailModal({ notif, onClose }) {
  if (!notif) return null;
  const meta = TYPE_META[notif.type];
  const rows = Object.entries(notif.detail);

  return (
    <div className="notif-overlay" onClick={onClose}>
      <div className="notif-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="nm-header">
          <div className="nm-title-row">
            <NotifAvatar type={notif.type} />
            <h3 className="nm-title">{notif.title}</h3>
          </div>
          <button className="nm-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Time badge */}
        <div className="nm-time-box">
          <div className="nm-time-left">
            <p className="nm-time-label">Waktu Notifikasi</p>
            <p className="nm-time-val">
              <Calendar size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
              {notif.time}
            </p>
          </div>
          <span className="nm-type-badge" style={{ background: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
        </div>

        {/* Detail rows */}
        <div className="nm-detail-box">
          <p className="nm-detail-title">
            <Info size={14} style={{ marginRight: 6 }} />
            Detail Informasi
          </p>
          {rows.map(([k, v]) => (
            <div className="nm-row" key={k}>
              <span className="nm-key">{k.charAt(0).toUpperCase() + k.slice(1)}</span>
              <span className="nm-val">{v}</span>
            </div>
          ))}
        </div>

        <div className="nm-footer">
          <button className="nm-btn-tutup" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────
export default function Notifikasi() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("semua");
  const [notifs, setNotifs] = useState(NOTIF_DATA);
  const [selected, setSelected] = useState(null);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const filtered = notifs.filter((n) => {
    if (filter === "belum") return !n.read;
    if (filter === "sudah") return n.read;
    return true;
  });

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleClick = (notif) => {
    // mark as read
    setNotifs((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setSelected(notif);
  };

  return (
    <div className="notif-page">
      {/* TOP BAR */}
      <div className="notif-topbar">
        <div className="notif-topbar-left">
          <h1 className="notif-page-title">Notifikasi</h1>
        </div>
        <div className="notif-topbar-right">
          <span className="notif-date">
            <Clock size={13} style={{ marginRight: 5 }} />
            Kamis, 2 April 2026
          </span>
          <div className="notif-bell-wrap">
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-bell-badge">{unreadCount}</span>}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="notif-content">

        {/* SECTION HEADER */}
        <div className="notif-section-header">
          <div>
            <h2 className="notif-section-title">
              <Bell size={20} style={{ marginRight: 10, color: "#f97316" }} />
              Notifikasi
            </h2>
            <p className="notif-section-sub">Semua pemberitahuan aktivitas akun & kios Anda</p>
          </div>
          {unreadCount > 0 && (
            <button className="notif-btn-markall" onClick={markAllRead}>
              <CheckCheck size={15} style={{ marginRight: 6 }} />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* FILTER PILLS */}
        <div className="notif-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`notif-pill ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.key === "belum" && unreadCount > 0 && (
                <span className="notif-pill-count">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="notif-list">
          {filtered.length === 0 ? (
            <div className="notif-empty">
              <Bell size={36} style={{ color: "#d1d5db", marginBottom: 10 }} />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            filtered.map((n) => {
              const meta = TYPE_META[n.type];
              return (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? "unread" : ""}`}
                  onClick={() => handleClick(n)}
                >
                  <NotifAvatar type={n.type} />
                  <div className="notif-item-body">
                    <div className="notif-item-top">
                      <span className="notif-item-title">{n.title}</span>
                      <div className="notif-item-meta">
                        {!n.read && <span className="notif-dot" />}
                        <span className="notif-item-time">{n.time}</span>
                      </div>
                    </div>
                    <p className="notif-item-desc">{n.desc}</p>
                    <span
                      className="notif-type-chip"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                  <ChevronRight size={16} className="notif-chevron" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      <DetailModal notif={selected} onClose={() => setSelected(null)} />
    </div>
  );
}