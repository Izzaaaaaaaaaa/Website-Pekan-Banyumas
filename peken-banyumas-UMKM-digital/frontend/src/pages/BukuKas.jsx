import { useState, useEffect, useCallback } from "react";
import {
  Wallet, Search, Flame, Receipt, Banknote, FileText, Download
} from "lucide-react";
import KasTable from "../components/BukuKas/KasTable";
import TambahKasModal from "../components/modals/TambahKasModal";
import EditKasModal from "../components/modals/EditKasModal";
import ConfirmDeleteKasModal from "../components/modals/ConfirmDeleteKasModal";
import Toast from "../components/Toast";
import "../assets/styles/kas.css";

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8004";
const API = `${BASE}/api/artisan/kas`;
const fmt = (angka) => new Intl.NumberFormat("id-ID").format(angka);

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export default function BukuKas() {
  const nama = localStorage.getItem("nama") || "Kios Saya";

  const [data,       setData]       = useState([]);
  const [stokItems,  setStokItems]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("semua");
  const [search,     setSearch]     = useState("");
  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [toast,      setToast]      = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // ── FETCH ──
  const fetchKas = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(API, { headers: authHeaders() });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      showToast("Gagal memuat data kas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKas(); }, [fetchKas]);

  // ── FETCH STOK untuk dropdown produk ──
  useEffect(() => {
    fetch(`${BASE}/api/artisan/stok`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setStokItems(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // ── SUMMARY ──
  const totalMasuk  = data.filter(d => d.jenis === "masuk" ).reduce((a, b) => a + Number(b.nominal), 0);
  const totalKeluar = data.filter(d => d.jenis === "keluar").reduce((a, b) => a + Number(b.nominal), 0);
  const saldo       = totalMasuk - totalKeluar;
  const cntMasuk    = data.filter(d => d.jenis === "masuk" ).length;
  const cntKeluar   = data.filter(d => d.jenis === "keluar").length;

  // ── FILTER + SEARCH ──
  const filteredData = data
    .filter(d => filter === "semua" || d.jenis === filter)
    .filter(d =>
      d.ket?.toLowerCase().includes(search.toLowerCase()) ||
      d.kategori?.toLowerCase().includes(search.toLowerCase()) ||
      d.jenis?.toLowerCase().includes(search.toLowerCase())
    );

  // ── TAMBAH ──
  const handleAdd = async (item) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          jenis:     item.jenis,
          kategori:  item.kategori || "",
          pelanggan: item.pelanggan || null,
          barang:    item.barang || null,
          barang_id: item.barang_id || null,
          qty:       Number(item.qty) || 1,
          metode:    item.metode || "tunai",
          ket:       item.ket || "",
          nominal:   Number(item.nominal),
          tgl:       item.tgl || today,
          bukti_url: item.bukti_url || null,
        }),
      });
      if (!res.ok) { showToast("Gagal menyimpan transaksi"); return; }
      setShowModal(false);
      showToast("Transaksi berhasil disimpan!");
      fetchKas();
    } catch {
      showToast("Gagal terhubung ke server");
    }
  };

  // ── EDIT ──
  const handleUpdate = async (updated) => {
    try {
      const res = await fetch(`${API}/${updated.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          jenis:     updated.jenis,
          kategori:  updated.kategori,
          pelanggan: updated.pelanggan || null,
          barang:    updated.barang || null,
          qty:       Number(updated.qty) || 1,
          metode:    updated.metode,
          ket:       updated.ket || "",
          nominal:   Number(updated.nominal),
          tgl:       updated.tgl,
          bukti_url: updated.bukti_url || null,
        }),
      });
      if (!res.ok) { showToast("Gagal mengupdate transaksi"); return; }
      setEditItem(null);
      showToast("Data berhasil diupdate!");
      fetchKas();
    } catch {
      showToast("Gagal terhubung ke server");
    }
  };

  // ── HAPUS ──
  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/${deleteItem.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) { showToast("Gagal menghapus transaksi"); return; }
      setDeleteItem(null);
      showToast("Data berhasil dihapus!");
      fetchKas();
    } catch {
      showToast("Gagal terhubung ke server");
    }
  };

  // ── EXPORT CSV ──
  const handleExport = () => {
    const header = ["#", "Tanggal", "Keterangan", "Kategori", "Jenis", "Pelanggan", "Barang", "Qty", "Metode", "Nominal", "Saldo After"];
    const rows   = filteredData.map((item, i) => [
      i + 1,
      item.tgl,
      `"${(item.ket || "").replace(/"/g, '""')}"`,
      item.kategori || "",
      item.jenis,
      item.pelanggan || "",
      item.barang || "",
      item.qty || "",
      item.metode || "",
      item.nominal,
      item.saldo_after || "",
    ]);
    // "sep=;" memberitahu Excel untuk pakai ; sebagai delimiter
    const csv  = ["sep=;", [header].concat(rows).map(r => r.join(";")).join("\n")].join("\n");
    // tambah BOM supaya Excel baca encoding UTF-8 dengan benar
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    const tgl  = new Date().toISOString().split("T")[0];
    link.download = `buku_kas_${tgl}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ── TOPBAR ── */}
      <div className="bk-topbar">
        <div>
          <div className="pg-eye"><Wallet size={14} />KEUANGAN KIOS</div>
          <div className="pg-title">Buku <em>Kas</em></div>
          <div className="pg-sub">Catat pemasukan &amp; pengeluaran · {nama}</div>
        </div>
        <div className="bk-topbar-right">
          <div className="bk-topbar-actions">
            <button className={`bk-filter-btn ${filter === "semua"  ? "active-semua"  : ""}`} onClick={() => setFilter("semua")}>Semua</button>
            <button className={`bk-filter-btn ${filter === "masuk"  ? "active-masuk"  : ""}`} onClick={() => setFilter("masuk")}>Masuk</button>
            <button className={`bk-filter-btn ${filter === "keluar" ? "active-keluar" : ""}`} onClick={() => setFilter("keluar")}>Keluar</button>
            <button className="bk-btn-add" onClick={() => setShowModal(true)}>+ Tambah Transaksi</button>
          </div>
          <div className="bk-search">
            <Search size={16} />
            <input type="text" placeholder="Cari transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── SUMMARY ── */}
      <div className="bk-summary">
        <div className="bk-sum-card saldo">
          <div className="bk-sum-label"><Flame size={14} />SALDO SAAT INI</div>
          <div className="bk-sum-val">Rp {fmt(saldo)}</div>
          <div className="bk-sum-sub">Diperbarui otomatis</div>
        </div>
        <div className="bk-sum-card masuk">
          <div className="bk-sum-label"><Receipt size={14} />TOTAL PEMASUKAN</div>
          <div className="bk-sum-val">Rp {fmt(totalMasuk)}</div>
          <div className="bk-sum-sub">{cntMasuk} transaksi masuk</div>
        </div>
        <div className="bk-sum-card keluar">
          <div className="bk-sum-label"><Banknote size={14} />TOTAL PENGELUARAN</div>
          <div className="bk-sum-val">Rp {fmt(totalKeluar)}</div>
          <div className="bk-sum-sub">{cntKeluar} transaksi keluar</div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bk-card">
        <div className="bk-card-head">
          <div className="bk-card-head-left">
            <h3><FileText size={16} />Daftar Transaksi Kas</h3>
            <p>{nama}</p>
          </div>
          <button className="bk-btn-export" onClick={handleExport}>
            <Download size={14} />Export
          </button>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Memuat data...</div>
        ) : (
          <KasTable
            data={filteredData}
            formatRupiah={fmt}
            onEdit={(item)   => setEditItem(item)}
            onDelete={(item) => setDeleteItem(item)}
          />
        )}
      </div>

      {/* ── MODALS ── */}
      <TambahKasModal show={showModal} onClose={() => setShowModal(false)} onSave={handleAdd} items={stokItems} namaUsaha={nama} />
      <EditKasModal show={!!editItem} item={editItem} onClose={() => setEditItem(null)} onSave={handleUpdate} />
      <ConfirmDeleteKasModal show={!!deleteItem} item={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />

      {toast && <Toast message={toast} />}
    </div>
  );
}
