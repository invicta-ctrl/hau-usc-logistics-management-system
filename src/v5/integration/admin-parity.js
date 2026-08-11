const CAPABILITY = Object.freeze({
  ACCESS: 'access.admin',
  APPLICATION_ADMIN: 'account_application.admin_review',
  APPLICATION_DIRECTOR: 'account_application.director_decide',
  APPLICATION_OWNER: 'account_application.owner_override',
  ADVERTISEMENT: 'advertisement.manage',
  BRAND: 'brand.manage',
  DIAGNOSTICS: 'system.diagnostics',
  REFERENCE: 'reference.manage',
  SYSTEM: 'system.admin',
  VIEW_REQUEST: 'view.request',
});

const text = (value) => String(value ?? '').trim();
const csv = (value) =>
  text(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
const integer = (value) => (text(value) ? Number(value) : undefined);
const present = (value) => value !== undefined && value !== null && value !== '';

function safeMessage(error) {
  const message = text(error?.message) || 'The service could not complete this action.';
  const reference = text(error?.correlationId);
  return reference ? `${message} Reference: ${reference}.` : message;
}

function routeFrom(getState) {
  const stateRoute = text(getState?.()?.surface);
  if (stateRoute) return stateRoute;
  return globalThis.location?.hash?.replace(/^#\/?/u, '') || 'public.landing';
}

function capabilitiesFrom(getCapabilities) {
  const value = getCapabilities?.();
  return value instanceof Set ? value : new Set(Array.isArray(value) ? value : []);
}

function element(tag, { className = '', textContent = '', attrs = {}, dataset = {} } = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent) node.textContent = textContent;
  for (const [name, value] of Object.entries(attrs)) {
    if (value === false || value === undefined || value === null) continue;
    if (value === true) node.setAttribute(name, '');
    else node.setAttribute(name, String(value));
  }
  Object.assign(node.dataset, dataset);
  return node;
}

function field(spec) {
  const wrapper = element('div', { className: 'field' });
  const id = `v5-parity-${spec.name}-${Math.random().toString(36).slice(2)}`;
  const label = element('label', { textContent: spec.label, attrs: { for: id } });
  let control;
  if (spec.options) {
    control = element('select', { attrs: { id, name: spec.name, required: spec.required } });
    for (const option of spec.options) {
      const definition = typeof option === 'string' ? { value: option, label: option } : option;
      control.append(
        element('option', {
          textContent: definition.label,
          attrs: { value: definition.value, selected: definition.value === spec.value },
        }),
      );
    }
  } else if (spec.type === 'textarea') {
    control = element('textarea', {
      attrs: { id, name: spec.name, required: spec.required, maxlength: spec.maxlength },
    });
  } else {
    control = element('input', {
      attrs: {
        id,
        name: spec.name,
        type: spec.type || 'text',
        required: spec.required,
        min: spec.min,
        max: spec.max,
        step: spec.step,
        accept: spec.accept,
        autocomplete: spec.autocomplete,
        inputmode: spec.inputmode,
        pattern: spec.pattern,
        minlength: spec.minlength,
        maxlength: spec.maxlength,
      },
    });
  }
  if (spec.value && !spec.options) control.value = spec.value;
  if (spec.type === 'checkbox') {
    const checkbox = element('label', { className: 'request-ack' });
    const words = element('span');
    words.append(element('b', { textContent: spec.label }));
    if (spec.hint) words.append(element('small', { textContent: spec.hint }));
    checkbox.append(control, words);
    return checkbox;
  }
  wrapper.append(label, control);
  const help = element('span', {
    className: 'field__message field__hint',
    textContent: spec.hint || '',
    attrs: spec.hint ? {} : { 'aria-hidden': 'true' },
  });
  wrapper.append(help);
  return wrapper;
}

function formPanel({ title, description, action, fields, submit = 'Run action' }) {
  const panel = element('section', {
    className: 'panel',
    dataset: { v5AdminParity: action, v5ParityActions: action },
  });
  const body = element('div', { className: 'panel__body' });
  body.append(element('h2', { className: 'block-title', textContent: title }));
  if (description) body.append(element('p', { className: 'muted', textContent: description }));
  const form = element('form', { className: 'form-grid', dataset: { v5AdminForm: action } });
  form.noValidate = false;
  for (const definition of fields) form.append(field(definition));
  form.append(
    element('button', {
      className: 'btn btn--primary',
      textContent: submit,
      attrs: { type: 'submit' },
    }),
  );
  form.append(
    element('p', {
      className: 'muted',
      attrs: { 'aria-live': 'polite' },
      dataset: { v5AdminStatus: action },
    }),
  );
  body.append(form);
  panel.append(body);
  return panel;
}

function deniedPanel(capability) {
  const panel = element('section', { className: 'panel', dataset: { v5AdminParity: 'denied' } });
  const body = element('div', { className: 'panel__body' });
  const notice = element('div', { className: 'notice', attrs: { role: 'status', 'data-tone': 'info' } });
  const copy = element('div');
  copy.append(
    element('b', { textContent: 'Capability-gated control' }),
    element('p', {
      textContent: `This action requires ${capability}. Server authorization still decides every request.`,
    }),
  );
  notice.append(copy);
  body.append(notice);
  panel.append(body);
  return panel;
}

function readForm(form) {
  const result = {};
  for (const control of Array.from(form?.elements ?? [])) {
    if (!control?.name || control.disabled || ['submit', 'button'].includes(control.type)) continue;
    if (control.type === 'checkbox') result[control.name] = control.checked === true;
    else if (control.type === 'file') result[control.name] = control.files?.[0] ?? null;
    else result[control.name] = control.value;
  }
  return result;
}

function compact(command) {
  return Object.fromEntries(
    Object.entries(command).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return present(value);
    }),
  );
}

async function fileBase64(file) {
  if (!file || typeof file.arrayBuffer !== 'function') return '';
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function mutationBase(values) {
  return compact({
    accountId: values.accountId,
    expectedRevision: values.expectedRevision,
    confirmCurrentAccessId: values.confirmCurrentAccessId,
    clientRequestId: values.clientRequestId,
    idempotencyKey: values.idempotencyKey,
    reason: values.reason,
  });
}

function policyCommand(values) {
  return compact({
    ...mutationBase(values),
    presetId: values.presetId,
    roleId: values.roleId,
    committeeIds: csv(values.committeeIds),
    defaultCommitteeId: values.defaultCommitteeId,
    workspaceIds: csv(values.workspaceIds),
    defaultWorkspaceId: values.defaultWorkspaceId,
    locationScopeIds: csv(values.locationScopeIds),
    eventSeriesScopeIds: csv(values.eventSeriesScopeIds),
    eventScopeIds: csv(values.eventScopeIds),
    capabilityGrants: csv(values.capabilityGrants),
    capabilityDenies: csv(values.capabilityDenies),
  });
}

const retryFields = [
  {
    label: 'Safe retry key',
    name: 'clientRequestId',
    hint: 'Reuse only for an exact retry.',
  },
];
const revisionFields = [
  { label: 'Expected revision', name: 'expectedRevision' },
  { label: 'Reason', name: 'reason', type: 'textarea' },
];

function publicPanels(currentRoute, integration = {}) {
  if (currentRoute === 'public.signin')
    return [
      formPanel({
        title: 'Complete starter account activation',
        description: 'Available only after a successful starter-account sign in in this browser session.',
        action: 'auth-activate',
        submit: 'Activate account',
        fields: [
          { label: 'Full name', name: 'fullName', required: true },
          { label: 'Mobile number', name: 'mobileNumber', type: 'tel', required: true },
          { label: 'Verified email', name: 'email', type: 'email', required: true },
          { label: 'New password', name: 'password', type: 'password', required: true },
          { label: 'Confirm new password', name: 'confirmPassword', type: 'password', required: true },
        ],
      }),
      formPanel({
        title: 'Complete password reset',
        description: 'Use the opaque reset token issued through the approved recovery channel.',
        action: 'auth-reset',
        submit: 'Reset password',
        fields: [
          { label: 'Reset token', name: 'resetToken', type: 'password', required: true },
          { label: 'New password', name: 'password', type: 'password', required: true },
          { label: 'Confirm new password', name: 'confirmPassword', type: 'password', required: true },
        ],
      }),
    ];
  if (currentRoute === 'public.verify')
    return [
      formPanel({
        title: 'Verify an approved institutional email',
        description:
          'Starting verification remains non-enumerating. Confirmation returns an opaque application receipt.',
        action: 'application-email',
        submit: 'Continue verification',
        fields: [
          { label: 'Action', name: 'operation', options: ['START', 'CONFIRM'], required: true },
          { label: 'Institutional email', name: 'email', type: 'email', required: true },
          {
            label: 'Verification code',
            name: 'code',
            type: 'text',
            inputmode: 'numeric',
            pattern: '\\d{8}',
            minlength: 8,
            maxlength: 8,
            autocomplete: 'one-time-code',
            hint: 'Enter the 8-digit code when confirming.',
          },
        ],
      }),
    ];
  if (currentRoute === 'public.application')
    return [
      formPanel({
        title: 'Submit the verified account application',
        description: 'Every governed identity and access field is sent to the existing application contract.',
        action: 'application-submit',
        submit: 'Submit application',
        fields: [
          {
            label: 'Action',
            name: 'operation',
            options: ['SUBMIT', 'RESUBMIT'],
            required: true,
          },
          ...retryFields.map((definition) => ({ ...definition, required: true })),
          {
            label: 'Verification receipt',
            name: 'verificationReceipt',
            type: 'password',
            value: text(integration.accountApplicationVerificationReceipt),
            hint: 'Required for a new application.',
          },
          {
            label: 'Status token',
            name: 'statusToken',
            type: 'password',
            value: text(integration.accountApplicationStatusToken),
            hint: 'Required only when resubmitting requested changes.',
          },
          { label: 'Expected revision', name: 'expectedRevision', hint: 'Required only when resubmitting.' },
          { label: 'Legal name', name: 'legalName', required: true },
          { label: 'Contact number', name: 'contactNumber', type: 'tel', required: true },
          { label: 'Department ID', name: 'departmentId', required: true },
          { label: 'Course ID', name: 'courseId', required: true },
          { label: 'Year level', name: 'yearLevel', type: 'number', min: 1, max: 10, required: true },
          { label: 'Requested username', name: 'requestedUsername', required: true },
          { label: 'Requested account type', name: 'requestedAccountType', required: true },
          { label: 'Requested role ID', name: 'requestedRoleId', required: true },
          {
            label: 'Requested committee IDs',
            name: 'requestedCommitteeIds',
            hint: 'Comma-separated governed IDs.',
          },
          {
            label: 'Requested workspace IDs',
            name: 'requestedWorkspaceIds',
            hint: 'Comma-separated governed IDs.',
          },
          { label: 'Request Center access', name: 'requestCenterAccess', type: 'checkbox' },
          { label: 'Lending self-service', name: 'lendingSelfService', type: 'checkbox' },
          { label: 'Internal lending operations', name: 'internalLendingOperations', type: 'checkbox' },
          { label: 'Password', name: 'password', type: 'password', required: true },
          { label: 'Confirm password', name: 'confirmPassword', type: 'password', required: true },
        ],
      }),
    ];
  if (currentRoute === 'public.application-status')
    return [
      formPanel({
        title: 'Check or withdraw an application',
        description: 'The opaque status token is never placed in the URL.',
        action: 'application-status',
        submit: 'Run application action',
        fields: [
          { label: 'Action', name: 'operation', options: ['STATUS', 'WITHDRAW'], required: true },
          {
            label: 'Status token',
            name: 'statusToken',
            type: 'password',
            value: text(integration.accountApplicationStatusToken),
            required: true,
          },
          ...retryFields,
          ...revisionFields,
        ],
      }),
    ];
  return [];
}

function applicationReviewPanel(capabilities) {
  const allowed = [
    capabilities.has(CAPABILITY.APPLICATION_ADMIN) && 'ADMIN_LIST',
    capabilities.has(CAPABILITY.APPLICATION_ADMIN) && 'ADMIN_GET',
    capabilities.has(CAPABILITY.APPLICATION_ADMIN) && 'ADMIN_REQUEST_CHANGES',
    capabilities.has(CAPABILITY.APPLICATION_ADMIN) && 'ADMIN_REJECT',
    capabilities.has(CAPABILITY.APPLICATION_ADMIN) && 'ADMIN_FORWARD',
    capabilities.has(CAPABILITY.APPLICATION_DIRECTOR) && 'DIRECTOR_LIST',
    capabilities.has(CAPABILITY.APPLICATION_DIRECTOR) && 'DIRECTOR_GET',
    capabilities.has(CAPABILITY.APPLICATION_DIRECTOR) && 'DIRECTOR_APPROVE',
    capabilities.has(CAPABILITY.APPLICATION_DIRECTOR) && 'DIRECTOR_REQUEST_CHANGES',
    capabilities.has(CAPABILITY.APPLICATION_DIRECTOR) && 'DIRECTOR_REJECT',
    capabilities.has(CAPABILITY.APPLICATION_OWNER) && 'OWNER_OVERRIDE',
  ].filter(Boolean);
  if (!allowed.length) return null;
  return formPanel({
    title: 'Account application review',
    description:
      'Review evidence, revisions, reasons, and override capture are explicit and never synthesized.',
    action: 'application-review',
    submit: 'Run review action',
    fields: [
      { label: 'Action', name: 'operation', options: allowed, required: true },
      { label: 'Application ID', name: 'applicationId' },
      ...retryFields,
      ...revisionFields,
      { label: 'Evidence fingerprint', name: 'evidenceFingerprint' },
      { label: 'Protected review envelope', name: 'protectedReviewEnvelope', type: 'password' },
      { label: 'Current state', name: 'currentState' },
      {
        label: 'Owner override decision',
        name: 'overrideAction',
        options: ['APPROVE', 'REQUEST_CHANGES', 'REJECT', 'FORWARD'],
      },
      { label: 'Effective access fingerprint', name: 'effectiveAccessFingerprint' },
      { label: 'Session impact fingerprint', name: 'sessionImpactFingerprint' },
      { label: 'Follow-up review reference', name: 'followUpReviewReference' },
    ],
  });
}

function accessPanel() {
  return formPanel({
    title: 'Account and access operations',
    description:
      'Preview before mutation. Account identity, revision, retry key, and reason remain explicit.',
    action: 'access',
    submit: 'Run access action',
    fields: [
      {
        label: 'Action',
        name: 'operation',
        options: [
          'LIST',
          'HISTORY',
          'POLICY_OPTIONS',
          'PREVIEW_ACCESS_ID',
          'CHANGE_ACCESS_ID',
          'PREVIEW_POLICY',
          'UPDATE_POLICY',
          'CREATE_ACCOUNT',
          'SEED_DEPARTMENTS',
          'RESET_PASSWORD',
          'SET_STATUS',
          'REVOKE_SESSIONS',
          'UNLOCK',
        ],
        required: true,
      },
      { label: 'Account ID', name: 'accountId' },
      { label: 'Current access ID', name: 'currentAccessId' },
      { label: 'Confirm current access ID', name: 'confirmCurrentAccessId' },
      { label: 'Proposed or new access ID', name: 'proposedAccessId' },
      { label: 'Expected revision', name: 'expectedRevision' },
      { label: 'Safe retry key', name: 'idempotencyKey' },
      { label: 'Reason', name: 'reason', type: 'textarea' },
      { label: 'Search', name: 'query' },
      { label: 'Status', name: 'status' },
      { label: 'Lifecycle action', name: 'lifecycleAction', hint: 'ARCHIVE is accepted only with REVOKED.' },
      { label: 'Preset ID', name: 'presetId' },
      { label: 'Role ID', name: 'roleId' },
      { label: 'Committee IDs', name: 'committeeIds', hint: 'Comma-separated governed IDs.' },
      { label: 'Default committee ID', name: 'defaultCommitteeId' },
      { label: 'Workspace IDs', name: 'workspaceIds', hint: 'Comma-separated governed IDs.' },
      { label: 'Default workspace ID', name: 'defaultWorkspaceId' },
      { label: 'Location scope IDs', name: 'locationScopeIds', hint: 'Comma-separated governed IDs.' },
      { label: 'Event series scope IDs', name: 'eventSeriesScopeIds', hint: 'Comma-separated governed IDs.' },
      { label: 'Event scope IDs', name: 'eventScopeIds', hint: 'Comma-separated governed IDs.' },
      {
        label: 'Capability grants',
        name: 'capabilityGrants',
        hint: 'Comma-separated governed capabilities.',
      },
      {
        label: 'Capability denies',
        name: 'capabilityDenies',
        hint: 'Comma-separated governed capabilities.',
      },
      { label: 'Institution ID', name: 'institutionId' },
      { label: 'Department ID', name: 'departmentId' },
      { label: 'Temporary password hours', name: 'temporaryPasswordHours', type: 'number', min: 1, max: 168 },
      { label: 'Generate access ID', name: 'generateAccessId', type: 'checkbox' },
      { label: 'Lending eligible', name: 'lendingEligible', type: 'checkbox' },
      { label: 'I confirm this governed operation', name: 'confirmed', type: 'checkbox' },
    ],
  });
}

function rosterPanel(capabilities) {
  const operations = capabilities.has(CAPABILITY.SYSTEM)
    ? ['STATUS', 'PREVIEW', 'DIRECTORY', 'APPLY', 'ROLLBACK', 'SELF']
    : ['SELF'];
  return formPanel({
    title: 'Protected identity roster',
    description:
      'Status, preview, directory, apply, rollback, and the current user projection use the existing protected contracts.',
    action: 'roster',
    submit: 'Run roster action',
    fields: [
      {
        label: 'Action',
        name: 'operation',
        options: operations,
        required: true,
      },
      { label: 'Search', name: 'query' },
      { label: 'Active state', name: 'active', options: ['ALL', 'ACTIVE', 'INACTIVE'] },
      { label: 'Verification result', name: 'verificationResult' },
      { label: 'Page', name: 'page', type: 'number', min: 1 },
      { label: 'Page size', name: 'pageSize', type: 'number', min: 1, max: 100 },
      { label: 'Preview or applied run ID', name: 'runId' },
      { label: 'Confirm source fingerprint', name: 'confirmSourceFingerprint' },
      ...retryFields,
      { label: 'Reason', name: 'reason', type: 'textarea' },
    ],
  });
}

function referenceAdminPanel() {
  return formPanel({
    title: 'Controlled reference lifecycle',
    description: 'Patch fields are typed; roster-owned and read-only domains remain protected by the server.',
    action: 'reference-admin',
    submit: 'Run reference action',
    fields: [
      {
        label: 'Action',
        name: 'operation',
        options: ['WORKSPACE', 'PREVIEW', 'SUBMIT', 'REVIEW'],
        required: true,
      },
      { label: 'Domain', name: 'domain', required: true },
      { label: 'Change action', name: 'changeAction', options: ['ADD', 'UPDATE', 'ARCHIVE', 'RESTORE'] },
      { label: 'Target ID', name: 'targetId' },
      { label: 'Expected revision', name: 'expectedRevision' },
      { label: 'Display name', name: 'displayName' },
      { label: 'Code', name: 'code' },
      { label: 'Role ID', name: 'roleId' },
      { label: 'Committee IDs', name: 'committeeIds', hint: 'Comma-separated governed IDs.' },
      {
        label: 'Active state',
        name: 'active',
        options: [
          { value: '', label: 'Not changed' },
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
      },
      { label: 'Reason', name: 'reason', type: 'textarea' },
      { label: 'Safe retry key', name: 'idempotencyKey' },
      { label: 'Change ID', name: 'changeId' },
      { label: 'Review decision', name: 'decision', options: ['APPROVE', 'REJECT'] },
      { label: 'Search', name: 'query' },
    ],
  });
}

function linkPanel() {
  return formPanel({
    title: 'Reference link version lifecycle',
    description: 'Internal routes and approved external destinations remain server-governed.',
    action: 'reference-link',
    submit: 'Run link action',
    fields: [
      {
        label: 'Action',
        name: 'operation',
        options: ['LIST', 'GET', 'HISTORY', 'CREATE', 'UPDATE', 'TRANSITION'],
        required: true,
      },
      { label: 'Link ID', name: 'id' },
      { label: 'Label', name: 'label' },
      {
        label: 'Destination type',
        name: 'linkType',
        options: ['INTERNAL_ROUTE', 'EXTERNAL_URL'],
      },
      {
        label: 'Destination',
        name: 'url',
        hint: 'Enter an approved internal route ID or an HTTPS URL for the selected type.',
      },
      { label: 'Audience', name: 'audience' },
      { label: 'Status', name: 'status', options: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] },
      ...retryFields,
      ...revisionFields,
      { label: 'Search', name: 'query' },
      { label: 'Page', name: 'page', type: 'number', min: 1 },
      { label: 'Page size', name: 'pageSize', type: 'number', min: 1, max: 100 },
    ],
  });
}

function brandPanel() {
  return formPanel({
    title: 'Versioned brand assets',
    description:
      'Governed logo, landing masthead, sign-in background, and catalog theme images are versioned here. The application reads a file only on Upload; publish and rollback require an exact version and revision.',
    action: 'brand',
    submit: 'Run brand action',
    fields: [
      {
        label: 'Action',
        name: 'operation',
        options: ['LIST', 'UPLOAD', 'PUBLISH', 'ROLLBACK'],
        required: true,
      },
      {
        label: 'Governed slot',
        name: 'slot',
        options: [
          { value: 'usc-logo', label: 'USC logo' },
          { value: 'dol-logo', label: 'Department of Logistics logo' },
          { value: 'combined-lockup', label: 'Combined USC and DOL lockup' },
          { value: 'favicon', label: 'Browser icon' },
          { value: 'login-background', label: 'Sign-in and landing fallback image' },
          { value: 'default-item-image', label: 'Default catalog image' },
        ],
      },
      { label: 'Version ID', name: 'versionId' },
      { label: 'Expected revision', name: 'expectedRevision' },
      { label: 'Alternative text', name: 'altText' },
      {
        label: 'Image file',
        name: 'file',
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp,image/svg+xml',
      },
      ...retryFields,
      { label: 'Reason', name: 'reason', type: 'textarea' },
    ],
  });
}

function advertisementPanel() {
  return formPanel({
    title: 'Public announcement lifecycle',
    description:
      'The first active PUBLIC announcement becomes the event-led landing hero—title, summary, CTA, destination, and image. All public projection remains server-published and capability-gated.',
    action: 'advertisement',
    submit: 'Run announcement action',
    fields: [
      {
        label: 'Action',
        name: 'operation',
        options: ['LIST', 'PREVIEW', 'SAVE', 'UPLOAD', 'PUBLISH', 'SCHEDULE', 'PAUSE', 'RESUME', 'ARCHIVE'],
        required: true,
      },
      { label: 'Advertisement ID', name: 'id' },
      { label: 'Title', name: 'title' },
      { label: 'Description', name: 'description', type: 'textarea' },
      { label: 'Alternative text', name: 'altText' },
      { label: 'Call to action', name: 'callToAction' },
      { label: 'Destination URL', name: 'destinationUrl', type: 'url' },
      { label: 'Audience', name: 'audience' },
      { label: 'Status', name: 'status' },
      { label: 'Display order', name: 'displayOrder', type: 'number' },
      { label: 'Publish at', name: 'publishAt', type: 'datetime-local' },
      { label: 'Expire at', name: 'expireAt', type: 'datetime-local' },
      { label: 'Expected revision', name: 'expectedRevision' },
      ...retryFields,
      {
        label: 'Landing and announcement image',
        name: 'file',
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp',
        hint: 'Use a wide, readable event cover. Publishing controls when it appears on the public landing page.',
      },
      { label: 'Search', name: 'query' },
      { label: 'Page', name: 'page', type: 'number', min: 1 },
      { label: 'Page size', name: 'pageSize', type: 'number', min: 1, max: 100 },
    ],
  });
}

function profilePanel() {
  return formPanel({
    title: 'Profile and sign-in security',
    description:
      'Contact, username, password, and protected identity correction use separate audited contracts.',
    action: 'profile',
    submit: 'Run profile action',
    fields: [
      {
        label: 'Action',
        name: 'operation',
        options: ['CONTACT', 'USERNAME', 'PASSWORD', 'IDENTITY_CORRECTION'],
        required: true,
      },
      ...retryFields.map((definition) => ({ ...definition, required: true })),
      { label: 'Expected profile revision', name: 'expectedRevision' },
      { label: 'Mobile or contact number', name: 'mobileNumber' },
      { label: 'New username', name: 'username' },
      { label: 'Current password', name: 'currentPassword', type: 'password' },
      { label: 'New password', name: 'newPassword', type: 'password' },
      { label: 'Confirm new password', name: 'confirmPassword', type: 'password' },
      { label: 'Proposed legal name', name: 'legalName' },
      { label: 'Proposed email', name: 'email', type: 'email' },
      { label: 'Reason', name: 'reason', type: 'textarea' },
    ],
  });
}

function healthPanel(capabilities) {
  const operations = ['HEALTH', 'READINESS', 'VERSION', 'MIGRATIONS'];
  if (capabilities.has(CAPABILITY.SYSTEM)) {
    operations.push('EVIDENCE_STATUS', 'EVIDENCE_PROCESS', 'EVIDENCE_RESTORE', 'EVIDENCE_ARCHIVE');
  }
  return formPanel({
    title: 'Operational diagnostics and evidence recovery',
    description:
      'Reads are safe projections. Evidence processing, restore, and archive require explicit evidence references and reasons.',
    action: 'health',
    submit: 'Run diagnostic action',
    fields: [
      { label: 'Action', name: 'operation', options: operations, required: true },
      { label: 'Evidence ID', name: 'evidenceId' },
      { label: 'Processing limit', name: 'limit', type: 'number', min: 1, max: 100 },
      { label: 'Reason', name: 'reason', type: 'textarea' },
    ],
  });
}

function projectAdvertisements(integration) {
  const target = document.querySelector('.landing-updates');
  if (!target || target.querySelector('[data-v5-admin-parity="advertisement-projection"]')) return;
  const items = Array.isArray(integration?.advertisements) ? integration.advertisements : [];
  const section = element('div', { dataset: { v5AdminParity: 'advertisement-projection' } });
  section.append(element('h3', { className: 'block-title', textContent: 'Published announcements' }));
  if (!items.length) {
    section.append(
      element('p', { className: 'muted', textContent: 'No published announcement is available.' }),
    );
  } else {
    const list = element('ul', { className: 'evidence' });
    for (const item of items) {
      const row = element('li');
      const copy = element('span');
      copy.append(
        element('b', { textContent: text(item.title) || 'Official update' }),
        element('span', {
          textContent: text(item.description) || text(item.callToAction) || 'Published by the council.',
        }),
      );
      row.append(copy);
      list.append(row);
    }
    section.append(list);
  }
  target.append(section);
}

export function createAdminParityController({
  backend,
  app,
  getState = () => app?.integrationState ?? {},
  getIntegration = () => ({}),
  getCapabilities = () => [],
  refresh = async () => {},
  toast = () => {},
} = {}) {
  if (!backend?.auth || !backend?.api || !backend?.commands) {
    throw new TypeError('The V5 backend auth, API, and command adapters are required.');
  }

  const csrf = () =>
    text(
      getIntegration()?.activationCsrfToken ??
        getIntegration()?.activation?.csrfToken ??
        getIntegration()?.session?.csrfToken,
    );

  function afterRender() {
    if (typeof document === 'undefined') return;
    const currentRoute = routeFrom(getState);
    const integration = getIntegration() ?? {};
    if (currentRoute === 'public.landing') projectAdvertisements(integration);
    const root = document.getElementById('surface-main');
    if (!root) return;
    root
      .querySelectorAll('[data-v5-admin-parity]:not([data-v5-admin-parity="advertisement-projection"])')
      .forEach((node) => node.remove());
    const capabilities = capabilitiesFrom(getCapabilities);
    const panels = publicPanels(currentRoute, integration);
    if (currentRoute === 'admin.access') {
      if (capabilities.has(CAPABILITY.ACCESS)) panels.push(accessPanel());
      else panels.push(deniedPanel(CAPABILITY.ACCESS));
      const review = applicationReviewPanel(capabilities);
      if (review) panels.push(review);
    }
    if (currentRoute === 'admin.directory') {
      if (capabilities.has(CAPABILITY.SYSTEM) || capabilities.has(CAPABILITY.VIEW_REQUEST))
        panels.push(rosterPanel(capabilities));
      else panels.push(deniedPanel(CAPABILITY.SYSTEM));
    }
    if (currentRoute === 'admin.reference') {
      if (capabilities.has(CAPABILITY.REFERENCE)) panels.push(referenceAdminPanel());
      else panels.push(deniedPanel(CAPABILITY.REFERENCE));
    }
    if (currentRoute === 'admin.links') {
      if (capabilities.has(CAPABILITY.REFERENCE)) panels.push(linkPanel());
      else panels.push(deniedPanel(CAPABILITY.REFERENCE));
    }
    if (currentRoute === 'admin.brand') {
      if (capabilities.has(CAPABILITY.BRAND)) panels.push(brandPanel());
      if (capabilities.has(CAPABILITY.ADVERTISEMENT)) panels.push(advertisementPanel());
      if (!capabilities.has(CAPABILITY.BRAND) && !capabilities.has(CAPABILITY.ADVERTISEMENT)) {
        panels.push(deniedPanel(`${CAPABILITY.BRAND} or ${CAPABILITY.ADVERTISEMENT}`));
      }
    }
    if (currentRoute === 'account.profile') panels.push(profilePanel());
    if (currentRoute === 'owner.health') {
      if (capabilities.has(CAPABILITY.DIAGNOSTICS) || capabilities.has(CAPABILITY.SYSTEM))
        panels.push(healthPanel(capabilities));
      else panels.push(deniedPanel(CAPABILITY.DIAGNOSTICS));
    }
    panels.forEach((panel) => root.append(panel));
  }

  async function runApplicationReview(values) {
    const operation = values.operation;
    const queue = operation.startsWith('DIRECTOR_') ? 'director' : 'admin';
    if (operation.endsWith('_LIST')) return backend.auth.listAccountApplications(queue);
    if (operation.endsWith('_GET'))
      return backend.auth.getAccountApplicationForReview(queue, values.applicationId);
    const command = compact({
      expectedRevision: integer(values.expectedRevision),
      clientRequestId: values.clientRequestId,
      reason: values.reason,
      reviewEvidence: {
        evidenceFingerprint: values.evidenceFingerprint,
        protectedReviewEnvelope: values.protectedReviewEnvelope,
      },
    });
    if (operation === 'OWNER_OVERRIDE') {
      command.override = {
        action: values.overrideAction,
        currentState: values.currentState,
        effectiveAccessFingerprint: values.effectiveAccessFingerprint,
        sessionImpactFingerprint: values.sessionImpactFingerprint,
        followUpReviewReference: values.followUpReviewReference,
      };
      return backend.auth.overrideAccountApplication(values.applicationId, command, csrf());
    }
    const action = operation
      .replace(/^(?:ADMIN|DIRECTOR)_/u, '')
      .toLowerCase()
      .replaceAll('_', '-');
    return backend.auth.decideAccountApplication(queue, values.applicationId, action, command, csrf());
  }

  async function runAccess(values) {
    const common = mutationBase(values);
    const operation = values.operation;
    if (operation === 'LIST')
      return backend.commands.listAccessAccounts(compact({ query: values.query, status: values.status }));
    if (operation === 'HISTORY')
      return backend.commands.getAccessIdHistory(
        compact({ accountId: values.accountId, currentAccessId: values.currentAccessId }),
      );
    if (operation === 'POLICY_OPTIONS') return backend.commands.getAccessPolicyOptions({});
    if (operation === 'PREVIEW_ACCESS_ID')
      return backend.commands.previewAccessIdChange({ ...common, proposedAccessId: values.proposedAccessId });
    if (operation === 'CHANGE_ACCESS_ID')
      return backend.commands.changeAccessId({ ...common, proposedAccessId: values.proposedAccessId });
    if (operation === 'PREVIEW_POLICY') return backend.commands.previewAccessPolicy(policyCommand(values));
    if (operation === 'UPDATE_POLICY') return backend.commands.updateAccessPolicy(policyCommand(values));
    if (operation === 'CREATE_ACCOUNT')
      return backend.commands.createAccessAccount(
        compact({
          ...policyCommand(values),
          accessId: values.proposedAccessId,
          generateAccessId: values.generateAccessId,
          lendingEligible: values.lendingEligible,
          institutionId: values.institutionId,
          departmentId: values.departmentId,
          temporaryPasswordHours: integer(values.temporaryPasswordHours),
          status: values.status,
          confirmed: values.confirmed,
        }),
      );
    if (operation === 'SEED_DEPARTMENTS')
      return backend.commands.seedDepartmentAccessAccounts({
        reason: values.reason,
        confirmed: values.confirmed,
      });
    if (operation === 'RESET_PASSWORD') return backend.commands.resetAccessPassword(common);
    if (operation === 'SET_STATUS')
      return backend.commands.setAccessAccountStatus({
        ...common,
        status: values.status,
        lifecycleAction: values.lifecycleAction,
      });
    if (operation === 'REVOKE_SESSIONS') return backend.commands.revokeAccessSessions(common);
    return backend.commands.unlockAccessAccount(common);
  }

  async function runRoster(values) {
    if (values.operation === 'STATUS') return backend.commands.getIdentityRosterStatus({});
    if (values.operation === 'PREVIEW') return backend.commands.previewIdentityRosterSync({});
    if (values.operation === 'DIRECTORY')
      return backend.commands.listIdentityRoster(
        compact({
          query: values.query,
          active: values.active,
          verificationResult: values.verificationResult,
          page: integer(values.page),
          pageSize: integer(values.pageSize),
        }),
      );
    if (values.operation === 'SELF') return backend.commands.getIdentityRosterSelfProfile({});
    const command = compact({
      runId: values.runId,
      confirmSourceFingerprint: values.confirmSourceFingerprint,
      clientRequestId: values.clientRequestId,
      reason: values.reason,
    });
    return values.operation === 'APPLY'
      ? backend.commands.applyIdentityRosterSync(command)
      : backend.commands.rollbackIdentityRosterSync(command);
  }

  async function runReferenceAdmin(values) {
    const base = compact({ domain: values.domain, query: values.query });
    if (values.operation === 'WORKSPACE') return backend.commands.getReferenceAdminWorkspace(base);
    const command = compact({
      ...base,
      action: values.changeAction,
      targetId: values.targetId,
      expectedRevision: integer(values.expectedRevision),
      patch: compact({
        displayName: values.displayName,
        code: values.code,
        roleId: values.roleId,
        committeeIds: csv(values.committeeIds),
        active: values.active === '' ? undefined : values.active === 'true',
        reason: values.reason,
      }),
      idempotencyKey: values.idempotencyKey,
      changeId: values.changeId,
      decision: values.decision,
      reason: values.reason,
    });
    if (values.operation === 'PREVIEW') return backend.commands.previewReferenceAdminChange(command);
    if (values.operation === 'SUBMIT') return backend.commands.submitReferenceAdminChange(command);
    return backend.commands.reviewReferenceAdminChange(command);
  }

  async function runReferenceLink(values) {
    const command = compact({
      id: values.id,
      label: values.label,
      linkType: values.linkType,
      url: values.url,
      audience: values.audience,
      status: values.status,
      clientRequestId: values.clientRequestId,
      expectedRevision: integer(values.expectedRevision),
      reason: values.reason,
      query: values.query,
      page: integer(values.page),
      pageSize: integer(values.pageSize),
    });
    const methods = {
      LIST: 'listReferenceLinks',
      GET: 'getReferenceLink',
      HISTORY: 'getReferenceLinkHistory',
      CREATE: 'createReferenceLink',
      UPDATE: 'updateReferenceLink',
      TRANSITION: 'transitionReferenceLink',
    };
    return backend.api[methods[values.operation]](command);
  }

  async function runBrand(values) {
    if (values.operation === 'LIST') return backend.api.listBrandAssets({});
    const command = compact({
      slot: values.slot,
      versionId: values.versionId,
      expectedRevision: integer(values.expectedRevision),
      altText: values.altText,
      clientRequestId: values.clientRequestId,
      reason: values.reason,
    });
    if (values.operation === 'UPLOAD') {
      command.base64 = await fileBase64(values.file);
      return backend.api.uploadBrandAsset(command);
    }
    return values.operation === 'PUBLISH'
      ? backend.api.publishBrandAsset(command)
      : backend.api.rollbackBrandAsset(command);
  }

  async function runAdvertisement(values) {
    const command = compact({
      id: values.id,
      title: values.title,
      description: values.description,
      altText: values.altText,
      callToAction: values.callToAction,
      destinationUrl: values.destinationUrl,
      audience: values.audience,
      status: values.status,
      displayOrder: integer(values.displayOrder),
      publishAt: values.publishAt,
      expireAt: values.expireAt,
      expectedRevision: integer(values.expectedRevision),
      clientRequestId: values.clientRequestId,
      query: values.query,
      page: integer(values.page),
      pageSize: integer(values.pageSize),
    });
    const methods = {
      LIST: 'listAdvertisements',
      PREVIEW: 'previewAdvertisement',
      SAVE: 'saveAdvertisement',
      PUBLISH: 'publishAdvertisement',
      SCHEDULE: 'scheduleAdvertisement',
      PAUSE: 'pauseAdvertisement',
      RESUME: 'resumeAdvertisement',
      ARCHIVE: 'archiveAdvertisement',
    };
    if (values.operation === 'UPLOAD') {
      command.base64 = await fileBase64(values.file);
      command.contentType = values.file?.type;
      return backend.api.uploadAdvertisementMedia(command);
    }
    return backend.api[methods[values.operation]](command);
  }

  async function runProfile(values) {
    const command = compact({
      clientRequestId: values.clientRequestId,
      expectedRevision: values.expectedRevision,
      mobileNumber: values.mobileNumber,
      username: values.username,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
      legalName: values.legalName,
      contactNumber: values.mobileNumber,
      email: values.email,
      reason: values.reason,
    });
    const methods = {
      CONTACT: 'updateProfileContact',
      USERNAME: 'changeProfileUsername',
      PASSWORD: 'changeProfilePassword',
      IDENTITY_CORRECTION: 'requestProfileIdentityCorrection',
    };
    return backend.auth[methods[values.operation]](command, csrf());
  }

  async function runHealth(values) {
    if (values.operation === 'HEALTH') return backend.health();
    if (values.operation === 'READINESS') return backend.readiness();
    if (values.operation === 'VERSION') return backend.version();
    if (values.operation === 'MIGRATIONS')
      return backend.auth.request('/api/admin/migrations', { method: 'GET' });
    if (values.operation === 'EVIDENCE_STATUS')
      return backend.commands.getEvidenceSystemStatus(compact({ evidenceId: values.evidenceId }));
    const path = {
      EVIDENCE_PROCESS: '/api/owner/evidence/process',
      EVIDENCE_RESTORE: '/api/owner/evidence/restore',
      EVIDENCE_ARCHIVE: '/api/owner/evidence/archive',
    }[values.operation];
    return backend.auth.request(path, {
      body: compact({ evidenceId: values.evidenceId, limit: integer(values.limit), reason: values.reason }),
      csrfToken: csrf(),
    });
  }

  async function dispatch(action, values) {
    if (action === 'auth-activate') {
      if (!csrf()) throw new Error('Complete the starter-account sign in before activation.');
      const result = await (backend.activateStarter ?? backend.auth.activate.bind(backend.auth))({
        profile: { fullName: values.fullName, mobileNumber: values.mobileNumber, email: values.email },
        password: values.password,
        confirmPassword: values.confirmPassword,
        csrfToken: csrf(),
      });
      if (result?.state === 'AUTHENTICATED' && result.user) {
        const integration = getIntegration();
        integration.session = result;
        integration.activationCsrfToken = '';
      }
      return result;
    }
    if (action === 'auth-reset')
      return backend.auth.request('/api/auth/reset/complete', {
        body: {
          resetToken: values.resetToken,
          password: values.password,
          confirmPassword: values.confirmPassword,
        },
      });
    if (action === 'application-email') {
      if (values.operation === 'START') return backend.auth.startAccountApplicationEmail(values.email);
      const result = await backend.auth.confirmAccountApplicationEmail(values.email, values.code);
      if (result?.verificationReceipt)
        getIntegration().accountApplicationVerificationReceipt = result.verificationReceipt;
      return result;
    }
    if (action === 'application-submit') {
      const command = compact({
        clientRequestId: values.clientRequestId,
        verificationReceipt: values.verificationReceipt,
        expectedRevision: integer(values.expectedRevision),
        legalName: values.legalName,
        contactNumber: values.contactNumber,
        departmentId: values.departmentId,
        courseId: values.courseId,
        yearLevel: integer(values.yearLevel),
        requestedUsername: values.requestedUsername,
        requestedAccountType: values.requestedAccountType,
        requestedRoleId: values.requestedRoleId,
        requestedCommitteeIds: csv(values.requestedCommitteeIds),
        requestedWorkspaceIds: csv(values.requestedWorkspaceIds),
        requestCenterAccess: values.requestCenterAccess,
        lendingSelfService: values.lendingSelfService,
        internalLendingOperations: values.internalLendingOperations,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      const result =
        values.operation === 'RESUBMIT'
          ? await backend.auth.submitAccountApplication(command, values.statusToken)
          : await backend.auth.submitAccountApplication(command);
      if (result?.statusToken) getIntegration().accountApplicationStatusToken = result.statusToken;
      return result;
    }
    if (action === 'application-status') {
      if (values.operation === 'STATUS') return backend.auth.getAccountApplicationStatus(values.statusToken);
      return backend.auth.withdrawAccountApplication(
        values.statusToken,
        compact({
          clientRequestId: values.clientRequestId,
          expectedRevision: integer(values.expectedRevision),
          reason: values.reason,
        }),
      );
    }
    if (action === 'application-review') return runApplicationReview(values);
    if (action === 'access') return runAccess(values);
    if (action === 'roster') return runRoster(values);
    if (action === 'reference-admin') return runReferenceAdmin(values);
    if (action === 'reference-link') return runReferenceLink(values);
    if (action === 'brand') return runBrand(values);
    if (action === 'advertisement') return runAdvertisement(values);
    if (action === 'profile') return runProfile(values);
    if (action === 'health') return runHealth(values);
    throw new Error('The requested V5 parity action is not registered.');
  }

  function onClick(event) {
    const control = event?.target?.closest?.('[data-v5-admin-action]');
    if (!control) return false;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    if (control.dataset.v5AdminAction === 'refresh') void refresh();
    return true;
  }

  function onSubmit(event) {
    const form = event?.target;
    const action = form?.dataset?.v5AdminForm;
    if (!action) return false;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    if (form.reportValidity && !form.reportValidity()) return true;
    const status = form.querySelector?.(`[data-v5-admin-status="${action}"]`);
    const button = form.querySelector?.('[type="submit"]');
    if (button) button.disabled = true;
    if (status) status.textContent = 'Working…';
    void dispatch(action, readForm(form))
      .then(async () => {
        if (status)
          status.textContent = 'Action completed. Refresh authoritative data before the next mutation.';
        toast('Action completed.');
        await refresh();
      })
      .catch((error) => {
        const message = safeMessage(error);
        if (status) status.textContent = message;
        toast(message, true);
      })
      .finally(() => {
        if (button) button.disabled = false;
      });
    return true;
  }

  return Object.freeze({ afterRender, onClick, onSubmit });
}
