import twilio from 'twilio';
import { createServerClient } from '@/lib/supabase';
import { addRecordingStream, getTwilioRecordingCallbackUrl, getTwilioStatusCallbackUrl, xmlResponse } from '@/lib/twilio-utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.formData();
  const to = body.get('To') as string;
  const callerId = body.get('CallerId') as string || process.env.TWILIO_PHONE_NUMBER;
  const callId = body.get('callId') as string;
  const campaignId = body.get('campaignId') as string;
  const ivrSequence = body.get('ivrSequence') as string;

  const response = new twilio.twiml.VoiceResponse();
  const supabase = createServerClient();
  addRecordingStream(response, {
    callId: callId || '',
    campaignId: campaignId || '',
    providerCallId: '',
    direction: 'outbound',
  });

  if (to) {
    const dial = response.dial({
      callerId: callerId || process.env.TWILIO_PHONE_NUMBER,
      answerOnBridge: true,
    } as any);

    dial.number({
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallback: getTwilioStatusCallbackUrl({
        callId: callId || '',
        campaignId: campaignId || '',
        ivrSequence: ivrSequence || '',
      }),
      machineDetection: 'DetectMessageEnd',
      machineDetectionTimeout: 5,
    } as any, to);
  } else {
    response.say('No destination number provided.');
  }

  if (callId) {
    await supabase.from('calls').update({
      status: 'initiated',
    }).eq('id', callId);
  }

  return xmlResponse(response);
}
