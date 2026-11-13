import { createServer } from 'node:http';
import { createDatabase } from './database.mjs';
import { register } from './register.mjs';
import { verificationPage, verifyEmail } from './verify-email.mjs';
import { resendOtp } from './email-otp.mjs';
import { sendEmailOtp } from './email-delivery.mjs';

let pool;
try {
  pool = createDatabase(process.env);
} catch {
  console.error('Check DATABASE_URL or the MySQL settings in backend/.env.');
  process.exit(1);
}

const host = process.env.API_HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 3001);
const address = `${host}:${port}`;
const devCodes = host === '127.0.0.1' && process.env.DEV_EMAIL_VERIFICATION === 'true' && process.env.NODE_ENV !== 'production';

createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');

  if (['/auth/register', '/auth/verify-email', '/auth/resend-otp'].includes(request.url)) {
    const origin = request.headers.origin;
    response.setHeader('Vary', 'Origin');
    if (origin && (origin === process.env.WEB_ORIGIN || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Methods', 'POST');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-UniCommu-Verification');
    }
    if (request.method === 'OPTIONS') {
      response.writeHead(204).end();
      return;
    }
  }

  if (request.method === 'POST' && (request.url === '/auth/register' || request.url === '/auth/resend-otp')) {
    const localRequested = request.headers['x-unicommu-verification'] === 'local';
    const local = localRequested && devCodes && request.headers.host === address;
    if (localRequested && !local) {
      response.writeHead(503).end(JSON.stringify({ error: 'local_verification_disabled' }));
      return;
    }
    const handle = request.url === '/auth/register' ? register : resendOtp;
    const { status, body } = await handle(request, pool, sendEmailOtp, local);
    response.writeHead(status).end(JSON.stringify(body));
    return;
  }

  if (request.url === '/auth/verify-email') {
    if (request.method === 'GET') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.setHeader('Referrer-Policy', 'no-referrer');
      response.writeHead(200).end(verificationPage);
      return;
    }
    if (request.method === 'POST') {
      const { status, body } = await verifyEmail(request, pool);
      response.writeHead(status).end(JSON.stringify(body));
      return;
    }
  }

  if (request.method !== 'GET' || request.url !== '/health') {
    response.writeHead(404).end(JSON.stringify({ status: 'not_found' }));
    return;
  }

  try {
    await pool.check();
    response.writeHead(200).end(JSON.stringify({ status: 'ok', database: 'connected' }));
  } catch (error) {
    console.error('Database health check failed:', error.code ?? error.name);
    response.writeHead(503).end(JSON.stringify({ status: 'unavailable', database: 'unavailable' }));
  }
}).listen(port, host, () => {
  console.log(`UniCommu API running at http://${host}:${port}/health`);
});
