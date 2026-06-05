import { useState, useEffect, useCallback } from "react";
import { Search, Box, AlertTriangle, Utensils } from "lucide-react";
import StokTable from "../components/ManajemenStok/StokTable";
import TambahBarangModal from "../components/modals/TambahBarangModal";
import EditBarangModal from "../components/modals/EditBarangModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import Toast from "../components/Toast";
import "../assets/styles/stok.css";

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8004";
const API = `${BASE}/api/artisan/stok`;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export default function ManajemenStok() {
  const nama = localStorage.getItem("nama") || "Kios Saya";

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  // ── FETCH ALL ──
  const fetchStok = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(API, { headers: authHeaders() });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showToast("Gagal memuat data stok");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStok(); }, [fetchStok]);

  const filteredItems = items.filter(
    (item) =>
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.kategori?.toLowerCase().includes(search.toLowerCase())
  );

  // ── TAMBAH ──
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nama: "", stok: "", harga: "", kategori: "", satuan: "pcs", deskripsi: "", stok_min: "5",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async () => {
    if (!form.nama || !form.stok || !form.harga) {
      showToast("Nama, stok, dan harga wajib diisi!");
      return;
    }
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          nama: form.nama,
          stok: Number(form.stok),
          harga: Number(form.harga),
          kategori: form.kategori || "Lainnya",
          satuan: form.satuan || "pcs",
          deskripsi: form.deskripsi || "",
          stok_min: Number(form.stok_min) || 0,
        }),
      });
      if (!res.ok) { showToast("Gagal menambah barang"); return; }
      setForm({ nama: "", stok: "", harga: "", kategori: "", satuan: "pcs", deskripsi: "", stok_min: "0" });
      setShowModal(false);
      showToast("Barang berhasil ditambahkan!");
      fetchStok();
    } catch {
      showToast("Gagal terhubung ke server");
    }
  };

  // ── EDIT ──
  const [editItem, setEditItem] = useState(null);
  const handleUpdate = async (updatedItem) => {
    try {
      const res = await fetch(`${API}/${updatedItem.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          nama: updatedItem.nama,
          stok: Number(updatedItem.stok),
          harga: Number(updatedItem.harga),
          kategori: updatedItem.kategori,
          satuan: updatedItem.satuan,
          deskripsi: updatedItem.deskripsi || "",
          stok_min: Number(updatedItem.stok_min) || 0,
        }),
      });
      if (!res.ok) { showToast("Gagal mengupdate barang"); return; }
      setEditItem(null);
      showToast("Barang berhasil diupdate!");
      fetchStok();
    } catch {
      showToast("Gagal terhubung ke server");
    }
  };

  // ── HAPUS ──
  const [deleteItem, setDeleteItem] = useState(null);
  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`${API}/${deleteItem.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) { showToast("Gagal menghapus barang"); return; }
      setDeleteItem(null);
      showToast("Barang berhasil dihapus!");
      fetchStok();
    } catch {
      showToast("Gagal terhubung ke server");
    }
  };

  const kritisCount = items.filter((i) => {
    const min = i.stok_min ?? 0;
    return min > 0 && i.stok <= min;
  }).length;

  // ── TOAST ──
  const [toast, setToast] = useState("");
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div>
      {/* TOPBAR */}
      <div className="ms-topbar">
        <div>
          <div className="pg-eye"><Box size={15} />KIOS SAYA</div>
          <div className="pg-title">Manajemen <em>Stok</em></div>
          <div className="pg-sub">Produk yang dijual di kios {nama}</div>
        </div>
        <div className="ms-topbar-right">
          <div className="ms-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            ＋ Tambah Barang
          </button>
        </div>
      </div>

      {/* KIOS BANNER */}
      <div className="kios-banner">
        <div className="kios-banner-left">
          <div className="kios-avatar"><Utensils size={20} /></div>
          <div>
            <div className="kios-banner-name">{nama}</div>
            <div className="kios-banner-sub">Peken Banyumas 2026</div>
          </div>
        </div>
        <div className="kios-banner-right">
          <span className="kios-badge-active">● Kios Aktif</span>
          {kritisCount > 0 && (
            <span className="kios-badge-warn">
              <AlertTriangle size={14} />
              {kritisCount} stok kritis
            </span>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="ms-card">
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
            Memuat data...
          </div>
        ) : (
          <StokTable
            items={filteredItems}
            onEdit={(item) => setEditItem(item)}
            onDelete={(item) => setDeleteItem(item)}
          />
        )}
      </div>

      {/* MODALS */}
      <TambahBarangModal
        show={showModal}
        onClose={() => setShowModal(false)}
        form={form}
        handleChange={handleChange}
        handleSubmit={handleAdd}
        namaUsaha={nama}
      />
      <EditBarangModal
        show={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={handleUpdate}
      />
      <ConfirmDeleteModal
        show={!!deleteItem}
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
      />
      {toast && <Toast message={toast} />}
    </div>
  );
}
