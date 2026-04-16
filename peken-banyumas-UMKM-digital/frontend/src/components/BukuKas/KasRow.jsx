import { ArrowDownCircle, ArrowUpCircle, Pencil, Trash2 } from "lucide-react";

export default function KasRow({ item, index, formatRupiah, onEdit, onDelete }) {
  const isMasuk = item.jenis === "masuk";

  // ── Baris keterangan utama ──────────────────────────────────────────────────
  // Pemasukan : "Sate Lontong x2"  +  badge metode  +  (opsional) nama pelanggan
  // Pengeluaran: teks bebas dari field "ket"
  const keteranganUtama = isMasuk
    ? `${item.barang || "-"} x${item.qty ?? 1}`
    : item.ket || "-";

  // Sub-info kecil di bawah keterangan utama
  const subInfo = isMasuk
    ? item.pelanggan
      ? `Pelanggan: ${item.pelanggan}`
      : null
    : null;

  // Badge metode (tunai / qris) — hanya pemasukan
  const metodeBadge = isMasuk ? (item.metode || "tunai").toUpperCase() : null;

  // ── Kategori class ──────────────────────────────────────────────────────────
  const katMap = {
    "Penjualan"         : "bk-kat-penjualan",
    "Restok Bahan"      : "bk-kat-restok",
    "Biaya Operasional" : "bk-kat-operasional",
  };
  const katClass = katMap[item.kategori] || "bk-kat-lainnya";

  return (
    <tr>
      {/* NO */}
      <td><span className="bk-idx">{index + 1}</span></td>

      {/* TANGGAL */}
      <td><span className="bk-td-tgl">{item.tgl}</span></td>

      {/* KETERANGAN */}
      <td>
        <div className="bk-td-ket-wrap">
          <span className="bk-td-ket">{keteranganUtama}</span>
          <div className="bk-td-ket-meta">
            {metodeBadge && (
              <span className={`bk-metode-badge bk-metode-${(item.metode || "tunai").toLowerCase()}`}>
                {metodeBadge}
              </span>
            )}
            {subInfo && (
              <span className="bk-td-ket-sub">{subInfo}</span>
            )}
          </div>
        </div>
      </td>

      {/* KATEGORI */}
      <td>
        <span className={`bk-kat ${katClass}`}>{item.kategori || "-"}</span>
      </td>

      {/* JENIS */}
      <td>
        <span className={`bk-jenis ${isMasuk ? "bk-jenis-masuk" : "bk-jenis-keluar"}`}>
          {isMasuk
            ? <><ArrowDownCircle size={14} /> Masuk</>
            : <><ArrowUpCircle   size={14} /> Keluar</>
          }
        </span>
      </td>

      {/* NOMINAL */}
      <td>
        <span className={`bk-nominal ${isMasuk ? "bk-nominal-masuk" : "bk-nominal-keluar"}`}>
          {isMasuk ? "+" : "−"}Rp {formatRupiah(item.nominal)}
        </span>
      </td>

      {/* SALDO */}
      <td><span className="bk-saldo">Rp {formatRupiah(item.saldo)}</span></td>

      {/* AKSI */}
      <td>
        <div className="bk-aksi">
          <button className="bk-btn-edit" onClick={() => onEdit(item)}>
            <Pencil size={12} />
          </button>
          <button className="bk-btn-del" onClick={() => onDelete(item)}>
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}