import twilio from 'twilio';
import { createServerClient } from '@/lib/supabase';
import { getAvailableInboundAgent } from '@/lib/inbound';
import { addRecordingStream, xmlResponse } from '@/lib/twilio-utils';
import { resolveHoldQueueEntry } from '@/lib/server-utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const response = new twilio.twiml.VoiceResponse();
  const body = await req.formData();
  const callSid = String(body.get('CallSid') || '');
  const supabase = createServerClient();

  const agent = await getAvailableInboundAgent();
  if (!agent) {
    response.redirect('/api/twilio/hold-music');
    return xmlResponse(response);
  }

  await supabase
    .from('calls')
    .update({ agent_id: agent.id, status: 'ringing' })
    .eq('provider_call_id', callSid);
  await resolveHoldQueueEntry(callSid, { status: 'bridging' }).catch(() => null);

  addRecordingStream(response, { providerCallId: callSid, agentId: String(agent.id), direction: 'inbound' });
  const dial = response.dial({
    answerOnBridge: true,
  } as never);
  const client = dial.client();
  client.identity(String(agent.id));
  client.parameter({ name: 'inbound', value: 'true' });
  client.parameter({ name: 'callSid', value: callSid });

  return xmlResponse(response);
}
