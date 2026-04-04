import crypto from 'node:crypto';
import { hasShopifyConfig } from '@/lib/app-env';

type ShopifyAddress = {
  address1: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  first_name?: string;
  last_name?: string;
};

type DraftOrderInput = {
  email?: string | null;
  note?: string;
  tags?: string[];
  shippingAddress: ShopifyAddress;
  lineItems: Array<Record<string, unknown>>;
  paymentPending?: boolean;
};

function getAdminBaseUrl() {
  return `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01`;
}

export function parseAddress(raw: string, buyerName?: string | null): ShopifyAddress {
  const lines = raw
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);
  const [firstName, ...restName] = (buyerName || '').trim().split(/\s+/);
  const lastLine = lines.at(-1) || '';
  const cityStateZipMatch = lastLine.match(/^(.*?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);

  return {
    address1: lines[0] || raw.trim() || 'Unknown address',
    city: cityStateZipMatch?.[1] || '',
    province: cityStateZipMatch?.[2]?.toUpperCase() || '',
    zip: cityStateZipMatch?.[3] || '',
    country: 'US',
    first_name: firstName || undefined,
    last_name: restName.join(' ') || undefined,
  };
}

async function shopifyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!hasShopifyConfig()) {
    throw new Error('Shopify is not configured.');
  }

  const response = await fetch(`${getAdminBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify request failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function getSampleVariantId(size: string, color: string) {
  const productId = process.env.SHOPIFY_SAMPLE_PRODUCT_ID;
  if (!productId) {
    throw new Error('SHOPIFY_SAMPLE_PRODUCT_ID is not configured.');
  }

  const response = await shopifyFetch<{ product?: { variants?: Array<{ id: number; option1?: string; option2?: string; title?: string }> } }>(
    `/products/${productId}.json`,
  );
  const variants = response.product?.variants || [];
  const variant = variants.find((item) => {
    const title = `${item.option1 || ''} / ${item.option2 || ''} ${item.title || ''}`.toLowerCase();
    return title.includes(size.toLowerCase()) && title.includes(color.toLowerCase());
  });

  if (!variant) {
    throw new Error(`No Shopify sample variant found for ${size} / ${color}.`);
  }

  return variant.id;
}

export async function createAndCompleteDraftOrder(input: DraftOrderInput) {
  const draft = await shopifyFetch<{ draft_order: { id: number } }>('/draft_orders.json', {
    method: 'POST',
    body: JSON.stringify({
      draft_order: {
        line_items: input.lineItems,
        shipping_address: input.shippingAddress,
        email: input.email || undefined,
        note: input.note,
        tags: input.tags?.join(','),
      },
    }),
  });

  const completed = await shopifyFetch<{ draft_order: { id: number; order_id: number; name?: string } }>(
    `/draft_orders/${draft.draft_order.id}/complete.json`,
    {
      method: 'PUT',
      body: JSON.stringify({ payment_pending: input.paymentPending ?? true }),
    },
  );

  return {
    draftId: draft.draft_order.id,
    orderId: completed.draft_order.order_id,
    orderNumber: completed.draft_order.name || null,
  };
}

export function verifyShopifyWebhook(body: string, signature: string | null) {
  if (!process.env.SHOPIFY_WEBHOOK_SECRET || !signature) return false;
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
