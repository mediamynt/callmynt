// lib/constants.ts - Design tokens from CallMyntApp-v4.jsx

export const C = {
  // Background colors
  bg: '#FFFFFF',
  sf: '#F7F8FB',
  rs: '#EFF1F6',
  hv: '#E6E9F0',
  ac: '#DDE0E9',
  
  // Border colors
  bd: '#E2E5ED',
  bdH: '#CDD1DB',
  
  // Text colors
  t1: '#1A1D26',
  t2: '#5C6070',
  t3: '#9198A8',
  
  // Green
  grn: '#10B981',
  gD: '#ECFDF5',
  gB: '#A7F3D0',
  gT: '#065F46',
  
  // Blue
  blu: '#3B82F6',
  bD: '#EFF6FF',
  bB: '#BFDBFE',
  bT: '#1E40AF',
  
  // Amber
  amb: '#F59E0B',
  aD: '#FFFBEB',
  aB: '#FDE68A',
  aT: '#92400E',
  
  // Red
  red: '#EF4444',
  rD: '#FEF2F2',
  rB: '#FECACA',
  rT: '#991B1B',
  
  // Purple
  pur: '#8B5CF6',
  pD: '#F5F3FF',
  pB: '#DDD6FE',
  pT: '#5B21B6',
  
  // Orange
  org: '#F97316',
  oD: '#FFF7ED',
  oB: '#FED7AA',
  oT: '#9A3412',
  
  // Cyan
  cyn: '#06B6D4',
};

// Stage definitions
export const STG: Record<string, { l: string; c: string; bg: string; bd: string; ic: string }> = {
  cold_list: { l: 'Cold list', c: C.t3, bg: C.rs, bd: C.bd, ic: '' },
  buyer_identified: { l: "Buyer ID'd", c: C.bT, bg: C.bD, bd: C.bB, ic: '' },
  sending_sample: { l: 'Sent', c: C.pT, bg: C.pD, bd: C.pB, ic: '' },
  sample_follow_up: { l: 'Follow up', c: C.oT, bg: C.oD, bd: C.oB, ic: '' },
  first_order: { l: 'Ordered', c: C.gT, bg: C.gD, bd: C.gB, ic: '' },
  reorder: { l: 'Reorder', c: '#0E7490', bg: '#ECFEFF', bd: '#A5F3FC', ic: '' },
};

// Disposition options
export const DGK = [
  { l: 'Got buyer name', c: C.blu, a: '→ Stage 2' },
  { l: 'Left msg', c: C.amb, a: 'Retry 2d' },
  { l: 'No buyer avail', c: C.t3, a: 'Retry tmrw' },
];

export const DBY = [
  { l: 'Sending sample', c: C.grn, a: '→ Ship polo', p: 1, cap: 1 },
  { l: 'Call back', c: C.amb, a: 'Schedule' },
  { l: 'Not interested', c: C.red, a: '90d retry' },
];

export const DFU = [
  { l: 'Placing order!', c: C.grn, a: '→ Create order', p: 1 },
  { l: 'Needs time', c: C.blu, a: '7d follow-up' },
  { l: 'Not received', c: C.amb, a: 'Check tracking' },
  { l: 'Not interested', c: C.red, a: '120d retry' },
];

export const DSH = [
  { l: 'Left VM', c: C.t3, a: 'VM dropped' },
  { l: 'No answer', c: C.t3, a: 'Retry' },
  { l: 'Bad #', c: C.red, a: 'Remove' },
];

// Scripts
export const SC = {
  cold_gk: [
    { t: 'Opening', s: '"Hi, I\'m [name] with BYRDGANG — performance golf polos. Can I speak with whoever handles pro shop merchandise?"' },
    { t: 'Get name', s: '"Could I get their name so I can call back directly?"' },
  ],
  cold_buyer: [
    { t: 'Opening', s: '"Hi [buyer], I\'m [name] with BYRDGANG. We wholesale at $25 — pro shops sell at $49–$59 for 100%+ margin."' },
    { t: 'Close', s: '"I\'d love to send a free polo. What size do you wear?"' },
    { t: 'Address', s: '"Perfect — best address? The pro shop directly?"' },
  ],
  followup: [
    { t: 'Opening', s: '"Hey [buyer], it\'s [name] from BYRDGANG. Did that [color] polo arrive?"' },
    { t: 'Close', s: '"Most shops start with 24–48 units. At $25, 100% margin at $49. Want a starter order?"' },
  ],
};

// Navigation items
export const NAV_ITEMS = [
  { id: 'dialer', lb: 'Dialer', ic: 'phone' },
  { id: 'courses', lb: 'Courses', ic: 'users' },
  { id: 'campaigns', lb: 'Campaigns', ic: 'flag' },
  { id: 'samples', lb: 'Samples', ic: 'package' },
  { id: 'orders', lb: 'Orders', ic: 'shopping-bag' },
  { id: 'calls', lb: 'Calls', ic: 'mic' },
  { id: 'coaching', lb: 'Coach', ic: 'book-open' },
  { id: 'stats', lb: 'Stats', ic: 'bar-chart' },
];
