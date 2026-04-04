export default function ConfirmDeleteKasModal({ show, item, onClose, onConfirm }) {
  if (!show) return null;

  return (
    <div className="bk-overlay">
      <div className="bk-modal bk-modal-sm">
        <div className="bk-del-body">
          <div className="bk-del-icon">⚠️</div>
          <div className="bk-del-title">Hapus transaksi ini?</div>
          <div className="bk-del-sub">{item?.ket}</div>
          <div className="bk-del-actions">
            <button className="bk-btn-batal" onClick={onClose}>Batal</button>
            <button className="bk-btn-hapus" onClick={onConfirm}>Ya, Hapus</button>
          </div>
        </div>
      </div>
    </div>
  );
}