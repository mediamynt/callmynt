'use client';

import { C } from '@/lib/constants';

interface LabelProps {
  children: React.ReactNode;
  r?: string;
}

export function Label({ children, r }: LabelProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.t3,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {children}
      </span>
      {r && (
        <span style={{ fontSize: 12, color: C.t3 }}>{r}</span>
      )}
    </div>
  );
}
