'use client';

import { C } from '@/lib/constants';

interface MonoTextProps {
  children: React.ReactNode;
  c?: string;
  s?: number;
}

export function MonoText({ children, c, s = 13 }: MonoTextProps) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: s,
        fontWeight: 600,
        color: c || C.t1,
      }}
    >
      {children}
    </span>
  );
}
