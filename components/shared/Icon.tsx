'use client';

import { C } from '@/lib/constants';

interface IconProps {
  children: React.ReactNode;
  s?: number;
  k?: string;
  w?: number;
}

export function Icon({ children, s = 20, k = C.t2, w = 2 }: IconProps) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={k}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
