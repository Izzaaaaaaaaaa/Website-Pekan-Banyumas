import { useState } from "react";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Flame,
  Receipt,
  Banknote,
  FileText,
  Download
} from "lucide-react";
import KasTable from "../components/BukuKas/KasTable";
import TambahKasModal from "../components/modals/TambahKasModal";
import EditKasModal from "../components/modals/EditKasModal";
import ConfirmDeleteKasModal from "../components/modals/ConfirmDeleteKasModal";
import Toast from "../components/BukuKas/Toast";
import "../assets/styles/kas.css";

const fmt = (angka) => new Intl.NumberFormat("id-ID").format(angka);

export default function BukuKas() {
  const [data, setData] = useState([
    { id: 1, tgl: "10 Mar 2026", ket: "Penjualan sate siang hari",   jenis: "masuk",  nominal: 320000, saldo: 1255000, kategori: "Penjualan"   },
    { id: 2, tgl: "10 Mar 2026", ket: "Beli arang & tusuk sate",     jenis: "keluar", nominal: 50000,  saldo: 935000,  kategori: "Restok Bahan" },
    { id: 3, tgl: "9 Mar 2026",  ket: "Penjualan sore s.d. malam",   jenis: "masuk",  nominal: 480000, saldo: 985000,  kategori: "Penjualan"   },
    { id: 4, tgl: "9 Mar 2026",  ket: "Beli daging blengong segar",  jenis: "keluar", nominal: 250000, saldo: 505000,  kategori: "Restok Bahan" },
    { id: 5, tgl: "8 Mar 2026",  ket: "Penjualan pagi & siang",      jenis: "masuk",  nominal: 275000, saldo: 755000,  kategori: "Penjualan"   },
  ]);

  const [filter,      setFilter]      = useState("semua");
  const [showModal,   setShowModal]   = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [deleteItem,  setDeleteItem]  = useState(null);
  const [toast,       setToast]       = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // ── SUMMARY ──
  const totalMasuk  = data.filter(d => d.jenis === "masuk" ).reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = data.filter(d => d.jenis === "keluar").reduce((a, b) => a + b.nominal, 0);
  const saldo       = totalMasuk - totalKeluar;
  const cntMasuk    = data.filter(d => d.jenis === "masuk" ).length;
  const cntKeluar   = data.filter(d => d.jenis === "keluar").length;

  // ── FILTER ──
  const filteredData = filter === "semua" ? data : data.filter(d => d.jenis === filter);

  // ── TAMBAH ──
  const handleAdd = (item) => {
    const lastSaldo  = data.length > 0 ? data[0].saldo : 0;
    const newSaldo   = item.jenis === "masuk" ? lastSaldo + item.nominal : lastSaldo - item.nominal;
    setData([{ ...item, id: Date.now(), saldo: newSaldo }, ...data]);
    setShowModal(false);
    showToast("✅ Transaksi berhasil disimpan!");
  };

  // ── EDIT ──
  const handleUpdate = (updated) => {
    setData(data.map(d => d.id === updated.id ? updated : d));
    setEditItem(null);
    showToast("✏️ Data berhasil diupdate!");
  };

  // ── HAPUS ──
  const handleDelete = () => {
    setData(data.filter(d => d.id !== deleteItem.id));
    setDeleteItem(null);
    showToast("🗑️ Data berhasil dihapus!");
  };

  // ── EXPORT CSV ──
  const handleExport = () => {
    const header = ["#", "Tanggal", "Keterangan", "Kategori", "Jenis", "Nominal", "Saldo"];
    const rows   = filteredData.map((item, i) => [
      i + 1, item.tgl, item.ket, item.kategori, item.jenis, item.nominal, item.saldo,
    ]);
    const csv    = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob   = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url    = URL.createObjectURL(blob);
    const link   = document.createElement("a");
    link.href    = url;
    link.download = "buku_kas.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ── TOPBAR ── */}
      <div className="bk-topbar">
        <div>
          <div className="pg-eye">
            <Wallet size={14} />
            KEUANGAN KIOS</div>
          <div className="pg-title">Buku <em>Kas</em></div>
          <div className="pg-sub">Catat pemasukan &amp; pengeluaran · Stand A-12 · Sate Blengong Bu Yati</div>
        </div>

        <div className="bk-topbar-right">
          {/* Filter */}
          <button
            className={`bk-filter-btn ${filter === "semua" ? "active" : ""}`}
            onClick={() => setFilter("semua")}
          >
            Semua
          </button>
          <button className={`bk-filter-btn ${filter === "masuk" ? "active-masuk" : ""}`}>
            <ArrowDownCircle size={14} />
            Masuk
          </button>
          <button className={`bk-filter-btn ${filter === "keluar" ? "active-keluar" : ""}`}>
            <ArrowUpCircle size={14} />
            Keluar
          </button>

          <button className="bk-btn-add" onClick={() => setShowModal(true)}>
            ＋ Tambah Transaksi
          </button>
        </div>
      </div>

      {/* ── SUMMARY ── */}
      <div className="bk-summary">
        <div className="bk-sum-card saldo">
          <div className="bk-sum-label">
            <Flame size={14} />
            SALDO SAAT INI
          </div>
          <div className="bk-sum-val">
            Rp. 200.000
          </div>
          <div className="bk-sum-sub">Diperbarui otomatis</div>
        </div>
        <div className="bk-sum-card masuk">
          <div className="bk-sum-label"><Receipt size={14} />TOTAL PEMASUKAN</div>
          <div className="bk-sum-val">Rp {fmt(totalMasuk)}</div>
          <div className="bk-sum-sub">{cntMasuk} transaksi masuk</div>
        </div>
        <div className="bk-sum-card keluar">
          <div className="bk-sum-label">
            <Banknote size={14} />
            TOTAL PENGELUARAN
          </div>
          <div className="bk-sum-val">Rp {fmt(totalKeluar)}</div>
          <div className="bk-sum-sub">{cntKeluar} transaksi keluar</div>
        </div>
      </div>

      {/* ── TABLE CARD ── */}
      <div className="bk-card">
        <div className="bk-card-head">
          <div className="bk-card-head-left">
            <h3><FileText size={16} />Daftar Transaksi Kas</h3>
            <p>Sate Blengong Bu Yati · Stand A-12</p>
          </div>
          <button className="bk-btn-export">
            <Download size={14} />
            Export
          </button>
        </div>

        <KasTable
          data={filteredData}
          formatRupiah={fmt}
          onEdit={(item)   => setEditItem(item)}
          onDelete={(item) => setDeleteItem(item)}
        />
      </div>

      {/* ── MODALS ── */}
      <TambahKasModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAdd}
      />

      <EditKasModal
        show={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={handleUpdate}
      />

      <ConfirmDeleteKasModal
        show={!!deleteItem}
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />

      {/* ── TOAST ── */}
      {toast && <Toast message={toast} />}
    </div>
  );
}