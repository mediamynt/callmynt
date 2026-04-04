'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/constants';
import { formatDisplayPhone } from '@/lib/callmynt-shared';

type HoldRow = {
  id: string;
  caller_phone?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  course_id?: string | null;
};

export function HoldQueueBanner() {
  const [rows, setRows] = useState<HoldRow[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const result = await supabase
        .from('hold_queue')
        .select('*')
        .in('status', ['holding', 'voicemail_offered', 'queued'])
        .order('created_at', { ascending: true });

      if (!active || result.error) return;
      setRows(result.data || []);
    }

    void load();

    const channel = supabase
      .channel('hold-queue-banner')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hold_queue',
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const activeRows = useMemo(
    () => rows.filter((row) => ['holding', 'voicemail_offered', 'queued'].includes(row.status || '')),
    [rows],
  );

  if (activeRows.length === 0) return null;

  return (
    <div
      style={{
        gridColumn: '1/-1',
        padding: '10px 16px',
        background: C.aD,
        borderBottom: `1px solid ${C.aB}`,
      }}
    >
      <button
        onClick={() => setExpanded((value) => !value)}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: C.amb, boxShadow: `0 0 0 6px ${C.aB}` }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.aT }}>
              {activeRows.length} caller{activeRows.length === 1 ? '' : 's'} holding
            </span>
          </div>
          <span style={{ fontSize: 12, color: C.t2 }}>{expanded ? 'Hide details' : 'Show details'}</span>
        </div>
      </button>
      {expanded ? (
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {activeRows.map((row) => (
            <div
              key={row.id}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: C.bg,
                border: `1px solid ${C.aB}`,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>
                {formatDisplayPhone(row.caller_phone || '')}
              </span>
              <span style={{ fontSize: 12, color: C.t2 }}>
                {row.created_at ? `${Math.max(0, Math.round((Date.now() - new Date(row.created_at).getTime()) / 1000))}s holding` : row.status}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
