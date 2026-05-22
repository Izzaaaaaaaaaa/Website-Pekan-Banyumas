import { useState, useEffect } from "react";
import { ClipboardList, Search, Download, Utensils, AlertTriangle } from "lucide-react";
import "../assets/styles/riwayat.css";

export default function Riwayat() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("riwayat")) || [];
    setTransactions(data);
  }, []);

  // Hitung stok kritis dari localStorage (jika ada data stok)
  const stokData = JSON.parse(localStorage.getItem("stok")) || [];
  const kritisCount = stokData.filter((s) => s.stok <= (s.minStok ?? 5)).length;

  const filtered = transactions.filter(
    (t) =>
      t.pelanggan?.toLowerCase().includes(search.toLowerCase()) ||
      t.barang?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      ["ID", "Pelanggan", "Produk", "Qty", "Total", "Metode", "Tanggal"],
      ...filtered.map((t) => [
        t.id,
        t.pelanggan || "-",
        t.barang || "-",
        t.qty,
        t.total,
        t.metode || "-",
        t.tgl,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transaksi.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="rw-page">
      {/* TOPBAR */}
      <div className="rw-topbar">
        <div>
          <div className="pg-eye">
            <ClipboardList size={14} /> Kios Saya
          </div>
          <div className="pg-title">
            Riwayat <em>Transaksi</em>
          </div>
          <div className="pg-sub">
            Semua transaksi dari Kios Stand A-12 · Sate Blengong Bu Yati
          </div>
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
          <div className="rw-avatar">
            <Utensils size={20} />
          </div>
          <div>
            <div className="rw-info-name">Sate Blengong Bu Yati</div>
            <div className="rw-info-sub">
              Stand A-12 · Zona Kuliner · Peken Banyumas 2026
            </div>
          </div>
          <div className="rw-banner-right">
            <span className="rw-badge-active">● Kios Aktif</span>
            {kritisCount > 0 && (
              <span className="rw-badge-warn">
                <AlertTriangle size={14} />
                {kritisCount} stok kritis
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rw-table-card">
        <table className="rw-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pelanggan</th>
              <th>Produk</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Metode</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((trx) => {
              const metode = (trx.metode || "").toLowerCase();
              return (
                <tr key={trx.id} className="rw-row">
                  <td className="rw-td-id">#{trx.id}</td>

                  <td className="rw-td-customer">
                    {trx.pelanggan || <span className="rw-dash">–</span>}
                  </td>

                  <td>{trx.barang || <span className="rw-dash">–</span>}</td>

                  <td>{trx.qty ?? 1}</td>

                  <td className="rw-td-total">
                    Rp {Number(trx.total).toLocaleString("id-ID")}
                  </td>

                  <td>
                    {metode ? (
                      <span className={`rw-metode-badge rw-metode-${metode}`}>
                        {metode === "qris" ? "QRIS" : "Tunai"}
                      </span>
                    ) : (
                      <span className="rw-dash">–</span>
                    )}
                  </td>

                  <td className="rw-td-time">{trx.tgl}</td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="rw-empty">
                  Tidak ada transaksi ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}