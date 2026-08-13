import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const migrationPath = resolve(repositoryRoot, 'migrations/0030_production_access_and_operations.sql');

describe('v0.7.2 additive migration contract', () => {
  it('is the next migration after the accepted schema-29 baseline', async () => {
    const migrations = (await readdir(resolve(repositoryRoot, 'migrations')))
      .filter((name) => name.endsWith('.sql'))
      .sort();

    expect(migrations.at(-3)).toBe('0029_reusable_asset_reassignment.sql');
    expect(migrations.at(-2)).toBe('0030_production_access_and_operations.sql');
    expect(migrations.at(-1)).toBe('0031_canonical_identity_foundation.sql');
  });

  it('adds the locked identity, operations, link, and announcement structures without destructive SQL', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    for (const fragment of [
      'CREATE TABLE email_verification_challenges',
      'CREATE TABLE account_applications',
      'CREATE TABLE account_application_history',
      'CREATE TABLE username_history',
      'CREATE TABLE identity_correction_requests',
      'CREATE TABLE reference_links',
      'CREATE TABLE reference_link_versions',
      'ADD COLUMN low_stock_alert_enabled',
      'ADD COLUMN low_stock_threshold',
      "ADD COLUMN audience TEXT NOT NULL DEFAULT 'PUBLIC'",
      'ADD COLUMN revision INTEGER NOT NULL DEFAULT 1',
      "'account_application.admin_review'",
      "'account_application.director_decide'",
      "'account_application.owner_override'",
      'ADD COLUMN profile_department_id',
      "SET value = '30'",
    ]) {
      expect(sql).toContain(fragment);
    }

    expect(sql).not.toMatch(/^\s*(?:DROP|DELETE)\s+/imu);
    expect(sql).not.toContain('CREATE TABLE reference_link_mutation_results');
    expect(sql).toContain("link_type IN ('EXTERNAL_URL', 'INTERNAL_ROUTE')");
    expect(sql).toContain("'CREATED', 'UPDATED', 'ACTIVATED', 'DEACTIVATED', 'ARCHIVED'");
  });

  it('locks application states and protects new history tables from mutation', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    for (const state of [
      'EMAIL_UNVERIFIED',
      'DRAFT',
      'PENDING_ADMIN_REVIEW',
      'CHANGES_REQUESTED',
      'PENDING_DIRECTOR_APPROVAL',
      'APPROVED_ACTIVATION_REQUIRED',
      'ACTIVE',
      'REJECTED',
      'WITHDRAWN',
      'EXPIRED',
      'ARCHIVED',
    ]) {
      expect(sql).toContain(`'${state}'`);
    }

    for (const trigger of [
      'account_application_history_no_update',
      'account_application_history_no_delete',
      'username_history_no_update',
      'username_history_no_delete',
      'reference_link_versions_no_update',
      'reference_link_versions_no_delete',
    ]) {
      expect(sql).toContain(`CREATE TRIGGER ${trigger}`);
    }
  });

  it('keeps status tokens and email challenge secrets as digests and protects low-stock enablement', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    expect(sql).toContain('secret_digest TEXT NOT NULL UNIQUE');
    expect(sql).toContain('verification_receipt_digest TEXT UNIQUE');
    expect(sql).toContain("purpose TEXT NOT NULL CHECK (purpose = 'STAFF_ACCOUNT_APPLICATION')");
    // The delivery-tracking columns stay nullable: a challenge exists before it
    // is sent, and a send may be accepted without the provider returning a
    // usable reference.
    expect(sql).toMatch(
      /created_at TEXT NOT NULL,\s+last_sent_at TEXT,[\s\S]*?provider_message_ref TEXT,\s+verified_at TEXT/u,
    );
    expect(sql).not.toContain('last_sent_at TEXT NOT NULL');
    expect(sql).not.toContain('provider_message_ref TEXT NOT NULL');
    expect(sql).toContain('status_token_digest TEXT NOT NULL UNIQUE');
    expect(sql).toMatch(/CREATE TABLE account_applications[\s\S]*identity_class_id TEXT NOT NULL/u);
    expect(sql).toContain('protected_email_envelope TEXT NOT NULL');
    expect(sql).toContain('inventory_low_stock_insert_guard');
    expect(sql).toContain('inventory_low_stock_update_guard');
    expect(sql).toContain('enabled low-stock alerts require a threshold');
  });
});
