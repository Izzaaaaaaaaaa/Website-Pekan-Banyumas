import { useState } from 'react';

/**
 * PillButton — the only button style on the site.
 * Inline styles kept 1:1 with the original Shared.jsx.
 */
export default function PillButton({
  children,
  style,
  onClick,
  inverse,
  type = 'button',
  ariaLabel,
}) {
  const [hover, setHover] = useState(false);
  const bg = inverse ? 'var(--accent-ink)' : 'var(--accent)';
  const fg = inverse ? 'var(--accent)' : 'var(--accent-ink)';
  const dongBg = inverse ? 'var(--accent)' : 'var(--accent-ink)';
  const dongDot = inverse ? 'var(--accent-ink)' : 'var(--accent)';

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        height: 29,
        padding: '0 0 0 16px',
        background: bg,
        color: fg,
        border: 0,
        cursor: 'pointer',
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        outlineOffset: 2,
        ...(style || {}),
      }}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        style={{
          width: 29,
          height: 29,
          background: dongBg,
          display: 'grid',
          placeItems: 'center',
          transform: hover ? 'translateX(-6px)' : 'translateX(0)',
          transition: 'transform 320ms cubic-bezier(.22,.61,.36,1)',
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            background: dongDot,
            display: 'block',
          }}
        />
      </span>
    </button>
  );
}
