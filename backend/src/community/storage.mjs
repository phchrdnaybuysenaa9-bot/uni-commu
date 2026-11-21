import sharp from 'sharp';
import { fail } from './repository.mjs';

export const postBucket = 'unicommu-posts';
export function createPostStorage(env = process.env, fetchStorage = fetch) {
  const base = env.SUPABASE_URL?.replace(/\/$/, '');
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const ready =
    !!base && !!key && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base);
  async function call(path, body, method = 'POST', binary = false) {
    if (!ready) fail(503, 'media_not_configured');
    const response = await fetchStorage(`${base}/storage/v1${path}`, {
      method,
      headers: {
        apikey: key,
        ...(!key.startsWith('sb_secret_') ? { Authorization: `Bearer ${key}` } : {}),
        'Content-Type': binary ? 'image/webp' : 'application/json',
      },
      body: binary ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) fail(503, 'media_unavailable');
    return response.json();
  }
  const encoded = (path) => path.split('/').map(encodeURIComponent).join('/');
  return {
    ready,
    upload: (path, bytes) =>
      call(`/object/${postBucket}/${encoded(path)}`, bytes, 'POST', true),
    remove: (path) =>
      call(`/object/${postBucket}`, { prefixes: [path] }, 'DELETE'),
    async sign(path) {
      const result = await call(`/object/sign/${postBucket}/${encoded(path)}`, {
        expiresIn: 3600,
      });
      if (
        typeof result.signedURL !== 'string' ||
        !result.signedURL.startsWith('/object/sign/')
      )
        fail(503, 'media_unavailable');
      return `${base}/storage/v1${result.signedURL}`;
    },
    setup: () =>
      call('/bucket', {
        id: postBucket,
        name: postBucket,
        public: false,
        file_size_limit: 5242880,
        allowed_mime_types: ['image/webp'],
      }),
  };
}

export async function sanitizeImage(base64) {
  if (
    typeof base64 !== 'string' ||
    base64.length > 7_000_000 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
  )
    fail(400, 'invalid_image');
  const source = Buffer.from(base64, 'base64');
  if (source.length > 5 * 1024 * 1024) fail(413, 'image_too_large');
  try {
    const image = sharp(source, {
      limitInputPixels: 25_000_000,
      failOn: 'warning',
    });
    const metadata = await image.metadata();
    if (
      !['jpeg', 'png', 'webp'].includes(metadata.format) ||
      (metadata.pages ?? 1) !== 1
    )
      fail(400, 'invalid_image');
    const { data, info } = await image
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch (error) {
    if (error.publicError) throw error;
    fail(400, 'invalid_image');
  }
}
