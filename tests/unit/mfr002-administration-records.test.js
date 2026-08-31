import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  accountStateLabel,
  filterAdministrationAccounts,
  filterAdministrationStaff,
} from '../../src/frontend/app/administration/administrationPresentation.ts';

const panelSource = readFileSync(
  new URL('../../src/frontend/app/administration/AdministrationRecordsPanel.tsx', import.meta.url),
  'utf8',
);

const accounts = [
  {
    accessId: 'OPS.RECEIVING',
    displayName: 'Receiving operator',
    roleId: 'DOL_STAFF',
    status: 'ACTIVE',
    firstLoginPending: false,
    locked: false,
  },
  {
    accessId: 'OPS.PENDING',
    displayName: 'Pending operator',
    roleId: 'DOL_STAFF',
    status: 'ACTIVE',
    firstLoginPending: true,
    locked: true,
  },
];

const directory = [
  {
    opaquePersonId: 'PER-NEVER-RENDER-001',
    displayName: 'Authorized staff member',
    accessId: 'OPS.RECEIVING',
    linkState: 'ACTIVE',
    emailState: 'ACTIVE_VERIFIED',
    assignmentSummary: {
      activeCount: 2,
      historicalCount: 1,
      quarantinedCount: 0,
      provenanceState: 'PRESENT',
    },
  },
];

describe('MFR-002 U08 Administration records model', () => {
  it('uses the supported account-state precedence', () => {
    expect(accountStateLabel(accounts[0])).toBe('Active');
    expect(accountStateLabel({ ...accounts[0], firstLoginPending: true })).toBe('Pending activation');
    expect(accountStateLabel(accounts[1])).toBe('Locked');
  });

  it('searches only the records already loaded for the page', () => {
    expect(filterAdministrationAccounts(accounts, 'receiving')).toEqual([accounts[0]]);
    expect(filterAdministrationAccounts(accounts, 'locked')).toEqual([accounts[1]]);
    expect(filterAdministrationStaff(directory, 'verified')).toEqual(directory);
    expect(filterAdministrationStaff(directory, 'PER-NEVER-RENDER-001')).toEqual([]);
  });

  it('keeps one responsive record list and never projects the opaque staff key into DOM data', () => {
    expect(panelSource).toContain('data-administration-account-open');
    expect(panelSource).toContain('data-administration-staff-open');
    expect(panelSource).not.toContain('<table');
    expect(panelSource).not.toMatch(/data-[\w-]+=\{staff\.opaquePersonId\}/u);
    expect(panelSource).not.toMatch(/aria-label=\{staff\.opaquePersonId\}/u);
  });

  it('separates the retained-activity action from selecting a staff record', () => {
    expect(panelSource).toContain('Open staff record');
    expect(panelSource).toContain('Review retained activity');
    expect(panelSource).toContain("role={isMobile ? 'dialog' : 'complementary'}");
    expect(panelSource).toContain("if (event.key === 'Escape') setInspectorOpen(false)");
  });
});
