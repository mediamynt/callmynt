import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const RECORDINGS_DIR = process.env.CALLMYNT_RECORDINGS_DIR || '/Users/dezmon/callmynt-recordings';
const port = Number(process.env.PLAYBACK_PORT || 8766);

function sendFile(filePath: string, res: http.ServerResponse) {
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'audio/wav',
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
  });
  fs.createReadStream(filePath).pipe(res);
}

http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400).end('Bad request');
    return;
  }

  const match = req.url.match(/^\/recordings\/(.+)$/);
  if (!match) {
    res.writeHead(404).end('Not found');
    return;
  }

  const relativePath = match[1].replace(/\.\./g, '');
  const filePath = path.join(RECORDINGS_DIR, relativePath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404).end('Recording not found');
    return;
  }

  sendFile(filePath, res);
}).listen(port, () => {
  console.log(`Playback server listening on http://localhost:${port}`);
});
