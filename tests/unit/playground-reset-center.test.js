import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const administrationSource = readFileSync(
  new URL('../../src/frontend/app/AdministrationRoute.tsx', import.meta.url),
  'utf8',
);
const resetSource = readFileSync(
  new URL('../../scripts/playground/reset-workspace.mjs', import.meta.url),
  'utf8',
);
const r2ResetSource = readFileSync(
  new URL('../../scripts/playground/r2-reset-worker.js', import.meta.url),
  'utf8',
);

describe('P13 Playground Reset Center contract', () => {
  it('places an exact-confirmation full reset control in Administration System status', () => {
    expect(administrationSource).toContain('data-playground-reset-center="true"');
    expect(administrationSource).toContain('Playground controls');
    expect(administrationSource).toContain('Reset Playground');
    expect(administrationSource).toMatch(/resetConfirmation !== ["']RESET PLAYGROUND["']/u);
    expect(administrationSource).toContain('Resetting ends every current Playground session');
    expect(administrationSource).toContain('Playground reset is available only inside');
  });

  it('publishes a safe final receipt and clears the pending operation only after reset verification state', () => {
    expect(resetSource).toContain("'playground.last_reset_receipt'");
    expect(resetSource).toContain("DELETE FROM app_metadata WHERE key='playground.pending_operation'");
    expect(resetSource).toContain("status: 'PASS'");
    expect(resetSource).toContain('Previous Playground sessions were invalidated.');
    expect(resetSource).toContain('A new Playground session is required.');
    expect(resetSource.lastIndexOf('validateResetVerification')).toBeLessThan(
      resetSource.indexOf("'playground.last_reset_receipt'"),
    );
  });

  it('proves restored D1 evidence objects against working R2 without exposing object keys', () => {
    expect(resetSource).toContain('EXPECTED_EVIDENCE_KEYS_JSON');
    expect(resetSource).toContain('r2?.d1Evidence');
    expect(r2ResetSource).toContain('d1EvidenceAllPresent');
    expect(r2ResetSource).toContain('allPresent: d1EvidenceAllPresent');
  });
});
