import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Package, Banknote, ShoppingBasket,
  AlertOctagon, ChevronRight, Ticket, FileText,
  Book, Box, AlertTriangle, Inbox
} from "lucide-react";
import "../assets/styles/dashboard.css";

const BASE       = import.meta.env.VITE_API_URL;
const API_STOK   = `${BASE}/api/artisan/stok`;
const API_KAS    = `${BASE}/api/artisan/kas`;
const API_NOTIF  = `${BASE}/api/notifikasi`;
const API_EVENT  = `${BASE}/api/event`;
const API_EVENT_SAYA = `${BASE}/api/event/saya`;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function getTanggalHari() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

function Countdown({ tanggal }) {
  const [hari, setHari] = useState("--");

  useEffect(() => {
    if (!tanggal) { setHari("--"); return; }

    function tick() {
      const target = new Date(tanggal);
      // Guard: kalau tanggal tidak valid, tampilkan "--"
      if (isNaN(target.getTime())) { setHari("--"); return; }

      const diff = target - new Date();
      if (diff <= 0) {
        setHari("00");
        return;
      }
      setHari(String(Math.floor(diff / 86400000)).padStart(2, "0"));
    }

    tick();
    const id = setInterval(tick, 3600000);
    return () => clearInterval(id);
  }, [tanggal]);

  return (
    <div className="cd-boxes">
      <div className="cd-box">
        <div className="cd-num">{hari}</div>
        <div className="cd-unit">HARI</div>
      </div>
    </div>
  );
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const nama     = localStorage.getItem("nama") || "Artisan";

  const [stokItems,  setStokItems]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("cache_stok") || "[]"); } catch { return []; }
  });
  const [kasData,    setKasData]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("cache_kas") || "[]"); } catch { return []; }
  });
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [eventBanner, setEventBanner] = useState(null); // { nama, tanggal, sub }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    Promise.all([
      fetch(API_STOK,  { headers: authHeaders() }).then(r => r.json()).catch(() => []),
      fetch(API_KAS,   { headers: authHeaders() }).then(r => r.json()).catch(() => []),
      fetch(API_NOTIF, { headers: authHeaders() }).then(r => r.json()).catch(() => []),
      fetch(API_EVENT_SAYA, { headers: authHeaders() }).then(r => r.json()).catch(() => []),
      fetch(API_EVENT).then(r => r.json()).catch(() => []),
    ]).then(([stok, kas, notif, eventSaya, eventPublik]) => {
      const stokArr  = Array.isArray(stok)  ? stok  : [];
      const kasArr   = Array.isArray(kas)   ? kas   : [];
      setStokItems(stokArr);
      setKasData(kasArr);
      setUnreadNotif(Array.isArray(notif) ? notif.filter(n => !n.read).length : 0);

      // ── Tentukan event untuk banner countdown ──
      // Prioritas 1: event yang artisan sudah approved
      // Prioritas 2: event publik yang akan datang (published/berlangsung)
      let banner = null;

      // Helper: buat ISO string yang valid dari tanggal + jam_mulai
      const toIso = (tanggal, jam_mulai) => {
        // jam_mulai bisa "08:00", "08:00:00", atau kosong
        const jam = (jam_mulai || "08:00").slice(0, 5); // ambil HH:MM saja
        return `${tanggal}T${jam}:00+07:00`;
      };

      if (Array.isArray(eventSaya) && eventSaya.length > 0) {
        const approved = eventSaya.find(e => e.status_request === "approved");
        if (approved) {
          const detail = Array.isArray(eventPublik)
            ? eventPublik.find(e => e.id === approved.event_id)
            : null;
          if (detail) {
            banner = {
              nama:    detail.nama,
              tanggal: toIso(detail.tanggal, detail.jam_mulai),
              sub:     detail.lokasi || "Masuk Gratis",
            };
          }
        }
      }

      // Fallback: event publik terdekat yang belum selesai
      if (!banner && Array.isArray(eventPublik) && eventPublik.length > 0) {
        const mendatang = eventPublik
          .filter(e => e.status === "published" || e.status === "berlangsung")
          .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
        if (mendatang.length > 0) {
          const e = mendatang[0];
          banner = {
            nama:    e.nama,
            tanggal: toIso(e.tanggal, e.jam_mulai),
            sub:     e.lokasi || "Masuk Gratis",
          };
        }
      }

      setEventBanner(banner);

      // simpan cache
      try {
        localStorage.setItem("cache_stok", JSON.stringify(stokArr));
        localStorage.setItem("cache_kas",  JSON.stringify(kasArr));
      } catch {}
      setLoading(false);
    });
  }, []);

  // ── DERIVED: STOK KRITIS ──
  // item dianggap kritis jika stok <= stok_min (dan stok_min > 0)
  const stokKritis = stokItems.filter(i => {
    const min = i.stok_min ?? 0;
    return min > 0 && i.stok <= min;
  });
  const namaKritis = stokKritis.slice(0, 2).map(i => i.nama).join(" & ");

  // ── DERIVED: OMSET HARI INI ──
  const todayISO = new Date().toISOString().split("T")[0];
  const omsetHariIni = kasData
    .filter(k => k.jenis === "masuk" && k.tgl === todayISO)
    .reduce((a, b) => a + Number(b.nominal), 0);

  // ── DERIVED: TRANSAKSI HARI INI ──
  const trxHariIni = kasData.filter(k => k.jenis === "masuk" && k.tgl === todayISO).length;

  // ── DERIVED: SALDO ──
  const totalMasuk  = kasData.filter(k => k.jenis === "masuk" ).reduce((a, b) => a + Number(b.nominal), 0);
  const totalKeluar = kasData.filter(k => k.jenis === "keluar").reduce((a, b) => a + Number(b.nominal), 0);
  const saldo       = totalMasuk - totalKeluar;

  // ── DERIVED: CHART 7 HARI ──
  const chartData = (() => {
    const days = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const tgl = d.toISOString().split("T")[0];
      return {
        label: days[d.getDay()],
        omzet: kasData.filter(k => k.jenis === "masuk" && k.tgl === tgl).reduce((a, b) => a + Number(b.nominal), 0),
        trx:   kasData.filter(k => k.jenis === "masuk" && k.tgl === tgl).length,
      };
    });
  })();

  // ── DERIVED: TRANSAKSI TERAKHIR ──
  const trxTerakhir = kasData
    .filter(k => k.jenis === "masuk")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

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
          <div className="pg-title">Halo, <em>{nama}</em></div>
          <div className="pg-sub">{getTanggalHari()}</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-bell" onClick={() => navigate("/notifikasi")} title="Notifikasi">
            <Bell size={18} />
            {(stokKritis.length + unreadNotif) > 0 && (
              <span className="bell-dot">{stokKritis.length + unreadNotif}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── COUNTDOWN ── */}
      <div className="cd-banner">
        <div>
          <div className="cd-lbl">
            {eventBanner ? "Acara Dimulai Dalam" : "Belum Ada Event Terdaftar"}
          </div>
          <div className="cd-title">
            {eventBanner ? eventBanner.nama : "Peken Banyumas"}
          </div>
          <div className="cd-sub">
            {eventBanner ? eventBanner.sub : "Daftar event untuk mulai berjualan"}
          </div>
        </div>
        <Countdown tanggal={eventBanner?.tanggal} />
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
            <div className="alert-sub">Segera update stok → klik untuk kelola</div>
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      {loading && stokItems.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>Memuat data...</div>
      ) : (
        <div className="stats">
          <StatCard
            icon={<Package size={20} className="icon-stats" />}
            label="Total Produk Kios"
            value={String(stokItems.length)}
            unit="item"
            badge={stokItems.length > 0 ? `${stokItems.length} produk aktif` : "Belum ada produk"}
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
      )}

      {/* ── MID GRID ── */}
      <div className="mid-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Penjualan Minggu Ini</h3>
              <p className="card-sub">{nama}</p>
            </div>
            <span className="link" onClick={() => navigate("/riwayat")}>Riwayat →</span>
          </div>

          {kasData.length === 0 ? (
            <div className="dash-empty"><Inbox size={32} /><p>Belum ada data transaksi</p></div>
          ) : (
            <MiniChart data={chartData} />
          )}

          <div className="legend">
            <div><span className="dot g" /> Pendapatan</div>
            <div><span className="dot w" /> Jml Transaksi</div>
          </div>

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

        <div className="card">
          <h3>Aksi Cepat</h3>
          <button className="quick-btn primary"   onClick={() => navigate("/stok")}>
            <Box size={18} /> Tambah Barang ke Stok
          </button>
          <button className="quick-btn secondary" onClick={() => navigate("/event")}>
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
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Transaksi Terakhir</h3>
              <p className="card-sub">Dari riwayat pemasukan kios kamu</p>
            </div>
            <span className="link" onClick={() => navigate("/riwayat")}>Semua →</span>
          </div>
          {trxTerakhir.length === 0 ? (
            <div className="dash-empty"><Inbox size={28} /><p>Belum ada transaksi</p></div>
          ) : (
            trxTerakhir.map((t) => (
              <div key={t.id} className="trx" onClick={() => navigate("/riwayat")}>
                <span className="trx-dot" />
                <div className="trx-info">
                  <span className="trx-name">
                    {t.pelanggan ? `${t.pelanggan} · ` : ""}{t.barang || t.ket} × {t.qty}
                  </span>
                  <span className="trx-time">{t.tgl}</span>
                </div>
                <span className="trx-total">Rp {fmt(Number(t.nominal))}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Ringkasan Stok</h3>
              <p className="card-sub">Produk milik kios kamu</p>
            </div>
            <span className="link" onClick={() => navigate("/stok")}>Kelola →</span>
          </div>
          {stokItems.length === 0 ? (
            <div className="dash-empty"><Inbox size={28} /><p>Belum ada produk di stok</p></div>
          ) : (
            stokItems.slice(0, 5).map((item) => {
              const min   = item.stok_min ?? 0;
              const isLow = min > 0 && item.stok <= min;
              const pct   = min > 0
                ? Math.min((item.stok / (min * 3)) * 100, 100)
                : 100;
              return (
                <div key={item.id} className="stok-row" onClick={() => navigate("/stok")}>
                  <div className="stok-label">
                    <span>{item.nama}</span>
                    <span className={`stok-count ${isLow ? "low" : ""}`}>
                      {item.stok} {item.satuan || "pcs"}
                    </span>
                  </div>
                  <div className="track">
                    <div className={`fill ${isLow ? "fill-low" : ""}`} style={{ width: `${pct}%` }} />
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
