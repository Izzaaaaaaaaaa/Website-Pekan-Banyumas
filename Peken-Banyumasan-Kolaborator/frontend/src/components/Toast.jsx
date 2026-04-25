// Toast.jsx — Peken Banyumasan Design System v2.0
// Sage-harmonized status colors (muted, not vivid)
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastCtx = createContext(null);

const VARIANTS = {
  success: {
    icon: CheckCircle,
    style: { background:'#eef4eb', border:'1px solid #b8d4b0', color:'#7A9B6A' },
    iconFill: true,
  },
  error: {
    icon: AlertCircle,
    style: { background:'#f7eeee', border:'1px solid #dbb8b8', color:'#B87272' },
    iconFill: false,
  },
  warning: {
    icon: AlertTriangle,
    style: { background:'#f7f2e4', border:'1px solid #dcc882', color:'#C4A24D' },
    iconFill: false,
  },
  info: {
    icon: Info,
    style: { background:'#eaf0f4', border:'1px solid #b0c8d8', color:'#6B8FA3' },
    iconFill: false,
  },
};

function ToastItem({ id, message, variant = 'info', onRemove }) {
  const v = VARIANTS[variant] || VARIANTS.info;
  const Icon = v.icon;
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-2xl shadow-lg transition-all"
      style={{
        ...v.style,
        maxWidth: 360,
        boxShadow: '0 4px 16px rgba(30,32,16,.12)',
        fontFamily: 'Montserrat, system-ui, sans-serif',
        animation: 'fadeSlideIn 180ms cubic-bezier(0.22,0.61,0.36,1)',
      }}
    >
      <Icon
        size={16}
        style={{ color: v.style.color, flexShrink: 0, marginTop: 1 }}
        fill={v.iconFill ? 'currentColor' : 'none'}
      />
      <p className="flex-1 text-sm font-medium leading-snug" style={{ color: '#1e2010' }}>
        {message}
      </p>
      <button onClick={() => onRemove(id)} style={{ color: '#8a9070', flexShrink: 0 }}>
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter  = useRef(0);

  const add = useCallback((message, variant = 'info') => {
    const id = ++counter.current;
    setToasts(t => [...t, { id, message, variant }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const remove = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);

  const api = {
    success: m => add(m, 'success'),
    error:   m => add(m, 'error'),
    warning: m => add(m, 'warning'),
    info:    m => add(m, 'info'),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 20, right: 20,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999,
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onRemove={remove} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
