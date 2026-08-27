export function newestDeploymentsFirst(deployments) {
  if (!Array.isArray(deployments)) return [];
  return deployments
    .filter((deployment) => Number.isFinite(Date.parse(deployment?.created_on ?? '')))
    .sort(
      (left, right) =>
        Date.parse(right?.created_on ?? '') - Date.parse(left?.created_on ?? ''),
    );
}

export function latestDeploymentVersionId(deployments) {
  const candidates = newestDeploymentsFirst(deployments)
    .map((deployment) => ({
      createdAt: Date.parse(deployment?.created_on ?? ''),
      versionId: deployment?.versions?.[0]?.version_id,
    }))
    .filter(({ versionId }) => typeof versionId === 'string' && versionId.length > 0);
  return candidates[0]?.versionId ?? '';
}
