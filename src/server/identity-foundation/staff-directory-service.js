const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 50;
const MIN_PAGE_SIZE = 5;
const MAX_QUERY_LENGTH = 120;

const count = (value) => Math.max(0, Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0);
const text = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};

function positiveInteger(value, fallback) {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : fallback;
}

function listCommand(value = {}) {
  const page = positiveInteger(value.page, 1);
  const pageSize = Number.isInteger(value.pageSize)
    ? Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, value.pageSize))
    : DEFAULT_PAGE_SIZE;
  return {
    page,
    pageSize,
    query: String(value.query ?? '')
      .trim()
      .slice(0, MAX_QUERY_LENGTH)
      .trim(),
  };
}

function emailState(row) {
  if (count(row.quarantinedEmailCount)) return 'QUARANTINED';
  if (count(row.ambiguousEmailCount)) return 'AMBIGUOUS';
  if (count(row.activeVerifiedEmailCount)) return 'ACTIVE_VERIFIED';
  if (count(row.activeUnverifiedEmailCount)) return 'ACTIVE_UNVERIFIED';
  return 'NONE';
}

function linkState(row) {
  if (
    count(row.quarantinedLinkCount) ||
    count(row.quarantinedEmailCount) ||
    count(row.quarantinedAssignmentCount)
  ) {
    return 'QUARANTINED';
  }
  if (count(row.ambiguousEmailCount)) return 'AMBIGUOUS';
  if (count(row.activeLinkCount)) return 'ACTIVE';
  if (count(row.revokedLinkCount)) return 'REVOKED';
  return 'UNLINKED';
}

function directoryItem(row) {
  const personId = text(row?.personId);
  if (!personId) throw new TypeError('A canonical directory row requires a person ID.');
  const activeLinkCount = count(row.activeLinkCount);
  const resolvedLinkState = linkState(row);
  const displayName = text(row.activeDisplayName);
  const accessId = text(row.activeAccessId);
  const canExposeBusinessIdentity =
    resolvedLinkState === 'ACTIVE' && activeLinkCount === 1 && Boolean(displayName && accessId);
  return {
    personId,
    displayName: canExposeBusinessIdentity ? displayName : null,
    accessId: canExposeBusinessIdentity ? accessId : null,
    linkState: resolvedLinkState,
    linkedAccountCount: count(row.linkedAccountCount),
    emailState: emailState(row),
    assignmentSummary: {
      activeCount: count(row.activeAssignmentCount),
      historicalCount: count(row.historicalAssignmentCount),
      quarantinedCount: count(row.quarantinedAssignmentCount),
      provenanceState: count(row.assignmentProvenanceCount) ? 'PRESENT' : 'UNAVAILABLE',
    },
  };
}

export function createStaffDirectoryService({ repository } = {}) {
  if (!repository || typeof repository.listCanonicalDirectory !== 'function') {
    throw new TypeError('A canonical identity repository is required.');
  }
  return Object.freeze({
    async list(command) {
      const normalized = listCommand(command);
      const result = await repository.listCanonicalDirectory(normalized);
      return {
        ...normalized,
        total: count(result?.total),
        items: (Array.isArray(result?.items) ? result.items : []).map(directoryItem),
      };
    },
  });
}
