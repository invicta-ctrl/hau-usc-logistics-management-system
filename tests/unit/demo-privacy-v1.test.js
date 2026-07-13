import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

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
    isFinite,
  });
  for (const file of files) {
    vm.runInContext(source(`apps-script/${file}`), context, { filename: file });
  }
  return context;
}

describe('demo seed privacy', () => {
  it('uses explicit demo identities and reserved contact, student, email, and TIN tokens', () => {
    const runtime = source('src/visual/runtime.js');
    const values = (field) => [
      ...runtime.matchAll(new RegExp(`${field}:'([^']*)'`, 'g')),
    ].map((match) => match[1]);

    expect(runtime).toMatch(/CURRENT_ACTOR = \{[^}]+name:'Demo /);
    expect(values('borrowerName')).not.toHaveLength(0);
    expect(values('borrowerName').every((value) => value.startsWith('Demo '))).toBe(true);
    expect(values('studentIdNumber').every((value) => /^DEMO-STUDENT-\d{3}$/.test(value))).toBe(
      true,
    );
    expect(
      values('contact').every(
        (value) => value === '' || /^DEMO-CONTACT-\d{3}$/.test(value),
      ),
    ).toBe(true);
    expect(values('requesterEmail').every((value) => /@example\.invalid$/.test(value))).toBe(
      true,
    );
    expect(values('supplierTin').every((value) => /^DEMO-TIN-\d{3}$/.test(value))).toBe(
      true,
    );
    expect(runtime).not.toMatch(/\b09\d{2}[ -]?\d{3}[ -]?\d{4}\b/);
    expect(runtime).not.toMatch(/\b\d{4}-\d{5}\b/);
    expect(runtime).not.toMatch(/\b\d{3}-\d{3}-\d{3}-\d{3}\b/);
  });

  it('keeps request and lending bootstraps free of supplier contacts, TINs, and admin data', () => {
    const ctx = gasContext([
      'Config.gs',
      'Validation.gs',
      'InventoryService.gs',
      'PortalService.gs',
    ]);
    const maliciousFields = {
      Supplier_TIN: 'private-tax-value',
      Supplier_Contact: 'private-contact-value',
      Contact_Number: 'private-phone-value',
      Actor_Email: 'private-actor-value',
    };
    ctx.resolveCurrentUser_ = () => ({
      User_ID: 'PUBLIC',
      Display_Name: 'Requester',
      Role: 'REQUESTER',
      Active: true,
    });
    ctx.resolveRequesterUser_ = ctx.resolveCurrentUser_;
    ctx.isInternalBootstrapUser_ = () => false;
    ctx.resolveRuntimeConfig_ = () => ({ environment: 'STAGING' });
    ctx.userPermissionsDto_ = () => ({
      review: false,
      release: false,
      receive: false,
      admin: false,
      manageCatalog: false,
    });
    ctx.getPublishedContent_ = () => ({ content: [] });
    ctx.getBrandingState_ = () => ({ branding: [], fallbackRequired: true });
    ctx.readObjects_ = (sheet) => {
      if (sheet === ctx.HAU_SHEETS.EVENTS) {
        return [
          {
            Event_ID: 'EVT-DEMO',
            Event_Name: 'Demo Event',
            Status: 'ACTIVE',
            ...maliciousFields,
          },
        ];
      }
      if (sheet === ctx.HAU_SHEETS.ITEMS) {
        return [
          {
            Item_ID: 'ITM-DEMO',
            Item_Name: 'Demo Item',
            Catalog_Type: 'OFFICE_INVENTORY',
            Handling: 'Loanable',
            Unit: 'piece',
            Status: 'ACTIVE',
            ...maliciousFields,
          },
        ];
      }
      return [{ ...maliciousFields }];
    };

    const request = ctx.getBootstrapData_({ portalMode: 'request' });
    const lending = ctx.getLendingBootstrap_();
    for (const result of [request, lending]) {
      const serialized = JSON.stringify(result);
      expect(serialized).not.toMatch(
        /private-tax-value|private-contact-value|private-phone-value|private-actor-value/,
      );
      expect(serialized).not.toMatch(/supplierTin|supplierContact|contactNumber|adminDashboard|users/i);
      if (Object.prototype.hasOwnProperty.call(result, 'auditLog')) {
        expect(result.auditLog).toEqual([]);
      }
      expect(result.portalMode).toMatch(/request|lending/);
    }
  });
});
