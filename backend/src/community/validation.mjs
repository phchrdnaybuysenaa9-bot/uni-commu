export const categories = ['เรื่องเรียน', 'กิจกรรม', 'ชีวิตในมหาวิทยาลัย'];
export const isId = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
export const isRequestId = (value) =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(value);
export const textLength = (value) => [...value].length;
export const normalizeBody = (value) =>
  typeof value === 'string' ? value.normalize('NFC').trim() : '';
export function parsePost(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  if (
    Object.keys(input).some(
      (key) =>
        !['body', 'category', 'mediaIds', 'clientRequestId'].includes(key),
    )
  )
    return null;
  const body = normalizeBody(input.body);
  const category = input.category ?? categories[2];
  const mediaIds = input.mediaIds ?? [];
  if (
    !body ||
    textLength(body) > 2000 ||
    !categories.includes(category) ||
    !isRequestId(input.clientRequestId) ||
    !Array.isArray(mediaIds) ||
    mediaIds.length > 8 ||
    !mediaIds.every(isId) ||
    new Set(mediaIds).size !== mediaIds.length
  )
    return null;
  const tags = [
    ...new Set(
      [...body.matchAll(/#([\p{L}\p{N}\p{M}_]+)/gu)].map((match) =>
        match[1].normalize('NFC').toLowerCase(),
      ),
    ),
  ];
  if (tags.length > 20 || tags.some((tag) => textLength(tag) > 80)) return null;
  return {
    body,
    category,
    mediaIds,
    tags,
    clientRequestId: input.clientRequestId,
  };
}
export function parseCursor(value) {
  if (!value) return null;
  if (value.length > 220) throw new Error('invalid_cursor');
  try {
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (
      !isId(cursor.id) ||
      typeof cursor.at !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T/.test(cursor.at) ||
      !Number.isFinite(Date.parse(cursor.at))
    )
      throw new Error();
    return { id: cursor.id, at: cursor.at };
  } catch {
    throw new Error('invalid_cursor');
  }
}
