import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Plus, Package, Banknote, ShoppingCart, AlertTriangle, ChevronRight, ShoppingBasket, Tag, ClipboardList, BookText, AlertCircle, AlertOctagon, Box, Book, Tags, FileText } from "lucide-react";
import "../assets/styles/dashboard.css";

// ── DATA ────────────────────────────────────────────────
const chartData = [
  { l: "Sen", g: 55, w: 8 },
  { l: "Sel", g: 70, w: 10 },
  { l: "Rab", g: 45, w: 7 },
  { l: "Kam", g: 90, w: 14 },
  { l: "Jum", g: 100, w: 16 },
  { l: "Sab", g: 80, w: 12 },
  { l: "Min", g: 65, w: 10 },
];

const stokData = [
  { id: 1, nama: "Sate Blengong Spesial", stok: 24, max: 30, satuan: "porsi" },
  { id: 2, nama: "Sate Campur",           stok: 18, max: 30, satuan: "porsi" },
  { id: 3, nama: "Mendoan Jumbo",         stok: 4,  max: 30, satuan: "pcs"   },
  { id: 4, nama: "Lontong Sate",          stok: 30, max: 30, satuan: "porsi" },
  { id: 5, nama: "Minuman Jahe Hangat",   stok: 3,  max: 30, satuan: "cup"   },
];

const trxData = [
  { id: 1, dot: "#2f6f4e", pelanggan: "Pak Budi",  barang: "Sate Blengong × 2", waktu: "10 Mar, 11:24", total: "Rp 50.000"  },
  { id: 2, dot: "#2f6f4e", pelanggan: "Ibu Rina",  barang: "Mendoan Jumbo × 5", waktu: "10 Mar, 10:58", total: "Rp 25.000"  },
  { id: 3, dot: "#2f6f4e", pelanggan: "Kak Doni",  barang: "Sate Campur × 1",   waktu: "10 Mar, 09:45", total: "Rp 30.000"  },
  { id: 4, dot: "#2f6f4e", pelanggan: "Online",    barang: "Sate Blengong × 4", waktu: "9 Mar, 19:12",  total: "Rp 100.000" },
];

// ── COUNTDOWN ───────────────────────────────────────────
function Countdown() {
  const [time, setTime] = useState({ d: "00"});

  useEffect(() => {
    function tick() {
      const diff = new Date("2026-03-22T08:00:00+07:00") - new Date();
      if (diff <= 0) return;
      setTime({
        d: String(Math.floor(diff / 86400000)).padStart(2, "0")
      });
    }
    tick();
    const id = setInterval(tick, 3600000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cd-boxes">
      {[["d", "HARI"]].map(([k, u]) => (
        <div className="cd-box" key={k}>
          <div className="cd-num">{time[k]}</div>
          <div className="cd-unit">{u}</div>
        </div>
      ))}
    </div>
  );
}

// ── STAT CARD ────────────────────────────────────────────
function StatCard({ icon, label, value, unit, badge, badgeType }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div className="stat-lbl">{label}</div>
      <div className="stat-val">
        {value}
        {unit && <sup className="stat-unit">{unit}</sup>}
      </div>
      {badge && <span className={`stat-badge ${badgeType}`}>{badge}</span>}
    </div>
  );
}

// ── MAIN DASHBOARD ───────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const mx = Math.max(...chartData.map((d) => d.g));

  return (
    <div className="dashboard">

      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div>
          <div className="pg-eye">SELAMAT DATANG</div>
          <div className="pg-title">Halo, <em> Bu Yati</em></div>
          <div className="pg-sub">Selasa, 10 Maret 2026 · H-12 menuju Peken Banyumas</div>
        </div>

        <div className="topbar-actions">
          {/* Notifikasi Bell */}
          <button
            className="btn-bell"
            onClick={() => navigate("/notifikasi")}
            title="Notifikasi"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* ── COUNTDOWN BANNER ── */}
      <div className="cd-banner">
        <div>
          <div className="cd-lbl">Acara Dimulai Dalam</div>
          <div className="cd-title">Peken Banyumas 2026</div>
          <div className="cd-sub">Stand A-12 · Zona Kuliner · Masuk Gratis</div>
        </div>
        <Countdown />
      </div>

      {/* ── ALERT ── */}
      <div className="alert" onClick={() => navigate("/stok")}>
        <span className="alert-icon">
          <AlertTriangle size={18} />
        </span>
        <div>
          <div className="alert-title">2 barang stok hampir habis — Mendoan Jumbo &amp; Minuman Jahe</div>
          <div className="alert-sub">Segera update stok sebelum acara dimulai → klik untuk kelola</div>
        </div>
        <span className="alert-arrow"></span>
      </div>

      {/* ── STATS ── */}
      <div className="stats">
        <StatCard 
          icon={<Package size={20} className="icon-stats"/>} 
          label="Total Produk Kios" 
          value="6" 
          unit="item"  
          badge="▲ +1 item baru"   
          badgeType="green" 
        />
        <StatCard 
          icon={<Banknote size={20} className="icon-stats"/>} 
          label="Omset Hari Ini" 
          value="Rp 320" 
          unit="rb"  
          badge="▲ dari kemarin"   
          badgeType="green" 
        />
        <StatCard
          icon={<ShoppingBasket size={20} className="icon-stats"/>}
          label="Transaksi Hari Ini" 
          value="12"  
          unit="trx" 
          badge="▲ +3 dari kemarin" 
          badgeType="green"
        />
        <StatCard 
          icon={<AlertOctagon size={20} className="icon-stats"/>} 
          label="Stok Kritis"
          value="2"   
          unit="item" 
          badge="Perlu restok"    
          badgeType="warn"  
          />
      </div>

      {/* ── MID GRID ── */}
      <div className="mid-grid">

        {/* CHART */}
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Penjualan Minggu Ini</h3>
              <p className="card-sub">Kios Sate Blengong Bu Yati · Stand A-12</p>
            </div>
            <span className="link" onClick={() => navigate("/riwayat")}>Riwayat →</span>
          </div>

          <div className="chart-wrap">
            {chartData.map((d) => (
              <div className="bc" key={d.l}>
                <div className="bars">
                  <div className="bar omzet" style={{ height: `${(d.g / mx) * 100}%` }} />
                  <div className="bar trx"   style={{ height: `${(d.w / mx) * 100}%` }} />
                </div>
                <span>{d.l}</span>
              </div>
            ))}
          </div>

          <div className="legend">
            <div><span className="dot g" /> Pendapatan</div>
            <div><span className="dot w" /> Jml Transaksi</div>
          </div>
        </div>

        {/* AKSI CEPAT */}
        <div className="card">
          <h3>Aksi Cepat</h3>
          <button className="quick-btn primary" onClick={() => navigate("/stok")}>
            <Box size={18}/> Tambah Barang ke Stok
          </button>
          <button className="quick-btn secondary" onClick={() => navigate("/promo")}>
            <Tags size={18}/>Buat Promo Baru
          </button>
          <button className="quick-btn ghost" onClick={() => navigate("/riwayat")}>
            <FileText size={18}/>Lihat Riwayat Transaksi
          </button>
          <button className="quick-btn ghost" onClick={() => navigate("/kas")}>
            <Book size={18}/>Buku Kas Saya
          </button>
        </div>
      </div>

      {/* ── BOTTOM GRID ── */}
      <div className="bot-grid">

        {/* TRANSAKSI TERAKHIR */}
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Transaksi Terakhir</h3>
              <p className="card-sub">Dari kios kamu hari ini</p>
            </div>
            <span className="link" onClick={() => navigate("/riwayat")}>Semua →</span>
          </div>

          {trxData.map((t) => (
            <div
              key={t.id}
              className="trx"
              onClick={() => navigate("/riwayat")}
            >
              <span className="trx-dot" />
              <div className="trx-info">
                <span className="trx-name">{t.pelanggan} · {t.barang}</span>
                <span className="trx-time">{t.waktu}</span>
              </div>
              <span className="trx-total">{t.total}</span>
            </div>
          ))}
        </div>

        {/* RINGKASAN STOK */}
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Ringkasan Stok</h3>
              <p className="card-sub">Produk milik kios kamu</p>
            </div>
            <span className="link" onClick={() => navigate("/stok")}>Kelola →</span>
          </div>

          {stokData.map((item) => {
            const pct = (item.stok / item.max) * 100;
            const isLow = pct <= 20;
            return (
              <div
                key={item.id}
                className="stok-row"
                onClick={() => navigate("/stok")}
              >
                <div className="stok-label">
                  <span>{item.nama}</span>
                  <span className={`stok-count ${isLow ? "low" : ""}`}>
                    {item.stok} {item.satuan}
                  </span>
                </div>
                <div className="track">
                  <div
                    className={`fill ${isLow ? "fill-low" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}