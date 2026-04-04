import crypto from 'node:crypto';
import { createServerClient } from '@/lib/supabase';
import { normalizePhone } from '@/lib/callmynt-shared';

type QueryResult<T> = {
  data: T | null;
  error: { message?: string } | null;
};

async function tryTables<T>(
  tables: readonly string[],
  runner: (table: string) => Promise<QueryResult<T>>,
) {
  let lastError: QueryResult<T>['error'] = null;

  for (const table of tables) {
    const result = await runner(table);
    if (!result.error) {
      return { ...result, table };
    }
    lastError = result.error;
  }

  return { data: null, error: lastError, table: null };
}

export const SERVER_TABLES = {
  holdQueue: ['hold_queue'],
  recordings: ['call_recordings'],
  transcripts: ['call_transcripts'],
  analysis: ['call_analysis'],
  coachingReports: ['coaching_reports'],
  sms: ['sms_messages'],
} as const;

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function getMacMiniWsUrl() {
  return process.env.MAC_MINI_WS_URL || 'ws://localhost:8765/media-stream';
}

export function getMacMiniHttpUrl() {
  return process.env.MAC_MINI_HTTP_URL || 'http://localhost:8766';
}

export function getRecordingPlaybackUrl(storagePath?: string | null) {
  if (!storagePath) return null;
  const base = getMacMiniHttpUrl().replace(/\/$/, '');
  return `${base}/recordings/${storagePath.replace(/^\/+/, '')}`;
}

export async function insertServerRecord<T>(
  tables: readonly string[],
  payload: Record<string, unknown>,
) {
  const supabase = createServerClient();
  return tryTables<T>(tables, async (table) => {
    const result = await supabase.from(table).insert(payload).select('*').single();
    return {
      data: (result.data as T | null) ?? null,
      error: result.error,
    };
  });
}

export async function updateServerRecords<T>(
  tables: readonly string[],
  matcher: (query: any) => any,
  payload: Record<string, unknown>,
) {
  const supabase = createServerClient();
  return tryTables<T>(tables, async (table) => {
    const result = await matcher(supabase.from(table).update(payload).select('*'));
    return {
      data: ((result.data as T[])?.[0] as T | null) ?? null,
      error: result.error,
    };
  });
}

export async function queryServerTable<T>(
  tables: readonly string[],
  runner: (table: string) => Promise<QueryResult<T>>,
) {
  return tryTables<T>(tables, runner);
}

export function computeAfterHoursMessage() {
  return 'Thanks for calling BYRDGANG. Our team is currently unavailable. Please leave a message and we will call you back on the next business day.';
}

export function isBusinessHours(date = new Date()) {
  const hour = date.getHours();
  const day = date.getDay();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
}

export function nextBusinessCallbackIso() {
  const date = new Date();
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

export async function findBestInboundAgent() {
  const supabase = createServerClient();
  const result = await supabase
    .from('agents')
    .select('*')
    .in('status', ['available', 'on_break', 'dialing'])
    .order('updated_at', { ascending: true, nullsFirst: true })
    .limit(20);

  if (result.error) return null;
  const agents = result.data || [];
  const immediate = agents.find((agent) => agent.status === 'available' || agent.status === 'on_break');
  return immediate || null;
}

export async function createOrUpdateHoldQueueEntry(input: {
  providerCallId: string;
  callerPhone: string;
  inboundNumber: string;
  courseId?: string | null;
  callId?: string | null;
  status?: string;
}) {
  const supabase = createServerClient();
  const normalizedPhone = normalizePhone(input.callerPhone);
  const existing = await queryServerTable<any[]>(SERVER_TABLES.holdQueue, async (table) => {
    const result = await supabase
      .from(table)
      .select('*')
      .eq('provider_call_id', input.providerCallId)
      .limit(1);
    return { data: result.data || [], error: result.error };
  });

  const payload = {
    provider_call_id: input.providerCallId,
    caller_phone: normalizedPhone,
    inbound_number: normalizePhone(input.inboundNumber),
    course_id: input.courseId || null,
    call_id: input.callId || null,
    status: input.status || 'holding',
    updated_at: new Date().toISOString(),
  };

  if (existing.data && existing.data.length > 0) {
    return updateServerRecords<any>(
      SERVER_TABLES.holdQueue,
      (query) => query.eq('provider_call_id', input.providerCallId).limit(1),
      payload,
    );
  }

  return insertServerRecord<any>(SERVER_TABLES.holdQueue, {
    ...payload,
    created_at: new Date().toISOString(),
  });
}

export async function resolveHoldQueueEntry(providerCallId: string, updates: Record<string, unknown> = {}) {
  return updateServerRecords<any>(
    SERVER_TABLES.holdQueue,
    (query) => query.eq('provider_call_id', providerCallId).limit(1),
    {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...updates,
    },
  );
}

export async function storeRecordingMetadata(input: {
  callId: string;
  storagePath: string;
  durationSeconds?: number | null;
  transcriptionStatus?: string;
  analysisStatus?: string;
}) {
  const supabase = createServerClient();
  const existing = await queryServerTable<any[]>(SERVER_TABLES.recordings, async (table) => {
    const result = await supabase.from(table).select('*').eq('call_id', input.callId).limit(1);
    return { data: result.data || [], error: result.error };
  });

  const payload = {
    call_id: input.callId,
    storage_path: input.storagePath,
    duration_seconds: input.durationSeconds ?? null,
    transcription_status: input.transcriptionStatus || 'pending',
    analysis_status: input.analysisStatus || 'pending',
  };

  if (existing.data && existing.data.length > 0) {
    return updateServerRecords<any>(
      SERVER_TABLES.recordings,
      (query) => query.eq('call_id', input.callId).limit(1),
      payload,
    );
  }

  return insertServerRecord<any>(SERVER_TABLES.recordings, payload);
}

export async function storeTranscript(input: {
  callId: string;
  fullText: string;
  segments?: unknown[];
  agentWordCount?: number;
  prospectWordCount?: number;
}) {
  const supabase = createServerClient();
  const existing = await queryServerTable<any[]>(SERVER_TABLES.transcripts, async (table) => {
    const result = await supabase.from(table).select('*').eq('call_id', input.callId).limit(1);
    return { data: result.data || [], error: result.error };
  });

  const payload = {
    call_id: input.callId,
    full_text: input.fullText,
    segments: input.segments || [],
    agent_word_count: input.agentWordCount ?? null,
    prospect_word_count: input.prospectWordCount ?? null,
  };

  if (existing.data && existing.data.length > 0) {
    return updateServerRecords<any>(
      SERVER_TABLES.transcripts,
      (query) => query.eq('call_id', input.callId).limit(1),
      payload,
    );
  }

  return insertServerRecord<any>(SERVER_TABLES.transcripts, payload);
}

export function verifyShopifyWebhook(body: string, signature: string | null) {
  if (!process.env.SHOPIFY_WEBHOOK_SECRET || !signature) return false;
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
