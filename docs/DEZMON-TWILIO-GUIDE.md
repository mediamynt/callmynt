# CallMynt — Twilio Integration Guide for Dezmon
## Everything you need to wire up voice calling

**Read this entire document before writing any Twilio code.**

This covers: browser-based calling, outbound power dialing, inbound routing with hold queues, call recording, answering machine detection, voicemail drop, call transfer, parallel dialing, local presence, SMS, and real-time media streams for transcription.

---

## 1. Which Twilio Products You Need

You need **Twilio Programmable Voice** (NOT Twilio Flex, NOT Twilio Contact Center). Flex is a full pre-built contact center UI — we're building our own.

**Twilio products to enable on the account:**
- Programmable Voice (core calling)
- Phone Numbers (buy local numbers)
- Recordings (call recording)
- SMS / Messaging (for auto-SMS and templates)

**NPM packages:**
```bash
npm install twilio                    # Server-side SDK (API routes)
npm install @twilio/voice-sdk         # Browser-side SDK (WebRTC calling)
```

**Environment variables:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Created in step 2
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx        # For access tokens
TWILIO_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx       # For access tokens
MAC_MINI_WS_URL=wss://callmynt-mac.your-tunnel.com/media-stream  # Recording server
MAC_MINI_HTTP_URL=https://callmynt-mac.your-tunnel.com             # Playback server
```

---

## 2. Initial Setup

### 2a. Create a TwiML App

In the Twilio Console → Voice → TwiML Apps → Create:
- Friendly name: "CallMynt"
- Voice Request URL: `https://your-domain.vercel.app/api/twilio/voice`
- Voice Method: POST
- Status Callback URL: `https://your-domain.vercel.app/api/twilio/status`

Save the TwiML App SID (starts with `AP`) → put in `TWILIO_TWIML_APP_SID`

### 2b. Create API Key

In Twilio Console → Account → API Keys → Create:
- Friendly name: "CallMynt Tokens"
- Key type: Standard

Save the SID (starts with `SK`) and Secret → put in env vars.

### 2c. Buy Phone Numbers

In Twilio Console → Phone Numbers → Buy:
- Buy 2-3 local numbers in target areas (Utah: 801, 435)
- For each number, set the Voice webhook to: `https://your-domain.vercel.app/api/twilio/inbound`
- Store these numbers in Supabase `phone_numbers` table

---

## 3. Browser-Based Calling (WebRTC)

Reps make and receive calls through the browser. No desk phones, no softphones — just the CallMynt web app. This uses Twilio's Voice JavaScript SDK.

### 3a. Generate Access Tokens (server-side)

Every time a rep opens the dialer, the browser requests a short-lived token.

```typescript
// app/api/twilio/token/route.ts
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  
  // Create access token
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { 
      identity: agentId!,  // unique per agent
      ttl: 3600  // 1 hour, refresh before expiry
    }
  );
  
  // Grant voice capability
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
    incomingAllow: true,  // allow receiving inbound calls
  });
  token.addGrant(voiceGrant);
  
  return Response.json({ token: token.toJwt() });
}
```

### 3b. Initialize Voice SDK (browser-side)

This goes in the `useDialer` hook or a dedicated `useTwilio` hook.

```typescript
// hooks/useTwilio.ts
import { Device, Call } from '@twilio/voice-sdk';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useTwilio(agentId: string) {
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const [status, setStatus] = useState<'offline' | 'ready' | 'connecting' | 'on-call'>('offline');
  const [isMuted, setIsMuted] = useState(false);
  
  // Initialize device on mount
  useEffect(() => {
    async function init() {
      const res = await fetch(`/api/twilio/token?agentId=${agentId}`);
      const { token } = await res.json();
      
      const device = new Device(token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        // Enable close protection — warns if closing tab during call
        closeProtection: true,
      });
      
      // Register event handlers
      device.on('registered', () => setStatus('ready'));
      device.on('error', (error) => console.error('Twilio error:', error));
      
      // Handle incoming calls
      device.on('incoming', (call: Call) => {
        // This fires when an inbound call is routed to this agent
        // Accept immediately (our routing already decided this agent gets it)
        call.accept();
        callRef.current = call;
        setStatus('on-call');
        setupCallHandlers(call);
      });
      
      // Token refresh before expiry
      device.on('tokenWillExpire', async () => {
        const res = await fetch(`/api/twilio/token?agentId=${agentId}`);
        const { token } = await res.json();
        device.updateToken(token);
      });
      
      await device.register();
      deviceRef.current = device;
    }
    
    init();
    return () => { deviceRef.current?.destroy(); };
  }, [agentId]);
  
  function setupCallHandlers(call: Call) {
    call.on('disconnect', () => {
      callRef.current = null;
      setStatus('ready');
      setIsMuted(false);
    });
    call.on('error', (error) => {
      console.error('Call error:', error);
    });
  }
  
  // ── Outbound call ──
  const makeCall = useCallback(async (phoneNumber: string, callerId: string, params: Record<string, string>) => {
    if (!deviceRef.current) return;
    setStatus('connecting');
    
    const call = await deviceRef.current.connect({
      params: {
        To: phoneNumber,
        CallerId: callerId,
        ...params,  // courseId, campaignId, agentId, etc.
      }
    });
    
    callRef.current = call;
    setStatus('on-call');
    setupCallHandlers(call);
    return call;
  }, []);
  
  // ── Call controls ──
  const hangup = useCallback(() => {
    callRef.current?.disconnect();
  }, []);
  
  const mute = useCallback(() => {
    if (callRef.current) {
      const newMuted = !callRef.current.isMuted();
      callRef.current.mute(newMuted);
      setIsMuted(newMuted);
    }
  }, []);
  
  const hold = useCallback(async (callSid: string) => {
    // Hold is done server-side by updating the call with hold TwiML
    await fetch(`/api/calls/${callSid}/hold`, { method: 'POST' });
  }, []);
  
  const sendDigits = useCallback((digits: string) => {
    callRef.current?.sendDigits(digits);
  }, []);
  
  return { status, makeCall, hangup, mute, hold, sendDigits, isMuted };
}
```

### 3c. How a call actually works (flow)

```
1. Browser calls device.connect({ params: { To: "+18015550140", CallerId: "+18015559999" } })
2. Twilio receives the request, hits your TwiML App's Voice URL:
   POST /api/twilio/voice
3. Your server returns TwiML instructions telling Twilio what to do
4. Twilio dials the destination number
5. When answered → two-way audio between browser and phone
6. When either side hangs up → Twilio fires status callback
```

---

## 4. Outbound Calling (TwiML)

### 4a. Voice Webhook (handles outbound call setup)

```typescript
// app/api/twilio/voice/route.ts
import twilio from 'twilio';

export async function POST(req: Request) {
  const body = await req.formData();
  const to = body.get('To') as string;
  const callerId = body.get('CallerId') as string;
  const courseId = body.get('courseId') as string;
  
  const response = new twilio.twiml.VoiceResponse();
  
  if (to) {
    // Outbound call — dial the number
    const dial = response.dial({
      callerId: callerId,
      record: 'record-from-answer-dual',  // Dual-channel recording
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording`,
      recordingStatusCallbackEvent: ['completed'],
      answerOnBridge: true,  // Don't start billing until answered
      // AMD settings (see section 6)
      machineDetection: 'DetectMessageEnd',
      machineDetectionTimeout: 5,
    });
    
    dial.number({
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status?courseId=${courseId}`,
    }, to);
  } else {
    response.say('No destination number provided.');
  }
  
  return new Response(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
```

### 4b. Status Callback (track call progress)

```typescript
// app/api/twilio/status/route.ts
export async function POST(req: Request) {
  const body = await req.formData();
  const callSid = body.get('CallSid') as string;
  const callStatus = body.get('CallStatus') as string; // initiated, ringing, answered, completed
  const courseId = new URL(req.url).searchParams.get('courseId');
  const duration = body.get('CallDuration') as string;
  const answeredBy = body.get('AnsweredBy') as string; // human, machine_start, machine_end_beep, etc.
  
  // Update call record in Supabase
  const updates: Record<string, any> = { status: callStatus };
  
  if (callStatus === 'answered') {
    updates.connected_at = new Date().toISOString();
    updates.answered_by = answeredBy; // for AMD
  }
  
  if (callStatus === 'completed') {
    updates.ended_at = new Date().toISOString();
    updates.duration_seconds = parseInt(duration || '0');
  }
  
  await supabase.from('calls').update(updates).eq('provider_call_id', callSid);
  
  // Push status to browser via Supabase Realtime
  // (the browser is subscribed to the calls table)
  
  return new Response('OK');
}
```

---

## 5. Inbound Call Routing

When someone calls a BYRDGANG number, Twilio hits the webhook you configured on that number.

### 5a. Inbound Webhook

```typescript
// app/api/twilio/inbound/route.ts
import twilio from 'twilio';

export async function POST(req: Request) {
  const body = await req.formData();
  const from = body.get('From') as string;       // Caller's number
  const to = body.get('To') as string;           // Which BYRDGANG number they called
  const callSid = body.get('CallSid') as string;
  
  const response = new twilio.twiml.VoiceResponse();
  
  // 1. Look up caller in database
  const { data: course } = await supabase.from('courses')
    .select('*')
    .or(`main_phone.eq.${from},pro_shop_phone.eq.${from},buyer_direct_phone.eq.${from}`)
    .single();
  
  // 2. Find an available agent
  const { data: agents } = await supabase.from('agents')
    .select('*')
    .in('status', ['available', 'dialing'])
    .order('updated_at', { ascending: true }); // Round-robin: least recently used
  
  // 3. Create inbound call record
  await supabase.from('calls').insert({
    course_id: course?.id || null,
    direction: 'inbound',
    status: 'ringing',
    provider_call_id: callSid,
    phone_dialed: to,
    caller_id_used: from,
    started_at: new Date().toISOString(),
  });
  
  if (agents && agents.length > 0) {
    // TIER 1/2: Route to available agent
    const agent = agents[0];
    
    // Update agent status
    await supabase.from('agents').update({ status: 'on_call' }).eq('id', agent.id);
    
    // Connect to agent's browser via Twilio Client
    const dial = response.dial({
      record: 'record-from-answer-dual',
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording`,
    });
    
    // Route to the agent's Twilio Client identity (their browser)
    dial.client(agent.id);
    
  } else {
    // TIER 4: All agents busy — hold queue
    // Record in hold queue table
    await supabase.from('hold_queue').insert({
      caller_phone: from,
      course_id: course?.id || null,
      inbound_number: to,
      provider_call_id: callSid,
      status: 'holding',
    });
    
    // Play hold message + music, check every 15 seconds for available agent
    response.say(
      { voice: 'Polly.Joanna' },
      'Thanks for calling BYRDGANG. All of our team members are currently assisting other customers. Please hold and we will be with you shortly.'
    );
    
    // Enqueue the caller — use <Enqueue> with a wait URL that plays hold music
    response.enqueue({
      waitUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/hold-music`,
      waitUrlMethod: 'POST',
    }, 'inbound-queue');
    
    // OR use a simple loop approach:
    // response.play({ loop: 0 }, 'https://your-domain.com/hold-music.mp3');
    // with a redirect that checks for available agents every 15 seconds
  }
  
  return new Response(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
```

### 5b. Hold Music / Wait URL

```typescript
// app/api/twilio/hold-music/route.ts
import twilio from 'twilio';

export async function POST(req: Request) {
  const response = new twilio.twiml.VoiceResponse();
  
  // Play hold music
  response.play('https://your-domain.com/audio/hold-music.mp3');
  
  // After music ends, check if an agent is available
  // If yes, redirect to connect. If no, play music again.
  response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/check-queue`);
  
  return new Response(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

// app/api/twilio/check-queue/route.ts
export async function POST(req: Request) {
  const response = new twilio.twiml.VoiceResponse();
  
  // Check for available agent
  const { data: agents } = await supabase.from('agents')
    .select('id')
    .eq('status', 'available')
    .limit(1);
  
  if (agents && agents.length > 0) {
    // Agent available! Connect the held caller
    const dial = response.dial({
      record: 'record-from-answer-dual',
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording`,
    });
    dial.client(agents[0].id);
  } else {
    // No one available yet — keep holding
    // Check hold duration for auto-SMS threshold
    response.say(
      { voice: 'Polly.Joanna' },
      'Thank you for your patience. A team member will be with you shortly.'
    );
    response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/hold-music`);
  }
  
  return new Response(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
```

---

## 6. Answering Machine Detection (AMD)

AMD is critical for power dialing. When the dialer connects, Twilio detects whether a human or voicemail answered. This is configured in the `<Dial>` TwiML (see section 4a).

### How AMD works:

1. Call connects
2. Twilio listens for ~5 seconds to detect human vs machine
3. Twilio sends `AnsweredBy` parameter in the status callback:
   - `human` → connect to rep
   - `machine_start` → voicemail greeting just started
   - `machine_end_beep` → voicemail beep detected, ready for message
   - `machine_end_silence` → VM greeting ended with silence
   - `machine_end_other` → VM greeting ended
   - `fax` → fax machine detected

### Handling AMD in your status callback:

```typescript
// In /api/twilio/status
if (answeredBy === 'human') {
  // Connect to agent — this is a live person
  // The call is already bridged if using answerOnBridge
} else if (answeredBy?.startsWith('machine')) {
  // Voicemail detected — auto-drop pre-recorded VM
  await dropVoicemail(callSid, campaignId);
  // Log as voicemail, advance to next in queue
}
```

### Auto Voicemail Drop:

```typescript
async function dropVoicemail(callSid: string, campaignId: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  
  // Get the VM recording URL for this campaign
  const { data: campaign } = await supabase.from('campaigns')
    .select('voicemail_drop_url')
    .eq('id', campaignId)
    .single();
  
  if (!campaign?.voicemail_drop_url) return;
  
  // Update the call to play the voicemail recording, then hang up
  await client.calls(callSid).update({
    twiml: `<Response>
      <Play>${campaign.voicemail_drop_url}</Play>
      <Hangup/>
    </Response>`
  });
}
```

---

## 7. Call Recording (Local — Mac Mini)

**We do NOT use Twilio's built-in recording.** It's expensive at scale ($0.0005/min storage + download costs). Instead, we capture the raw audio via Twilio Media Streams and store/transcribe everything locally on the Mac Mini M2.

### How it works:

1. When a call connects, the TwiML includes a `<Stream>` element that opens a WebSocket
2. Twilio sends raw audio packets (mulaw, 8kHz) over the WebSocket to the Mac Mini
3. A Node/Python process on the Mac Mini receives the stream and writes it to a WAV file
4. When the call ends, the WebSocket closes and the file is finalized
5. The Mac Mini runs Whisper locally to transcribe the recording
6. Transcript + recording metadata are stored in Supabase
7. The recording WAV stays on the Mac Mini's local storage
8. The browser streams playback from the Mac Mini via the Cloudflare tunnel

### TwiML Setup:

Add `<Stream>` to your outbound and inbound dial TwiML. **Remove** the `record` parameter from `<Dial>` — we're not using Twilio recording anymore.

```xml
<Response>
  <Start>
    <Stream url="wss://callmynt-mac.your-tunnel.com/media-stream" track="both_tracks" />
  </Start>
  <Dial answerOnBridge="true" machineDetection="DetectMessageEnd">
    <Number statusCallbackEvent="initiated ringing answered completed"
            statusCallback="https://your-domain.vercel.app/api/twilio/status">
      +18015550140
    </Number>
  </Dial>
</Response>
```

Key: `track="both_tracks"` sends both inbound (prospect) and outbound (agent) audio separately — this gives you dual-channel recording and makes speaker diarization trivial for Whisper.

### Mac Mini WebSocket Server:

This runs on the Mac Mini alongside Dezmon. It's a persistent process (not serverless).

```typescript
// mac-mini/recording-server.ts
// Run with: node recording-server.js (or use pm2 for persistence)

import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const wss = new WebSocket.Server({ port: 8765 });
const RECORDINGS_DIR = '/Users/dezmon/callmynt-recordings';

// Ensure directory exists
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

wss.on('connection', (ws: WebSocket) => {
  let callSid: string = '';
  let streamSid: string = '';
  let inboundChunks: Buffer[] = [];
  let outboundChunks: Buffer[] = [];
  let startTime: number = Date.now();
  
  ws.on('message', (data: string) => {
    const msg = JSON.parse(data);
    
    switch (msg.event) {
      case 'start':
        // Stream is starting — capture metadata
        callSid = msg.start.callSid;
        streamSid = msg.start.streamSid;
        startTime = Date.now();
        console.log(`Recording started: ${callSid}`);
        break;
        
      case 'media':
        // Raw audio packet — mulaw 8kHz
        const audioData = Buffer.from(msg.media.payload, 'base64');
        if (msg.media.track === 'inbound') {
          inboundChunks.push(audioData);  // Prospect audio
        } else {
          outboundChunks.push(audioData); // Agent audio
        }
        break;
        
      case 'stop':
        // Call ended — finalize recording
        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`Recording ended: ${callSid} (${duration}s)`);
        
        // Write raw audio to files
        const dateDir = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const dir = path.join(RECORDINGS_DIR, dateDir);
        fs.mkdirSync(dir, { recursive: true });
        
        const inboundPath = path.join(dir, `${callSid}-inbound.raw`);
        const outboundPath = path.join(dir, `${callSid}-outbound.raw`);
        const wavPath = path.join(dir, `${callSid}.wav`);
        
        fs.writeFileSync(inboundPath, Buffer.concat(inboundChunks));
        fs.writeFileSync(outboundPath, Buffer.concat(outboundChunks));
        
        // Convert mulaw to WAV using ffmpeg (merge both tracks)
        try {
          execSync(`ffmpeg -f mulaw -ar 8000 -ac 1 -i ${inboundPath} -f mulaw -ar 8000 -ac 1 -i ${outboundPath} -filter_complex "[0:a][1:a]amerge=inputs=2[aout]" -map "[aout]" -ar 16000 ${wavPath} -y`);
          
          // Clean up raw files
          fs.unlinkSync(inboundPath);
          fs.unlinkSync(outboundPath);
          
          console.log(`WAV saved: ${wavPath}`);
          
          // Trigger transcription
          transcribeRecording(callSid, wavPath, duration);
          
        } catch (err) {
          console.error('FFmpeg error:', err);
        }
        break;
    }
  });
  
  ws.on('close', () => {
    // WebSocket closed — if we haven't gotten a 'stop' event, finalize anyway
  });
});

console.log('Recording server listening on ws://localhost:8765');
```

### Storage Structure on Mac Mini:

```
/Users/dezmon/callmynt-recordings/
├── 2026-04-01/
│   ├── CA1234567890.wav        ← merged dual-channel WAV
│   ├── CA1234567890.json       ← metadata (callSid, duration, courseId)
│   └── CA1234567890.txt        ← transcript (after Whisper runs)
├── 2026-04-02/
│   ├── ...
```

### Playback from Browser:

The Mac Mini serves recordings via a simple HTTP endpoint through the Cloudflare tunnel:

```typescript
// mac-mini/playback-server.ts (or add route to recording server)
import express from 'express';
const app = express();

app.get('/recordings/:date/:callSid', (req, res) => {
  const filePath = path.join(RECORDINGS_DIR, req.params.date, `${req.params.callSid}.wav`);
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Accept-Ranges', 'bytes'); // Enable seeking in audio player
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).send('Recording not found');
  }
});

app.listen(8766);
```

The browser's audio player points at: `https://callmynt-mac.your-tunnel.com/recordings/2026-04-01/CA1234567890`

---

## 7B. Local Transcription (Whisper on Mac Mini)

**We do NOT use Deepgram or any paid transcription API.** Whisper runs locally on the Mac Mini M2 for free.

### Install Whisper:

Use `whisper.cpp` — the C++ port optimized for Apple Silicon. It's significantly faster than the Python version on M2.

```bash
# On the Mac Mini:
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make -j

# Download the large-v3 model (best accuracy, still fast on M2)
bash models/download-ggml-model.sh large-v3
# Model downloads to: models/ggml-large-v3.bin (~3GB)

# Test it works:
./main -m models/ggml-large-v3.bin -f /path/to/test-audio.wav
```

Performance on Mac Mini M2:
- `large-v3` model: ~4x real-time (5 min call transcribes in ~75 seconds)
- `medium` model: ~8x real-time (5 min call in ~38 seconds)
- `base` model: ~15x real-time (5 min call in ~20 seconds)

**Use `large-v3` for best accuracy.** On M2 it's fast enough that transcription completes well before the next call in most cases.

### Transcription Function:

```typescript
// Called by the recording server after WAV is saved
async function transcribeRecording(callSid: string, wavPath: string, duration: number) {
  const transcriptPath = wavPath.replace('.wav', '.txt');
  const jsonPath = wavPath.replace('.wav', '-segments.json');
  
  try {
    // Run whisper.cpp with JSON output for timestamps
    execSync(
      `/Users/dezmon/whisper.cpp/main \
        -m /Users/dezmon/whisper.cpp/models/ggml-large-v3.bin \
        -f ${wavPath} \
        -otxt -oj \
        --output-file ${wavPath.replace('.wav', '')} \
        -l en \
        --print-progress \
        -t 8`,  // Use 8 threads (M2 has 8 cores)
      { timeout: 300000 } // 5 min max
    );
    
    // Read transcript
    const fullText = fs.readFileSync(transcriptPath, 'utf-8').trim();
    
    // Read segments with timestamps
    let segments = [];
    if (fs.existsSync(jsonPath)) {
      const segData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      segments = segData.transcription || [];
    }
    
    // Count words (rough speaker split based on dual-channel energy)
    // For better speaker diarization, process each channel separately:
    // Run whisper on the inbound (prospect) track and outbound (agent) track separately
    // before merging them, and label each segment accordingly
    
    // Store transcript in Supabase
    await supabase.from('call_transcripts').insert({
      call_id: callSid, // look up internal ID from provider_call_id
      full_text: fullText,
      segments: segments,
      transcription_model: 'whisper-large-v3',
      processed_locally: true,
    });
    
    // Update recording status
    await supabase.from('call_recordings').update({
      transcription_status: 'completed',
      transcript_path: transcriptPath,
    }).eq('call_id', callSid);
    
    console.log(`Transcribed: ${callSid} (${fullText.length} chars)`);
    
    // Trigger OpenClaw analysis
    // Trigger OpenClaw analysis (same Mac Mini, uses ChromaDB for persistent memory)
    await triggerOpenClawAnalysis(callSid, fullText);
    
  } catch (err) {
    console.error(`Transcription failed for ${callSid}:`, err);
    
    // Mark as failed in Supabase so we can retry
    await supabase.from('call_recordings').update({
      transcription_status: 'failed',
    }).eq('call_id', callSid);
  }
}
```

### Better Speaker Diarization (Dual-Channel Approach):

Since we capture inbound and outbound audio as separate tracks from the Media Stream, we can transcribe each channel independently for perfect speaker labeling:

```typescript
async function transcribeDualChannel(callSid: string, dir: string) {
  const inboundRaw = path.join(dir, `${callSid}-inbound.raw`);
  const outboundRaw = path.join(dir, `${callSid}-outbound.raw`);
  
  // Convert each channel to WAV separately
  const inWav = path.join(dir, `${callSid}-prospect.wav`);
  const outWav = path.join(dir, `${callSid}-agent.wav`);
  
  execSync(`ffmpeg -f mulaw -ar 8000 -ac 1 -i ${inboundRaw} -ar 16000 ${inWav} -y`);
  execSync(`ffmpeg -f mulaw -ar 8000 -ac 1 -i ${outboundRaw} -ar 16000 ${outWav} -y`);
  
  // Transcribe each channel with timestamps
  execSync(`whisper.cpp/main -m models/ggml-large-v3.bin -f ${inWav} -oj --output-file ${dir}/${callSid}-prospect -l en -t 4`);
  execSync(`whisper.cpp/main -m models/ggml-large-v3.bin -f ${outWav} -oj --output-file ${dir}/${callSid}-agent -l en -t 4`);
  
  // Merge transcripts with speaker labels, sorted by timestamp
  const prospectSegs = JSON.parse(fs.readFileSync(`${dir}/${callSid}-prospect.json`, 'utf-8'))
    .transcription.map(s => ({ ...s, speaker: 'Prospect' }));
  const agentSegs = JSON.parse(fs.readFileSync(`${dir}/${callSid}-agent.json`, 'utf-8'))
    .transcription.map(s => ({ ...s, speaker: 'Agent' }));
  
  const merged = [...prospectSegs, ...agentSegs]
    .sort((a, b) => a.timestamps.from.localeCompare(b.timestamps.from));
  
  // This gives you a perfect speaker-labeled transcript:
  // [00:02] Agent: "Hi, I'm Alex with BYRDGANG..."
  // [00:08] Prospect: "Yeah, who are you looking for?"
  
  return merged;
}
```

This dual-channel approach gives you **perfect speaker diarization with zero AI cost** — no need for a separate diarization model.

### Transcription Queue:

If calls are ending faster than Whisper can transcribe (e.g., multiple parallel dials ending simultaneously), queue the jobs:

```typescript
// Simple file-based queue, or use a proper queue like BullMQ
const transcriptionQueue: string[] = [];
let isProcessing = false;

function enqueueTranscription(callSid: string, wavPath: string, duration: number) {
  transcriptionQueue.push(JSON.stringify({ callSid, wavPath, duration }));
  processQueue();
}

async function processQueue() {
  if (isProcessing || transcriptionQueue.length === 0) return;
  isProcessing = true;
  
  while (transcriptionQueue.length > 0) {
    const job = JSON.parse(transcriptionQueue.shift()!);
    await transcribeRecording(job.callSid, job.wavPath, job.duration);
  }
  
  isProcessing = false;
}
```

### Disk Space Management:

At ~1MB per minute of audio (16kHz WAV), 200 calls/day × 2 min avg = ~400MB/day. That's ~12GB/month. The Mac Mini has 256GB+ SSD.

Set up a cleanup cron that:
- Keeps recordings for 90 days
- After 90 days, deletes the WAV but keeps the transcript
- Or archives to an external drive / cheap cloud storage (Backblaze B2 at $0.005/GB/month)

---

## 8. Call Transfer

### 8a. Cold Transfer (immediate hand-off)

```typescript
// app/api/calls/[id]/transfer/route.ts
export async function POST(req: Request) {
  const { targetAgentId, callSid } = await req.json();
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  
  // Update the live call to dial the target agent's browser
  await client.calls(callSid).update({
    twiml: `<Response>
      <Dial>
        <Client>${targetAgentId}</Client>
      </Dial>
    </Response>`
  });
  
  // The original agent is disconnected, call routes to target agent
  // Target agent's browser fires the 'incoming' event
}
```

### 8b. Warm Transfer (three-way conference)

This is more complex — you create a conference, move both agents in, then the original agent drops out.

```typescript
// 1. Move current call to a conference
await client.calls(callSid).update({
  twiml: `<Response>
    <Dial>
      <Conference>transfer-${callSid}</Conference>
    </Dial>
  </Response>`
});

// 2. Call the target agent into the same conference
await client.calls.create({
  to: `client:${targetAgentId}`,
  from: callerIdNumber,
  twiml: `<Response>
    <Dial>
      <Conference>transfer-${callSid}</Conference>
    </Dial>
  </Response>`
});

// 3. All three parties are in the conference
// Original agent briefs the target agent
// Original agent hangs up → two remaining parties continue
```

---

## 9. Parallel Dialing

Parallel dialing calls 2-5 numbers simultaneously and connects the rep to the first human that answers. The others are dropped.

### How to implement:

```typescript
async function parallelDial(agent: Agent, contacts: Contact[], lineCount: number) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  
  // Take the next N contacts from the queue
  const batch = contacts.slice(0, lineCount);
  
  // Dial all simultaneously
  const calls = await Promise.all(batch.map(contact => 
    client.calls.create({
      to: contact.phone,
      from: getCallerIdForRegion(contact.state), // local presence
      url: `${APP_URL}/api/twilio/parallel-connect?agentId=${agent.id}&contactId=${contact.id}`,
      machineDetection: 'DetectMessageEnd',
      machineDetectionTimeout: 5,
      statusCallback: `${APP_URL}/api/twilio/parallel-status?agentId=${agent.id}&contactId=${contact.id}`,
      statusCallbackEvent: ['answered', 'completed'],
      timeout: 30, // ring for 30 seconds max
    })
  ));
  
  // Store all call SIDs so we can cancel the others when one connects
  return calls.map(c => c.sid);
}
```

### Parallel Connect Webhook (first human to answer wins):

```typescript
// app/api/twilio/parallel-connect/route.ts
export async function POST(req: Request) {
  const body = await req.formData();
  const answeredBy = body.get('AnsweredBy') as string;
  const callSid = body.get('CallSid') as string;
  const agentId = new URL(req.url).searchParams.get('agentId');
  const contactId = new URL(req.url).searchParams.get('contactId');
  
  const response = new twilio.twiml.VoiceResponse();
  
  if (answeredBy === 'human') {
    // Check if agent is already connected to another call from this batch
    const agentBusy = await isAgentAlreadyConnected(agentId!);
    
    if (!agentBusy) {
      // This is the first human pickup — connect to agent
      await markAgentConnected(agentId!, callSid);
      
      // Cancel all other parallel calls
      await cancelOtherCalls(agentId!, callSid);
      
      // Bridge to agent's browser
      const dial = response.dial({
        record: 'record-from-answer-dual',
        recordingStatusCallback: `${APP_URL}/api/twilio/recording`,
      });
      dial.client(agentId!);
      
    } else {
      // Agent already connected to someone else — hang up this one
      response.hangup();
    }
  } else {
    // Voicemail — auto-drop and move on
    await dropVoicemail(callSid, contactId!);
    response.hangup();
  }
  
  return new Response(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

async function cancelOtherCalls(agentId: string, keepCallSid: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  
  // Get all active call SIDs for this agent's parallel batch
  const activeCalls = await getActiveParallelCalls(agentId);
  
  for (const sid of activeCalls) {
    if (sid !== keepCallSid) {
      try {
        await client.calls(sid).update({ status: 'completed' });
      } catch (e) {
        // Call may have already ended
      }
    }
  }
}
```

### Important parallel dialing notes:
- **Latency:** There's a ~0.5-1s delay when connecting the human to the agent after AMD detection. This is normal but can confuse prospects. Some teams add a brief "Please hold while we connect you" message.
- **Compliance:** Parallel dialing with dropped calls (human answers but agent is already connected to another) can violate TCPA if the drop rate exceeds 3% of answered calls. Track your drop rate.
- **Cost:** You're billed for every leg of every parallel call, even the ones that get canceled. 5-line parallel = ~5x the per-minute cost.

---

## 10. Local Presence (Caller ID Rotation)

Showing a local area code dramatically increases answer rates.

### Strategy:
1. Buy numbers in each target area code (801, 435 for Utah, 512 for Texas, etc.)
2. Store numbers in `phone_numbers` table with area code and health score
3. When dialing, select a number that matches the prospect's area code
4. Rotate numbers to prevent any single number from getting flagged as spam

```typescript
function getCallerIdForRegion(prospectPhone: string): string {
  const areaCode = prospectPhone.replace(/\D/g, '').substring(0, 3);
  
  // Find a healthy local number matching the area code
  const { data: numbers } = await supabase.from('phone_numbers')
    .select('number, health_score')
    .eq('area_code', areaCode)
    .gte('health_score', 70) // only use healthy numbers
    .order('last_used_at', { ascending: true }) // rotate: least recently used first
    .limit(1);
  
  if (numbers && numbers.length > 0) {
    // Update last_used_at
    await supabase.from('phone_numbers')
      .update({ last_used_at: new Date().toISOString() })
      .eq('number', numbers[0].number);
    return numbers[0].number;
  }
  
  // Fallback to a general number
  return process.env.TWILIO_PHONE_NUMBER!;
}
```

### Number Health Monitoring:
- Check Twilio's spam score API periodically
- Track answer rates per number — if a number's answer rate drops significantly, retire it
- CRON job: `/api/cron/number-health` runs daily

---

## 11. SMS

### Send SMS (from quick actions or auto-triggers):

```typescript
// app/api/sms/send/route.ts
export async function POST(req: Request) {
  const { to, body, from, courseId, agentId, template } = await req.json();
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  
  const message = await client.messages.create({
    to: to,
    from: from || process.env.TWILIO_PHONE_NUMBER!,
    body: body + '\n\nReply STOP to unsubscribe', // compliance footer
  });
  
  // Log to activity timeline
  await supabase.from('sms_messages').insert({
    course_id: courseId,
    agent_id: agentId,
    direction: 'outbound',
    to_number: to,
    from_number: from,
    body: body,
    provider_sid: message.sid,
    status: message.status,
  });
  
  return Response.json({ success: true, sid: message.sid });
}
```

### Auto-SMS for hold queue threshold:

```typescript
// Called when hold time exceeds threshold
async function sendHoldSMS(callerPhone: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  
  await client.messages.create({
    to: callerPhone,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body: "Thanks for calling BYRDGANG. Our team is currently on other calls. A rep will call you back within 10 minutes.",
  });
}
```

---

## 12. Real-Time Live Transcription (Phase 2 — During Call)

Media Streams are already running for recording (section 7). For Phase 2, extend the recording server to also do live transcription during the call, feeding results to OpenClaw for real-time coaching.

### Approach:

The Mac Mini recording server already receives audio packets in real-time. Instead of only writing to disk, fork the stream to a Whisper instance running in streaming mode:

1. Audio packets arrive via WebSocket (already happening)
2. Buffer 3-5 seconds of audio
3. Feed buffer to Whisper for incremental transcription
4. Push partial transcript to Supabase Realtime (the browser is subscribed)
5. Every 30 seconds, send accumulated transcript to OpenClaw for coaching tips
6. Push coaching suggestions to the browser via Supabase Realtime

### Tools:
- `whisper.cpp` supports streaming mode via `stream` binary
- Or use `faster-whisper` Python with VAD (voice activity detection) for better chunking
- The Mac Mini M2 can handle real-time transcription alongside recording — it has headroom

### Key difference from Phase 1:
- Phase 1 (recording): transcribe AFTER the call ends. Simple, reliable.
- Phase 2 (live): transcribe DURING the call. More complex, needs streaming Whisper + latency management.

**Build Phase 1 first.** Get recording + post-call transcription solid before attempting real-time.

---

## 13. Call Flow: Power Dialer Session (putting it all together)

Here's the complete sequence when a rep starts power dialing:

```
1. Rep clicks "Start Dialing"
   → Browser calls GET /api/twilio/token
   → Browser initializes Twilio Device with token
   
2. Dialer picks next contact from campaign queue
   → Browser calls POST /api/calls/initiate with { courseId, phone, campaignId }
   → Server stores call record in Supabase
   → Browser calls device.connect({ To: phone, CallerId: localNumber })
   
3. Twilio receives connection request
   → Hits POST /api/twilio/voice
   → Returns TwiML: <Dial> with AMD enabled + <Stream> to Mac Mini
   → Twilio dials the prospect's number
   
4a. AMD detects HUMAN
   → Status callback fires with AnsweredBy=human
   → Call bridges to agent's browser
   → Agent hears the prospect, prospect hears agent
   → Media Stream sends audio to Mac Mini (recording in progress)
   → UI transitions to CONNECTED state
   → Agent talks, takes notes, uses script
   
4b. AMD detects VOICEMAIL
   → Status callback fires with AnsweredBy=machine_end_beep
   → Server auto-drops pre-recorded voicemail
   → Call logged as "voicemail"
   → Dialer auto-advances to next contact
   
4c. NO ANSWER after 30 seconds
   → Status callback fires with CallStatus=no-answer
   → Call logged as "no answer"
   → Dialer auto-advances to next contact
   
5. Call ends (agent hangs up or prospect hangs up)
   → Status callback fires with CallStatus=completed
   → Media Stream closes → Mac Mini finalizes WAV file
   → Mac Mini runs Whisper transcription (async, ~30-75 seconds)
   → Transcript stored in Supabase → OpenClaw analysis triggered
   → UI transitions to WRAP-UP state
   → Agent selects disposition
   → Pipeline actions triggered
   → Dialer auto-advances (after countdown)
   
6. Between calls
   → 1-3 second gap for disposition
   → Next contact loaded
   → Repeat from step 2
   
7. Inbound arrives at any point
   → Twilio fires incoming event on the Device
   → Dialer pauses
   → Inbound call connected
   → After inbound handled → resume outbound flow
```

---

## 14. Costs to Plan For

| Item | Cost |
|------|------|
| Phone numbers | $1/month per number |
| Outbound calls | ~$0.014/min |
| Inbound calls | ~$0.0085/min |
| Media Streams (for recording) | $0.004/min (replaces Twilio recording) |
| SMS outbound | $0.0079/message |
| AMD | Included (no extra cost) |
| Twilio Client (browser) | No per-minute cost for the browser leg |
| Recording storage | FREE — local Mac Mini SSD |
| Transcription (Whisper) | FREE — local Mac Mini |
| Call analysis (OpenClaw) | ~FREE — runs locally on Mac Mini via Gemini Flash or Kimi K2.5 |

**Estimate for 1 agent doing 200 calls/day:**
- ~100 connected calls × 2 min avg = 200 min outbound = ~$2.80/day
- Media streams: 200 min × $0.004 = ~$0.80/day
- SMS: ~10 messages/day = ~$0.08/day
- Phone numbers: 5 numbers × $1 = $5/month
- AI analysis: FREE (OpenClaw + local model on Mac Mini)
- **Total: ~$75-95/month per agent** (Twilio only)
- **Savings vs cloud stack (Twilio recording + Deepgram + Claude): ~$300+/month per agent**

---

## 15. Common Gotchas

1. **CORS on webhooks:** Twilio sends POST requests to your webhooks. Make sure your API routes don't have CORS restrictions for Twilio's IPs.

2. **Webhook signature validation:** Always validate that incoming requests are actually from Twilio using `twilio.validateRequest()`. This prevents spoofed webhook calls.

3. **Token expiry:** Access tokens expire after the TTL you set (1 hour recommended). The `tokenWillExpire` event fires ~30 seconds before expiry — refresh the token then.

4. **Firewall / TURN:** Some corporate networks block WebRTC. Twilio handles TURN server fallback automatically, but extreme firewalls can still block calls.

5. **AMD latency:** AMD takes 2-5 seconds to determine human vs machine. During this time, the prospect hears silence. Some teams add a brief delay message: "Connecting you now..." to fill the gap.

6. **Recording access:** Recordings are stored on Twilio's servers and accessible via authenticated URLs. Download and store in Supabase quickly, then delete from Twilio to reduce costs.

7. **Concurrent call limits:** New Twilio accounts have a default limit of 1 concurrent call. Request a limit increase to match your parallel dialing needs.

8. **Vercel cold starts:** Serverless functions can have ~500ms cold starts. For real-time webhook responses (TwiML), this is usually fine, but monitor latency.

---

*This is the complete Twilio integration reference. Follow the section order — set up auth first, then browser calling, then outbound, then inbound, then recording, then AMD. Test each piece in isolation before combining.*
