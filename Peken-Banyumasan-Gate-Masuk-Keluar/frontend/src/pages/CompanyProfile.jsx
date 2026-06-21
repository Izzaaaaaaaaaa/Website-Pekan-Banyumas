// src/pages/CompanyProfile.jsx
// Admin page untuk mengelola seluruh konten Company Profile Peken Banyumasan.
// Setiap tab memanggil companyProfileApi.get(section) saat mount dan companyProfileApi.save(section) saat simpan.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home, Info, Users, Grid, Image, BookOpen,
  Save, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp,
  Eye, EyeOff, Star, GripVertical, RefreshCw, ExternalLink,
  Loader2, Upload, ImageIcon, AlertCircle,
} from 'lucide-react';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import { useToast } from '../components/Toast';
import { companyProfileApi, karyaApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';
import { uploadImage } from '../lib/uploadImage';
import { KATEGORI_USAHA } from '../constants/kategoriUsaha';
import { SUBSEKTOR } from '../constants/subsektor';

// Render-time only — resolve legacy CP asset paths (/assets/*) against the
// public CP origin so admin previews still show even though those files are
// shipped with the Company-Profile site (not Gate's bundle). Absolute URLs
// (http(s)://, data:, blob:) pass through unchanged. The SAVED value is never
// rewritten — fresh uploads go to Supabase Storage as before.
const CP_ORIGIN = (import.meta.env.VITE_COMPANY_URL || '').replace(/\/$/, '');
const resolveCpAsset = (v) => {
  if (!v) return v;
  if (/^(https?:|data:|blob:)/i.test(v)) return v;
  if (v.startsWith('/assets/') && CP_ORIGIN) return `${CP_ORIGIN}${v}`;
  return v;
};

// ─────────────────────────────────────────────
// DEFAULT DATA (mirrors company profile source)
// ─────────────────────────────────────────────

// Canonical 'home' shape — MUST match what the Company Profile public site
// (HomeScreen.jsx DEFAULT_HOME) consumes:
//   hero_slides       → array of plain URL strings (NOT {id,src,alt} objects)
//   hero_headline_*   → headline split in 3 (pre / em / post) so CP can italic-accent
//   manifesto_col1/2  → two manifesto paragraphs
//   lokasi_headline   → location heading (was lokasi_nama)
//   lokasi_alamat     → full address
//   lokasi_trans      → single combined transport string (CP renders pre-line)
//   lokasi_trans1_url / lokasi_trans2_url → maps links for the two route buttons
//   lokasi_image_url  → map image
// Agenda is NOT part of this section — CP derives it live from the nearest event.
const DEFAULT_HOME = {
  hero_slides: [
    '/assets/banner-home-1.jpg',
    '/assets/banner-home-2.jpg',
    '/assets/banner-about.png',
  ],
  hero_eyebrow: 'MIRAPAT · BANYUMASAN · 2026',
  hero_headline_pre: 'Temukan',
  hero_headline_em: 'pertunjukan',
  hero_headline_post: ', karya artisan, dan cerita Banyumasan dalam satu ekosistem.',
  manifesto_col1: 'Peken Banyumasan adalah sebuah ruang kreatif berbasis budaya lokal yang dirancang sebagai wadah berkumpulnya masyarakat, pelaku Artisan, seniman, dan komunitas dalam satu ekosistem yang hidup, inklusif, dan berkelanjutan.\n\nPeken tidak hanya berfungsi sebagai pasar atau tempat berkumpul biasa, tetapi sebagai ruang interaksi yang menghadirkan pengalaman budaya khas Banyumas melalui berbagai aktivitas seperti pertunjukan seni, kuliner tradisional, produk kreatif, hingga eksplorasi identitas lokal.',
  manifesto_col2: 'Peken Banyumasan adalah ruang temu budaya dan ekonomi kreatif di Banyumas yang mempertemukan seniman, Artisan, dan masyarakat dalam satu perayaan kearifan lokal.\n\nMenghadirkan kuliner tradisional, pertunjukan seni, serta aktivitas komunitas, Peken menjadi tempat di mana budaya tidak hanya dipamerkan, tetapi dirasakan dan dialami bersama.\n\nSejak pertama kali hadir pada Februari 2022 dan diselenggarakan dua kali setiap bulan di kawasan Kota Lama Banyumas, Peken terus berkembang sebagai ekosistem kreatif.',
  lokasi_headline: 'Kawasan Kota Lama Banyumas.\nTaman Sari · Sudagaran.',
  lokasi_alamat: 'Banyumas, Sudagaran, Kec. Banyumas,\nKabupaten Banyumas, Jawa Tengah 53192',
  lokasi_trans: 'Trans Banyumas Koridor 4 · Terminal Bulupitu\nTrans Banyumas Koridor 4 · RS Margono — Halte Alun-alun\nOperasional · 04:40 – 18:30 WIB',
  lokasi_trans1_url: 'https://maps.google.com/?q=Taman+Sari+Kecamatan+Banyumas+Kabupaten+Banyumas+Jawa+Tengah',
  lokasi_trans2_url: 'https://maps.google.com/?q=Trans+Banyumas+Koridor+4',
  lokasi_image_url: '',
};

// Canonical 'about' shape — MUST match what the Company Profile public site
// (AboutScreen.jsx) consumes. AboutScreen reads both the `about` section
// (hero, manifesto, #MIRAPAT block, pillars, visi/tujuan/sasaran) and the
// `tim` section (key_people + stats) from the company-profile API.
// Field names are flat snake_case shared verbatim with the CP renderer.
const DEFAULT_ABOUT = {
  hero_headline: 'Peken lahir dari keinginan untuk menghidupkan kembali denyut kota lama melalui seni, pasar, dan kebersamaan.',
  manifesto_col1: 'Peken Banyumasan tumbuh dari percakapan kecil di sudut Kota Lama — antara seniman pertunjukan, pelaku Artisan, dan warga sekitar yang ingin menghidupkan kembali ruang publik sebagai tempat bertemu, bukan sekadar berdagang.\n\nDari obrolan itu, lahir gerakan dwi-mingguan yang konsisten sejak Februari 2022 — sebuah ritual kolektif yang mempertemukan tradisi, kerajinan, dan kuliner Banyumasan dalam satu malam.',
  manifesto_col2: 'Kami percaya kebudayaan tidak perlu dipajang di balik kaca. Ia hidup ketika dirayakan secara rutin, dalam skala kecil, oleh orang-orang yang merasa memilikinya.\n\nSetiap edisi Peken adalah usaha sederhana untuk menjaga warisan tetap berdetak — sambil membuka ruang bagi karya baru tumbuh di atasnya.',
  mirapat_intro: 'Peken Banyumasan bukan event satu-malam — ia adalah mirapat, kata Banyumasan yang berarti perjumpaan rutin yang dijaga bersama. Setiap edisi mempertemukan seniman pertunjukan tradisional, perajin muda, pelaku Artisan, akademisi, hingga warga sekitar dalam satu ruang yang sama.',
  mirapat_quote: '"Bukan pasar yang menjadi tujuan, melainkan perjumpaan yang menjadikan pasar itu bermakna."',
  mirapat_closing: 'Tiga sumbu menjadi fondasi gerakan ini — pelestarian budaya, ruang berkarya bagi pelaku kreatif, dan ekonomi yang berputar di dalam komunitasnya sendiri.',
  pillars: [
    { n: '01', label: 'CULTURE', body: 'Melestarikan kearifan lokal, seni pertunjukan tradisional, dan warisan budaya takbenda Banyumas sebagai fondasi gerakan.' },
    { n: '02', label: 'CREATIVE', body: 'Memberikan ruang bagi seniman, perajin, dan kolektif muda untuk berkarya dan bertemu audiens yang sebenarnya.' },
    { n: '03', label: 'CIRCULAR', body: 'Mendorong ekonomi berputar di dalam komunitas — dari artisan lokal, bahan lokal, hingga pengunjung lokal.' },
  ],
  visi: 'Menjadi ekosistem budaya dan ekonomi kreatif yang menjaga kearifan lokal Banyumas tetap berdetak — relevan, hidup, dan berkelanjutan.',
  tujuan: 'Menyediakan ruang publik dwi-mingguan yang mempertemukan pelaku seni, Artisan, dan masyarakat — sehingga warisan budaya Banyumasan dirawat melalui praktik bersama, bukan sekadar dipamerkan.',
  sasaran: 'Seniman pertunjukan tradisional, perajin & Artisan Banyumas, komunitas kreatif muda, akademisi, mitra pemerintah dan swasta, serta pengunjung lokal-regional yang menjadi audiens sekaligus pelaku.',
  stats: [
    { n: '86', label: 'Edisi Peken diselenggarakan' },
    { n: '240', label: 'Kolaborator aktif' },
    { n: '1.2k', label: 'Artisan terlibat' },
    { n: '38k', label: 'Pengunjung setiap edisi' },
  ],
};

// Canonical 'tim' shape — MUST match what the Company Profile public site
// (AboutScreen.jsx) consumes: each key_people entry is read as
//   { photo, role, name, title, bio }
// `id` is kept locally as a stable React key (CP ignores extra keys).
const DEFAULT_TIM = {
  key_people: [
    { id: 'kp1', photo: '/assets/tokoh-portrait-1.png', role: 'FOUNDER', name: 'Gilang Ramadhan, S.Sn., M.Ds.', title: 'Founder & Program Director', bio: 'Menggagas Peken pada Februari 2022 dan mengawal kurasi setiap edisi sejak. Latar belakang antropologi pertunjukan, dengan fokus pada kesenian Banyumasan kontemporer.' },
    { id: 'kp2', photo: '/assets/tokoh-portrait-2.png', role: 'CURATOR', name: 'Galih Putra Pamungkas, S.Sn., M.Sn.', title: 'Curator — Artisan', bio: 'Mengkurasi artisan yang masuk ke setiap edisi Peken. Sebelumnya menjalankan kolektif batik di Sokaraja; membangun program pendampingan artisan dari hulu ke hilir.' },
    { id: 'kp3', photo: '/assets/tokoh-portrait-3.png', role: 'STRATEGIC PARTNER', name: 'Jakarta Tisam S.STP, M.Si', title: 'Strategic Partner & Community Lead', bio: 'Menjaga jaringan kolaborator, sponsor, dan mitra institusi — kampus, pemerintah daerah, swasta. Memegang rasio kolaborasi yang sehat antar enam helix.' },
  ],
  hexa_helix: [
    { id: 'hh1', name: 'Government', body: 'Pemerintah Kabupaten Banyumas dan instansi terkait sebagai mitra kebijakan dan ruang publik.' },
    { id: 'hh2', name: 'Academia', body: 'Kampus dan lembaga riset sebagai sumber kajian, kurikulum, dan tenaga kurasi muda.' },
    { id: 'hh3', name: 'Industry', body: 'Pelaku usaha skala Artisan hingga korporasi sebagai mitra ekonomi dan ekosistem produk.' },
    { id: 'hh4', name: 'Community', body: 'Warga, kolektif seni, dan komunitas hobi sebagai inti gerakan dan audiens setia Peken.' },
    { id: 'hh5', name: 'Media', body: 'Jejaring media independen dan jurnalisme budaya sebagai penjaga narasi gerakan.' },
    { id: 'hh6', name: 'Finance', body: 'Mitra pembiayaan — bank, koperasi, hingga skema gotong royong — yang menjaga sirkulasi ekonomi tetap sehat.' },
  ],
  legalitas_dukungan: 'Peken Banyumasan didukung oleh jaringan mitra lintas sektor: Pemerintah Kabupaten Banyumas dan Dinas Kebudayaan sebagai mitra kebijakan; Universitas Jenderal Soedirman sebagai mitra riset dan pendampingan kurasi; Bank BPD Jawa Tengah sebagai mitra pembiayaan Artisan; Komunitas Kota Lama Banyumas sebagai mitra penyelenggara di lokasi.\n\nDukungan ini terdokumentasi dalam Memorandum of Understanding yang diperbarui setiap dua tahun, dan operasional tahunan dilaporkan secara terbuka kepada para mitra sebagai bagian dari prinsip akuntabilitas gerakan.',
  legalitas_hukum: 'Peken Banyumasan beroperasi di bawah payung Yayasan Peken Banyumasan, dengan landasan hukum nasional pada UU No. 5/2017 tentang Pemajuan Kebudayaan dan UU No. 24/2019 tentang Ekonomi Kreatif, serta payung daerah pada Peraturan Daerah Kabupaten Banyumas No. 6/2020 tentang Pemajuan Kebudayaan Daerah.\n\nYayasan terdaftar resmi dengan NPWP 00.000.000.0-000.000 dan NIB 0000000000000, tunduk pada laporan keuangan dan tata kelola yayasan sebagaimana diatur dalam UU Yayasan.',
};

// Canonical 'programs' shape — a flat array. The CP public site renders
// programs via { n, slug, title, image_url, body }; `body_short` feeds the
// Home tiles and `target_peserta`/`durasi` feed the program detail page.
// CP sources programs from this company-profile section on every screen
// (HomeScreen tiles, ProgramScreen rows, ProgramDetailScreen).
const DEFAULT_PROGRAMS = [
  { n: '01', slug: 'banyumasan-fashionshow',  title: 'Banyumasan Fashionshow',  image_url: '/assets/program-fashion.jpg',      body: 'Peragaan busana bertema kebudayaan Banyumas dengan materi tenun, batik, dan karya desainer lokal.', body_short: 'Peragaan busana bertema kebudayaan Banyumas — tenun, batik, karya desainer lokal.',         target_peserta: 'Umum', durasi: '±90 menit' },
  { n: '02', slug: 'bring-your-own-bowl',     title: 'Bring Your Own Bowl',     image_url: '/assets/program-byob.jpg',         body: 'Gerakan zero-waste — pengunjung membawa wadah sendiri, artisan kuliner melayani tanpa kemasan sekali pakai.', body_short: 'Gerakan zero-waste — pengunjung membawa wadah sendiri, artisan kuliner tanpa kemasan sekali pakai.', target_peserta: 'Umum', durasi: 'Sepanjang event' },
  { n: '03', slug: 'local-market',            title: 'Local Market',            image_url: '/assets/program-local-market.jpg', body: 'Pasar produk kerajinan, makanan, dan kebutuhan rumah tangga dari Artisan Banyumasan.', body_short: 'Pasar produk kerajinan, makanan, dan kebutuhan rumah tangga dari Artisan Banyumasan.', target_peserta: 'Umum', durasi: 'Sepanjang event' },
  { n: '04', slug: 'pitutur-banyumasan',      title: 'Pitutur Banyumasan',      image_url: '/assets/program-pitutur.jpg',      body: 'Panggung cerita lisan: kidung, wayang, geguritan. Dipandu oleh para pelaku pertunjukan setempat.', body_short: 'Panggung cerita lisan: kidung, wayang, geguritan, dipandu pelaku pertunjukan setempat.', target_peserta: 'Umum', durasi: '±60 menit' },
  { n: '05', slug: 'coffee-and-conversation', title: 'Coffee & Conversation',   image_url: '/assets/program-coffee.jpg',       body: 'Ruang ngopi lambat untuk percakapan lintas komunitas: seniman, perajin, pemerintah, akademisi.', body_short: 'Ruang ngopi lambat untuk percakapan lintas komunitas — seniman, perajin, akademisi.', target_peserta: 'Komunitas & undangan', durasi: '±120 menit' },
  { n: '06', slug: 'makers-workshop',         title: 'Makers Workshop',         image_url: '/assets/program-makers.jpg',       body: 'Workshop dua-jam: batik ecoprint, tenun mini, aksara Jawa, sablon manual. Terbuka untuk pengunjung.', body_short: 'Workshop dua-jam: batik ecoprint, tenun mini, aksara Jawa, sablon manual.',  target_peserta: 'Umum (maks 20 orang)', durasi: '±120 menit' },
];

// NOTE: The Publication catalog is no longer seeded with sample works here.
// TabKarya loads REAL uploads live from the `karya` table (karyaApi.list) and
// merges them with admin-added manual entries stored in the `works` CP section.
// A manual entry shape is: { id, judul, gambar_url, owner, owner_type, owner_id,
// kategori_display, subsektor, kategori_usaha, tahun, deskripsi, visible }.

// Canonical 'gallery' shape — MUST match what the Company Profile public site
// (GalleryScreen.jsx) consumes: { images: [{ filename|src, label, year,
// visible }], doc_headline, doc_body, doc_ukuran, doc_download_url }.
// CP resolves each image as `src || /assets/${filename}.jpg` and filters out
// entries with `visible === false`. `id` is kept locally as a React key.
const DEFAULT_GALLERY = {
  images: [
    { id: 'g1', filename: 'gallery-1', label: 'Edisi #01', year: '2022', visible: true },
    { id: 'g2', filename: 'gallery-2', label: 'Edisi #02', year: '2022', visible: true },
    { id: 'g3', filename: 'gallery-3', label: 'Edisi #03', year: '2022', visible: true },
    { id: 'g4', filename: 'gallery-4', label: 'Edisi #04', year: '2023', visible: true },
    { id: 'g5', filename: 'gallery-5', label: 'Edisi #05', year: '2023', visible: true },
    { id: 'g6', filename: 'gallery-6', label: 'Edisi #06', year: '2023', visible: true },
    { id: 'g7', filename: 'gallery-perform-1', label: 'Pertunjukan #01', year: '2024', visible: true },
    { id: 'g8', filename: 'gallery-perform-2', label: 'Pertunjukan #02', year: '2024', visible: true },
    { id: 'g9', filename: 'banner-home-1', label: 'Banner Peken', year: '2025', visible: true },
    { id: 'g10', filename: 'banner-home-2', label: 'Banner Edisi', year: '2025', visible: true },
  ],
  doc_headline: 'Setiap edisi Peken didokumentasikan secara terbuka.',
  doc_body: 'Foto-foto di laman ini diambil oleh tim dokumentasi Peken bersama relawan fotografer komunitas — dirilis di bawah lisensi Creative Commons BY-NC 4.0 untuk penggunaan non-komersial dengan atribusi.\n\nSetiap edisi dikemas sebagai paket gambar resolusi tinggi (RAW + JPEG terkurasi) yang dapat diunduh untuk keperluan riset, jurnalisme, atau kebutuhan komunitas.',
  doc_ukuran: 'ZIP · ±420 MB per edisi',
  doc_download_url: '',
};

// ─────────────────────────────────────────────
// SMALL REUSABLE UI
// ─────────────────────────────────────────────

const Field = ({ label, hint, required, children }) => (
  <div>
    <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-[#8a9070] mt-1">{hint}</p>}
  </div>
);

const Input = ({ value, onChange, placeholder, type = 'text', className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition resize-none"
  />
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-[16px] border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionCard = ({ title, subtitle, icon: Icon, children, collapsible = false }) => {
  const [open, setOpen] = useState(true);
  return (
    <Card className="overflow-hidden">
      <div
        className={`flex items-center gap-3 p-5 border-b border-[#f2f4e8] ${collapsible ? 'cursor-pointer select-none hover:bg-[#f7f8f2] transition' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        {Icon && <div className="w-8 h-8 rounded-lg bg-[#eef0e0] flex items-center justify-center shrink-0"><Icon size={16} className="text-[#7a8a52]" /></div>}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#1e2010] text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-[#8a9070] mt-0.5">{subtitle}</p>}
        </div>
        {collapsible && (open ? <ChevronUp size={16} className="text-[#8a9070] shrink-0" /> : <ChevronDown size={16} className="text-[#8a9070] shrink-0" />)}
      </div>
      {open && <div className="p-5">{children}</div>}
    </Card>
  );
};

const SaveBtn = ({ onClick, saving, label = 'Simpan Perubahan' }) => (
  <button
    onClick={onClick}
    disabled={saving}
    className="flex items-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-5 py-2.5 rounded-[12px] text-sm font-semibold transition disabled:opacity-60"
  >
    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
    {saving ? 'Menyimpan...' : label}
  </button>
);

const ToggleSwitch = ({ value, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <div onClick={() => onChange(!value)} className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${value ? 'bg-[#7a8a52]' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'left-5' : 'left-1'}`} />
    </div>
    {label && <span className="text-sm text-gray-700 font-medium">{label}</span>}
  </label>
);

// Image upload OR url input
// Image picker — FILE UPLOAD ONLY (base64 data URL), matching the artisan/
// kolaborator ImageUpload component. The old "URL" tab let admins paste
// /assets/... paths that only exist in the frontend bundle (useless to a
// client who only has the website, not the codebase) — removed to avoid that
// foot-gun and keep image handling consistent across all apps. Any existing
// value (data URL, /assets/, or https://) still renders in the preview.
const ImageInput = ({ value, onChange, label, shape = 'wide' }) => {
  const inputRef = useRef();
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);

  const processFile = async (file) => {
    if (!file) return;
    setErr('');
    try {
      setUploading(true);
      const url = await uploadImage(file, 'cp');
      onChange(url);
    } catch (e) {
      setErr(e?.message || 'Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  };

  const aspectClass = shape === 'square' ? 'aspect-square' : 'aspect-video';

  return (
    <div>
      {label && <label className="text-[#5a6040] text-xs font-semibold mb-1.5 block">{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); processFile(e.dataTransfer.files[0]); }}
        className={`relative overflow-hidden rounded-[12px] border-2 border-dashed cursor-pointer transition w-full ${aspectClass} ${value ? 'border-transparent' : 'border-[#e4e7d4] hover:border-[#c8d09a] bg-[#f7f8f2]'}`}
      >
        {uploading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-xs font-semibold text-[#5a6040]">Mengunggah…</div>
        )}
        {value ? (
          <>
            <img src={resolveCpAsset(value)} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="bg-white/90 rounded-[12px] px-3 py-1.5 text-xs font-semibold text-gray-700 flex items-center gap-1"><Upload size={12} /> Ganti</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#8a9070]">
            <ImageIcon size={24} className="text-gray-300" />
            <p className="text-xs font-medium text-center text-[#8a9070]">Klik atau drag foto</p>
            <p className="text-[10px] text-[#8a9070]">JPG, PNG, WebP · maks 5 MB</p>
          </div>
        )}
      </div>

      {value && (
        <button onClick={() => { onChange(''); }} className="mt-1 text-[11px] text-red-400 hover:text-red-600 flex items-center gap-1 transition">
          <X size={10} /> Hapus gambar
        </button>
      )}
      {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={e => processFile(e.target.files[0])} className="hidden" />
    </div>
  );
};

// ─────────────────────────────────────────────
// TAB: BERANDA
// ─────────────────────────────────────────────

function TabBeranda() {
  const toast = useToast();
  const [data, setData] = useState(DEFAULT_HOME);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    companyProfileApi.get('home').then(d => {
      if (!d) return;
      // Tolerate legacy {id,src,alt} slide objects — normalise to URL strings.
      if (Array.isArray(d.hero_slides)) {
        d = { ...d, hero_slides: d.hero_slides.map(s => (typeof s === 'string' ? s : (s?.src || ''))) };
      }
      setData(p => ({ ...p, ...d }));
    }).catch(() => {});
  }, []);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  // hero_slides is a flat array of URL strings (canonical CP shape).
  const setSlide = (idx, v) => setData(p => {
    const slides = [...p.hero_slides];
    slides[idx] = v;
    return { ...p, hero_slides: slides };
  });

  const addSlide = () => {
    if (data.hero_slides.length >= 6) { toast.warning('Maksimal 6 slide'); return; }
    setData(p => ({ ...p, hero_slides: [...p.hero_slides, ''] }));
  };

  const removeSlide = (idx) => {
    if (data.hero_slides.length <= 1) { toast.warning('Minimal 1 slide harus ada'); return; }
    setData(p => ({ ...p, hero_slides: p.hero_slides.filter((_, i) => i !== idx) }));
  };

  const save = async (section) => {
    setSaving(s => ({ ...s, [section]: true }));
    try {
      await companyProfileApi.save('home', data);
      toast.success('Berhasil disimpan');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menyimpan'));
    } finally {
      setSaving(s => ({ ...s, [section]: false }));
    }
  };

  return (
    <div className="space-y-5">

      {/* Hero Carousel */}
      <SectionCard title="Hero Carousel" subtitle="Gambar yang berganti otomatis di halaman utama" icon={Image} collapsible>
        <div className="space-y-5">
          <div className="grid gap-4">
            {data.hero_slides.map((slide, idx) => (
              <div key={idx} className="border border-gray-100 rounded-[12px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8a9070] uppercase tracking-wider">Slide {idx + 1}</span>
                  <button onClick={() => removeSlide(idx)} className="text-red-400 hover:text-red-600 transition p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                <ImageInput
                  label="Gambar Slide"
                  value={slide}
                  onChange={v => setSlide(idx, v)}
                  shape="wide"
                />
              </div>
            ))}
          </div>
          <button onClick={addSlide} className="flex items-center gap-2 border-2 border-dashed border-[#e4e7d4] hover:border-[#c8d09a] hover:text-[#7a8a52] text-[#8a9070] px-4 py-3 rounded-[12px] text-sm font-medium transition w-full justify-center">
            <Plus size={16} /> Tambah Slide
          </button>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => save('slides')} saving={saving.slides} />
          </div>
        </div>
      </SectionCard>

      {/* Hero Text */}
      <SectionCard title="Teks Hero" subtitle="Eyebrow label dan headline utama di atas carousel" icon={BookOpen} collapsible>
        <div className="space-y-4">
          <Field label="Eyebrow (teks kecil atas)">
            <Input value={data.hero_eyebrow} onChange={v => set('hero_eyebrow', v)} placeholder="MIRAPAT · BANYUMASAN · 2026" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Headline — Bagian Awal" hint="Teks sebelum kata aksen">
              <Input value={data.hero_headline_pre} onChange={v => set('hero_headline_pre', v)} placeholder="Temukan" />
            </Field>
            <Field label="Headline — Kata Aksen" hint="Dicetak miring + warna aksen">
              <Input value={data.hero_headline_em} onChange={v => set('hero_headline_em', v)} placeholder="pertunjukan" />
            </Field>
            <Field label="Headline — Bagian Akhir" hint="Teks setelah kata aksen">
              <Input value={data.hero_headline_post} onChange={v => set('hero_headline_post', v)} placeholder=", karya artisan, dan cerita..." />
            </Field>
          </div>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => save('hero_text')} saving={saving.hero_text} />
          </div>
        </div>
      </SectionCard>

      {/* Manifesto */}
      <SectionCard title="Blok Manifesto" subtitle="Dua kolom teks di bawah hero (latar sage/hijau)" icon={BookOpen} collapsible>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Kolom Kiri">
              <Textarea value={data.manifesto_col1} onChange={v => set('manifesto_col1', v)} rows={6} placeholder="Paragraf kolom kiri..." />
            </Field>
            <Field label="Kolom Kanan">
              <Textarea value={data.manifesto_col2} onChange={v => set('manifesto_col2', v)} rows={6} placeholder="Paragraf kolom kanan..." />
            </Field>
          </div>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => save('manifesto')} saving={saving.manifesto} />
          </div>
        </div>
      </SectionCard>

      {/* Agenda Terdekat — auto dari event */}
      <SectionCard title="Agenda Terdekat" subtitle="Diambil otomatis dari event terdekat" icon={BookOpen} collapsible>
        <div className="bg-blue-50 border border-blue-100 rounded-[12px] px-4 py-3 flex items-start gap-3">
          <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Agenda Terdekat di halaman publik <strong>otomatis menampilkan event dengan tanggal terdekat</strong> dari menu <strong>Kelola Event</strong>. Tidak perlu mengisi manual — buat atau perbarui event dari halaman Kelola Event.
          </p>
        </div>
      </SectionCard>

      {/* Lokasi */}
      <SectionCard title="Info Lokasi" subtitle="Alamat, transportasi, dan peta Peken" icon={BookOpen} collapsible>
        <div className="space-y-4">
          <Field label="Headline Lokasi" hint="Boleh multi-baris — setiap baris baru tampil terpisah di halaman publik.">
            <Textarea value={data.lokasi_headline} onChange={v => set('lokasi_headline', v)} rows={2} placeholder="Kawasan Kota Lama Banyumas..." />
          </Field>
          <Field label="Alamat Lengkap" hint="Boleh multi-baris.">
            <Textarea value={data.lokasi_alamat} onChange={v => set('lokasi_alamat', v)} rows={2} placeholder="Banyumas, Sudagaran..." />
          </Field>
          <Field label="Info Transportasi" hint="Satu baris per rute/keterangan. Contoh baris terakhir: 'Operasional · 04:40 – 18:30 WIB'.">
            <Textarea value={data.lokasi_trans} onChange={v => set('lokasi_trans', v)} rows={3} placeholder={'Trans Banyumas Koridor 4 · Terminal Bulupitu\n...'} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Link Maps — Tombol Rute 1" hint="Tombol 'Rute Peken Banyumasan'">
              <Input value={data.lokasi_trans1_url} onChange={v => set('lokasi_trans1_url', v)} placeholder="https://maps.google.com/..." />
            </Field>
            <Field label="Link Maps — Tombol Rute 2" hint="Tombol 'Trayek Trans Banyumas'">
              <Input value={data.lokasi_trans2_url} onChange={v => set('lokasi_trans2_url', v)} placeholder="https://maps.google.com/..." />
            </Field>
          </div>
          <ImageInput label="Gambar Peta Lokasi" hint="Tampil di samping info lokasi pada halaman publik." value={data.lokasi_image_url} onChange={v => set('lokasi_image_url', v)} shape="wide" />
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => save('lokasi')} saving={saving.lokasi} />
          </div>
        </div>
      </SectionCard>

    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: TENTANG
// ─────────────────────────────────────────────

function TabTentang() {
  const toast = useToast();
  const [data, setData] = useState(DEFAULT_ABOUT);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    companyProfileApi.get('about').then(d => d && setData(p => ({ ...p, ...d }))).catch(() => {});
  }, []);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const setPillar = (idx, k, v) => setData(p => {
    const pillars = [...p.pillars];
    pillars[idx] = { ...pillars[idx], [k]: v };
    return { ...p, pillars };
  });
  const setStat = (idx, k, v) => setData(p => {
    const stats = [...p.stats];
    stats[idx] = { ...stats[idx], [k]: v };
    return { ...p, stats };
  });

  const save = async (section) => {
    setSaving(s => ({ ...s, [section]: true }));
    try {
      await companyProfileApi.save('about', data);
      toast.success('Berhasil disimpan');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menyimpan'));
    } finally {
      setSaving(s => ({ ...s, [section]: false }));
    }
  };

  return (
    <div className="space-y-5">

      {/* Hero */}
      <SectionCard title="Hero Tentang" subtitle="Headline besar pada halaman About (full-screen dengan foto)" icon={BookOpen} collapsible>
        <Field label="Headline Hero" hint="Kata yang dicetak miring: 'denyut kota lama'">
          <Textarea value={data.hero_headline} onChange={v => set('hero_headline', v)} rows={3} />
        </Field>
        <div className="flex justify-end pt-4 border-t border-[#f2f4e8] mt-4">
          <SaveBtn onClick={() => save('about_hero')} saving={saving.about_hero} />
        </div>
      </SectionCard>

      {/* Manifesto */}
      <SectionCard title="Blok Manifesto About" subtitle="Dua kolom teks di bawah hero About (latar aksen/sage)" icon={BookOpen} collapsible>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Kolom Kiri">
            <Textarea value={data.manifesto_col1} onChange={v => set('manifesto_col1', v)} rows={6} />
          </Field>
          <Field label="Kolom Kanan">
            <Textarea value={data.manifesto_col2} onChange={v => set('manifesto_col2', v)} rows={6} />
          </Field>
        </div>
        <div className="flex justify-end pt-4 border-t border-[#f2f4e8] mt-4">
          <SaveBtn onClick={() => save('about_manifesto')} saving={saving.about_manifesto} />
        </div>
      </SectionCard>

      {/* MIRAPAT */}
      <SectionCard title="Seksi #MIRAPAT" subtitle="Paragraf intro, blockquote, dan penutup" icon={BookOpen} collapsible>
        <div className="space-y-4">
          <Field label="Paragraf Intro" hint="Kata 'mirapat' akan dicetak miring dan berwarna aksen">
            <Textarea value={data.mirapat_intro} onChange={v => set('mirapat_intro', v)} rows={3} />
          </Field>
          <Field label="Blockquote (kutipan)" hint="Pastikan diawali dan diakhiri tanda kutip">
            <Textarea value={data.mirapat_quote} onChange={v => set('mirapat_quote', v)} rows={2} />
          </Field>
          <Field label="Paragraf Penutup">
            <Textarea value={data.mirapat_closing} onChange={v => set('mirapat_closing', v)} rows={2} />
          </Field>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => save('mirapat')} saving={saving.mirapat} />
          </div>
        </div>
      </SectionCard>

      {/* Three Pillars */}
      <SectionCard title="Tiga Pilar" subtitle="CULTURE · CREATIVE · CIRCULAR" icon={BookOpen} collapsible>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.pillars.map((p, idx) => (
            <div key={p.n} className="border border-gray-100 rounded-[12px] p-4 space-y-3">
              <div className="text-xs font-bold text-[#7a8a52] uppercase tracking-wider">Pilar {p.n}</div>
              <Field label="Label">
                <Input value={p.label} onChange={v => setPillar(idx, 'label', v)} placeholder="CULTURE" />
              </Field>
              <Field label="Deskripsi">
                <Textarea value={p.body} onChange={v => setPillar(idx, 'body', v)} rows={3} />
              </Field>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4 border-t border-[#f2f4e8] mt-4">
          <SaveBtn onClick={() => save('pillars')} saving={saving.pillars} />
        </div>
      </SectionCard>

      {/* Visi Tujuan Sasaran */}
      <SectionCard title="Visi · Tujuan · Sasaran" subtitle="Blok aksen/sage di halaman About" icon={BookOpen} collapsible>
        <div className="space-y-4">
          <Field label="Visi (headline besar)" hint="Kata 'berdetak' dicetak miring">
            <Textarea value={data.visi} onChange={v => set('visi', v)} rows={3} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tujuan">
              <Textarea value={data.tujuan} onChange={v => set('tujuan', v)} rows={4} />
            </Field>
            <Field label="Sasaran">
              <Textarea value={data.sasaran} onChange={v => set('sasaran', v)} rows={4} />
            </Field>
          </div>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => save('visi')} saving={saving.visi} />
          </div>
        </div>
      </SectionCard>

      {/* Stats — auto dari backend */}
      <SectionCard title="Statistik Ekosistem" subtitle="Dihitung otomatis dari data aktual" icon={BookOpen} collapsible>
        <div className="bg-blue-50 border border-blue-100 rounded-[12px] px-4 py-3 flex items-start gap-3">
          <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Angka statistik (<strong>Edisi, Kolaborator aktif, Artisan, Pengunjung</strong>) dihitung otomatis dari data sistem secara real-time. Tidak perlu mengisi manual — data diperbarui setiap kali halaman About dimuat.
          </p>
        </div>
      </SectionCard>

    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: TIM & MITRA
// ─────────────────────────────────────────────

function PersonModal({ person, onClose, onSave }) {
  const [form, setForm] = useState({ ...person });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-[#1e2010]">Edit Anggota Tim</h3>
          <button onClick={onClose} className="text-[#8a9070] hover:text-[#5a6040]"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <ImageInput label="Foto Profil" value={form.photo} onChange={v => set('photo', v)} shape="square" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Jabatan (label kecil)" required>
              <Input value={form.role} onChange={v => set('role', v)} placeholder="FOUNDER" />
            </Field>
            <Field label="Nama Lengkap" required>
              <Input value={form.name} onChange={v => set('name', v)} placeholder="Nama + gelar" />
            </Field>
          </div>
          <Field label="Jabatan/Posisi">
            <Input value={form.title} onChange={v => set('title', v)} placeholder="Founder & Program Director" />
          </Field>
          <Field label="Bio (tampil saat hover)">
            <Textarea value={form.bio} onChange={v => set('bio', v)} rows={4} placeholder="Deskripsi singkat..." />
          </Field>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-medium hover:bg-[#f7f8f2] transition">Batal</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition">Simpan</button>
        </div>
      </div>
    </div>
  );
}

function TabTim() {
  const toast = useToast();
  const [data, setData] = useState(DEFAULT_TIM);
  const [editPerson, setEditPerson] = useState(null);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    companyProfileApi.get('tim').then(d => {
      if (!d) return;
      // Tolerate legacy key_people field names (foto_url→photo, jabatan→role).
      if (Array.isArray(d.key_people)) {
        d = {
          ...d,
          key_people: d.key_people.map(kp => ({
            ...kp,
            photo: kp.photo ?? kp.foto_url ?? '',
            role: kp.role ?? kp.jabatan ?? '',
          })),
        };
      }
      setData(p => ({ ...p, ...d }));
    }).catch(() => {});
  }, []);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const setHelix = (idx, k, v) => setData(p => {
    const hh = [...p.hexa_helix];
    hh[idx] = { ...hh[idx], [k]: v };
    return { ...p, hexa_helix: hh };
  });

  const saveAll = async (section) => {
    setSaving(s => ({ ...s, [section]: true }));
    try {
      await companyProfileApi.save('tim', data);
      toast.success('Berhasil disimpan');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menyimpan'));
    } finally {
      setSaving(s => ({ ...s, [section]: false }));
    }
  };

  const savePerson = (updated) => {
    setData(p => ({ ...p, key_people: p.key_people.map(kp => kp.id === updated.id ? updated : kp) }));
    setEditPerson(null);
    toast.success(`Data ${updated.name} diperbarui — klik Simpan untuk menyimpan ke database`);
  };

  const addPerson = () => {
    const newP = { id: `kp${Date.now()}`, photo: '', role: 'KOLABORATOR', name: 'Anggota Baru', title: '', bio: '' };
    setData(p => ({ ...p, key_people: [...p.key_people, newP] }));
  };

  const removePerson = (id) => {
    if (!window.confirm('Hapus anggota tim ini?')) return;
    setData(p => ({ ...p, key_people: p.key_people.filter(kp => kp.id !== id) }));
  };

  return (
    <div className="space-y-5">
      {editPerson && <PersonModal person={editPerson} onClose={() => setEditPerson(null)} onSave={savePerson} />}

      {/* Key People */}
      <SectionCard title="Tim Inti (Key People)" subtitle="Tiga kartu yang tampil di halaman About" icon={Users} collapsible>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.key_people.map((kp) => (
              <div key={kp.id} className="border border-gray-100 rounded-[12px] overflow-hidden group relative">
                <div className="aspect-square bg-[#eef0e0] overflow-hidden">
                  {kp.photo
                    ? <img src={resolveCpAsset(kp.photo)} alt={kp.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300"><Users size={32} /></div>
                  }
                </div>
                <div className="p-3">
                  <div className="text-[10px] font-bold text-[#7a8a52] uppercase tracking-wider">{kp.role}</div>
                  <div className="font-semibold text-[#1e2010] text-sm mt-1 leading-tight">{kp.name}</div>
                  <div className="text-xs text-[#8a9070] mt-0.5">{kp.title}</div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => setEditPerson(kp)} className="w-7 h-7 bg-white rounded-lg shadow flex items-center justify-center text-[#8a9070] hover:text-[#7a8a52]"><Edit2 size={13} /></button>
                  <button onClick={() => removePerson(kp.id)} className="w-7 h-7 bg-white rounded-lg shadow flex items-center justify-center text-[#8a9070] hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addPerson} className="flex items-center gap-2 border-2 border-dashed border-[#e4e7d4] hover:border-[#c8d09a] hover:text-[#7a8a52] text-[#8a9070] px-4 py-3 rounded-[12px] text-sm font-medium transition w-full justify-center">
            <Plus size={16} /> Tambah Anggota Tim
          </button>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => saveAll('key_people')} saving={saving.key_people} />
          </div>
        </div>
      </SectionCard>

      {/* Hexa-Helix */}
      <SectionCard title="Model Hexa-Helix" subtitle="Enam pilar kolaborasi yang tampil di halaman About" icon={Grid} collapsible>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.hexa_helix.map((hh, idx) => (
              <div key={hh.id} className="border border-gray-100 rounded-[12px] p-4 space-y-3">
                <div className="text-xs font-bold text-[#7a8a52] uppercase tracking-wider">Helix {idx + 1}</div>
                <Field label="Nama Pilar">
                  <Input value={hh.name} onChange={v => setHelix(idx, 'name', v)} placeholder="Government" />
                </Field>
                <Field label="Deskripsi">
                  <Textarea value={hh.body} onChange={v => setHelix(idx, 'body', v)} rows={2} />
                </Field>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => saveAll('hexa_helix')} saving={saving.hexa_helix} />
          </div>
        </div>
      </SectionCard>

      {/* Legalitas */}
      <SectionCard title="Legalitas & Dukungan" subtitle="Dua blok teks di seksi legalitas halaman About" icon={BookOpen} collapsible>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Dukungan Kelembagaan">
              <Textarea value={data.legalitas_dukungan} onChange={v => set('legalitas_dukungan', v)} rows={8} />
            </Field>
            <Field label="Landasan Legalitas">
              <Textarea value={data.legalitas_hukum} onChange={v => set('legalitas_hukum', v)} rows={8} />
            </Field>
          </div>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => saveAll('legalitas')} saving={saving.legalitas} />
          </div>
        </div>
      </SectionCard>

    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: PROGRAM
// ─────────────────────────────────────────────

function TabProgram() {
  const toast = useToast();
  const [programs, setPrograms] = useState(DEFAULT_PROGRAMS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    companyProfileApi.get('programs').then(d => Array.isArray(d) && d.length && setPrograms(d)).catch(() => {});
  }, []);

  const mdeOptions = React.useMemo(() => ({
    autofocus: false,
    spellChecker: false,
    toolbar: ['bold', 'italic', 'heading', '|', 'unordered-list', 'ordered-list', '|', 'preview'],
    status: false,
    minHeight: '120px',
  }), []);

  const toSlug = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

  const setP = (idx, k, v) => setPrograms(p => {
    const arr = [...p];
    arr[idx] = { ...arr[idx], [k]: v };
    if (k === 'title' && !arr[idx].slug) {
      arr[idx].slug = toSlug(v);
    }
    return arr;
  });

  const save = async () => {
    setSaving(true);
    try {
      await companyProfileApi.save('programs', programs);
      toast.success('Data program berhasil disimpan');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-[12px] px-4 py-3 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">Program yang sama tampil di halaman <strong>Program</strong> (deskripsi panjang) dan <strong>Home</strong> (deskripsi pendek). Isi kedua versi agar tampilan konsisten.</p>
      </div>

      {programs.map((p, idx) => (
        <SectionCard key={p.n} title={`Program ${p.n} — ${p.title}`} subtitle="Tampil di Home (tiles) dan halaman Program (rows)" icon={Grid} collapsible>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Judul Program" required>
                <Input value={p.title} onChange={v => setP(idx, 'title', v)} />
              </Field>
              <Field label="Slug URL" hint="Otomatis dari judul. Digunakan di URL halaman detail program.">
                <Input value={p.slug || ''} onChange={v => setP(idx, 'slug', toSlug(v))} placeholder="contoh-nama-program" />
              </Field>
            </div>
            <ImageInput label="Foto Program" value={p.image_url} onChange={v => setP(idx, 'image_url', v)} shape="wide" />
            <Field label="Deskripsi Panjang (halaman Program)" hint="Mendukung Markdown: **tebal**, *miring*, ## Judul, - daftar">
              <SimpleMDE value={p.body || ''} onChange={v => setP(idx, 'body', v)} options={mdeOptions} />
            </Field>
            <Field label="Deskripsi Pendek (tile di Home)" hint="Versi ringkas plain text untuk tile grid di halaman utama">
              <Textarea value={p.body_short || ''} onChange={v => setP(idx, 'body_short', v)} rows={3} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Target Peserta" hint="Opsional. Contoh: Umum, Komunitas & undangan">
                <Input value={p.target_peserta || ''} onChange={v => setP(idx, 'target_peserta', v)} placeholder="Umum" />
              </Field>
              <Field label="Durasi" hint="Opsional. Contoh: ±90 menit, Sepanjang event">
                <Input value={p.durasi || ''} onChange={v => setP(idx, 'durasi', v)} placeholder="±120 menit" />
              </Field>
            </div>
          </div>
        </SectionCard>
      ))}

      <div className="flex justify-end sticky bottom-4">
        <div className="bg-white rounded-[16px] shadow-lg border border-gray-100 p-3">
          <SaveBtn onClick={save} saving={saving} label="Simpan Semua Program" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: KARYA
// ─────────────────────────────────────────────

function WorkModal({ work, onClose, onSave }) {
  const [form, setForm] = useState({ ...work });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const isArtisan = form.owner_type === 'artisan';
  // kategori_display is the single category string the CP public site renders.
  // Derive it from whichever selector matches the chosen owner_type.
  const setKategori = (field, v) => setForm(p => ({ ...p, [field]: v, kategori_display: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-[#1e2010]">{work.id ? 'Edit Karya' : 'Tambah Karya Manual'}</h3>
          <button onClick={onClose} className="text-[#8a9070] hover:text-[#5a6040]"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <ImageInput label="Foto Karya" value={form.gambar_url} onChange={v => set('gambar_url', v)} shape="wide" />
          <Field label="Judul Karya" required>
            <Input value={form.judul} onChange={v => set('judul', v)} placeholder="Nama karya" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nama Pembuat/Kolaborator" required>
              <Input value={form.owner} onChange={v => set('owner', v)} placeholder="Nama individu/komunitas" />
            </Field>
            <Field label="Tahun">
              <Input type="number" value={form.tahun} onChange={v => set('tahun', parseInt(v, 10) || new Date().getFullYear())} placeholder="2026" />
            </Field>
          </div>
          <Field label="Tipe Pembuat" hint="Opsional — kosongkan untuk entri manual yang tidak terikat akun (tanpa link profil publik).">
            <select value={form.owner_type || ''} onChange={e => set('owner_type', e.target.value || null)}
              className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition bg-white">
              <option value="">— Manual (tanpa akun) —</option>
              <option value="artisan">Artisan (UMKM)</option>
              <option value="kolaborator">Kolaborator (Kreatif)</option>
            </select>
          </Field>
          {form.owner_type ? (isArtisan ? (
            <Field label="Kategori Usaha" hint="Tampil sebagai kategori karya di halaman publik.">
              <select value={form.kategori_usaha || ''} onChange={e => setKategori('kategori_usaha', e.target.value)}
                className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition bg-white">
                <option value="">Pilih kategori usaha...</option>
                {KATEGORI_USAHA.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Subsektor" hint="Tampil sebagai kategori karya di halaman publik.">
              <select value={form.subsektor || ''} onChange={e => setKategori('subsektor', e.target.value)}
                className="w-full border border-[#e4e7d4] rounded-[12px] px-4 py-2.5 text-sm focus:outline-none focus:border-[#7a8a52] transition bg-white">
                <option value="">Pilih subsektor...</option>
                {SUBSEKTOR.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          )) : (
            <Field label="Kategori" hint="Kategori karya untuk entri manual (tampil di halaman publik).">
              <Input value={form.kategori_display || ''} onChange={v => set('kategori_display', v)} placeholder="mis. Fotografi, Kriya, Kuliner" />
            </Field>
          )}
          <Field label="Deskripsi">
            <Textarea value={form.deskripsi} onChange={v => set('deskripsi', v)} rows={4} />
          </Field>
          <ToggleSwitch value={form.visible} onChange={v => set('visible', v)} label="Tampilkan di company profile" />
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-medium hover:bg-[#f7f8f2] transition">Batal</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition">Simpan Karya</button>
        </div>
      </div>
    </div>
  );
}

function TabKarya() {
  const toast = useToast();
  // Two distinct sources, kept separate so each persists correctly:
  //  • karyaItems  — REAL uploads from the `karya` table (live). Tagged _live.
  //                  Visibility toggles persist immediately to karya.tampil.
  //  • manualWorks — admin-added entries stored in the `works` CP section.
  //                  Saved together via "Simpan Karya Manual".
  const [karyaItems, setKaryaItems] = useState([]);
  const [manualWorks, setManualWorks] = useState([]);
  const [editWork, setEditWork] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'kolaborator' | 'manual'
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      companyProfileApi.get('works'),
      karyaApi.list(),
    ]).then(([sec, kry]) => {
      const curated = (sec.status === 'fulfilled' && Array.isArray(sec.value)) ? sec.value : [];
      // Only genuine manual entries belong in the section now; ignore any live
      // rows that may have leaked in previously (real uploads come from karya).
      setManualWorks(curated.filter(w => !w._live));
      const live = (kry.status === 'fulfilled' && Array.isArray(kry.value)) ? kry.value : [];
      setKaryaItems(live.map(k => ({ ...k, _live: true })));
    }).finally(() => setLoading(false));
  }, []);

  // Live uploads first (mirrors the public CP Publication ordering).
  const works = [...karyaItems, ...manualWorks];

  const save = async () => {
    setSaving(true);
    try {
      await companyProfileApi.save('works', manualWorks);
      toast.success('Karya manual berhasil disimpan');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menyimpan'));
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = async (item) => {
    if (item._live) {
      if (busyId === item.id) return;
      const next = !item.visible;
      setBusyId(item.id);
      setKaryaItems(arr => arr.map(x => x.id === item.id ? { ...x, visible: next } : x)); // optimistic
      try {
        await karyaApi.setVisible(item.id, next);
        toast.success(next ? 'Karya ditampilkan di company profile' : 'Karya disembunyikan dari company profile');
      } catch (err) {
        setKaryaItems(arr => arr.map(x => x.id === item.id ? { ...x, visible: !next } : x)); // revert
        toast.error(extractError(err, 'Gagal memperbarui visibilitas'));
      } finally {
        setBusyId(null);
      }
    } else {
      setManualWorks(arr => arr.map(x => x.id === item.id ? { ...x, visible: !x.visible } : x));
    }
  };

  const openAdd = () => setEditWork({ id: null, judul: '', owner: '', owner_type: null, owner_id: '', subsektor: '', kategori_usaha: '', kategori_display: '', tahun: new Date().getFullYear(), gambar_url: '', deskripsi: '', visible: true });

  const saveWork = (updated) => {
    if (updated.id) {
      setManualWorks(arr => arr.map(x => x.id === updated.id ? updated : x));
      toast.success('Karya manual diperbarui — klik Simpan untuk menyimpan');
    } else {
      const newW = { ...updated, id: `w-m-${Date.now()}` };
      setManualWorks(arr => [newW, ...arr]);
      toast.success('Karya manual ditambahkan — klik Simpan untuk menyimpan');
    }
    setEditWork(null);
  };

  const removeWork = (id) => {
    if (!window.confirm('Hapus karya manual ini?')) return;
    setManualWorks(arr => arr.filter(x => x.id !== id));
    toast.success('Karya manual dihapus — klik Simpan untuk menyimpan');
  };

  const filtered = works.filter(w =>
    filter === 'all' ? true : filter === 'kolaborator' ? w._live : !w._live
  );

  const visibleCount = works.filter(w => w.visible !== false).length;
  const kolabCount = karyaItems.length;
  const manualCount = manualWorks.length;

  return (
    <div className="space-y-5">
      {editWork !== null && <WorkModal work={editWork} onClose={() => setEditWork(null)} onSave={saveWork} />}

      <div className="bg-blue-50 border border-blue-100 rounded-[12px] px-4 py-3 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Karya dari <strong>Kolaborator &amp; Artisan</strong> otomatis muncul di sini sesuai upload mereka. Matikan toggle untuk <strong>menyembunyikan</strong> dari halaman publik (perubahan langsung tersimpan; karya asli tidak bisa dihapus). <strong>Tambah Manual</strong> untuk entri non-akun — entri manual perlu klik <strong>Simpan Karya Manual</strong>.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Karya', value: works.length, color: 'bg-[#f7f8f2] text-[#1e2010]' },
          { label: 'Dari Akun (Live)', value: kolabCount, color: 'bg-[#eef0e0] text-[#4f5c30]' },
          { label: 'Tambahan Manual', value: manualCount, color: 'bg-blue-50 text-blue-800' },
          { label: 'Ditampilkan', value: visibleCount, color: 'bg-amber-50 text-amber-800' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-[12px] p-3 border border-white`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2">
            {[['all', 'Semua'], ['kolaborator', 'Dari Akun'], ['manual', 'Manual Admin']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-4 py-2 rounded-[12px] text-sm font-semibold transition ${filter === val ? 'bg-[#7a8a52] text-white' : 'bg-[#eef0e0] text-[#5a6040] hover:bg-[#eef0e0]'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={openAdd} className="flex items-center gap-2 bg-[#7a8a52] hover:bg-[#4f5c30] text-white px-4 py-2 rounded-[12px] text-sm font-semibold transition">
              <Plus size={15} /> Tambah Manual
            </button>
            <SaveBtn onClick={save} saving={saving} label="Simpan Karya Manual" />
          </div>
        </div>
      </Card>

      {/* Works list */}
      <div className="space-y-2">
        {loading && (
          <div className="bg-white rounded-[16px] border border-gray-100 p-10 text-center text-[#8a9070]">
            <Loader2 size={24} className="mx-auto mb-2 animate-spin text-[#c8d09a]" />
            <p className="text-sm">Memuat karya…</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-[16px] border border-gray-100 p-10 text-center text-[#8a9070]">
            <Image size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Belum ada karya di kategori ini</p>
          </div>
        )}
        {!loading && filtered.map((w) => (
          <div key={w.id} className={`bg-white rounded-[12px] border border-gray-100 p-4 flex items-center gap-4 transition ${w.visible === false ? 'opacity-50' : ''}`}>
            <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-[#eef0e0] shrink-0">
              {w.gambar_url
                ? <img src={resolveCpAsset(w.gambar_url)} alt={w.judul} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300"><Image size={20} /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1e2010] text-sm truncate">{w.judul}</span>
                {w._live && w.owner_type === 'kolaborator' && (
                  <span className="shrink-0 text-[10px] font-bold bg-[#eef0e0] text-[#7a8a52] border border-[#c8d09a] px-1.5 py-0.5 rounded-full">Kolaborator</span>
                )}
                {w._live && w.owner_type === 'artisan' && (
                  <span className="shrink-0 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">Artisan</span>
                )}
                {!w._live && (
                  <span className="shrink-0 text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-full">Manual</span>
                )}
              </div>
              <div className="text-xs text-[#8a9070] mt-0.5">{w.owner} · {w.kategori_display || w.subsektor || w.kategori_usaha} · {w.tahun}</div>
              {w.deskripsi && <p className="text-xs text-[#8a9070] mt-1 line-clamp-1">{w.deskripsi}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ToggleSwitch value={w.visible !== false} onChange={() => toggleVisible(w)} />
              {!w._live && (
                <button onClick={() => setEditWork(w)} className="w-8 h-8 rounded-lg border border-[#e4e7d4] flex items-center justify-center text-[#8a9070] hover:text-[#7a8a52] hover:border-[#c8d09a] transition">
                  <Edit2 size={14} />
                </button>
              )}
              {!w._live && (
                <button onClick={() => removeWork(w.id)} className="w-8 h-8 rounded-lg border border-[#e4e7d4] flex items-center justify-center text-[#8a9070] hover:text-red-500 hover:border-red-200 transition">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: GALERI
// ─────────────────────────────────────────────

function GalleryImageModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({ ...item });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-[#1e2010]">Edit Foto Galeri</h3>
          <button onClick={onClose} className="text-[#8a9070] hover:text-[#5a6040]"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <ImageInput label="Gambar Galeri" value={form.src || `/assets/${form.filename}.jpg`}
            onChange={v => set('src', v)} shape="wide" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Label/Judul">
              <Input value={form.label} onChange={v => set('label', v)} placeholder="Edisi #01" />
            </Field>
            <Field label="Tahun">
              <Input value={form.year} onChange={v => set('year', v)} placeholder="2024" />
            </Field>
          </div>
          <ToggleSwitch value={form.visible} onChange={v => set('visible', v)} label="Tampilkan di galeri" />
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border border-[#e4e7d4] text-[#5a6040] py-2.5 rounded-[12px] text-sm font-medium hover:bg-[#f7f8f2] transition">Batal</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-[#7a8a52] hover:bg-[#4f5c30] text-white py-2.5 rounded-[12px] text-sm font-semibold transition">Simpan</button>
        </div>
      </div>
    </div>
  );
}

function TabGaleri() {
  const toast = useToast();
  const [data, setData] = useState(DEFAULT_GALLERY);
  const [editImg, setEditImg] = useState(null);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    companyProfileApi.get('gallery').then(d => d && setData(p => ({ ...p, ...d }))).catch(() => {});
  }, []);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  const save = async (section) => {
    setSaving(s => ({ ...s, [section]: true }));
    try {
      await companyProfileApi.save('gallery', data);
      toast.success('Galeri berhasil disimpan');
    } catch (err) {
      toast.error(extractError(err, 'Gagal menyimpan'));
    } finally {
      setSaving(s => ({ ...s, [section]: false }));
    }
  };

  const toggleImg = (id) => setData(p => ({ ...p, images: p.images.map(x => x.id === id ? { ...x, visible: !x.visible } : x) }));
  const removeImg = (id) => {
    if (!window.confirm('Hapus foto ini dari galeri?')) return;
    setData(p => ({ ...p, images: p.images.filter(x => x.id !== id) }));
  };
  const addImg = () => {
    const newImg = { id: `g${Date.now()}`, filename: '', src: '', label: 'Edisi Baru', year: String(new Date().getFullYear()), visible: true };
    setEditImg(newImg);
  };
  const saveImg = (updated) => {
    if (data.images.find(x => x.id === updated.id)) {
      setData(p => ({ ...p, images: p.images.map(x => x.id === updated.id ? updated : x) }));
    } else {
      setData(p => ({ ...p, images: [...p.images, updated] }));
    }
    setEditImg(null);
    toast.info('Klik "Simpan Galeri" untuk menyimpan perubahan');
  };

  const visibleCount = data.images.filter(x => x.visible).length;

  return (
    <div className="space-y-5">
      {editImg && <GalleryImageModal item={editImg} onClose={() => setEditImg(null)} onSave={saveImg} />}

      {/* Grid foto */}
      <SectionCard title={`Foto Galeri · ${visibleCount} dari ${data.images.length} ditampilkan`} subtitle="Foto-foto yang tampil di halaman Gallery" icon={Image} collapsible>
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.images.map((img) => {
              const src = img.src || `/assets/${img.filename}.jpg`;
              return (
                <div key={img.id} className={`group relative rounded-[12px] overflow-hidden border border-gray-100 ${!img.visible ? 'opacity-40' : ''}`}>
                  <div className="aspect-square bg-[#eef0e0]">
                    <img src={resolveCpAsset(src)} alt={img.label} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                  <div className="p-2">
                    <div className="text-[10px] font-semibold text-gray-700 truncate">{img.label}</div>
                    <div className="text-[10px] text-[#8a9070]">{img.year}</div>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button onClick={() => setEditImg(img)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[#5a6040] hover:text-[#7a8a52] shadow"><Edit2 size={13} /></button>
                    <button onClick={() => toggleImg(img.id)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[#5a6040] shadow">{img.visible ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                    <button onClick={() => removeImg(img.id)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[#5a6040] hover:text-red-500 shadow"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
            <button onClick={addImg} className="aspect-square rounded-[12px] border-2 border-dashed border-[#e4e7d4] hover:border-[#c8d09a] hover:text-[#7a8a52] text-[#8a9070] flex flex-col items-center justify-center gap-1 transition text-sm font-medium">
              <Plus size={20} />
              <span className="text-xs">Tambah</span>
            </button>
          </div>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => save('images')} saving={saving.images} label="Simpan Galeri" />
          </div>
        </div>
      </SectionCard>

      {/* Teks Dokumentasi */}
      <SectionCard title="Blok Dokumentasi" subtitle="Teks di bagian bawah galeri (latar aksen/sage)" icon={BookOpen} collapsible>
        <div className="space-y-4">
          <Field label="Headline Dokumentasi">
            <Input value={data.doc_headline} onChange={v => set('doc_headline', v)} />
          </Field>
          <Field label="Deskripsi Dokumentasi">
            <Textarea value={data.doc_body} onChange={v => set('doc_body', v)} rows={5} />
          </Field>
          <Field label="Ukuran File Download" hint="Contoh: ZIP · ±420 MB per edisi">
            <Input value={data.doc_ukuran} onChange={v => set('doc_ukuran', v)} />
          </Field>
          <Field label="URL Unduh Dokumentasi" hint="Link tombol 'Unduh Paket Dokumentasi' — kosongkan jika belum tersedia">
            <Input value={data.doc_download_url || ''} onChange={v => set('doc_download_url', v)} placeholder="https://..." />
          </Field>
          <div className="flex justify-end pt-2 border-t border-[#f2f4e8]">
            <SaveBtn onClick={() => save('doc')} saving={saving.doc} label="Simpan Teks Dokumentasi" />
          </div>
        </div>
      </SectionCard>

    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const TABS = [
  { id: 'beranda',  label: 'Beranda',       icon: Home,     desc: 'Hero, manifesto, agenda, lokasi' },
  { id: 'tentang',  label: 'Tentang',       icon: Info,     desc: 'Visi, misi, pilar, statistik' },
  { id: 'tim',      label: 'Tim & Mitra',   icon: Users,    desc: 'Key people, hexa-helix, legalitas' },
  { id: 'program',  label: 'Program',       icon: Grid,     desc: '6 program tetap per edisi' },
  { id: 'karya',    label: 'Publication',   icon: Star,     desc: 'Katalog kolaborator & artisan' },
  { id: 'galeri',   label: 'Galeri',        icon: Image,    desc: 'Foto & teks dokumentasi' },
];

export default function CompanyProfile() {
  const [activeTab, setActiveTab] = useState('beranda');
  const profileUrl = import.meta.env.VITE_COMPANY_URL || '/';

  return (
    <div className="min-h-full">

      {/* Page top bar */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[#1e2010]">Kelola Konten Company Profile</h2>
          <p className="text-sm text-[#8a9070] mt-0.5">Setiap perubahan disimpan per-seksi dan langsung tampil di situs Company Profile publik.</p>
        </div>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 border border-[#e4e7d4] text-[#5a6040] hover:text-[#7a8a52] hover:border-[#c8d09a] px-4 py-2 rounded-[12px] text-sm font-semibold transition">
            <ExternalLink size={15} /> Lihat Company Profile
          </a>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-[#eef0e0] p-1 rounded-[16px] mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-semibold transition whitespace-nowrap flex-shrink-0 ${
                active ? 'bg-white text-[#4f5c30] shadow-sm' : 'text-[#8a9070] hover:text-gray-700 hover:bg-white/50'
              }`}>
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab subtitle */}
      <div className="mb-5">
        {TABS.filter(t => t.id === activeTab).map(tab => (
          <div key={tab.id} className="flex items-center gap-2 text-sm text-[#8a9070]">
            <tab.icon size={15} className="text-[#7a8a52]" />
            <span>{tab.desc}</span>
          </div>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'beranda' && <TabBeranda />}
      {activeTab === 'tentang' && <TabTentang />}
      {activeTab === 'tim'     && <TabTim />}
      {activeTab === 'program' && <TabProgram />}
      {activeTab === 'karya'   && <TabKarya />}
      {activeTab === 'galeri'  && <TabGaleri />}

    </div>
  );
}
