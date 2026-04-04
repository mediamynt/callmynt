import { applyDisposition } from '@/lib/callmynt-calls';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const call = await applyDisposition({
      callId: id,
      disposition: String(body.disposition),
      notes: typeof body.notes === 'string' ? body.notes : null,
      spokeTo: typeof body.spokeTo === 'string' ? body.spokeTo : null,
      queueId: typeof body.queueId === 'string' ? body.queueId : null,
      dispositionData: typeof body.dispositionData === 'object' ? body.dispositionData : null,
    });

    return Response.json({ ok: true, call });
  } catch (error) {
    console.error('Failed to save disposition', error);
    return Response.json({ error: 'Failed to save disposition.' }, { status: 500 });
  }
}
