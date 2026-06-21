import { useState } from 'react';
import PillButton from '../shared/PillButton.jsx';

const NAV_ITEMS = [
  'HOME',
  'ABOUT',
  'PROGRAM',
  'PUBLICATION',
  'GALLERY',
];

/**
 * Global Nav — 80px tall, ink canvas. Pixel logotype left, text links
 * centre with a 6px sage dot marking the selected link, LOGIN pill right.
 * Raib §4.1 (PUBLICATION tab) and §4.10 (LOGIN button).
 *
 * Mobile: the centre links + login pill are hidden (CSS, .pk-nav-center /
 * .pk-nav-login in index.html) and replaced by a hamburger that opens a
 * full-width dropdown panel.
 */
export default function PekenNav({ current, onNavigate, onLogin }) {
  const [open, setOpen] = useState(false);
  const go = (it) => (e) => {
    e.preventDefault();
    setOpen(false);
    onNavigate(it);
  };

  return (
    <nav
      className="pk-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 80,
        padding: '0 var(--page-px)',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: 24,
        background: 'var(--bg-page)',
        borderBottom: '1px solid rgba(255,255,255,.05)',
      }}
    >
      {/* Brand mark — clickable, returns home */}
      <a
        href="#"
        onClick={go('HOME')}
        aria-label="Peken Banyumasan — beranda"
        style={{ gridColumn: 1 }}
      >
        <img
          src="/assets/logotype-peken-nav.png"
          alt="Peken Banyumasan"
          style={{ width: 88, height: 50, display: 'block' }}
        />
      </a>

      {/* Center nav — desktop only (hidden < 860px) */}
      <ul
        className="pk-nav-center"
        style={{
          gridColumn: 2,
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
                onClick={go(it)}
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

      {/* Login pill — desktop only (hidden < 860px) */}
      <span className="pk-nav-login" style={{ gridColumn: 3, justifySelf: 'end' }}>
        <PillButton onClick={onLogin} ariaLabel="Buka pilihan login">
          Login
        </PillButton>
      </span>

      {/* Hamburger — mobile only (shown < 860px) */}
      <button
        className="pk-nav-burger"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={open}
        style={{
          gridColumn: 3,
          justifySelf: 'end',
          flexDirection: 'column',
          gap: 5,
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          padding: 8,
        }}
      >
        <span style={{ display: 'block', width: 22, height: 2, background: '#fff' }} />
        <span style={{ display: 'block', width: 22, height: 2, background: '#fff' }} />
        <span style={{ display: 'block', width: 22, height: 2, background: '#fff' }} />
      </button>

      {/* Mobile dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: 0,
            right: 0,
            zIndex: 49,
            background: 'var(--bg-page)',
            borderBottom: '1px solid rgba(255,255,255,.08)',
            display: 'flex',
            flexDirection: 'column',
            padding: '8px var(--page-px) 20px',
          }}
        >
          {NAV_ITEMS.map((it) => (
            <a
              key={it}
              href="#"
              onClick={go(it)}
              aria-current={it === current ? 'page' : undefined}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                letterSpacing: '.04em',
                color: it === current ? 'var(--accent)' : '#fff',
                textDecoration: 'none',
                padding: '14px 0',
                borderBottom: '1px solid rgba(255,255,255,.06)',
              }}
            >
              {it}
            </a>
          ))}
          <div style={{ marginTop: 16 }}>
            <PillButton
              onClick={() => {
                setOpen(false);
                onLogin();
              }}
              ariaLabel="Buka pilihan login"
            >
              Login
            </PillButton>
          </div>
        </div>
      )}
    </nav>
  );
}
