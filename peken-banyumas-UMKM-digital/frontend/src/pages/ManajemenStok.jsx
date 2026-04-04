import { useState } from "react";
import {Search, Box, AlertTriangle, Utensils, Plus} from "lucide-react";
import StokTable from "../components/ManajemenStok/StokTable";
import StokRow from "../components/ManajemenStok/StokRow";
import TambahBarangModal from "../components/modals/TambahBarangModal";
import EditBarangModal from "../components/modals/EditBarangModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import "../assets/styles/stok.css";

export default function ManajemenStok() {
  const [items, setItems] = useState([
    { id: 1, nama: "Sate Blengong Spesial", stok: 24, max: 50, harga: 25000, kategori: "Makanan", satuan: "porsi" },
    { id: 2, nama: "Sate Campur",           stok: 18, max: 50, harga: 30000, kategori: "Makanan", satuan: "porsi" },
    { id: 3, nama: "Mendoan Jumbo",         stok: 4,  max: 100, harga: 5000, kategori: "Camilan", satuan: "pcs"   },
    { id: 4, nama: "Lontong Sate",          stok: 30, max: 50, harga: 8000,  kategori: "Makanan", satuan: "porsi" },
    { id: 5, nama: "Minuman Jahe Hangat",   stok: 3,  max: 60, harga: 8000,  kategori: "Minuman", satuan: "cup"   },
    { id: 6, nama: "Es Teh Manis",          stok: 40, max: 60, harga: 5000,  kategori: "Minuman", satuan: "cup"   },
  ]);
 
  const [search, setSearch] = useState("");
 
  const filteredItems = items.filter(
    (item) =>
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.kategori?.toLowerCase().includes(search.toLowerCase())
  );
 
  // ── TAMBAH ──
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nama: "", stok: "", harga: "", kategori: "Makanan", satuan: "", deskripsi: "",
  });
 
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
 
  const handleAdd = () => {
    if (!form.nama || !form.stok || !form.harga) {
      alert("Nama, stok, dan harga wajib diisi!");
      return;
    }
    setItems([
      ...items,
      {
        id: Date.now(),
        nama: form.nama,
        stok: Number(form.stok),
        max: Number(form.stok) * 2 || 50,
        harga: Number(form.harga),
        kategori: form.kategori,
        satuan: form.satuan,
        deskripsi: form.deskripsi,
      },
    ]);
    setForm({ nama: "", stok: "", harga: "", kategori: "Makanan", satuan: "", deskripsi: "" });
    setShowModal(false);
  };
 
  // ── EDIT ──
  const [editItem, setEditItem] = useState(null);
  const handleUpdate = (updatedItem) => {
    setItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };
 
  // ── HAPUS ──
  const [deleteItem, setDeleteItem] = useState(null);
  const handleConfirmDelete = () => {
    setItems(items.filter((item) => item.id !== deleteItem.id));
    setDeleteItem(null);
  };
 
  // ── SUMMARY ──
  const kritisCount = items.filter((i) => i.stok <= 5).length;
 
  return (
    <div>
      {/* TOPBAR */}
      <div className="ms-topbar">
        <div>
          <div className="pg-eye"> 
            <Box size={15} />KIOS SAYA</div>
          <div className="pg-title">
            Manajemen <em>Stok</em>
          </div>
          <div className="pg-sub">
            Produk yang dijual di Stand A-12 · Sate Blengong Bu Yati
          </div>
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
 
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Tambah Barang
          </button>
        </div>
      </div>
 
      {/* KIOS BANNER */}
      <div className="kios-banner">
        <div className="kios-banner-left">
          <div className="kios-avatar"><Utensils size={20} /></div>
          <div>
            <div className="kios-banner-name">Sate Blengong Bu Yati</div>
            <div className="kios-banner-sub">Stand A-12 · Zona Kuliner · Peken Banyumas 2026</div>
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
        <StokTable
          items={filteredItems}
          onEdit={(item) => setEditItem(item)}
          onDelete={(item) => setDeleteItem(item)}
        />
      </div>
 
      {/* MODALS */}
      <TambahBarangModal
        show={showModal}
        onClose={() => setShowModal(false)}
        form={form}
        handleChange={handleChange}
        handleSubmit={handleAdd}
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
    </div>
  );
}