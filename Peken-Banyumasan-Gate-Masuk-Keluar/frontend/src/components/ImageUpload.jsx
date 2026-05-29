// ImageUpload.jsx (admin) — uploads to Supabase Storage (public URL), base64 fallback
import React, { useRef, useState } from 'react';
import { ImageIcon, X, Upload } from 'lucide-react';
import { uploadImage } from '../lib/uploadImage';

export default function ImageUpload({
  value,
  onChange,
  label = 'Upload Foto',
  hint = 'JPG, PNG, WebP · maks 5 MB',
  shape = 'wide',  // 'wide' | 'square'
  folder = 'event',
  className = '',
}) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const process = async (file) => {
    if (!file) return;
    setError('');
    try {
      setUploading(true);
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (e) {
      setError(e?.message || 'Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  const onInput = e => process(e.target.files[0]);
  const onDrop  = e => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files[0]); };

  const aspectClass = shape === 'wide' ? 'aspect-video' : 'aspect-square';

  return (
    <div className={className}>
      {label && <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">{label}</label>}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed cursor-pointer transition w-full ${aspectClass}
          ${dragging ? 'border-[#7a8a52] bg-[#eef0e0]' : value ? 'border-transparent' : 'border-[#e4e7d4] hover:border-[#7a8a52] bg-[#f7f8f2] hover:bg-[#eef0e0]/30'}`}
      >
        {uploading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-xs font-semibold text-[#5a6040]">Mengunggah…</div>
        )}
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="bg-white/90 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Upload size={12}/> Ganti foto
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 p-4">
            <ImageIcon size={28} className="text-gray-300"/>
            <p className="text-xs font-medium text-center text-[#8a9070]">
              {dragging ? 'Lepaskan di sini' : 'Klik atau drag foto ke sini'}
            </p>
            <p className="text-[10px] text-gray-400 text-center">{hint}</p>
          </div>
        )}
      </div>

      {value && (
        <button type="button" onClick={() => onChange('')}
          className="mt-1 text-[11px] text-red-400 hover:text-red-600 transition flex items-center gap-1">
          <X size={11}/> Hapus foto
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={onInput} className="hidden"/>
    </div>
  );
}
