import { createServerClient } from '@/lib/supabase';
import { dropVoicemail, getTwilioClient, updateCallStatusByProviderCallId } from '@/lib/callmynt-calls';
import { markInboundCallVoicemail } from '@/lib/inbound';
import { resolveHoldQueueEntry } from '@/lib/server-utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const callSid = body.get('CallSid') as string;
    const callStatus = body.get('CallStatus') as string;
    const duration = body.get('CallDuration') as string;
    const answeredBy = body.get('AnsweredBy') as string;
    const url = new URL(req.url);
    const callId = url.searchParams.get('callId');
    const campaignId = url.searchParams.get('campaignId');
    const ivrSequence = url.searchParams.get('ivrSequence');
    const supabase = createServerClient();

    if (callId && callSid) {
      await supabase.from('calls').update({
        provider_call_id: callSid,
      }).eq('id', callId);
    }

    const updatedCall = await updateCallStatusByProviderCallId({
      providerCallId: callSid,
      callStatus,
      duration: parseInt(duration || '0', 10),
      answeredBy: answeredBy || null,
    }).catch(() => null);

    if ((callStatus === 'answered' || callStatus === 'completed') && answeredBy?.startsWith('machine')) {
      await dropVoicemail(callSid, campaignId).catch(() => false);

      if (updatedCall?.id) {
        await supabase.from('calls').update({
          disposition: 'Left VM',
          spoke_to: 'voicemail',
          status: 'completed',
          ended_at: new Date().toISOString(),
          disposition_data: {
            ...(typeof updatedCall.disposition_data === 'object' && updatedCall.disposition_data ? updatedCall.disposition_data : {}),
            answered_by: answeredBy,
            auto_voicemail_drop: true,
          },
        }).eq('id', String(updatedCall.id));
      }
    }

    if ((callStatus === 'completed' || callStatus === 'canceled') && updatedCall) {
      const direction = typeof updatedCall.direction === 'string' ? updatedCall.direction : null;
      const currentStatus = typeof updatedCall.status === 'string' ? updatedCall.status : null;
      if (direction === 'inbound' && currentStatus === 'voicemail' && typeof updatedCall.id === 'string') {
        await markInboundCallVoicemail(updatedCall.id).catch(() => null);
      }
    }

    if (['completed', 'canceled', 'failed'].includes(callStatus)) {
      await resolveHoldQueueEntry(callSid, { status: 'resolved' }).catch(() => null);
    }

    return new Response('OK');
  } catch (error) {
    console.error('Failed to process Twilio status', error);
    return new Response('ERROR', { status: 500 });
  }
}
