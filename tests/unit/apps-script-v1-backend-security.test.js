import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  analyzeAssembledDocument,
  assembleAppsScriptTemplate,
  createAppsScriptFiles,
} from '../../scripts/apps-script-bundle-lib.mjs';

const appsScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function gasContext(files) {
  const context = vm.createContext({ console, Date, JSON, Math, Object, Error, isFinite });
  for (const file of files) {
    vm.runInContext(readFileSync(resolve(appsScriptRoot, file), 'utf8'), context, {
      filename: file,
    });
  }
  return context;
}

function source(file) {
  return readFileSync(resolve(appsScriptRoot, file), 'utf8');
}

function installableTriggerHarness(ctx, initial = []) {
  const EventType = { CLOCK: 'CLOCK', ON_EDIT: 'ON_EDIT', ON_OPEN: 'ON_OPEN' };
  const TriggerSource = { CLOCK: 'CLOCK', SPREADSHEETS: 'SPREADSHEETS' };
  const makeTrigger = ({ handler, eventType, source: triggerSource, sourceId = '' }) => ({
    getHandlerFunction: () => handler,
    getEventType: () => eventType,
    getTriggerSource: () => triggerSource,
    getTriggerSourceId: () => sourceId,
  });
  const triggers = initial.map(makeTrigger);
  ctx.ScriptApp = {
    EventType,
    TriggerSource,
    getProjectTriggers: () => [...triggers],
    deleteTrigger: (target) => triggers.splice(triggers.indexOf(target), 1),
    newTrigger: (handler) => {
      const definition = { handler, eventType: null, source: null, sourceId: '' };
      const builder = {
        timeBased: () => {
          definition.eventType = EventType.CLOCK;
          definition.source = TriggerSource.CLOCK;
          return builder;
        },
        everyDays: () => builder,
        atHour: () => builder,
        forSpreadsheet: (spreadsheet) => {
          definition.source = TriggerSource.SPREADSHEETS;
          definition.sourceId = spreadsheet.getId();
          return builder;
        },
        onEdit: () => {
          definition.eventType = EventType.ON_EDIT;
          return builder;
        },
        create: () => {
          const created = makeTrigger(definition);
          triggers.push(created);
          return created;
        },
      };
      return builder;
    },
  };
  return triggers;
}

describe('trusted portal modes and sanitized lending bootstrap', () => {
  it('derives only the three server-owned portal modes from doGet parameters', () => {
    const ctx = gasContext(['Code.gs']);
    expect(ctx.portalModeFromRequest_()).toBe('internal');
    expect(ctx.portalModeFromRequest_({ parameter: { request: '1' } })).toBe('request');
    expect(ctx.portalModeFromRequest_({ parameter: { lending: '1', request: '1' } })).toBe(
      'lending',
    );
    expect(ctx.portalModeFromRequest_({ parameter: { lending: 'true' } })).toBe('internal');
  });

  it('renders trusted portalMode and request-only markers consistently', () => {
    const files = createAppsScriptFiles({
      expandedHtml:
        '<!doctype html><html><head></head><body><main>Fixture</main><script type="module" src="/app.js"></script></body></html>',
      scriptSources: ['globalThis.fixture=true;'],
      styleSources: ['main{display:block}'],
    });
    expect(files.index).toContain('data-portal-mode="<?= portalMode ?>"');

    const lending = analyzeAssembledDocument(
      assembleAppsScriptTemplate(files, { portalMode: 'lending' }),
    );
    const body = lending.tokens.find(
      (token) => token.type === 'tag' && token.name === 'body' && !token.closing,
    );
    expect(body.attributes.get('data-portal-mode')).toBe('lending');
    expect(body.attributes.get('data-request-only')).toBe('true');
    expect(() => assembleAppsScriptTemplate(files, { portalMode: 'admin' })).toThrow(
      /internal, request, or lending/,
    );
  });

  it('returns a strict lending allowlist with no balances, storage, history, or collections', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'ItemRepository.gs', 'InventoryService.gs', 'PortalService.gs']);
    ctx.resolveRequesterUser_ = () => ({ User_ID: 'PUBLIC', Role: 'REQUESTER', Active: true });
    ctx.isInternalBootstrapUser_ = () => false;
    ctx.resolveRuntimeConfig_ = () => ({ environment: 'STAGING' });
    ctx.readObjects_ = (sheet) =>
      sheet === ctx.HAU_SHEETS.ITEMS
        ? [
            {
              Item_ID: 'ITM-1',
              Item_Name: 'Projector',
              Aliases: 'lcd|display',
              Category: 'EQUIPMENT',
              Handling: 'Returnable',
              Unit: 'unit',
              Status: 'ACTIVE',
              Opening_Qty: 99,
              Storage_Location: 'Private cabinet',
              Legacy_Source_Row: 12,
            },
            { Item_ID: 'ITM-2', Item_Name: 'Archived', Status: 'ARCHIVED' },
          ]
        : [];

    const result = ctx.getLendingBootstrap_();
    expect(Object.keys(result).sort()).toEqual(
      [
        'backendMode',
        'branding',
        'brandingFallbackRequired',
        'catalogAvailabilityProtected',
        'content',
        'currentUser',
        'environment',
        'historyAvailable',
        'inventoryItems',
        'portalMode',
        'schemaVersion',
        'version',
      ].sort(),
    );
    expect(result.historyAvailable).toBe(false);
    expect(Object.keys(result.currentUser).sort()).toEqual(
      ['authenticatedStaff', 'displayName'].sort(),
    );
    expect(result.inventoryItems).toHaveLength(1);
    expect(Object.keys(result.inventoryItems[0]).sort()).toEqual(
      [
        'aliases',
        'approvalRequired',
        'availabilityProtected',
        'category',
        'catalogType',
        'defaultLoanDays',
        'handling',
        'handlingCode',
        'id',
        'lendingAudience',
        'maximumLoanQuantity',
        'name',
        'returnRequired',
        'status',
        'unit',
      ].sort(),
    );
    expect(JSON.stringify(result)).not.toMatch(
      /Opening_Qty|openingOnHand|availableToPromise|Storage|Legacy|auditLog|ledgerTransactions|statusHistory/i,
    );
  });

  it('accepts the frontend revisionId alias for an explicit content revert target', () => {
    expect(source('AdminService.gs')).toContain(
      "command.targetRevisionId||command.contentRevisionId||command.revisionId",
    );
  });

  it('does not relabel inactive requester catalog items as active', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'ItemRepository.gs', 'InventoryService.gs']);
    expect(
      ctx.requesterItemDto_({
        Item_ID: 'ITM-3',
        Item_Name: 'Inactive item',
        Handling: 'CONSUMABLE',
        Status: 'INACTIVE',
      }).status,
    ).toBe('INACTIVE');
  });
});

describe('scoped command idempotency', () => {
  function commandContext() {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'CommandService.gs']);
    const rows = [];
    ctx.HAU_SHEETS = Object.freeze({ ...ctx.HAU_SHEETS, COMMANDS: '22_COMMAND_JOURNAL' });
    ctx.readObjects_ = (sheet) => (sheet === ctx.HAU_SHEETS.COMMANDS ? rows : []);
    ctx.appendObject_ = (_sheet, row) => {
      const stored = { ...row, _row: rows.length + 2 };
      rows.push(stored);
      return stored;
    };
    ctx.updateObject_ = (_sheet, rowNumber, patch) => {
      Object.assign(
        rows.find((row) => row._row === rowNumber),
        patch,
      );
    };
    ctx.allocateId_ = () => `CMD-${rows.length + 1}`;
    ctx.nowIso_ = () => '2026-07-13T05:00:00.000Z';
    return { ctx, rows };
  }

  function setCommand(ctx, operation, command) {
    ctx.HAU_MUTATION_CONTEXT_ = {
      operation,
      command,
      correlationId: 'COR-1',
      commandScopes: [],
    };
  }

  it('scopes a client key by operation and actor and rejects payload reuse', () => {
    const { ctx, rows } = commandContext();
    const actorA = { User_ID: 'USR-A', Email: 'a@example.edu' };
    const actorB = { User_ID: 'USR-B', Email: 'b@example.edu' };

    setCommand(ctx, 'saveUserAccess', { clientRequestId: 'same-key', value: 1 });
    expect(ctx.beginOrReplayScopedCommand_('same-key', actorA)).toBeNull();
    ctx.completeScopedCommand_('same-key', { entityId: 'USR-9' }, actorA, 'COR-1');
    setCommand(ctx, 'saveUserAccess', { value: 1, clientRequestId: 'same-key' });
    expect(ctx.beginOrReplayScopedCommand_('same-key', actorA)).toEqual({ entityId: 'USR-9' });

    setCommand(ctx, 'saveUserAccess', { clientRequestId: 'same-key', value: 2 });
    expect(() => ctx.beginOrReplayScopedCommand_('same-key', actorA)).toThrow(
      /different payload/,
    );

    setCommand(ctx, 'saveEvent', { clientRequestId: 'same-key', value: 1 });
    expect(ctx.beginOrReplayScopedCommand_('same-key', actorA)).toBeNull();
    expect(ctx.beginOrReplayScopedCommand_('same-key', actorB)).toBeNull();
    expect(rows.map((row) => row.Idempotency_Scope)).toEqual([
      'saveUserAccess|USR-A|same-key',
      'saveEvent|USR-A|same-key',
      'saveEvent|USR-B|same-key',
    ]);
  });

  it('never grants a legacy audit replay to a public actor', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'CommandService.gs']);
    ctx.readObjects_ = () => [
      {
        Action: 'IDEMPOTENCY_COMPLETED',
        Actor_User_ID: 'PUBLIC',
        Notes: JSON.stringify({ key: 'legacy' }),
        After_JSON: JSON.stringify({ leaked: true }),
      },
    ];
    expect(ctx.legacySameActorReplay_('legacy', { User_ID: 'PUBLIC' })).toBeNull();
  });
});

describe('admin and workflow security contracts', () => {
  it('keeps scheduled handlers private and migrates legacy, duplicate, or wrong-type triggers', () => {
    expect(source('BackupService.gs')).toMatch(/function scheduledBackup_\s*\(/);
    expect(source('BackupService.gs')).not.toMatch(/function scheduledBackup\s*\(/);
    expect(source('LendingService.gs')).toMatch(/function updateOverdueLending_\s*\(/);
    expect(source('LendingService.gs')).not.toMatch(/function updateOverdueLending\s*\(/);
    expect(source('LendingService.gs')).toContain("audit_('LENDING_OVERDUE'");

    const ctx = gasContext(['Setup.gs']);
    const triggers = installableTriggerHarness(ctx, [
      { handler: 'updateOverdueLending', eventType: 'CLOCK', source: 'CLOCK' },
      { handler: 'scheduledBackup', eventType: 'CLOCK', source: 'CLOCK' },
      { handler: 'scheduledBackup_', eventType: 'CLOCK', source: 'CLOCK' },
      { handler: 'scheduledBackup_', eventType: 'CLOCK', source: 'CLOCK' },
      { handler: 'updateOverdueLending_', eventType: 'ON_OPEN', source: 'SPREADSHEETS' },
    ]);
    let locks = 0;
    const audits = [];
    ctx.guardApi_ = (_operation, _metadata, operation) => operation('COR-TRIGGER');
    ctx.setupUser_ = () => ({ User_ID: 'USR-ADMIN' });
    ctx.withScriptLock_ = (operation) => {
      locks += 1;
      return operation();
    };
    ctx.audit_ = (...args) => audits.push(args);

    const result = ctx.setupTimeTriggers();
    expect(triggers.map((row) => row.getHandlerFunction()).sort()).toEqual([
      'scheduledBackup_',
      'updateOverdueLending_',
    ]);
    expect(result.created).toEqual(['updateOverdueLending_']);
    expect(result.removed.sort()).toEqual([
      'scheduledBackup',
      'scheduledBackup_',
      'updateOverdueLending',
      'updateOverdueLending_',
    ]);
    expect(result.scope).toBe('CURRENT_USER');

    expect(ctx.setupTimeTriggers()).toMatchObject({ created: [], removed: [] });
    expect(locks).toBe(2);
    expect(audits).toHaveLength(2);
  });

  it('retains legacy clock triggers if a private replacement cannot be created', () => {
    const ctx = gasContext(['Setup.gs']);
    const triggers = installableTriggerHarness(ctx, [
      { handler: 'updateOverdueLending', eventType: 'CLOCK', source: 'CLOCK' },
      { handler: 'scheduledBackup', eventType: 'CLOCK', source: 'CLOCK' },
    ]);
    const originalNewTrigger = ctx.ScriptApp.newTrigger;
    ctx.ScriptApp.newTrigger = (handler) => {
      const builder = originalNewTrigger(handler);
      builder.create = () => {
        throw new Error('CREATE_FAILED');
      };
      return builder;
    };
    ctx.guardApi_ = (_operation, _metadata, operation) => operation('COR-TRIGGER');
    ctx.setupUser_ = () => ({ User_ID: 'USR-ADMIN' });
    ctx.withScriptLock_ = (operation) => operation();
    ctx.audit_ = () => undefined;

    expect(() => ctx.setupTimeTriggers()).toThrow(/CREATE_FAILED/);
    expect(triggers.map((row) => row.getHandlerFunction()).sort()).toEqual([
      'scheduledBackup',
      'updateOverdueLending',
    ]);
  });

  it('keeps the operational edit handler private and recreates only an exact on-edit trigger', () => {
    expect(source('DataRevisionService.gs')).toMatch(/function handleOperationalSheetEdit_\s*\(/);
    expect(source('DataRevisionService.gs')).not.toMatch(
      /function handleOperationalSheetEdit\s*\(/,
    );

    const ctx = gasContext(['DataRevisionService.gs']);
    const triggers = installableTriggerHarness(ctx, [
      {
        handler: 'handleOperationalSheetEdit',
        eventType: 'ON_EDIT',
        source: 'SPREADSHEETS',
        sourceId: 'SHEET-1',
      },
      {
        handler: 'handleOperationalSheetEdit_',
        eventType: 'ON_OPEN',
        source: 'SPREADSHEETS',
        sourceId: 'SHEET-1',
      },
      {
        handler: 'handleOperationalSheetEdit_',
        eventType: 'ON_EDIT',
        source: 'SPREADSHEETS',
        sourceId: 'SHEET-2',
      },
    ]);
    const audits = [];
    let locks = 0;
    ctx.guardApi_ = (_operation, _metadata, operation) => operation('COR-EDIT');
    ctx.setupUser_ = () => ({ User_ID: 'USR-ADMIN' });
    ctx.resolveRuntimeConfig_ = () => ({ spreadsheetId: 'SHEET-1' });
    ctx.getDatabase_ = () => ({ getId: () => 'SHEET-1' });
    ctx.withScriptLock_ = (operation) => {
      locks += 1;
      return operation();
    };
    ctx.audit_ = (...args) => audits.push(args);

    expect(ctx.setupOperationalEditTrigger()).toMatchObject({
      created: true,
      existing: 1,
      scope: 'CURRENT_USER',
    });
    expect(triggers).toHaveLength(1);
    expect(triggers[0].getHandlerFunction()).toBe('handleOperationalSheetEdit_');
    expect(triggers[0].getEventType()).toBe('ON_EDIT');
    expect(triggers[0].getTriggerSource()).toBe('SPREADSHEETS');
    expect(triggers[0].getTriggerSourceId()).toBe('SHEET-1');

    expect(ctx.setupOperationalEditTrigger()).toMatchObject({ created: false, removed: [] });
    expect(locks).toBe(2);
    expect(audits).toHaveLength(2);
  });

  it('accepts nested UI permission names without trusting unknown fields', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'AdminService.gs']);
    expect(
      ctx.permissionInput_({ permissions: { review: true, admin: false } }, 'Can_Review'),
    ).toEqual({ present: true, value: true });
    expect(ctx.permissionInput_({ owner: true }, 'Can_Admin')).toEqual({
      present: false,
      value: false,
    });
  });

  it('never returns Drive storage identifiers in public branding metadata', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'AdminService.gs']);
    const result = ctx.brandingPublicDto_({
      Asset_Key: 'BRAND_WORDMARK',
      Display_Name: 'Wordmark',
      Alt_Text: 'HAU USC wordmark',
      Mime_Type: 'image/png',
      Width_Px: 800,
      Height_Px: 200,
      Version_Number: 3,
      Drive_File_ID: 'private-file-id',
      Drive_Folder_ID: 'private-folder-id',
      Drive_URL: 'https://drive.google.com/private',
      Size_Bytes: 12345,
      SHA256: 'secret-checksum',
    });
    expect(result).toMatchObject({ useFallback: true, fallbackKey: 'BUILT_IN_WORDMARK' });
    expect(JSON.stringify(result)).not.toMatch(/Drive|private|SHA|sizeBytes/i);
    expect(() => ctx.requireBrandingMetadataOnly_({ base64: 'raw-file-bytes' })).toThrow(
      /metadata only/,
    );
  });

  it('omits revision IDs and actor metadata from published content', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'AdminService.gs']);
    const result = ctx.publishedContentDto_({
      Content_Revision_ID: 'CNT-INTERNAL-1',
      Content_Key: 'ROADMAP',
      Content_Type: 'ROADMAP',
      Title: 'Roadmap',
      Body_JSON: JSON.stringify({ phases: [] }),
      Status: 'PUBLISHED',
      Revision_Number: 2,
      Published_At: '2026-07-13T00:00:00.000Z',
      Created_By: 'USR-PRIVATE',
      Updated_By: 'USR-PRIVATE',
    });
    expect(result).toMatchObject({ key: 'ROADMAP', status: 'PUBLISHED', revision: 2 });
    expect(JSON.stringify(result)).not.toMatch(/CNT-INTERNAL|USR-PRIVATE|revisionId|createdBy/i);
  });

  it('blocks public self-assertion of USC staff eligibility', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'LendingService.gs']);
    ctx.normalizeBorrowerType_ = (value) => String(value || '').toUpperCase();
    ctx.isInternalBootstrapUser_ = (user) => user?.User_ID === 'USR-STAFF';
    expect(() =>
      ctx.verifiedBorrowerType_('USC_STAFF', { User_ID: 'PUBLIC', Role: 'REQUESTER' }),
    ).toThrow(/authenticated authorized staff/);
    expect(ctx.verifiedBorrowerType_('USC_STAFF', { User_ID: 'USR-STAFF' })).toBe(
      'USC_STAFF',
    );
  });

  it('wires stable protected workflow codes and one Apps Script gateway', () => {
    expect(source('ReleaseService.gs')).toContain('PARTIAL_RELEASE_REASON_REQUIRED');
    expect(source('LendingService.gs')).toContain('RETURN_EVIDENCE_REQUIRED');
    expect(source('ItemRepository.gs')).toContain('VERIFY_RESOLUTION_REQUIRED');
    expect(source('ItemRepository.gs')).toContain("requirePermission_('Can_Admin')");
    expect(source('AuditService.gs')).toContain("requirePermission_('Can_Admin')");
    expect(source('Router.gs')).toContain('api_getAdminDashboard');
    expect(source('Router.gs')).toContain('api_saveContentRevision');
    expect(source('Router.gs')).toContain('api_saveBrandingMetadata');
    expect(source('AdminService.gs')).toContain('updateEventSeries_');

    const serviceSource = readFileSync(
      resolve(import.meta.dirname, '../../src/services/apps-script-service.js'),
      'utf8',
    );
    expect(serviceSource).not.toMatch(/google\s*\.\s*script\s*\.\s*run/);
    expect(serviceSource).toContain('extends AppsScriptAdapter');
  });
});
