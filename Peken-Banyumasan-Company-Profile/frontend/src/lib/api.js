const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json();
  if (!res.ok || json.status === 'error') {
    throw new Error(json.message || 'Terjadi kesalahan pada server');
  }
  return json.data;
}

export const api = {
  getSection:  (section) => get(`/api/public/company-profile?section=${section}`),
  getPrograms: ()        => get('/api/public/programs'),
  getKarya:    (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/api/public/karya${q ? '?' + q : ''}`);
  },
  getProfile:  (slug)    => get(`/api/public/profiles/${slug}`),
  getEvents:   (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/api/public/events${q ? '?' + q : ''}`);
  },
  getUpcomingEvents: (limit = 5) => get(`/api/public/events/upcoming?limit=${limit}`),
  getStats:    ()        => get('/api/public/stats'),
};
