'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/constants';
import { formatDisplayPhone } from '@/lib/callmynt-shared';
import { formatDuration } from '@/lib/date';
import { useToast } from '@/components/providers/ToastProvider';

type HeldCall = {
  id: string;
  provider_call_id?: string | null;
  course_id?: string | null;
  caller_id_used?: string | null;
  phone_dialed?: string | null;
  started_at?: string | null;
  agent_id?: string | null;
  status?: string | null;
  direction?: string | null;
};

export function GlobalHoldQueueBanner() {
  const [expanded, setExpanded] = useState(false);
  const [heldCalls, setHeldCalls] = useState<HeldCall[]>([]);
  const [courseNames, setCourseNames] = useState<Record<string, string>>({});
  const { pushToast } = useToast();

  useEffect(() => {
    let mounted = true;

    async function load() {
      const result = await supabase
        .from('calls')
        .select('id, provider_call_id, course_id, caller_id_used, phone_dialed, started_at, agent_id, status')
        .eq('direction', 'inbound')
        .in('status', ['holding', 'ringing'])
        .order('started_at', { ascending: true });

      if (!mounted) return;
      const rows = (result.data || []) as HeldCall[];
      setHeldCalls(rows);

      const courseIds = [...new Set(rows.map((row) => row.course_id).filter(Boolean))] as string[];
      if (courseIds.length > 0) {
        const courseResult = await supabase.from('callmynt_courses').select('id, name').in('id', courseIds);
        if (!mounted) return;
        setCourseNames(
          Object.fromEntries((courseResult.data || []).map((course) => [course.id, course.name])),
        );
      } else {
        setCourseNames({});
      }
    }

    void load();

    const channel = supabase
      .channel('global-hold-queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls' },
        (payload) => {
          const next = payload.new as HeldCall;
          if (payload.eventType === 'INSERT' && next.direction === 'inbound' && next.status === 'holding') {
            pushToast({
              title: 'Inbound caller holding',
              detail: formatDisplayPhone(next.caller_id_used || ''),
              tone: 'info',
            });
          }
          void load();
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [pushToast]);

  const rows = useMemo(() => heldCalls.map((call) => {
    const seconds = call.started_at ? Math.floor((Date.now() - new Date(call.started_at).getTime()) / 1000) : 0;
    return {
      ...call,
      holdTime: formatDuration(seconds),
      courseName: call.course_id ? courseNames[call.course_id] : '',
    };
  }), [courseNames, heldCalls]);

  if (rows.length === 0) return null;

  return (
    <div style={{ gridColumn: '1/-1', background: C.oD, borderBottom: `1px solid ${C.oB}`, padding: '10px 16px', position: 'relative', zIndex: 40 }}>
      <button
        onClick={() => setExpanded((value) => !value)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.red }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.oT }}>
            {rows.length} caller{rows.length === 1 ? '' : 's'} holding
          </span>
          <span style={{ fontSize: 12, color: C.t2 }}>
            {rows[0]?.courseName || formatDisplayPhone(rows[0]?.caller_id_used || '')}
          </span>
        </div>
        <span style={{ fontSize: 12, color: C.oT, fontWeight: 700 }}>{expanded ? 'Hide' : 'Show'}</span>
      </button>
      {expanded ? (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {rows.map((call) => (
            <div key={call.id} style={{ background: C.bg, border: `1px solid ${C.oB}`, borderRadius: 12, padding: '10px 12px', display: 'grid', gridTemplateColumns: '1.4fr 120px 120px', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>
                  {call.courseName || 'Unknown caller'}
                </div>
                <div style={{ fontSize: 12, color: C.t2 }}>
                  {formatDisplayPhone(call.caller_id_used || '')} · Called {formatDisplayPhone(call.phone_dialed || '')}
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.t2 }}>Hold {call.holdTime}</div>
              <button
                onClick={() => window.location.assign('/dialer')}
                style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${C.oB}`, background: C.bg, color: C.oT, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Open dialer
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
