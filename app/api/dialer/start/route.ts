import { createServerClient } from '@/lib/supabase';
import { getCampaign, loadCampaignQueue } from '@/lib/callmynt-calls';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const campaignId = String(body.campaignId);
    const agentId = String(body.agentId || 'agent-1');
    const supabase = createServerClient();
    const campaign = await getCampaign(campaignId);
    const queue = await loadCampaignQueue(campaignId);

    await supabase.from('agents').update({
      status: 'available',
      updated_at: new Date().toISOString(),
    }).eq('id', agentId);

    return Response.json({ campaign, queue });
  } catch (error) {
    console.error('Failed to start dialer', error);
    return Response.json({ error: 'Failed to start dialer.' }, { status: 500 });
  }
}
