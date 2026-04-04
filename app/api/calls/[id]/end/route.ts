import { createServerClient } from '@/lib/supabase';
import { getTwilioClient } from '@/lib/callmynt-calls';

export const runtime = 'nodejs';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = createServerClient();
    const callResult = await supabase.from('calls').select('*').eq('id', id).single();

    if (callResult.error) {
      return Response.json({ error: 'Call not found.' }, { status: 404 });
    }

    const call = callResult.data as Record<string, unknown>;
    if (typeof call.provider_call_id === 'string' && call.provider_call_id) {
      await getTwilioClient().calls(call.provider_call_id).update({ status: 'completed' }).catch(() => null);
    }

    await supabase.from('calls').update({
      status: 'completed',
      ended_at: new Date().toISOString(),
    }).eq('id', id);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to end call', error);
    return Response.json({ error: 'Failed to end call.' }, { status: 500 });
  }
}
