'use client';

import { C } from '@/lib/constants';

export function SkeletonBlock({ height = 18, width = '100%', radius = 10 }: { height?: number; width?: number | string; radius?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${C.rs} 0%, ${C.sf} 50%, ${C.rs} 100%)`,
      }}
    />
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
      <div style={{ fontSize: 14, color: C.t2, marginBottom: action ? 18 : 0 }}>{detail}</div>
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.rT, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: C.t2, marginBottom: onRetry ? 16 : 0 }}>{detail}</div>
      {onRetry ? (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: `1px solid ${C.bd}`,
            background: C.bg,
            color: C.t1,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

