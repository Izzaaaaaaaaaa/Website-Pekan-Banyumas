/**
 * LocationMarker — v1.3
 * REDESIGN: the v1.2 8-square pixel pin was brand-consistent but
 * unfamiliar ("orang kadang bingung" — user's feedback). Switched to
 * a standard map-pin teardrop with an ink circle centre — still sage
 * for brand alignment, but instantly readable as "location here."
 */
export function LocationMarker({
  label = 'TAMAN SARI · BANYUMAS',
  targetId = 'lokasi',
}) {
  const onClick = (e) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        color: '#fff',
      }}
    >
      <svg width="24" height="32" viewBox="0 0 24 32" aria-hidden="true">
        <path
          d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"
          fill="var(--accent)"
        />
        <circle cx="12" cy="12" r="4" fill="var(--bg-deep)" />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          background: 'var(--bg-deep)',
          padding: '4px 8px',
        }}
      >
        {label}
      </span>
    </a>
  );
}

/**
 * FilterChip — text chip, sage underline when active.
 */
export function FilterChip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 0,
        padding: '6px 0',
        cursor: 'pointer',
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: '.02em',
        textTransform: 'uppercase',
        color: active ? 'var(--accent)' : '#fff',
        borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        transition:
          'color 320ms cubic-bezier(.22,.61,.36,1), border-color 320ms cubic-bezier(.22,.61,.36,1)',
      }}
    >
      {children}
    </button>
  );
}
