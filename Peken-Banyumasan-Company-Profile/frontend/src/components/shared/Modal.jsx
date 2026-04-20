import { useEffect, useRef } from 'react';

/**
 * Modal — centered dialog with focus trap, ESC, backdrop dismiss.
 * Inline styles and behavior identical to original Shared.jsx.
 */
export default function Modal({
  open,
  onClose,
  labelledBy,
  children,
  width = 720,
  padded = true,
}) {
  const ref = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = ref.current;
      if (!root) return;
      const focusable = root.querySelectorAll(
        'a[href], button, [tabindex]:not([tabindex="-1"]), input, select, textarea'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    setTimeout(() => {
      const first =
        ref.current &&
        ref.current.querySelector(
          'a[href], button, input, [tabindex]:not([tabindex="-1"])'
        );
      if (first) first.focus();
    }, 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (lastFocus.current && lastFocus.current.focus)
        lastFocus.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="peken-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--accent)',
          width: `min(${width}px, calc(100vw - 48px))`,
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          padding: padded ? 48 : 0,
          color: '#fff',
        }}
      >
        {children}
      </div>
    </div>
  );
}
