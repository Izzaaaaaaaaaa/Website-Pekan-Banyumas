/**
 * uploadBuktiKas — upload foto bukti transaksi ke Supabase Storage.
 *
 * Path: peken-uploads/bukti-kas/{user_id}/{timestamp}-{random}.{ext}
 * Returns: public URL string, atau throws Error jika gagal.
 */
import { supabase } from "./supabase";

const BUCKET = "peken-uploads";

export async function uploadBuktiKas(file) {
  // Validasi tipe & ukuran
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar (JPG / PNG).");
  }
  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Ukuran gambar maksimal 3MB.");
  }

  // Ambil user_id dari localStorage (sudah di-set saat login)
  const userId = localStorage.getItem("user_id") || "unknown";

  // Buat nama file unik
  const ext      = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path     = `bukti-kas/${userId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, cacheControl: "3600" });

  if (uploadError) {
    throw new Error(`Upload gagal: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Gagal mendapatkan URL publik dari storage.");
  }

  return data.publicUrl;
}
