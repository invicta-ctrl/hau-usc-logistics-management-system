import { describe, expect, it } from 'vitest';
import { createAdvertisementAdminService } from '../../src/server/advertisement-admin-service.js';
import { createPublicAdvertisementService } from '../../src/server/public-advertisement-service.js';

const ADMIN = { id: 'ACCOUNT-ADMIN', roleId: 'ADMINISTRATOR' };
const NOW = '2026-08-03T00:00:00.000Z';

function row(overrides = {}) {
  return {
    id: 'ADV-ONE',
    title: 'Announcement',
    description: 'Description',
    alt_text: 'Announcement image',
    call_to_action: 'Read more',
    destination_url: 'https://example.com/announcement',
    status: 'DRAFT',
    display_order: 1,
    publish_at: null,
    expire_at: null,
    audience: 'PUBLIC',
    revision: 1,
    image_asset_key: '',
    created_by: ADMIN.id,
    updated_by: ADMIN.id,
    created_at: NOW,
    updated_at: NOW,
    archived_at: null,
    ...overrides,
  };
}

class FakeDatabase {
  constructor(rows = []) {
    this.rows = new Map(rows.map((record) => [record.id, { ...record }]));
    this.mutations = new Map();
    this.audit = [];
    this.batchCalls = [];
    this.prepareCalls = [];
    this.forceZeroUpdate = false;
  }

  prepare(sql) {
    this.prepareCalls.push(String(sql));
    const statement = {
      sql: String(sql),
      values: [],
      bind: (...values) => {
        statement.values = values;
        return statement;
      },
      first: async () => this.first(statement),
      all: async () => this.all(statement),
    };
    return statement;
  }

  async first(statement) {
    const { sql, values } = statement;
    if (sql.includes('FROM advertisement_mutation_results')) {
      return this.mutations.get(`${values[0]}|${values[1]}|${values[2]}`) ?? null;
    }
    if (sql.includes('COUNT(*)')) {
      return { count: this.rows.size };
    }
    if (sql.includes('FROM public_advertisements')) {
      return this.rows.get(values[0]) ?? null;
    }
    return null;
  }

  async all(statement) {
    const { sql, values } = statement;
    if (!sql.includes('FROM public_advertisements')) return { results: [] };
    let valuesRows = [...this.rows.values()];
    if (sql.includes('audience = ?1'))
      valuesRows = valuesRows.filter((record) => record.audience === values[0]);
    if (sql.includes("status = 'ACTIVE'"))
      valuesRows = valuesRows.filter((record) => record.status === 'ACTIVE');
    return { results: valuesRows };
  }

  async batch(statements) {
    this.batchCalls.push(statements);
    return statements.map((statement) => this.execute(statement));
  }

  execute(statement) {
    const { sql, values } = statement;
    if (sql.includes('UPDATE public_advertisements')) return this.update(values, sql);
    if (sql.includes('INSERT INTO public_advertisements')) {
      const record = row({
        id: values[0],
        title: values[1],
        description: values[2],
        alt_text: values[3],
        call_to_action: values[4],
        destination_url: values[5],
        status: values[6],
        display_order: values[7],
        publish_at: values[8],
        expire_at: values[9],
        audience: values[10],
        revision: 1,
        created_by: values[11],
        updated_by: values[11],
        created_at: values[12],
        updated_at: values[12],
      });
      this.rows.set(record.id, record);
      return { meta: { changes: 1 } };
    }
    if (sql.includes('INSERT INTO advertisement_mutation_results')) {
      this.mutations.set(`${values[0]}|${values[1]}|${values[2]}`, {
        request_hash: values[3],
        result_json: values[4],
      });
      return { meta: { changes: 1 } };
    }
    if (sql.includes('INSERT INTO audit_log')) {
      this.audit.push({ action: values[2], after: JSON.parse(values[5]) });
      return { meta: { changes: 1 } };
    }
    return { meta: { changes: 1 } };
  }

  update(values, sql) {
    const record = this.rows.get(values[0]);
    const revision = sql.includes('revision = ?') ? values[values.length - 1] : undefined;
    if (
      !record ||
      (revision !== undefined && Number(record.revision) !== Number(revision)) ||
      this.forceZeroUpdate
    ) {
      return { meta: { changes: 0 } };
    }
    if (sql.includes("status = 'ARCHIVED'")) {
      record.status = 'ARCHIVED';
      record.archived_at = values[1];
      record.updated_at = values[1];
      record.updated_by = values[2];
    } else if (sql.includes('image_asset_key = ?2')) {
      record.image_asset_key = values[1];
      record.updated_by = values[2];
      record.updated_at = values[3];
    } else if (sql.includes('SET status = ?2')) {
      record.status = values[1];
      record.publish_at = values[2];
      record.expire_at = values[3];
      record.updated_by = values[4];
      record.updated_at = values[5];
    } else {
      record.title = values[1];
      record.description = values[2];
      record.alt_text = values[3];
      record.call_to_action = values[4];
      record.destination_url = values[5];
      record.status = values[6];
      record.display_order = values[7];
      record.publish_at = values[8];
      record.expire_at = values[9];
      if (sql.includes('audience = ?11')) record.audience = values[10];
      record.updated_by = values[sql.includes('audience = ?11') ? 11 : 10];
      record.updated_at = values[sql.includes('audience = ?11') ? 12 : 11];
    }
    if (sql.includes('revision = revision + 1')) record.revision = Number(record.revision) + 1;
    this.rows.set(record.id, record);
    return { meta: { changes: 1 } };
  }
}

class FakeBucket {
  constructor() {
    this.objects = new Map();
    this.deleteFailure = false;
  }

  async put(key, value) {
    this.objects.set(key, value);
  }

  async delete(key) {
    if (this.deleteFailure) throw new Error('synthetic cleanup failure');
    this.objects.delete(key);
  }

  async get(key) {
    const body = this.objects.get(key);
    if (!body) return null;
    return {
      body,
      httpEtag: 'synthetic-etag',
      writeHttpMetadata(headers) {
        headers.set('content-type', 'image/png');
      },
    };
  }
}

function adminService(db, bucket = new FakeBucket()) {
  return createAdvertisementAdminService({
    db,
    bucket,
    clock: { now: () => NOW },
  });
}

function command(overrides = {}) {
  return {
    id: 'ADV-ONE',
    title: 'Announcement',
    description: 'Description',
    altText: 'Announcement image',
    callToAction: 'Read more',
    destinationUrl: 'https://example.com/announcement',
    displayOrder: 1,
    status: 'DRAFT',
    clientRequestId: `request-${Math.random()}`,
    ...overrides,
  };
}

const pngBase64 = btoa(
  String.fromCharCode(
    ...new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(40).fill(0)]),
  ),
);

describe('v0.7.2 advertisement contracts', () => {
  it.each([2.02, 2.03, 0.06, '1e2', ' 1 ', { valueOf: () => 1 }])(
    'rejects non-canonical displayOrder %p',
    async (displayOrder) => {
      const service = adminService(new FakeDatabase());
      await expect(
        service.save({ account: ADMIN, command: command({ displayOrder }) }),
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        details: { field: 'displayOrder' },
      });
    },
  );

  it('requires a matching revision and proves a stale guarded update changed no rows', async () => {
    const db = new FakeDatabase([row()]);
    const service = adminService(db);
    await expect(
      service.save({ account: ADMIN, command: command({ expectedRevision: 2 }) }),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT', status: 409 });
    db.forceZeroUpdate = true;
    await expect(
      service.save({ account: ADMIN, command: command({ expectedRevision: 1, clientRequestId: 'race' }) }),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT', status: 409 });
    expect(db.batchCalls.at(-1)).toHaveLength(1);
  });

  it('does not restore or mutate archived announcements', async () => {
    const db = new FakeDatabase([row({ status: 'ARCHIVED', archived_at: NOW })]);
    const service = adminService(db);
    await expect(
      service.save({ account: ADMIN, command: command({ expectedRevision: 1 }) }),
    ).rejects.toMatchObject({ code: 'ADVERTISEMENT_ARCHIVED', status: 409 });
    await expect(
      service.archive({
        account: ADMIN,
        command: { id: 'ADV-ONE', expectedRevision: 1, clientRequestId: 'archive' },
      }),
    ).rejects.toMatchObject({ code: 'ADVERTISEMENT_ARCHIVED', status: 409 });
  });

  it('supports preview, schedule, publish, and pause lifecycle transitions', async () => {
    const db = new FakeDatabase([row({ image_asset_key: 'advertisements/one.png' })]);
    const service = adminService(db);
    await expect(service.preview({ account: ADMIN, command: { id: 'ADV-ONE' } })).resolves.toMatchObject({
      item: { preview: true, audience: 'PUBLIC', revision: 1 },
    });
    await expect(
      service.schedule({
        account: ADMIN,
        command: {
          id: 'ADV-ONE',
          publishAt: '2026-08-04T00:00:00.000Z',
          expectedRevision: 1,
          clientRequestId: 'schedule',
        },
      }),
    ).resolves.toMatchObject({ status: 'ACTIVE', revision: 2, publishAt: '2026-08-04T00:00:00.000Z' });
    await expect(
      service.pause({
        account: ADMIN,
        command: { id: 'ADV-ONE', expectedRevision: 2, clientRequestId: 'pause' },
      }),
    ).resolves.toMatchObject({ status: 'INACTIVE', revision: 3 });
    await expect(
      service.publish({
        account: ADMIN,
        command: { id: 'ADV-ONE', expectedRevision: 3, clientRequestId: 'publish' },
      }),
    ).resolves.toMatchObject({ status: 'ACTIVE', revision: 4 });
    await expect(
      service.schedule({
        account: ADMIN,
        command: {
          id: 'ADV-ONE',
          publishAt: NOW,
          expectedRevision: 4,
          clientRequestId: 'schedule-past',
        },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details: { field: 'publishAt' } });
  });

  it('resumes only an inactive announcement with its own guarded idempotency operation', async () => {
    const db = new FakeDatabase([row({ status: 'ACTIVE', image_asset_key: 'advertisements/one.png' })]);
    const service = adminService(db);
    await expect(
      service.pause({
        account: ADMIN,
        command: { id: 'ADV-ONE', expectedRevision: 1, clientRequestId: 'pause-before-resume' },
      }),
    ).resolves.toMatchObject({ status: 'INACTIVE', revision: 2 });
    await expect(
      service.resume({
        account: ADMIN,
        command: { id: 'ADV-ONE', expectedRevision: 2, clientRequestId: 'resume' },
      }),
    ).resolves.toMatchObject({ status: 'ACTIVE', revision: 3 });
    await expect(
      service.resume({
        account: ADMIN,
        command: { id: 'ADV-ONE', expectedRevision: 3, clientRequestId: 'resume-again' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION', status: 409 });
    const draftDb = new FakeDatabase([row({ status: 'DRAFT', image_asset_key: 'advertisements/one.png' })]);
    await expect(
      adminService(draftDb).resume({
        account: ADMIN,
        command: { id: 'ADV-ONE', expectedRevision: 1, clientRequestId: 'resume-draft' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION', status: 409 });
  });

  it('keeps idempotency replays stable and rejects key reuse with different values', async () => {
    const db = new FakeDatabase();
    const service = adminService(db);
    const first = await service.save({ account: ADMIN, command: command({ clientRequestId: 'same-key' }) });
    await expect(
      service.save({ account: ADMIN, command: command({ clientRequestId: 'same-key' }) }),
    ).resolves.toMatchObject({
      replayed: true,
      id: first.id,
    });
    await expect(
      service.save({ account: ADMIN, command: command({ clientRequestId: 'same-key', title: 'Changed' }) }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT', status: 409 });
  });

  it('reports cleanup pending after canonical upload succeeds', async () => {
    const db = new FakeDatabase([row({ image_asset_key: 'advertisements/old.png' })]);
    const bucket = new FakeBucket();
    bucket.deleteFailure = true;
    const service = adminService(db, bucket);
    await expect(
      service.upload({
        account: ADMIN,
        command: {
          id: 'ADV-ONE',
          expectedRevision: 1,
          clientRequestId: 'upload',
          contentType: 'image/png',
          base64: pngBase64,
        },
      }),
    ).resolves.toMatchObject({ cleanupPending: true, revision: 2 });
  });

  it('filters public audience in SQL and hides provider keys', async () => {
    const db = new FakeDatabase([
      row({ id: 'ADV-PUBLIC', audience: 'PUBLIC', status: 'ACTIVE' }),
      row({ id: 'ADV-REQUEST', audience: 'REQUEST', status: 'ACTIVE' }),
    ]);
    const bucket = new FakeBucket();
    const service = createPublicAdvertisementService({ db, bucket, clock: { now: () => NOW } });
    await expect(service.list()).resolves.toMatchObject({
      audience: 'PUBLIC',
      items: [expect.objectContaining({ audience: 'PUBLIC', revision: 1 })],
    });
    expect(db.batchCalls).toHaveLength(0);
    await expect(service.list({ audience: 'REQUEST' })).resolves.toMatchObject({ audience: 'REQUEST' });
    await expect(service.list({ audience: 'STAFF' })).rejects.toMatchObject({
      code: 'ADVERTISEMENT_NOT_FOUND',
    });
    expect(db.prepareCalls.some((sql) => sql.includes('audience = ?1'))).toBe(true);
  });
});
