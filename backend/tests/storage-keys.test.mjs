import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPostStorage } from '../src/community/storage.mjs';

test('new Supabase secret keys use apikey without an invalid Bearer JWT', async () => {
  let headers;
  const storage = createPostStorage({
    SUPABASE_URL: 'https://fixture.supabase.co',
    SUPABASE_SECRET_KEY: 'sb_secret_fixture_value',
    SUPABASE_SERVICE_ROLE_KEY: 'unused-legacy-fixture',
  }, async (_url, options) => {
    headers = options.headers;
    return { ok: true, json: async () => ({}) };
  });
  await storage.upload('1/fixture.webp', Buffer.from('fixture'));
  assert.equal(headers.apikey, 'sb_secret_fixture_value');
  assert.equal(Object.hasOwn(headers, 'Authorization'), false);
});

test('legacy service_role configuration remains compatible', async () => {
  let headers;
  const storage = createPostStorage({
    SUPABASE_URL: 'https://fixture.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'legacy-fixture-value',
  }, async (_url, options) => {
    headers = options.headers;
    return { ok: true, json: async () => ({}) };
  });
  await storage.setup();
  assert.equal(headers.Authorization, 'Bearer legacy-fixture-value');
  assert.equal(headers.apikey, 'legacy-fixture-value');
});
