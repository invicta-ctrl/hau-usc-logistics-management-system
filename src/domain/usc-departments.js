export const USC_DEPARTMENT_REGISTRY = Object.freeze([
  Object.freeze({
    id: 'USC-DEPT-DOL',
    code: 'DOL',
    displayName: 'Department of Logistics',
    recommendedAccessId: 'DOL_2026',
    accountId: 'ACC-USC-DEPT-DOL',
  }),
  Object.freeze({
    id: 'USC-DEPT-DOF',
    code: 'DOF',
    displayName: 'Department of Finance',
    recommendedAccessId: 'DOF_2026',
    accountId: 'ACC-USC-DEPT-DOF',
  }),
  Object.freeze({
    id: 'USC-DEPT-DPC',
    code: 'DPC',
    displayName: 'Department of Public Communications',
    recommendedAccessId: 'DPC_2026',
    accountId: 'ACC-USC-DEPT-DPC',
  }),
  Object.freeze({
    id: 'USC-DEPT-DEM',
    code: 'DEM',
    displayName: 'Department of Events Management',
    recommendedAccessId: 'DEM_2026',
    accountId: 'ACC-USC-DEPT-DEM',
  }),
  Object.freeze({
    id: 'USC-DEPT-DBR',
    code: 'DBR',
    displayName: 'Department of Business Relations',
    recommendedAccessId: 'DBR_2026',
    accountId: 'ACC-USC-DEPT-DBR',
  }),
  Object.freeze({
    id: 'USC-DEPT-OP',
    code: 'OP',
    displayName: 'Office of the President',
    recommendedAccessId: 'OP_2026',
    accountId: 'ACC-USC-DEPT-OP',
  }),
  Object.freeze({
    id: 'USC-DEPT-OVP',
    code: 'OVP',
    displayName: 'Office of the Vice President',
    recommendedAccessId: 'OVP_2026',
    accountId: 'ACC-USC-DEPT-OVP',
  }),
  Object.freeze({
    id: 'USC-DEPT-OSG',
    code: 'OSG',
    displayName: 'Office of the Secretary General',
    recommendedAccessId: 'OSG_2026',
    accountId: 'ACC-USC-DEPT-OSG',
  }),
  Object.freeze({
    id: 'USC-DEPT-DHR',
    code: 'DHR',
    displayName: 'Department of Human Resources',
    recommendedAccessId: 'DHR_2026',
    accountId: 'ACC-USC-DEPT-DHR',
  }),
  Object.freeze({
    id: 'USC-DEPT-DCES',
    code: 'DCES',
    displayName: 'Department of Community Extensions Services',
    recommendedAccessId: 'DCES_2026',
    accountId: 'ACC-USC-DEPT-DCES',
  }),
]);

export const USC_DEPARTMENT_NAMES = Object.freeze(
  USC_DEPARTMENT_REGISTRY.map((department) => department.displayName),
);

export function uscDepartmentById(value) {
  const id = String(value ?? '').trim().toUpperCase();
  return USC_DEPARTMENT_REGISTRY.find((department) => department.id === id);
}

