// src/layouts/AdminLayout.jsx
// Design System v2.0 — Peken Banyumasan Gate Dashboard
// Sidebar: dark charcoal (#1B1B1B), sage accent, Montserrat + Clash Display

import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  PieChart, Users, Store, FileText, LogOut,
  User, Menu, X, ShieldCheck, UserCog,
  Calendar, Monitor, BookOpen, Settings, Globe,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { getUser, clearAuth } from '../lib/auth';
import { STORAGE_KEYS, STORAGE_EVENTS } from '../lib/storageKeys';

const normalizeExternalUrl = (value, fallback = '/') => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return raw;
  return `https://${raw}`;
};

// ── Sidebar Nav Item ──────────────────────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, isActive, badge, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      borderRadius: 10,
      margin: '1px 0',
      background: isActive ? 'rgba(195,202,150,0.13)' : 'transparent',
      color: isActive ? '#C3CA96' : '#8a9278',
      fontSize: 13,
      fontWeight: isActive ? 600 : 500,
      textDecoration: 'none',
      transition: 'background 180ms ease, color 180ms ease',
      position: 'relative',
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(195,202,150,0.06)'; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
  >
    <span style={{ position: 'relative', flexShrink: 0 }}>
      <Icon size={16} />
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -6,
          width: 14, height: 14, borderRadius: '50%',
          background: '#C4A24D', color: '#fff',
          fontSize: 8, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </span>
    <span style={{ flex: 1 }}>{label}</span>
    {badge > 0 && (
      <span style={{
        fontSize: 9, fontWeight: 700,
        background: 'rgba(196,162,77,.15)', color: '#C4A24D',
        border: '1px solid rgba(196,162,77,.3)',
        borderRadius: 9999, padding: '1px 6px',
      }}>
        {badge}
      </span>
    )}
  </Link>
);

// ── External link item ────────────────────────────────────────────────────
const ExtLink = ({ href, icon: Icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 10, margin: '1px 0',
      color: '#6a7258', fontSize: 13, fontWeight: 500,
      textDecoration: 'none',
      transition: 'background 180ms ease, color 180ms ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(195,202,150,0.06)'; e.currentTarget.style.color = '#C3CA96'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6a7258'; }}
  >
    <Icon size={16} />
    <span style={{ flex: 1 }}>{label}</span>
    <svg width={9} height={9} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ opacity: .4 }}>
      <path d="M2 10L10 2M10 2H5M10 2v5" />
    </svg>
  </a>
);

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userData, setUserData] = useState({ nama: 'Admin', role: 'admin', email: '' });

  const [activeEventBadge, setActiveEventBadge] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_EVENT);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [pendingArtisanCount, setPendingArtisanCount] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PENDING_ARTISAN);
      return stored ? parseInt(stored, 10) : 0;
    } catch { return 0; }
  });

  const publicCompanyProfileUrl = useMemo(() => normalizeExternalUrl(
    import.meta.env.VITE_COMPANY_URL || 'http://localhost:5173', 'http://localhost:5173'
  ), []);

  useEffect(() => {
    const handler = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_EVENT);
        setActiveEventBadge(stored ? JSON.parse(stored) : null);
      } catch { setActiveEventBadge(null); }
    };
    window.addEventListener(STORAGE_EVENTS.EVENT_UPDATE, handler);
    return () => window.removeEventListener(STORAGE_EVENTS.EVENT_UPDATE, handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setPendingArtisanCount(e?.detail?.count ?? 0);
    window.addEventListener(STORAGE_EVENTS.PENDING_ARTISAN_UPDATE, handler);
    return () => window.removeEventListener(STORAGE_EVENTS.PENDING_ARTISAN_UPDATE, handler);
  }, []);

  useEffect(() => {
    const u = getUser();
    if (u) setUserData(u);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e?.detail) setUserData(e.detail); };
    window.addEventListener(STORAGE_EVENTS.USER_UPDATE, handler);
    return () => window.removeEventListener(STORAGE_EVENTS.USER_UPDATE, handler);
  }, []);

  const handleLogout = () => setShowLogoutConfirm(true);
  const executeLogout = () => {
    setShowLogoutConfirm(false);
    clearAuth();
    navigate('/login');
  };

  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: PieChart, roles: ['admin', 'petugas'] },
    { path: '/kolaborator', label: 'Kolaborator', icon: Users, roles: ['admin'] },
    { path: '/artisan', label: 'Artisan', icon: Store, roles: ['admin'], badge: pendingArtisanCount },
    { path: '/petugas', label: 'Petugas', icon: UserCog, roles: ['admin'] },
    { path: '/reports', label: 'Laporan', icon: FileText, roles: ['admin'] },
    { path: '/events', label: 'Kelola Event', icon: Calendar, roles: ['admin'] },
    { path: '/company-profile', label: 'Kelola Company Profile', icon: Globe, roles: ['admin'] },
    { path: '/settings', label: 'Pengaturan Akun', icon: Settings, roles: ['admin', 'petugas'] },
  ];
  const navItems = allNavItems.filter(item => item.roles.includes(userData.role));

  const publicLinks = [
    {
      key: 'monitor',
      label: 'Display Monitor',
      icon: Monitor,
      href: `${window.location.origin}${window.location.pathname}#/monitor`,
    },
    {
      key: 'company-profile',
      label: 'Lihat Company Profile',
      icon: BookOpen,
      href: publicCompanyProfileUrl,
    },
  ];

  const getPageInfo = () => {
    const m = {
      '/': { title: 'Dashboard Real-time', subtitle: 'Pantau pergerakan pengunjung event hari ini' },
      '/kolaborator': { title: 'Kolaborator', subtitle: 'Kelola dan verifikasi kolaborator kreatif Peken Banyumasan' },
      '/artisan': { title: 'Artisan & Revenue Sharing', subtitle: 'Kelola artisan, set posisi, persentase komisi, dan monitoring revenue' },
      '/reports': { title: 'Laporan Kunjungan', subtitle: 'Rekapitulasi data pengunjung selama event' },
      '/events': { title: 'Kelola Event', subtitle: 'Buat, aktifkan, dan nonaktifkan event Peken Banyumasan' },
      '/company-profile': { title: 'Company Profile', subtitle: 'Kelola seluruh konten halaman publik Peken Banyumasan' },
      '/petugas': { title: 'Kelola Petugas', subtitle: 'Buat, edit, enable/disable akun petugas event' },
      '/settings': { title: 'Pengaturan Akun', subtitle: 'Kelola nama tampilan dan password akun Anda' },
    };
    if (m[location.pathname]) return m[location.pathname];
    if (location.pathname.startsWith('/events/')) return { title: 'Detail Event', subtitle: 'Kelola relasi kolaborator & artisan di event ini' };
    return { title: 'Sistem Admin', subtitle: 'Peken Banyumasan' };
  };

  const pageInfo = getPageInfo();
  const RoleIcon = userData.role === 'admin' ? ShieldCheck : UserCog;

  // ── Sidebar content (shared for desktop + mobile) ─────────────────────
  const SidebarContent = () => (
    <>
      {/* Logo area */}
      <div style={{
        padding: '20px 18px 18px',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo-gate.png"
            alt="Peken Banyumasan"
            style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover' }}
          />
          <div>
            <div style={{
              fontFamily: '"Clash Display", sans-serif',
              fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1,
            }}>Peken</div>
            <div style={{ fontSize: 10, color: '#5a6258', marginTop: 3, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Banyumasan
            </div>
          </div>
        </div>
        {/* Mobile close */}
        <button
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ color: '#6a7258', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        <div className="sidebar-section-label">Menu Utama</div>
        {navItems.map(item => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.path}
            badge={item.badge}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        ))}

        {userData.role === 'admin' && (
          <>
            <div className="sidebar-section-label">Halaman Publik</div>
            {publicLinks.map(item => (
              <ExtLink key={item.key} href={item.href} icon={item.icon} label={item.label} />
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ padding: '14px 18px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <RoleIcon size={11} color="#7a8a52" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7a8a52', textTransform: 'capitalize' }}>
              {userData.role === 'admin' ? 'Administrator' : 'Petugas'}
            </span>
          </div>
          <div style={{
            fontSize: 10, color: '#3a4030',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180,
          }}>
            {userData.email || userData.nama}
          </div>
        </div>

        <div style={{ padding: '4px 12px 14px' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '8px 12px', borderRadius: 10,
              background: 'rgba(184,114,114,.07)',
              color: '#B87272',
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              transition: 'background 180ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,114,114,.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(184,114,114,.07)'}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f2f4e8', fontFamily: '"Montserrat", system-ui, sans-serif' }}>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari sistem?"
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={executeLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40 }}
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR (desktop: static, mobile: slide-in) ────────────────── */}
      <aside
        style={{
          width: 260, minWidth: 260,
          background: '#1B1B1B',
          display: 'flex', flexDirection: 'column',
          height: '100vh', position: 'sticky', top: 0,
          zIndex: 50,
          transition: 'transform 300ms cubic-bezier(0.22,0.61,0.36,1)',
        }}
        className={`
          fixed md:static inset-y-0 left-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #e4e7d4',
          height: 72,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px',
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(30,32,16,.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a6040', padding: 4 }}
            >
              <Menu size={22} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontSize: 18, fontWeight: 700,
                  color: '#1e2010', lineHeight: 1.2, margin: 0,
                }}>
                  {pageInfo.title}
                </h1>

                {/* Active event badge */}
                {location.pathname === '/' && activeEventBadge?.nama && (
                  <span className="peken-badge peken-badge-success hidden sm:inline-flex">
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#7A9B6A', display: 'inline-block',
                      animation: 'pulse 1.5s infinite',
                    }} />
                    {activeEventBadge.nama}
                  </span>
                )}

                {/* Artisan pending badge */}
                {location.pathname === '/artisan' && pendingArtisanCount > 0 && (
                  <span className="peken-badge peken-badge-warning hidden sm:inline-flex">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C4A24D', display: 'inline-block' }} />
                    {pendingArtisanCount} menunggu
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: '#8a9070', marginTop: 3 }}>{pageInfo.subtitle}</p>
            </div>
          </div>

          {/* User avatar → settings */}
          <button
            onClick={() => navigate('/settings')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: '1px solid #e4e7d4',
              borderRadius: 14, padding: '7px 12px',
              cursor: 'pointer',
              transition: 'background 180ms ease, border-color 180ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f7f8f2'; e.currentTarget.style.borderColor = '#c8d09a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#e4e7d4'; }}
            title="Pengaturan Akun"
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#eef0e0', color: '#4f5c30',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, fontFamily: '"Clash Display", sans-serif',
              flexShrink: 0,
            }}>
              {userData.nama?.charAt(0)?.toUpperCase() || <User size={16} />}
            </div>
            <div className="hidden sm:block" style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: '#1e2010',
                lineHeight: 1.2, maxWidth: 160,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {userData.nama}
              </div>
              <div style={{ fontSize: 10, color: '#8a9070', textTransform: 'capitalize', marginTop: 1 }}>
                {userData.role}
              </div>
            </div>
          </button>
        </header>

        {/* ── PAGE CONTENT ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
