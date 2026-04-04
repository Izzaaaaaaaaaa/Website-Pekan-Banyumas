import "../../assets/styles/promo.css";

export default function ConfirmDeletePromoModal({ show, item, onClose, onConfirm }) {
  if (!show) return null;

  return (
    <div className="pd-overlay">
      <div className="pd-modal pd-modal-confirm">
        <div className="pd-confirm-icon">⚠️</div>
        <h3 className="pd-confirm-title">Hapus promo "{item?.nama}"?</h3>
        <p className="pd-confirm-desc">Promo akan dihapus dari kios kamu.</p>
        <div className="pd-confirm-actions">
          <button className="pd-btn-outline" onClick={onClose}>Batal</button>
          <button className="pd-btn-danger" onClick={onConfirm}>Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}