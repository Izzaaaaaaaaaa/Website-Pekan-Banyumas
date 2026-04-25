// ImageUpload.jsx — Peken Banyumasan Design System v2.0
// Drag-and-drop image upload via FileReader
import React, { useRef, useState } from 'react';
import { Upload, Camera } from 'lucide-react';

export default function ImageUpload({
  value,
  onChange,
  label    = 'Upload Foto',
  hint     = 'JPG, PNG, WebP · maks 5 MB',
  shape    = 'square',  // 'square' | 'circle' | 'wide'
  className = '',
}) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [error,    setError]    = useState('');

  const process = file => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar'); return; }
    if (file.size > 5 * 1024 * 1024)     { setError('Ukuran file maks 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = e => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  const onFile = e  => process(e.target.files[0]);
  const onDrop  = e => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files[0]); };

  const shapeStyle = {
    circle: 'rounded-full',
    square: 'rounded-2xl',
    wide:   'rounded-2xl',
  }[shape] || 'rounded-2xl';

  const aspectStyle = {
    circle: { aspectRatio:'1/1' },
    square: { aspectRatio:'1/1' },
    wide:   { aspectRatio:'16/9' },
  }[shape] || { aspectRatio:'1/1' };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <p style={{
          fontSize:11, fontWeight:600, color:'#5a6040',
          marginBottom:8, textTransform:'uppercase',
          letterSpacing:'.04em', fontFamily:'Montserrat, sans-serif',
        }}>{label}</p>
      )}

      <div
        className={`relative overflow-hidden cursor-pointer w-full transition-all ${shapeStyle}`}
        style={{
          ...aspectStyle,
          border: dragging ? '1.5px dashed #7A8A52' : value ? 'none' : '1.5px dashed #c8ccb0',
          background: dragging ? '#eef0e0' : value ? 'transparent' : '#fff',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={e  => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {value ? (
          <>
            <img src={value} alt="preview" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{background:'rgba(13,13,13,0.45)'}}>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{background:'rgba(255,255,255,0.92)', color:'#1e2010'}}>
                <Camera size={13}/> Ganti Foto
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4"
            style={{color:'#8a9070'}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{background:'#eef0e0'}}>
              <Upload size={18} style={{color:'#7A8A52'}}/>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold" style={{color:'#5a6040'}}>
                {dragging ? 'Lepas di sini' : 'Klik atau seret foto'}
              </p>
              {hint && <p className="text-[10px] mt-0.5" style={{color:'#8a9070'}}>{hint}</p>}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs mt-1.5" style={{color:'#B87272'}}>{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        style={{display:'none'}}
      />
    </div>
  );
}
