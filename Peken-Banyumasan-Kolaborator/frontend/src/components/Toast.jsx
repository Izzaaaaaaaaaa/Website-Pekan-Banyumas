import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  const toast = { success: m => add(m,'success'), error: m => add(m,'error'), info: m => add(m,'info') };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-80">
        {toasts.map(t => {
          const styles = { success:'bg-batik-700 text-white', error:'bg-red-600 text-white', info:'bg-brand-700 text-white' }[t.type];
          const Icon = { success:CheckCircle, error:XCircle, info:Info }[t.type];
          return (
            <div key={t.id} className={`${styles} flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium`}>
              <Icon size={16} className="shrink-0 mt-0.5" />
              <span className="flex-1">{t.msg}</span>
              <button onClick={() => setToasts(x => x.filter(i => i.id !== t.id))}><X size={14}/></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
