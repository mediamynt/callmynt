import {
  createCallRecord,
  getCallerIdForCourse,
  getCampaign,
  getCourse,
} from '@/lib/callmynt-calls';
import { getPreferredPhone, normalizePhone } from '@/lib/callmynt-shared';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const course = await getCourse(String(body.courseId));
    const campaign = await getCampaign(String(body.campaignId));
    const phone = getPreferredPhone(course);
    const callerId = await getCallerIdForCourse(course, campaign);

    const call = await createCallRecord({
      agentId: String(body.agentId || 'agent-1'),
      campaignId: String(body.campaignId),
      course,
      queueId: body.queueId ? String(body.queueId) : null,
      phoneDialed: phone.value || '',
      callerIdUsed: callerId,
    });

    return Response.json({
      callId: call.id,
      phoneNumber: normalizePhone(phone.value),
      callerId,
      phoneLabel: phone.label,
      twilioParams: {
        To: normalizePhone(phone.value),
        CallerId: callerId,
        callId: String(call.id),
        courseId: course.id,
        campaignId: String(body.campaignId),
        agentId: String(body.agentId || 'agent-1'),
        queueId: body.queueId ? String(body.queueId) : '',
        voicemailDropUrl: campaign.voicemail_drop_url || '',
        ivrSequence: course.ivr_pro_shop_key || '',
      },
    });
  } catch (error) {
    console.error('Failed to initiate call', error);
    return Response.json({ error: 'Failed to initiate call.' }, { status: 500 });
  }
}
