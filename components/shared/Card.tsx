'use client';

import { C } from '@/lib/constants';

interface CardProps {
  children: React.ReactNode;
  s?: React.CSSProperties;
}

export function Card({ children, s = {} }: CardProps) {
  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.bd}`,
        borderRadius: 14,
        padding: '16px 18px',
        ...s,
      }}
    >
      {children}
    </div>
  );
}
