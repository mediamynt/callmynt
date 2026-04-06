import { createServerClient } from '@/lib/supabase';
import { addBusinessDays, nextBusinessMorning } from '@/lib/date';
import { getAgentIdentityFallback } from '@/lib/app-env';

export async function getAvailableInboundAgent() {
  const supabase = createServerClient();
  const result = await supabase
    .from('agents')
    .select('*')
    .in('status', ['available', 'dialing'])
    .order('created_at', { ascending: true })
    .limit(1);

  if (result.error) return null;
  return result.data?.[0] || null;
}

export async function hasAnyOnlineAgent() {
  const supabase = createServerClient();
  const result = await supabase
    .from('agents')
    .select('id', { head: true, count: 'exact' })
    .in('status', ['available', 'dialing', 'on_call', 'break']);

  return (result.count || 0) > 0;
}

export async function createCallbackQueueEntry(params: {
  courseId?: string | null;
  agentId?: string | null;
  reason: string;
  notes?: string | null;
}) {
  if (!params.courseId) return null;

  const supabase = createServerClient();
  const scheduledAt = nextBusinessMorning().toISOString();
  let campaignId: string | null = null;

  const existingCampaign = await supabase
    .from('campaigns')
    .select('id')
    .eq('name', 'Inbound Callbacks')
    .limit(1)
    .maybeSingle();

  if (!existingCampaign.error && existingCampaign.data?.id) {
    campaignId = existingCampaign.data.id as string;
  } else {
    const created = await supabase
      .from('campaigns')
      .insert({
        name: 'Inbound Callbacks',
        pipeline_stage: 'sample_follow_up',
        dialer_mode: 'preview',
        status: 'active',
      })
      .select('id')
      .single();
    campaignId = created.data?.id || null;
  }

  if (!campaignId) return null;

  const queueInsert = await supabase
    .from('campaign_queue')
    .insert({
      campaign_id: campaignId,
      course_id: params.courseId,
      agent_id: params.agentId || getAgentIdentityFallback(),
      status: 'queued',
      priority: 1000,
      scheduled_at: scheduledAt,
    })
    .select('*')
    .single();

  await supabase
    .from('courses')
    .update({
      next_follow_up_at: scheduledAt,
      notes: params.notes || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.courseId);

  return queueInsert.error ? null : queueInsert.data;
}

export async function markInboundCallVoicemail(callId: string, transcript?: string | null) {
  const supabase = createServerClient();
  const callResult = await supabase.from('calls').select('*').eq('id', callId).single();
  if (callResult.error || !callResult.data) return null;
  const call = callResult.data as Record<string, unknown>;

  await supabase
    .from('calls')
    .update({
      status: 'voicemail',
      disposition: 'Voicemail follow-up',
      spoke_to: 'voicemail',
      ended_at: new Date().toISOString(),
      notes: transcript || (call.notes as string | null) || null,
    })
    .eq('id', callId);

  const assignedAgentId =
    typeof call.agent_id === 'string' && call.agent_id
      ? call.agent_id
      : getAgentIdentityFallback();

  await createCallbackQueueEntry({
    courseId: typeof call.course_id === 'string' ? call.course_id : null,
    agentId: assignedAgentId,
    reason: 'voicemail',
    notes: transcript || null,
  });

  return call;
}

export function getEstimatedDeliveryDate() {
  return addBusinessDays(new Date(), 4).toISOString();
}
