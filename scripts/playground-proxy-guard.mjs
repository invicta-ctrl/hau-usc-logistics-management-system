export function parsePlaygroundOrigin(value, { allowBareHostname = false } = {}) {
  const configured = String(value ?? '').trim();
  if (!configured) throw new Error('An isolated-playground origin is required.');
  const normalized = allowBareHostname && !configured.includes('://') ? `https://${configured}` : configured;
  let target;
  try {
    target = new URL(normalized);
  } catch {
    throw new Error('The isolated-playground origin is invalid.');
  }
  if (
    target.protocol !== 'https:' ||
    target.username ||
    target.password ||
    target.pathname !== '/' ||
    target.search ||
    target.hash ||
    !target.hostname.toLowerCase().includes('staging') ||
    /(?:^|[.-])prod(?:uction)?(?:[.-]|$)/iu.test(target.hostname)
  ) {
    throw new Error('The origin must identify the verified HTTPS isolated staging playground.');
  }
  return target;
}

export function isIsolatedPlaygroundHealth(health) {
  return Boolean(
    health?.environment === 'STAGING' &&
    health?.database?.connected === true &&
    health?.dependencies?.d1 === true &&
    health?.dependencies?.brandAssets === true &&
    health?.dependencies?.evidenceAssets === true,
  );
}

export async function verifyPlaygroundOrigin(target, fetcher = globalThis.fetch) {
  const response = await fetcher(new URL('/api/health', target));
  const health = await response.json().catch(() => null);
  if (!response.ok || !isIsolatedPlaygroundHealth(health)) {
    throw new Error('The configured target did not verify as the isolated playground.');
  }
  return health;
}
