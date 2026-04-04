'use client';

import { useEffect, useMemo, useReducer } from 'react';
import type { DialerPhase, QueueItem } from '@/lib/callmynt-shared';

type DialerMode = 'gatekeeper' | 'buyer';

type DialerState = {
  phase: DialerPhase;
  selectedCampaignId: string | null;
  queue: QueueItem[];
  currentIndex: number;
  activeCallId: string | null;
  providerCallId: string | null;
  callDuration: number;
  isMuted: boolean;
  notes: string;
  disposition: string | null;
  mode: DialerMode;
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
  inbound: boolean;
  error: string | null;
};

type DialerAction =
  | { type: 'LOAD_QUEUE'; campaignId: string; queue: QueueItem[] }
  | { type: 'SET_PHASE'; phase: DialerPhase }
  | { type: 'START_CALL'; callId: string; queueIndex: number }
  | { type: 'SET_PROVIDER_CALL_ID'; providerCallId: string | null }
  | { type: 'SYNC_STATUS'; status: string; answeredBy?: string | null }
  | { type: 'TICK' }
  | { type: 'SET_MUTED'; muted: boolean }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'SET_DISPOSITION'; disposition: string | null }
  | { type: 'ADVANCE_QUEUE' }
  | { type: 'SET_MODE'; mode: DialerMode }
  | { type: 'ADD_DTMF'; digit: string }
  | { type: 'CLEAR_DTMF' }
  | { type: 'SET_QUICK_CAPTURE'; key: keyof DialerState['quickCapture']; value: string }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_INBOUND'; inbound: boolean }
  | { type: 'RESET_CALL' };

const initialState: DialerState = {
  phase: 'IDLE',
  selectedCampaignId: null,
  queue: [],
  currentIndex: 0,
  activeCallId: null,
  providerCallId: null,
  callDuration: 0,
  isMuted: false,
  notes: '',
  disposition: null,
  mode: 'buyer',
  dtmfDigits: '',
  quickCapture: {
    buyer_name: '',
    buyer_title: '',
    buyer_direct_phone: '',
    ivr_direct_extension: '',
    ivr_pro_shop_key: '',
    ivr_notes: '',
    best_time_to_reach: '',
  },
  inbound: false,
  error: null,
};

function reducer(state: DialerState, action: DialerAction): DialerState {
  switch (action.type) {
    case 'LOAD_QUEUE':
      return {
        ...state,
        selectedCampaignId: action.campaignId,
        queue: action.queue,
        currentIndex: 0,
        phase: action.queue.length > 0 ? 'READY' : 'COMPLETE',
      };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'START_CALL':
      return {
        ...state,
        activeCallId: action.callId,
        currentIndex: action.queueIndex,
        callDuration: 0,
        disposition: null,
        dtmfDigits: '',
        phase: 'DIALING',
        inbound: false,
      };
    case 'SET_PROVIDER_CALL_ID':
      return { ...state, providerCallId: action.providerCallId };
    case 'SYNC_STATUS':
      if (action.status === 'ringing') return { ...state, phase: 'RINGING' };
      if (action.status === 'answered' || action.status === 'in-progress') return { ...state, phase: 'CONNECTED' };
      if (action.status === 'completed') {
        const disposition =
          action.answeredBy?.startsWith('machine') || action.answeredBy === 'fax'
            ? state.disposition || 'Left VM'
            : state.disposition;
        return {
          ...state,
          phase: 'WRAP-UP',
          disposition,
        };
      }
      return state;
    case 'TICK':
      if (state.phase !== 'CONNECTED') return state;
      return { ...state, callDuration: state.callDuration + 1 };
    case 'SET_MUTED':
      return { ...state, isMuted: action.muted };
    case 'SET_NOTES':
      return { ...state, notes: action.notes };
    case 'SET_DISPOSITION':
      return { ...state, disposition: action.disposition };
    case 'ADVANCE_QUEUE': {
      const nextIndex = state.currentIndex + 1;
      return {
        ...state,
        currentIndex: nextIndex,
        activeCallId: null,
        providerCallId: null,
        callDuration: 0,
        isMuted: false,
        notes: '',
        disposition: null,
        dtmfDigits: '',
        inbound: false,
        phase: nextIndex >= state.queue.length ? 'COMPLETE' : 'READY',
      };
    }
    case 'SET_MODE':
      return { ...state, mode: action.mode };
    case 'ADD_DTMF':
      return { ...state, dtmfDigits: `${state.dtmfDigits}${action.digit}` };
    case 'CLEAR_DTMF':
      return { ...state, dtmfDigits: '' };
    case 'SET_QUICK_CAPTURE':
      return {
        ...state,
        quickCapture: {
          ...state.quickCapture,
          [action.key]: action.value,
        },
      };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_INBOUND':
      return { ...state, inbound: action.inbound };
    case 'RESET_CALL':
      return {
        ...state,
        activeCallId: null,
        providerCallId: null,
        callDuration: 0,
        isMuted: false,
      };
    default:
      return state;
  }
}

export function useDialer() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.phase !== 'CONNECTED') return;
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(timer);
  }, [state.phase]);

  const currentItem = useMemo(() => state.queue[state.currentIndex] || null, [state.currentIndex, state.queue]);

  useEffect(() => {
    if (!currentItem) return;

    dispatch({
      type: 'SET_QUICK_CAPTURE',
      key: 'buyer_name',
      value: currentItem.course.buyer_name || '',
    });
    dispatch({
      type: 'SET_QUICK_CAPTURE',
      key: 'buyer_title',
      value: currentItem.course.buyer_title || '',
    });
    dispatch({
      type: 'SET_QUICK_CAPTURE',
      key: 'buyer_direct_phone',
      value: currentItem.course.buyer_direct_phone || '',
    });
    dispatch({
      type: 'SET_QUICK_CAPTURE',
      key: 'ivr_direct_extension',
      value: currentItem.course.ivr_direct_extension || '',
    });
    dispatch({
      type: 'SET_QUICK_CAPTURE',
      key: 'ivr_pro_shop_key',
      value: currentItem.course.ivr_pro_shop_key || '',
    });
    dispatch({
      type: 'SET_QUICK_CAPTURE',
      key: 'ivr_notes',
      value: currentItem.course.ivr_notes || '',
    });
  }, [currentItem]);

  return {
    state,
    dispatch,
    currentItem,
    currentCourse: currentItem?.course || null,
    hasNext: state.currentIndex < state.queue.length - 1,
  };
}
