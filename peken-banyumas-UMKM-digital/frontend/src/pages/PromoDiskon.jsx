import { useState } from "react";
import { Tag, Utensils, PartyPopper } from "lucide-react";
import PromoCard from "../components/PromoDiskon/PromoCard";
import TambahPromoModal from "../components/modals/TambahPromoModal";
import EditPromoModal from "../components/modals/EditPromoModal";
import ConfirmDeletePromoModal from "../components/modals/ConfirmDeletePromoModal";
import PromoToast from "../components/PromoDiskon/PromoToast";
import "../assets/styles/promo.css";

export default function PromoDiskon() {
  const [promos, setPromos] = useState([
    {
      id: 1,
      nama: "Diskon Pembukaan",
      tipe: "Persentase",
      nilai: "20%",
      mulai: "22 Mar",
      akhir: "22 Mar",
      status: "aktif",
      poster: null,
    },
    {
      id: 2,
      nama: "Beli 2 Gratis 1",
      tipe: "BeliXGratisY",
      nilai: "B2G1",
      mulai: "22 Mar",
      akhir: "24 Mar",
      status: "aktif",
      poster: null,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const handleAdd = (data) => {
    setPromos([{ ...data, id: Date.now(), status: "aktif" }, ...promos]);
    setShowModal(false);
    addToast("✅ Promo berhasil ditambahkan!");
  };

  const handleUpdate = (data) => {
    setPromos(promos.map((p) => (p.id === data.id ? data : p)));
    setEditItem(null);
    addToast("✏️ Promo berhasil diperbarui!");
  };

  const handleDelete = () => {
    setPromos(promos.filter((p) => p.id !== deleteItem.id));
    setDeleteItem(null);
    addToast("🗑️ Promo berhasil dihapus!", "danger");
  };

  const activeCount = promos.filter((p) => p.status === "aktif").length;

  return (
    <div className="pd-page">
      {/* TOPBAR */}
      <div className="pd-topbar">
        <div>
          <div className="pd-eyebrow"><Tag size={16} /> Kios Saya</div>
          <div className="pd-title">
            Promo <em>&amp; Diskon</em>
          </div>
          <div className="pd-subtitle">Promo yang berlaku untuk Kios Stand A-12</div>
        </div>
        <button className="pd-btn-primary" onClick={() => setShowModal(true)}>
          + Tambah Promo
        </button>
      </div>

      {/* INFO BANNER */}
      <div className="pd-info-banner">
        <div className="pd-info-left">
          <div className="pd-info-icon"><Utensils size={18} /></div>
          <div>
            <strong>Sate Blengong Bu Yati · Stand A-12</strong>
            <div className="pd-info-sub">Promo hanya berlaku untuk kios ini</div>
          </div>
        </div>
        <div className="pd-pill-green">{activeCount} Promo Aktif</div>
      </div>

      {/* CARDS */}
      {promos.length === 0 ? (
        <div className="pd-empty">
          <div className="pd-empty-icon"><PartyPopper size={32} /></div>
          <p>Belum ada promo. Yuk tambah promo pertamamu!</p>
        </div>
      ) : (
        <div className="pd-card-grid">
          {promos.map((item) => (
            <PromoCard
              key={item.id}
              item={item}
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          ))}
        </div>
      )}

      {/* MODALS */}
      <TambahPromoModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAdd}
        onToast={addToast}
      />
      <EditPromoModal
        show={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={handleUpdate}
        onToast={addToast}
      />
      <ConfirmDeletePromoModal
        show={!!deleteItem}
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />

      {/* TOAST STACK */}
      <div className="pd-toast-stack">
        {toasts.map((t) => (
          <PromoToast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </div>
  );
}