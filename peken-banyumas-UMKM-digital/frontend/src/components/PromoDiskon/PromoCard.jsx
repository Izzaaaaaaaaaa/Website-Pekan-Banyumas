import "../../assets/styles/promo.css";

const TIPE_ICON = {
  Persentase: "🎉",
  Nominal: "💰",
  BeliXGratisY: "🛍️",
};

const TIPE_BG = {
  Persentase: "#e8f5ee",
  Nominal: "#fff4e0",
  BeliXGratisY: "#fdecea",
};

export default function PromoCard({ item, onEdit, onDelete }) {
  const icon = TIPE_ICON[item.tipe] || "🏷️";
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
          📅 {item.mulai} – {item.akhir} · Stand A-12
        </div>

        <div className="pd-card-footer">
          <span className={`pd-pill ${item.status === "aktif" ? "pd-pill-green" : "pd-pill-gray"}`}>
            ● {item.status === "aktif" ? "Aktif" : "Nonaktif"}
          </span>
          <div className="pd-card-actions">
            <button className="pd-icon-btn" title="Edit" onClick={() => onEdit(item)}>✏️</button>
            <button className="pd-icon-btn pd-icon-btn-danger" title="Hapus" onClick={() => onDelete(item)}>🗑️</button>
          </div>
        </div>
      </div>
    </div>
  );
}