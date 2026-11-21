import { createHash, randomUUID } from 'node:crypto';
import { parseCursor } from './validation.mjs';

export const table = (db, name) =>
  `${db.dialect === 'postgres' ? 'unicommu.' : ''}${name}`;
const placeholders = (values) => values.map(() => '?').join(',');
export const fail = (status, error) => {
  throw Object.assign(new Error(error), { status, publicError: error });
};
export async function insertOnce(db, name, columns, values) {
  const prefix = db.dialect === 'postgres' ? 'INSERT' : 'INSERT IGNORE';
  const suffix = db.dialect === 'postgres' ? ' ON CONFLICT DO NOTHING' : '';
  await db.execute(
    `${prefix} INTO ${table(db, name)} (${columns.join(',')}) VALUES (${placeholders(values)})${suffix}`,
    values,
  );
}

export async function readPosts(db, userId, filters = {}, storage) {
  const where = ['p.deleted_at IS NULL'];
  const values = [userId, userId];
  if (filters.id) {
    where.push('p.id = ?');
    values.push(filters.id);
  }
  if (filters.authorId) {
    where.push('p.author_id = ?');
    values.push(filters.authorId);
  }
  if (filters.saved) {
    where.push(
      `EXISTS (SELECT 1 FROM ${table(db, 'post_bookmarks')} b WHERE b.post_id=p.id AND b.user_id=?)`,
    );
    values.push(userId);
  }
  if (filters.category) {
    where.push('p.category = ?');
    values.push(filters.category);
  }
  if (filters.facultyId) {
    where.push(
      `EXISTS (SELECT 1 FROM ${table(db, 'post_faculties')} f WHERE f.post_id=p.id AND f.faculty_id=?)`,
    );
    values.push(filters.facultyId);
  }
  if (filters.q) {
    where.push(
      "(LOWER(p.body) LIKE ? ESCAPE '!' OR LOWER(u.display_name) LIKE ? ESCAPE '!')",
    );
    const term = `%${filters.q.toLowerCase().replace(/[!%_]/g, '!$&')}%`;
    values.push(term, term);
  }
  const cursor = parseCursor(filters.cursor);
  if (cursor) {
    where.push('(p.created_at < ? OR (p.created_at = ? AND p.id < ?))');
    values.push(cursor.at, cursor.at, cursor.id);
  }
  const limit = filters.limit ?? 20;
  values.push(limit + 1);
  const [found] = await db.execute(
    `SELECT p.id,p.author_id,p.title,p.body,p.category,p.created_at,p.updated_at,u.display_name,
    (SELECT COUNT(*) FROM ${table(db, 'post_likes')} l WHERE l.post_id=p.id) AS like_count,
    (SELECT COUNT(*) FROM ${table(db, 'comments')} c WHERE c.post_id=p.id) AS comment_count,
    EXISTS (SELECT 1 FROM ${table(db, 'post_likes')} l WHERE l.post_id=p.id AND l.user_id=?) AS liked,
    EXISTS (SELECT 1 FROM ${table(db, 'post_bookmarks')} b WHERE b.post_id=p.id AND b.user_id=?) AS saved
    FROM ${table(db, 'posts')} p JOIN ${db.users} u ON u.id=p.author_id
    WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC,p.id DESC LIMIT ?`,
    values,
  );
  const rows = found.slice(0, limit);
  if (!rows.length) return { items: [], nextCursor: null };
  const ids = rows.map((row) => row.id);
  const condition = `IN (${placeholders(ids)})`;
  const [[tags], [media], [faculties], [programs]] = await Promise.all([
    db.execute(
      `SELECT ph.post_id,h.name FROM ${table(db, 'post_hashtags')} ph JOIN ${table(db, 'hashtags')} h ON h.id=ph.hashtag_id WHERE ph.post_id ${condition} ORDER BY h.name`,
      ids,
    ),
    db.execute(
      `SELECT id,post_id,object_path,width,height,position FROM ${table(db, 'post_media')} WHERE post_id ${condition} ORDER BY position`,
      ids,
    ),
    db.execute(
      `SELECT pf.post_id,f.id,f.name FROM ${table(db, 'post_faculties')} pf JOIN ${table(db, 'faculties')} f ON f.id=pf.faculty_id WHERE pf.post_id ${condition} ORDER BY f.name`,
      ids,
    ),
    db.execute(
      `SELECT pp.post_id,p.id,p.name,p.faculty_id FROM ${table(db, 'post_programs')} pp JOIN ${table(db, 'programs')} p ON p.id=pp.program_id WHERE pp.post_id ${condition} ORDER BY p.name`,
      ids,
    ),
  ]);
  const photos = await Promise.all(
    media.map(async (m) => ({
      id: m.id,
      postId: m.post_id,
      width: m.width,
      height: m.height,
      url: await storage.sign(m.object_path),
    })),
  );
  const items = rows.map((p) => ({
    id: p.id,
    author: { id: String(p.author_id), name: p.display_name },
    title: p.title,
    body: p.body,
    category: p.category,
    createdAt: new Date(p.created_at).toISOString(),
    updatedAt: new Date(p.updated_at).toISOString(),
    likeCount: Number(p.like_count),
    commentCount: Number(p.comment_count),
    liked: !!p.liked,
    saved: !!p.saved,
    tags: tags.filter((t) => t.post_id === p.id).map((t) => t.name),
    media: photos.filter((m) => m.postId === p.id).map(({ postId, ...m }) => m),
    faculties: faculties
      .filter((f) => f.post_id === p.id)
      .map((f) => ({ id: f.id, name: f.name })),
    programs: programs
      .filter((s) => s.post_id === p.id)
      .map((s) => ({ id: s.id, name: s.name, facultyId: s.faculty_id })),
  }));
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      found.length > limit
        ? Buffer.from(
            JSON.stringify({ id: last.id, at: last.createdAt }),
          ).toString('base64url')
        : null,
  };
}

export async function createPost(db, user, input, storage) {
  const fingerprint = createHash('sha256')
    .update(JSON.stringify([input.body, input.category, input.mediaIds]))
    .digest('hex');
  const id = await db.transaction(async (tx) => {
    const proposedId = randomUUID();
    await insertOnce(
      tx,
      'posts',
      [
        'id',
        'author_id',
        'title',
        'body',
        'category',
        'client_request_id',
        'request_fingerprint',
      ],
      [
        proposedId,
        user.id,
        [...input.body.split('\n')[0]].slice(0, 120).join(''),
        input.body,
        input.category,
        input.clientRequestId,
        fingerprint,
      ],
    );
    const [[post]] = await tx.execute(
      `SELECT id,request_fingerprint FROM ${table(tx, 'posts')} WHERE author_id=? AND client_request_id=? FOR UPDATE`,
      [user.id, input.clientRequestId],
    );
    if (post.request_fingerprint !== fingerprint) fail(409, 'request_conflict');
    if (post.id !== proposedId) return post.id;
    if (input.mediaIds.length) {
      const [media] = await tx.execute(
        `SELECT id FROM ${table(tx, 'post_media')} WHERE id IN (${placeholders(input.mediaIds)}) AND owner_id=? AND post_id IS NULL ORDER BY id FOR UPDATE`,
        [...input.mediaIds, user.id],
      );
      if (media.length !== input.mediaIds.length) fail(400, 'invalid_media');
      for (const [position, mediaId] of input.mediaIds.entries())
        await tx.execute(
          `UPDATE ${table(tx, 'post_media')} SET post_id=?,position=? WHERE id=?`,
          [post.id, position, mediaId],
        );
    }
    for (const tag of input.tags) {
      await insertOnce(tx, 'hashtags', ['id', 'name'], [randomUUID(), tag]);
      const [[hashtag]] = await tx.execute(
        `SELECT id FROM ${table(tx, 'hashtags')} WHERE name=?`,
        [tag],
      );
      await insertOnce(
        tx,
        'post_hashtags',
        ['post_id', 'hashtag_id'],
        [post.id, hashtag.id],
      );
    }
    return post.id;
  });
  return (await readPosts(db, user.id, { id }, storage)).items[0];
}

export async function requirePost(db, id) {
  const [[post]] = await db.execute(
    `SELECT id FROM ${table(db, 'posts')} WHERE id=? AND deleted_at IS NULL`,
    [id],
  );
  if (!post) fail(404, 'post_not_found');
}

export async function assignLabels(db, user, postId, facultyIds, programIds) {
  await db.transaction(async (tx) => {
    // Serialize classification changes, including overlapping organizations.
    const [[post]] = await tx.execute(
      `SELECT id FROM ${table(tx, 'posts')} WHERE id=? AND deleted_at IS NULL FOR UPDATE`,
      [postId],
    );
    if (!post) fail(404, 'post_not_found');
    const [allFaculties] = await tx.execute(
      `SELECT id FROM ${table(tx, 'faculties')}`,
    );
    const [allPrograms] = await tx.execute(
      `SELECT id,faculty_id FROM ${table(tx, 'programs')}`,
    );
    if (
      facultyIds.some((id) => !allFaculties.some((f) => f.id === id)) ||
      programIds.some((id) => !allPrograms.some((p) => p.id === id))
    )
      fail(400, 'invalid_labels');
    const chosenPrograms = allPrograms.filter((p) => programIds.includes(p.id));
    const effectiveFaculties = [
      ...new Set([...facultyIds, ...chosenPrograms.map((p) => p.faculty_id)]),
    ];
    let scope = allFaculties.map((f) => f.id);
    if (user.role !== 'admin') {
      // A department role by itself grants no club rights.
      const [memberships] = await tx.execute(
        `SELECT o.id,o.kind FROM ${table(tx, 'organization_members')} m JOIN ${table(tx, 'organizations')} o ON o.id=m.organization_id WHERE m.user_id=?`,
        [user.id],
      );
      if (!memberships.length) fail(403, 'organization_permission_required');
      if (!memberships.some((m) => m.kind === 'student_council')) {
        const [allowed] = await tx.execute(
          `SELECT f.faculty_id FROM ${table(tx, 'organization_faculties')} f JOIN ${table(tx, 'organization_members')} m ON m.organization_id=f.organization_id WHERE m.user_id=?`,
          [user.id],
        );
        scope = allowed.map((f) => f.faculty_id);
      }
    }
    if (effectiveFaculties.some((id) => !scope.includes(id)))
      fail(403, 'faculty_outside_scope');
    // Each club replaces labels only inside its own scope; other clubs' labels survive.
    for (const facultyId of scope) {
      await tx.execute(
        `DELETE FROM ${table(tx, 'post_programs')} WHERE post_id=? AND program_id IN (SELECT id FROM ${table(tx, 'programs')} WHERE faculty_id=?)`,
        [postId, facultyId],
      );
      await tx.execute(
        `DELETE FROM ${table(tx, 'post_faculties')} WHERE post_id=? AND faculty_id=?`,
        [postId, facultyId],
      );
    }
    for (const facultyId of effectiveFaculties)
      await insertOnce(
        tx,
        'post_faculties',
        ['post_id', 'faculty_id', 'assigned_by'],
        [postId, facultyId, user.id],
      );
    for (const programId of programIds)
      await insertOnce(
        tx,
        'post_programs',
        ['post_id', 'program_id', 'assigned_by'],
        [postId, programId, user.id],
      );
  });
}
