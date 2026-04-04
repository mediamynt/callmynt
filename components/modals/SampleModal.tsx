'use client';

import { useState } from 'react';
import { C } from '@/lib/constants';
import { Button } from '@/components/shared/Button';
import { Course } from '@/lib/types';

interface SampleModalProps {
  c?: Course | null | { n?: string; b?: string; bs?: string; ct?: string };
  onClose: () => void;
  onDone: (data: { sz: string; cl: string; ad: string }) => Promise<void> | void;
  submitting?: boolean;
}

export function SampleModal({ c, onClose, onDone, submitting }: SampleModalProps) {
  const [sz, setSz] = useState(c?.bs || '');
  const [cl, setCl] = useState('Navy');
  const [ad, setAd] = useState(c?.ct || '');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.25)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: C.bg,
          borderRadius: 20,
          padding: '28px 32px',
          width: 440,
          maxWidth: '92vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Ship free sample</div>
        <div style={{ fontSize: 15, color: C.t2, marginBottom: 24 }}>
          {c?.n}
          {c?.b ? ` — ${c.b}` : ''}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 8 }}>Size</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
            <button
              key={s}
              onClick={() => setSz(s)}
              style={{
                padding: '14px 0',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                background: sz === s ? C.gD : C.sf,
                color: sz === s ? C.gT : C.t3,
                border: `2px solid ${sz === s ? C.gB : C.bd}`,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 8 }}>Color</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {['Navy', 'Charcoal', 'Forest', 'Black', 'White'].map((c2) => (
            <button
              key={c2}
              onClick={() => setCl(c2)}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                background: cl === c2 ? C.bD : C.sf,
                color: cl === c2 ? C.bT : C.t3,
                border: `2px solid ${cl === c2 ? C.bB : C.bd}`,
                cursor: 'pointer',
              }}
            >
              {c2}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 8 }}>Ship to</div>
        <textarea
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Pro shop address..."
          rows={2}
          style={{
            width: '100%',
            padding: 14,
            background: C.sf,
            border: `1.5px solid ${C.bd}`,
            borderRadius: 14,
            color: C.t1,
            fontSize: 15,
            fontFamily: "'DM Sans', sans-serif",
            resize: 'none',
            marginBottom: 20,
          }}
        />

        <Button primary full onClick={() => void onDone({ sz, cl, ad })}>
          {submitting ? 'Shipping sample...' : 'Ship sample via Shopify'}
        </Button>
        <div style={{ height: 8 }} />
        <Button full onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
