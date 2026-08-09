export const PERMANENT_BRANCHES = Object.freeze([
  'main',
  'backup/last-known-good',
  'regression/r1',
  'regression/r2',
  'regression/r3',
]);

export const TEMPORARY_BRANCH_PATTERN = /^(?:release|fix|hotfix)\/v\d+\.\d+\.\d+-[a-z0-9][a-z0-9-]*$/u;
export const FORBIDDEN_PERMANENT_BRANCHES = new Set([
  'staging',
  'playground',
  'production',
  'prod',
  'develop',
  'dev',
  'working',
  'next',
]);

export function classifyBranch(name, { mergedOrClosed = false, dispositionedLegacy = false } = {}) {
  if (PERMANENT_BRANCHES.includes(name)) return 'PERMANENT_RETAINED';
  if (FORBIDDEN_PERMANENT_BRANCHES.has(name)) return 'FORBIDDEN_PERMANENT_NAME';
  if (TEMPORARY_BRANCH_PATTERN.test(name)) return mergedOrClosed ? 'CLOSED_TEMPORARY' : 'ACTIVE_TEMPORARY';
  return dispositionedLegacy ? 'PRESERVED_LEGACY' : 'UNCLASSIFIED';
}

export function validateBranchTopology(branches) {
  const issues = [];
  const active = branches.filter((branch) => classifyBranch(branch.name, branch) === 'ACTIVE_TEMPORARY');
  const forbidden = branches.filter(
    (branch) => classifyBranch(branch.name, branch) === 'FORBIDDEN_PERMANENT_NAME',
  );
  const unclassified = branches.filter((branch) => classifyBranch(branch.name, branch) === 'UNCLASSIFIED');
  for (const required of PERMANENT_BRANCHES) {
    if (!branches.some((branch) => branch.name === required)) issues.push(`Missing permanent pointer: ${required}`);
  }
  if (active.length > 1) issues.push('More than one production-bound temporary branch is active');
  if (forbidden.length) issues.push('A forbidden permanent environment/development branch exists');
  if (unclassified.length) issues.push('An unknown branch lacks an explicit preservation disposition');
  return { valid: issues.length === 0, issues, activeTemporaryBranches: active.map(({ name }) => name) };
}

export function recoveryPointerRotation(current, { newAcceptedMain, productionAccepted }) {
  if (productionAccepted !== true) {
    throw new Error('Recovery pointer rotation is forbidden before production smoke and reconciliation acceptance.');
  }
  for (const key of ['main', 'backup/last-known-good', 'regression/r1', 'regression/r2']) {
    if (!/^[0-9a-f]{40}$/u.test(current?.[key] ?? '')) throw new Error(`Current ${key} identity is invalid.`);
  }
  if (!/^[0-9a-f]{40}$/u.test(newAcceptedMain ?? '')) throw new Error('New accepted main identity is invalid.');
  return Object.freeze({
    main: newAcceptedMain,
    'backup/last-known-good': current.main,
    'regression/r1': current['backup/last-known-good'],
    'regression/r2': current['regression/r1'],
    'regression/r3': current['regression/r2'],
  });
}
