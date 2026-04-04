import {Pencil, Trash} from "lucide-react";
export default function StokRow({ item, index, onEdit, onDelete }) {
  const max     = item.max || 50;
  const percent = Math.min(Math.round((item.stok / max) * 100), 100);
  const isLow   = item.stok <= 5;
  const isWarn  = item.stok > 5 && item.stok <= 10;

  // kategori pill class
  const katClass = {
    Makanan : "ms-kat-makanan",
    Minuman : "ms-kat-minuman",
    Camilan : "ms-kat-camilan",
  }[item.kategori] || "ms-kat-lainnya";

  // fill class
  const fillClass = isLow ? "ms-fill-low" : isWarn ? "ms-fill-warn" : "ms-fill-ok";

  // status
  const statusClass = isLow  ? "ms-status-low"
                    : isWarn ? "ms-status-warn"
                    : "ms-status-ok";
  const statusText  = isLow  ? `✕ Kritis (${item.stok})`
                    : isWarn ? `⚠ Hampir Habis (${item.stok})`
                    : `● Aman (${item.stok})`;

  return (
    <tr>
      <td><span className="ms-idx">{index + 1}</span></td>

      {/* NAMA */}
      <td>
        <div className="ms-td-name">{item.nama}</div>
        <div className="ms-td-sub">{item.stok} {item.satuan || "pcs"} tersisa</div>
      </td>

      {/* KATEGORI */}
      <td>
        <span className={`ms-kategori ${katClass}`}>{item.kategori || "Lainnya"}</span>
      </td>

      {/* STOK + PROGRESS */}
      <td>
        <div className="ms-stok-wrap">
          <div className="ms-track">
            <div className={`ms-fill ${fillClass}`} style={{ width: `${percent}%` }} />
          </div>
          <span className="ms-stok-num">{item.stok}/{max}</span>
        </div>
      </td>

      {/* HARGA */}
      <td>
        <span className="ms-harga">
          Rp {Number(item.harga).toLocaleString("id-ID")}
        </span>
      </td>

      {/* STATUS */}
      <td>
        <span className={`ms-status ${statusClass}`}>{statusText}</span>
      </td>

      {/* AKSI */}
      <td>
        <div className="ms-aksi">
          <button className="ms-btn-edit" onClick={() => onEdit(item)}>
            <Pencil size={12} />
          </button>
          <button className="ms-btn-del" onClick={() => onDelete(item)} title="Hapus">
            <Trash size={12}/>
          </button>
        </div>
      </td>
    </tr>
  );
}