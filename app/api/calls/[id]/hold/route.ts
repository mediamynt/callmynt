import { createServerClient } from '@/lib/supabase';
import { getTwilioClient } from '@/lib/callmynt-calls';
import { getAppUrl } from '@/lib/app-env';

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
      await getTwilioClient().calls(call.provider_call_id).update({
        twiml: `<Response><Redirect method="POST">${getAppUrl()}/api/twilio/hold-music</Redirect></Response>`,
      });
    }

    await supabase.from('calls').update({ status: 'hold' }).eq('id', id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to hold call', error);
    return Response.json({ error: 'Failed to hold call.' }, { status: 500 });
  }
}
