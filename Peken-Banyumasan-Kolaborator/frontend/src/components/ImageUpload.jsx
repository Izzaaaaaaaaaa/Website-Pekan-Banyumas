// ImageUpload.jsx — Reusable photo upload via FileReader (no URL input)
// Usage: <ImageUpload value={url} onChange={(base64) => setFoto(base64)} label="Foto Profil" />
import React, { useRef, useState } from 'react';

export default function ImageUpload({
  value,
  onChange,
  label = 'Upload Foto',
  hint = 'JPG, PNG, WebP · maks 5 MB',
  shape = 'square',   // 'square' | 'circle' | 'wide'
  className = '',
}) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const process = (file) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran file maks 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  const onFile = (e) => process(e.target.files[0]);
  const onDrop = (e) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files[0]); };

  const shapeClass = {
    circle: 'rounded-full aspect-square',
    square: 'rounded-2xl aspect-square',
    wide:   'rounded-2xl aspect-video',
  }[shape] || 'rounded-2xl aspect-square';

  return (
    <div className={`w-full ${className}`}>
      {label && <p className="text-xs font-semibold text-earth-500 uppercase tracking-wider mb-2">{label}</p>}

      <div
        className={`relative overflow-hidden border-2 border-dashed transition cursor-pointer w-full
          ${dragging ? 'border-batik-500 bg-batik-50' : value ? 'border-transparent' : 'border-earth-200 hover:border-batik-400 bg-earth-50 hover:bg-batik-50'}
          ${shapeClass}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {value ? (
          <>
            <img src={value} alt="preview" className="w-full h-full object-cover"/>
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="bg-white/90 rounded-xl px-3 py-2 text-xs font-semibold text-earth-800 flex items-center gap-1.5">
                <span>📷</span> Ganti Foto
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-earth-400 p-4">
            <div className="text-3xl">📷</div>
            <p className="text-xs font-semibold text-center text-earth-600">
              {dragging ? 'Lepaskan foto di sini' : label}
            </p>
            <p className="text-[10px] text-center text-earth-400">{hint}</p>
          </div>
        )}
      </div>

      {value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(''); }}
          className="mt-1.5 text-[11px] text-red-400 hover:text-red-600 transition flex items-center gap-1"
        >
          ✕ Hapus foto
        </button>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
    </div>
  );
}
