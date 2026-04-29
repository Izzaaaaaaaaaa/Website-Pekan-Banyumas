/**
 * Typography atoms — small semantic text components used everywhere.
 * Kept in one file because each is a few lines and they share intent
 * (body-size label text). Inline styles identical to original Shared.jsx.
 */

export function Eyebrow({ children, style }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 400,
        letterSpacing: '.02em',
        color: 'var(--fg-secondary)',
        textTransform: 'uppercase',
        ...(style || {}),
      }}
    >
      {children}
    </div>
  );
}

export function LabelLg({ children, style, accent }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: 16,
        lineHeight: 1,
        color: accent ? 'var(--accent)' : '#fff',
        ...(style || {}),
      }}
    >
      {children}
    </div>
  );
}

export function Wordmark({ size = 16, color = '#fff', gap = 10 }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: size,
        color,
        lineHeight: 1,
      }}
    >
      <span>PEKEN</span>
      <img
        src="/assets/logo-peken-banyumasan.png"
        alt=""
        style={{ width: size, height: size }}
      />
      <span>BANYUMASAN</span>
    </span>
  );
}
