// src/components/ConfirmDialog.jsx — Peken Banyumasan Design System v2.0
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen, title = 'Konfirmasi', message,
  confirmLabel = 'Ya, Lanjutkan', cancelLabel = 'Batal',
  variant = 'danger', onConfirm, onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger  = variant === 'danger';
  const iconColor = isDanger ? '#B87272' : '#C4A24D';
  const iconBg    = isDanger ? '#f7eeee' : '#f7f2e4';
  const btnBg     = isDanger ? '#B87272' : '#C4A24D';
  const btnHover  = isDanger ? '#a05f5f' : '#b08f3a';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(14,16,8,.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        fontFamily: '"Montserrat", system-ui, sans-serif',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(30,32,16,.12)',
          width: '100%', maxWidth: 360,
          overflow: 'hidden',
          animation: 'fadeInUp .22s cubic-bezier(0.22,0.61,0.36,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Body */}
        <div style={{ padding: '24px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertTriangle size={18} color={iconColor} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e2010', margin: '0 0 6px' }}>
                {title}
              </h3>
              <p style={{ fontSize: 12, color: '#5a6040', lineHeight: 1.7, margin: 0 }}>
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          background: '#f7f8f2',
          borderTop: '1px solid #e4e7d4',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px', borderRadius: 20,
              border: '1.5px solid #e4e7d4',
              background: 'transparent', color: '#5a6040',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: '"Montserrat", sans-serif',
              transition: 'background 180ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#eef0e0'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px', borderRadius: 20,
              border: 'none',
              background: btnBg, color: '#fff',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: '"Montserrat", sans-serif',
              transition: 'background 180ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = btnHover}
            onMouseLeave={e => e.currentTarget.style.background = btnBg}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
