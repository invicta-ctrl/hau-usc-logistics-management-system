import { describe, expect, it, vi } from 'vitest';
import { createStaffDirectoryService } from '../../src/server/identity-foundation/staff-directory-service.js';

const personId = 'PER-123E4567-E89B-42D3-A456-426614174000';

function directoryRow(overrides = {}) {
  return {
    personId,
    linkedAccountCount: 1,
    activeLinkCount: 1,
    revokedLinkCount: 0,
    quarantinedLinkCount: 0,
    quarantinedEmailCount: 0,
    ambiguousEmailCount: 0,
    activeVerifiedEmailCount: 1,
    activeUnverifiedEmailCount: 0,
    activeAssignmentCount: 1,
    historicalAssignmentCount: 0,
    quarantinedAssignmentCount: 0,
    assignmentProvenanceCount: 1,
    activeAccessId: 'STAFF.001',
    activeDisplayName: 'Safe Staff Name',
    ...overrides,
  };
}

describe('canonical Staff Directory service', () => {
  it('normalizes bounded input and serializes only the safe canonical projection', async () => {
    const repository = {
      listCanonicalDirectory: vi.fn().mockResolvedValue({
        total: 1,
        items: [directoryRow()],
      }),
    };
    const service = createStaffDirectoryService({ repository });

    await expect(
      service.list({ page: 0, pageSize: 500, query: `  ${'staff '.repeat(40)}  ` }),
    ).resolves.toEqual({
      page: 1,
      pageSize: 50,
      query: `${'staff '.repeat(20)}`.trim(),
      total: 1,
      items: [
        {
          personId,
          displayName: 'Safe Staff Name',
          accessId: 'STAFF.001',
          linkState: 'ACTIVE',
          linkedAccountCount: 1,
          emailState: 'ACTIVE_VERIFIED',
          assignmentSummary: {
            activeCount: 1,
            historicalCount: 0,
            quarantinedCount: 0,
            provenanceState: 'PRESENT',
          },
        },
      ],
    });
    expect(repository.listCanonicalDirectory).toHaveBeenCalledWith({
      page: 1,
      pageSize: 50,
      query: `${'staff '.repeat(20)}`.trim(),
    });
  });

  it('fails closed on quarantine or ambiguity and never selects a business identity from many links', async () => {
    const repository = {
      listCanonicalDirectory: vi.fn().mockResolvedValue({
        total: 1,
        items: [
          directoryRow({
            linkedAccountCount: 2,
            activeLinkCount: 2,
            quarantinedLinkCount: 1,
            ambiguousEmailCount: 1,
            activeVerifiedEmailCount: 0,
            quarantinedAssignmentCount: 1,
            assignmentProvenanceCount: 0,
          }),
        ],
      }),
    };
    const service = createStaffDirectoryService({ repository });

    await expect(service.list()).resolves.toEqual({
      page: 1,
      pageSize: 25,
      query: '',
      total: 1,
      items: [
        {
          personId,
          displayName: null,
          accessId: null,
          linkState: 'QUARANTINED',
          linkedAccountCount: 2,
          emailState: 'AMBIGUOUS',
          assignmentSummary: {
            activeCount: 1,
            historicalCount: 0,
            quarantinedCount: 1,
            provenanceState: 'UNAVAILABLE',
          },
        },
      ],
    });
  });

  it('withholds both business fields when the sole active link has an incomplete account profile', async () => {
    const repository = {
      listCanonicalDirectory: vi.fn().mockResolvedValue({
        total: 1,
        items: [directoryRow({ activeDisplayName: null })],
      }),
    };
    const service = createStaffDirectoryService({ repository });

    await expect(service.list()).resolves.toMatchObject({
      items: [
        {
          personId,
          linkState: 'ACTIVE',
          displayName: null,
          accessId: null,
        },
      ],
    });
  });
});
