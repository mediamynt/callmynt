import { createServerClient } from '@/lib/supabase';
import { getTwilioClient } from '@/lib/callmynt-calls';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const target = String(body.target || '').trim();

    if (!target) {
      return Response.json({ error: 'Transfer target required.' }, { status: 400 });
    }

    const supabase = createServerClient();
    const callResult = await supabase.from('calls').select('*').eq('id', id).single();
    if (callResult.error) {
      return Response.json({ error: 'Call not found.' }, { status: 404 });
    }

    const call = callResult.data as Record<string, unknown>;
    if (typeof call.provider_call_id === 'string' && call.provider_call_id) {
      const noun = target.startsWith('+') ? 'Number' : 'Client';
      await getTwilioClient().calls(call.provider_call_id).update({
        twiml: `<Response><Dial><${noun}>${target}</${noun}></Dial></Response>`,
      });
    }

    await supabase.from('calls').update({
      disposition_data: {
        ...(typeof call.disposition_data === 'object' && call.disposition_data ? call.disposition_data : {}),
        transfer_target: target,
      },
    }).eq('id', id);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to transfer call', error);
    return Response.json({ error: 'Failed to transfer call.' }, { status: 500 });
  }
}
