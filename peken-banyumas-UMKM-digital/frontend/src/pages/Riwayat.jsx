import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Search, Download, Utensils } from "lucide-react";
import "../assets/styles/riwayat.css";

const API = "http://127.0.0.1:8000/api/artisan/riwayat";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function Riwayat() {
  const nama = localStorage.getItem("nama") || "Kios Saya";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");

  const fetchRiwayat = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(API, { headers: authHeaders() });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      // gagal fetch — biarkan kosong
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRiwayat(); }, [fetchRiwayat]);

  const filtered = transactions.filter(
    (t) =>
      t.pelanggan?.toLowerCase().includes(search.toLowerCase()) ||
      t.barang?.toLowerCase().includes(search.toLowerCase())
  );

  // ── SUMMARY ──
  const totalOmset = transactions.reduce((a, b) => a + Number(b.total || 0), 0);
  const totalTrx   = transactions.length;

  // ── EXPORT ──
  const handleExport = () => {
    const header = ["#", "Pelanggan", "Produk", "Qty", "Total", "Metode", "Tanggal"];
    const rows   = filtered.map((t, i) => [
      i + 1,
      t.pelanggan || "-",
      t.barang || "-",
      t.qty,
      t.total,
      t.metode || "-",
      t.tgl,
    ]);
    const csv  = ["sep=;", [header, ...rows].map(r => r.join(";")).join("\n")].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `riwayat_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rw-page">
      {/* TOPBAR */}
      <div className="rw-topbar">
        <div>
          <div className="pg-eye"><ClipboardList size={14} /> Kios Saya</div>
          <div className="pg-title">Riwayat <em>Transaksi</em></div>
          <div className="pg-sub">Semua transaksi pemasukan · {nama}</div>
        </div>
        <div className="rw-topbar-actions">
          <div className="rw-search-box">
            <Search size={16} className="rw-search-icon" />
            <input
              type="text"
              placeholder="Cari barang atau pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="rw-btn-export" onClick={handleExport}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* INFO KIOS */}
      <div className="rw-info-banner">
        <div className="rw-info-left">
          <div className="rw-avatar"><Utensils size={20} /></div>
          <div>
            <div className="rw-info-name">{nama}</div>
            <div className="rw-info-sub">Peken Banyumas 2026</div>
          </div>
          <div className="rw-banner-right">
            <span className="rw-badge-active">● Kios Aktif</span>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              {totalTrx} transaksi · Rp {Number(totalOmset).toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rw-table-card">
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Memuat data...</div>
        ) : (
          <table className="rw-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pelanggan</th>
                <th>Produk</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Metode</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trx, i) => {
                const metode = (trx.metode || "").toLowerCase();
                return (
                  <tr key={trx.id} className="rw-row">
                    <td className="rw-td-id">{i + 1}</td>
                    <td className="rw-td-customer">{trx.pelanggan || <span className="rw-dash">–</span>}</td>
                    <td>{trx.barang || <span className="rw-dash">–</span>}</td>
                    <td>{trx.qty ?? 1}</td>
                    <td className="rw-td-total">Rp {Number(trx.total).toLocaleString("id-ID")}</td>
                    <td>
                      {metode ? (
                        <span className={`rw-metode-badge rw-metode-${metode}`}>
                          {metode === "qris" ? "QRIS" : "Tunai"}
                        </span>
                      ) : <span className="rw-dash">–</span>}
                    </td>
                    <td className="rw-td-time">{trx.tgl}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="rw-empty">Tidak ada transaksi ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
