import twilio from 'twilio';
import { xmlResponse } from '@/lib/twilio-utils';
import { getAppUrl } from '@/lib/app-env';

export const runtime = 'nodejs';

export async function POST() {
  const response = new twilio.twiml.VoiceResponse();
  response.say(
    { voice: 'alice' },
    'Thanks for your patience. A BYRDGANG team member will be with you shortly.',
  );
  response.play('https://api.twilio.com/cowbell.mp3');
  response.redirect(`${getAppUrl()}/api/twilio/check-queue`);
  return xmlResponse(response);
}
