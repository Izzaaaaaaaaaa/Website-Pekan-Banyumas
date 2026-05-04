// src/App.jsx
import React, { useEffect } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useNavigate,
} from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kolaborator from './pages/Kolaborator';
import Artisan from './pages/Artisan';
import Reports from './pages/Reports';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Monitor from './pages/Monitor';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CompanyProfile from './pages/CompanyProfile';
import { ToastProvider, useToast } from './components/Toast';
import { isAuthenticated, hasRole, clearAuth } from './lib/auth';
import { setUnauthorizedHandler } from './services/api';

// ── Route guards ─────────────────────────────────────────────────────────
// Read auth state via lib/auth helpers — never touch localStorage directly.

const PrivateRoute = ({ children }) =>
    isAuthenticated() ? children : <Navigate to="/login" replace />;

const AdminRoute = ({ children }) => {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (!hasRole('admin')) return <Navigate to="/" replace />;
    return children;
};

const PublicOnlyRoute = ({ children }) =>
    isAuthenticated() ? <Navigate to="/" replace /> : children;

// ── AppShell — lives INSIDE <Router> so it can use useNavigate to register
// the apiClient's 401 handler. Keeping the handler router-aware (vs. a
// hard-coded window.location.href) means switching routers later is a
// one-line change in apiClient.js, not a grep across the codebase.
const AppShell = () => {
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        setUnauthorizedHandler(() => {
            // Show the toast immediately so the user understands why they're
            // about to be redirected, then wait briefly so the toast paints
            // before navigation tears down the page.
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

        // Reset the handler on unmount (mostly relevant for HMR / testing).
        return () => setUnauthorizedHandler(() => {});
    }, [navigate, toast]);

    return (
        <Routes>
            <Route path="/profile" element={<Profile />} />
            <Route path="/monitor" element={<Monitor />} />

            <Route path="/login" element={
                <PublicOnlyRoute><Login /></PublicOnlyRoute>
            } />

            <Route path="/" element={
                <PrivateRoute><AdminLayout /></PrivateRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="settings" element={<Settings />} />
                <Route path="kolaborator" element={<AdminRoute><Kolaborator /></AdminRoute>} />
                <Route path="artisan" element={<AdminRoute><Artisan /></AdminRoute>} />
                <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
                <Route path="events" element={<AdminRoute><Events /></AdminRoute>} />
                <Route path="events/:id" element={<AdminRoute><EventDetail /></AdminRoute>} />
                <Route path="company-profile" element={<AdminRoute><CompanyProfile /></AdminRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <ToastProvider>
            <Router>
                <AppShell />
            </Router>
        </ToastProvider>
    );
}

export default App;
