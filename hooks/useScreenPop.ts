'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type ScreenPopRecord = {
  id: string;
  agent_id?: string | null;
  course_id?: string | null;
  provider_call_id?: string | null;
  caller_id_used?: string | null;
  phone_dialed?: string | null;
  direction?: string | null;
  status?: string | null;
  disposition?: string | null;
};

export function useScreenPop(agentId: string) {
  const [screenPop, setScreenPop] = useState<ScreenPopRecord | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`screen-pop-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          const record = (payload.eventType === 'DELETE' ? payload.old : payload.new) as ScreenPopRecord;
          if (record.direction !== 'inbound') return;

          if (['ringing', 'queued', 'holding', 'in-progress', 'answered'].includes(record.status || '')) {
            setScreenPop(record);
            return;
          }

          if (['completed', 'canceled', 'failed', 'wrap_up'].includes(record.status || '')) {
            setScreenPop((current) => (current?.id === record.id ? null : current));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [agentId]);

  return {
    screenPop,
    clearScreenPop: () => setScreenPop(null),
  };
}

