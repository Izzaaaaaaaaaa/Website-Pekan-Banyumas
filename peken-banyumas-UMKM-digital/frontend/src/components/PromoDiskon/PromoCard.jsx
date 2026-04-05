import "../../assets/styles/promo.css";
import { Tag, Percent, Wallet, ShoppingBag, Calendar, Pencil, Trash2 } from "lucide-react";

const TIPE_ICON = {
  Persentase: <Percent size={28} />,
  Nominal: <Wallet size={28} />,
  BeliXGratisY: <ShoppingBag size={28} />,
};

const TIPE_BG = {
  Persentase: "#e8f5ee",
  Nominal: "#fff4e0",
  BeliXGratisY: "#fdecea",
};

export default function PromoCard({ item, onEdit, onDelete }) {
  const icon = TIPE_ICON[item.tipe] || <Tag size={28} />;
  const bg = TIPE_BG[item.tipe] || "#f0f0f0";

  return (
    <div className="pd-card">
      {/* Poster / Banner area */}
      <div className="pd-card-banner" style={{ background: item.poster ? "transparent" : bg }}>
        {item.poster ? (
          <img src={item.poster} alt="poster promo" className="pd-card-poster" />
        ) : (
          <span className="pd-card-icon">{icon}</span>
        )}
      </div>

      <div className="pd-card-body">
        <h4 className="pd-card-name">{item.nama}</h4>
        <div className="pd-card-value">{item.nilai}</div>
        <div className="pd-card-date">
          <Calendar size={14} /> {item.mulai} – {item.akhir} · Stand A-12
        </div>

        <div className="pd-card-footer">
          <span className={`pd-pill ${item.status === "aktif" ? "pd-pill-green" : "pd-pill-gray"}`}>
            ● {item.status === "aktif" ? "Aktif" : "Nonaktif"}
          </span>
          <div className="pd-card-actions">
            <button className="pd-icon-btn" title="Edit" onClick={() => onEdit(item)}><Pencil size={16} /></button>
            <button className="pd-icon-btn pd-icon-btn-danger" title="Hapus" onClick={() => onDelete(item)}><Trash2 size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}