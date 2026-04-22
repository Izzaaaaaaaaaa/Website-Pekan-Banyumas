// src/components/Toast.jsx — Peken Banyumasan Design System v2.0
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus digunakan di dalam ToastProvider');
  return ctx;
};

let _id = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error', 4500),
    warning: (msg) => addToast(msg, 'warning'),
    info:    (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ── Design system status config ──────────────────────────────────────────────
const CONFIG = {
  success: {
    Icon: CheckCircle,
    bg: '#eef4eb', border: '#b8d4b0',
    iconColor: '#7A9B6A', textColor: '#3a5c2c',
    closeColor: '#7A9B6A',
  },
  error: {
    Icon: XCircle,
    bg: '#f7eeee', border: '#dbb8b8',
    iconColor: '#B87272', textColor: '#7a3c3c',
    closeColor: '#B87272',
  },
  warning: {
    Icon: AlertTriangle,
    bg: '#f7f2e4', border: '#dcc882',
    iconColor: '#C4A24D', textColor: '#7a5c1a',
    closeColor: '#C4A24D',
  },
  info: {
    Icon: Info,
    bg: '#eaf0f4', border: '#b0c8d8',
    iconColor: '#6B8FA3', textColor: '#2c4c5c',
    closeColor: '#6B8FA3',
  },
};

// ── Toast Container ──────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, onDismiss }) => (
  <>
    <style>{`
      @keyframes toast-slide-in {
        from { opacity: 0; transform: translateX(16px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .peken-toast { animation: toast-slide-in 0.24s cubic-bezier(0.22,0.61,0.36,1) both; }
    `}</style>

    <div
      aria-live="polite"
      style={{
        position: 'fixed', top: 20, right: 20,
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        width: 320, pointerEvents: 'none',
        fontFamily: '"Montserrat", system-ui, sans-serif',
      }}
    >
      {toasts.map(({ id, message, type }) => {
        const c = CONFIG[type] || CONFIG.info;
        const { Icon } = c;
        return (
          <div
            key={id}
            className="peken-toast"
            style={{
              pointerEvents: 'auto',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px',
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(30,32,16,.1)',
            }}
          >
            <Icon size={16} color={c.iconColor} style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{
              flex: 1, margin: 0,
              fontSize: 12, fontWeight: 500, lineHeight: 1.6,
              color: c.textColor,
            }}>
              {message}
            </p>
            <button
              onClick={() => onDismiss(id)}
              aria-label="Tutup"
              style={{
                flexShrink: 0, background: 'none', border: 'none',
                cursor: 'pointer', color: c.closeColor,
                opacity: .7, padding: 2, display: 'flex',
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = .7}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  </>
);
