// Peken Banyumasan Design System tokens — JS mirror of :root CSS vars in src/index.css
// Canonical names match gate & artisan. Use this object in JSX style={} so inline
// styles stay in sync with the DS instead of drifting via hardcoded hex strings.

export const T = {
  // ── Brand ─────────────────────────────────────────────────
  sage:           '#C3CA96',
  sageLight:      '#dde3c0',
  sagePale:       '#f2f4e8',
  sageMid:        '#a8b07a',
  sageDark:       '#7a8a52',   // PRIMARY BUTTON canonical (matches gate & artisan)
  sageDeeper:     '#4f5c30',   // Dark chip / visual anchor / primary-on-light text

  // ── Ink ───────────────────────────────────────────────────
  charcoal:       '#1B1B1B',
  ink:            '#0D0D0D',
  white:          '#FFFFFF',

  // ── Surfaces ──────────────────────────────────────────────
  bg:             '#f2f4e8',
  surface:        '#FFFFFF',
  surfaceHover:   '#f7f8f2',
  border:         '#e4e7d4',
  borderStrong:   '#c8ccb0',

  // ── Accent ────────────────────────────────────────────────
  accent:         '#C3CA96',
  accentDark:     '#7a8a52',
  accentDeeper:   '#4f5c30',
  accentBg:       '#eef0e0',
  accentBgHover:  '#e4e7d4',
  accentBorder:   '#c8d09a',

  // ── Status (muted, sage-harmonised) ───────────────────────
  success:        '#7A9B6A',
  successBg:      '#eef4eb',
  successBorder:  '#b8d4b0',
  successHover:   '#638059',
  error:          '#B87272',
  errorBg:        '#f7eeee',
  errorBorder:    '#dbb8b8',
  errorHover:     '#a05f5f',
  warning:        '#C4A24D',
  warningBg:      '#f7f2e4',
  warningBorder:  '#dcc882',
  info:           '#6B8FA3',
  infoBg:         '#eaf0f4',
  infoBorder:     '#b0c8d8',
  exit:           '#7A80B0',
  exitBg:         '#eeeef8',
  exitBorder:     '#b8badc',

  // ── Text ──────────────────────────────────────────────────
  text1:          '#1e2010',
  text2:          '#5a6040',
  textMuted:      '#8a9070',
  textInverse:    '#FFFFFF',
  textSoft:       '#c8ccb0',   // placeholder-like muted on white

  // ── Sidebar (dark charcoal theme) ─────────────────────────
  sidebarFg:      '#d0d4b8',
  sidebarInactive:'#8a9278',
  sidebarSub:     '#5a6258',

  // ── Shadows (strings — paste into style.boxShadow) ────────
  shadowSm:       '0 1px 3px rgba(30,32,16,.06), 0 1px 2px rgba(30,32,16,.04)',
  shadowMd:       '0 4px 12px rgba(30,32,16,.08), 0 2px 4px rgba(30,32,16,.04)',
  shadowLg:       '0 8px 24px rgba(30,32,16,.10), 0 4px 8px rgba(30,32,16,.06)',
  shadowAccent:   '0 4px 14px rgba(122,138,82,.25)',
};
