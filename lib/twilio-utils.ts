import twilio from 'twilio';
import { getAppUrl, getRecordingWebSocketUrl } from '@/lib/app-env';

type StreamParams = Record<string, string | null | undefined>;

export function xmlResponse(response: twilio.twiml.VoiceResponse, status = 200) {
  return new Response(response.toString(), {
    status,
    headers: { 'Content-Type': 'text/xml' },
  });
}

export function addRecordingStream(
  response: twilio.twiml.VoiceResponse,
  params: StreamParams = {},
) {
  const url = getRecordingWebSocketUrl();
  if (!url) return;

  try {
    const start = response.start();
    const stream = start.stream({ url, track: 'both_tracks' } as never);
    Object.entries(params).forEach(([name, value]) => {
      if (!value) return;
      stream.parameter({ name, value });
    });
  } catch (error) {
    console.error('Failed to attach Twilio media stream', error);
  }
}

export function getTwilioStatusCallbackUrl(searchParams: Record<string, string>) {
  const url = new URL('/api/twilio/status', getAppUrl());
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
}

export function getTwilioRecordingCallbackUrl() {
  return new URL('/api/twilio/recording', getAppUrl()).toString();
}
