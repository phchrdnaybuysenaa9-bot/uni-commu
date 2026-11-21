import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import sharp from 'sharp';
import { createCommunityHandler } from '../src/community/routes.mjs';
import { createSession } from '../src/auth/session.mjs';
import { sanitizeImage } from '../src/community/storage.mjs';

test('community persistence, ownership, pagination, multi-faculty scope, comments and media', async (t) => {
  const pg = new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
  await pg.exec(
    await readFile(
      new URL(
        '../../supabase/migrations/20261110072844_unicommu_auth.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  await pg.exec(
    await readFile(
      new URL(
        '../../supabase/migrations/20261121090000_community.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const adapter = (client) => ({
    dialect: 'postgres',
    users: 'unicommu.users',
    sessions: 'unicommu.sessions',
    now: 'CURRENT_TIMESTAMP',
    async execute(sql, values = []) {
      let i = 0;
      const r = await client.query(
        sql.replaceAll('?', () => `$${++i}`),
        values,
      );
      return [
        /^\s*SELECT/i.test(sql) ? r.rows : { affectedRows: r.affectedRows },
      ];
    },
    transaction: (fn) => pg.transaction((tx) => fn(adapter(tx))),
  });
  const db = adapter(pg);
  const storage = {
    ready: true,
    sign: async (path) => `https://storage.example.test/${path}`,
    upload: async () => {},
    remove: async () => {},
  };
  const handle = createCommunityHandler(storage);
  const users = [];
  for (const [i, role] of [
    'student',
    'student',
    'department',
    'admin',
  ].entries()) {
    const r = await pg.query(
      'INSERT INTO unicommu.users(email,display_name,password_hash,role,email_verified_at) VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP) RETURNING id',
      ['test' + i + '@rmutp.ac.th', 'User ' + i, 'not-a-real-password', role],
    );
    const session = await createSession(db, {
      ...r.rows[0],
      display_name: 'User ' + i,
      role,
    });
    users.push(session);
  }
  const request = async (path, method = 'GET', input, session = users[0]) => {
    const req = Readable.from(
      input === undefined ? [] : [Buffer.from(JSON.stringify(input))],
    );
    req.url = '/community' + path;
    req.method = method;
    req.headers = {
      'content-type': 'application/json',
      ...(session ? { authorization: 'Bearer ' + session.token } : {}),
    };
    return handle(req, db);
  };
  let postId;
  await t.test(
    'rejects unauthenticated access and forged author/faculty; supports optional hashtags and idempotency',
    async () => {
      assert.equal(
        (await request('/posts', 'GET', undefined, null)).status,
        401,
      );
      const input = {
        body: 'ชวนอ่านหนังสือ #ศูนย์A #เพื่อน #เพื่อน',
        category: 'เรื่องเรียน',
        clientRequestId: 'post_request_0000001',
      };
      assert.equal(
        (
          await request('/posts', 'POST', {
            ...input,
            authorId: users[1].user.id,
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request('/posts', 'POST', {
            ...input,
            facultyIds: [randomUUID()],
          })
        ).status,
        400,
      );
      const first = await request('/posts', 'POST', input);
      assert.equal(first.status, 201);
      postId = first.body.item.id;
      assert.equal(first.body.item.author.id, users[0].user.id);
      assert.deepEqual(first.body.item.faculties, []);
      assert.equal(first.body.item.tags.length, 2);
      assert.equal(JSON.stringify(first.body).includes('password'), false);
      assert.equal(
        (await request('/posts', 'POST', input)).body.item.id,
        postId,
      );
      assert.equal(
        (await request('/posts', 'POST', { ...input, body: 'different' }))
          .status,
        409,
      );
      const plain = await request('/posts', 'POST', {
        body: 'ไม่มีแท็ก',
        clientRequestId: 'post_request_0000002',
      });
      assert.equal(plain.status, 201);
      assert.deepEqual(plain.body.item.tags, []);
    },
  );
  await t.test(
    'likes and bookmarks persist per account and repeated PUT never duplicates',
    async () => {
      await request(`/posts/${postId}/like`, 'PUT');
      await request(`/posts/${postId}/like`, 'PUT');
      const read = await request(`/posts/${postId}`);
      assert.equal(read.body.item.likeCount, 1);
      assert.equal(read.body.item.liked, true);
      assert.equal(
        (await request(`/posts/${postId}`, 'GET', undefined, users[1])).body
          .item.liked,
        false,
      );
      await request(`/posts/${postId}/bookmark`, 'PUT');
      assert.equal((await request('/posts?saved=1')).body.items.length, 1);
      assert.equal(
        (await request('/posts?saved=1', 'GET', undefined, users[1])).body.items
          .length,
        0,
      );
      await request(`/posts/${postId}/like`, 'DELETE');
      assert.equal((await request(`/posts/${postId}`)).body.item.likeCount, 0);
    },
  );
  await t.test(
    'cursor pagination has no gaps or overlaps; filters are bounded and parameterized',
    async () => {
      const a = await request('/posts?limit=1');
      assert.ok(a.body.nextCursor);
      const b = await request('/posts?limit=1&cursor=' + a.body.nextCursor);
      assert.equal(b.body.items.length, 1);
      assert.notEqual(a.body.items[0].id, b.body.items[0].id);
      assert.equal((await request('/posts?limit=10000')).status, 400);
      assert.equal((await request('/posts?cursor=invalid')).status, 400);
      assert.equal(
        (await request('/posts?q=' + encodeURIComponent("' OR 1=1 --"))).body
          .items.length,
        0,
      );
    },
  );
  const faculties = [randomUUID(), randomUUID(), randomUUID()];
  const program = randomUUID();
  const organization = randomUUID();
  await t.test(
    'approved club can assign multiple faculties and programs; unapproved department cannot',
    async () => {
      for (const [i, id] of faculties.entries())
        await pg.query(
          'INSERT INTO unicommu.faculties(id,name) VALUES ($1,$2)',
          [id, 'Faculty ' + i],
        );
      await pg.query(
        'INSERT INTO unicommu.programs(id,faculty_id,name) VALUES ($1,$2,$3)',
        [program, faculties[1], 'Program B'],
      );
      await pg.query(
        'INSERT INTO unicommu.organizations(id,name,kind) VALUES ($1,$2,$3)',
        [organization, 'Club A', 'student_club'],
      );
      for (const id of faculties.slice(0, 2))
        await pg.query(
          'INSERT INTO unicommu.organization_faculties VALUES ($1,$2)',
          [organization, id],
        );
      const input = {
        facultyIds: faculties.slice(0, 2),
        programIds: [program],
      };
      assert.equal(
        (await request(`/posts/${postId}/labels`, 'PUT', input, users[2]))
          .status,
        403,
      );
      await pg.query(
        'INSERT INTO unicommu.organization_members(organization_id,user_id,approved_by) VALUES ($1,$2,$3)',
        [organization, users[2].user.id, users[3].user.id],
      );
      const labelled = await request(
        `/posts/${postId}/labels`,
        'PUT',
        input,
        users[2],
      );
      assert.equal(labelled.status, 200);
      assert.equal(labelled.body.item.faculties.length, 2);
      assert.equal(labelled.body.item.programs.length, 1);
      assert.equal(
        (
          await request(
            `/posts/${postId}/labels`,
            'PUT',
            { facultyIds: [faculties[2]] },
            users[2],
          )
        ).status,
        403,
      );
      await request(
        `/posts/${postId}/labels`,
        'PUT',
        { facultyIds: [faculties[2]] },
        users[3],
      );
      await request(`/posts/${postId}/labels`, 'PUT', input, users[2]);
      assert.equal(
        (await request(`/posts/${postId}`)).body.item.faculties.length,
        3,
      );
      const [audit] = await db.execute(
        'SELECT assigned_by FROM unicommu.post_faculties WHERE post_id=? AND faculty_id=?',
        [postId, faculties[0]],
      );
      assert.equal(String(audit[0].assigned_by), users[2].user.id);
    },
  );
  await t.test(
    'comments have stable retry keys, threaded replies, and reject cross-post parents',
    async () => {
      const body = { body: 'สวัสดี', clientRequestId: 'comment_request_00001' };
      const first = await request(`/posts/${postId}/comments`, 'POST', body);
      assert.equal(first.status, 201);
      assert.equal(
        (await request(`/posts/${postId}/comments`, 'POST', body)).body.id,
        first.body.id,
      );
      const other = (await request('/posts?limit=2')).body.items.find(
        (p) => p.id !== postId,
      ).id;
      assert.equal(
        (
          await request(`/posts/${other}/comments`, 'POST', {
            ...body,
            parentId: first.body.id,
            clientRequestId: 'comment_request_00002',
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request(
            `/posts/${postId}/comments`,
            'POST',
            {
              body: 'ตอบกลับ',
              parentId: first.body.id,
              clientRequestId: 'comment_request_00003',
            },
            users[1],
          )
        ).status,
        201,
      );
      const list = await request(`/posts/${postId}/comments`);
      assert.equal(list.body.items.length, 2);
      await request(`/comments/${first.body.id}/like`, 'PUT');
      assert.equal(
        (await request(`/posts/${postId}/comments`)).body.items[0].liked,
        true,
      );
    },
  );
  await t.test(
    'images are decoded, resized, stripped of metadata and restricted to their uploader',
    async () => {
      const png = await sharp({
        create: { width: 3, height: 2, channels: 3, background: 'red' },
      })
        .png()
        .toBuffer();
      const normalized = await sanitizeImage(png.toString('base64'));
      assert.equal((await sharp(normalized.data).metadata()).format, 'webp');
      assert.equal(
        (
          await request('/media', 'POST', {
            base64: Buffer.from('<svg></svg>').toString('base64'),
          })
        ).status,
        400,
      );
      const media = await request('/media', 'POST', {
        base64: png.toString('base64'),
      });
      assert.equal(media.status, 201);
      const input = {
        body: 'รูปภาพจริง',
        mediaIds: [media.body.id],
        clientRequestId: 'image_post_request_01',
      };
      assert.equal(
        (await request('/posts', 'POST', input, users[1])).status,
        400,
      );
      const post = await request('/posts', 'POST', input);
      assert.equal(post.status, 201);
      assert.equal(post.body.item.media.length, 1);
      assert.match(post.body.item.media[0].url, /storage.example.test/);
      const [leaks] = await db.execute(
        'SELECT id FROM unicommu.posts WHERE author_id=? AND client_request_id=?',
        [users[1].user.id, input.clientRequestId],
      );
      assert.equal(leaks.length, 0);
    },
  );
  await t.test(
    'all community tables deny direct anon and authenticated access',
    async () => {
      const rows = await pg.query(
        "SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='unicommu' AND c.relkind='r'",
      );
      assert.ok(rows.rows.every((r) => r.relrowsecurity));
      await pg.exec('SET ROLE anon;');
      await assert.rejects(pg.query('SELECT * FROM unicommu.posts'));
      await pg.exec('RESET ROLE;');
    },
  );
  await pg.close();
});
