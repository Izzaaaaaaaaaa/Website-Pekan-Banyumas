import { useNavigate } from "react-router-dom";

export default function ConfirmLogoutModal({ show, onClose, userName }) {
  const navigate = useNavigate();

  if (!show) return null;

  const handleLogout = () => {
    localStorage.removeItem("isLogin");
    navigate("/login");
  };

  const namaDepan = userName?.split(" ")[0] || "kamu";

  return (
    <div className="pf-overlay">
      <div className="pf-modal-logout">
        <div className="pf-logout-icon">🚪</div>
        <h3 className="pf-logout-title">Keluar dari akun?</h3>
        <p className="pf-logout-desc">
          Kamu akan keluar dari dashboard kios {namaDepan}.
        </p>
        <div className="pf-logout-actions">
          <button className="pf-btn-kembali" onClick={onClose}>Kembali</button>
          <button className="pf-btn-confirm-logout" onClick={handleLogout}>
            Ya, Logout
          </button>
        </div>
      </div>
    </div>
  );
}