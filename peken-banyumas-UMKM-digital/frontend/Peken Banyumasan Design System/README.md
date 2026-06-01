# Peken Banyumasan — Design System

**Version:** 2.0 (Dashboard adaptation)
**Maintained by:** Design System project (this repo)

## What is Peken Banyumasan?

Peken Banyumasan is a cultural event organiser based in the Banyumas/Cilacap region of Central Java, Indonesia. The name combines *peken* (Javanese for *pasar*/market) and *Banyumasan* (the dialect/culture of the region). The organisation runs periodic open-air cultural festivals, craft markets, music performances, batik & tenun workshops, and artisan showcases in heritage venues such as Kota Lama Purwokerto and Alun-Alun.

## Products / Sub-systems

| Product | Description | Codebase path |
|---|---|---|
| **Company Profile** (public website) | Dark-mode editorial site. Showcases vision, programs, gallery, collaborator roster. Fixed-width 1440px design. | `Peken-Banyumasan-Company-Profile/` |
| **Gate Masuk-Keluar** (admin dashboard) | Light-mode admin + petugas dashboard. Real-time NFC tap + manual visitor entry/exit tracking. Event management, artisan revenue sharing, reports. | `Peken-Banyumasan-Gate-Masuk-Keluar/` |
| **Kolaborator** | Collaborator portal / registration system. | `Peken-Banyumasan-Kolaborator/` |
| **UMKM Digital** | Small business / merchant digital platform. | `peken-banyumas-UMKM-digital/` |
| **Design System Source** | Original company profile design tokens, fonts, assets. | `design-system-for-company-profile/` |

## Sources given

- **Codebase (monorepo):** `peken-banyumasan-phase8-with-dummy (1)/` — local filesystem mount (read-only). Contains all 4 sub-projects + design system folder.
- No Figma link provided. All tokens extracted from `design-system-for-company-profile/colors_and_type.css` and component source code.

---

## CONTENT FUNDAMENTALS

### Language
Indonesian (Bahasa Indonesia) with occasional Javanese words embedded naturally:
- *Peken* = pasar/market (Javanese)
- *Banyumasan* = of/from Banyumas culture
- *Masuk/Keluar* = enter/exit
- *Artisan, Kolaborator, Petugas, Panitia* — formal Indonesian register

### Tone & Voice
- **Quiet confidence.** The brand never shouts. Copy is terse and functional.
- **Institutional warmth.** There is a community-focused warmth — this is a local cultural initiative, not a corporate brand.
- **No emoji.** None used anywhere in the design system or codebase.
- **Casing:** Proper title case for section headers (VISI, TUJUAN, SASARAN are ALL-CAPS in company profile as display labels). Dashboard uses sentence case for most UI labels.
- **First/second person:** The company profile speaks in first person plural ("kami", "kita"). The dashboard uses imperative/functional language ("Masuk ke Dashboard", "Kelola Event").

### Copy examples
- *"Kelola pengunjung event dengan lebih cerdas."*
- *"Pantau data real-time, kelola pengunjung dan optimalkan operasional event Peken Banyumasan dalam satu platform terintegrasi."*
- *"Akses dibatasi hanya untuk Panitia dan Petugas Event."*
- *"Tidak ada event aktif"* (warning state — direct, no fuss)

---

## VISUAL FOUNDATIONS

### Color Philosophy
The brand has a **single chromatic accent: sage (#C3CA96)**, a muted yellow-green. Everything else is near-black, grey, or white.

**Company profile** is dark-mode first: near-black backgrounds (#1B1B1B, #0D0D0D), white text, sage as the only warm accent — used sparingly (CTA buttons, section bands, pixel art motif).

**Dashboard** adapts this to light-mode for operational use:
- Background is a very pale sage tint (`#f2f4e8`)
- Sidebar stays dark charcoal (#1B1B1B) — preserving brand identity
- Interactive sage is darkened to `#7A8A52` (readable on white)
- Status colors (success/error/warning/info) are all muted/desaturated to harmonise with sage

### Typography
- **Clash Display** (Fontshare CDN) — display / section header / labels. Weights 400–700.
- **Montserrat** (self-hosted variable TTF, also Google Fonts CDN) — body, UI labels, all dashboard text. Weights 300–700.
- **Playfair Display Italic** (Google Fonts) — accent italic. Substitute for licensed "Bespoke Serif" / Schick Toikka. Used rarely (captions, pull quotes).
- Scale is deliberately small: 12–32px. The company profile hero is a PNG logotype, not large text. Dashboard headings go up to 24px.

**Font assignment rules — dashboard & portal products (Gate, Kolaborator, UMKM):**

| Element | Font | Max weight | Notes |
|---|---|---|---|
| `h1`–`h6` CSS global | Montserrat | — | Set `font-family: 'Montserrat'` on all heading elements in `@layer base` |
| Page-level H1 identity label | Clash Display | 500 (`font-medium`) | e.g. "Event Budaya", "Portofolio" — display identity only, never `font-bold` |
| Card / section headings (h2, h3) | Montserrat | 600 (`font-semibold`) | All in-content headings use Montserrat |
| Stat / KPI numbers | Montserrat | 700 (`font-bold`) | e.g. visitor count, revenue — Montserrat, not Clash Display |
| Sidebar logo text ("Peken") | Clash Display | 600 | Brand mark only |
| Avatar / initial letter | Clash Display | 700 | Single character, decorative |
| Login / auth panel heading | Clash Display | 500 | Dark-panel context mirrors company profile |
| Public display / monitor screen | Clash Display | any | Fullscreen public-facing display is a "display" context |

> **Why:** Clash Display at weight 600–700 reads as extremely heavy in light-mode dashboard UI. Montserrat at the same weights looks balanced and professional. Gate (the reference codebase) already follows this pattern — kolaborator was misconfigured and has since been corrected.

### Spacing
4–120px rhythm, not a strict 8pt grid. Key values: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 120.

### Corners
- **Company profile:** zero border-radius everywhere. Flat, modernist.
- **Dashboard:** 12–20px radius on cards and inputs. Soft, approachable.

### Shadows
- Company profile: no shadows.
- Dashboard: subtle `box-shadow` with sage-undertone ink: `0 1px 3px rgba(30,32,16,.06)`.

### Backgrounds & Textures
- Company profile: dark solid fills + occasional sage band. Hero uses a pixel-art skyline motif (SVG + PNG, sage squares on dark). No gradients except the `--gradient-sage-up` overlay on images.
- Dashboard: white cards on pale sage bg. No textures.

### Animation / Motion
- Opacity fade + subtle translateY(4px → 0) at 180–320ms, `cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out).
- No springs, no bounces.
- Pixel flicker (per-square opacity blink, 14s cycle) in company profile hero band.
- Dashboard: value-flash (bg-green highlight, 0.75s) when stats update.
- `prefers-reduced-motion` respected.

### Hover / Press States
- Company profile: subtle white opacity increase (`rgba(255,255,255,0.02)` bg on card hover). No colour changes.
- Dashboard: `bg-gray-50` row hover. Buttons darken by ~1 shade. No scale transforms except scanner manual buttons (`group-hover:scale-110` on icon).

### Icons
- **Lucide React** used throughout the Gate dashboard.
- No icon font or sprite sheet — all inline `<Icon size={N} />` JSX.
- No emoji icons. No Unicode character icons.
- Logo used as PNG (square mark) at 10–40px sizes.

### Cards (Dashboard)
- White background, 1px solid `#e4e7d4` border, `border-radius: 16px`, subtle shadow.
- No coloured left-border accent. No gradients inside cards.

### Imagery
- Photography is warm-toned, candid event/culture shots.
- Company profile applies `grayscale(1) contrast(1.05)` by default; removes on hover (color reveal).
- No stock imagery in dashboard.

---

## ICONOGRAPHY

The Gate dashboard uses **Lucide React** icons exclusively (stroke-style, 1.5px weight). Key icons in use:
- `PieChart`, `Users`, `Store`, `FileText`, `LogOut`, `Calendar`, `Monitor`, `Settings`, `Globe` — sidebar nav
- `LogIn`, `LogOut`, `ScanLine`, `CreditCard`, `User` — dashboard actions
- `Wifi`, `WifiOff`, `RefreshCw`, `AlertCircle` — status indicators
- `Mail`, `Lock`, `Eye`, `EyeOff`, `ArrowRight`, `ShieldAlert` — login form

**Size conventions:**
- 14–16px: inline with body text, table badges
- 18px: nav icons, form icons
- 24px: header hamburger
- 28px: manual entry large buttons

**Substitution note:** Lucide was chosen (not the original design system). The company profile design system uses the logo-mark as an inline icon (PNG at 16–30px). Dashboard uses Lucide stroke icons — different visual register. These are consistent within each product.

---

## FILES

| File | Description |
|---|---|
| `README.md` | This file |
| `colors_and_type.css` | Unified CSS token file — brand primitives, CP tokens, dashboard tokens, type scale, spacing, motion |
| `fonts/` | Self-hosted Montserrat variable font TTFs (upright + italic) |
| `assets/` | Logos, pixel-art mark, pattern, gate logo |
| `preview/` | Design system card HTML files for visual review |
| `ui_kits/gate/` | Gate dashboard UI kit — login + dashboard screens |
| `SKILL.md` | Agent skill definition |

### Assets inventory
- `assets/logo-peken-banyumasan.png` — square logo mark (dark bg)
- `assets/logo-peken-banyumasan-white.png` — white version
- `assets/logotype-peken-banyumasan-white.png` — full logotype (white)
- `assets/logotype-peken-nav.png` — logotype for nav bar
- `assets/logo-gate.png` — gate dashboard logo (square, rounded)
- `assets/pixel-mark.svg` — pixel-art brand mark SVG
- `assets/pixel-skyline.svg` — pixel skyline band SVG
- `assets/pattern-pixel.png` — repeating pixel pattern

---

*Font substitution note: Clash Display is served from Fontshare CDN. Bespoke Serif (Schick Toikka) is substituted by Playfair Display Italic (Google Fonts). If the original licence is available, replace the `@import` in `colors_and_type.css`.*
