import type { FrontendProfile, RequesterPortal } from '../../integration/backend';
import type { Session } from '../../app/appTypes';

/** Sanitized local session for inspection routes. It is not a backend credential. */
export const LOCAL_PREVIEW_SESSION: Session = Object.freeze({
  authenticated: true,
  displayName: 'Preview Operator',
  role: 'DOL_PREVIEW',
  initials: 'PO',
  capabilities: [
    'overview',
    'inventory',
    'request-center',
    'lending',
    'release',
    'restocking',
    'procurement',
    'events',
    'administration',
    'profile',
  ],
  requesterEligible: false,
  internalOperator: true,
  canReviewRequests: true,
  canApproveLending: true,
  canHandoffLending: true,
  canReturnLending: true,
  canUploadLendingEvidence: true,
});

/** Deterministic, local presentation data. It never calls a protected endpoint. */
export const PREVIEW_PROFILE: FrontendProfile = Object.freeze({
  displayName: 'Preview Operator',
  legalName: 'Preview Operator',
  verifiedEmail: 'preview.operator@local.invalid',
  username: 'preview-operator',
  contactNumber: 'Not available in preview',
  affiliation: {
    institutionId: 'HAU-USC',
    departmentId: 'DOL-PREVIEW',
    departmentDisplayName: 'Department of Logistics · Preview',
    courseId: 'Not available in preview',
    yearLevel: 'Not available in preview',
  },
  roleId: 'DOL_PREVIEW',
  committeeIds: [],
  accountCode: 'PREVIEW-ONLY',
  accessSummary: {
    roleId: 'DOL_PREVIEW',
    roleLabel: 'DOL Preview',
    committeeIds: [],
    capabilities: ['PREVIEW_PRESENTATION_ONLY'],
    workspaceIds: ['LOCAL-4173'],
    defaultWorkspaceId: 'LOCAL-4173',
    scopeMode: 'Inspection only',
  },
  revision: 'preview-fixture-v1',
  credentialVersion: 0,
  updatedAt: 'Not recorded',
  avatar: { available: false, initials: 'PO', fallback: 'INITIALS', url: '', updatedAt: '' },
  appearance: { family: 'HAU_INSTITUTIONAL', mode: 'SYSTEM' },
});

/** Same frontend shape as the real requester portal, with local fixture values only. */
export const PREVIEW_REQUESTER_PORTAL: RequesterPortal = Object.freeze({
  profile: { displayName: 'Preview Requester', departmentId: 'USC-PREVIEW' },
  eventSeries: [{ id: 'preview-series', code: 'PREVIEW', name: 'Preview inspection' }],
  events: [
    {
      id: 'preview-event',
      seriesId: 'preview-series',
      name: 'Preview event',
      activityType: 'Inspection',
      startsAt: 'Not scheduled',
      endsAt: 'Not scheduled',
      venue: 'Inspection venue',
    },
  ],
  choices: { 'Office supplies': ['Paper', 'Pens'] },
  units: ['piece'],
  requests: [
    {
      id: 'PREVIEW-REQUEST-001',
      requestType: 'NEW',
      parentRequestId: '',
      eventSeriesId: 'preview-series',
      eventId: 'preview-event',
      event: 'Preview event',
      subEvent: '',
      department: 'USC-PREVIEW',
      purpose: 'Sample request for interface inspection',
      status: 'FOR_REVIEW',
      createdAt: 'Not recorded',
      updatedAt: 'Not recorded',
      lines: [
        {
          description: 'Preview paper',
          specification: '',
          category: 'Office supplies',
          quantity: 1,
          unit: 'piece',
          status: 'FOR_REVIEW',
        },
      ],
      history: [{ status: 'FOR_REVIEW', at: 'Not recorded' }],
    },
  ],
});
