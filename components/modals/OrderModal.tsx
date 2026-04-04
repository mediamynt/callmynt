'use client';

import { useState } from 'react';
import { C } from '@/lib/constants';
import { Button } from '@/components/shared/Button';
import { MonoText } from '@/components/shared/MonoText';
import { Course } from '@/lib/types';

interface OrderModalProps {
  c?: Course | null | { n?: string; b?: string };
  onClose: () => void;
  onDone: (payload: {
    product: string;
    color: string;
    sizes: Record<string, number>;
    paymentTerms: string;
  }) => Promise<void> | void;
  submitting?: boolean;
}

export function OrderModal({ c, onClose, onDone, submitting }: OrderModalProps) {
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const products = ['Core Polo', 'Tour Polo', 'Sun Stripe Polo'];
  const colors = ['Navy', 'Charcoal', 'Forest', 'Black', 'White'];
  const [grid, setGrid] = useState<Record<string, number>>(
    Object.fromEntries(sizes.map((s) => [s, 0]))
  );
  const [product, setProduct] = useState(products[0]);
  const [color, setColor] = useState(colors[0]);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  const tot = Object.values(grid).reduce((a, b) => a + b, 0);

  const setS = (s: string, v: number) => {
    setGrid((g) => ({ ...g, [s]: Math.max(0, v) }));
  };

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
          width: 500,
          maxWidth: '92vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Create wholesale order</div>
        <div style={{ fontSize: 15, color: C.t2, marginBottom: 24 }}>
          {c?.n}
          {c?.b ? ` — ${c.b}` : ''}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 8 }}>Product</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {products.map((item) => (
                <button
                  key={item}
                  onClick={() => setProduct(item)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${product === item ? C.bB : C.bd}`,
                    background: product === item ? C.bD : C.sf,
                    color: product === item ? C.bT : C.t2,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 8 }}>Color</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {colors.map((item) => (
                <button
                  key={item}
                  onClick={() => setColor(item)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${color === item ? C.gB : C.bd}`,
                    background: color === item ? C.gD : C.sf,
                    color: color === item ? C.gT : C.t2,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 10 }}>
          Quantities by size
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {sizes.map((s) => (
            <div key={s} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: C.t3, marginBottom: 6 }}>{s}</div>
              <input
                type="number"
                value={grid[s]}
                onChange={(e) => setS(s, +e.target.value || 0)}
                style={{
                  width: '100%',
                  padding: '10px 4px',
                  borderRadius: 10,
                  border: `1.5px solid ${C.bd}`,
                  background: C.sf,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 18,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: C.t1,
                }}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '14px 0',
            borderTop: `1px solid ${C.bd}`,
            borderBottom: `1px solid ${C.bd}`,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 15, color: C.t2 }}>
            Total: <MonoText s={16}>{tot} units</MonoText>
          </span>
          <span style={{ fontSize: 15 }}>
            <MonoText s={16} c={C.grn}>
              ${(tot * 25).toLocaleString()}
            </MonoText>{' '}
            <span style={{ color: C.t3 }}>@ $25/unit</span>
          </span>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 8 }}>
          Payment terms
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['Net 30', 'Credit card', 'Pay now'].map((p) => (
            <button
              key={p}
              onClick={() => setPaymentTerms(p)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border: `1.5px solid ${paymentTerms === p ? C.bB : C.bd}`,
                background: paymentTerms === p ? C.bD : C.bg,
                color: paymentTerms === p ? C.bT : C.t2,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <Button primary full onClick={() => void onDone({ product, color, sizes: grid, paymentTerms })}>
          {submitting ? 'Creating order...' : `Create Shopify order — $${(tot * 25).toLocaleString()}`}
        </Button>
        <div style={{ height: 8 }} />
        <Button full onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
