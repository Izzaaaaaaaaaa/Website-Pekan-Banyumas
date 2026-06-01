import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, X, Package, ShoppingCart, AlertTriangle, Info, ChevronRight, Calendar, Clock, Tag } from "lucide-react";
import "../assets/styles/notifikasi.css";

const API_NOTIF  = "http://127.0.0.1:8000/api/notifikasi";
const API_READ   = "http://127.0.0.1:8000/api/notifikasi/read";
const API_READALL = "http://127.0.0.1:8000/api/notifikasi/read-all";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

// ── TYPE CONFIG ──────────────────────────────────────────────
const TYPE_META = {
  system:                      { label: "Sistem",     color: "#0ea5e9", bg: "#f0f9ff",  icon: <Info size={16} /> },
  artisan_request_approved:    { label: "Event",      color: "#6E7D47", bg: "#EEF1E2",  icon: <Calendar size={16} /> },
  artisan_request_rejected:    { label: "Event",      color: "#ef4444", bg: "#fff1f0",  icon: <Calendar size={16} /> },
  position_change_approved:    { label: "Stand",      color: "#6E7D47", bg: "#EEF1E2",  icon: <Info size={16} /> },
  position_change_rejected:    { label: "Stand",      color: "#ef4444", bg: "#fff1f0",  icon: <Info size={16} /> },
  event_starting_soon:         { label: "Event",      color: "#f97316", bg: "#fff7ed",  icon: <Calendar size={16} /> },
};

const getTypeMeta = (type) =>
  TYPE_META[type] || { label: "Info", color: "#0ea5e9", bg: "#f0f9ff", icon: <Info size={16} /> };

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum Dibaca" },
  { key: "sudah", label: "Sudah Dibaca" },
];

function NotifAvatar({ type }) {
  const meta = getTypeMeta(type);
  return (
    <div className="notif-avatar" style={{ background: meta.bg, color: meta.color }}>
      {type?.includes("stok") ? <AlertTriangle size={20} /> :
       type?.includes("transaksi") ? <ShoppingCart size={20} /> :
       type?.includes("promo") ? <Tag size={20} /> :
       type?.includes("event") || type?.includes("artisan") || type?.includes("position") ? <Calendar size={20} /> :
       <Info size={20} />}
    </div>
  );
}

function DetailModal({ notif, onClose }) {
  if (!notif) return null;
  const meta   = getTypeMeta(notif.type);
  const detail = notif.detail || {};
  const rows   = typeof detail === "object" ? Object.entries(detail) : [];

  return (
    <div className="notif-overlay" onClick={onClose}>
      <div className="notif-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nm-header">
          <div className="nm-title-row">
            <NotifAvatar type={notif.type} />
            <h3 className="nm-title">{notif.title}</h3>
          </div>
          <button className="nm-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="nm-time-box">
          <div className="nm-time-left">
            <p className="nm-time-label">Waktu Notifikasi</p>
            <p className="nm-time-val">
              <Calendar size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
              {notif.created_at ? new Date(notif.created_at).toLocaleString("id-ID") : "-"}
            </p>
          </div>
          <span className="nm-type-badge" style={{ background: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
        </div>

        <div className="nm-detail-box">
          <p className="nm-detail-title"><Info size={14} style={{ marginRight: 6 }} />Pesan</p>
          <p style={{ fontSize: 14, color: "#374151", marginBottom: 12 }}>{notif.message}</p>
          {rows.length > 0 && rows.map(([k, v]) => (
            <div className="nm-row" key={k}>
              <span className="nm-key">{k.charAt(0).toUpperCase() + k.slice(1)}</span>
              <span className="nm-val">{String(v)}</span>
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

export default function Notifikasi() {
  const [filter,   setFilter]   = useState("semua");
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchNotif = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(API_NOTIF, { headers: authHeaders() });
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : []);
    } catch {
      // biarkan kosong
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotif(); }, [fetchNotif]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const filtered = notifs.filter((n) => {
    if (filter === "belum") return !n.read;
    if (filter === "sudah") return n.read;
    return true;
  });

  const markAllRead = async () => {
    try {
      await fetch(API_READALL, { method: "POST", headers: authHeaders() });
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      try {
        await fetch(API_READ, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ notif_id: notif.id }),
        });
        setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
      } catch { /* ignore */ }
    }
    setSelected(notif);
  };

  const now = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <div className="notif-page">
      {/* TOP BAR */}
      <div className="notif-topbar">
        <div className="notif-topbar-left">
          <h1 className="notif-page-title">Notifikasi</h1>
        </div>
        <div className="notif-topbar-right">
          <span className="notif-date">
            <Clock size={13} style={{ marginRight: 5 }} />{now}
          </span>
          <div className="notif-bell-wrap">
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-bell-badge">{unreadCount}</span>}
          </div>
        </div>
      </div>

      <div className="notif-content">
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

        {/* FILTER */}
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
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Memuat notifikasi...</div>
          ) : filtered.length === 0 ? (
            <div className="notif-empty">
              <Bell size={36} style={{ color: "#d1d5db", marginBottom: 10 }} />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            filtered.map((n) => {
              const meta = getTypeMeta(n.type);
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
                        <span className="notif-item-time">
                          {n.created_at ? new Date(n.created_at).toLocaleString("id-ID") : ""}
                        </span>
                      </div>
                    </div>
                    <p className="notif-item-desc">{n.message}</p>
                    <span className="notif-type-chip" style={{ background: meta.bg, color: meta.color }}>
                      {meta.icon}{meta.label}
                    </span>
                  </div>
                  <ChevronRight size={16} className="notif-chevron" />
                </div>
              );
            })
          )}
        </div>
      </div>

      <DetailModal notif={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
