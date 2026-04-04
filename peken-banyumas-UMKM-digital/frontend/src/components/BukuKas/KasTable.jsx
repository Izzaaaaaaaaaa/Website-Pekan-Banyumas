import KasRow from "./KasRow";
import { Inbox } from "lucide-react";

export default function KasTable({ data, formatRupiah, onEdit, onDelete }) {
  return (
    <div className="bk-tbl-wrap">
      <table className="bk-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tanggal</th>
            <th>Keterangan</th>
            <th>Kategori</th>
            <th>Jenis</th>
            <th>Nominal</th>
            <th>Saldo</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <div className="bk-empty">
                  <div className="bk-empty-icon"><Inbox size={36} /></div>
                  Belum ada transaksi
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <KasRow
                key={item.id}
                item={item}
                index={index}
                formatRupiah={formatRupiah}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}