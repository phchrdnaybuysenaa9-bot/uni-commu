export async function readJson(request) {
  const contentType = request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return { status: 415, body: { error: 'json_required' } };
  }

  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
      size += chunk.length;
      if (size > 8192) {
        request.resume();
        return { status: 413, body: { error: 'body_too_large' } };
      }
      chunks.push(chunk);
    }
    return { input: JSON.parse(Buffer.concat(chunks).toString('utf8')) };
  } catch {
    return { status: 400, body: { error: 'invalid_json' } };
  }
}
