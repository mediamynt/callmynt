import { createServerClient } from '@/lib/supabase';
import { loadCampaignQueue } from '@/lib/callmynt-calls';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();
    const campaignId = String(body.campaignId);

    await supabase.from('agents').update({
      status: 'available',
      updated_at: new Date().toISOString(),
    }).eq('id', String(body.agentId || 'agent-1'));

    const queue = await loadCampaignQueue(campaignId);
    return Response.json({ ok: true, queue });
  } catch (error) {
    console.error('Failed to resume dialer', error);
    return Response.json({ error: 'Failed to resume dialer.' }, { status: 500 });
  }
}
