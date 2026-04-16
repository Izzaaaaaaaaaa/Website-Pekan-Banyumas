import React from "react";
// lib/notifications.js — Event-driven notification queue
// Works in dummy/offline mode via localStorage
// Replace addNotif() with API POST when backend ready
// Auto-triggers when actions happen (approve, assign, register, etc.)

export const NotifType = {
  // Kolaborator receives
  KOLABORATOR_APPROVED:      'kolaborator_approved',      // admin setujui akun baru
  EVENT_ASSIGNED:       'event_assigned',       // admin assign ke event
  EVENT_STATUS_CHANGE:  'event_status_change',  // event berlangsung/selesai
  AKTIVITAS_DELETED:        'aktivitas_deleted',         // admin hapus aktivitas
  // Artisan receives
  ARTISAN_APPROVED:        'artisan_approved',         // admin setujui pendaftaran
  ARTISAN_EVENT_APPROVED:  'artisan_event_approved',   // admin setujui request event
  ARTISAN_EVENT_ASSIGNED:  'artisan_event_assigned',   // admin assign langsung
  // Admin receives
  NEW_KOLABORATOR_REQUEST:   'new_kolaborator_request',    // kolaborator baru daftar
  NEW_ARTISAN_REQUEST:     'new_artisan_request',      // artisan baru daftar
  EVENT_REGISTER:       'event_register',         // kolaborator daftar mandiri ke event
  ARTISAN_EVENT_REQUEST:   'artisan_event_request',    // artisan request ikut event
};

const ICONS = {
  kolaborator_approved:      '✅',
  event_assigned:       '📅',
  event_status_change:  '🔔',
  aktivitas_deleted:        '🗑️',
  artisan_approved:        '✅',
  artisan_event_approved:  '📅',
  artisan_event_assigned:  '📍',
  new_kolaborator_request:   '👤',
  new_artisan_request:     '🏪',
  event_register:       '📋',
  artisan_event_request:   '🏬',
};

const key = (role) => `peken_notif_${role}`;
const DISPATCH_EVENT = 'peken_notif_update';

/** Get notifications for a role (kolaborator | artisan | admin) */
export function getNotifs(role) {
  try { return JSON.parse(localStorage.getItem(key(role)) || '[]'); } catch { return []; }
}

/** Add a notification for a role */
export function addNotif(role, { type, title, message, link = null }) {
  const existing = getNotifs(role);
  const notif = {
    id:         'n' + Date.now() + Math.random().toString(36).slice(2, 5),
    type,
    icon:       ICONS[type] || '🔔',
    title,
    message,
    link,
    read:       false,
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(key(role), JSON.stringify([notif, ...existing].slice(0, 50)));
  window.dispatchEvent(new CustomEvent(DISPATCH_EVENT, { detail: { role } }));
  return notif;
}

/** Mark one notification as read */
export function markRead(role, id) {
  const updated = getNotifs(role).map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(key(role), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(DISPATCH_EVENT, { detail: { role } }));
}

/** Mark all notifications as read */
export function markAllRead(role) {
  const updated = getNotifs(role).map(n => ({ ...n, read: true }));
  localStorage.setItem(key(role), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(DISPATCH_EVENT, { detail: { role } }));
}

/** Get unread count */
export function unreadCount(role) {
  return getNotifs(role).filter(n => !n.read).length;
}

/** React hook — subscribes to realtime notification updates */
export function useNotifCount(role) {
  // Note: This hook must be used in a React component context
  // Import useState and useEffect at the top of this file is not possible
  // since this is a utility module. Consumers should use the raw functions instead.
  const [count, setCount] = React.useState(() => unreadCount(role));

  React.useEffect(() => {
    const handler = (e) => {
      if (!e.detail?.role || e.detail.role === role) {
        setCount(unreadCount(role));
      }
    };
    setCount(unreadCount(role));
    window.addEventListener(DISPATCH_EVENT, handler);
    return () => window.removeEventListener(DISPATCH_EVENT, handler);
  }, [role]);

  return count;
}

// ── Pre-built trigger helpers ─────────────────────────────────────────────────

export const triggerKolaboratorApproved = (nama) =>
  addNotif('kolaborator', {
    type: NotifType.KOLABORATOR_APPROVED,
    title: 'Akun Diverifikasi ✅',
    message: `Selamat ${nama}! Akun kolaborator kamu telah diverifikasi admin. Profil kamu kini tampil di direktori publik.`,
    link: '/dashboard/profil',
  });

export const triggerEventAssignedToKolaborator = (eventNama, peran) =>
  addNotif('kolaborator', {
    type: NotifType.EVENT_ASSIGNED,
    title: 'Kamu Ditugaskan ke Event 📅',
    message: `Admin menugaskan kamu sebagai ${peran} di "${eventNama}".`,
    link: '/dashboard/event',
  });

export const triggerArtisanApproved = (namaUsaha) =>
  addNotif('artisan', {
    type: NotifType.ARTISAN_APPROVED,
    title: 'Usaha Disetujui ✅',
    message: `"${namaUsaha}" berhasil didaftarkan. Kamu bisa mulai menggunakan dashboard artisan.`,
    link: '/dashboard',
  });

export const triggerArtisanEventApproved = (namaUsaha, eventNama, posisi) =>
  addNotif('artisan', {
    type: NotifType.ARTISAN_EVENT_APPROVED,
    title: 'Permintaan Event Disetujui 📅',
    message: `"${namaUsaha}" disetujui untuk "${eventNama}" di posisi ${posisi}.`,
    link: '/dashboard/event',
  });

export const triggerArtisanEventAssigned = (eventNama, posisi) =>
  addNotif('artisan', {
    type: NotifType.ARTISAN_EVENT_ASSIGNED,
    title: 'Usahamu Dijadwalkan ke Event 📍',
    message: `Admin menambahkan usahamu ke "${eventNama}" di posisi ${posisi}.`,
    link: '/dashboard/event',
  });

export const triggerNewKolaboratorRequest = (nama) =>
  addNotif('admin', {
    type: NotifType.NEW_KOLABORATOR_REQUEST,
    title: 'Pendaftaran Kolaborator Baru 👤',
    message: `${nama} mendaftar sebagai kolaborator. Perlu verifikasi.`,
    link: '/kolaborator',
  });

export const triggerNewArtisanRequest = (namaUsaha) =>
  addNotif('admin', {
    type: NotifType.NEW_ARTISAN_REQUEST,
    title: 'Pendaftaran Artisan Baru 🏪',
    message: `"${namaUsaha}" mendaftar sebagai artisan. Perlu verifikasi.`,
    link: '/artisan',
  });

export const triggerArtisanEventRequest = (namaUsaha, eventNama, posisi) =>
  addNotif('admin', {
    type: NotifType.ARTISAN_EVENT_REQUEST,
    title: 'Permintaan Ikut Event 🏬',
    message: `"${namaUsaha}" ingin bergabung ke "${eventNama}" di posisi ${posisi}. Menunggu persetujuan.`,
    link: '/events',
  });

export const triggerKolaboratorEventRegister = (nama, eventNama) =>
  addNotif('admin', {
    type: NotifType.EVENT_REGISTER,
    title: 'Kolaborator Daftar Event 📋',
    message: `${nama} mendaftar mandiri ke "${eventNama}".`,
    link: '/events',
  });
