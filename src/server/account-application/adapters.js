import { ROLES } from '../../domain/constants.js';
import { CAPABILITIES } from '../../domain/permissions.js';
import { normalizeAccessId } from '../auth/contracts.js';
import { accessIdCollisionKey, secureTemporaryPassword } from '../access/service.js';
import { normalizeAccessPolicy } from '../access/policy.js';
import { ACCOUNT_APPLICATION_STATE } from './contracts.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const DOMAIN_PATTERN = /^(?![.-])[a-z0-9.-]+(?<![.-])$/u;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;

const normalizeEmail = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const normalizeIdentityName = (value) =>
  String(value ?? '')
    .trim()
    .replaceAll(/\s+/gu, ' ')
    .toLocaleLowerCase('en-US');

function identityClass(value) {
  const id = String(value?.id ?? '').trim();
  const domains = [
    ...new Set(
      (Array.isArray(value?.domains) ? value.domains : [])
        .map((domain) =>
          String(domain ?? '')
            .trim()
            .toLowerCase(),
        )
        .filter((domain) => DOMAIN_PATTERN.test(domain)),
    ),
  ].sort();
  return ID_PATTERN.test(id) && domains.length
    ? Object.freeze({ id, domains: Object.freeze(domains) })
    : null;
}

export function parseAccountApplicationIdentityClasses(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed) || !parsed.length || parsed.length > 20) return Object.freeze([]);
    const classes = parsed.map(identityClass);
    if (classes.some((entry) => !entry)) return Object.freeze([]);
    if (new Set(classes.map((entry) => entry.id)).size !== classes.length) return Object.freeze([]);
    const domains = classes.flatMap((entry) => entry.domains);
    if (new Set(domains).size !== domains.length) return Object.freeze([]);
    return Object.freeze(classes);
  } catch {
    return Object.freeze([]);
  }
}

function classForEmail(email, classes) {
  const domain = email.slice(email.lastIndexOf('@') + 1);
  return classes.find((entry) => entry.domains.includes(domain)) ?? null;
}

async function approvedRosterProfile({ rosterRepository, rosterCrypto, emailFingerprint }) {
  const entry = await rosterRepository.getEntry(emailFingerprint);
  if (!entry?.active || !entry.protectedProfileEnvelope) return null;
  const profile = await rosterCrypto.decrypt(entry.protectedProfileEnvelope);
  if (
    profile?.active !== true ||
    String(profile?.verificationResult ?? '').toUpperCase() !== 'VERIFIED' ||
    (await rosterCrypto.identityKey(normalizeEmail(profile?.institutionalEmail))) !== emailFingerprint
  ) {
    return null;
  }
  return Object.freeze({ entry, profile });
}

export function createAccountApplicationIdentityAdapters({
  rosterRepository,
  rosterCrypto,
  identityClasses = [],
} = {}) {
  if (!rosterRepository || !rosterCrypto) {
    throw new Error('Protected roster repository and crypto are required.');
  }
  const classes = parseAccountApplicationIdentityClasses(identityClasses);

  const identityProtection = Object.freeze({
    async prepareEmail(value) {
      const email = normalizeEmail(value);
      if (!EMAIL_PATTERN.test(email) || email.length > 254 || !classes.length) return null;
      const matchedClass = classForEmail(email, classes);
      if (!matchedClass) return null;
      const emailFingerprint = await rosterCrypto.identityKey(email);
      const roster = await approvedRosterProfile({ rosterRepository, rosterCrypto, emailFingerprint });
      if (!roster || normalizeEmail(roster.profile.institutionalEmail) !== email) return null;
      return Object.freeze({
        approved: true,
        emailFingerprint,
        protectedEmailEnvelope: await rosterCrypto.encrypt({
          institutionalEmail: email,
          identityClassId: matchedClass.id,
        }),
        identityClassId: matchedClass.id,
        providerDelivery: Object.freeze({ institutionalEmail: email }),
      });
    },

    async protectApplicationProfile(profile) {
      return Object.freeze({
        protectedProfileEnvelope: await rosterCrypto.encrypt(profile),
        profileFingerprint: await rosterCrypto.fingerprint(profile),
      });
    },

    fingerprintRequestedAccess(value) {
      return rosterCrypto.fingerprint(value);
    },
  });

  const submissionEligibility = Object.freeze({
    async evaluate(input = {}) {
      const emailFingerprint = String(input.emailFingerprint ?? '').trim();
      const identityClassId = String(input.identityClassId ?? '').trim();
      if (!emailFingerprint || !classes.some((entry) => entry.id === identityClassId)) {
        return Object.freeze({ allowed: false });
      }
      const roster = await approvedRosterProfile({ rosterRepository, rosterCrypto, emailFingerprint });
      if (!roster) return Object.freeze({ allowed: false });
      const matchedClass = classForEmail(normalizeEmail(roster.profile.institutionalEmail), classes);
      if (matchedClass?.id !== identityClassId) return Object.freeze({ allowed: false });
      return Object.freeze({
        allowed: true,
        claimFingerprint: await rosterCrypto.fingerprint({
          emailFingerprint,
          identityClassId,
          requestedUsernameNormalized: String(input.requestedUsernameNormalized ?? ''),
          requestedAccessFingerprint: String(input.requestedAccessFingerprint ?? ''),
          rosterSourceFingerprint: String(roster.entry.sourceFingerprint ?? ''),
        }),
      });
    },
  });

  const reviewDisclosure = Object.freeze({
    async reveal(application) {
      const [protectedEmail, protectedProfile] = await Promise.all([
        rosterCrypto.decrypt(application?.protectedEmailEnvelope),
        rosterCrypto.decrypt(application?.protectedProfileEnvelope),
      ]);
      const verifiedEmail = normalizeEmail(protectedEmail?.institutionalEmail);
      const identityClassId = String(protectedEmail?.identityClassId ?? '').trim();
      if (
        !verifiedEmail ||
        identityClassId !== String(application?.identityClassId ?? '') ||
        (await rosterCrypto.identityKey(verifiedEmail)) !== application?.emailFingerprint
      ) {
        throw new Error('Protected application identity does not reconcile.');
      }
      const roster = await approvedRosterProfile({
        rosterRepository,
        rosterCrypto,
        emailFingerprint: application.emailFingerprint,
      });
      if (!roster || normalizeEmail(roster.profile.institutionalEmail) !== verifiedEmail) {
        throw new Error('Protected roster identity is unavailable.');
      }
      const legalName = String(protectedProfile?.legalName ?? '').trim();
      const contactNumber = String(protectedProfile?.contactNumber ?? '').trim();
      if (!legalName || !contactNumber) throw new Error('Protected applicant profile is invalid.');
      return Object.freeze({
        verifiedEmail,
        legalName,
        contactNumber,
        identityVerification: Object.freeze({
          rosterMatched: true,
          legalNameMatched:
            normalizeIdentityName(legalName) === normalizeIdentityName(roster.profile.displayName),
        }),
      });
    },
  });

  return Object.freeze({ identityProtection, reviewDisclosure, submissionEligibility });
}

function capabilityDenies(requestedAccess) {
  const denied = [];
  if (requestedAccess.lendingSelfService !== true) denied.push(CAPABILITIES.LENDING_CREATE);
  if (requestedAccess.internalLendingOperations !== true) {
    denied.push(
      CAPABILITIES.LENDING_APPROVE,
      CAPABILITIES.LENDING_HANDOFF,
      CAPABILITIES.LENDING_RETURN,
      CAPABILITIES.LENDING_USAGE_VIEW,
    );
  }
  if (requestedAccess.requestCenterAccess !== true) denied.push(CAPABILITIES.REQUEST_CREATE);
  return denied;
}

export function createAccountApplicationActivationHandoff({
  accessRepository,
  rosterRepository,
  rosterCrypto,
  passwordKdf,
  createId = () => globalThis.crypto.randomUUID(),
  createTemporaryPassword = secureTemporaryPassword,
  temporaryCredentialMs = 72 * 60 * 60 * 1000,
} = {}) {
  if (!accessRepository || !rosterRepository || !rosterCrypto || !passwordKdf) {
    throw new Error('Account-application activation adapters are required.');
  }
  if (!Number.isSafeInteger(temporaryCredentialMs) || temporaryCredentialMs <= 0) {
    throw new Error('The temporary credential duration is invalid.');
  }

  return Object.freeze({
    async prepare({ application, actor, approvedAt }) {
      const requested = application?.requestedAccess ?? {};
      const roster = await approvedRosterProfile({
        rosterRepository,
        rosterCrypto,
        emailFingerprint: String(application?.emailFingerprint ?? ''),
      });
      if (!roster) throw new Error('Protected roster eligibility is unavailable.');
      const accessIdNormalized = normalizeAccessId(
        await accessRepository.nextGeneratedAccessId(new Date(approvedAt).getUTCFullYear()),
      );
      if (!accessIdNormalized) throw new Error('The generated account code is invalid.');
      const baseAccount = {
        id: createId(),
        roleId: requested.requestedRoleId,
        committeeIds: requested.requestedCommitteeIds ?? [],
        defaultCommitteeId: requested.requestedCommitteeIds?.[0] ?? '',
        accessProfile: null,
      };
      const reference = await accessRepository.listAccessPolicyReferences();
      const normalized = normalizeAccessPolicy(
        {
          presetId: requested.requestedAccountType,
          roleId: requested.requestedRoleId,
          committeeIds: requested.requestedCommitteeIds ?? [],
          defaultCommitteeId: requested.requestedCommitteeIds?.[0] ?? '',
          workspaceIds: (requested.requestedWorkspaceIds ?? []).map((id) => String(id).toLowerCase()),
          capabilityGrants: [],
          capabilityDenies: capabilityDenies(requested),
          locationScopeIds: [],
          eventSeriesScopeIds: [],
          eventScopeIds: [],
        },
        { actorRoleId: actor?.roleId, reference, existingAccount: baseAccount },
      );
      if (!normalized.valid || normalized.account.roleId === ROLES.SYSTEM_OWNER) {
        throw new Error('The approved access policy is invalid.');
      }
      const temporaryPassword = createTemporaryPassword();
      const credential = await passwordKdf.hash(temporaryPassword);
      const expiresAt = new Date(new Date(approvedAt).getTime() + temporaryCredentialMs).toISOString();
      const account = normalized.account;
      return Object.freeze({
        starterAccount: Object.freeze({
          id: baseAccount.id,
          accessIdNormalized,
          collisionKey: accessIdCollisionKey(accessIdNormalized),
          roleId: account.roleId,
          committeeIds: account.committeeIds,
          defaultCommitteeId: account.defaultCommitteeId,
          accessProfile: account.accessProfile,
          temporaryCredential: Object.freeze({ ...credential, expiresAt, consumedAt: null }),
          createdAt: approvedAt,
          lendingEligible: requested.lendingSelfService === true,
          institutionId: String(roster.profile.studentId ?? ''),
          departmentId: '',
          profileDepartmentId: application.departmentId || '',
          usernameNormalized: application.requestedUsernameNormalized || '',
          verifiedEmailFingerprint: application.emailFingerprint,
          profileCourseId: application.courseId || '',
          profileYearLevel: application.yearLevel ?? null,
        }),
        privateHandoff: Object.freeze({
          accountCode: accessIdNormalized,
          temporaryPassword,
          expiresAt,
          delivery: 'APPROVED_PRIVATE_HANDOFF_REQUIRED',
        }),
      });
    },
  });
}

export function createAccountApplicationActivationLifecycle({
  applicationService,
  applicationRepository,
  rosterCrypto,
} = {}) {
  if (!applicationService || !applicationRepository || !rosterCrypto) {
    throw new Error('Account-application activation lifecycle adapters are required.');
  }

  async function reconcile({ account }) {
    const application = await applicationRepository.getApplicationByApprovedAccountId?.(account?.id);
    if (!application || application.state === ACCOUNT_APPLICATION_STATE.ACTIVE) {
      return Object.freeze({ linked: Boolean(application), reconciled: false });
    }
    if (application.state !== ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED) {
      throw new Error('The approved application is not activation eligible.');
    }
    await applicationService.activateApprovedApplication({
      actor: { id: account.id, activationCompleted: true },
      applicationId: application.id,
      expectedRevision: application.revision,
      clientRequestId: `account-activation:${account.id}`,
    });
    return Object.freeze({ linked: true, reconciled: true });
  }

  return Object.freeze({
    async validateProfile({ account, profile }) {
      const expected = String(account?.verifiedEmailFingerprint ?? '').trim();
      if (!expected) return true;
      const actual = await rosterCrypto.identityKey(normalizeEmail(profile?.email));
      return actual === expected;
    },
    complete: reconcile,
    reconcile,
  });
}
