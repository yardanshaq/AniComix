'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'info' | 'success' | 'error' | 'warning';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}
interface ToastCtx {
  showToast: (message: string, opts?: { type?: ToastType; duration?: number }) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast: ToastCtx['showToast'] = useCallback((message, opts) => {
    const id = Date.now() + Math.random();
    const type = opts?.type || 'info';
    const duration = opts?.duration ?? 3000;
    setItems(prev => [...prev, { id, message, type }]);
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const icon = (t: ToastType) =>
    t === 'success' ? 'fa-circle-check'
    : t === 'error' ? 'fa-circle-exclamation'
    : t === 'warning' ? 'fa-triangle-exclamation'
    : 'fa-circle-info';

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {items.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <i className={`fas ${icon(t.type)}`} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
