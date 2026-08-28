import { ApiError } from './d1/operational-service.js';

export const PLAYGROUND_LABEL = 'ISOLATED_STAGING_PLAYGROUND';
export const PLAYGROUND_STATES = Object.freeze([
  'IDLE',
  'ACTIVE',
  'DIRTY',
  'RESETTING',
  'REFRESHING_BASELINE',
  'ERROR',
  'CLEAN',
]);

const SHORT_IDENTITY = /^[0-9a-f]{7,64}$/iu;
const RESET_CONSEQUENCES = Object.freeze([
  'Previous Playground sessions were invalidated.',
  'Transient D1 data was restored to the sealed clean baseline.',
  'Governed R2 working objects were reconciled to the clean baseline.',
  'A new Playground session is required.',
]);

function enabled(value) {
  return value === true || String(value ?? '').toLowerCase() === 'true';
}

export function isPlaygroundRuntime(env) {
  return (
    String(env?.ENVIRONMENT ?? '').toUpperCase() === 'STAGING' &&
    enabled(env?.PLAYGROUND_MODE) &&
    String(env?.PLAYGROUND_LABEL ?? '') === PLAYGROUND_LABEL
  );
}

export function playgroundRuntimeIssues(env) {
  if (!isPlaygroundRuntime(env)) return ['PLAYGROUND_RUNTIME_IDENTITY_INVALID'];
  const issues = [];
  if (!env?.DB || typeof env.DB.prepare !== 'function') issues.push('PLAYGROUND_D1_BINDING_MISSING');
  if (!env?.BRAND_ASSETS || typeof env.BRAND_ASSETS.put !== 'function') {
    issues.push('PLAYGROUND_WORKING_BRAND_R2_MISSING');
  }
  if (!env?.EVIDENCE_ASSETS || typeof env.EVIDENCE_ASSETS.put !== 'function') {
    issues.push('PLAYGROUND_WORKING_EVIDENCE_R2_MISSING');
  }
  for (const key of ['CANDIDATE_SHA', 'CANDIDATE_TREE_SHA', 'APPLICATION_ARTIFACT_HASH']) {
    if (!SHORT_IDENTITY.test(String(env?.[key] ?? ''))) issues.push(`${key}_INVALID`);
  }
  if (!/^v\d+\.\d+\.\d+$/u.test(String(env?.PRODUCTION_ACCEPTED_VERSION ?? ''))) {
    issues.push('PRODUCTION_ACCEPTED_VERSION_INVALID');
  }
  if (!/^[0-9a-f]{40}$/iu.test(String(env?.PRODUCTION_ACCEPTED_SHA ?? ''))) {
    issues.push('PRODUCTION_ACCEPTED_SHA_INVALID');
  }
  return issues;
}

function parseMetadata(row, fallback) {
  try {
    const parsed = JSON.parse(String(row?.value ?? ''));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function short(value) {
  return String(value ?? 'UNKNOWN').slice(0, 12);
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

async function metadata(db, key) {
  return db.prepare('SELECT value, updated_at FROM app_metadata WHERE key = ?').bind(key).first();
}

function assertPlayground(env) {
  const issues = playgroundRuntimeIssues(env);
  if (issues.length) {
    throw new ApiError(
      'PLAYGROUND_ENVIRONMENT_REFUSED',
      'The playground environment guard refused this action.',
      {
        status: 404,
        details: { issueCount: issues.length },
      },
    );
  }
}

export async function markPlaygroundModified(db) {
  const updatedAt = new Date().toISOString();
  const value = JSON.stringify({ state: 'DIRTY', activeTestSession: true, updatedAt });
  await db
    .prepare(
      `INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind('playground.working_state', value, updatedAt)
    .run();
}

export function createPlaygroundService(env) {
  assertPlayground(env);
  return Object.freeze({
    async status() {
      const [
        baselineRow,
        stateRow,
        baselineIdRow,
        baselineVersionRow,
        generationRow,
        receiptRow,
        pendingRow,
        schema,
        migration,
      ] = await Promise.all([
        metadata(env.DB, 'playground.clean_baseline'),
        metadata(env.DB, 'playground.working_state'),
        metadata(env.DB, 'playground.baseline_id'),
        metadata(env.DB, 'playground.baseline_version'),
        metadata(env.DB, 'playground.reset_generation'),
        metadata(env.DB, 'playground.last_reset_receipt'),
        metadata(env.DB, 'playground.pending_operation'),
        env.DB.prepare("SELECT value FROM app_metadata WHERE key = 'operational_schema_version'").first(),
        env.DB.prepare('SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1').first(),
      ]);
      const baseline = parseMetadata(baselineRow, {});
      const working = parseMetadata(stateRow, {
        state: 'ERROR',
        activeTestSession: false,
        updatedAt: stateRow?.updated_at ?? '',
      });
      const receipt = parseMetadata(receiptRow, {});
      const pending = parseMetadata(pendingRow, {});
      const workingState = PLAYGROUND_STATES.includes(String(working.state)) ? working.state : 'ERROR';
      const generation = nonNegativeInteger(generationRow?.value ?? working.resetGeneration);
      return {
        playground: true,
        label: 'Isolated Staging Playground',
        candidate: {
          version: String(env.APP_VERSION ?? '0.0.0'),
          commit: short(env.CANDIDATE_SHA),
          tree: short(env.CANDIDATE_TREE_SHA),
          artifact: short(env.APPLICATION_ARTIFACT_HASH),
        },
        production: {
          version: String(env.PRODUCTION_ACCEPTED_VERSION),
          identity: short(env.PRODUCTION_ACCEPTED_SHA),
          schema: String(env.PRODUCTION_SCHEMA_VERSION ?? baseline.schemaVersion ?? 'UNKNOWN'),
        },
        cleanBaseline: {
          sourceProductionVersion: baseline.sourceProductionVersion ?? 'UNKNOWN',
          sourceProductionIdentity: short(baseline.sourceProductionSha),
          capturedAt: baseline.capturedAt ?? '',
          schema: baseline.schemaVersion ?? 'UNKNOWN',
          latestMigration: baseline.latestMigration ?? '',
        },
        workingSchema: {
          version: String(schema?.value ?? 'UNKNOWN'),
          latestMigration: String(migration?.name ?? ''),
        },
        d1BaselineParity: baseline.d1BaselineParity ?? 'FAIL',
        r2BaselineParity: baseline.r2BaselineParity ?? 'FAIL',
        parityExceptions: Array.isArray(baseline.parityExceptions)
          ? baseline.parityExceptions.map(String)
          : [],
        workingState,
        activeTestSession: Boolean(working.activeTestSession),
        lastReset: working.lastReset ?? '',
        updatedAt: working.updatedAt ?? stateRow?.updated_at ?? '',
        resetCenter: {
          baselineId: String(baselineIdRow?.value ?? 'UNKNOWN'),
          baselineVersion: String(baselineVersionRow?.value ?? 'UNKNOWN'),
          generation,
          workingState,
          activeTestSession: Boolean(working.activeTestSession),
          resetAvailable: !['RESETTING', 'REFRESHING_BASELINE'].includes(workingState) && !pending.kind,
          confirmationPhrase: 'RESET PLAYGROUND',
          pendingOperation:
            pending.kind && pending.state
              ? {
                  kind: String(pending.kind),
                  state: String(pending.state),
                  requestedAt: String(pending.requestedAt ?? ''),
                }
              : null,
          lastReset:
            receipt.status && Number.isInteger(Number(receipt.generation))
              ? {
                  status: String(receipt.status),
                  generation: Number(receipt.generation),
                  completedAt: String(receipt.completedAt ?? ''),
                  oldSessionsInvalidated: nonNegativeInteger(receipt.oldSessionsInvalidated),
                  consequences: [...RESET_CONSEQUENCES],
                }
              : null,
        },
        moduleSwitcher: {
          enabled: true,
          modules: [
            ['overview', 'Overview'],
            ['requests', 'Requests'],
            ['lending', 'Lending'],
            ['release', 'Release Desk'],
            ['inventory', 'Inventory'],
            ['restocking', 'Restocking'],
            ['procurement', 'Procurement'],
            ['referenceAdmin', 'Administration'],
          ],
          realLoginPath: '/',
        },
      };
    },

    async requestOperation({ kind, confirmation, discardActiveSession = false, actorAccountId }) {
      const normalizedKind = String(kind ?? '').toUpperCase();
      const expected =
        normalizedKind === 'RESET'
          ? 'RESET PLAYGROUND'
          : normalizedKind === 'REFRESH_BASELINE'
            ? 'REFRESH BASELINE FROM PRODUCTION'
            : '';
      if (!expected || confirmation !== expected) {
        throw new ApiError(
          'PLAYGROUND_CONFIRMATION_REQUIRED',
          `Type ${expected || 'the required phrase'} exactly.`,
          {
            status: 400,
          },
        );
      }
      const [stateRow, pendingRow] = await Promise.all([
        metadata(env.DB, 'playground.working_state'),
        metadata(env.DB, 'playground.pending_operation'),
      ]);
      const current = parseMetadata(stateRow, { state: 'ERROR', activeTestSession: false });
      const pending = parseMetadata(pendingRow, {});
      if (
        ['RESETTING', 'REFRESHING_BASELINE'].includes(current.state) ||
        ['RESET', 'REFRESH_BASELINE'].includes(pending.kind)
      ) {
        throw new ApiError(
          'PLAYGROUND_OPERATION_IN_PROGRESS',
          'A Playground reset or baseline refresh is already in progress.',
          { status: 409 },
        );
      }
      if (
        normalizedKind === 'REFRESH_BASELINE' &&
        (current.activeTestSession || ['ACTIVE', 'DIRTY'].includes(current.state)) &&
        discardActiveSession !== true
      ) {
        throw new ApiError(
          'PLAYGROUND_ACTIVE_SESSION_PROTECTED',
          'The active playground test session must be explicitly discarded before baseline refresh.',
          { status: 409 },
        );
      }
      const requestedAt = new Date().toISOString();
      const operationReference = `PGOP-${crypto.randomUUID()}`;
      const operation = {
        operationReference,
        kind: normalizedKind,
        state: 'REQUESTED',
        requestedAt,
        requestedByAccountId: actorAccountId,
        discardActiveSession: normalizedKind === 'REFRESH_BASELINE' && discardActiveSession === true,
      };
      const workingState = {
        state: normalizedKind === 'RESET' ? 'RESETTING' : 'REFRESHING_BASELINE',
        activeTestSession: Boolean(current.activeTestSession),
        operationReference,
        updatedAt: requestedAt,
      };
      const statement = env.DB.prepare(
        `INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      );
      await env.DB.batch([
        statement.bind('playground.pending_operation', JSON.stringify(operation), requestedAt),
        statement.bind('playground.working_state', JSON.stringify(workingState), requestedAt),
      ]);
      return { accepted: true, operationReference, state: workingState.state };
    },
  });
}
