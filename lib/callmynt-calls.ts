import { createServerClient } from '@/lib/supabase';
import {
  getAreaCode,
  getPreferredPhone,
  getLocalTimeLabel,
  normalizePhone,
  formatDisplayPhone,
  type CallCourse,
  type CampaignRecord,
  type QueueItem,
} from '@/lib/callmynt-shared';

export function getTwilioClient() {
  const twilio = require('twilio') as any;
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

function nextBusinessDate(days: number) {
  const date = new Date();
  let remaining = days;

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }

  return date.toISOString();
}

export function getDispositionOutcome(disposition?: string | null) {
  switch (disposition) {
    case 'Got buyer name':
      return {
        spoke_to: 'gatekeeper',
        pipeline_stage_after: 'buyer_identified',
        next_follow_up_at: nextBusinessDate(1),
      };
    case 'Sending sample':
      return {
        spoke_to: 'buyer',
        pipeline_stage_after: 'sending_sample',
        next_follow_up_at: nextBusinessDate(6),
      };
    case 'Placing order!':
      return {
        spoke_to: 'buyer',
        pipeline_stage_after: 'first_order',
        next_follow_up_at: null,
      };
    case 'Call back':
      return {
        spoke_to: 'buyer',
        pipeline_stage_after: null,
        next_follow_up_at: nextBusinessDate(2),
      };
    case 'Not interested':
      return {
        spoke_to: 'buyer',
        pipeline_stage_after: null,
        next_follow_up_at: nextBusinessDate(60),
      };
    case 'Left msg':
    case 'Left VM':
      return {
        spoke_to: 'voicemail',
        pipeline_stage_after: null,
        next_follow_up_at: nextBusinessDate(2),
      };
    case 'No answer':
    case 'No buyer avail':
      return {
        spoke_to: 'gatekeeper',
        pipeline_stage_after: null,
        next_follow_up_at: nextBusinessDate(1),
      };
    case 'Bad #':
      return {
        spoke_to: 'unknown',
        pipeline_stage_after: null,
        next_follow_up_at: null,
      };
    default:
      return {
        spoke_to: null,
        pipeline_stage_after: null,
        next_follow_up_at: null,
      };
  }
}

export async function getCampaign(campaignId: string) {
  const supabase = createServerClient();
  const result = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
  if (result.error) throw result.error;
  return result.data as CampaignRecord;
}

export async function getCourse(courseId: string) {
  const supabase = createServerClient();
  const result = await supabase.from('callmynt_courses').select('*').eq('id', courseId).single();
  if (result.error) throw result.error;
  return result.data as CallCourse;
}

export async function getCourseByPhone(phone: string) {
  const supabase = createServerClient();
  const normalized = normalizePhone(phone);
  const variants = [
    normalized,
    normalized.replace(/^\+1/, ''),
    normalized.replace(/^\+/, ''),
  ].filter(Boolean);

  const orClause = variants
    .flatMap((value) => [
      `main_phone.eq.${value}`,
      `pro_shop_phone.eq.${value}`,
      `buyer_direct_phone.eq.${value}`,
    ])
    .join(',');

  const result = await supabase.from('callmynt_courses').select('*').or(orClause).limit(1);
  if (result.error) return null;
  return (result.data?.[0] || null) as CallCourse | null;
}

export async function getCallerIdForCourse(course: CallCourse, campaign?: CampaignRecord | null) {
  const supabase = createServerClient();
  const fallback = normalizePhone(process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE || '');
  const areaCode = getAreaCode(course.buyer_direct_phone || course.pro_shop_phone || course.main_phone);

  if (areaCode) {
    const localResult = await supabase
      .from('phone_numbers')
      .select('number, health_score, last_used_at')
      .eq('area_code', areaCode)
      .gte('health_score', 70)
      .order('last_used_at', { ascending: true, nullsFirst: true })
      .limit(1);

    if (!localResult.error && localResult.data && localResult.data.length > 0) {
      const match = localResult.data[0] as { number: string };
      await supabase
        .from('phone_numbers')
        .update({ last_used_at: new Date().toISOString() })
        .eq('number', match.number);
      return normalizePhone(match.number);
    }
  }

  const pool = (campaign?.caller_id_pool || []).map((value) => normalizePhone(value)).filter(Boolean);
  if (pool.length > 0) {
    return pool[Math.floor(Date.now() / 1000) % pool.length];
  }

  return fallback;
}

export async function loadCampaignQueue(campaignId: string) {
  const supabase = createServerClient();

  // Get courses that should be excluded:
  // 1. Already called today with a disposition
  // 2. Ever dispositioned as "Not interested" or "Bad #" (permanent exclusion)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: todayCalls } = await supabase
    .from('calls')
    .select('course_id')
    .eq('campaign_id', campaignId)
    .not('disposition', 'is', null)
    .gte('created_at', todayStart.toISOString());
  const { data: permanentExcludes } = await supabase
    .from('calls')
    .select('course_id')
    .in('disposition', ['Not interested', 'Bad #', 'Do not call']);
  const calledCourseIds = new Set([
    ...(todayCalls || []).map((c: { course_id: string }) => c.course_id),
    ...(permanentExcludes || []).map((c: { course_id: string }) => c.course_id),
  ]);

  const queueResult = await supabase
    .from('campaign_queue')
    .select('*')
    .eq('campaign_id', campaignId)
    .in('status', ['queued', 'retry', 'paused', 'ready'])
    .order('priority', { ascending: false })
    .order('position', { ascending: true })
    .limit(100);

  if (queueResult.error) throw queueResult.error;

  const allQueueRows = (queueResult.data || []) as Array<Record<string, unknown>>;
  // Filter out courses already called today with a disposition
  const queueRows = allQueueRows.filter((row) => !calledCourseIds.has(String(row.course_id || '')));
  if (queueRows.length === 0) return [] as QueueItem[];

  const courseIds = queueRows
    .map((row) => String(row.course_id || ''))
    .filter(Boolean);

  const courseResult = await supabase.from('callmynt_courses').select('*').in('id', courseIds);
  if (courseResult.error) throw courseResult.error;

  const courseMap = new Map(
    ((courseResult.data || []) as CallCourse[]).map((course) => [course.id, course]),
  );

  return queueRows
    .map((row) => {
      const course = courseMap.get(String(row.course_id || ''));
      if (!course) return null;
      return {
        id: String(row.id),
        campaign_id: String(row.campaign_id),
        course_id: String(row.course_id),
        position: typeof row.position === 'number' ? row.position : null,
        priority: typeof row.priority === 'number' ? row.priority : null,
        status: typeof row.status === 'string' ? row.status : null,
        scheduled_at: typeof row.scheduled_at === 'string' ? row.scheduled_at : null,
        attempts: typeof row.attempts === 'number' ? row.attempts : null,
        course,
      } satisfies QueueItem;
    })
    .filter(Boolean) as QueueItem[];
}

export async function createCallRecord(input: {
  agentId: string;
  campaignId: string;
  course: CallCourse;
  queueId?: string | null;
  phoneDialed: string;
  callerIdUsed: string;
  direction?: 'outbound' | 'inbound';
}) {
  const supabase = createServerClient();
  const callInsert = await supabase
    .from('calls')
    .insert({
      agent_id: input.agentId,
      campaign_id: input.campaignId,
      course_id: input.course.id,
      direction: input.direction || 'outbound',
      status: 'initiated',
      phone_dialed: normalizePhone(input.phoneDialed),
      caller_id_used: normalizePhone(input.callerIdUsed),
      started_at: new Date().toISOString(),
      pipeline_stage_before: input.course.pipeline_stage || null,
    })
    .select('*')
    .single();

  if (callInsert.error) throw callInsert.error;

  await supabase
    .from('callmynt_courses')
    .update({
      total_attempts: (input.course.total_attempts || 0) + 1,
      last_attempt_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.course.id);

  if (input.queueId) {
    await supabase
      .from('campaign_queue')
      .update({
        status: 'dialing',
        attempts: (input.course.total_attempts || 0) + 1,
      })
      .eq('id', input.queueId);
  }

  return callInsert.data as Record<string, unknown>;
}

export async function updateCallStatusByProviderCallId(params: {
  providerCallId: string;
  callStatus: string;
  duration?: number | null;
  answeredBy?: string | null;
}) {
  const supabase = createServerClient();
  const updates: Record<string, unknown> = {
    status: params.callStatus,
  };

  if (params.callStatus === 'answered' || params.callStatus === 'in-progress') {
    updates.connected_at = new Date().toISOString();
  }
  if (params.duration !== undefined && params.duration !== null) {
    updates.duration_seconds = params.duration;
  }
  if (params.callStatus === 'completed' || params.callStatus === 'canceled' || params.callStatus === 'failed') {
    updates.ended_at = new Date().toISOString();
  }
  if (params.answeredBy) {
    updates.disposition_data = { answered_by: params.answeredBy };
  }

  const updateResult = await supabase
    .from('calls')
    .update(updates)
    .eq('provider_call_id', params.providerCallId)
    .select('*')
    .limit(1);

  if (updateResult.error) throw updateResult.error;
  return (updateResult.data?.[0] || null) as Record<string, unknown> | null;
}

export async function applyDisposition(input: {
  callId: string;
  disposition: string;
  notes?: string | null;
  spokeTo?: string | null;
  queueId?: string | null;
  dispositionData?: Record<string, unknown> | null;
}) {
  const supabase = createServerClient();
  const callResult = await supabase.from('calls').select('*').eq('id', input.callId).single();
  if (callResult.error) throw callResult.error;

  const call = callResult.data as Record<string, unknown>;
  const courseId = String(call.course_id || '');
  const stageBefore = typeof call.pipeline_stage_before === 'string' ? call.pipeline_stage_before : null;
  const outcome = getDispositionOutcome(input.disposition);
  const spokeTo = input.spokeTo || outcome.spoke_to;

  const callUpdates: Record<string, unknown> = {
    disposition: input.disposition,
    notes: input.notes || call.notes || null,
    spoke_to: spokeTo,
    pipeline_stage_after: outcome.pipeline_stage_after || stageBefore,
    ended_at: call.ended_at || new Date().toISOString(),
    status: call.status === 'completed' ? 'completed' : 'wrap_up',
    disposition_data: {
      ...(typeof call.disposition_data === 'object' && call.disposition_data ? (call.disposition_data as Record<string, unknown>) : {}),
      ...(input.dispositionData || {}),
    },
  };

  const updatedCall = await supabase.from('calls').update(callUpdates).eq('id', input.callId).select('*').single();
  if (updatedCall.error) throw updatedCall.error;

  if (courseId) {
    const courseUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (outcome.pipeline_stage_after) {
      courseUpdates.pipeline_stage = outcome.pipeline_stage_after;
    }
    if (outcome.next_follow_up_at) {
      courseUpdates.next_follow_up_at = outcome.next_follow_up_at;
    }
    if (input.disposition === 'Bad #') {
      courseUpdates.dnc = true;
    }

    await supabase.from('callmynt_courses').update(courseUpdates).eq('id', courseId);
  }

  if (input.queueId) {
    await supabase
      .from('campaign_queue')
      .update({ status: 'completed' })
      .eq('id', input.queueId);
  } else if (courseId) {
    // Fallback: mark queue item completed by course_id if queueId wasn't passed
    await supabase
      .from('campaign_queue')
      .update({ status: 'completed' })
      .eq('course_id', courseId)
      .in('status', ['queued', 'retry', 'paused', 'ready']);
  }

  return updatedCall.data;
}

export async function saveQuickCapture(courseId: string, payload: Record<string, unknown>) {
  const supabase = createServerClient();
  const updates: Record<string, unknown> = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  if (payload.buyer_name) {
    updates.pipeline_stage = 'buyer_identified';
  }

  const result = await supabase.from('callmynt_courses').update(updates).eq('id', courseId).select('*').single();
  if (result.error) throw result.error;
  return result.data;
}

export async function dropVoicemail(providerCallId: string, campaignId?: string | null) {
  if (!campaignId) return false;

  const campaign = await getCampaign(campaignId).catch(() => null);
  if (!campaign?.voicemail_drop_url) return false;

  await getTwilioClient().calls(providerCallId).update({
    twiml: `<Response><Play>${campaign.voicemail_drop_url}</Play><Hangup/></Response>`,
  });

  return true;
}
