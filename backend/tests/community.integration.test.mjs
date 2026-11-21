import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { createDatabase } from '../src/database/connection.mjs';
import { createSession } from '../src/auth/session.mjs';
import { createCommunityHandler } from '../src/community/routes.mjs';

test(
  'configured PostgreSQL executes community SQL; all test data rolls back',
  { skip: process.env.RUN_COMMUNITY_DB_TESTS !== 'true' },
  async () => {
    const db = createDatabase(process.env);
    const rollback = Symbol('rollback synthetic community data');
    const email = `community-test-${randomUUID()}@rmutp.ac.th`;
    try {
      await assert.rejects(
        db.transaction(async (tx) => {
          const nested = { ...tx, transaction: (work) => work(nested) };
          await tx.execute(
            `INSERT INTO ${tx.users}(email,display_name,password_hash,role,email_verified_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)`,
            [email, 'Community integration', 'not-a-real-password', 'student'],
          );
          const [[user]] = await tx.execute(
            `SELECT id,display_name,role FROM ${tx.users} WHERE email=?`,
            [email],
          );
          const session = await createSession(tx, user);
          const handle = createCommunityHandler({
            ready: false,
            sign: async () => {
              throw new Error('No media expected');
            },
          });
          async function call(path, method = 'GET', input) {
            const req = Readable.from(
              input ? [Buffer.from(JSON.stringify(input))] : [],
            );
            req.url = '/community' + path;
            req.method = method;
            req.headers = {
              authorization: `Bearer ${session.token}`,
              'content-type': 'application/json',
            };
            return handle(req, nested);
          }
          const input = {
            body: 'ข้อความทดสอบฐานข้อมูล #ทดสอบ',
            clientRequestId: randomUUID(),
          };
          const created = await call('/posts', 'POST', input);
          assert.equal(created.status, 201);
          const id = created.body.item.id;
          assert.equal((await call('/posts', 'POST', input)).body.item.id, id);
          assert.equal(
            (await call(`/posts/${id}/like`, 'PUT')).body.item.likeCount,
            1,
          );
          await call(`/posts/${id}/bookmark`, 'PUT');
          assert.equal((await call('/posts?saved=1')).body.items.length, 1);
          assert.equal(
            (
              await call(`/posts/${id}/comments`, 'POST', {
                body: 'ความคิดเห็นจริง',
                clientRequestId: randomUUID(),
              })
            ).status,
            201,
          );
          assert.equal(
            (await call(`/posts/${id}/comments`)).body.items.length,
            1,
          );
          assert.equal((await call('/catalog')).status, 200);
          throw rollback;
        }),
        (error) => error === rollback,
      );
      const [remaining] = await db.execute(
        `SELECT id FROM ${db.users} WHERE email=?`,
        [email],
      );
      assert.equal(remaining.length, 0);
    } finally {
      await db.close();
    }
  },
);
