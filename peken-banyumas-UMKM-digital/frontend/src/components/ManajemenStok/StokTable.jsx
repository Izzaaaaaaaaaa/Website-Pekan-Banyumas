import StokRow from "./StokRow";
import {Inbox} from "lucide-react"

export default function StokTable({ items, onEdit, onDelete }) {
  return (
    <div className="ms-tbl-wrap">
      <table className="ms-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nama Barang</th>
            <th>Kategori</th>
            <th>Stok</th>
            <th>Harga Jual</th>
            <th>Status Stok</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <div className="ms-empty">
                  <div className="ms-empty-icon"><Inbox size={20} /></div>
                  Tidak ada barang ditemukan
                </div>
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <StokRow
                key={item.id}
                item={item}
                index={index}
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