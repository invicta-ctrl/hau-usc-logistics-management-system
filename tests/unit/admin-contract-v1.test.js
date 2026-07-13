import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { normalizeBrandingUploadCommand } from '../../src/services/legacy-runtime-adapter.js';

const root = resolve(import.meta.dirname, '../..');

function source(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function gasContext(files) {
  const context = vm.createContext({
    console,
    Date,
    JSON,
    Math,
    Object,
    Error,
    RegExp,
    isFinite,
    isNaN,
  });
  for (const file of files) {
    vm.runInContext(source(`apps-script/${file}`), context, { filename: file });
  }
  return context;
}

describe('admin browser/server contract', () => {
  it('maps browser checkbox names to the server permission contract', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'AdminService.gs']);
    expect(ctx.permissionInput_({ canReview: true }, 'Can_Review')).toEqual({
      present: true,
      value: true,
    });
    expect(ctx.permissionInput_({ permissions: { manageCatalog: false } }, 'Can_Manage_Catalog')).toEqual({
      present: true,
      value: false,
    });

    const browser = source('src/visual/runtime-extensions.js');
    expect(browser).toContain('payload.permissions = {');
    expect(browser).toContain('review: form.elements.canReview.checked');
    expect(browser).toContain('manageCatalog: form.elements.canManageCatalog.checked');
  });

  it('uses canonical event names and provides existing-user edit/deactivate controls', () => {
    const browser = source('src/visual/runtime-extensions.js');
    expect(browser).toContain('name="seriesName"');
    expect(browser).toContain('name="ownerCommittee"');
    expect(browser).not.toContain('name="eventSeriesName"');
    expect(browser).not.toContain('name="owner"');
    expect(browser).toContain('name="userId"');
    expect(browser).toContain('data-admin-user-edit');
    expect(browser).toContain('data-admin-user-deactivate');
    expect(browser).toContain("runAdminMutation('saveUserAccess', { userId:");
  });

  it('uploads and activates protected branding without asking for storage IDs or URLs', async () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'AdminService.gs']);
    expect(ctx.brandingAssetKey_('DOL_LOGO')).toBe('DOL_LOGO');

    const browser = source('src/visual/runtime-extensions.js');
    expect(browser).toContain('name="brandingFile" type="file"');
    expect(browser).toContain("runAdminMutation('uploadBrandingAsset'");
    expect(browser).toContain("runAdminMutation('activateBrandingVersion'");
    expect(browser).not.toMatch(/Protected asset ID|name="assetId"|driveFileId|driveFolderId|Drive_URL/);

    const file = { name: 'demo-logo.png', type: 'image/png', size: 3 };
    const command = await normalizeBrandingUploadCommand(
      { assetKey: 'DOL_LOGO', displayName: 'Demo logo', file },
      {},
      async (selected) => {
        expect(selected).toBe(file);
        return { originalFileName: selected.name, mimeType: selected.type, sizeBytes: selected.size, base64: 'QUJD' };
      },
    );
    expect(command).toMatchObject({
      assetKey: 'DOL_LOGO', originalFileName: 'demo-logo.png', mimeType: 'image/png',
      sizeBytes: 3, base64: 'QUJD',
    });
    expect(command).not.toHaveProperty('file');
  });
});

describe('content revision concurrency and reason contract', () => {
  function contentHarness() {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'AdminService.gs']);
    const rows = [
      {
        Content_Revision_ID: 'CNT-1', Content_Key: 'PUBLIC_ROADMAP', Content_Type: 'ROADMAP',
        Title: 'First', Body_JSON: '{"items":[]}', Status: 'SUPERSEDED', Revision_Number: 1,
        _row: 2,
      },
      {
        Content_Revision_ID: 'CNT-2', Content_Key: 'PUBLIC_ROADMAP', Content_Type: 'ROADMAP',
        Title: 'Second', Body_JSON: '{"items":[]}', Status: 'PUBLISHED', Revision_Number: 2,
        _row: 3,
      },
    ];
    const history = [];
    ctx.HAU_SHEETS = Object.freeze({ ...ctx.HAU_SHEETS, CONTENT: '20_CONTENT' });
    ctx.withScriptLock_ = (operation) => operation();
    ctx.requirePermission_ = () => ({ User_ID: 'USR-ADMIN', Email: 'admin@example.invalid' });
    ctx.requireIdempotency_ = (command) => command.clientRequestId;
    ctx.idempotencyReplay_ = () => null;
    ctx.readObjects_ = (sheet) => (sheet === '20_CONTENT' ? rows : []);
    ctx.allocateId_ = () => `CNT-${rows.length + 1}`;
    ctx.nowIso_ = () => '2026-07-13T08:00:00.000Z';
    ctx.appendObject_ = (_sheet, row) => {
      const stored = { ...row, _row: rows.length + 2 };
      rows.push(stored);
      return stored;
    };
    ctx.updateObject_ = (_sheet, rowNumber, patch) => {
      Object.assign(rows.find((row) => row._row === rowNumber), patch);
    };
    ctx.audit_ = () => undefined;
    ctx.history_ = (...args) => history.push(args);
    ctx.recordIdempotency_ = (_key, result) => result;
    return { ctx, rows, history };
  }

  it('increments exactly once and rejects stale expected revisions before writes', () => {
    const { ctx, rows } = contentHarness();
    ctx.saveContentRevision_(
      {
        contentKey: 'PUBLIC_ROADMAP', contentType: 'ROADMAP', title: 'Third',
        body: { items: [] }, notes: 'Draft reason', expectedRevision: 2,
        clientRequestId: 'draft-1',
      },
      'COR-1',
    );
    expect(rows.at(-1)).toMatchObject({ Revision_Number: 3, Notes: 'Draft reason' });

    expect(() =>
      ctx.saveContentRevision_(
        {
          contentKey: 'PUBLIC_ROADMAP', contentType: 'ROADMAP', title: 'Stale',
          body: { items: [] }, expectedRevision: 2, clientRequestId: 'draft-2',
        },
        'COR-2',
      ),
    ).toThrow(expect.objectContaining({ code: 'CONTENT_REVISION_CONFLICT' }));
    expect(rows.map((row) => row.Revision_Number)).toEqual([1, 2, 3]);
  });

  it('retains publish/revert reasons and conflict-checks the latest revision', () => {
    const { ctx, rows, history } = contentHarness();
    expect(() =>
      ctx.publishContentRevision_(
        { revisionId: 'CNT-2', expectedRevision: 1, notes: 'Stale publish', clientRequestId: 'publish-0' },
        'COR-0',
      ),
    ).toThrow(expect.objectContaining({ code: 'CONTENT_REVISION_CONFLICT' }));
    expect(rows.find((row) => row.Content_Revision_ID === 'CNT-2').Status).toBe('PUBLISHED');

    ctx.publishContentRevision_(
      { revisionId: 'CNT-2', expectedRevision: 2, notes: 'Publish reason', clientRequestId: 'publish-1' },
      'COR-1',
    );
    expect(history.at(-1)[5]).toBe('Publish reason');

    ctx.revertContentRevision_(
      {
        contentKey: 'PUBLIC_ROADMAP', revisionId: 'CNT-1', expectedRevision: 2,
        notes: 'Revert reason', clientRequestId: 'revert-1',
      },
      'COR-2',
    );
    expect(rows.at(-1)).toMatchObject({
      Revision_Number: 3,
      Reverted_From_Revision_ID: 'CNT-1',
      Notes: 'Revert reason',
    });
    expect(history.at(-1)[5]).toBe('Revert reason');
  });
});
