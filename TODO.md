# CallMynt Status

## Completed
- Phase 1 and Phase 2 remain complete.
- Phase 3 is implemented:
  - `/api/twilio/inbound` now performs caller lookup, routes to an agent when available, falls back to hold queue, and redirects to after-hours voicemail when no one is online.
  - Hold queue support is wired through Twilio `<Enqueue>`, `/api/twilio/hold-music`, `/api/twilio/check-queue`, and the global hold queue banner in the app shell.
  - `hooks/useScreenPop.ts` exists for realtime inbound screen-pop subscriptions.
  - TwiML voice routes attach Twilio Media Streams instead of relying on Twilio-hosted recording.
  - Call recording metadata, transcript storage, and analysis status now flow into `call_recordings`, `call_transcripts`, and `call_analysis`.
  - Mac Mini scripts are present:
    - `scripts/recording-server.ts`
    - `scripts/transcribe.ts`
    - `scripts/playback-server.ts`
    - `scripts/coaching-cron.ts`
  - Course detail and Call Library now render real recordings and transcripts from Supabase data.
- Phase 4 is implemented:
  - `/api/samples/create` creates Shopify-backed sample orders and stores `sample_shipments`.
  - `/api/orders/create` creates Shopify wholesale orders and stores `orders`.
  - `/api/shopify/webhook` aliases the fulfillment webhook flow and updates tracking/follow-up state.
  - `/api/analysis/run` stores transcript-driven AI analysis.
  - `/api/sms/send` sends Twilio SMS.
  - Coaching and Analytics pages now read from real Supabase tables instead of placeholders.
  - Course detail page now supports sample creation and wholesale order creation through the real APIs.
  - Toasts, skeleton states, empty states, and retryable error states are wired into the updated pages.
- `npm run build` passes.

## Remaining environment/setup work outside code
- The Mac Mini runtime still needs its local dependencies and services available at runtime:
  - `ffmpeg`
  - `whisper.cpp`
  - a WebSocket server dependency such as `ws`
- Twilio, Shopify, Supabase, and OpenClaw environment variables must be configured with real credentials/endpoints.
- The actual database must contain the documented tables such as `hold_queue`, `coaching_reports`, `call_recordings`, and `call_transcripts`.

## Notes
- The repo now contains the Phase 3 and 4 application wiring, but end-to-end recording/transcription/AI behavior still depends on the external Mac Mini and third-party credentials being live.
