import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';

test('HTTP auth routes handle domain rejection, missing tokens and CORS preflight', async () => {
  const socket = createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  const child = spawn(process.execPath, ['src/server.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, API_HOST: '127.0.0.1', PORT: String(port), DATABASE_URL: '', DB_PASSWORD: 'test-only-not-used', WEB_ORIGIN: 'https://app.example.test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Test API did not start')), 5000);
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
      child.once('exit', () => { clearTimeout(timeout); reject(new Error('Test API exited early')); });
      child.stdout.on('data', () => { clearTimeout(timeout); resolve(); });
    });
    const base = `http://127.0.0.1:${port}`;
    const response = await fetch(`${base}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com', password: 'some password' }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'university_email_required');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await fetch(`${base}/auth/session`)).status, 401);
    assert.equal((await fetch(`${base}/auth/logout`, { method: 'POST' })).status, 401);
    const preflight = await fetch(`${base}/auth/logout`, {
      method: 'OPTIONS', headers: { Origin: 'https://app.example.test', 'Access-Control-Request-Headers': 'authorization' },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://app.example.test');
    assert.match(preflight.headers.get('access-control-allow-headers'), /Authorization/);
    const forbidden = await fetch(`${base}/auth/login`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example.test' } });
    assert.equal(forbidden.headers.has('access-control-allow-origin'), false);
  } finally {
    child.kill();
    await once(child, 'exit');
  }
});
