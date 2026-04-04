import twilio from 'twilio';
import { xmlResponse } from '@/lib/twilio-utils';

export const runtime = 'nodejs';

export async function POST() {
  const response = new twilio.twiml.VoiceResponse();
  response.say(
    { voice: 'alice' },
    'Thanks for calling BYRDGANG. Our team is currently unavailable. Please leave a message and we will call you back on the next business day.',
  );
  response.record({
    maxLength: 180,
    playBeep: true,
    trim: 'trim-silence',
    timeout: 5,
    recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording`,
  } as never);
  response.say({ voice: 'alice' }, 'We did not receive a message. Goodbye.');
  response.hangup();
  return xmlResponse(response);
}
