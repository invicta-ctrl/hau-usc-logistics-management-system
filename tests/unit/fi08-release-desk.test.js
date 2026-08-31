import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listPreviewRoutes } from '../../src/frontend/preview/index/registry';
import {
  releaseCandidatesFromBootstrap,
  releaseConsequence,
  releaseHistoryFromBootstrap,
  releaseRecheckIssue,
} from '../../src/frontend/app/operations/releaseModel';
import { evidenceByteDigest } from '../../src/frontend/app/operations/operationUtils';

const root = resolve(import.meta.dirname, '../..');
const readSource = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

describe('FI-08 Release Desk frontend integration', () => {
  it('uses the authenticated Worker/D1 route in normal runtime and keeps the Make-v44 fixture out of it', () => {
    const renderer = readSource('src/frontend/app/AppRouteRenderer.tsx');
    const operational = readSource('src/frontend/app/operations/OperationalModuleRoute.tsx');
    const station = readSource('src/frontend/app/operations/ReleaseStation.tsx');
    const history = readSource('src/frontend/app/operations/ReleaseHistory.tsx');

    expect(renderer).not.toContain("import ReleaseDeskRoute from './ReleaseDeskRoute';");
    expect(renderer).toContain('module="release"');
    expect(renderer).toContain("session.serverCapabilities.includes('fulfillment.release')");
    expect(operational).toContain("import { ReleaseHistory } from './ReleaseHistory';");
    expect(operational).toContain("import { ReleaseStation } from './ReleaseStation';");
    expect(station).toContain('frontendBackend.confirmRelease');
    expect(station).toContain('RELEASE_CONFIRMATION_PHOTO');
    expect(station).toContain('Use full remaining quantity');
    expect(station).toContain("frontendBackend.operationalModuleBootstrap('release')");
    expect(station).toContain('Person / recipient');
    expect(station).toContain('Recheck and record release');
    expect(station).not.toContain('latest.scopeRevision.token');
    expect(station).not.toContain('Real backend · read-only');
    expect(operational).toContain('<ReleaseHistory bootstrap={bootstrap} />');
    expect(history).toContain('Release receipts');
  });

  it('derives only ready cumulative lines and blocks changed authority before evidence upload', () => {
    const bootstrap = {
      module: 'release',
      scopeRevision: { token: '7', updatedAt: '2026-08-31T00:00:00.000Z' },
      pagination: { page: 1, pageSize: 25, total: 1, hasMore: false },
      data: {
        requests: [{ id: 'REQ-1', purpose: 'Custody fixture', department: 'Operations' }],
        inventoryItems: [{ id: 'ITM-1', name: 'Folding chair', unit: 'piece' }],
        requestLines: [
          {
            id: 'LINE-1',
            requestId: 'REQ-1',
            itemId: 'ITM-1',
            description: 'Chair release',
            quantity: 5,
            releasedQuantity: 2,
            workflowRevision: 4,
            unit: 'piece',
            status: 'PARTIALLY_RELEASED',
          },
          {
            id: 'LINE-CLOSED',
            requestId: 'REQ-1',
            itemId: 'ITM-1',
            quantity: 1,
            releasedQuantity: 1,
            unit: 'piece',
            status: 'RELEASED',
          },
        ],
      },
    };
    const candidates = releaseCandidatesFromBootstrap(bootstrap);

    expect(candidates).toEqual([
      expect.objectContaining({
        id: 'LINE-1',
        requestId: 'REQ-1',
        itemName: 'Folding chair',
        remaining: 3,
        revision: '4',
      }),
    ]);
    expect(releaseConsequence(candidates[0], 2)).toContain('partial physical release');
    expect(releaseConsequence(candidates[0], 3)).toContain('full remaining physical release');
    expect(releaseConsequence(candidates[0], 4)).toMatch(/Only 3 piece remain/u);
    expect(releaseConsequence(candidates[0], 0)).toMatch(/positive whole-number/u);
    expect(releaseRecheckIssue({ before: candidates[0], after: candidates[0], quantity: 3 })).toBe('');
    expect(releaseRecheckIssue({ before: candidates[0], after: null, quantity: 3 })).toMatch(
      /no longer ready/i,
    );
    expect(
      releaseRecheckIssue({
        before: candidates[0],
        after: { ...candidates[0], remaining: 1 },
        quantity: 3,
      }),
    ).toMatch(/Only 1 piece remains releasable/i);
    expect(
      releaseRecheckIssue({
        before: candidates[0],
        after: { ...candidates[0], revision: '5' },
        quantity: 3,
      }),
    ).toMatch(/authoritative line revision changed/i);

    bootstrap.data.releaseConfirmations = [
      {
        id: 'REL-1',
        requestId: 'REQ-1',
        recipientName: 'Synthetic Recipient',
        recipientRole: 'Custodian',
        department: 'Operations',
        status: 'PARTIAL',
        releasedAt: '2026-08-31T00:00:00.000Z',
        lineReleases: [{ requestLineId: 'LINE-1', quantity: 2, unit: 'piece' }],
      },
    ];
    bootstrap.data.releaseCorrections = [
      {
        id: 'COR-1',
        releaseGroupId: 'REL-1',
        quantity: 1,
        reason: 'Count correction',
        status: 'POSTED',
      },
    ];
    expect(releaseHistoryFromBootstrap(bootstrap)).toEqual({
      confirmations: [
        expect.objectContaining({
          id: 'REL-1',
          recipientName: 'Synthetic Recipient',
          quantity: '2 piece',
        }),
      ],
      corrections: [expect.objectContaining({ id: 'COR-1', releaseGroupId: 'REL-1', quantity: 1 })],
    });
  });

  it('keys governed evidence retries with a cryptographic content identity', async () => {
    const digest = await evidenceByteDigest({
      arrayBuffer: async () => Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]).buffer,
    });

    expect(digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(readSource('src/frontend/app/operations/ReleaseStation.tsx')).toContain('contentDigest');
  });

  it('makes the exact local A4 inspection path render the deterministic real module without a backend call', () => {
    const inspection = readSource('src/frontend/preview/index/PreviewInspectionRoute.tsx');
    const releaseDesk = readSource('src/frontend/app/ReleaseDeskRoute.tsx');

    expect(inspection).toContain("import ReleaseDeskRoute from '../../app/ReleaseDeskRoute';");
    expect(inspection).toMatch(
      /authRoute === 'release' \? \([\s\S]*<ReleaseDeskRoute dark=\{dark\} navigate=\{onOpenRoute\} \/>/,
    );
    expect(inspection).not.toContain('/api/');
    expect(inspection).not.toMatch(/\bfetch\s*\(/);
    expect(releaseDesk).toContain('Sample data · Actions unavailable');
    expect(releaseDesk).toContain('Sample action checked · No operational record changed');
    expect(releaseDesk).toContain('data-release-trigger');
    expect(releaseDesk).toContain('state === "Focused task"');
    expect(releaseDesk).toContain('keepFocusInDialog');
    expect(releaseDesk).toContain('e.key === "Escape"');
  });

  it('records the accepted backend-backed custody route accurately', () => {
    expect(listPreviewRoutes().find((entry) => entry.route === 'release')).toEqual({
      id: 'release',
      route: 'release',
      label: 'Release Desk',
      group: 'STAFF',
      description:
        'Review ready work and record physical handoffs. Inspection uses sample data and does not change records.',
      implementationStatus: 'ACCEPTED',
      backendStatus: 'REAL_BACKEND',
      access: 'AUTHENTICATED',
      previewMode: 'REAL_MODULE',
      completeness: 'BACKEND_WIRED_COMPLETE',
    });
  });
});
