'use client';
import { Device, Call } from '@twilio/voice-sdk';
import { useState, useEffect, useRef, useCallback } from 'react';

type TwilioCallbacks = {
  onReady?: () => void;
  onOffline?: () => void;
  onIncoming?: (call: Call) => void;
  onRinging?: (call: Call) => void;
  onConnected?: (call: Call) => void;
  onDisconnect?: (call: Call) => void;
  onCancel?: (call: Call) => void;
  onError?: (message: string) => void;
  onProviderCallId?: (providerCallId: string | null) => void;
};

function getFriendlyError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('media') || msg.includes('getUserMedia') || msg.includes('NotReadableError')) {
    return 'Microphone unavailable — close other apps using your mic and try again.';
  }
  if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
    return 'Microphone permission denied — allow mic access in your browser settings.';
  }
  return msg;
}

export function useTwilio(agentId: string, callbacks: TwilioCallbacks = {}) {
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const [status, setStatus] = useState<'offline' | 'ready' | 'connecting' | 'ringing' | 'on-call'>('offline');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setError(null);
        const res = await fetch(`/api/twilio/token?agentId=${agentId}`);
        const { token } = await res.json();

        const device = new Device(token, {
          logLevel: 1,
          codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
          closeProtection: true,
        });

        device.on('registered', () => {
          setStatus('ready');
          setError(null);
          callbacks.onReady?.();
        });

        device.on('error', (err) => {
          console.error('Twilio device error:', err);
          const message = getFriendlyError(err);
          setError(message);
          callbacks.onError?.(message);
        });

        device.on('incoming', (call: Call) => {
          call.accept();
          callRef.current = call;
          setStatus('on-call');
          setError(null);
          setupCallHandlers(call);
          callbacks.onIncoming?.(call);
        });

        device.on('tokenWillExpire', async () => {
          const res = await fetch(`/api/twilio/token?agentId=${agentId}`);
          const { token } = await res.json();
          device.updateToken(token);
        });

        device.on('unregistered', () => {
          setStatus('offline');
          callbacks.onOffline?.();
        });

        await device.register();
        deviceRef.current = device;
      } catch (err: unknown) {
        console.error('Failed to initialize Twilio:', err);
        const message = getFriendlyError(err);
        setError(`Failed to connect to phone system: ${message}`);
        callbacks.onError?.(message);
      }
    }

    init();
    return () => {
      deviceRef.current?.destroy();
    };
  }, [agentId, callbacks]);

  function setupCallHandlers(call: Call) {
    const parameters = call.parameters as Record<string, string | undefined>;
    callbacks.onProviderCallId?.(parameters.CallSid || null);

    call.on('ringing', () => {
      setStatus('ringing');
      callbacks.onRinging?.(call);
    });
    call.on('accept', () => {
      setStatus('on-call');
      setError(null);
      callbacks.onConnected?.(call);
    });
    call.on('disconnect', () => {
      callRef.current = null;
      setStatus('ready');
      setIsMuted(false);
      callbacks.onDisconnect?.(call);
    });
    call.on('cancel', () => {
      callRef.current = null;
      setStatus('ready');
      setIsMuted(false);
      callbacks.onCancel?.(call);
    });
    call.on('error', (err) => {
      console.error('Call error:', err);
      const message = getFriendlyError(err);
      setError(`Call failed: ${message}`);
      callbacks.onError?.(message);
      setStatus('ready');
    });
  }

  const makeCall = useCallback(async (phoneNumber: string, params?: Record<string, string>) => {
    if (!deviceRef.current) {
      setError('Phone system not ready — refresh the page.');
      return;
    }
    setStatus('connecting');
    setError(null);
    
    try {
      const call = await deviceRef.current.connect({
        params: {
          To: phoneNumber,
          CallerId: process.env.NEXT_PUBLIC_TWILIO_PHONE || '',
          ...params,
        },
      });
      callRef.current = call;
      setupCallHandlers(call);
      callbacks.onProviderCallId?.((call.parameters as Record<string, string | undefined>).CallSid || null);
      return call;
    } catch (err: unknown) {
      console.error('Failed to make call:', err);
      const message = getFriendlyError(err);
      setError(`Failed to place call: ${message}`);
      callbacks.onError?.(message);
      setStatus('ready');
    }
  }, [callbacks]);

  const hangup = useCallback(() => { callRef.current?.disconnect(); }, []);

  const mute = useCallback(() => {
    if (callRef.current) {
      const newMuted = !callRef.current.isMuted();
      callRef.current.mute(newMuted);
      setIsMuted(newMuted);
    }
  }, []);

  const sendDigits = useCallback((digits: string) => {
    callRef.current?.sendDigits(digits);
  }, []);

  const hold = useCallback(async (callId: string) => {
    await fetch(`/api/calls/${callId}/hold`, { method: 'POST' });
  }, []);

  const transfer = useCallback(async (callId: string, target: string) => {
    await fetch(`/api/calls/${callId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
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
    currentCall: callRef.current,
  };
}
