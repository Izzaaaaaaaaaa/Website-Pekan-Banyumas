import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Package, Banknote, ShoppingBasket,
  AlertOctagon, ChevronRight, Ticket, FileText,
  Book, Box, AlertTriangle, Inbox
} from "lucide-react";
import "../assets/styles/dashboard.css";

// ── FORMAT RUPIAH ────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);

// ── GREETING ─────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

// ── TANGGAL ──────────────────────────────────────────────
function getTanggalHari() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

// ── COUNTDOWN ────────────────────────────────────────────
function Countdown() {
  const [hari, setHari] = useState("00");

  useEffect(() => {
    function tick() {
      const diff = new Date("2026-03-22T08:00:00+07:00") - new Date();
      if (diff <= 0) { setHari("00"); return; }
      setHari(String(Math.floor(diff / 86400000)).padStart(2, "0"));
    }
    tick();
    const id = setInterval(tick, 3600000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cd-boxes">
      <div className="cd-box">
        <div className="cd-num">{hari}</div>
        <div className="cd-unit">HARI</div>
      </div>
    </div>
  );
}

// ── STAT CARD ─────────────────────────────────────────────
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

// ── CHART BAR MINI ────────────────────────────────────────
function MiniChart({ data }) {
  const mx = Math.max(...data.map(d => d.omzet), 1);
  return (
    <div className="chart-wrap">
      {data.map((d, i) => (
        <div className="bc" key={i}>
          <div className="bars">
            <div className="bar omzet" style={{ height: `${(d.omzet / mx) * 100}%` }} />
            <div className="bar trx"   style={{ height: `${(d.trx   / mx) * 100}%` }} />
          </div>
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  // ── STATE ──────────────────────────────────────────────
  const [items,   setItems]   = useState([]);
  const [kasData, setKasData] = useState([]);
  const [riwayat, setRiwayat] = useState([]);

  // ── LOAD DATA ──────────────────────────────────────────
  useEffect(() => {
    const loadAll = () => {
      setItems  (JSON.parse(localStorage.getItem("items")   || "[]"));
      setKasData(JSON.parse(localStorage.getItem("kas")     || "[]"));
      setRiwayat(JSON.parse(localStorage.getItem("riwayat") || "[]"));
    };
    loadAll();
    window.addEventListener("storage", loadAll);
    return () => window.removeEventListener("storage", loadAll);
  }, []);

  // ── DERIVED: STOK ──────────────────────────────────────
  const stokKritis   = items.filter(i => i.stok <= (i.stokMin ?? 5));
  const namaKritis   = stokKritis.slice(0, 2).map(i => i.nama).join(" & ");

  // ── DERIVED: OMSET HARI INI ────────────────────────────
  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  });
  const omsetHariIni = kasData
    .filter(k => k.jenis === "masuk" && k.tgl === todayStr)
    .reduce((a, b) => a + b.nominal, 0);

  // ── DERIVED: TRANSAKSI HARI INI ────────────────────────
  const trxHariIni = riwayat.filter(r => r.tgl === todayStr).length;

  // ── DERIVED: SALDO KAS ─────────────────────────────────
  const totalMasuk  = kasData.filter(k => k.jenis === "masuk" ).reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = kasData.filter(k => k.jenis === "keluar").reduce((a, b) => a + b.nominal, 0);
  const saldo       = totalMasuk - totalKeluar;

  // ── DERIVED: CHART 7 HARI ──────────────────────────────
  const chartData = (() => {
    const days = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
    return Array.from({ length: 7 }, (_, i) => {
      const d   = new Date();
      d.setDate(d.getDate() - (6 - i));
      const tgl = d.toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric"
      });
      return {
        label: days[d.getDay()],
        omzet: kasData
          .filter(k => k.jenis === "masuk" && k.tgl === tgl)
          .reduce((a, b) => a + b.nominal, 0),
        trx: riwayat.filter(r => r.tgl === tgl).length,
      };
    });
  })();

  // ── DERIVED: TRANSAKSI TERAKHIR (5 terakhir) ───────────
  const trxTerakhir = riwayat.slice(0, 5);

  // ── FORMAT OMSET ──────────────────────────────────────
  const fmtOmset = (n) => {
    if (n >= 1_000_000) return { val: (n / 1_000_000).toFixed(1), unit: "jt" };
    if (n >= 1_000)     return { val: (n / 1_000).toFixed(0),     unit: "rb" };
    return { val: String(n), unit: "" };
  };
  const omset = fmtOmset(omsetHariIni);

  return (
    <div className="dashboard">

      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div>
          <div className="pg-eye">{getGreeting()}</div>
          <div className="pg-title">Halo, <em>Bu Yati</em></div>
          <div className="pg-sub">{getTanggalHari()} · H-12 menuju Peken Banyumas</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-bell" onClick={() => navigate("/notifikasi")} title="Notifikasi">
            <Bell size={18} />
            {stokKritis.length > 0 && (
              <span className="bell-dot">{stokKritis.length}</span>
            )}
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

      {/* ── ALERT STOK KRITIS ── */}
      {stokKritis.length > 0 && (
        <div className="alert" onClick={() => navigate("/stok")}>
          <span className="alert-icon"><AlertTriangle size={18} /></span>
          <div>
            <div className="alert-title">
              {stokKritis.length} barang stok hampir habis
              {namaKritis ? ` — ${namaKritis}` : ""}
            </div>
            <div className="alert-sub">
              Segera update stok sebelum acara dimulai → klik untuk kelola
            </div>
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      <div className="stats">
        <StatCard
          icon={<Package size={20} className="icon-stats" />}
          label="Total Produk Kios"
          value={String(items.length)}
          unit="item"
          badge={items.length > 0 ? `${items.length} produk aktif` : "Belum ada produk"}
          badgeType="green"
        />
        <StatCard
          icon={<Banknote size={20} className="icon-stats" />}
          label="Omset Hari Ini"
          value={omsetHariIni > 0 ? `Rp ${omset.val}` : "Rp 0"}
          unit={omset.unit || undefined}
          badge={omsetHariIni > 0 ? "▲ dari kemarin" : "Belum ada"}
          badgeType={omsetHariIni > 0 ? "green" : "warn"}
        />
        <StatCard
          icon={<ShoppingBasket size={20} className="icon-stats" />}
          label="Transaksi Hari Ini"
          value={String(trxHariIni)}
          unit="trx"
          badge={trxHariIni > 0 ? `${trxHariIni} transaksi` : "Belum ada"}
          badgeType={trxHariIni > 0 ? "green" : "warn"}
        />
        <StatCard
          icon={<AlertOctagon size={20} className="icon-stats" />}
          label="Stok Kritis"
          value={String(stokKritis.length)}
          unit="item"
          badge={stokKritis.length > 0 ? "Perlu restok" : "Aman"}
          badgeType={stokKritis.length > 0 ? "warn" : "green"}
        />
      </div>

      {/* ── MID GRID ── */}
      <div className="mid-grid">

        {/* CHART PENJUALAN */}
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Penjualan Minggu Ini</h3>
              <p className="card-sub">Kios Sate Blengong Bu Yati · Stand A-12</p>
            </div>
            <span className="link" onClick={() => navigate("/riwayat")}>Riwayat →</span>
          </div>

          {kasData.length === 0 ? (
            <div className="dash-empty">
              <Inbox size={32} />
              <p>Belum ada data transaksi</p>
            </div>
          ) : (
            <MiniChart data={chartData} />
          )}

          <div className="legend">
            <div><span className="dot g" /> Pendapatan</div>
            <div><span className="dot w" /> Jml Transaksi</div>
          </div>

          {/* Ringkasan saldo kas */}
          <div className="kas-summary-row">
            <div className="kas-sum-item">
              <span className="kas-sum-lbl">Total Masuk</span>
              <span className="kas-sum-val masuk">Rp {fmt(totalMasuk)}</span>
            </div>
            <div className="kas-sum-sep" />
            <div className="kas-sum-item">
              <span className="kas-sum-lbl">Total Keluar</span>
              <span className="kas-sum-val keluar">Rp {fmt(totalKeluar)}</span>
            </div>
            <div className="kas-sum-sep" />
            <div className="kas-sum-item">
              <span className="kas-sum-lbl">Saldo Kas</span>
              <span className="kas-sum-val saldo">Rp {fmt(saldo)}</span>
            </div>
          </div>
        </div>

        {/* AKSI CEPAT */}
        <div className="card">
          <h3>Aksi Cepat</h3>
          <button className="quick-btn primary"   onClick={() => navigate("/stok")}>
            <Box size={18} /> Tambah Barang ke Stok
          </button>
          <button className="quick-btn secondary" onClick={() => navigate("/evento")}>
            <Ticket size={18} /> Daftar Event Baru
          </button>
          <button className="quick-btn ghost"     onClick={() => navigate("/riwayat")}>
            <FileText size={18} /> Lihat Riwayat Transaksi
          </button>
          <button className="quick-btn ghost"     onClick={() => navigate("/kas")}>
            <Book size={18} /> Buku Kas Saya
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
              <p className="card-sub">Dari riwayat pemasukan kios kamu</p>
            </div>
            <span className="link" onClick={() => navigate("/riwayat")}>Semua →</span>
          </div>

          {trxTerakhir.length === 0 ? (
            <div className="dash-empty">
              <Inbox size={28} />
              <p>Belum ada transaksi</p>
            </div>
          ) : (
            trxTerakhir.map((t) => (
              <div key={t.id} className="trx" onClick={() => navigate("/riwayat")}>
                <span className="trx-dot" />
                <div className="trx-info">
                  <span className="trx-name">
                    {t.pelanggan ? `${t.pelanggan} · ` : ""}{t.barang} × {t.qty}
                  </span>
                  <span className="trx-time">{t.tgl}</span>
                </div>
                <span className="trx-total">Rp {fmt(t.total)}</span>
              </div>
            ))
          )}
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

          {items.length === 0 ? (
            <div className="dash-empty">
              <Inbox size={28} />
              <p>Belum ada produk di stok</p>
            </div>
          ) : (
            items.slice(0, 5).map((item) => {
              const max   = item.stokAwal ?? item.stok ?? 1;
              const pct   = Math.min((item.stok / max) * 100, 100);
              const isLow = item.stok <= (item.stokMin ?? 5);
              return (
                <div key={item.id} className="stok-row" onClick={() => navigate("/stok")}>
                  <div className="stok-label">
                    <span>{item.nama}</span>
                    <span className={`stok-count ${isLow ? "low" : ""}`}>
                      {item.stok} {item.satuan || "pcs"}
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
            })
          )}
        </div>
      </div>

    </div>
  );
}