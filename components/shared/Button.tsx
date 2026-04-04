'use client';

import { C } from '@/lib/constants';

interface ButtonProps {
  children: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
  onClick?: () => void;
  full?: boolean;
}

export function Button({ children, primary, danger, onClick, full }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: primary ? '14px 24px' : '10px 18px',
        borderRadius: 12,
        border: primary || danger ? 'none' : `1.5px solid ${C.bd}`,
        background: danger ? C.red : primary ? C.grn : C.bg,
        color: danger || primary ? 'white' : C.t1,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        width: full ? '100%' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {children}
    </button>
  );
}
