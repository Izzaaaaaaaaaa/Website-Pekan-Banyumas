import { useState } from "react";
import { useEffect } from "react";
import { ClipboardList, Search, Download, Utensils } from "lucide-react";
import "../assets/styles/riwayat.css";

export default function Riwayat() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("riwayat")) || [];
    setTransactions(data);
  }, []);

  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) =>
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
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "transaksi.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="rw-page">
      {/* TOPBAR */}
      <div className="rw-topbar">
        <div>
          <div className="rw-eyebrow"><ClipboardList size={14} /> Kios Saya</div>
          <div className="rw-title">Riwayat <em>Transaksi</em></div>
          <div className="rw-subtitle">
            Semua transaksi dari Kios Stand A-12 · Sate Blengong Bu Yati
          </div>
        </div>

        <div className="rw-topbar-actions">
          <div className="ms-search">
            <Search size={16} />
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
          <div className="rw-info-icon"><Utensils size={18} /></div>
          <div>
            <strong>Sate Blengong Bu Yati · Stand A-12</strong>
            <div className="rw-info-sub">Menampilkan transaksi pemasukan kios kamu saja</div>
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

                  {/* METODE — badge warna */}
                  <td>
                    {metode ? (
                      <span className={`rw-metode-badge rw-metode-${metode}`}>
                        {metode === "qris" ? "📲 QRIS" : "💵 Tunai"}
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