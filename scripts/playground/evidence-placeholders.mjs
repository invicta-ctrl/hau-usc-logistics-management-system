const SAFE_EVIDENCE_KEY = /^playground-redacted\/[0-9a-f]{24}$/u;

export function createEvidencePlaceholder(privateStorageReference) {
  const key = String(privateStorageReference ?? '');
  if (!SAFE_EVIDENCE_KEY.test(key)) {
    throw new Error('Sanitized evidence metadata contains an unsafe object key.');
  }
  return {
    key,
    body: JSON.stringify({
      playgroundRedacted: true,
      classification: 'PRIVATE_EVIDENCE_EXCLUDED',
    }),
  };
}
