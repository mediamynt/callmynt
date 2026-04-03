# CallMynt — Technical Reference Guide
## Code snippets, schemas, and API integration details

**Read AGENTS.md FIRST — it has your build sequence and project rules.**

This document is the technical reference with code snippets, Supabase SQL, Shopify API calls, and implementation details. AGENTS.md tells you WHAT to build and WHEN. This document tells you HOW.

The design reference is `CallMyntApp-v4.jsx` — every view, every component, every interaction. The product spec is `CALLMYNT-APP-MAP.md`. The Twilio integration is in `DEZMON-TWILIO-GUIDE.md`.

---

## What you're building

A power dialer for BYRDGANG sales reps who call golf course pro shops. The workflow:
1. Rep loads a campaign (list of golf courses)
2. Power dialer auto-dials through the list
3. Rep talks to gatekeeper → tries to reach the merchandise buyer
4. If buyer answers → pitch BYRDGANG polos at $25 wholesale → close for a free sample
5. Rep captures buyer's size + address → system creates a $0 Shopify order → 3PL ships it
6. System auto-schedules follow-up call after delivery
7. Follow-up call: close for first wholesale order

Inbound calls ALWAYS take priority over outbound. If someone calls in while a rep is dialing, the dialer pauses and routes the inbound immediately.

---

## Stack

- **Framework:** Next.js 14+ (App Router)
- **Hosting:** Vercel
- **Database:** Supabase (Postgres + Auth + Storage + Realtime)
- **Voice/SMS:** Twilio or Telnyx
- **Transcription:** Whisper (local on Mac Mini M2 via whisper.cpp)
- **AI Analysis:** OpenClaw (local on Mac Mini, uses Gemini Flash / Kimi K2.5 + ChromaDB persistent memory)
- **Fulfillment:** Shopify Admin API → existing 3PL
- **Payments:** Stripe (wholesale orders)

---

## Project Structure

Create this exact structure:

```
callmynt/
├── app/
│   ├── layout.tsx              ← App shell: sidebar + topbar
│   ├── page.tsx                ← Dialer view (default route)
│   ├── courses/page.tsx        ← Golf course database
│   ├── samples/page.tsx        ← Sample tracking dashboard
│   ├── call-library/page.tsx   ← Recorded calls archive
│   ├── coaching/page.tsx       ← AI coaching dashboard
│   ├── analytics/page.tsx      ← Metrics + pipeline funnel
│   ├── settings/page.tsx       ← Agent profiles, routing rules
│   └── api/
│       ├── calls/
│       │   ├── initiate/route.ts     ← Start outbound call
│       │   ├── [id]/end/route.ts     ← End call + trigger recording pipeline
│       │   ├── [id]/hold/route.ts
│       │   ├── [id]/transfer/route.ts
│       │   └── [id]/disposition/route.ts ← Save outcome + trigger pipeline actions
│       ├── dialer/
│       │   ├── start/route.ts        ← Start power dial session
│       │   ├── pause/route.ts
│       │   ├── resume/route.ts
│       │   └── skip/route.ts
│       ├── inbound/
│       │   ├── route/route.ts        ← Twilio/Telnyx webhook: incoming call
│       │   └── hold/route.ts
│       ├── samples/
│       │   ├── create/route.ts       ← Creates $0 Shopify order + Supabase record
│       │   ├── pending/route.ts
│       │   └── overdue/route.ts
│       ├── webhooks/
│       │   ├── twilio/
│       │   │   ├── voice/route.ts    ← Call status updates
│       │   │   └── recording/route.ts ← Recording ready
│       │   ├── shopify/
│       │   │   └── fulfillment/route.ts ← 3PL shipped → store tracking + schedule follow-up
│       │   └── transcript/route.ts  ← Mac Mini sends transcript → store + trigger OpenClaw
│       ├── coaching/
│       │   ├── analyze/route.ts      ← Per-call AI analysis
│       │   └── batch/route.ts        ← Nightly pattern recognition
│       └── cron/
│           ├── nightly-analysis/route.ts
│           └── sample-followups/route.ts
├── components/
│   ├── dialer/
│   │   ├── CallQueue.tsx
│   │   ├── ActiveCall.tsx
│   │   ├── CallControls.tsx
│   │   ├── CourseIntel.tsx
│   │   ├── ScriptPanel.tsx
│   │   ├── DispositionPanel.tsx
│   │   ├── MarginCalculator.tsx
│   │   ├── GatekeeperToggle.tsx
│   │   └── SampleModal.tsx
│   ├── shared/
│   │   ├── StagePill.tsx
│   │   ├── StatusDot.tsx
│   │   ├── Card.tsx
│   │   └── MonoText.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── lib/
│   ├── supabase.ts               ← Supabase client init
│   ├── shopify.ts                ← Shopify Admin API client
│   ├── twilio.ts                 ← Twilio client init
│   ├── openclaw.ts                ← OpenClaw API client (Mac Mini local)
│   ├── types.ts                  ← TypeScript interfaces
│   └── constants.ts              ← Design tokens, stage metadata
├── hooks/
│   ├── useDialer.ts              ← Dialer state machine
│   ├── useCallTimer.ts
│   ├── useAgentStatus.ts
│   └── useRealtimeQueue.ts       ← Supabase realtime subscription
└── .env.local
```

---

## Environment Variables

Create `.env.local` with these exact keys:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Twilio (or swap for Telnyx)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Shopify
SHOPIFY_STORE_DOMAIN=         # e.g. byrdgang.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=   # Admin API access token
SHOPIFY_SAMPLE_PRODUCT_ID=    # Product ID for the sample polo
SHOPIFY_WEBHOOK_SECRET=       # For verifying webhook signatures

# Mac Mini (recording, transcription, AI analysis)
MAC_MINI_WS_URL=wss://callmynt-mac.your-tunnel.com/media-stream
MAC_MINI_HTTP_URL=https://callmynt-mac.your-tunnel.com
OPENCLAW_API_URL=http://localhost:3001  # OpenClaw running on same Mac Mini

# App
NEXT_PUBLIC_APP_URL=           # e.g. https://callmynt.vercel.app
```

---

## Phase 1: Database + UI Shell

### Step 1: Create Supabase Tables

Run this SQL in the Supabase SQL editor. Run it exactly as written.

```sql
-- Agents
create table agents (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text default 'agent',
  status text default 'offline',
  current_call_id uuid,
  created_at timestamptz default now()
);

-- Golf courses (main data table)
create table courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  course_type text,
  main_phone text,
  pro_shop_phone text,
  website text,
  address text,
  city text,
  state text,
  zip text,
  buyer_name text,
  buyer_title text,
  buyer_direct_phone text,
  buyer_email text,
  buyer_shirt_size text,
  pipeline_stage text default 'cold_list',
  ai_score integer default 0,
  total_attempts integer default 0,
  last_attempt_at timestamptz,
  next_follow_up_at timestamptz,
  total_orders integer default 0,
  lifetime_revenue numeric(10,2) default 0,
  tags text[] default '{}',
  notes text,
  dnc boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Campaigns
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pipeline_stage text not null,
  dialer_mode text default 'power',
  parallel_lines integer default 1,
  script jsonb,
  voicemail_drop_url text,
  caller_id_pool text[],
  status text default 'active',
  created_at timestamptz default now()
);

-- Campaign queue (which courses are in which campaign)
create table campaign_queue (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  course_id uuid references courses(id),
  agent_id uuid references agents(id),
  position integer,
  status text default 'queued',
  priority integer default 0,
  scheduled_at timestamptz,
  attempts integer default 0,
  created_at timestamptz default now()
);

-- Calls
create table calls (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id),
  course_id uuid references courses(id),
  campaign_id uuid references campaigns(id),
  direction text not null,
  status text default 'initiated',
  disposition text,
  disposition_data jsonb,
  spoke_to text,
  pipeline_stage_before text,
  pipeline_stage_after text,
  caller_id_used text,
  phone_dialed text,
  provider_call_id text,
  started_at timestamptz,
  connected_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  notes text,
  created_at timestamptz default now()
);

-- Sample shipments
create table sample_shipments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  call_id uuid references calls(id),
  agent_id uuid references agents(id),
  buyer_name text not null,
  shirt_size text not null,
  color text default 'Navy',
  shipping_address text not null,
  shopify_draft_order_id bigint,
  shopify_order_id bigint,
  shopify_order_number text,
  shopify_variant_id bigint,
  status text default 'pending_fulfillment',
  shipped_at timestamptz,
  tracking_number text,
  carrier text,
  estimated_delivery date,
  delivered_at timestamptz,
  follow_up_scheduled_at timestamptz,
  follow_up_call_id uuid references calls(id),
  follow_up_completed boolean default false,
  converted_to_order boolean default false,
  sample_cost numeric(8,2),
  created_at timestamptz default now()
);

-- Call recordings
create table call_recordings (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references calls(id) on delete cascade,
  storage_path text not null,
  duration_seconds integer,
  transcription_status text default 'pending',
  analysis_status text default 'pending',
  created_at timestamptz default now()
);

-- Transcripts
create table call_transcripts (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references calls(id) on delete cascade,
  full_text text,
  segments jsonb,
  agent_word_count integer,
  prospect_word_count integer,
  created_at timestamptz default now()
);

-- AI analysis
create table call_analysis (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references calls(id) on delete cascade,
  overall_score integer,
  talk_listen_ratio jsonb,
  gatekeeper_navigation jsonb,
  reached_buyer boolean,
  script_adherence jsonb,
  objections_detected jsonb,
  prospect_sentiment text,
  coaching_notes text[],
  next_step text,
  created_at timestamptz default now()
);

-- Wholesale orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  agent_id uuid references agents(id),
  call_id uuid references calls(id),
  shopify_order_id bigint,
  items jsonb,
  total_units integer,
  total numeric(10,2),
  status text default 'pending',
  created_at timestamptz default now()
);

-- Indexes
create index idx_courses_stage on courses(pipeline_stage);
create index idx_courses_phone on courses(main_phone);
create index idx_courses_next on courses(next_follow_up_at);
create index idx_calls_course on calls(course_id, created_at desc);
create index idx_calls_agent on calls(agent_id, created_at desc);
create index idx_queue_campaign on campaign_queue(campaign_id, status, position);
create index idx_samples_status on sample_shipments(status);

-- Enable realtime on key tables
alter publication supabase_realtime add table agents;
alter publication supabase_realtime add table calls;
alter publication supabase_realtime add table sample_shipments;
alter publication supabase_realtime add table campaign_queue;
```

### Step 2: Import Course Data

The 13,712 golf courses already exist in a Supabase table. Write a migration script that copies them into the new `courses` table. Map existing fields. Set all `pipeline_stage` to `cold_list` for courses that haven't been contacted.

### Step 3: Build the UI

Use `CallMyntApp.jsx` as your exact design reference. It contains:
- **App shell** with sidebar navigation + top bar
- **Dialer view** with three-panel desktop layout + tabbed mobile layout
- **Courses view** with pipeline stage filters + data table
- **Samples view** with status cards + tracking table
- **Call Library view** with search + recording list
- **Coaching view** with AI insights cards + gatekeeper playbook + objection rankings
- **Analytics view** with metrics + pipeline funnel + revenue

Break the single JSX file into the component structure listed above. The design tokens are in the `C` object at the top — put those in `lib/constants.ts`. The stage metadata is in `STG` — same file.

**Critical design details to preserve:**
- Dark theme with `#0B0E14` base
- DM Sans for text, JetBrains Mono for all numbers/times
- Green (#34D399) accent for live/success states
- Three-zone center panel: sticky top header, scrollable workspace, floating bottom controls
- Gatekeeper/Buyer toggle that switches script + dispositions
- Priority-sorted queue (sample follow-ups at top with orange accent)
- Responsive: `@media(max-width:768px)` switches to mobile tabbed layout

---

## Phase 2: Shopify Sample Pipeline

This is the most important integration. When a rep dispositions "Sending sample", the system must:

### Step 4: Set up Shopify Sample Product

In the BYRDGANG Shopify store:
1. Create product: "BYRDGANG Polo - Sample"
2. Create variants for each size + color combo (S/M/L/XL/XXL × Navy/Charcoal/Forest/Black/White = 25 variants)
3. Set all variant prices to $0.00
4. Tag product: `sample`, `internal`, `callmynt`
5. Store the product ID in `SHOPIFY_SAMPLE_PRODUCT_ID` env var

### Step 5: Build POST /api/samples/create

This is the endpoint the SampleModal calls when the rep clicks "Ship sample".

```typescript
// app/api/samples/create/route.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  // body: { courseId, callId, agentId, buyerName, size, color, address }

  // 1. Find the right Shopify variant
  const variantId = await getShopifyVariantId(body.size, body.color)

  // 2. Create Shopify draft order
  const draftRes = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/draft_orders.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
      },
      body: JSON.stringify({
        draft_order: {
          line_items: [{
            variant_id: variantId,
            quantity: 1,
            applied_discount: { title: "Free Sample", value: "100.0", value_type: "percentage" }
          }],
          shipping_address: parseAddress(body.address, body.buyerName),
          tags: `SAMPLE,CALLMYNT,course:${body.courseId}`,
          note: `Free sample for ${body.buyerName}. Size: ${body.size}, Color: ${body.color}`,
        }
      })
    }
  )
  const draft = await draftRes.json()
  const draftId = draft.draft_order.id

  // 3. Complete the draft order (pushes to fulfillment pipeline)
  const completeRes = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/draft_orders/${draftId}/complete.json`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
      },
      body: JSON.stringify({ payment_pending: false })
    }
  )
  const completed = await completeRes.json()
  const orderId = completed.draft_order.order_id

  // 4. Create Supabase record
  const { data: sample } = await supabase.from('sample_shipments').insert({
    course_id: body.courseId,
    call_id: body.callId,
    agent_id: body.agentId,
    buyer_name: body.buyerName,
    shirt_size: body.size,
    color: body.color,
    shipping_address: body.address,
    shopify_draft_order_id: draftId,
    shopify_order_id: orderId,
    shopify_order_number: completed.draft_order.name,
    shopify_variant_id: variantId,
    status: 'pending_fulfillment',
  }).select().single()

  // 5. Update course pipeline stage
  await supabase.from('courses').update({
    pipeline_stage: 'sending_sample',
    buyer_name: body.buyerName,
    buyer_shirt_size: body.size,
    updated_at: new Date().toISOString(),
  }).eq('id', body.courseId)

  return Response.json({ success: true, sampleId: sample.id, shopifyOrderId: orderId })
}
```

### Step 6: Build Shopify Fulfillment Webhook

Register a webhook in Shopify for `orders/fulfilled` pointing at `https://your-domain.vercel.app/api/webhooks/shopify/fulfillment`.

```typescript
// app/api/webhooks/shopify/fulfillment/route.ts
export async function POST(req: Request) {
  const body = await req.json()

  // Verify webhook signature (use SHOPIFY_WEBHOOK_SECRET)
  // ... standard Shopify HMAC verification ...

  const orderId = body.id
  const tracking = body.fulfillments?.[0]?.tracking_number
  const carrier = body.fulfillments?.[0]?.tracking_company

  // Find matching sample
  const { data: sample } = await supabase
    .from('sample_shipments')
    .select('*')
    .eq('shopify_order_id', orderId)
    .single()

  if (!sample) return new Response('Not a sample order', { status: 200 })

  // Calculate follow-up date: shipped + 6 business days
  const followUpDate = addBusinessDays(new Date(), 6)

  // Update sample
  await supabase.from('sample_shipments').update({
    status: 'shipped',
    shipped_at: new Date().toISOString(),
    tracking_number: tracking,
    carrier: carrier,
    estimated_delivery: addBusinessDays(new Date(), 4).toISOString(),
    follow_up_scheduled_at: followUpDate.toISOString(),
  }).eq('id', sample.id)

  // Move course to follow-up stage
  await supabase.from('courses').update({
    pipeline_stage: 'sample_follow_up',
    next_follow_up_at: followUpDate.toISOString(),
  }).eq('id', sample.course_id)

  // Add follow-up call to the agent's queue
  // Find or create the "Sample Follow-Up" campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('pipeline_stage', 'sample_follow_up')
    .single()

  if (campaign) {
    await supabase.from('campaign_queue').insert({
      campaign_id: campaign.id,
      course_id: sample.course_id,
      agent_id: sample.agent_id,
      scheduled_at: followUpDate.toISOString(),
      priority: 100, // high priority — these are hot leads
    })
  }

  return new Response('OK', { status: 200 })
}
```

---

## Phase 3: Voice / Telephony

### Step 7: Set up Twilio

1. Create a Twilio account
2. Buy phone numbers in target markets (start with 2-3 Utah numbers)
3. Configure each number's voice webhook to point at `/api/webhooks/twilio/voice`
4. Enable call recording on the account

### Step 8: Build Outbound Calling

The dialer view calls `POST /api/calls/initiate` which uses the Twilio API:

```typescript
// Simplified — the actual dialer state machine is in hooks/useDialer.ts
const call = await twilioClient.calls.create({
  to: course.pro_shop_phone || course.main_phone,
  from: callerIdFromPool,
  url: `${APP_URL}/api/webhooks/twilio/voice`, // TwiML for call handling
  record: true,
  recordingChannels: 'dual',
  statusCallback: `${APP_URL}/api/webhooks/twilio/voice`,
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
})
```

### Step 9: Build Inbound Routing

The 4-tier priority system. When Twilio receives an inbound call on one of your numbers, it hits `/api/inbound/route`:

1. Look up caller by phone number in `courses` table
2. Find an available agent (status = 'available' or 'dialing')
3. If found → connect immediately, fire screen pop via Supabase Realtime
4. If all agents on calls → put in hold queue, play hold message
5. If hold time > 2 min → offer voicemail or send auto-SMS

The agent's browser is subscribed to Supabase Realtime on the `calls` table. When an inbound call record is inserted with their `agent_id`, the UI renders the screen pop.

---

## Phase 4: Recording + AI (Mac Mini Local Pipeline)

The Mac Mini M2 handles recording, transcription, AND AI analysis. No cloud APIs needed for this pipeline.

### Step 10: Recording Pipeline

Recording happens via Twilio Media Streams → Mac Mini WebSocket server. See the Twilio guide (DEZMON-TWILIO-GUIDE.md, section 7) for the complete WebSocket server code.

The flow:
1. Call connects → TwiML includes `<Stream>` pointing at the Mac Mini's WebSocket endpoint
2. Mac Mini receives dual-channel audio packets in real-time
3. When call ends → Mac Mini saves WAV file locally
4. Mac Mini runs Whisper transcription (see step 11)
5. Mac Mini sends transcript to OpenClaw for analysis (see step 12)
6. Results are written to Supabase (`call_transcripts` + `call_analysis` tables)
7. Browser reads from Supabase to display scores, transcripts, coaching

**This all runs on the same Mac Mini that runs Dezmon.** The Cloudflare tunnel makes the WebSocket and HTTP endpoints accessible to Twilio and the browser.

### Step 11: Local Transcription (Whisper)

After a WAV is saved, Whisper transcribes it locally. See DEZMON-TWILIO-GUIDE.md section 7B for full setup.

Key points:
- Install `whisper.cpp` (C++ port optimized for Apple Silicon)
- Use `large-v3` model for best accuracy (~75 seconds for a 5-minute call on M2)
- Dual-channel approach: transcribe prospect and agent tracks separately for perfect speaker labels
- Store transcript text in Supabase `call_transcripts` table
- Queue transcription jobs if multiple calls end simultaneously

### Step 12: OpenClaw Per-Call Analysis

After Whisper produces the transcript, send it to OpenClaw for analysis. OpenClaw runs on the same Mac Mini and uses ChromaDB for persistent memory.

```typescript
// Called by the transcription function after Whisper completes
async function triggerOpenClawAnalysis(callSid: string, transcript: string) {
  // Send transcript to OpenClaw's analysis endpoint
  const response = await fetch(`${process.env.OPENCLAW_API_URL}/analyze-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callSid,
      transcript,
      context: {
        // Pull course/call context from Supabase
        courseId: call.course_id,
        pipelineStage: course.pipeline_stage,
        previousAttempts: course.total_attempts,
        buyerName: course.buyer_name,
        sampleStatus: sample?.status || null,
      }
    })
  });
  
  const analysis = await response.json();
  
  // Store in Supabase
  await supabase.from('call_analysis').insert({
    call_id: callSid,
    overall_score: analysis.overall_score,
    talk_listen_ratio: analysis.talk_listen_ratio,
    gatekeeper_navigation: analysis.gatekeeper_navigation,
    reached_buyer: analysis.reached_buyer,
    script_adherence: analysis.script_adherence,
    objections_detected: analysis.objections,
    prospect_sentiment: analysis.sentiment,
    coaching_notes: analysis.coaching_notes,
    next_step: analysis.next_step,
  });
}
```

**Why OpenClaw instead of a stateless API call:**

OpenClaw stores every analysis in ChromaDB. When it analyzes call #500, it has the context of the previous 499 calls. This means:
- It knows which gatekeeper techniques have the highest conversion rates historically
- It knows what objections this specific buyer raised in previous calls
- It can detect trends ("Alex's talk ratio has been increasing for 3 weeks")
- It can compare this call against similar calls with similar course types
- The coaching quality improves over time as the memory grows

A stateless API call (Claude, Kimi, GPT) starts from zero every time and can't do any of this without stuffing hundreds of previous analyses into the prompt (expensive and limited by context windows).

### Step 12B: Nightly Batch Coaching (OpenClaw)

Set up a cron job that triggers OpenClaw's batch analysis nightly at 2am:

```typescript
// mac-mini/nightly-coaching.ts (or trigger via Vercel Cron → OpenClaw endpoint)

// OpenClaw already has all call analyses in ChromaDB
// Just ask it to generate the weekly coaching report

const report = await fetch(`${OPENCLAW_API_URL}/generate-coaching-report`, {
  method: 'POST',
  body: JSON.stringify({
    agentId: 'alex',
    dateRange: { from: '7 days ago', to: 'now' },
    reportType: 'weekly',
  })
});

// OpenClaw queries its own memory for:
// - Top 3 gatekeeper techniques by conversion rate
// - Top 3 objection responses by effectiveness
// - Agent score trend
// - Strengths and areas to improve (with specific call examples)
// - Script recommendations based on what's working

// Store in Supabase
await supabase.from('coaching_reports').insert(report);
```

The key difference: Claude or Kimi would need you to dump ALL call analyses from the past week into a single prompt. OpenClaw just queries ChromaDB — it already remembers everything.

---

## Phase 5: Dialer State Machine

### Step 13: Build hooks/useDialer.ts

This is the core state machine that drives the dialer. States:

```
IDLE → user clicks "Start dialing"
DIALING → calling next course in queue
  → AMD detects voicemail → auto-drop VM → DIALING (next)
  → No answer after 30s → log → DIALING (next)
  → Human answers → CONNECTED
CONNECTED → rep is talking
  → Rep hits disposition → WRAP_UP
  → INBOUND arrives → pause, handle inbound → resume
WRAP_UP → rep chose disposition, data saving
  → Auto-advance to DIALING (next course)
PAUSED → inbound interrupted, or rep manually paused
  → Resume → DIALING
```

Use `useReducer` for the state machine. Dispatch actions like `DIAL_NEXT`, `CALL_CONNECTED`, `CALL_ENDED`, `DISPOSITION_SET`, `INBOUND_INTERRUPT`, `RESUME`.

---

## Design Tokens Reference

Copy these exactly from the JSX. Do not change the colors.

```typescript
// lib/constants.ts
export const colors = {
  bgBase: '#0B0E14',
  bgSurface: '#111620',
  bgRaised: '#171D2A',
  bgHover: '#1C2333',
  bgActive: '#232B3D',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.1)',
  textPrimary: '#E8ECF4',
  textSecondary: '#8892A6',
  textTertiary: '#555F73',
  green: '#34D399',
  greenDim: 'rgba(52,211,153,0.12)',
  greenBorder: 'rgba(52,211,153,0.25)',
  blue: '#60A5FA',
  blueDim: 'rgba(96,165,250,0.12)',
  blueBorder: 'rgba(96,165,250,0.25)',
  amber: '#FBBF24',
  amberDim: 'rgba(251,191,36,0.12)',
  amberBorder: 'rgba(251,191,36,0.25)',
  red: '#F87171',
  redDim: 'rgba(248,113,113,0.12)',
  redBorder: 'rgba(248,113,113,0.25)',
  purple: '#A78BFA',
  purpleDim: 'rgba(167,139,250,0.12)',
  purpleBorder: 'rgba(167,139,250,0.25)',
  orange: '#FB923C',
  orangeDim: 'rgba(251,146,60,0.12)',
  orangeBorder: 'rgba(251,146,60,0.25)',
}

export const stages = {
  cold_list: { label: 'Cold list', color: colors.textTertiary, bg: colors.bgRaised, border: colors.border },
  buyer_identified: { label: "Buyer ID'd", color: colors.blue, bg: colors.blueDim, border: colors.blueBorder },
  sending_sample: { label: 'Sample sent', color: colors.purple, bg: colors.purpleDim, border: colors.purpleBorder },
  sample_follow_up: { label: 'Follow up', color: colors.orange, bg: colors.orangeDim, border: colors.orangeBorder },
  first_order: { label: 'Ordered', color: colors.green, bg: colors.greenDim, border: colors.greenBorder },
  reorder: { label: 'Reorder', color: colors.cyan, bg: colors.cyanDim, border: colors.cyanBorder },
}
```

Fonts: `DM Sans` for all text, `JetBrains Mono` for numbers/times/stats. Import both from Google Fonts in the root layout.

---

## Key UX Rules

1. **Floating controls:** Call controls (mute, hold, end, VM drop, skip) are ALWAYS visible at the bottom of the center panel. They never scroll away.

2. **Sticky header:** Course name, buyer name, timer, gatekeeper/buyer toggle, phone number being called, and caller ID shown are ALWAYS visible at the top of the center panel.

3. **IVR Quick Bar:** Blue bar below the header with DTMF shortcut buttons (e.g., "2 Pro Shop"). Shows during every connected call. "Full dialpad" link opens the number pad modal. IVR shortcuts are stored per-course and learned over time.

4. **Quick Capture Bar:** Amber bar below the IVR bar, ONLY in gatekeeper mode. Inline fields for buyer name, title, direct phone, extension, best time. Auto-saves to course record on blur.

5. **Phone + Caller ID indicators:** Below the course name in the header. Shows which number is being dialed (main / pro shop / buyer direct) with a dropdown to switch, and which BYRDGANG number the prospect sees. Also shows the prospect's local time.

6. **The workspace scrolls:** Script, notes, margin calculator, and dispositions are in the scrollable area between the sticky bars and floating controls.

7. **Gatekeeper/Buyer toggle:** Only shows for `cold_list` and `buyer_identified` stages. Switching it changes the script panel content AND the disposition options AND shows/hides the quick capture bar. Amber accent for gatekeeper mode, blue accent for buyer mode.

8. **Queue priority:** Sample follow-up courses always sort to the top (orange left border). Then callbacks. Then buyer_identified. Then cold_list at the bottom.

9. **Timezone auto-skip:** The dialer auto-skips courses outside the 8am-8pm local calling window. Shows a brief "Skipped — outside calling hours" indicator.

10. **Campaign complete state:** When the queue is exhausted, show session summary stats and "Start another campaign" / "Re-queue unanswered" buttons.

11. **Order creation lives on the course detail page.** NOT standalone. The Orders tab has a "Create wholesale order" button that opens a product catalog browser with the full BYRDGANG lineup (80+ designs). Rep clicks colors to add to cart, enters size quantities per line item, sets payment terms, creates Shopify order.

12. **Campaign creation includes lead segmentation.** Step 2 of the wizard lets the rep filter the course database (by stage, state, type, buyer status) and select which courses to add to the campaign. Checkboxes, select all, filter count.

13. **Courses page has inline filters.** Stage pills + dropdown filters (state, type, buyer, sample, attempts) in ONE row. No collapsible panel. Active filters highlight blue with a count badge.

14. **Call Library shows recording playback + transcript + AI analysis.** Click any call row to open the detail page with waveform player, speed controls, speaker-labeled transcript with clickable timestamps, and the full AI analysis breakdown.

---

## Testing Checklist

Before showing Chase, verify each phase:

**Phase 1 (Foundation):**
- [ ] Sidebar navigation works between all 9 sections
- [ ] Courses page shows real data from Supabase
- [ ] Courses page filters work (stage pills + all dropdowns)
- [ ] Course detail page loads with all 6 tabs
- [ ] Campaign creation wizard works (3 steps including lead segmentation)
- [ ] Global search finds courses and buyers
- [ ] Notifications dropdown opens with entries
- [ ] Avatar dropdown opens with status selector

**Phase 2 (Calling):**
- [ ] Dialer idle state shows campaigns from Supabase
- [ ] Selecting a campaign loads the queue
- [ ] Start Dialing initiates a real Twilio call
- [ ] AMD correctly detects human vs voicemail
- [ ] Connected state shows script, notes, calculator, dispositions
- [ ] IVR dialpad sends DTMF tones
- [ ] Quick capture bar saves buyer info to course record
- [ ] Gatekeeper/Buyer toggle swaps script + dispositions
- [ ] Disposition saves to calls table + triggers pipeline actions
- [ ] "Sending sample" opens sample modal → creates Shopify $0 order
- [ ] Wrap-up state shows disposition selector
- [ ] Auto-advance dials next contact after countdown
- [ ] Pause/resume works correctly
- [ ] Campaign complete shows session summary

**Phase 3 (Inbound + Recording):**
- [ ] Inbound calls route to available agent
- [ ] Screen pop shows caller info
- [ ] Hold queue works when all agents busy
- [ ] After-hours goes to voicemail → transcription → callback task
- [ ] Mac Mini records calls via Media Streams
- [ ] Whisper transcribes after call ends
- [ ] Call Library shows recordings with waveform playback
- [ ] Transcripts show with speaker labels
- [ ] Dual-channel diarization works (agent vs prospect)

**Phase 4 (Shopify + AI):**
- [ ] Sample modal creates Shopify $0 draft order → completes it
- [ ] Fulfillment webhook stores tracking + schedules follow-up
- [ ] Order creation from course detail works with product catalog
- [ ] Line items with size/color/qty build correctly
- [ ] Order creates in Shopify with correct totals
- [ ] OpenClaw analyzes calls and stores scores
- [ ] Coaching page shows real AI-generated insights
- [ ] Analytics shows real aggregated data
- [ ] Toast notifications appear for all actions
- [ ] Empty states show on pages with no data

---

## What NOT to do

- Do NOT redesign the UI. The design is final. Match the JSX exactly.
- Do NOT add new pages or views without asking Chase.
- Do NOT use a UI component library (no shadcn, no MUI). All components are custom-styled with inline styles matching the design tokens.
- Do NOT use `localStorage`. Use Supabase for all state persistence.
- Do NOT skip the Shopify integration. Samples MUST flow through Shopify as $0 orders.
- Do NOT build the real-time coaching (Phase 6 in the arch brief) until everything else works.

---

*This is your single reference doc. The `CallMyntApp.jsx` file is the visual truth. Build what's in it, wire it to the APIs described here, ship it.*
