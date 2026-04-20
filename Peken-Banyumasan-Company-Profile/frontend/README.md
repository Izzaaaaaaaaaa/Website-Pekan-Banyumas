# Peken Banyumasan — Design System v1.8 (React + Vite)

Konversi dari proyek CDN (Babel-in-browser) ke **React + Vite** dengan ES modules bersih. Tampilan dijaga identik dengan versi asli.

## Menjalankan

```bash
npm install
npm run dev        # dev server di http://localhost:5173
npm run build      # production build ke dist/
npm run preview    # preview hasil build
```

## Yang berubah dari versi asli

Semua perubahan adalah **struktur kode saja** — tidak ada yang berubah secara visual.

### 1. Build system
- Sebelum: `<script src="https://unpkg.com/react...">` + `@babel/standalone` (compile in-browser setiap kali page load)
- Sekarang: Vite dev server + production bundle (pre-compiled, tree-shaken)

### 2. Module system
- Sebelum: `window.PekenNav = PekenNav` untuk ekspos komponen ke global
- Sekarang: ES modules — `export default` / `import`

### 3. Font loading (penghematan ~7MB)
- Sebelum: 20 file Montserrat TTF self-hosted di `/fonts/` (~7.2MB)
- Sekarang: Montserrat via Google Fonts CDN (font file yang sama persis — Montserrat oleh Julieta Ulanovsky)
- Clash Display (Fontshare CDN) dan Playfair Display (Google Fonts) tetap — sudah CDN dari awal

### 4. Struktur file
```
src/
├── main.jsx                          # Vite entry
├── App.jsx                           # Router + layout
├── styles/
│   └── colors_and_type.css           # Design tokens (copy verbatim dari original)
├── hooks/
│   └── useReducedMotion.js           # prefers-reduced-motion hook
├── data/
│   ├── programs.js                   # PROGRAMS + HOME_PROGRAMS (single source of truth)
│   └── works.js                      # WORKS catalogue
├── components/
│   ├── shared/                       # Atom components (1 responsibility per file)
│   │   ├── PillButton.jsx
│   │   ├── Typography.jsx            # Eyebrow, LabelLg, Wordmark
│   │   ├── PixelFlicker.jsx
│   │   ├── SectionHeader.jsx
│   │   ├── PhotoTile.jsx
│   │   ├── Atoms.jsx                 # LocationMarker, FilterChip
│   │   ├── Modal.jsx
│   │   ├── Lightbox.jsx
│   │   └── WipeReveal.jsx
│   ├── layout/
│   │   ├── PekenNav.jsx
│   │   └── PekenFooter.jsx
│   ├── modals/
│   │   └── LoginModal.jsx
│   └── screens/
│       ├── HomeScreen.jsx
│       ├── AboutScreen.jsx
│       ├── ProgramScreen.jsx
│       ├── GalleryScreen.jsx
│       └── WorksScreen.jsx
└── ...
```

## Yang tidak berubah

Ini **jaminan**: tampilan harus identik dengan versi asli.

- Semua inline `style={{...}}` disalin verbatim
- `src/styles/colors_and_type.css` disalin apa adanya dari original (cuma baris `@import './fonts/fonts.css'` diganti comment karena font sekarang via `<link>` di `index.html`)
- Meta viewport `width=1440, initial-scale=1` dipertahankan (krusial — ini fixed-width design 1440px)
- Page background, focus ring, dan `em { font-style: italic; }` rules dari `<style>` asli dipertahankan di `index.html`
- Halaman yang disimpan di localStorage (`peken_page`) tetap dipulihkan saat reload

## Prinsip SOLID yang diterapkan

- **Single Responsibility** — satu file per komponen di `shared/`, `layout/`, `screens/`
- **Data-UI separation** — data `PROGRAMS`, `HOME_PROGRAMS`, `WORKS` dipindah ke `src/data/` (UI hanya me-render, tidak mendefinisikan data)
- **Dependency Inversion** — `App.jsx` pakai lookup map `SCREENS` (routing-as-data) alih-alih rantai `if/else if/else` asli
- **Open/Closed** — tambah screen baru cukup append entry ke `SCREENS` map, tidak perlu edit router logic

## Routing

SPA dengan state-based routing (bukan URL-based). Halaman aktif disimpan di `localStorage['peken_page']` sama seperti versi asli. Untuk production sebaiknya ganti ke react-router — tapi itu di luar scope konversi ini (bisa mengubah behavior).
