'use client';

import { C, STG } from '@/lib/constants';

interface StagePillProps {
  sg: string;
}

export function StagePill({ sg }: StagePillProps) {
  const m = STG[sg] || STG.cold_list;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 999,
        background: m.bg,
        color: m.c,
        border: `1px solid ${m.bd}`,
        whiteSpace: 'nowrap',
      }}
    >
      {m.l}
    </span>
  );
}
