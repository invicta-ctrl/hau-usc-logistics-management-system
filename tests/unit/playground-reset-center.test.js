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

describe('P13 Playground Reset Center contract', () => {
  it('places an exact-confirmation full reset control in Administration System status', () => {
    expect(administrationSource).toContain('data-playground-reset-center="true"');
    expect(administrationSource).toContain('Playground controls');
    expect(administrationSource).toContain('Reset Entire Playground');
    expect(administrationSource).toMatch(/resetConfirmation !== ["']RESET PLAYGROUND["']/u);
    expect(administrationSource).toContain('This session will be invalidated when the reset completes.');
    expect(administrationSource).toContain('Playground reset controls are unavailable outside');
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
});
