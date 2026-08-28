export const PERMANENT_BRANCHES = Object.freeze(['main', 'Playground']);

export const TEMPORARY_BRANCH_PATTERN =
  /^(?:(?:work|fix|reconcile)\/playground-[a-z0-9][a-z0-9-]*|(?:work|fix|hotfix)\/main-[a-z0-9][a-z0-9-]*)$/u;

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

export function temporaryBranchTarget(name) {
  if (!TEMPORARY_BRANCH_PATTERN.test(name)) return null;
  return name.includes('/playground-') ? 'Playground' : 'main';
}

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
    if (!branches.some((branch) => branch.name === required))
      issues.push(`Missing permanent branch: ${required}`);
  }

  for (const branch of active) {
    const expectedTarget = temporaryBranchTarget(branch.name);
    if (branch.targetBranch !== expectedTarget) {
      issues.push(`Temporary branch ${branch.name} must target exactly ${expectedTarget}`);
    }
  }

  if (active.length > 1 && active.some((branch) => branch.isolatedOrSequenced !== true)) {
    issues.push('Concurrent temporary branches require proven isolation or explicit sequencing');
  }
  if (forbidden.length) issues.push('A forbidden permanent environment/development branch exists');
  if (unclassified.length) issues.push('An unknown branch lacks an explicit preservation disposition');

  return { valid: issues.length === 0, issues, activeTemporaryBranches: active.map(({ name }) => name) };
}

export function validateLegacyBranchRetirement({
  name,
  head,
  tree,
  uniqueHistoryPreserved,
  liveDependenciesCleared,
  recoveryEvidenceVerified,
}) {
  if (PERMANENT_BRANCHES.includes(name)) throw new Error(`${name} is permanent and cannot be retired.`);
  if (!/^[0-9a-f]{40}$/u.test(head ?? '')) throw new Error('Legacy branch head identity is invalid.');
  if (!/^[0-9a-f]{40}$/u.test(tree ?? '')) throw new Error('Legacy branch tree identity is invalid.');
  if (uniqueHistoryPreserved !== true) throw new Error('Unique history preservation is incomplete.');
  if (liveDependenciesCleared !== true) throw new Error('Live branch-name dependencies remain.');
  if (recoveryEvidenceVerified !== true) throw new Error('Recovery evidence is not verified.');
  return Object.freeze({ name, head, tree, retirementEligible: true });
}
