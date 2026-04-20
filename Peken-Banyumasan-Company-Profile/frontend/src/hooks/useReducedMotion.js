import { useState, useEffect } from 'react';

/**
 * Tracks the user's prefers-reduced-motion media query.
 * Returns `true` when the user has requested reduced motion.
 */
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener
      ? mq.addEventListener('change', handler)
      : mq.addListener(handler);
    return () =>
      mq.removeEventListener
        ? mq.removeEventListener('change', handler)
        : mq.removeListener(handler);
  }, []);

  return reduced;
}
