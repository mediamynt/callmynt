'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { C } from '@/lib/constants';

type Toast = {
  id: number;
  title: string;
  detail?: string;
  tone?: 'success' | 'error' | 'info';
};

type ToastContextValue = {
  pushToast: (input: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const pushToast = useCallback((input: Omit<Toast, 'id'>) => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current, { id, ...input }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 72, right: 16, zIndex: 1200, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map((toast) => {
          const toneColor =
            toast.tone === 'success' ? C.grn : toast.tone === 'error' ? C.red : C.blu;
          const toneBg =
            toast.tone === 'success' ? C.gD : toast.tone === 'error' ? C.rD : C.bD;
          const toneBorder =
            toast.tone === 'success' ? C.gB : toast.tone === 'error' ? C.rB : C.bB;

          return (
            <div
              key={toast.id}
              style={{
                minWidth: 280,
                maxWidth: 360,
                background: toneBg,
                border: `1px solid ${toneBorder}`,
                borderRadius: 14,
                padding: '12px 14px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: toneColor }}>{toast.title}</div>
              {toast.detail ? <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>{toast.detail}</div> : null}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
