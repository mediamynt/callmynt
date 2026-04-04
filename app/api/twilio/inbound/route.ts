import twilio from 'twilio';
import { createServerClient } from '@/lib/supabase';
import { getCourseByPhone } from '@/lib/callmynt-calls';
import { getAgentIdentityFallback, getAppUrl } from '@/lib/app-env';
import { addRecordingStream, xmlResponse } from '@/lib/twilio-utils';
import { getAvailableInboundAgent, hasAnyOnlineAgent } from '@/lib/inbound';
import { createOrUpdateHoldQueueEntry } from '@/lib/server-utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const from = String(body.get('From') || '');
    const to = String(body.get('To') || '');
    const callSid = String(body.get('CallSid') || '');
    const response = new twilio.twiml.VoiceResponse();
    const supabase = createServerClient();
    const course = await getCourseByPhone(from);
    const agent = await getAvailableInboundAgent();
    const anyoneOnline = await hasAnyOnlineAgent();

    await supabase.from('calls').insert({
      agent_id: agent?.id || null,
      course_id: course?.id || null,
      direction: 'inbound',
      status: agent ? 'ringing' : anyoneOnline ? 'holding' : 'voicemail',
      provider_call_id: callSid,
      phone_dialed: to,
      caller_id_used: from,
      started_at: new Date().toISOString(),
    });

    if (agent?.id) {
      addRecordingStream(response, {
        providerCallId: callSid,
        courseId: course?.id || '',
        courseName: course?.name || 'Unknown caller',
        agentId: String(agent.id),
        direction: 'inbound',
      });
      const dial = response.dial({
        answerOnBridge: true,
      });
      const client = dial.client();
      client.identity(String(agent.id));
      client.parameter({ name: 'courseId', value: course?.id || '' });
      client.parameter({ name: 'courseName', value: course?.name || 'Unknown caller' });
      client.parameter({ name: 'fromNumber', value: from });
      client.parameter({ name: 'inbound', value: 'true' });
    } else if (anyoneOnline) {
      await createOrUpdateHoldQueueEntry({
        providerCallId: callSid,
        callerPhone: from,
        inboundNumber: to,
        courseId: course?.id || null,
        status: 'holding',
      }).catch(() => null);
      response.say(
        { voice: 'alice' },
        'Thanks for calling BYRDGANG. All of our team members are helping other customers. Please stay on the line and we will be with you shortly.',
      );
      response.enqueue(
        {
          waitUrl: `${getAppUrl()}/api/twilio/hold-music`,
          waitUrlMethod: 'POST',
        } as never,
        'inbound-queue',
      );
    } else {
      await createOrUpdateHoldQueueEntry({
        providerCallId: callSid,
        callerPhone: from,
        inboundNumber: to,
        courseId: course?.id || null,
        status: 'after_hours_voicemail',
      }).catch(() => null);
      response.redirect(`${getAppUrl()}/api/twilio/after-hours`);
    }

    return xmlResponse(response);
  } catch (error) {
    console.error('Failed to handle inbound call', error);
    const response = new twilio.twiml.VoiceResponse();
    response.say('We are unable to route your call right now. Please try again later.');
    return xmlResponse(response, 500);
  }
}
