// src/services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────────────────

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── HELPER ────────────────────────────────────────────────────────────────────

/**
 * Parse pesan error dari response body.
 * Menangani kasus responseType:'blob' (GET /reports/export) — saat error,
 * axios membungkus body sebagai Blob bukan JSON object biasa.
 */
const parseErrorData = async (error) => {
    try {
        const data = error.response?.data;
        if (!data) return null;
        if (data instanceof Blob) {
            const text = await data.text();
            return JSON.parse(text);
        }
        return data;
    } catch {
        return null;
    }
};

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────────

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            // Network error: server mati, CORS, timeout
            return Promise.reject(error);
        }

        const errorData = await parseErrorData(error);
        const message = errorData?.message || '';
        if (message) error.message = message;

        switch (error.response.status) {
            case 401:
                // Token tidak ada, kadaluarsa, atau tidak valid.
                // Delay 1500ms agar komponen sempat render pesan error
                // sebelum halaman berpindah ke /login.
                // Guard token: mencegah double-logout dari race condition
                // (misal fetchStats + fetchActivities gagal bersamaan).
                //
                // [FIX] Gunakan '/#/login' bukan '/login' agar kompatibel
                // dengan HashRouter. window.location.href = '/login' akan
                // mengarah ke path server yang tidak dikenal oleh Flask
                // (Flask hanya punya /api/*), sehingga tidak ada redirect
                // yang tepat. Dengan '/#/login', hash diproses di sisi
                // browser oleh HashRouter tanpa menyentuh server.
                setTimeout(() => {
                    if (localStorage.getItem('token')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/#/login';
                    }
                }, 1500);
                break;

            case 403:
                // User login tapi role tidak mencukupi (petugas → endpoint admin-only).
                // Tidak redirect dan tidak alert — biarkan komponen menampilkan error
                // via catch block mereka sendiri (toast.error sudah ada di setiap halaman).
                // Alert di sini akan menyebabkan notifikasi ganda (alert + toast).
                break;

            default:
                break;
        }

        return Promise.reject(error);
    }
);

export default api;
// ── EVENT RELASI ENDPOINTS (stub — siap diganti saat backend ready) ──────────

export const eventApi = {
  // Event CRUD
  list:   (params) => api.get('/api/events', { params }),
  detail: (id)     => api.get(`/api/events/${id}`),
  create: (data)   => api.post('/api/events', data),
  update: (id, d)  => api.put(`/api/events/${id}`, d),
  delete: (id)     => api.delete(`/api/events/${id}`),
  status: (id, s)  => api.patch(`/api/events/${id}/status`, { status: s }),

  // Event ↔ Member relasi
  members:       (id)      => api.get(`/api/events/${id}/members`),
  assignKolaborator:  (id, d)   => api.post(`/api/events/${id}/members`, d),
  removeKolaborator:  (id, mid) => api.delete(`/api/events/${id}/members/${mid}`),
  updateKolaborator:  (id, mid, d) => api.patch(`/api/events/${id}/members/${mid}`, d),

  // Event ↔ Tenant relasi
  tenants:       (id)      => api.get(`/api/events/${id}/tenants`),
  assignArtisan:  (id, d)   => api.post(`/api/events/${id}/tenants`, d),
  removeArtisan:  (id, tid) => api.delete(`/api/events/${id}/tenants/${tid}`),
  updateArtisan:  (id, tid, d) => api.patch(`/api/events/${id}/tenants/${tid}`, d),
};

export const kolaboratorApi = {
  list:       (params) => api.get('/api/kolaborator', { params }),
  detail:     (id)     => api.get(`/api/kolaborator/${id}`),
  status:     (id, s)  => api.patch(`/api/kolaborator/${id}/status`, { status: s }),
  events:     (id)     => api.get(`/api/kolaborator/${id}/events`),
  portfolio:  (id)     => api.get(`/api/kolaborator/${id}/portfolio`),
  stories:    (id)     => api.get(`/api/kolaborator/${id}/stories`),
};

export const artisanApi = {
  list:   (params) => api.get('/api/artisan', { params }),
  detail: (id)     => api.get(`/api/artisan/${id}`),
  update: (id, d)  => api.patch(`/api/artisan/${id}`, d),
  status: (id, s)  => api.patch(`/api/artisan/${id}/status`, { status: s }),
  events: (id)     => api.get(`/api/artisan/${id}/events`),
};

export const aktivitasApi = {
  list:   (params) => api.get('/api/aktivitas', { params }),
  delete: (id)     => api.delete(`/api/admin/stories/${id}`),
};
