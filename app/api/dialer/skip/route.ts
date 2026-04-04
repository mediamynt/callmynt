import { createServerClient } from '@/lib/supabase';

function nextDayIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();
    const queueId = body.queueId ? String(body.queueId) : null;
    const courseId = body.courseId ? String(body.courseId) : null;
    const reason = String(body.reason || 'skip');

    if (queueId) {
      await supabase.from('campaign_queue').update({
        status: reason === 'outside_calling_hours' ? 'queued' : 'skipped',
        scheduled_at: reason === 'outside_calling_hours' ? nextDayIso() : null,
      }).eq('id', queueId);
    }

    if (courseId) {
      await supabase.from('callmynt_courses').update({
        last_attempt_at: new Date().toISOString(),
        next_follow_up_at: reason === 'outside_calling_hours' ? nextDayIso() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', courseId);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to skip queue item', error);
    return Response.json({ error: 'Failed to skip queue item.' }, { status: 500 });
  }
}
