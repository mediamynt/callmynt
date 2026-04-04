'use client';

import { useState } from 'react';
import { C, STG } from '@/lib/constants';
import { StagePill } from '@/components/shared/StagePill';
import { CO } from '@/lib/mock-data';

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const [q, setQ] = useState('');

  const results =
    q.length > 1
      ? CO.filter(
          (c) =>
            c.n.toLowerCase().includes(q.toLowerCase()) ||
            (c.b || '').toLowerCase().includes(q.toLowerCase())
        )
      : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: C.bg,
          borderRadius: 16,
          width: 560,
          maxWidth: '92vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.bd}` }}>
          <input
            autoFocus
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses, buyers, calls..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: `1.5px solid ${C.bd}`,
              background: C.sf,
              fontSize: 16,
              fontFamily: "'DM Sans', sans-serif",
              color: C.t1,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {q.length < 2 ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.t3 }}>
              Type to search across courses, buyers, and calls
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: C.t3 }}>
              No results for &quot;{q}&quot;
            </div>
          ) : (
            <div>
              {results.map((c) => (
                <div
                  key={c.id}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 20px',
                    borderBottom: `1px solid ${C.rs}`,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: STG[c.sg]?.bg || C.sf,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    {STG[c.sg]?.ic || '⛳'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.n}</div>
                    <div style={{ fontSize: 12, color: C.t3 }}>
                      {c.b || 'No buyer'} · {c.ci}, {c.st}
                    </div>
                  </div>
                  <StagePill sg={c.sg} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
