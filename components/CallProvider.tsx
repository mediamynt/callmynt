'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { Call } from '@twilio/voice-sdk';
import { supabase } from '@/lib/supabase';
import {
  formatDisplayPhone,
  getLocalTimeLabel,
  getPreferredPhone,
} from '@/lib/callmynt-shared';
import type { QueueItem } from '@/lib/callmynt-shared';
import { useDialer } from '@/hooks/useDialer';
import { useTwilio } from '@/hooks/useTwilio';
import { useToast } from '@/components/providers/ToastProvider';

type CampaignPreview = {
  id: string;
  name: string;
  pipeline_stage: string;
  dialer_mode: string;
  course_count: number;
};

type CallContextType = {
  phase: string;
  status: 'offline' | 'ready' | 'connecting' | 'ringing' | 'on-call';
  isMuted: boolean;
  callDuration: number;
  currentCourse: QueueItem['course'] | null;
  currentQueueItem: QueueItem | null;
  currentCallId: string | null;
  currentProviderCallId: string | null;
  currentCallerId: string | null;
  queue: QueueItem[];
  currentIndex: number;
  notes: string;
  disposition: string | null;
  mode: 'gatekeeper' | 'buyer';
  dtmfDigits: string;
  quickCapture: {
    buyer_name: string;
    buyer_title: string;
    buyer_direct_phone: string;
    ivr_direct_extension: string;
    ivr_pro_shop_key: string;
    ivr_notes: string;
    best_time_to_reach: string;
  };
  error: string | null;
  localTimeLabel: string | null;
  phoneLabel: string;
  displayPhone: string;
  clearError: () => void;
  prepareCampaign: (campaign: CampaignPreview) => Promise<void>;
  startDialing: () => Promise<void>;
  pauseDialer: () => Promise<void>;
  resumeDialer: () => Promise<void>;
  endCall: () => Promise<void>;
  mute: () => void;
  holdCall: () => Promise<void>;
  transferCall: (target: string) => Promise<void>;
  sendDigits: (digit: string) => void;
  setNotes: (value: string) => void;
  setDisposition: (value: string | null) => void;
  submitDisposition: (overrideDisposition?: string | null) => Promise<void>;
  skipCurrent: (reason?: string) => Promise<void>;
  setMode: (value: 'gatekeeper' | 'buyer') => void;
  setQuickCaptureField: (key: keyof CallContextType['quickCapture'], value: string) => void;
  saveQuickCapture: () => Promise<void>;
  saveIvrShortcut: () => Promise<void>;
};

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children, agentId }: { children: React.ReactNode; agentId: string }) {
  const { state, dispatch, currentItem, currentCourse } = useDialer();
  const latestStateRef = useRef(state);
  const latestCallerIdRef = useRef<string | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  const handleRealtimeSync = useCallback((payload: Record<string, unknown>) => {
    const status = typeof payload.status === 'string' ? payload.status : '';
    const dispositionData =
      typeof payload.disposition_data === 'object' && payload.disposition_data
        ? (payload.disposition_data as Record<string, unknown>)
        : {};
    const answeredBy =
      typeof dispositionData.answered_by === 'string'
        ? dispositionData.answered_by
        : null;

    if (typeof payload.provider_call_id === 'string') {
      dispatch({ type: 'SET_PROVIDER_CALL_ID', providerCallId: payload.provider_call_id });
    }

    if (status) {
      dispatch({ type: 'SYNC_STATUS', status, answeredBy });
    }
  }, [dispatch]);

  useEffect(() => {
    if (!state.activeCallId) return;

    const channel = supabase
      .channel(`call-${state.activeCallId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${state.activeCallId}`,
        },
        (payload) => {
          const record =
            payload.eventType === 'DELETE'
              ? (payload.old as Record<string, unknown>)
              : (payload.new as Record<string, unknown>);
          handleRealtimeSync(record);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [handleRealtimeSync, state.activeCallId]);

  useEffect(() => {
    const channel = supabase
      .channel(`agent-inbound-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          const record = payload.new as Record<string, unknown>;
          if (record.direction !== 'inbound') return;
          const caller = typeof record.caller_id_used === 'string' ? record.caller_id_used : '';
          pushToast({
            title: 'Inbound call routed to you',
            detail: caller ? formatDisplayPhone(caller) : 'Open the dialer to take the call.',
            tone: 'info',
          });
          if (typeof window !== 'undefined' && window.location.pathname !== '/dialer') {
            window.location.assign('/dialer');
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [agentId, pushToast]);

  const twilioCallbacks = useMemo(() => ({
    onReady: () => {
      if (latestStateRef.current.phase === 'IDLE' && latestStateRef.current.queue.length === 0) return;
      if (latestStateRef.current.phase === 'DIALING' || latestStateRef.current.phase === 'RINGING') return;
      dispatch({ type: 'SET_PHASE', phase: latestStateRef.current.queue.length > 0 ? 'READY' : 'IDLE' });
    },
    onIncoming: (call: Call) => {
      dispatch({ type: 'SET_INBOUND', inbound: true });
      dispatch({ type: 'SET_PHASE', phase: 'CONNECTED' });
      dispatch({ type: 'SET_PROVIDER_CALL_ID', providerCallId: (call.parameters as Record<string, string | undefined>).CallSid || null });
    },
    onRinging: () => {
      dispatch({ type: 'SET_PHASE', phase: 'RINGING' });
    },
    onConnected: () => {
      dispatch({ type: 'SET_PHASE', phase: 'CONNECTED' });
    },
    onDisconnect: () => {
      if (latestStateRef.current.phase === 'CONNECTED' || latestStateRef.current.phase === 'RINGING' || latestStateRef.current.phase === 'DIALING') {
        dispatch({ type: 'SET_PHASE', phase: 'WRAP-UP' });
      }
    },
    onCancel: () => {
      dispatch({ type: 'SET_PHASE', phase: 'WRAP-UP' });
    },
    onError: (message: string) => {
      dispatch({ type: 'SET_ERROR', error: message });
    },
    onProviderCallId: (providerCallId: string | null) => {
      dispatch({ type: 'SET_PROVIDER_CALL_ID', providerCallId });
    },
  }), [dispatch]);

  const {
    status,
    makeCall,
    hangup,
    mute,
    hold,
    transfer,
    sendDigits,
    isMuted,
    error,
    clearError,
  } = useTwilio(agentId, twilioCallbacks);

  const prepareCampaign = useCallback(async (campaign: CampaignPreview) => {
    const response = await fetch('/api/dialer/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: campaign.id, agentId }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to load dialer queue.');
    }

    const data = await response.json();
    dispatch({
      type: 'LOAD_QUEUE',
      campaignId: campaign.id,
      queue: (data.queue || []) as QueueItem[],
    });
  }, [agentId, dispatch]);

  const dialIndex = useCallback(async (queueIndex: number) => {
    const queueItem = latestStateRef.current.queue[queueIndex];
    if (!queueItem) return;

    const response = await fetch('/api/calls/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId,
        campaignId: queueItem.campaign_id,
        courseId: queueItem.course_id,
        queueId: queueItem.id,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to initiate call.');
    }

    const payload = await response.json();
    latestCallerIdRef.current = payload.callerId || null;
    dispatch({ type: 'START_CALL', callId: payload.callId, queueIndex });

    await makeCall(payload.phoneNumber, payload.twilioParams);
  }, [agentId, dispatch, makeCall]);

  const startDialing = useCallback(async () => {
    if (!latestStateRef.current.queue.length) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    await dialIndex(latestStateRef.current.currentIndex);
  }, [dialIndex]);

  const pauseDialer = useCallback(async () => {
    if (state.selectedCampaignId) {
      await fetch('/api/dialer/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: state.selectedCampaignId, agentId, callId: state.activeCallId }),
      });
    }
    dispatch({ type: 'SET_PHASE', phase: 'PAUSED' });
  }, [agentId, dispatch, state.activeCallId, state.selectedCampaignId]);

  const resumeDialer = useCallback(async () => {
    if (state.selectedCampaignId) {
      const response = await fetch('/api/dialer/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: state.selectedCampaignId, agentId }),
      });
      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: 'LOAD_QUEUE',
          campaignId: state.selectedCampaignId,
          queue: (data.queue || []) as QueueItem[],
        });
      }
    }
    dispatch({ type: 'SET_PHASE', phase: state.queue.length > 0 ? 'READY' : 'COMPLETE' });
  }, [agentId, dispatch, state.queue.length, state.selectedCampaignId]);

  const endCall = useCallback(async () => {
    if (state.activeCallId) {
      await fetch(`/api/calls/${state.activeCallId}/end`, { method: 'POST' });
    }
    hangup();
  }, [hangup, state.activeCallId]);

  const holdCall = useCallback(async () => {
    if (!state.activeCallId) return;
    await hold(state.activeCallId);
  }, [hold, state.activeCallId]);

  const transferCall = useCallback(async (target: string) => {
    if (!state.activeCallId) return;
    await transfer(state.activeCallId, target);
  }, [state.activeCallId, transfer]);

  const setNotes = useCallback((value: string) => {
    dispatch({ type: 'SET_NOTES', notes: value });
  }, [dispatch]);

  const setDisposition = useCallback((value: string | null) => {
    dispatch({ type: 'SET_DISPOSITION', disposition: value });
  }, [dispatch]);

  const submitDisposition = useCallback(async (overrideDisposition?: string | null) => {
    const dispositionValue = overrideDisposition ?? latestStateRef.current.disposition;
    if (!latestStateRef.current.activeCallId || !dispositionValue) return;

    await fetch(`/api/calls/${latestStateRef.current.activeCallId}/disposition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disposition: dispositionValue,
        notes: latestStateRef.current.notes,
        queueId: latestStateRef.current.queue[latestStateRef.current.currentIndex]?.id,
        spokeTo: latestStateRef.current.mode === 'gatekeeper' ? 'gatekeeper' : 'buyer',
        dispositionData: {
          quick_capture: latestStateRef.current.quickCapture,
          inbound: latestStateRef.current.inbound,
          dtmf_digits: latestStateRef.current.dtmfDigits,
        },
      }),
    });

    dispatch({ type: 'ADVANCE_QUEUE' });
  }, [dispatch]);

  const skipCurrent = useCallback(async (reason?: string) => {
    const queueItem = latestStateRef.current.queue[latestStateRef.current.currentIndex];
    await fetch('/api/dialer/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: latestStateRef.current.selectedCampaignId,
        agentId,
        queueId: queueItem?.id,
        courseId: queueItem?.course_id,
        reason: reason || 'skip',
      }),
    });

    if (latestStateRef.current.activeCallId) {
      hangup();
    }
    dispatch({ type: 'ADVANCE_QUEUE' });
  }, [agentId, dispatch, hangup]);

  const setMode = useCallback((value: 'gatekeeper' | 'buyer') => {
    dispatch({ type: 'SET_MODE', mode: value });
  }, [dispatch]);

  const setQuickCaptureField = useCallback((key: keyof CallContextType['quickCapture'], value: string) => {
    dispatch({ type: 'SET_QUICK_CAPTURE', key, value });
  }, [dispatch]);

  const saveQuickCapture = useCallback(async () => {
    if (!currentCourse) return;
    await supabase.from('courses').update({
      buyer_name: state.quickCapture.buyer_name || null,
      buyer_title: state.quickCapture.buyer_title || null,
      buyer_direct_phone: state.quickCapture.buyer_direct_phone || null,
      ivr_direct_extension: state.quickCapture.ivr_direct_extension || null,
      best_time_to_reach: state.quickCapture.best_time_to_reach || null,
      pipeline_stage: state.quickCapture.buyer_name ? 'buyer_identified' : currentCourse.pipeline_stage,
      updated_at: new Date().toISOString(),
    }).eq('id', currentCourse.id);
  }, [currentCourse, state.quickCapture]);

  const saveIvrShortcut = useCallback(async () => {
    if (!currentCourse) return;
    await supabase.from('courses').update({
      ivr_pro_shop_key: state.quickCapture.ivr_pro_shop_key || null,
      ivr_notes: state.quickCapture.ivr_notes || null,
      ivr_direct_extension: state.quickCapture.ivr_direct_extension || null,
      updated_at: new Date().toISOString(),
    }).eq('id', currentCourse.id);
  }, [currentCourse, state.quickCapture.ivr_direct_extension, state.quickCapture.ivr_notes, state.quickCapture.ivr_pro_shop_key]);

  const handleSendDigits = useCallback((digit: string) => {
    dispatch({ type: 'ADD_DTMF', digit });
    sendDigits(digit);
  }, [dispatch, sendDigits]);

  useEffect(() => {
    dispatch({ type: 'SET_ERROR', error });
  }, [dispatch, error]);

  const preferredPhone = currentCourse ? getPreferredPhone(currentCourse) : { label: 'Main', value: '' };

  const value = useMemo<CallContextType>(() => ({
    phase: state.phase,
    status,
    isMuted,
    callDuration: state.callDuration,
    currentCourse,
    currentQueueItem: currentItem,
    currentCallId: state.activeCallId,
    currentProviderCallId: state.providerCallId,
    currentCallerId: latestCallerIdRef.current,
    queue: state.queue,
    currentIndex: state.currentIndex,
    notes: state.notes,
    disposition: state.disposition,
    mode: state.mode,
    dtmfDigits: state.dtmfDigits,
    quickCapture: state.quickCapture,
    error: state.error,
    localTimeLabel: getLocalTimeLabel(currentCourse?.timezone),
    phoneLabel: preferredPhone.label,
    displayPhone: formatDisplayPhone(preferredPhone.value),
    clearError,
    prepareCampaign,
    startDialing,
    pauseDialer,
    resumeDialer,
    endCall,
    mute: () => {
      mute();
      dispatch({ type: 'SET_MUTED', muted: !isMuted });
    },
    holdCall,
    transferCall,
    sendDigits: handleSendDigits,
    setNotes,
    setDisposition,
    submitDisposition,
    skipCurrent,
    setMode,
    setQuickCaptureField,
    saveQuickCapture,
    saveIvrShortcut,
  }), [
    clearError,
    currentCourse,
    currentItem,
    dispatch,
    endCall,
    handleSendDigits,
    holdCall,
    isMuted,
    mute,
    pauseDialer,
    preferredPhone.label,
    preferredPhone.value,
    prepareCampaign,
    resumeDialer,
    saveIvrShortcut,
    saveQuickCapture,
    setDisposition,
    setMode,
    setNotes,
    setQuickCaptureField,
    startDialing,
    state,
    status,
    submitDisposition,
    transferCall,
    skipCurrent,
  ]);

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
}
