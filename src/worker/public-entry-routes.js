function publicNetworkKey(request) {
  return request.headers.get('cf-connecting-ip') ?? 'untrusted-local';
}

export async function handlePublicEntryRoute({
  request,
  url,
  requestId,
  publicRequests,
  publicLending,
  publicAdvertisements,
  json,
  readBody,
  assertMutationOrigin,
}) {
  if (request.method === 'GET') {
    if (url.pathname === '/api/public/request/options') {
      return json({ ...(await publicRequests.options()), correlationId: requestId });
    }
    if (url.pathname === '/api/public/lending/catalog') {
      return json({ ...(await publicLending.catalog()), correlationId: requestId });
    }
    if (url.pathname === '/api/public/advertisements') {
      return json({ ...(await publicAdvertisements.list()), correlationId: requestId });
    }
    return null;
  }

  if (request.method !== 'POST') return null;
  const handlers = {
    '/api/public/request': publicRequests.submit,
    '/api/public/request/track': publicRequests.track,
    '/api/public/request/related': publicRequests.related,
    '/api/public/lending': publicLending.submit,
    '/api/public/lending/track': publicLending.track,
  };
  const handler = handlers[url.pathname];
  if (!handler) return null;

  assertMutationOrigin(request);
  return json(
    await handler({
      command: await readBody(request),
      networkKey: publicNetworkKey(request),
      correlationId: requestId,
    }),
  );
}
