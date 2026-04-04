'use client';

import { C } from '@/lib/constants';

interface RowProps {
  l: string;
  v: string | React.ReactNode;
  c?: string | null;
  last?: boolean;
}

export function Row({ l, v, c, last }: RowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: last ? 'none' : `1px solid ${C.rs}`,
        fontSize: 14,
      }}
    >
      <span style={{ color: C.t3 }}>{l}</span>
      <span style={{ fontWeight: 500, color: c || C.t1 }}>{v}</span>
    </div>
  );
}
