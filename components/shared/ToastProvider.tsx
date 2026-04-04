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

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

const ToastContext = createContext<{ pushToast: (message: string, tone?: ToastTone) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const removeToast = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current += 1;
    setItems((current) => [...current, { id, message, tone }].slice(-5));
    window.setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 68, right: 16, zIndex: 600, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => {
          const tone = item.tone === 'success'
            ? { border: C.grn, bg: C.gD, text: C.gT }
            : item.tone === 'error'
              ? { border: C.red, bg: C.rD, text: C.rT }
              : { border: C.blu, bg: C.bD, text: C.bT };

          return (
            <div
              key={item.id}
              style={{
                minWidth: 260,
                maxWidth: 360,
                padding: '12px 14px',
                background: C.bg,
                border: `1px solid ${C.bd}`,
                borderLeft: `4px solid ${tone.border}`,
                boxShadow: '0 12px 32px rgba(26,29,38,0.12)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, fontSize: 13, color: tone.text, lineHeight: 1.5 }}>{item.message}</div>
              <button
                onClick={() => removeToast(item.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: C.t3,
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
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
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}

