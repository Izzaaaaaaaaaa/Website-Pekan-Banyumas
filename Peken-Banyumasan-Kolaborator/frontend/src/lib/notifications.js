import React from "react";
// lib/notifications.js — Event-driven notification queue
// Works in dummy/offline mode via localStorage
// Replace addNotif() with API POST when backend ready
// Auto-triggers when actions happen (approve, assign, register, etc.)

export const NotifType = {
  // Member receives
  KOLABORATOR_APPROVED:      'kolaborator_approved',      // admin setujui akun baru
  EVENT_ASSIGNED:       'event_assigned',       // admin assign ke event
  EVENT_STATUS_CHANGE:  'event_status_change',  // event berlangsung/selesai
  AKTIVITAS_DELETED:        'aktivitas_deleted',         // admin hapus aktivitas
  // Artisan receives
  Artisan_APPROVED:        'artisan_approved',         // admin setujui pendaftaran
  Artisan_EVENT_APPROVED:  'artisan_event_approved',   // admin setujui request event
  Artisan_EVENT_ASSIGNED:  'artisan_event_assigned',   // admin assign langsung
  // Admin receives
  NEW_KOLABORATOR_REQUEST:   'new_kolaborator_request',    // kolaborator baru daftar
  NEW_Artisan_REQUEST:     'new_artisan_request',      // artisan baru daftar
  EVENT_REGISTER:       'event_register',         // kolaborator daftar mandiri ke event
  Artisan_EVENT_REQUEST:   'artisan_event_request',    // artisan request ikut event
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

/** Get notifications for a role (member | artisan | admin) */
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
  // using React.useState/useEffect
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

export const triggerKolaboratorApproved = (memberNama) =>
  addNotif('kolaborator', {
    type: NotifType.KOLABORATOR_APPROVED,
    title: 'Akun Diverifikasi ✅',
    message: `Selamat ${memberNama}! Akun Kolaborator kamu telah diverifikasi admin. Profil kamu kini tampil di direktori publik.`,
    link: '/dashboard/profil',
  });

export const triggerEventAssignedToKolaborator = (eventNama, peran) =>
  addNotif('kolaborator', {
    type: NotifType.EVENT_ASSIGNED,
    title: 'Kamu Ditugaskan ke Event 📅',
    message: `Admin menugaskan kamu sebagai ${peran} di "${eventNama}".`,
    link: '/dashboard/event',
  });

export const triggerUmkmApproved = (namaUsaha) =>
  addNotif('artisan', {
    type: NotifType.Artisan_APPROVED,
    title: 'Usaha Disetujui ✅',
    message: `"${namaUsaha}" berhasil didaftarkan. Kamu bisa mulai menggunakan dashboard Artisan.`,
    link: '/dashboard',
  });

export const triggerUmkmEventApproved = (namaUsaha, eventNama, posisi) =>
  addNotif('artisan', {
    type: NotifType.Artisan_EVENT_APPROVED,
    title: 'Permintaan Event Disetujui 📅',
    message: `"${namaUsaha}" disetujui untuk "${eventNama}" di posisi ${posisi}.`,
    link: '/dashboard/event',
  });

export const triggerUmkmEventAssigned = (eventNama, posisi) =>
  addNotif('artisan', {
    type: NotifType.Artisan_EVENT_ASSIGNED,
    title: 'Usahamu Dijadwalkan ke Event 📍',
    message: `Admin menambahkan usahamu ke "${eventNama}" di posisi ${posisi}.`,
    link: '/dashboard/event',
  });

export const triggerNewKolaboratorRequest = (memberNama) =>
  addNotif('admin', {
    type: NotifType.NEW_KOLABORATOR_REQUEST,
    title: 'Pendaftaran Member Baru 👤',
    message: `${memberNama} mendaftar sebagai Kolaborator. Perlu verifikasi.`,
    link: '/members',
  });

export const triggerNewUmkmRequest = (namaUsaha) =>
  addNotif('admin', {
    type: NotifType.NEW_Artisan_REQUEST,
    title: 'Pendaftaran Artisan Baru 🏪',
    message: `"${namaUsaha}" mendaftar sebagai Artisan. Perlu verifikasi.`,
    link: '/tenants',
  });

export const triggerUmkmEventRequest = (namaUsaha, eventNama, posisi) =>
  addNotif('admin', {
    type: NotifType.Artisan_EVENT_REQUEST,
    title: 'Permintaan Ikut Event 🏬',
    message: `"${namaUsaha}" ingin bergabung ke "${eventNama}" di posisi ${posisi}. Menunggu persetujuan.`,
    link: '/events',
  });

export const triggerKolaboratorEventRegister = (memberNama, eventNama) =>
  addNotif('admin', {
    type: NotifType.EVENT_REGISTER,
    title: 'Member Daftar Event 📋',
    message: `${memberNama} mendaftar mandiri ke "${eventNama}".`,
    link: '/events',
  });
