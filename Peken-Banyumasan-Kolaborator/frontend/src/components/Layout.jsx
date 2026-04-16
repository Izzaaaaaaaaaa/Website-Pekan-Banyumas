// Layout.jsx — WHITE sidebar matching gate admin style
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Image, BookOpen, Calendar,
  Bell, Settings, LogOut, Menu, X, Palette, Globe
} from 'lucide-react';
import { clearAuth, getUser } from '../services/api';
import { getNotifs } from '../lib/notifications';

const navItems = [
  { to:'/dashboard',             label:'Dashboard',   icon:LayoutDashboard, exact:true },
  { to:'/dashboard/profil',      label:'Profil',      icon:User             },
  { to:'/dashboard/portofolio',  label:'Portofolio',  icon:Image            },
  { to:'/dashboard/aktivitas',    label:'Aktivitas',   icon:BookOpen         },
  { to:'/dashboard/event',       label:'Event',       icon:Calendar         },
  { to:'/dashboard/notifikasi',  label:'Notifikasi',  icon:Bell, badge:true },
  { to:'/dashboard/pengaturan',  label:'Pengaturan',  icon:Settings         },
];

const Artisan_URL = import.meta.env.VITE_Artisan_URL || 'http://localhost:5174';

export default function Layout() {
  const loc  = useLocation();
  const nav  = useNavigate();
  const user = getUser() || {};
  const [open, setOpen]           = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const refresh = () => setNotifCount(getNotifs('kolaborator').filter(n=>!n.read).length);
    refresh();
    window.addEventListener('peken_notif_update', refresh);
    return () => window.removeEventListener('peken_notif_update', refresh);
  }, []);

  const logout = () => { clearAuth(); nav('/login'); };
  const initial = (user.nama || 'U').charAt(0).toUpperCase();
  const isActive = item => item.exact
    ? loc.pathname === item.to
    : loc.pathname === item.to || loc.pathname.startsWith(item.to + '/');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)}/>}

      {/* ── Sidebar — white, matches gate style ── */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Brand */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{background:'linear-gradient(135deg,#2f6f4e,#4a9b6e)'}}>
              <Palette size={14} className="text-white"/>
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 text-sm leading-tight">Peken</p>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Banyumasan</p>
            </div>
          </Link>
          <button className="md:hidden text-gray-400 hover:text-gray-600" onClick={() => setOpen(false)}>
            <X size={17}/>
          </button>
        </div>

        {/* User */}
        <Link to="/dashboard/profil" onClick={() => setOpen(false)}
          className="mx-3 mt-3 px-3 py-2.5 rounded-xl flex items-center gap-2.5 bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 transition group shrink-0">
          {user.foto_url
            ? <img src={user.foto_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0"/>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{background:'#2f6f4e'}}>{initial}</div>
          }
          <div className="min-w-0 flex-1">
            <p className="text-gray-800 text-xs font-semibold truncate leading-tight">{user.nama||'Kolaborator'}</p>
            <p className="text-gray-400 text-[9px] truncate mt-0.5">{(user.subsektor||[]).slice(0,2).join(', ')||'Kolaborator'}</p>
          </div>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:'#22c55e'}}/>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = isActive(item);
            const Icon   = item.icon;
            const count  = item.badge ? notifCount : 0;
            return (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-green-50 text-green-800'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'}`}>
                <Icon size={15} className={`shrink-0 ${active ? 'text-green-700' : 'text-gray-400'}`}/>
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                    style={{background:'#2f6f4e'}}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer links */}
        <div className="px-3 pb-3 shrink-0 border-t border-gray-100 pt-3 space-y-0.5">
          <a href={Artisan_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-50 hover:text-green-700 transition font-medium w-full">
            <Globe size={14} className="text-gray-400 shrink-0"/>
            Beranda Publik
          </a>
          <button onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-red-50 hover:text-red-600 transition font-medium w-full">
            <LogOut size={14} className="text-gray-400 shrink-0"/> Keluar
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-100 flex items-center px-4 md:px-5 gap-3 shrink-0" style={{height:52}}>
          <button className="md:hidden p-1.5 -ml-1 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            onClick={() => setOpen(true)}>
            <Menu size={19}/>
          </button>
          <p className="text-gray-700 text-sm font-semibold flex-1 truncate">
            {navItems.find(n => isActive(n))?.label || 'Dashboard'}
          </p>
          <Link to="/dashboard/notifikasi" className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-500 transition">
            <Bell size={18}/>
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                style={{background:'#2f6f4e', border:'2px solid white'}}>
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
          {user.foto_url
            ? <Link to="/dashboard/profil"><img src={user.foto_url} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-green-100"/></Link>
            : <Link to="/dashboard/profil" className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{background:'#2f6f4e'}}>{initial}</Link>
          }
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-3xl mx-auto p-4 md:p-6">
            <Outlet/>
          </div>
        </div>
      </main>
    </div>
  );
}
