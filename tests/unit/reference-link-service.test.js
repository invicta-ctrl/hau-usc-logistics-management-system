import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '../../src/domain/constants.js';
import { ACCOUNT_STATUS } from '../../src/server/auth/contracts.js';
import {
  createReferenceLinkService,
  REFERENCE_LINK_AUDIENCES,
  REFERENCE_LINK_STATUSES,
  REFERENCE_LINK_SYNC_STATES,
  REFERENCE_LINK_TYPES,
} from '../../src/server/reference-link-service.js';

const actor = Object.freeze({
  id: 'ACCOUNT-ADMIN-SYNTHETIC',
  status: ACCOUNT_STATUS.ACTIVE,
  roleId: ROLES.ADMINISTRATOR,
  committeeIds: [],
});

function context({ syncConfigured = false, approvedInternalRoutes = ['ADMIN_HOME'] } = {}) {
  const links = new Map();
  const versions = [];
  const idempotency = new Map();
  let forceConflict = false;
  let sequence = 0;
  const repository = {
    list: vi.fn(async ({ query, status, audience, page, pageSize }) => {
      const matching = [...links.values()].filter(
        (link) =>
          (!query ||
            `${link.label} ${link.url} ${link.linkType}`.toLowerCase().includes(query.toLowerCase())) &&
          (!status || link.status === status) &&
          (!audience || link.audience === audience),
      );
      return {
        items: matching.slice((page - 1) * pageSize, page * pageSize),
        total: matching.length,
      };
    }),
    getById: vi.fn(async (id) => links.get(id) ?? null),
    listVersions: vi.fn(async ({ linkId, page, pageSize }) => {
      const matching = versions
        .filter((version) => version.linkId === linkId)
        .sort((left, right) => right.revision - left.revision);
      return {
        items: matching.slice((page - 1) * pageSize, page * pageSize),
        total: matching.length,
      };
    }),
    getIdempotency: vi.fn(async (scope, key) => idempotency.get(`${scope}:${key}`) ?? null),
    create: vi.fn(async ({ link, version, idempotency: replay }) => {
      links.set(link.id, link);
      versions.push(version);
      idempotency.set(`${replay.scope}:${replay.key}`, {
        actorAccountId: replay.actorAccountId,
        requestFingerprint: replay.requestFingerprint,
        result: replay.result,
      });
    }),
    update: vi.fn(async ({ next, version, idempotency: replay }) => {
      if (forceConflict) return { updated: false };
      links.set(next.id, next);
      versions.push(version);
      idempotency.set(`${replay.scope}:${replay.key}`, {
        actorAccountId: replay.actorAccountId,
        requestFingerprint: replay.requestFingerprint,
        result: replay.result,
      });
      return { updated: true };
    }),
  };
  const service = createReferenceLinkService({
    repository,
    approvedInternalRoutes,
    syncConfigured,
    clock: { now: () => Date.parse('2026-08-03T09:00:00.000Z') },
    createId: (prefix) => `${prefix}-SYNTHETIC-${++sequence}`,
  });
  return {
    service,
    repository,
    links,
    versions,
    setConflict(value) {
      forceConflict = value;
    },
  };
}

function externalCommand(overrides = {}) {
  return {
    label: 'USC public information',
    linkType: REFERENCE_LINK_TYPES.EXTERNAL_URL,
    url: 'https://example.edu/usc/information',
    audience: REFERENCE_LINK_AUDIENCES.PUBLIC,
    reason: 'Publish the approved synthetic reference.',
    clientRequestId: 'reference-link-create-0001',
    ...overrides,
  };
}

async function createDraft(service, overrides = {}) {
  return service.create({
    actor,
    command: externalCommand(overrides),
    correlationId: 'COR-REFERENCE-CREATE',
  });
}

describe('Reference Link service', () => {
  it('requires an active mapped reference manager before every repository operation', async () => {
    const { service, repository } = context();
    const inactive = { ...actor, status: ACCOUNT_STATUS.DISABLED };
    const director = { ...actor, roleId: ROLES.DIRECTOR };

    await expect(service.list({ actor: inactive })).rejects.toMatchObject({
      code: 'CAPABILITY_REQUIRED',
      status: 403,
    });
    await expect(service.list({ actor: director })).rejects.toMatchObject({
      code: 'CAPABILITY_REQUIRED',
      status: 403,
    });
    await expect(service.create({ actor: null, command: externalCommand() })).rejects.toMatchObject({
      code: 'CAPABILITY_REQUIRED',
      status: 403,
    });
    expect(repository.list).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('creates an audited draft with truthful unconfigured sync state and a safe response', async () => {
    const { service, repository, versions } = context();
    const result = await createDraft(service);

    expect(result).toMatchObject({
      ok: true,
      replayed: false,
      correlationId: 'COR-REFERENCE-CREATE',
      link: {
        label: 'USC public information',
        linkType: REFERENCE_LINK_TYPES.EXTERNAL_URL,
        audience: REFERENCE_LINK_AUDIENCES.PUBLIC,
        status: REFERENCE_LINK_STATUSES.DRAFT,
        revision: 1,
        syncState: REFERENCE_LINK_SYNC_STATES.NOT_CONFIGURED,
      },
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        version: expect.objectContaining({ action: 'CREATED', revision: 1 }),
        audit: expect.objectContaining({ action: 'REFERENCE_LINK_CREATED' }),
        idempotency: expect.objectContaining({
          actorAccountId: actor.id,
          result: expect.objectContaining({ replayed: false }),
        }),
      }),
    );
    expect(versions).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain(actor.id);
    expect(JSON.stringify(result)).not.toContain('requestFingerprint');
    expect(JSON.stringify(result)).not.toContain('Publish the approved synthetic reference.');
  });

  it('accepts only credential-free HTTPS targets or exact approved internal route IDs', async () => {
    const { service } = context();

    await expect(createDraft(service, { url: 'http://example.edu/reference' })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      details: { field: 'url' },
    });
    await expect(
      createDraft(service, { url: 'https://user:password@example.edu/reference' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details: { field: 'url' } });
    await expect(
      createDraft(service, {
        linkType: REFERENCE_LINK_TYPES.INTERNAL_ROUTE,
        url: '/app/admin',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details: { field: 'url' } });

    await expect(
      createDraft(service, {
        linkType: REFERENCE_LINK_TYPES.INTERNAL_ROUTE,
        url: 'ADMIN_HOME',
      }),
    ).resolves.toMatchObject({
      link: { linkType: REFERENCE_LINK_TYPES.INTERNAL_ROUTE, url: 'ADMIN_HOME' },
    });
  });

  it('accepts every locked audience and rejects values outside the controlled contract', async () => {
    const { service } = context();
    for (const [index, audience] of Object.values(REFERENCE_LINK_AUDIENCES).entries()) {
      await expect(
        createDraft(service, {
          audience,
          clientRequestId: `reference-link-audience-000${index + 1}`,
        }),
      ).resolves.toMatchObject({ link: { audience } });
    }
    await expect(
      createDraft(service, {
        audience: 'EVERYONE',
        clientRequestId: 'reference-link-audience-invalid',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details: { field: 'audience' } });
  });

  it('replays the same actor and operation safely and rejects a changed request fingerprint', async () => {
    const { service, repository } = context();
    const command = externalCommand();

    const first = await service.create({ actor, command, correlationId: 'COR-FIRST' });
    const replay = await service.create({ actor, command, correlationId: 'COR-RETRY' });

    expect(replay).toEqual({ ...first, replayed: true });
    expect(repository.create).toHaveBeenCalledTimes(1);

    const otherActor = { ...actor, id: 'ACCOUNT-OWNER-SYNTHETIC', roleId: ROLES.SYSTEM_OWNER };
    await expect(
      service.create({ actor: otherActor, command, correlationId: 'COR-OTHER-ACTOR' }),
    ).resolves.toMatchObject({ replayed: false });
    expect(repository.create).toHaveBeenCalledTimes(2);

    await expect(
      service.create({
        actor,
        command: { ...command, label: 'Different label' },
        correlationId: 'COR-CONFLICT',
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT', status: 409 });
    expect(repository.create).toHaveBeenCalledTimes(2);
  });

  it('supports full edits and explicit lifecycle transitions with revision concurrency', async () => {
    const { service, repository } = context({ syncConfigured: true });
    const created = await createDraft(service);
    const id = created.link.id;
    const updated = await service.update({
      actor,
      correlationId: 'COR-REFERENCE-UPDATE',
      command: {
        id,
        expectedRevision: 1,
        label: 'USC approved public information',
        linkType: REFERENCE_LINK_TYPES.EXTERNAL_URL,
        url: 'https://example.edu/usc/approved',
        audience: REFERENCE_LINK_AUDIENCES.STAFF,
        reason: 'Correct the approved synthetic reference.',
        clientRequestId: 'reference-link-update-0001',
      },
    });
    expect(updated.link).toMatchObject({
      revision: 2,
      status: REFERENCE_LINK_STATUSES.DRAFT,
      syncState: REFERENCE_LINK_SYNC_STATES.SYNC_PENDING,
    });

    const activated = await service.transition({
      actor,
      correlationId: 'COR-REFERENCE-ACTIVATE',
      command: {
        id,
        expectedRevision: 2,
        status: REFERENCE_LINK_STATUSES.ACTIVE,
        reason: 'Activate the approved synthetic reference.',
        clientRequestId: 'reference-link-activate-0001',
      },
    });
    expect(activated.link).toMatchObject({ status: REFERENCE_LINK_STATUSES.ACTIVE, revision: 3 });
    expect(repository.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        expectedRevision: 2,
        version: expect.objectContaining({ action: 'ACTIVATED', revision: 3 }),
      }),
    );

    const deactivated = await service.transition({
      actor,
      correlationId: 'COR-REFERENCE-DEACTIVATE',
      command: {
        id,
        expectedRevision: 3,
        status: REFERENCE_LINK_STATUSES.INACTIVE,
        reason: 'Pause the approved synthetic reference.',
        clientRequestId: 'reference-link-deactivate-0001',
      },
    });
    expect(deactivated.link).toMatchObject({
      status: REFERENCE_LINK_STATUSES.INACTIVE,
      revision: 4,
    });

    await expect(
      service.update({
        actor,
        command: {
          id,
          expectedRevision: 2,
          label: 'Stale update',
          linkType: REFERENCE_LINK_TYPES.EXTERNAL_URL,
          url: 'https://example.edu/stale',
          audience: REFERENCE_LINK_AUDIENCES.PUBLIC,
          reason: 'Exercise optimistic concurrency.',
          clientRequestId: 'reference-link-update-stale-0001',
        },
      }),
    ).rejects.toMatchObject({ code: 'REFERENCE_LINK_REVISION_CONFLICT', status: 409 });
  });

  it('treats archive as terminal and never restores through an ordinary transition or edit', async () => {
    const { service } = context();
    const created = await createDraft(service);
    const archived = await service.transition({
      actor,
      command: {
        id: created.link.id,
        expectedRevision: 1,
        status: REFERENCE_LINK_STATUSES.ARCHIVED,
        reason: 'Retire the synthetic reference without deleting history.',
        clientRequestId: 'reference-link-archive-0001',
      },
      correlationId: 'COR-REFERENCE-ARCHIVE',
    });
    expect(archived.link).toMatchObject({
      status: REFERENCE_LINK_STATUSES.ARCHIVED,
      revision: 2,
      archivedAt: '2026-08-03T09:00:00.000Z',
    });

    await expect(
      service.transition({
        actor,
        command: {
          id: created.link.id,
          expectedRevision: 2,
          status: REFERENCE_LINK_STATUSES.ACTIVE,
          reason: 'Attempt an unauthorized restore path.',
          clientRequestId: 'reference-link-restore-0001',
        },
      }),
    ).rejects.toMatchObject({ code: 'REFERENCE_LINK_TRANSITION_INVALID', status: 409 });
    await expect(
      service.update({
        actor,
        command: {
          id: created.link.id,
          expectedRevision: 2,
          label: 'Archived edit',
          linkType: REFERENCE_LINK_TYPES.EXTERNAL_URL,
          url: 'https://example.edu/archived',
          audience: REFERENCE_LINK_AUDIENCES.PUBLIC,
          reason: 'Attempt to edit archived content.',
          clientRequestId: 'reference-link-archived-edit-0001',
        },
      }),
    ).rejects.toMatchObject({ code: 'REFERENCE_LINK_ARCHIVED', status: 409 });
  });

  it('surfaces repository revision races without appending a successful service result', async () => {
    const { service, setConflict } = context();
    const created = await createDraft(service);
    setConflict(true);

    await expect(
      service.transition({
        actor,
        command: {
          id: created.link.id,
          expectedRevision: 1,
          status: REFERENCE_LINK_STATUSES.ACTIVE,
          reason: 'Exercise the repository race guard.',
          clientRequestId: 'reference-link-race-0001',
        },
      }),
    ).rejects.toMatchObject({ code: 'REFERENCE_LINK_REVISION_CONFLICT', status: 409 });
  });

  it('lists searchable records and append-only safe versions without actor or reason data', async () => {
    const { service } = context();
    const created = await createDraft(service);
    const listed = await service.list({
      actor,
      command: { query: 'public', status: 'DRAFT', audience: 'PUBLIC', page: 1, pageSize: 10 },
    });
    expect(listed).toMatchObject({ items: [{ id: created.link.id }], pagination: { total: 1 } });

    const history = await service.history({ actor, id: created.link.id });
    expect(history.items).toEqual([
      expect.objectContaining({
        revision: 1,
        action: 'CREATED',
        before: null,
        after: expect.objectContaining({ id: created.link.id }),
      }),
    ]);
    expect(JSON.stringify(history)).not.toContain(actor.id);
    expect(JSON.stringify(history)).not.toContain('Publish the approved synthetic reference.');
    expect(JSON.stringify(history)).not.toContain('idempotencyKey');
  });
});
