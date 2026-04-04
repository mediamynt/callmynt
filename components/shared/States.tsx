'use client';

import { C } from '@/lib/constants';

export function PageSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div style={{ padding: '24px 28px', display: 'grid', gap: 12 }}>
      <div style={{ width: 180, height: 24, borderRadius: 10, background: C.rs }} />
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} style={{ height: 72, borderRadius: 14, background: C.sf, border: `1px solid ${C.bd}` }} />
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div style={{ padding: '40px 28px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.rT, marginBottom: 8 }}>{message}</div>
      {onRetry ? (
        <button
          onClick={onRetry}
          style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.rB}`, background: C.rD, color: C.rT, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ padding: '52px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: C.t2, maxWidth: 420, margin: '0 auto' }}>{detail}</div>
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}
