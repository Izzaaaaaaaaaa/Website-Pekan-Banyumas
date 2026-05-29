import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { ToastProvider, useToast } from './components/Toast';
import { isAuthenticated, clearAuth, getUser } from './lib/auth';
import { setUnauthorizedHandler } from './services/api';
import Layout from './components/Layout';

import Login        from './pages/auth/Login';
import Register     from './pages/auth/Register';
import LupaPass     from './pages/auth/LupaPass';
import ResetPassword from './pages/auth/ResetPassword';
import Status       from './pages/auth/Status';
import Dashboard    from './pages/Dashboard';
import Profil       from './pages/Profil';
import Portofolio   from './pages/Portofolio';
import Story        from './pages/Story';
import Event        from './pages/Event';
import Notifikasi   from './pages/Notifikasi';
import Pengaturan   from './pages/Pengaturan';

// Auth guards — read state via lib/auth helpers, never touch localStorage directly.
// An authenticated account whose status isn't 'aktif' (pending / suspended /
// rejected) must NOT reach the dashboard — it's bounced to /status so it can't
// sit on a page that spams the API with 403s. (lib/auth defaults status to
// 'aktif' when absent, so valid accounts are never blocked.)
const isBlocked = () => { const s = getUser()?.status; return Boolean(s) && s !== 'aktif'; };
const Pub  = ({ children }) => (isAuthenticated() && !isBlocked()) ? <Navigate to="/dashboard" replace /> : children;
const Auth = ({ children }) =>
  !isAuthenticated() ? <Navigate to="/login" replace />
  : isBlocked()      ? <Navigate to="/status" replace />
  : children;

// AppShell lives INSIDE <BrowserRouter> so it can use useNavigate to register
// the apiClient's 401 handler. Keeping the handler router-aware (vs. a
// hard-coded window.location.href) means switching routers later is a
// one-line change in apiClient.js, not a grep across the codebase.
const AppShell = () => {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      try {
        toast?.error('Sesi Anda telah berakhir. Silakan masuk kembali.');
      } catch {
        /* toast unavailable in some boundary cases — proceed anyway */
      }
      setTimeout(() => {
        clearAuth();
        navigate('/login', { replace: true });
      }, 1500);
    });

    return () => setUnauthorizedHandler(() => {});
  }, [navigate, toast]);

  return (
    <Routes>
      {/* ── Public routes (no auth required) ── */}
      <Route path="/login"          element={<Pub><Login /></Pub>} />
      <Route path="/register"    element={<Pub><Register /></Pub>} />
      <Route path="/lupa-pass"   element={<Pub><LupaPass /></Pub>} />
      {/* No Pub guard: the recovery session counts as authenticated, so Pub
          would bounce the user to /dashboard before they can set a new pw. */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/status"      element={<Pub><Status /></Pub>} />

      {/* ── Authenticated dashboard routes ── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Auth><Layout /></Auth>}>
        <Route index                 element={<Dashboard />} />
        <Route path="profil"         element={<Profil />} />
        <Route path="portofolio"     element={<Portofolio />} />
        <Route path="story"          element={<Story />} />
        <Route path="event"          element={<Event />} />
        <Route path="notifikasi"     element={<Notifikasi />} />
        <Route path="pengaturan"     element={<Pengaturan />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={!isAuthenticated() ? '/login' : isBlocked() ? '/status' : '/dashboard'} replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ToastProvider>
  );
}
