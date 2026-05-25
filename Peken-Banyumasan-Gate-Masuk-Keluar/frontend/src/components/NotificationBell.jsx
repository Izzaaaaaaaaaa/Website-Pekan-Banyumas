import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { notifikasiApi } from '../services/endpoints';
import { useToast } from './Toast';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const toast = useToast();

  const loadNotifications = async () => {
    try {
      const data = await notifikasiApi.list();
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Polling 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) loadNotifications();
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notifikasiApi.baca(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Gagal menandai dibaca');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notifikasiApi.bacaSemua();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Semua notifikasi ditandai dibaca');
    } catch (err) {
      toast.error('Gagal memproses');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-[#5a6040] hover:bg-[#f7f8f2] rounded-full transition-colors flex items-center justify-center"
        title="Notifikasi"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#C4A24D] text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-[16px] shadow-xl border border-[#e4e7d4] z-50 overflow-hidden flex flex-col max-h-[400px]">
          <div className="px-4 py-3 border-b border-[#e4e7d4] flex items-center justify-between bg-[#f7f8f2] shrink-0">
            <h3 className="font-bold text-[#1e2010] text-sm">Notifikasi</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[11px] text-[#7a8a52] hover:underline font-semibold">
                Tandai Semua Dibaca
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-[#8a9070] flex flex-col items-center">
                <Loader2 size={24} className="animate-spin mb-2 text-[#7a8a52]"/>
                <span className="text-xs">Memuat...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[#8a9070] text-sm">
                Tidak ada notifikasi
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 flex gap-3 hover:bg-[#f7f8f2] transition ${!n.is_read ? 'bg-[#f7f8f2]/50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${!n.is_read ? 'font-bold text-[#1e2010]' : 'font-medium text-[#5a6040]'}`}>
                        {n.pesan || n.judul}
                      </p>
                      <p className="text-[10px] text-[#8a9070] mt-1">
                        {new Date(n.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button onClick={(e) => markAsRead(n.id, e)} className="shrink-0 p-1 rounded-full text-[#8a9070] hover:text-[#7a8a52] hover:bg-[#eef0e0]" title="Tandai dibaca">
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
