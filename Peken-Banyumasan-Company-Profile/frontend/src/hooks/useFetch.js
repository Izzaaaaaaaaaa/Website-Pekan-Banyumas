import { useState, useEffect } from 'react';

/**
 * Generic data-fetching hook.
 * @param {Function} fetcher  — async function that returns data
 * @param {Array}    deps     — dependency array (re-fetches when changed)
 * @param {*}        initial  — initial value before data arrives
 */
export default function useFetch(fetcher, deps = [], initial = null) {
  const [data, setData]       = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
