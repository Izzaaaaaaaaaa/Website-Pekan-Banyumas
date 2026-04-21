import { useEffect, useRef, useState } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion.js';

/* ------------------------------------------------------------------
   WipeReveal — v1.5 (no-duplicate rewrite)

   User feedback on v1.4:
   - About felt "double": hero scrolled past, then a SECOND hero
     bg appeared and stuck. Root cause was the two-piece API
     (`before` + `pinnedSnapshot`) — those rendered as separate DOM
     subtrees, so the user literally saw two heros.
   - Gallery had a "black empty column" between the masonry and the
     transition — the pin zone's `fromColor` painted before the
     gradient began rising.

   v1.5 design: ONE rendering of `before`. No snapshot. Two modes:

   1. mode="sticky" (default — for content ≤ 1 viewport like a Hero)
      Outer container, height = pinHeight, contains a sticky inner
      (top:0, height:100vh) where `before` is rendered ONCE and stays
      in view while outer scrolls. Gradient overlay rises over it.
      `after` renders normally below.

   2. mode="tail" (for tall content like Gallery masonry, > 1 viewport)
      `before` renders in normal flow, full height. Then a tail
      container pins `pinnedTail` (a "last-frame" snapshot) while the
      gradient rises over it. `after` follows.

   Reduced-motion: static 60vh gradient bridge, no sticky.

   API:
     before        — JSX of the section
     after         — JSX of the next section
     mode          — "sticky" (default, content ≤100vh) or "tail" (tall)
     pinHeight     — total scroll-room for the pin (e.g. "180vh")
     fromColor     — background colour during the pin (matches `before`)
     toColor       — background of `after`; also the gradient's solid end
     pinnedTail    — required when mode="tail": JSX showing the
                     "last frame" feel (e.g. fade of last masonry rows)
   ------------------------------------------------------------------ */
export default function WipeReveal({
  before,
  after,
  mode = 'sticky',
  pinHeight = '200vh',
  fromColor = 'var(--bg-page)',
  toColor = 'var(--accent)',
  pinnedTail,
}) {
  const reduced = useReducedMotion();
  const zoneRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === 'undefined' || !zoneRef.current) return;

    let raf = 0;
    let inView = false;

    const update = () => {
      const node = zoneRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      // Pin zone's effective scroll range = (pinHeight in px) - 100vh,
      // because the sticky takes 100vh and "pinning" happens for the
      // remaining scroll-room.
      const maxScroll = node.offsetHeight - vh;
      if (maxScroll <= 0) {
        setProgress(1);
        return;
      }
      // rect.top: +vh (zone below fold) → -maxScroll (zone fully scrolled).
      // We want progress 0 at rect.top === 0 (sticky just engaged) and
      // progress 1 at rect.top === -maxScroll (sticky about to release).
      const p = Math.max(0, Math.min(1, -rect.top / maxScroll));
      setProgress(p);
    };

    const onScroll = () => {
      if (!inView) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    // Only attach scroll work when zone is near/in viewport. Perf win.
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0].isIntersecting;
        if (inView) onScroll();
      },
      { rootMargin: '100% 0px' }
    );
    io.observe(zoneRef.current);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Reduced-motion fallback: static gradient bridge, no sticky logic.
  if (reduced) {
    return (
      <>
        {before}
        <div
          aria-hidden="true"
          style={{
            height: '60vh',
            background: `linear-gradient(to bottom, ${fromColor} 0%, ${toColor} 100%)`,
          }}
        />
        <div style={{ background: toColor }}>{after}</div>
      </>
    );
  }

  // The gradient overlay used in both modes. Anchored to the sticky's
  // bottom; translateY is driven by scroll progress.
  const Overlay = (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        background: `linear-gradient(to top, ${toColor} 0%, ${toColor} 65%, transparent 100%)`,
        transform: `translateY(${(1 - progress) * 100}%)`,
        willChange: 'transform',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );

  if (mode === 'tail') {
    return (
      <>
        {before}
        <div
          ref={zoneRef}
          style={{
            position: 'relative',
            height: pinHeight,
            background: fromColor,
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              height: '100vh',
              overflow: 'hidden',
              background: fromColor,
            }}
          >
            {pinnedTail || (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: fromColor,
                }}
              />
            )}
            {Overlay}
          </div>
        </div>
        <div style={{ background: toColor }}>{after}</div>
      </>
    );
  }

  // mode === "sticky" (default): `before` itself is sticky inside the
  // tall outer. Single rendering of `before`, no duplication.
  return (
    <>
      <div
        ref={zoneRef}
        style={{
          position: 'relative',
          height: pinHeight,
          background: fromColor,
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            background: fromColor,
          }}
        >
          {/* `before` rendered ONCE, here. It sits in the sticky frame
              and stays in view as the outer container scrolls past it.
              The user reads it, then watches the gradient rise over it. */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
            {before}
          </div>
          {Overlay}
        </div>
      </div>
      <div style={{ background: toColor }}>{after}</div>
    </>
  );
}
