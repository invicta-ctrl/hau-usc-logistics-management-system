import { describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createAdminParityController } from '../../src/v5/integration/admin-parity.js';

function backendStub() {
  return {
    auth: {
      activate: vi.fn().mockResolvedValue({ ok: true }),
      request: vi.fn().mockResolvedValue({ ok: true }),
      startAccountApplicationEmail: vi.fn().mockResolvedValue({ ok: true }),
      confirmAccountApplicationEmail: vi.fn().mockResolvedValue({ ok: true }),
      submitAccountApplication: vi.fn().mockResolvedValue({ ok: true }),
      getAccountApplicationStatus: vi.fn().mockResolvedValue({ ok: true }),
      withdrawAccountApplication: vi.fn().mockResolvedValue({ ok: true }),
      listAccountApplications: vi.fn().mockResolvedValue({ ok: true }),
      getAccountApplicationForReview: vi.fn().mockResolvedValue({ ok: true }),
      decideAccountApplication: vi.fn().mockResolvedValue({ ok: true }),
      overrideAccountApplication: vi.fn().mockResolvedValue({ ok: true }),
      updateProfileContact: vi.fn().mockResolvedValue({ ok: true }),
      changeProfileUsername: vi.fn().mockResolvedValue({ ok: true }),
      changeProfilePassword: vi.fn().mockResolvedValue({ ok: true }),
      requestProfileIdentityCorrection: vi.fn().mockResolvedValue({ ok: true }),
    },
    api: new Proxy({}, { get: (target, key) => (target[key] ??= vi.fn().mockResolvedValue({ ok: true })) }),
    commands: new Proxy(
      {},
      { get: (target, key) => (target[key] ??= vi.fn().mockResolvedValue({ ok: true })) },
    ),
    health: vi.fn().mockResolvedValue({ ok: true }),
    readiness: vi.fn().mockResolvedValue({ ok: true }),
    version: vi.fn().mockResolvedValue({ ok: true }),
  };
}

function form(action, values) {
  const status = { textContent: '' };
  const button = { disabled: false };
  const elements = Object.entries(values).map(([name, value]) => ({
    name,
    value: typeof value === 'boolean' ? '' : String(value),
    checked: value === true,
    disabled: false,
    type: typeof value === 'boolean' ? 'checkbox' : 'text',
  }));
  return {
    dataset: { v5AdminForm: action },
    elements,
    reportValidity: () => true,
    querySelector(selector) {
      if (selector === '[type="submit"]') return button;
      if (selector.startsWith('[data-v5-admin-status=')) return status;
      return null;
    },
    status,
    button,
  };
}

function submit(controller, target) {
  const event = {
    target,
    preventDefault: vi.fn(),
    stopImmediatePropagation: vi.fn(),
  };
  expect(controller.onSubmit(event)).toBe(true);
  return event;
}

async function completed(spy) {
  await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
}

function controllerFor(backend, integration = { session: { csrfToken: 'csrf-exact' } }) {
  return createAdminParityController({
    backend,
    getIntegration: () => integration,
    getCapabilities: () => [],
    refresh: vi.fn().mockResolvedValue(undefined),
    toast: vi.fn(),
  });
}

describe('V5 admin and public parity controller', () => {
  it('submits the exact starter activation profile and fails closed without activation CSRF', async () => {
    const backend = backendStub();
    const active = controllerFor(backend, { activationCsrfToken: 'csrf-activation' });
    submit(
      active,
      form('auth-activate', {
        fullName: 'Authorized Tester',
        mobileNumber: '+639171234567',
        email: 'authorized@example.test',
        password: 'correct horse battery staple',
        confirmPassword: 'correct horse battery staple',
      }),
    );
    await completed(backend.auth.activate);
    expect(backend.auth.activate).toHaveBeenCalledWith({
      profile: {
        fullName: 'Authorized Tester',
        mobileNumber: '+639171234567',
        email: 'authorized@example.test',
      },
      password: 'correct horse battery staple',
      confirmPassword: 'correct horse battery staple',
      csrfToken: 'csrf-activation',
    });

    const blockedBackend = backendStub();
    submit(
      controllerFor(blockedBackend, {}),
      form('auth-activate', {
        fullName: 'Authorized Tester',
        mobileNumber: '+639171234567',
        email: 'authorized@example.test',
        password: 'not-sent',
        confirmPassword: 'not-sent',
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(blockedBackend.auth.activate).not.toHaveBeenCalled();
  });

  it('sends the complete verified public application contract without inventing identifiers', async () => {
    const backend = backendStub();
    const controller = controllerFor(backend);
    submit(
      controller,
      form('application-submit', {
        operation: 'SUBMIT',
        clientRequestId: 'retry-owner-supplied-01',
        verificationReceipt: 'opaque-verification-receipt',
        legalName: 'Authorized Tester',
        contactNumber: '+639171234567',
        departmentId: 'DEPT-EXACT',
        courseId: 'COURSE-EXACT',
        yearLevel: '3',
        requestedUsername: 'authorized.tester',
        requestedAccountType: 'STAFF',
        requestedRoleId: 'DOL_STAFF',
        requestedCommitteeIds: 'COM_FOOD, COM_MATERIALS',
        requestedWorkspaceIds: 'food, materials',
        requestCenterAccess: true,
        lendingSelfService: false,
        internalLendingOperations: true,
        password: 'correct horse battery staple',
        confirmPassword: 'correct horse battery staple',
      }),
    );
    await completed(backend.auth.submitAccountApplication);
    expect(backend.auth.submitAccountApplication).toHaveBeenCalledWith({
      clientRequestId: 'retry-owner-supplied-01',
      verificationReceipt: 'opaque-verification-receipt',
      legalName: 'Authorized Tester',
      contactNumber: '+639171234567',
      departmentId: 'DEPT-EXACT',
      courseId: 'COURSE-EXACT',
      yearLevel: 3,
      requestedUsername: 'authorized.tester',
      requestedAccountType: 'STAFF',
      requestedRoleId: 'DOL_STAFF',
      requestedCommitteeIds: ['COM_FOOD', 'COM_MATERIALS'],
      requestedWorkspaceIds: ['food', 'materials'],
      requestCenterAccess: true,
      lendingSelfService: false,
      internalLendingOperations: true,
      password: 'correct horse battery staple',
      confirmPassword: 'correct horse battery staple',
    });
  });

  it('preserves exact application review evidence, revision, reason, and CSRF', async () => {
    const backend = backendStub();
    const controller = controllerFor(backend);
    submit(
      controller,
      form('application-review', {
        operation: 'DIRECTOR_APPROVE',
        applicationId: 'AAP-EXACT',
        clientRequestId: 'review-retry-exact',
        expectedRevision: '7',
        reason: 'Reviewed against the protected roster.',
        evidenceFingerprint: 'evidence-fingerprint-exact',
        protectedReviewEnvelope: 'protected-envelope-exact',
      }),
    );
    await completed(backend.auth.decideAccountApplication);
    expect(backend.auth.decideAccountApplication).toHaveBeenCalledWith(
      'director',
      'AAP-EXACT',
      'approve',
      {
        expectedRevision: 7,
        clientRequestId: 'review-retry-exact',
        reason: 'Reviewed against the protected roster.',
        reviewEvidence: {
          evidenceFingerprint: 'evidence-fingerprint-exact',
          protectedReviewEnvelope: 'protected-envelope-exact',
        },
      },
      'csrf-exact',
    );
  });

  it('maps access and profile mutations to their exact existing adapter contracts', async () => {
    const backend = backendStub();
    const controller = controllerFor(backend);
    submit(
      controller,
      form('access', {
        operation: 'CHANGE_ACCESS_ID',
        accountId: 'ACCOUNT-EXACT',
        expectedRevision: 'revision-exact',
        confirmCurrentAccessId: 'current.access',
        proposedAccessId: 'next.access',
        idempotencyKey: 'access-retry-exact',
        reason: 'Owner-approved account identifier correction.',
      }),
    );
    await completed(backend.commands.changeAccessId);
    expect(backend.commands.changeAccessId).toHaveBeenCalledWith({
      accountId: 'ACCOUNT-EXACT',
      expectedRevision: 'revision-exact',
      confirmCurrentAccessId: 'current.access',
      idempotencyKey: 'access-retry-exact',
      reason: 'Owner-approved account identifier correction.',
      proposedAccessId: 'next.access',
    });

    submit(
      controller,
      form('profile', {
        operation: 'PASSWORD',
        clientRequestId: 'profile-retry-exact',
        expectedRevision: '2032-05-07T01:00:00.000Z',
        currentPassword: 'current-password',
        newPassword: 'next-correct-horse-battery-staple',
        confirmPassword: 'next-correct-horse-battery-staple',
        reason: 'Self-service password change',
      }),
    );
    await completed(backend.auth.changeProfilePassword);
    expect(backend.auth.changeProfilePassword).toHaveBeenCalledWith(
      {
        clientRequestId: 'profile-retry-exact',
        expectedRevision: '2032-05-07T01:00:00.000Z',
        currentPassword: 'current-password',
        newPassword: 'next-correct-horse-battery-staple',
        confirmPassword: 'next-correct-horse-battery-staple',
        reason: 'Self-service password change',
      },
      'csrf-exact',
    );
  });

  it('wires reference-link and advertisement lifecycles with typed revisions and retry keys', async () => {
    const backend = backendStub();
    const controller = controllerFor(backend);
    submit(
      controller,
      form('reference-link', {
        operation: 'CREATE',
        label: 'Approved request guide',
        linkType: 'INTERNAL_ROUTE',
        url: 'public.request-intake',
        audience: 'PUBLIC',
        clientRequestId: 'link-create-retry-exact',
        reason: 'Publish the reviewed internal destination.',
      }),
    );
    await completed(backend.api.createReferenceLink);
    expect(backend.api.createReferenceLink).toHaveBeenCalledWith({
      label: 'Approved request guide',
      linkType: 'INTERNAL_ROUTE',
      url: 'public.request-intake',
      audience: 'PUBLIC',
      clientRequestId: 'link-create-retry-exact',
      reason: 'Publish the reviewed internal destination.',
    });

    submit(
      controller,
      form('reference-link', {
        operation: 'TRANSITION',
        id: 'RLK-EXACT',
        status: 'ACTIVE',
        clientRequestId: 'link-retry-exact',
        expectedRevision: '4',
        reason: 'Publish the reviewed destination.',
      }),
    );
    await completed(backend.api.transitionReferenceLink);
    expect(backend.api.transitionReferenceLink).toHaveBeenCalledWith({
      id: 'RLK-EXACT',
      status: 'ACTIVE',
      clientRequestId: 'link-retry-exact',
      expectedRevision: 4,
      reason: 'Publish the reviewed destination.',
    });

    submit(
      controller,
      form('advertisement', {
        operation: 'SCHEDULE',
        id: 'ANN-EXACT',
        expectedRevision: '2',
        clientRequestId: 'announcement-retry-exact',
        publishAt: '2032-05-10T09:30',
        expireAt: '2032-05-20T09:30',
      }),
    );
    await completed(backend.api.scheduleAdvertisement);
    expect(backend.api.scheduleAdvertisement).toHaveBeenCalledWith({
      id: 'ANN-EXACT',
      publishAt: '2032-05-10T09:30',
      expireAt: '2032-05-20T09:30',
      expectedRevision: 2,
      clientRequestId: 'announcement-retry-exact',
    });
  });

  it('ignores unrelated forms and contains no environment selector, public evidence upload, avatar upload, or raw JSON console', async () => {
    const backend = backendStub();
    const controller = controllerFor(backend);
    expect(controller.onSubmit({ target: { dataset: {} } })).toBe(false);
    expect(Object.values(backend.auth).every((method) => !method.mock?.calls.length)).toBe(true);

    const source = await readFile(
      new URL('../../src/v5/integration/admin-parity.js', import.meta.url),
      'utf8',
    );
    expect(source).not.toMatch(/staging\s*=|environmentId|databaseId|bucketName/iu);
    expect(source).not.toContain('/api/me/avatar');
    expect(source).not.toContain('uploadEvidenceFile');
    expect(source).not.toContain("dataAct: 'noop'");
    expect(source).not.toMatch(/JSON\.stringify\([^)]*\).*textContent/su);
    expect(source).toContain('v5ParityActions: action');
    expect(source).toContain("'access.admin'");
    expect(source).toContain("'system.diagnostics'");
  });
});
