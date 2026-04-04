'use client';

import { C } from '@/lib/constants';

interface ControlButtonProps {
  children: React.ReactNode;
  label?: string;
  big?: boolean;
  danger?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export function ControlButton({ children, label, big, danger, active, onClick }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: big ? 68 : 52,
          height: big ? 68 : 52,
          borderRadius: '50%',
          background: danger ? C.red : active ? C.bD : C.sf,
          border: `1.5px solid ${danger ? C.red : active ? C.bB : C.bd}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: danger ? 'white' : active ? C.blu : C.t2,
        }}
      >
        {children}
      </div>
      {label && (
        <span
          style={{
            fontSize: 11,
            color: danger ? C.red : C.t3,
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
