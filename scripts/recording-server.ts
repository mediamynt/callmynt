import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const RECORDINGS_DIR = process.env.CALLMYNT_RECORDINGS_DIR || '/Users/dezmon/callmynt-recordings';
const TRANSCRIBE_SCRIPT = path.join(process.cwd(), 'scripts', 'transcribe.ts');

type MediaMessage = {
  event: 'start' | 'media' | 'stop';
  start?: {
    callSid?: string;
    streamSid?: string;
    customParameters?: Record<string, string>;
  };
  media?: {
    track?: 'inbound' | 'outbound';
    payload?: string;
  };
};

type SessionState = {
  callSid: string;
  startedAt: number;
  metadata: Record<string, string>;
  inboundChunks: Buffer[];
  outboundChunks: Buffer[];
};

const queue: Array<() => Promise<void>> = [];
let running = 0;
const concurrency = Number(process.env.TRANSCRIPTION_CONCURRENCY || 2);

function enqueue(job: () => Promise<void>) {
  queue.push(job);
  void drain();
}

async function drain() {
  if (running >= concurrency || queue.length === 0) return;
  running += 1;
  const job = queue.shift();
  if (!job) {
    running -= 1;
    return;
  }

  try {
    await job();
  } finally {
    running -= 1;
    void drain();
  }
}

async function transcribeRecording(wavPath: string, metadataPath: string) {
  await execFileAsync('node', [TRANSCRIBE_SCRIPT, '--wav', wavPath, '--meta', metadataPath], {
    env: process.env,
  });
}

async function finalizeSession(state: SessionState) {
  const dateDir = new Date().toISOString().slice(0, 10);
  const dir = path.join(RECORDINGS_DIR, dateDir, state.callSid);
  fs.mkdirSync(dir, { recursive: true });

  const inboundRaw = path.join(dir, `${state.callSid}-inbound.raw`);
  const outboundRaw = path.join(dir, `${state.callSid}-outbound.raw`);
  const inboundWav = path.join(dir, `${state.callSid}-inbound.wav`);
  const outboundWav = path.join(dir, `${state.callSid}-outbound.wav`);
  const mergedWav = path.join(dir, `${state.callSid}.wav`);
  const metadataPath = path.join(dir, `${state.callSid}.json`);
  const duration = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));

  fs.writeFileSync(inboundRaw, Buffer.concat(state.inboundChunks));
  fs.writeFileSync(outboundRaw, Buffer.concat(state.outboundChunks));
  fs.writeFileSync(metadataPath, JSON.stringify({
    callSid: state.callSid,
    duration,
    storagePath: `${dateDir}/${state.callSid}/${state.callSid}.wav`,
    ...state.metadata,
  }, null, 2));

  await execFileAsync('ffmpeg', ['-f', 'mulaw', '-ar', '8000', '-ac', '1', '-i', inboundRaw, '-ar', '16000', inboundWav, '-y']);
  await execFileAsync('ffmpeg', ['-f', 'mulaw', '-ar', '8000', '-ac', '1', '-i', outboundRaw, '-ar', '16000', outboundWav, '-y']);
  await execFileAsync('ffmpeg', [
    '-i', inboundWav,
    '-i', outboundWav,
    '-filter_complex', '[0:a][1:a]amerge=inputs=2[aout]',
    '-map', '[aout]',
    '-ac', '2',
    '-ar', '16000',
    mergedWav,
    '-y',
  ]);

  enqueue(async () => {
    console.log(`Transcribing ${state.callSid}`);
    await transcribeRecording(mergedWav, metadataPath);
  });
}

async function main() {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

  const { WebSocketServer } = await import('ws');
  const wss = new WebSocketServer({ port: Number(process.env.RECORDING_WS_PORT || 8765), path: '/media-stream' });

  wss.on('connection', (socket) => {
    const state: SessionState = {
      callSid: '',
      startedAt: Date.now(),
      metadata: {},
      inboundChunks: [],
      outboundChunks: [],
    };

    socket.on('message', (buffer) => {
      const message = JSON.parse(buffer.toString()) as MediaMessage;
      if (message.event === 'start') {
        state.callSid = message.start?.callSid || `call-${Date.now()}`;
        state.metadata = message.start?.customParameters || {};
        state.startedAt = Date.now();
        return;
      }

      if (message.event === 'media' && message.media?.payload) {
        const chunk = Buffer.from(message.media.payload, 'base64');
        if (message.media.track === 'outbound') {
          state.outboundChunks.push(chunk);
        } else {
          state.inboundChunks.push(chunk);
        }
        return;
      }

      if (message.event === 'stop' && state.callSid) {
        void finalizeSession(state).catch((error) => {
          console.error(`Failed to finalize ${state.callSid}`, error);
        });
      }
    });
  });

  console.log(`Recording server listening on ws://localhost:${process.env.RECORDING_WS_PORT || 8765}/media-stream`);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
