'use client';

import { C } from '@/lib/constants';
import { MonoText } from './MonoText';

interface StatProps {
  label: string;
  value: string | number;
  color?: string;
}

export function Stat({ label, value, color }: StatProps) {
  return (
    <div
      style={{
        background: C.bg,
        borderRadius: 14,
        border: `1px solid ${C.bd}`,
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: C.t3,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <MonoText s={26} c={color}>
        {value}
      </MonoText>
    </div>
  );
}
