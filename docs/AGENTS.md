# AGENTS.md — CallMynt Build Project

## What You're Building

CallMynt is a power dialer web app for BYRDGANG sales reps who cold-call golf course pro shops. The UI/UX is fully designed — your job is to turn the reference component into a production Next.js app wired to real APIs.

## Reference Files (Read All Before Writing Any Code)

1. **CallMyntApp-v4.jsx** — The complete UI/UX. Every screen, every state, every interaction. This is your visual truth. Match it exactly.
2. **CALLMYNT-APP-MAP.md** — The product spec. Every section, page, data field, user flow, and UX pattern documented. Read the whole thing.
3. **DEZMON-BUILD-GUIDE.md** — Step-by-step implementation with code snippets, Supabase schema, API routes, and file structure.
4. **DEZMON-TWILIO-GUIDE.md** — Complete Twilio integration: browser calling, inbound routing, hold queues, AMD, recording via Mac Mini, local Whisper transcription, OpenClaw analysis.

## Project Rules

### Completion Rule
Every task must result in working, testable code. "Started" is not "done." If you can't finish a feature in one session, save your progress to a branch and document what's left in a TODO.md.

### Find Before You Ask
Before asking Chase anything, search the four reference files. The answer is almost certainly documented. If it's genuinely ambiguous, check the JSX component — it's the tiebreaker for how things should look and behave.

### Config Patch Rule
When you change any config (env vars, Supabase schema, Twilio settings), document the change in CHANGELOG.md with the date, what changed, and why.

### Show Proof Rule
After completing each phase, record a screen capture or take screenshots showing the working features. Push to the repo with a description of what's new.

### Context Hygiene
Keep your sessions focused on one phase at a time. Don't try to build Twilio calling while you're still wiring up Supabase queries. The phases are ordered for a reason.

## Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Framework | Next.js 14+ (App Router) | Hosted on Vercel |
| Database | Supabase | Postgres + Auth + Realtime + Storage |
| Voice/SMS | Twilio Programmable Voice | Browser WebRTC via Voice SDK |
| Recording | Mac Mini WebSocket server | Captures via Twilio Media Streams |
| Transcription | Whisper (whisper.cpp on Mac Mini) | Local, free, large-v3 model |
| AI Analysis | OpenClaw (local on Mac Mini) | Uses ChromaDB for persistent memory |
| Fulfillment | Shopify Admin API | $0 draft orders for samples, paid orders for wholesale |
| Payments | Stripe (via Shopify) | For credit card orders |
| Styling | Inline styles matching design tokens | NO component libraries (no shadcn, no MUI) |

## Phased Build Plan

### Phase 1: Foundation (Week 1)
**Goal: Every page renders with real data from Supabase.**

1. Create Next.js project with App Router
2. Set up Supabase project + run the schema SQL from the build guide
3. Import the 13,712 golf courses into the courses table
4. Create design token file (lib/constants.ts) from the JSX color values
5. Break the monolithic JSX into component files following the project structure
6. Wire each page to Supabase queries:
   - Courses list with filters → `supabase.from('courses').select()`
   - Course detail page with all tabs
   - Campaigns list → `supabase.from('campaigns').select()`
   - Samples dashboard → `supabase.from('sample_shipments').select()`
   - Orders dashboard → `supabase.from('orders').select()`
   - Call library → `supabase.from('calls').select()` joined with recordings
   - Settings pages
7. Build the campaign creation flow with lead segmentation (filter courses → add to campaign_queue)
8. Build global search across courses, buyers, calls
9. Build notification system (Supabase Realtime subscriptions)

**Test:** Navigate every page. Every table shows real data. Filters work. Course detail shows all tabs. Campaign creation adds courses to queue.

### Phase 2: Twilio Calling (Week 2)
**Goal: Reps can make and receive real phone calls through the browser.**

1. Set up Twilio account + buy phone numbers
2. Create TwiML App + API keys
3. Build the access token endpoint (`/api/twilio/token`)
4. Build the `useTwilio` hook (browser Voice SDK)
5. Build the `useDialer` state machine hook (useReducer)
6. Wire the dialer UI states to real Twilio calls:
   - IDLE → campaign selector from Supabase
   - READY → queue loaded from campaign_queue table
   - DIALING → `device.connect()` fires real call
   - RINGING → Twilio status callback updates state
   - CONNECTED → two-way audio, timer runs, script panel shows
   - WRAP-UP → disposition saves to calls table, pipeline actions fire
   - PAUSED → dialer stops, can resume
   - COMPLETE → session summary from actual call records
7. Build outbound TwiML webhook (`/api/twilio/voice`)
8. Build status callback handler (`/api/twilio/status`)
9. Build AMD handling — human detection → connect, machine → VM drop
10. Build the IVR dialpad — DTMF sending via `call.sendDigits()`
11. Build caller ID rotation (local presence)
12. Build the quick capture bar — saves buyer info to course record mid-call

**Test:** Start a campaign, click Start Dialing, hear a real phone ring. Talk through the browser. Disposition the call. Watch it auto-advance to the next contact.

### Phase 3: Inbound + Recording (Week 3)
**Goal: Inbound calls route correctly. All calls are recorded and transcribed.**

1. Build inbound webhook (`/api/twilio/inbound`) — caller lookup, agent routing
2. Build hold queue with Twilio `<Enqueue>` + wait URL
3. Build the inbound screen pop via Supabase Realtime
4. Build the global hold queue banner (shows across all pages)
5. Build after-hours handling (voicemail → transcribe → callback task)
6. Set up the Mac Mini WebSocket recording server
7. Add `<Stream>` to all TwiML responses pointing at Mac Mini
8. Build the ffmpeg audio processing (mulaw → WAV, dual-channel merge)
9. Install whisper.cpp on Mac Mini, download large-v3 model
10. Build the transcription pipeline (WAV → Whisper → Supabase)
11. Build the dual-channel speaker diarization (separate agent/prospect tracks)
12. Build the recording playback HTTP endpoint on Mac Mini
13. Wire the Call Library to show real recordings with playback + transcripts
14. Build the transcription queue for concurrent calls

**Test:** Call a BYRDGANG number from your cell phone. See the screen pop. Talk. Hang up. Wait 60-90 seconds. Open Call Library. See the recording with playback and transcript.

### Phase 4: Shopify + AI + Polish (Week 4)
**Goal: Samples ship, orders create, AI analyzes calls, everything is connected.**

1. Create the sample product in Shopify (variants for each size/color)
2. Build `/api/samples/create` — $0 draft order → complete → 3PL fulfills
3. Build Shopify fulfillment webhook — tracking stored, follow-up scheduled
4. Build the order creation flow from course detail page:
   - Product catalog browser (search + filter BYRDGANG designs)
   - Line item builder (design + color + size quantities)
   - Payment terms + shipping
   - Creates Shopify paid order via Admin API
5. Build the in-call order modal (same flow, triggered by disposition)
6. Set up OpenClaw analysis endpoint on Mac Mini:
   - Receives transcript + call context
   - Analyzes with Gemini Flash / Kimi K2.5
   - Stores results in ChromaDB + Supabase call_analysis table
7. Build nightly batch coaching report (cron → OpenClaw → coaching_reports table)
8. Wire Coaching page to real data from call_analysis + coaching_reports
9. Wire Analytics page to real aggregated data
10. Build SMS sending via Twilio
11. Build email sending via Klaviyo (or direct SMTP)
12. Add toast notifications for all actions
13. Add loading states (skeleton loaders)
14. Add error states with retry buttons
15. Add empty states for all pages

**Test:** Full end-to-end: Dial a course → talk to gatekeeper → capture buyer name → call back → pitch buyer → send sample → receive fulfillment webhook → follow up → place order → see it in analytics. Listen to every recorded call with transcripts and AI scores.

## Design Tokens (from the JSX)

```typescript
// lib/constants.ts
export const colors = {
  bg: '#FFFFFF', sf: '#F7F8FB', rs: '#EFF1F6', hv: '#E6E9F0', ac: '#DDE0E9',
  bd: '#E2E5ED', bdH: '#CDD1DB',
  t1: '#1A1D26', t2: '#5C6070', t3: '#9198A8',
  grn: '#10B981', gD: '#ECFDF5', gB: '#A7F3D0', gT: '#065F46',
  blu: '#3B82F6', bD: '#EFF6FF', bB: '#BFDBFE', bT: '#1E40AF',
  amb: '#F59E0B', aD: '#FFFBEB', aB: '#FDE68A', aT: '#92400E',
  red: '#EF4444', rD: '#FEF2F2', rB: '#FECACA', rT: '#991B1B',
  pur: '#8B5CF6', pD: '#F5F3FF', pB: '#DDD6FE', pT: '#5B21B6',
  org: '#F97316', oD: '#FFF7ED', oB: '#FED7AA', oT: '#9A3412',
}

// Fonts: DM Sans (text) + JetBrains Mono (numbers/times/stats)
// Import both from Google Fonts in root layout
```

## What NOT to Do

- Do NOT redesign the UI. The JSX is the visual truth. Match it.
- Do NOT use a UI component library (shadcn, MUI, Chakra, etc.). All styles are inline.
- Do NOT use localStorage. Use Supabase for all persistence.
- Do NOT use Deepgram or any paid transcription API. Whisper runs locally.
- Do NOT use Claude API for call analysis. OpenClaw runs locally with ChromaDB.
- Do NOT skip phases. Build foundation before calling, calling before recording.
- Do NOT build mobile responsive until desktop is solid. The JSX is desktop-first.
- Do NOT deploy to production until Phase 2 is complete (real calls must work).

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_TWIML_APP_SID=
TWILIO_API_KEY=
TWILIO_API_SECRET=
TWILIO_PHONE_NUMBER=

# Shopify
SHOPIFY_STORE_DOMAIN=
SHOPIFY_ADMIN_ACCESS_TOKEN=
SHOPIFY_SAMPLE_PRODUCT_ID=
SHOPIFY_WEBHOOK_SECRET=

# Mac Mini
MAC_MINI_WS_URL=wss://callmynt-mac.your-tunnel.com/media-stream
MAC_MINI_HTTP_URL=https://callmynt-mac.your-tunnel.com
OPENCLAW_API_URL=http://localhost:3001

# App
NEXT_PUBLIC_APP_URL=
```

## Questions? Check These Files First

| Question | File |
|----------|------|
| "What should this page look like?" | CallMyntApp-v4.jsx |
| "What data does this page need?" | CALLMYNT-APP-MAP.md |
| "How do I set up Twilio?" | DEZMON-TWILIO-GUIDE.md |
| "What's the Supabase schema?" | DEZMON-BUILD-GUIDE.md |
| "How does recording/transcription work?" | DEZMON-TWILIO-GUIDE.md, section 7 |
| "How does AI analysis work?" | DEZMON-BUILD-GUIDE.md, Phase 4 |
| "How does the dialer state machine work?" | DEZMON-BUILD-GUIDE.md, Phase 5 |
| "What are the inbound call scenarios?" | CALLMYNT-APP-MAP.md, sections 1.1i-1.1k |
