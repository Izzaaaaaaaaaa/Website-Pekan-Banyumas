import PillButton from '../shared/PillButton.jsx';

const NAV_ITEMS = [
  'HOME',
  'ABOUT',
  'PROGRAM',
  'KARYA',
  'PUBLICATION',
  'GALLERY',
];

/**
 * Global Nav — 80px tall, ink canvas. Pixel logotype left, 6 text links
 * centre with a 6px sage dot marking the selected link, LOGIN pill right.
 * Raib §4.1 (KARYA tab) and §4.10 (LOGIN button) both land here.
 */
export default function PekenNav({ current, onNavigate, onLogin }) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 80,
        padding: '0 120px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: 60,
        background: 'var(--bg-page)',
        borderBottom: '1px solid rgba(255,255,255,.05)',
      }}
    >
      {/* Brand mark — clickable, returns home */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('HOME');
        }}
        aria-label="Peken Banyumasan — beranda"
      >
        <img
          src="/assets/logotype-peken-nav.png"
          alt="Peken Banyumasan"
          style={{ width: 88, height: 50, display: 'block' }}
        />
      </a>

      {/* Center nav */}
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 56,
        }}
      >
        {NAV_ITEMS.map((it) => {
          const selected = it === current;
          return (
            <li key={it} style={{ position: 'relative' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(it);
                }}
                aria-current={selected ? 'page' : undefined}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 400,
                  letterSpacing: '.04em',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                {it}
              </a>
              {selected && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -12,
                    transform: 'translateX(-50%)',
                    width: 6,
                    height: 6,
                    background: 'var(--accent)',
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* Login pill — opens role-select modal */}
      <PillButton onClick={onLogin} ariaLabel="Buka pilihan login">
        Login
      </PillButton>
    </nav>
  );
}
