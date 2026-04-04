export default function ConfirmDeleteModal({ show, onClose, onConfirm, item }) {
  if (!show) return null;

  return (
    <div className="ms-overlay">
      <div className="ms-modal ms-modal-sm">
        <div className="ms-del-body">
          <div className="ms-del-icon">⚠️</div>
          <div className="ms-del-title">Hapus "{item?.nama}"?</div>
          <div className="ms-del-sub">Barang akan dihapus dari stok kios kamu.</div>
          <div className="ms-del-actions">
            <button className="ms-btn-batal" onClick={onClose}>Batal</button>
            <button className="ms-btn-hapus" onClick={onConfirm}>Ya, Hapus</button>
          </div>
        </div>
      </div>
    </div>
  );
}