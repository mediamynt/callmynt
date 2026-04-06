import { createServerClient } from '@/lib/supabase';
import { addBusinessDays } from '@/lib/date';
import { verifyShopifyWebhook } from '@/lib/shopify';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-shopify-hmac-sha256');

  if (!verifyShopifyWebhook(rawBody, signature)) {
    return new Response('Invalid webhook signature', { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody) as Record<string, any>;
    const orderId = Number(body.id);
    const fulfillment = Array.isArray(body.fulfillments) ? body.fulfillments[0] : null;
    const tracking = fulfillment?.tracking_number || null;
    const carrier = fulfillment?.tracking_company || null;
    const shippedAt = new Date().toISOString();
    const estimatedDelivery = addBusinessDays(new Date(), 4).toISOString();
    const followUpDate = addBusinessDays(new Date(), 6).toISOString();
    const supabase = createServerClient();

    const sample = await supabase
      .from('samples')
      .select('*')
      .eq('shopify_order_id', orderId)
      .maybeSingle();

    if (sample.data) {
      await supabase
        .from('samples')
        .update({
          status: 'shipped',
          shipped_at: shippedAt,
          tracking_number: tracking,
          carrier,
          estimated_delivery: estimatedDelivery,
          follow_up_scheduled_at: followUpDate,
        })
        .eq('id', sample.data.id);

      await supabase
        .from('courses')
        .update({
          pipeline_stage: 'sample_follow_up',
          next_follow_up_at: followUpDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sample.data.course_id);

      const campaign = await supabase
        .from('campaigns')
        .select('id')
        .eq('pipeline_stage', 'sample_follow_up')
        .limit(1)
        .maybeSingle();

      if (campaign.data?.id) {
        await supabase.from('campaign_queue').insert({
          campaign_id: campaign.data.id,
          course_id: sample.data.course_id,
          agent_id: sample.data.agent_id,
          scheduled_at: followUpDate,
          priority: 100,
          status: 'queued',
        });
      }
    }

    await supabase
      .from('orders')
      .update({
        status: tracking ? 'fulfilled' : 'shipped',
      })
      .eq('shopify_order_id', orderId);

    return new Response('OK');
  } catch (error) {
    console.error('Failed to process Shopify fulfillment webhook', error);
    return new Response('ERROR', { status: 500 });
  }
}
