import { Miniflare } from 'miniflare';
import { afterEach, describe, expect, it } from 'vitest';
import { createD1ReferenceLinkRepository } from '../../src/server/d1/reference-link-repository.js';

let miniflare;

afterEach(async () => {
  await miniflare?.dispose();
  miniflare = null;
});

async function context() {
  miniflare = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } }',
    d1Databases: ['DB'],
  });
  const db = await miniflare.getD1Database('DB');
  for (const statement of [
    'CREATE TABLE accounts (id TEXT PRIMARY KEY) STRICT',
    `CREATE TABLE audit_log (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, action TEXT NOT NULL,
      entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, actor_account_id TEXT,
      before_json TEXT NOT NULL DEFAULT '{}', after_json TEXT NOT NULL DEFAULT '{}',
      correlation_id TEXT NOT NULL, notes TEXT NOT NULL DEFAULT ''
    ) STRICT`,
    `CREATE TABLE idempotency_keys (
      scope TEXT NOT NULL, idempotency_key TEXT NOT NULL, actor_account_id TEXT NOT NULL,
      request_fingerprint TEXT NOT NULL, result_json TEXT NOT NULL, created_at TEXT NOT NULL,
      PRIMARY KEY (scope, idempotency_key)
    ) STRICT`,
    `CREATE TABLE reference_links (
      id TEXT PRIMARY KEY, label TEXT NOT NULL, url TEXT NOT NULL DEFAULT '',
      route_id TEXT NOT NULL DEFAULT '',
      link_type TEXT NOT NULL CHECK (link_type IN ('EXTERNAL_URL', 'INTERNAL_ROUTE')),
      audience TEXT NOT NULL CHECK (audience IN ('PUBLIC', 'STAFF', 'ADMINISTRATOR', 'DIRECTOR')),
      status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
      revision INTEGER NOT NULL CHECK (revision >= 1),
      sync_state TEXT NOT NULL CHECK (sync_state IN ('SYNCED', 'SYNC_PENDING', 'SYNC_FAILED', 'NOT_CONFIGURED')),
      created_by_account_id TEXT NOT NULL REFERENCES accounts(id),
      updated_by_account_id TEXT NOT NULL REFERENCES accounts(id),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT,
      CHECK ((url <> '' AND route_id = '') OR (url = '' AND route_id <> ''))
    ) STRICT`,
    `CREATE TABLE reference_link_versions (
      id TEXT PRIMARY KEY, link_id TEXT NOT NULL REFERENCES reference_links(id),
      revision INTEGER NOT NULL CHECK (revision >= 1), before_json TEXT, after_json TEXT NOT NULL,
      action TEXT NOT NULL, actor_account_id TEXT NOT NULL REFERENCES accounts(id),
      reason TEXT NOT NULL, idempotency_key TEXT NOT NULL, correlation_id TEXT NOT NULL,
      created_at TEXT NOT NULL, UNIQUE (link_id, revision)
    ) STRICT`,
    `CREATE TRIGGER reference_link_versions_no_update
     BEFORE UPDATE ON reference_link_versions
     BEGIN SELECT RAISE(ABORT, 'reference link versions are append-only'); END`,
    `CREATE TRIGGER reference_link_versions_no_delete
     BEFORE DELETE ON reference_link_versions
     BEGIN SELECT RAISE(ABORT, 'reference link versions are append-only'); END`,
    "INSERT INTO accounts VALUES ('ACCOUNT-ADMIN-SYNTHETIC')",
  ])
    await db.prepare(statement).run();
  return { db, repository: createD1ReferenceLinkRepository(db) };
}

const createdAt = '2026-08-03T09:00:00.000Z';
const actorAccountId = 'ACCOUNT-ADMIN-SYNTHETIC';

function link(overrides = {}) {
  return {
    id: 'RLK-SYNTHETIC-001',
    label: 'Synthetic reference',
    url: 'https://example.edu/reference',
    linkType: 'EXTERNAL_URL',
    audience: 'PUBLIC',
    status: 'DRAFT',
    revision: 1,
    syncState: 'NOT_CONFIGURED',
    createdByAccountId: actorAccountId,
    updatedByAccountId: actorAccountId,
    createdAt,
    updatedAt: createdAt,
    archivedAt: null,
    ...overrides,
  };
}

function records(current, overrides = {}) {
  const revision = current.revision;
  const action = revision === 1 ? 'CREATED' : 'UPDATED';
  const correlationId = `COR-REFERENCE-${revision}`;
  const result = { ok: true, link: current, correlationId, replayed: false };
  return {
    version: {
      id: `RLV-SYNTHETIC-${revision}`,
      linkId: current.id,
      revision,
      before: revision === 1 ? null : { ...current, revision: revision - 1 },
      after: current,
      action,
      actorAccountId,
      reason: 'Record the synthetic canonical reference.',
      idempotencyKey: `reference-link-${revision}-0001`,
      correlationId,
      createdAt: current.updatedAt,
    },
    audit: {
      id: `AUD-SYNTHETIC-${revision}`,
      action: `REFERENCE_LINK_${action}`,
      entityId: current.id,
      actorAccountId,
      before: revision === 1 ? {} : { revision: revision - 1 },
      after: current,
      correlationId,
      createdAt: current.updatedAt,
    },
    idempotency: {
      scope: `reference-link:${actorAccountId}:${revision === 1 ? 'CREATE' : 'UPDATE'}`,
      key: `reference-link-${revision}-0001`,
      actorAccountId,
      requestFingerprint: `FINGERPRINT-${revision}`,
      result,
      createdAt: current.updatedAt,
    },
    ...overrides,
  };
}

describe('D1 Reference Link repository', () => {
  it('stores an approved internal target separately from an external URL', async () => {
    const { db, repository } = await context();
    const internal = link({
      id: 'RLK-SYNTHETIC-INTERNAL',
      url: 'request-center',
      linkType: 'INTERNAL_ROUTE',
    });
    await repository.create({ link: internal, ...records(internal) });

    await expect(repository.getById(internal.id)).resolves.toMatchObject({
      url: 'request-center',
      linkType: 'INTERNAL_ROUTE',
    });
    await expect(repository.list({ query: 'request-center' })).resolves.toMatchObject({
      items: [{ id: internal.id, url: 'request-center' }],
      total: 1,
    });
    const stored = await db
      .prepare('SELECT url, route_id FROM reference_links WHERE id = ?1')
      .bind(internal.id)
      .first();
    expect(stored).toEqual({ url: '', route_id: 'request-center' });
  });

  it('stores canonical state, append-only versions, audit, and replay in one mutation batch', async () => {
    const { db, repository } = await context();
    const initial = link();
    await repository.create({ link: initial, ...records(initial) });

    const next = link({
      label: 'Updated synthetic reference',
      status: 'ACTIVE',
      revision: 2,
      syncState: 'SYNC_PENDING',
      updatedAt: '2026-08-03T09:01:00.000Z',
    });
    await expect(
      repository.update({
        linkId: initial.id,
        expectedRevision: 1,
        next,
        ...records(next),
      }),
    ).resolves.toEqual({ updated: true });

    await expect(repository.getById(initial.id)).resolves.toMatchObject({
      label: next.label,
      status: 'ACTIVE',
      revision: 2,
      syncState: 'SYNC_PENDING',
    });
    await expect(
      repository.list({ query: 'updated', status: 'ACTIVE', audience: 'PUBLIC' }),
    ).resolves.toMatchObject({
      items: [{ id: initial.id, revision: 2 }],
      total: 1,
    });
    await expect(repository.listVersions({ linkId: initial.id })).resolves.toMatchObject({
      items: [
        { revision: 2, action: 'UPDATED' },
        { revision: 1, action: 'CREATED' },
      ],
      total: 2,
    });
    await expect(
      repository.getIdempotency(`reference-link:${actorAccountId}:UPDATE`, 'reference-link-2-0001'),
    ).resolves.toMatchObject({
      actorAccountId,
      requestFingerprint: 'FINGERPRINT-2',
      result: { ok: true, replayed: false },
    });
    const audits = await db.prepare('SELECT action FROM audit_log ORDER BY created_at').all();
    expect(audits.results.map(({ action }) => action)).toEqual([
      'REFERENCE_LINK_CREATED',
      'REFERENCE_LINK_UPDATED',
    ]);
  });

  it('fails before all dependent writes on a stale revision', async () => {
    const { db, repository } = await context();
    const initial = link();
    await repository.create({ link: initial, ...records(initial) });
    const next = link({ revision: 2, updatedAt: '2026-08-03T09:01:00.000Z' });
    await repository.update({
      linkId: initial.id,
      expectedRevision: 1,
      next,
      ...records(next),
    });

    const stale = link({
      label: 'Stale synthetic reference',
      revision: 2,
      updatedAt: '2026-08-03T09:02:00.000Z',
    });
    const staleRecords = records(stale, {
      version: { ...records(stale).version, id: 'RLV-STALE', idempotencyKey: 'reference-link-stale-0001' },
      audit: { ...records(stale).audit, id: 'AUD-STALE' },
      idempotency: {
        ...records(stale).idempotency,
        key: 'reference-link-stale-0001',
        requestFingerprint: 'FINGERPRINT-STALE',
      },
    });
    await expect(
      repository.update({
        linkId: initial.id,
        expectedRevision: 1,
        next: stale,
        ...staleRecords,
      }),
    ).resolves.toEqual({ updated: false });

    await expect(repository.getById(initial.id)).resolves.toMatchObject({
      label: next.label,
      revision: 2,
    });
    const counts = await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM reference_link_versions) AS versions,
           (SELECT COUNT(*) FROM audit_log) AS audits,
           (SELECT COUNT(*) FROM idempotency_keys) AS retries`,
      )
      .first();
    expect(counts).toMatchObject({ versions: 2, audits: 2, retries: 2 });
  });
});
