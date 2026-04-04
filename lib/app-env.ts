export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL?.replace(/^/, 'https://') ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function getRecordingWebSocketUrl() {
  return (process.env.MAC_MINI_WS_URL || '').replace(/\/$/, '');
}

export function getRecordingHttpUrl() {
  return (process.env.MAC_MINI_HTTP_URL || '').replace(/\/$/, '');
}

export function getAgentIdentityFallback() {
  return process.env.DEFAULT_AGENT_ID || 'agent-1';
}

export function hasShopifyConfig() {
  return Boolean(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN);
}

export function hasAnalysisConfig() {
  return Boolean(process.env.OPENCLAW_API_URL || process.env.LOCAL_ANALYSIS_URL);
}
