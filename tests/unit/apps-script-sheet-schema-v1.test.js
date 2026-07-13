import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

class FakeProtection {
  constructor(range) {
    this.range = range;
    this.description = '';
    this.warningOnly = false;
  }

  getRange() { return this.range; }
  getDescription() { return this.description; }
  setDescription(value) { this.description = value; return this; }
  setWarningOnly(value) { this.warningOnly = value; return this; }
}

class FakeRange {
  constructor(sheet, row, column, numRows, numColumns) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.numRows = numRows;
    this.numColumns = numColumns;
  }

  getValues() { return this.sheet.read(this.row, this.column, this.numRows, this.numColumns); }
  getDisplayValues() {
    return this.getValues().map((row) => row.map((value) => (value == null ? '' : String(value))));
  }
  setValues(values) { this.sheet.write(this.row, this.column, values); return this; }
  setBackground() { return this; }
  setFontColor() { return this; }
  setFontWeight() { return this; }
  setWrap() { return this; }
  createFilter() { this.sheet.filter = { range: this }; return this.sheet.filter; }
  setDataValidation(rule) { this.sheet.validations.set(this.getA1Notation(), rule); return this; }
  getA1Notation() {
    return `R${this.row}C${this.column}:R${this.row + this.numRows - 1}C${this.column + this.numColumns - 1}`;
  }
  protect() {
    const protection = new FakeProtection(this);
    this.sheet.protections.push(protection);
    return protection;
  }
}

class FakeSheet {
  constructor(name, values = []) {
    this.name = name;
    this.values = values.map((row) => row.slice());
    this.filter = null;
    this.protections = [];
    this.validations = new Map();
    this.frozenRows = 0;
  }

  getName() { return this.name; }
  getLastRow() {
    let last = 0;
    this.values.forEach((row, index) => {
      if (row.some((value) => value !== '' && value != null)) last = index + 1;
    });
    return last;
  }
  getLastColumn() {
    let last = 0;
    this.values.forEach((row) => {
      row.forEach((value, index) => {
        if (value !== '' && value != null) last = Math.max(last, index + 1);
      });
    });
    return last;
  }
  getMaxRows() { return Math.max(50, this.values.length); }
  getRange(row, column, numRows = 1, numColumns = 1) {
    return new FakeRange(this, row, column, numRows, numColumns);
  }
  getFilter() { return this.filter; }
  getProtections() { return this.protections.slice(); }
  setFrozenRows(count) { this.frozenRows = count; return this; }
  autoResizeColumns() { return this; }
  read(row, column, numRows, numColumns) {
    return Array.from({ length: numRows }, (_, rowOffset) =>
      Array.from({ length: numColumns }, (_, columnOffset) =>
        this.values[row + rowOffset - 1]?.[column + columnOffset - 1] ?? '',
      ),
    );
  }
  write(row, column, values) {
    values.forEach((sourceRow, rowOffset) => {
      const targetIndex = row + rowOffset - 1;
      while (this.values.length <= targetIndex) this.values.push([]);
      sourceRow.forEach((value, columnOffset) => {
        this.values[targetIndex][column + columnOffset - 1] = value;
      });
    });
  }
}

class FakeSpreadsheet {
  constructor(id = 'fake-spreadsheet', sheets = []) {
    this.id = id;
    this.sheets = new Map(sheets.map((sheet) => [sheet.getName(), sheet]));
  }

  getId() { return this.id; }
  getSheets() { return [...this.sheets.values()]; }
  getSheetByName(name) { return this.sheets.get(name) ?? null; }
  insertSheet(name) {
    const sheet = new FakeSheet(name);
    this.sheets.set(name, sheet);
    return sheet;
  }
}

function fakeSpreadsheetApp(overrides = {}) {
  return {
    ProtectionType: { RANGE: 'RANGE' },
    newDataValidation() {
      const rule = { values: [], allowInvalid: false, helpText: '', showDropdown: true };
      const builder = {
        requireValueInList(values, showDropdown) { rule.values = [...values]; rule.showDropdown = showDropdown; return builder; },
        setAllowInvalid(value) { rule.allowInvalid = value; return builder; },
        setHelpText(value) { rule.helpText = value; return builder; },
        build() { return { ...rule, values: [...rule.values] }; },
      };
      return builder;
    },
    ...overrides,
  };
}

function gasContext(files, globals = {}) {
  const context = vm.createContext({
    console,
    Object,
    JSON,
    Date,
    Math,
    String,
    Boolean,
    Number,
    Array,
    RegExp,
    isFinite,
    isNaN,
    Error,
    SpreadsheetApp: fakeSpreadsheetApp(),
    Utilities: {
      formatDate: () => '2026-07-13 120000',
      getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    },
    ...globals,
  });
  for (const file of files) {
    vm.runInContext(
      readFileSync(resolve(import.meta.dirname, '../../apps-script', file), 'utf8'),
      context,
      { filename: file },
    );
  }
  return context;
}

function headersOf(sheet) {
  return sheet.read(1, 1, 1, sheet.getLastColumn())[0];
}

function allKeys(value, output = []) {
  if (!value || typeof value !== 'object') return output;
  for (const [key, nested] of Object.entries(value)) {
    output.push(key);
    allKeys(nested, output);
  }
  return output;
}

describe('Apps Script additive V1-preparation schema', () => {
  it('bumps prerelease metadata and exposes all frozen new-table headers through the backend command path', () => {
    const ctx = gasContext(['Config.gs', 'Setup.gs']);
    expect(ctx.HAU_CONFIG.APP_VERSION).toBe('0.6.0-dev.1');
    expect(ctx.HAU_CONFIG.SCHEMA_VERSION).toBe('1.2.0');
    expect(ctx.HAU_SHEETS.COMMANDS).toBe('22_COMMAND_JOURNAL');
    expect(ctx.HAU_SHEETS.COMMAND_JOURNAL).toBe(ctx.HAU_SHEETS.COMMANDS);
    expect(Array.from(ctx.HAU_HEADERS['20_CONTENT'])).toEqual([
      'Content_Revision_ID','Content_Key','Content_Type','Title','Body_JSON','Status','Revision_Number','Published_At','Published_By','Created_At','Created_By','Updated_At','Updated_By','Supersedes_Revision_ID','Reverted_From_Revision_ID','Notes',
    ]);
    expect(Array.from(ctx.HAU_HEADERS['21_BRANDING'])).toEqual([
      'Branding_Version_ID','Asset_Key','Display_Name','Alt_Text','Mime_Type','File_Extension','Size_Bytes','Width_Px','Height_Px','SHA256','Drive_File_ID','Drive_Folder_ID','Drive_URL','Status','Version_Number','Active','Created_At','Created_By','Activated_At','Activated_By','Supersedes_Version_ID','Notes',
    ]);
    expect(Array.from(ctx.HAU_HEADERS[ctx.HAU_SHEETS.COMMANDS])).toEqual([
      'Command_ID','Operation','Actor_User_ID','Actor_Email','Idempotency_Scope','Client_Request_ID','Payload_SHA256','Status','Started_At','Completed_At','Correlation_ID','Related_Entity_Type','Related_Entity_ID','Result_JSON','Error_Code','Error_Message','Recovery_Status','Recovery_Notes',
    ]);
    expect(Object.keys(ctx.HAU_HEADERS)).toHaveLength(22);
    expect(Array.from(ctx.HAU_DATA_VALIDATION_LISTS_['22_COMMAND_JOURNAL'].Status)).toContain('PENDING');
    expect(Array.from(ctx.HAU_DATA_VALIDATION_LISTS_['22_COMMAND_JOURNAL'].Recovery_Status)).toContain('REVIEW_REQUIRED');
  });

  it('creates every known sheet once and is a no-op for headers on a repeated run', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'SheetRepository.gs', 'Setup.gs']);
    const database = new FakeSpreadsheet();
    ctx.getDatabase_ = () => database;

    const first = ctx.repairKnownSheetSchemas_(database);
    expect(Array.from(first.created)).toHaveLength(22);
    expect(Array.from(first.headersAdded)).toHaveLength(22);
    for (const [name, expected] of Object.entries(ctx.HAU_HEADERS)) {
      expect(headersOf(database.getSheetByName(name))).toEqual(Array.from(expected));
    }

    database.getSheetByName('20_CONTENT').write(2, 1, [['CNT-1', 'ROADMAP', 'ROADMAP', 'Preserved title']]);
    const before = database.getSheetByName('20_CONTENT').values.map((row) => row.slice());
    const second = ctx.repairKnownSheetSchemas_(database);
    expect(Array.from(second.created)).toEqual([]);
    expect(Array.from(second.headersAdded)).toEqual([]);
    expect(database.getSheetByName('20_CONTENT').values).toEqual(before);
  });

  it('repairs a partial known sheet additively while preserving and reporting an unexpected legacy column', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'SheetRepository.gs', 'Setup.gs']);
    const requests = new FakeSheet('03_REQUESTS', [
      ['Request_ID', 'Created_At', 'Institutional_Legacy_Field'],
      ['REQ-1', '2026-07-13T10:00:00+08:00', 'preserve-me'],
    ]);
    const database = new FakeSpreadsheet('fake', [requests]);
    ctx.getDatabase_ = () => database;

    const result = ctx.repairKnownSheetSchemas_(database);
    const actual = headersOf(requests);
    const report = ctx.schemaHeaderReport_('03_REQUESTS', actual);
    expect(actual.slice(0, 3)).toEqual(['Request_ID', 'Created_At', 'Institutional_Legacy_Field']);
    expect(requests.read(2, 1, 1, 3)[0]).toEqual(['REQ-1', '2026-07-13T10:00:00+08:00', 'preserve-me']);
    expect(Array.from(report.missing)).toEqual([]);
    expect(Array.from(report.unexpected)).toEqual([{ header: 'Institutional_Legacy_Field', column: 3 }]);
    expect(report.compatible).toBe(true);
    expect(report.ok).toBe(false);
    expect(Array.from(result.headersAdded).find((entry) => entry.sheet === '03_REQUESTS').headers).toHaveLength(
      ctx.HAU_HEADERS['03_REQUESTS'].length - 2,
    );
  });

  it('reports duplicate and incompatible headers and stops before any partial repair', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'SheetRepository.gs', 'Setup.gs']);
    const items = new FakeSheet('01_ITEM_MASTER', [
      ['Item_ID', 'Item_ID'],
      ['ITM-1', 'ITM-duplicate'],
    ]);
    const database = new FakeSpreadsheet('fake', [items]);
    ctx.getDatabase_ = () => database;

    const duplicate = ctx.schemaHeaderReport_('01_ITEM_MASTER', ['Item_ID', 'Item_ID']);
    const incompatible = ctx.schemaHeaderReport_('01_ITEM_MASTER', ['item_id']);
    expect(Array.from(duplicate.duplicate)).toEqual([{ header: 'Item_ID', columns: [1, 2] }]);
    expect(Array.from(incompatible.incompatible)).toEqual([{ header: 'item_id', expected: 'Item_ID', column: 1 }]);
    expect(() => ctx.repairKnownSheetSchemas_(database)).toThrow(
      expect.objectContaining({ code: 'SCHEMA_HEADERS_INCOMPATIBLE' }),
    );
    expect(database.getSheets()).toHaveLength(1);
    expect(items.values).toEqual([
      ['Item_ID', 'Item_ID'],
      ['ITM-1', 'ITM-duplicate'],
    ]);
  });

  it('applies repeatable validation and warning-only system protections without removing existing protection', () => {
    const spreadsheetApp = fakeSpreadsheetApp();
    const ctx = gasContext(
      ['Config.gs', 'Validation.gs', 'SheetRepository.gs', 'Setup.gs'],
      { SpreadsheetApp: spreadsheetApp },
    );
    const headers = Array.from(ctx.HAU_HEADERS['01_ITEM_MASTER']);
    const values = [headers, headers.map((header) => (header === 'Item_ID' ? 'ITM-1' : header === 'Status' ? 'ACTIVE' : 'kept'))];
    const items = new FakeSheet('01_ITEM_MASTER', values);
    const existingProtection = items.getRange(2, headers.length, 49, 1).protect().setDescription('Existing institutional protection');
    const before = items.values.map((row) => row.slice());

    const first = ctx.configureKnownSheet_(items, '01_ITEM_MASTER');
    const protectionCount = items.protections.length;
    const validationCount = items.validations.size;
    const second = ctx.configureKnownSheet_(items, '01_ITEM_MASTER');

    expect(Array.from(first.validations)).toHaveLength(5);
    expect(Array.from(first.protectionsAdded).length).toBeGreaterThan(0);
    expect(Array.from(second.protectionsAdded)).toEqual([]);
    expect(items.protections).toContain(existingProtection);
    expect(items.protections).toHaveLength(protectionCount);
    expect(items.validations).toHaveLength(validationCount);
    expect(items.protections.filter((protection) => protection !== existingProtection).every((protection) => protection.warningOnly)).toBe(true);
    expect(items.values).toEqual(before);
  });
});

describe('Apps Script generic Sheet write safety', () => {
  it('neutralizes formula-leading strings in append, batch, and update writes while preserving typed values', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'SheetRepository.gs']);
    const contentHeaders = Array.from(ctx.HAU_HEADERS['20_CONTENT']);
    const brandingHeaders = Array.from(ctx.HAU_HEADERS['21_BRANDING']);
    const content = new FakeSheet('20_CONTENT', [contentHeaders]);
    const branding = new FakeSheet('21_BRANDING', [brandingHeaders]);
    const database = new FakeSpreadsheet('fake', [content, branding]);
    const createdAt = new Date('2026-07-13T00:00:00.000Z');
    ctx.getDatabase_ = () => database;

    ctx.appendObject_('20_CONTENT', {
      Content_Revision_ID: 'CNT-1', Title: '=IMPORTXML("x")', Body_JSON: '  @unsafe',
      Revision_Number: 2, Created_At: createdAt, Notes: '-unsafe',
    });
    ctx.appendObjects_('20_CONTENT', [
      { Content_Revision_ID: 'CNT-2', Title: '+unsafe' },
      { Content_Revision_ID: 'CNT-3', Title: "'=already-safe" },
    ]);
    ctx.appendObject_('21_BRANDING', {
      Branding_Version_ID: 'BRD-1', Asset_Key: '@unsafe', Size_Bytes: 25, Active: true, Created_At: createdAt,
    });
    ctx.updateObject_('20_CONTENT', 2, { Title: '+updated', Revision_Number: 3, Status: true });

    const title = contentHeaders.indexOf('Title');
    const body = contentHeaders.indexOf('Body_JSON');
    const revision = contentHeaders.indexOf('Revision_Number');
    const status = contentHeaders.indexOf('Status');
    const created = contentHeaders.indexOf('Created_At');
    const notes = contentHeaders.indexOf('Notes');
    expect(content.values[1][title]).toBe("'+updated");
    expect(content.values[1][body]).toBe("'  @unsafe");
    expect(content.values[1][revision]).toBe(3);
    expect(content.values[1][status]).toBe(true);
    expect(content.values[1][created]).toBe(createdAt);
    expect(content.values[1][notes]).toBe("'-unsafe");
    expect(content.values[2][title]).toBe("'+unsafe");
    expect(content.values[3][title]).toBe("'=already-safe");
    expect(branding.values[1][brandingHeaders.indexOf('Asset_Key')]).toBe("'@unsafe");
    expect(branding.values[1][brandingHeaders.indexOf('Size_Bytes')]).toBe(25);
    expect(branding.values[1][brandingHeaders.indexOf('Active')]).toBe(true);
    expect(branding.values[1][brandingHeaders.indexOf('Created_At')]).toBe(createdAt);
  });

  it('rejects generic writes on incompatible headers, blocks posted-row edits, and never appends a VERIFY item ledger transaction', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'SheetRepository.gs']);
    const badContent = new FakeSheet('20_CONTENT', [['Content_Revision_ID', 'Content_Revision_ID']]);
    const incompleteBranding = new FakeSheet('21_BRANDING', [['Branding_Version_ID']]);
    const itemHeaders = Array.from(ctx.HAU_HEADERS['01_ITEM_MASTER']);
    const ledgerHeaders = Array.from(ctx.HAU_HEADERS['02_LEDGER']);
    const verifyItem = itemHeaders.map((header) => (header === 'Item_ID' ? 'ITM-V' : header === 'Status' ? 'VERIFY' : ''));
    const items = new FakeSheet('01_ITEM_MASTER', [itemHeaders, verifyItem]);
    const ledger = new FakeSheet('02_LEDGER', [ledgerHeaders]);
    const database = new FakeSpreadsheet('fake', [badContent, incompleteBranding, items, ledger]);
    ctx.getDatabase_ = () => database;

    expect(() => ctx.appendObject_('20_CONTENT', { Content_Revision_ID: 'CNT-1' })).toThrow(
      expect.objectContaining({ code: 'SCHEMA_HEADERS_INCOMPATIBLE' }),
    );
    expect(() => ctx.appendObject_('21_BRANDING', { Branding_Version_ID: 'BRD-1' })).toThrow(
      expect.objectContaining({ code: 'SCHEMA_HEADERS_INCOMPLETE' }),
    );
    expect(() => ctx.appendObject_('02_LEDGER', { Transaction_ID: 'TXN-1', Item_ID: 'ITM-V', Status: 'POSTED' })).toThrow(
      expect.objectContaining({ code: 'ITEM_REQUIRES_VERIFICATION' }),
    );
    expect(() => ctx.updateObject_('02_LEDGER', 2, { Notes: 'rewrite' })).toThrow(
      expect.objectContaining({ code: 'APPEND_ONLY_TABLE' }),
    );
    expect(ledger.getLastRow()).toBe(1);
  });

  it('writes command journal rows through HAU_SHEETS.COMMANDS with the same formula guard', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'SheetRepository.gs']);
    const headers = Array.from(ctx.HAU_HEADERS['22_COMMAND_JOURNAL']);
    const commands = new FakeSheet('22_COMMAND_JOURNAL', [headers]);
    const database = new FakeSpreadsheet('fake', [commands]);
    ctx.getDatabase_ = () => database;

    ctx.appendObject_(ctx.HAU_SHEETS.COMMANDS, {
      Command_ID: 'CMD-1', Operation: '=unsafe', Client_Request_ID: 'REQ-1', Status: 'PENDING',
    });
    expect(commands.values[1][headers.indexOf('Command_ID')]).toBe('CMD-1');
    expect(commands.values[1][headers.indexOf('Operation')]).toBe("'=unsafe");
  });
});

describe('Apps Script verified backup and demo-seed boundary', () => {
  it('opens and inventories a distinct backup copy without returning resource IDs or URLs', () => {
    const source = new FakeSpreadsheet('source-resource', [
      new FakeSheet('01_ITEM_MASTER', [['Item_ID', 'Status'], ['ITM-1', 'ACTIVE']]),
      new FakeSheet('20_CONTENT', [['Content_Revision_ID'], ['CNT-1']]),
    ]);
    const backup = new FakeSpreadsheet('copy-resource', [
      new FakeSheet('20_CONTENT', [['Content_Revision_ID'], ['CNT-1']]),
      new FakeSheet('01_ITEM_MASTER', [['Item_ID', 'Status'], ['ITM-1', 'ACTIVE']]),
    ]);
    const opened = [];
    let auditContext;
    const spreadsheetApp = fakeSpreadsheetApp({
      openById(id) { opened.push(id); return backup; },
    });
    const driveApp = {
      getFileById: () => ({ makeCopy: () => ({ getId: () => 'copy-resource' }) }),
    };
    const ctx = gasContext(
      ['Config.gs', 'Validation.gs', 'BackupService.gs'],
      { SpreadsheetApp: spreadsheetApp, DriveApp: driveApp },
    );
    ctx.resolveRuntimeConfig_ = () => ({ environment: 'STAGING', spreadsheetId: 'configured-source' });
    ctx.archiveFolder_ = () => ({ name: 'archive' });
    ctx.getDatabase_ = () => source;
    ctx.audit_ = (...args) => { auditContext = args; };

    const result = ctx.createLaunchBackup_({ User_ID: 'USR-ADMIN' }, 'COR-1', 'Launch');
    expect(opened).toEqual(['copy-resource']);
    expect(result.verification).toEqual({
      distinctResource: true,
      matchesSourceInventory: true,
      sheetCount: 2,
      sheets: [
        { sheet: '01_ITEM_MASTER', headerCount: 2, rowCount: 1 },
        { sheet: '20_CONTENT', headerCount: 1, rowCount: 1 },
      ],
    });
    expect(JSON.stringify(result)).not.toMatch(/source-resource|copy-resource|configured-source/);
    expect(allKeys(result).filter((key) => /(^|_)(id|url)$/i.test(key))).toEqual([]);
    expect(auditContext[0]).toBe('CREATE_LAUNCH_BACKUP');
    expect(() => ctx.verifyBackupCopy_(source, source)).toThrow(expect.objectContaining({ code: 'BACKUP_NOT_DISTINCT' }));
    const mismatched = new FakeSpreadsheet('mismatched-copy', [
      new FakeSheet('01_ITEM_MASTER', [['Item_ID', 'Status']]),
    ]);
    expect(() => ctx.verifyBackupCopy_(source, mismatched)).toThrow(
      expect.objectContaining({ code: 'BACKUP_VERIFICATION_FAILED' }),
    );
  });

  it('keeps demo seeding explicitly blocked and STAGING-only without writing placeholder rows', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'SheetRepository.gs', 'Setup.gs']);
    let writes = 0;
    ctx.requirePermission_ = () => ({ User_ID: 'USR-ADMIN' });
    ctx.logError_ = () => {};
    ctx.appendObject_ = () => { writes += 1; };
    ctx.resolveRuntimeConfig_ = () => ({ environment: 'PRODUCTION' });
    expect(ctx.seedStagingDemoData()).toMatchObject({ ok: false, code: 'STAGING_ONLY_OPERATION' });

    ctx.resolveRuntimeConfig_ = () => ({ environment: 'STAGING' });
    expect(ctx.stagingDemoSeedStatus_()).toMatchObject({
      environment: 'STAGING', status: 'BLOCKED', code: 'DEMO_FIXTURE_NOT_APPROVED',
    });
    expect(ctx.seedStagingDemoData()).toMatchObject({
      ok: false,
      code: 'DEMO_SEEDING_BLOCKED',
      details: { environment: 'STAGING', status: 'BLOCKED', reason: 'DEMO_FIXTURE_NOT_APPROVED' },
    });
    expect(writes).toBe(0);
  });
});
