import { randomUUID } from 'node:crypto';
import { currentSession } from '../auth/session.mjs';
import { readJson } from '../http/read-json.mjs';
import {
  assignLabels,
  createPost,
  fail,
  insertOnce,
  readPosts,
  requirePost,
  table,
} from './repository.mjs';
import {
  categories,
  isId,
  isRequestId,
  normalizeBody,
  parseCursor,
  parsePost,
  textLength,
} from './validation.mjs';
import { sanitizeImage } from './storage.mjs';

const result = (body, status = 200) => ({ status, body });
let activeUploads = 0;
async function inputOf(request, maxBytes = 32000) {
  const parsed = await readJson(request, maxBytes);
  if (
    !parsed.input ||
    typeof parsed.input !== 'object' ||
    Array.isArray(parsed.input)
  )
    fail(parsed.status ?? 400, parsed.body?.error ?? 'invalid_input');
  return parsed.input;
}
async function comments(db, postId, userId, cursor) {
  const after = parseCursor(cursor);
  const params = [userId, postId];
  let condition = '';
  if (after) {
    condition = ' AND (c.created_at > ? OR (c.created_at = ? AND c.id > ?))';
    params.push(after.at, after.at, after.id);
  }
  const [rows] = await db.execute(
    `SELECT c.id,c.parent_id,c.body,c.created_at,c.author_id,u.display_name,
    (SELECT COUNT(*) FROM ${table(db, 'comment_likes')} l WHERE l.comment_id=c.id) AS like_count,
    EXISTS(SELECT 1 FROM ${table(db, 'comment_likes')} l WHERE l.comment_id=c.id AND l.user_id=?) AS liked
    FROM ${table(db, 'comments')} c JOIN ${db.users} u ON u.id=c.author_id WHERE c.post_id=?${condition} ORDER BY c.created_at,c.id LIMIT 101`,
    params,
  );
  const items = rows.slice(0, 100).map((c) => ({
    id: c.id,
    author: c.display_name,
    authorId: String(c.author_id),
    body: c.body,
    parentId: c.parent_id,
    createdAt: new Date(c.created_at).getTime(),
    liked: !!c.liked,
    likeCount: Number(c.like_count),
  }));
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length > 100
        ? Buffer.from(
            JSON.stringify({
              id: last.id,
              at: new Date(last.createdAt).toISOString(),
            }),
          ).toString('base64url')
        : null,
  };
}

export function createCommunityHandler(storage) {
  return async (request, db) => {
    const session = await currentSession(request, db);
    if (session.status !== 200) return session;
    const user = session.body.user;
    const url = new URL(request.url, 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);
    const method = request.method;
    try {
      if (parts[1] === 'catalog' && parts.length === 2 && method === 'GET') {
        const [[campuses], [faculties], [programs], [campusFaculties]] =
          await Promise.all([
            db.execute(
              `SELECT id,name FROM ${table(db, 'campuses')} ORDER BY name`,
            ),
            db.execute(
              `SELECT id,name FROM ${table(db, 'faculties')} ORDER BY name`,
            ),
            db.execute(
              `SELECT id,name,faculty_id FROM ${table(db, 'programs')} ORDER BY name`,
            ),
            db.execute(
              `SELECT campus_id,faculty_id FROM ${table(db, 'campus_faculties')}`,
            ),
          ]);
        return result({
          campuses,
          faculties,
          programs,
          campusFaculties,
          mediaEnabled: storage.ready,
        });
      }
      if (parts[1] === 'media' && parts.length === 2 && method === 'POST') {
        if (!storage.ready) fail(503, 'media_not_configured');
        if (activeUploads >= 2) fail(429, 'upload_busy');
        activeUploads++;
        try {
          const [[quota]] = await db.execute(
            `SELECT COUNT(*) AS total FROM ${table(db, 'post_media')} WHERE owner_id=? AND post_id IS NULL`,
            [user.id],
          );
          if (Number(quota.total) >= 16) fail(429, 'upload_limit');
          const input = await inputOf(request, 7_100_000);
          const image = await sanitizeImage(input.base64);
          const id = randomUUID();
          const path = `${user.id}/${id}.webp`;
          await storage.upload(path, image.data);
          try {
            await db.execute(
              `INSERT INTO ${table(db, 'post_media')} (id,owner_id,object_path,width,height) VALUES (?,?,?,?,?)`,
              [id, user.id, path, image.width, image.height],
            );
          } catch (error) {
            await storage.remove(path).catch(() => {});
            throw error;
          }
          return result({ id, width: image.width, height: image.height }, 201);
        } finally {
          activeUploads--;
        }
      }
      if (parts[1] === 'posts' && parts.length === 2) {
        if (method === 'GET') {
          const p = url.searchParams;
          const limit = Number(p.get('limit') ?? 20);
          if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 30 ||
            (p.has('category') && !categories.includes(p.get('category'))) ||
            (p.has('facultyId') && !isId(p.get('facultyId'))) ||
            (p.get('q')?.length ?? 0) > 120
          )
            fail(400, 'invalid_filter');
          return result(
            await readPosts(
              db,
              user.id,
              {
                limit,
                cursor: p.get('cursor'),
                category: p.get('category'),
                q: p.get('q'),
                facultyId: p.get('facultyId'),
                saved: p.get('saved') === '1',
                authorId: p.get('mine') === '1' ? user.id : null,
              },
              storage,
            ),
          );
        }
        if (method === 'POST') {
          const input = parsePost(await inputOf(request));
          if (!input) fail(400, 'invalid_post');
          return result(
            { item: await createPost(db, user, input, storage) },
            201,
          );
        }
      }
      if (
        parts[1] === 'comments' &&
        parts.length === 4 &&
        parts[3] === 'like' &&
        ['PUT', 'DELETE'].includes(method)
      ) {
        if (!isId(parts[2])) fail(400, 'invalid_id');
        const [[comment]] = await db.execute(
          `SELECT c.id FROM ${table(db, 'comments')} c JOIN ${table(db, 'posts')} p ON p.id=c.post_id WHERE c.id=? AND p.deleted_at IS NULL`,
          [parts[2]],
        );
        if (!comment) fail(404, 'comment_not_found');
        if (method === 'PUT')
          await insertOnce(
            db,
            'comment_likes',
            ['comment_id', 'user_id'],
            [parts[2], user.id],
          );
        else
          await db.execute(
            `DELETE FROM ${table(db, 'comment_likes')} WHERE comment_id=? AND user_id=?`,
            [parts[2], user.id],
          );
        return result({ liked: method === 'PUT' });
      }
      if (parts[1] !== 'posts' || parts.length < 3 || parts.length > 4)
        return result({ error: 'not_found' }, 404);
      const postId = parts[2];
      if (!isId(postId)) fail(400, 'invalid_id');
      await requirePost(db, postId);
      if (parts.length === 3 && method === 'GET')
        return result({
          item: (await readPosts(db, user.id, { id: postId }, storage))
            .items[0],
        });
      const action = parts[3];
      if (
        ['like', 'bookmark', 'report'].includes(action) &&
        ['PUT', 'DELETE'].includes(method)
      ) {
        if (action === 'report' && method === 'DELETE')
          return result({ error: 'not_found' }, 404);
        const name = {
          like: 'post_likes',
          bookmark: 'post_bookmarks',
          report: 'post_reports',
        }[action];
        if (method === 'PUT')
          await insertOnce(db, name, ['post_id', 'user_id'], [postId, user.id]);
        else
          await db.execute(
            `DELETE FROM ${table(db, name)} WHERE post_id=? AND user_id=?`,
            [postId, user.id],
          );
        return result({
          item: (await readPosts(db, user.id, { id: postId }, storage))
            .items[0],
        });
      }
      if (action === 'comments' && method === 'GET')
        return result(
          await comments(db, postId, user.id, url.searchParams.get('cursor')),
        );
      if (action === 'comments' && method === 'POST') {
        const input = await inputOf(request);
        const body = normalizeBody(input.body);
        if (
          !body ||
          textLength(body) > 2000 ||
          !isRequestId(input.clientRequestId) ||
          (input.parentId != null && !isId(input.parentId))
        )
          fail(400, 'invalid_comment');
        await db.transaction(async (tx) => {
          if (input.parentId) {
            const [[parent]] = await tx.execute(
              `SELECT id FROM ${table(tx, 'comments')} WHERE id=? AND post_id=? AND parent_id IS NULL`,
              [input.parentId, postId],
            );
            if (!parent) fail(400, 'invalid_reply');
          }
          await insertOnce(
            tx,
            'comments',
            [
              'id',
              'post_id',
              'author_id',
              'body',
              'parent_id',
              'client_request_id',
            ],
            [
              randomUUID(),
              postId,
              user.id,
              body,
              input.parentId ?? null,
              input.clientRequestId,
            ],
          );
          const [[saved]] = await tx.execute(
            `SELECT post_id,body,parent_id FROM ${table(tx, 'comments')} WHERE author_id=? AND client_request_id=?`,
            [user.id, input.clientRequestId],
          );
          if (
            saved.post_id !== postId ||
            saved.body !== body ||
            saved.parent_id !== (input.parentId ?? null)
          )
            fail(409, 'request_conflict');
        });
        const [[saved]] = await db.execute(
          `SELECT id FROM ${table(db, 'comments')} WHERE author_id=? AND client_request_id=?`,
          [user.id, input.clientRequestId],
        );
        return result({ id: saved.id }, 201);
      }
      if (action === 'labels' && method === 'PUT') {
        const input = await inputOf(request);
        const facultyIds = input.facultyIds ?? [],
          programIds = input.programIds ?? [];
        if (
          !Array.isArray(facultyIds) ||
          !Array.isArray(programIds) ||
          facultyIds.length > 30 ||
          programIds.length > 100 ||
          !facultyIds.every(isId) ||
          !programIds.every(isId) ||
          new Set(facultyIds).size !== facultyIds.length ||
          new Set(programIds).size !== programIds.length
        )
          fail(400, 'invalid_labels');
        await assignLabels(db, user, postId, facultyIds, programIds);
        return result({
          item: (await readPosts(db, user.id, { id: postId }, storage))
            .items[0],
        });
      }
      return result({ error: 'not_found' }, 404);
    } catch (error) {
      if (error.message === 'invalid_cursor')
        return result({ error: 'invalid_cursor' }, 400);
      if (error.publicError)
        return result({ error: error.publicError }, error.status);
      console.error('Community request failed:', error.code ?? error.name);
      return result({ error: 'community_unavailable' }, 503);
    }
  };
}
