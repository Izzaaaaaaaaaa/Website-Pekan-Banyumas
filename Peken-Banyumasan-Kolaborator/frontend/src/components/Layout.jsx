// Layout.jsx — Peken Banyumasan Design System v2.0
// Dark charcoal sidebar (#1B1B1B) + pale sage page bg (#f2f4e8)
// Sage (#C3CA96) as the sole accent — no green, no amber
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, User, Image, BookOpen, Calendar,
    Bell, Settings, LogOut, Menu, X, Globe
} from 'lucide-react';
import { clearAuth, getUser } from '../lib/auth';
import { STORAGE_EVENTS } from '../lib/storageKeys';
import { getNotifs } from '../lib/notifications';
import logo from '../assets/logo.png';

const navItems = [
    { to:'/dashboard',            label:'Dashboard',   icon:LayoutDashboard, exact:true },
    { to:'/dashboard/profil',     label:'Profil',      icon:User             },
    { to:'/dashboard/portofolio', label:'Portofolio',  icon:Image            },
    { to:'/dashboard/story',      label:'Story',       icon:BookOpen         },
    { to:'/dashboard/event',      label:'Event',       icon:Calendar         },
    { to:'/dashboard/notifikasi', label:'Notifikasi',  icon:Bell, badge:true },
    { to:'/dashboard/pengaturan', label:'Pengaturan',  icon:Settings         },
];

const COMPANY_URL = import.meta.env.VITE_COMPANY_URL || 'http://localhost:5174';

// ── Design tokens (inline, for components that can't use Tailwind) ──
/* ── Design System Tokens (matches gate & artisan canonical vars) ── */
const T = {
    // Surfaces
    charcoal:    '#1B1B1B',          // --peken-charcoal
    sagePale:    '#f2f4e8',          // --dash-bg
    surface:     '#FFFFFF',          // --dash-surface
    white:       '#FFFFFF',
    border:      '#e4e7d4',          // --dash-border
    // Text
    text1:       '#1e2010',          // --dash-text-primary
    text2:       '#5a6040',          // --dash-text-secondary
    textMuted:   '#8a9070',          // --dash-text-muted
    // Accent
    sageAccent:  '#C3CA96',          // --dash-accent
    sageDark:    '#7a8a52',          // --dash-accent-dark
    sageDeeper:  '#4f5c30',          // --dash-accent-deeper
    sageAccentBg:'#eef0e0',          // --dash-accent-bg
    // Status
    success:     '#7A9B6A',          // --peken-success (online dot)
    // Sidebar (identical to gate — charcoal bg, muted sage-white text)
    sidebarFg:       '#d0d4b8',      // --dash-sidebar-fg
    sidebarFgActive: '#C3CA96',      // --dash-sidebar-active-fg
    sidebarInactive: '#8a9278',      // inactive nav icon color (matches artisan sidebar)
    sidebarSub:      '#5a6258',      // secondary sidebar labels
    sidebarSect:     '#6a7258',      // section divider labels
    sidebarActive:   'rgba(195,202,150,0.13)', // --dash-sidebar-active
    sidebarUser:     'rgba(195,202,150,0.08)',
    sidebarUserBd:   'rgba(195,202,150,0.14)',
    sidebarDivider:  'rgba(255,255,255,0.06)',
    sidebarTopDivider:'rgba(255,255,255,0.08)',
    logoBorder:      'rgba(255,255,255,0.12)',
    overlay:         'rgba(13,13,13,0.6)',
};

export default function Layout() {
    const loc  = useLocation();
    const nav  = useNavigate();
    const user = getUser() || {};
    const [open, setOpen]         = useState(false);
    const [notifCount, setNotifCount] = useState(0);

    useEffect(() => {
        const refresh = () =>
            setNotifCount(getNotifs('kolaborator').filter(n => !n.read).length);
        refresh();
        window.addEventListener(STORAGE_EVENTS.NOTIF_UPDATE, refresh);
        return () => window.removeEventListener(STORAGE_EVENTS.NOTIF_UPDATE, refresh);
    }, []);

    const logout  = () => { clearAuth(); nav('/login'); };
    const initial = (user.nama || 'U').charAt(0).toUpperCase();
    const isActive = item =>
        item.exact
            ? loc.pathname === item.to
            : loc.pathname === item.to || loc.pathname.startsWith(item.to + '/');

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: T.sagePale }}>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    style={{ background: T.overlay }}
                    onClick={() => setOpen(false)}
                />
            )}

            {/* ── SIDEBAR ── */}
            <aside
                className={`
          fixed md:static inset-y-0 left-0 z-50 flex flex-col
          h-full
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
                style={{ background: T.charcoal, width: 260, minWidth: 260 }}
            >
                {/* Brand mark */}
                <div
                    className="px-5 py-5 flex items-center justify-between shrink-0"
                    style={{ borderBottom: `1px solid ${T.sidebarTopDivider}` }}
                >
                    <Link
                        to="/dashboard"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 group"
                    >
                        {/* Logo image — no background wrapper, matches gate pattern */}
                        <img
                            src={logo}
                            alt="Peken Banyumasan"
                            style={{
                                width: 38, height: 38, borderRadius: 10,
                                objectFit: 'cover',
                                border: `1px solid ${T.logoBorder}`,
                                flexShrink: 0,
                            }}
                        />
                        <div>
                            <p style={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: T.white,
                                lineHeight: 1,
                                fontFamily: '"Clash Display", system-ui, sans-serif',
                            }}>Peken</p>
                            <p style={{
                                fontSize: 10,
                                color: T.sidebarSub,
                                marginTop: 3,
                                letterSpacing: '.08em',
                                textTransform: 'uppercase',
                                fontFamily: '"Montserrat", system-ui, sans-serif',
                            }}>Banyumasan</p>
                        </div>
                    </Link>
                    <button
                        className="md:hidden p-1"
                        style={{ color: T.sidebarSub }}
                        onClick={() => setOpen(false)}
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* User card */}
                <Link
                    to="/dashboard/profil"
                    onClick={() => setOpen(false)}
                    className="mx-3 mt-3 px-3 py-3 rounded-xl flex items-center gap-3 shrink-0 transition-colors"
                    style={{
                        background: T.sidebarUser,
                        border: `1px solid ${T.sidebarUserBd}`,
                    }}
                >
                    {user.foto_url ? (
                        <img
                            src={user.foto_url}
                            alt=""
                            className="rounded-full object-cover shrink-0"
                            style={{ width: 36, height: 36 }}
                        />
                    ) : (
                        <div
                            className="rounded-full shrink-0 flex items-center justify-center font-bold"
                            style={{ width: 36, height: 36, background: T.sageAccent, color: T.charcoal, fontSize: 14 }}
                        >{initial}</div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p
                            className="font-semibold truncate leading-tight"
                            style={{ fontSize: 13, color: T.sidebarFg, fontFamily: '"Montserrat", system-ui, sans-serif' }}
                        >{user.nama || 'Kolaborator'}</p>
                        <p
                            className="truncate mt-0.5"
                            style={{ fontSize: 10, color: T.sidebarSub, fontFamily: '"Montserrat", system-ui, sans-serif' }}
                        >{(user.subsektor || []).slice(0, 2).join(', ') || 'Kolaborator'}</p>
                    </div>
                    {/* Online dot */}
                    <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: T.success }}
                    />
                </Link>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-hide" style={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: T.sidebarSect,
                        textTransform: 'uppercase',
                        letterSpacing: '.1em',
                        padding: '10px 10px 4px',
                        fontFamily: '"Montserrat", system-ui, sans-serif',
                    }}>Menu</div>

                    {navItems.map(item => {
                        const active = isActive(item);
                        const Icon   = item.icon;
                        const count  = item.badge ? notifCount : 0;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setOpen(false)}
                                className="flex items-center rounded-xl transition-colors"
                                style={{
                                    gap: 10,
                                    padding: '10px 14px',
                                    background: active ? T.sidebarActive : 'transparent',
                                    color: active ? T.sidebarFgActive : T.sidebarFg,
                                    fontFamily: '"Montserrat", system-ui, sans-serif',
                                    fontWeight: active ? 600 : 500,
                                    fontSize: 13,
                                    textDecoration: 'none',
                                }}
                            >
                                <Icon
                                    size={16}
                                    style={{ color: active ? T.sageAccent : T.sidebarInactive, flexShrink: 0 }}
                                />
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {count > 0 && (
                                    <span
                                        className="rounded-full font-bold flex items-center justify-center shrink-0"
                                        style={{
                                            width: 18, height: 18,
                                            fontSize: 10,
                                            background: T.sageAccent,
                                            color: T.charcoal,
                                            fontFamily: '"Montserrat", system-ui, sans-serif',
                                        }}
                                    >{count > 9 ? '9+' : count}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div
                    className="px-3 pb-4 pt-3 shrink-0 space-y-0.5"
                    style={{ borderTop: `1px solid ${T.sidebarDivider}` }}
                >
                    <a
                        href={COMPANY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full transition-colors rounded-xl"
                        style={{
                            gap: 10, padding: '10px 14px',
                            color: T.sidebarSub,
                            fontFamily: '"Montserrat", system-ui, sans-serif',
                            fontSize: 13, fontWeight: 500,
                            textDecoration: 'none',
                        }}
                    >
                        <Globe size={16} style={{ color: T.sidebarSect, flexShrink: 0 }} />
                        Beranda Publik
                    </a>
                    <button
                        onClick={logout}
                        className="flex items-center w-full text-left transition-colors rounded-xl"
                        style={{
                            gap: 10, padding: '10px 14px',
                            color: T.sidebarSub,
                            fontFamily: '"Montserrat", system-ui, sans-serif',
                            fontSize: 13, fontWeight: 500,
                        }}
                    >
                        <LogOut size={16} style={{ color: T.sidebarSect, flexShrink: 0 }} />
                        Keluar
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                {/* Top bar */}
                <header
                    className="flex items-center px-5 md:px-7 gap-4 shrink-0"
                    style={{
                        height: 72,
                        background: T.surface,
                        borderBottom: `1px solid ${T.border}`,
                        boxShadow: '0 1px 3px rgba(30,32,16,.04)',
                    }}
                >
                    <button
                        className="md:hidden p-2 -ml-1 rounded-lg transition-colors"
                        style={{ color: T.text2 }}
                        onClick={() => setOpen(true)}
                    >
                        <Menu size={22} />
                    </button>

                    {/* Page title — konsisten dengan gate & peken: logo hanya di sidebar */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                            className="truncate font-bold"
                            style={{ fontSize: 17, color: T.text1, fontFamily: '"Montserrat", system-ui, sans-serif', margin: 0 }}
                        >
                            {navItems.find(n => isActive(n))?.label || 'Dashboard'}
                        </p>
                    </div>

                    {/* Notif bell */}
                    <Link
                        to="/dashboard/notifikasi"
                        className="relative p-2 rounded-xl transition-colors"
                        style={{ color: T.text2 }}
                    >
                        <Bell size={22} />
                        {notifCount > 0 && (
                            <span
                                className="absolute top-1 right-1 rounded-full font-bold flex items-center justify-center"
                                style={{
                                    width: 16, height: 16,
                                    fontSize: 9,
                                    background: T.sageAccent,
                                    color: T.charcoal,
                                    border: `2px solid ${T.surface}`,
                                }}
                            >{notifCount > 9 ? '9+' : notifCount}</span>
                        )}
                    </Link>

                    {/* Avatar */}
                    {user.foto_url ? (
                        <Link to="/dashboard/profil">
                            <img
                                src={user.foto_url}
                                alt=""
                                className="rounded-full object-cover"
                                style={{ width: 36, height: 36, boxShadow: `0 0 0 2px ${T.sageAccent}` }}
                            />
                        </Link>
                    ) : (
                        <Link
                            to="/dashboard/profil"
                            className="rounded-full flex items-center justify-center font-bold"
                            style={{ width: 36, height: 36, background: T.sageAccent, color: T.charcoal, fontSize: 14 }}
                        >{initial}</Link>
                    )}
                </header>

                {/* Page content */}
                <div
                    className="flex-1 overflow-y-auto"
                    style={{ background: T.sagePale }}
                >
                    <div style={{ padding: '24px 28px' }}>
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}