'use client';

import { C } from '@/lib/constants';

interface TabProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function Tab({ tabs, active, onChange }: TabProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: `1px solid ${C.bd}`,
        marginBottom: 16,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            borderBottom: active === t ? `2px solid ${C.grn}` : '2px solid transparent',
            color: active === t ? C.grn : C.t3,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
