import { createServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    if (body.callId) {
      await supabase.from('calls').update({ status: 'paused' }).eq('id', String(body.callId));
    }

    await supabase.from('agents').update({
      status: 'break',
      updated_at: new Date().toISOString(),
    }).eq('id', String(body.agentId || 'agent-1'));

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to pause dialer', error);
    return Response.json({ error: 'Failed to pause dialer.' }, { status: 500 });
  }
}
