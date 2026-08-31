import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Camera, ShieldCheck, Trash2, User } from 'lucide-react';
import {
  DEFAULT_APPEARANCE,
  THEME_FAMILIES,
  THEME_FAMILY_LABELS,
  THEME_MODES,
  type AppearancePreference,
} from '../theme/themeContract';
import { FrontendApiError, frontendBackend, type FrontendProfile } from '../../integration/backend';

type Feedback = { tone: 'success' | 'error'; message: string } | null;

const fieldClass =
  'min-h-11 w-full rounded-[8px] border px-3 py-2.5 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]';
const buttonClass =
  'min-h-11 rounded-[8px] px-4 py-2.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]';

function requestId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function messageFrom(reason: unknown, fallback: string) {
  return reason instanceof FrontendApiError ? reason.message : fallback;
}

async function fileBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function formatProfileTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section
      className="rounded-[12px] overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2
          style={{
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            fontWeight: 650,
            fontSize: 15,
            color: 'var(--foreground)',
          }}
        >
          {title}
        </h2>
        <p
          className="mt-1"
          style={{
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            fontSize: 12,
            lineHeight: '18px',
            color: 'var(--muted-foreground)',
          }}
        >
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

function ReadOnlyGrid({ fields }: { fields: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <dt
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.7px',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
            }}
          >
            {field.label}
          </dt>
          <dd
            className="mt-1"
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: 13,
              overflowWrap: 'anywhere',
              color: 'var(--foreground)',
            }}
          >
            {field.value || 'Not available'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function FeedbackLine({ value }: { value: Feedback }) {
  if (!value) return null;
  return (
    <p
      role={value.tone === 'error' ? 'alert' : 'status'}
      className="rounded-[7px] px-3 py-2 text-[12px]"
      style={{
        background:
          value.tone === 'error'
            ? 'color-mix(in srgb, var(--theme-danger) 14%, var(--theme-surface))'
            : 'color-mix(in srgb, var(--theme-success) 14%, var(--theme-surface))',
        color: 'var(--theme-text)',
      }}
    >
      {value.message}
    </p>
  );
}

const darkGreen = '#1f6b41';

function ProfileLoading() {
  return (
    <div className="max-w-[1080px] mx-auto px-5 md:px-8 py-10" aria-busy="true">
      <p role="status" style={{ color: 'var(--muted-foreground)' }}>
        Loading your profile…
      </p>
    </div>
  );
}

export function ProfileRoute({
  dark,
  previewProfile,
  appearance = DEFAULT_APPEARANCE,
  onApplyAppearance,
  onSessionRevoked,
}: {
  dark: boolean;
  onToggle?: () => void;
  previewProfile?: FrontendProfile;
  appearance?: AppearancePreference;
  onApplyAppearance?: (appearance: AppearancePreference) => void;
  onSessionRevoked?: (message: string) => void;
}) {
  const preview = Boolean(previewProfile);
  const [profile, setProfile] = useState<FrontendProfile | null>(previewProfile ?? null);
  const [loading, setLoading] = useState(!previewProfile);
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [busy, setBusy] = useState('');
  const [contact, setContact] = useState(previewProfile?.contactNumber ?? '');
  const [username, setUsername] = useState(previewProfile?.username ?? '');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [correction, setCorrection] = useState({
    legalName: previewProfile?.legalName ?? '',
    contactNumber: previewProfile?.contactNumber ?? '',
    email: previewProfile?.verifiedEmail ?? '',
    reason: '',
  });
  const uploadRef = useRef<HTMLInputElement>(null);
  const profileRequestRef = useRef<{ retryKey: number; promise: Promise<FrontendProfile> } | null>(null);

  useEffect(() => {
    if (previewProfile) {
      setProfile(previewProfile);
      setLoading(false);
      setLoadError('');
      return;
    }
    let active = true;
    setLoading(true);
    setLoadError('');
    if (!profileRequestRef.current || profileRequestRef.current.retryKey !== retryKey) {
      profileRequestRef.current = { retryKey, promise: frontendBackend.profile() };
    }
    void profileRequestRef.current.promise
      .then((next) => {
        if (!active) return;
        setProfile(next);
        setAvatarFailed(false);
        setContact(next.contactNumber);
        setUsername(next.username);
        setCorrection({
          legalName: next.legalName,
          contactNumber: next.contactNumber,
          email: next.verifiedEmail,
          reason: '',
        });
        onApplyAppearance?.(next.appearance);
      })
      .catch((reason: unknown) => {
        if (active) setLoadError(messageFrom(reason, 'Your profile is temporarily unavailable.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onApplyAppearance, previewProfile, retryKey]);

  const updateProfile = (next: FrontendProfile) => {
    setProfile(next);
    setAvatarFailed(false);
    setContact(next.contactNumber);
    setUsername(next.username);
  };

  const run = async (key: string, action: () => Promise<void>, fallback: string) => {
    if (preview) return;
    setBusy(key);
    setFeedback((state) => ({ ...state, [key]: null }));
    try {
      await action();
    } catch (reason) {
      setFeedback((state) => ({
        ...state,
        [key]: { tone: 'error', message: messageFrom(reason, fallback) },
      }));
    } finally {
      setBusy('');
    }
  };

  if (loading) return <ProfileLoading />;
  if (loadError || !profile) {
    return (
      <div className="max-w-[720px] mx-auto px-5 md:px-8 py-12">
        <div role="alert">
          <Section title="Profile unavailable" subtitle={loadError || 'The profile response was incomplete.'}>
            <div className="p-5">
              <button
                type="button"
                className={buttonClass}
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                onClick={() => setRetryKey((value) => value + 1)}
              >
                Retry profile
              </button>
            </div>
          </Section>
        </div>
      </div>
    );
  }

  const avatarSource =
    profile.avatar.available && !avatarFailed
      ? `${profile.avatar.url}?v=${encodeURIComponent(profile.avatar.updatedAt)}`
      : '';

  const submitContact = (event: FormEvent) => {
    event.preventDefault();
    void run(
      'contact',
      async () => {
        const next = await frontendBackend.updateProfileContact({
          contactNumber: contact,
          expectedRevision: profile.revision,
          clientRequestId: requestId('profile-contact'),
        });
        updateProfile(next);
        setFeedback((state) => ({
          ...state,
          contact: { tone: 'success', message: 'Contact number updated.' },
        }));
      },
      'The contact number could not be updated.',
    );
  };

  const submitUsername = (event: FormEvent) => {
    event.preventDefault();
    void run(
      'username',
      async () => {
        const result = await frontendBackend.changeProfileUsername({
          username,
          currentPassword: usernamePassword,
          expectedRevision: profile.revision,
          clientRequestId: requestId('profile-username'),
        });
        if (!result.sessionsRevoked) throw new Error('Session revocation was not confirmed.');
        onSessionRevoked?.(`Username changed to ${result.username}. Sign in again to continue.`);
      },
      'The username could not be changed.',
    );
  };

  const submitPassword = (event: FormEvent) => {
    event.preventDefault();
    void run(
      'password',
      async () => {
        const result = await frontendBackend.changeProfilePassword({
          currentPassword,
          newPassword,
          confirmPassword,
          expectedRevision: profile.revision,
          clientRequestId: requestId('profile-password'),
        });
        if (!result.sessionsRevoked) throw new Error('Session revocation was not confirmed.');
        onSessionRevoked?.('Password changed successfully. Sign in again with your new password.');
      },
      'The password could not be changed.',
    );
  };

  const submitCorrection = (event: FormEvent) => {
    event.preventDefault();
    void run(
      'correction',
      async () => {
        const result = await frontendBackend.requestProfileIdentityCorrection({
          ...correction,
          clientRequestId: requestId('profile-correction'),
        });
        setCorrection((value) => ({ ...value, reason: '' }));
        setFeedback((state) => ({
          ...state,
          correction: { tone: 'success', message: `Correction request submitted · ${result.state}` },
        }));
      },
      'The correction request could not be submitted.',
    );
  };

  const changeAppearance = (preference: AppearancePreference) => {
    void run(
      'appearance',
      async () => {
        const next = await frontendBackend.updateProfileAppearance({
          ...preference,
          clientRequestId: requestId('profile-appearance'),
        });
        updateProfile(next);
        onApplyAppearance?.(preference);
        setFeedback((state) => ({
          ...state,
          appearance: {
            tone: 'success',
            message: `${THEME_FAMILY_LABELS[preference.family]} · ${preference.mode[0]}${preference.mode.slice(1).toLowerCase()} saved.`,
          },
        }));
      },
      'The appearance preference could not be saved.',
    );
  };

  const uploadAvatar = (file: File | undefined) => {
    if (!file) return;
    void run(
      'avatar',
      async () => {
        if (file.size > 750_000) throw new Error('Profile pictures must be no larger than 750 KB.');
        const next = await frontendBackend.uploadProfileAvatar({
          contentType: file.type,
          base64: await fileBase64(file),
          expectedRevision: profile.revision,
          clientRequestId: requestId('profile-avatar'),
        });
        updateProfile(next);
        setFeedback((state) => ({
          ...state,
          avatar: { tone: 'success', message: 'Profile picture updated.' },
        }));
        if (uploadRef.current) uploadRef.current.value = '';
      },
      'The profile picture could not be uploaded.',
    );
  };

  const removeAvatar = () => {
    void run(
      'avatar',
      async () => {
        const next = await frontendBackend.deleteProfileAvatar({
          expectedRevision: profile.revision,
          clientRequestId: requestId('profile-avatar-remove'),
        });
        updateProfile(next);
        setFeedback((state) => ({
          ...state,
          avatar: { tone: 'success', message: 'Profile picture removed.' },
        }));
      },
      'The profile picture could not be removed.',
    );
  };

  const disabled = (key: string) => preview || Boolean(busy && busy !== key) || busy === key;
  const inputStyle = {
    background: 'var(--background)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  };

  return (
    <div className="profile-workspace max-w-[1080px] mx-auto px-5 md:px-8 py-8 pb-12">
      <nav
        aria-label="Breadcrumb"
        className="mb-5"
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--muted-foreground)' }}
      >
        Account / Profile
      </nav>

      <section
        className="profile-workspace__identity rounded-[14px] px-5 sm:px-6 py-6 mb-6"
        style={{ background: '#40070a', border: '1px solid rgba(242,209,92,0.22)' }}
        aria-labelledby="profile-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0">
            <div
              className="rounded-full overflow-hidden flex items-center justify-center"
              style={{ width: 88, height: 88, background: '#e8b93c' }}
              role={avatarSource ? undefined : 'img'}
              aria-label={avatarSource ? undefined : `Initials ${profile.avatar.initials}`}
            >
              {avatarSource ? (
                <img
                  src={avatarSource}
                  alt={`Profile picture for ${profile.displayName}`}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <span style={{ fontSize: 26, fontWeight: 750, color: '#40070a' }}>
                  {profile.avatar.initials}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color: '#f6e29a',
                letterSpacing: '0.9px',
                textTransform: 'uppercase',
              }}
            >
              Authenticated profile
            </p>
            <h1
              id="profile-heading"
              className="mt-1"
              style={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                fontWeight: 750,
                fontSize: 'clamp(24px, 3vw, 32px)',
                color: '#fff',
                overflowWrap: 'anywhere',
              }}
            >
              {profile.displayName}
            </h1>
            <p className="mt-1" style={{ fontSize: 13, color: '#f6e29a' }}>
              {profile.accessSummary.roleLabel}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <label
                className={`${buttonClass} inline-flex items-center gap-2 cursor-pointer`}
                style={{ background: '#e8b93c', color: '#40070a' }}
              >
                <Camera size={15} /> {profile.avatar.available ? 'Replace picture' : 'Upload picture'}
                <input
                  ref={uploadRef}
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={disabled('avatar')}
                  onChange={(event) => uploadAvatar(event.target.files?.[0])}
                />
              </label>
              {profile.avatar.available && (
                <button
                  type="button"
                  className={`${buttonClass} inline-flex items-center gap-2`}
                  style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
                  disabled={disabled('avatar')}
                  onClick={removeAvatar}
                >
                  <Trash2 size={15} /> Remove picture
                </button>
              )}
            </div>
            <div className="mt-3">
              <FeedbackLine value={feedback.avatar} />
            </div>
          </div>
        </div>
      </section>

      <div className="profile-workspace__grid grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <Section title="Identity" subtitle="Institution-controlled details are read-only.">
            <ReadOnlyGrid
              fields={[
                { label: 'Legal name', value: profile.legalName },
                { label: 'Verified email', value: profile.verifiedEmail || 'Not verified' },
                { label: 'Institution', value: profile.affiliation.institutionId },
                {
                  label: 'Department / assignment',
                  value: profile.affiliation.departmentDisplayName || profile.affiliation.departmentId,
                },
                { label: 'Official role / position', value: profile.accessSummary.roleLabel },
                { label: 'Authorization scope', value: profile.accessSummary.scopeMode || 'Assigned scope' },
              ]}
            />
            <details className="px-5 py-4">
              <summary
                className="cursor-pointer text-[13px] font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                Legal name or identity details are incorrect
              </summary>
              <form className="mt-4 grid gap-3" onSubmit={submitCorrection}>
                <label htmlFor="profile-correction-name" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                  Proposed legal name
                </label>
                <input
                  id="profile-correction-name"
                  className={fieldClass}
                  style={inputStyle}
                  autoComplete="name"
                  value={correction.legalName}
                  onChange={(event) =>
                    setCorrection((value) => ({ ...value, legalName: event.target.value }))
                  }
                  disabled={preview}
                  required
                />
                <label htmlFor="profile-correction-contact" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                  Proposed contact number
                </label>
                <input
                  id="profile-correction-contact"
                  className={fieldClass}
                  style={inputStyle}
                  type="tel"
                  autoComplete="tel"
                  value={correction.contactNumber}
                  onChange={(event) =>
                    setCorrection((value) => ({ ...value, contactNumber: event.target.value }))
                  }
                  disabled={preview}
                  required
                />
                <label htmlFor="profile-correction-email" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                  Proposed email
                </label>
                <input
                  id="profile-correction-email"
                  className={fieldClass}
                  style={inputStyle}
                  type="email"
                  autoComplete="email"
                  value={correction.email}
                  onChange={(event) => setCorrection((value) => ({ ...value, email: event.target.value }))}
                  disabled={preview}
                  required
                />
                <label htmlFor="profile-correction-reason" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                  Correction reason
                </label>
                <textarea
                  id="profile-correction-reason"
                  className={fieldClass}
                  style={inputStyle}
                  rows={3}
                  maxLength={500}
                  value={correction.reason}
                  onChange={(event) => setCorrection((value) => ({ ...value, reason: event.target.value }))}
                  disabled={preview}
                  required
                />
                <FeedbackLine value={feedback.correction} />
                <button
                  className={buttonClass}
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  disabled={disabled('correction')}
                >
                  {busy === 'correction' ? 'Submitting…' : 'Submit correction request'}
                </button>
              </form>
            </details>
          </Section>

          <Section
            title="Account"
            subtitle="Your username is unique and changing it signs out active sessions."
          >
            <form className="p-5 grid gap-3" onSubmit={submitUsername}>
              <label htmlFor="profile-username" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                Username
              </label>
              <input
                id="profile-username"
                className={fieldClass}
                style={inputStyle}
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={preview}
                required
              />
              <label htmlFor="profile-username-password" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                Current password
              </label>
              <input
                id="profile-username-password"
                className={fieldClass}
                style={inputStyle}
                type="password"
                autoComplete="current-password"
                value={usernamePassword}
                onChange={(event) => setUsernamePassword(event.target.value)}
                disabled={preview}
                required
              />
              <FeedbackLine value={feedback.username} />
              <button
                className={buttonClass}
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                disabled={disabled('username')}
              >
                {busy === 'username' ? 'Changing…' : 'Change username'}
              </button>
            </form>
            <ReadOnlyGrid
              fields={[
                { label: 'Account code', value: profile.accountCode },
                { label: 'Authorization grants', value: profile.accessSummary.capabilities.join(', ') },
              ]}
            />
          </Section>

          <Section title="Contact" subtitle="Keep a current contact number for operational coordination.">
            <form className="p-5 grid gap-3" onSubmit={submitContact}>
              <label htmlFor="profile-contact-number" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                Contact number
              </label>
              <input
                id="profile-contact-number"
                className={fieldClass}
                style={inputStyle}
                type="tel"
                autoComplete="tel"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                disabled={preview}
                required
              />
              <FeedbackLine value={feedback.contact} />
              <button
                className={buttonClass}
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                disabled={disabled('contact')}
              >
                {busy === 'contact' ? 'Saving…' : 'Save contact number'}
              </button>
            </form>
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Appearance" subtitle="Theme family and display mode are saved separately to your account.">
            <div className="px-5 pt-5">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>
                Theme family
              </p>
            </div>
            <div className="px-5 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Theme family">
              {THEME_FAMILIES.map((family) => {
                const selected = (profile.appearance.family || appearance.family) === family;
                return (
                  <button
                    key={family}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={buttonClass}
                    style={{
                      background: selected ? 'var(--primary)' : 'var(--muted)',
                      color: selected ? 'var(--primary-foreground)' : 'var(--foreground)',
                      border: '1px solid var(--border)',
                    }}
                    disabled={disabled('appearance')}
                    onClick={() => changeAppearance({
                      family,
                      mode: profile.appearance.mode || appearance.mode,
                    })}
                  >
                    {THEME_FAMILY_LABELS[family]}
                  </button>
                );
              })}
            </div>
            <div className="px-5 pt-5">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>
                Display mode
              </p>
            </div>
            <div className="px-5 pt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Display mode">
              {THEME_MODES.map((mode) => {
                const selected = (profile.appearance.mode || appearance.mode) === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={buttonClass}
                    style={{
                      background: selected ? 'var(--primary)' : 'var(--muted)',
                      color: selected ? 'var(--primary-foreground)' : 'var(--foreground)',
                      border: '1px solid var(--border)',
                    }}
                    disabled={disabled('appearance')}
                    onClick={() => changeAppearance({
                      family: profile.appearance.family || appearance.family,
                      mode,
                    })}
                  >
                    {mode[0]}
                    {mode.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
            <div className="px-5 pb-5">
              <FeedbackLine value={feedback.appearance} />
            </div>
          </Section>

          <Section
            title="Security & Activity"
            subtitle="Change your password and review account security state."
          >
            <div
              className="px-5 py-4 flex items-start gap-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <ShieldCheck size={20} style={{ color: dark ? '#bbf7d0' : darkGreen }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
                  Credential version {profile.credentialVersion}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  Profile record updated {formatProfileTimestamp(profile.updatedAt)}
                </p>
              </div>
            </div>
            <form className="p-5 grid gap-3" onSubmit={submitPassword}>
              <label htmlFor="profile-current-password" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                Current password
              </label>
              <input
                id="profile-current-password"
                className={fieldClass}
                style={inputStyle}
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={preview}
                required
              />
              <label htmlFor="profile-new-password" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                New password
              </label>
              <input
                id="profile-new-password"
                className={fieldClass}
                style={inputStyle}
                type="password"
                autoComplete="new-password"
                aria-describedby="profile-password-requirements"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={preview}
                required
              />
              <label htmlFor="profile-confirm-password" className="text-[12px] font-medium" style={{ color: 'var(--foreground)' }}>
                Confirm new password
              </label>
              <input
                id="profile-confirm-password"
                className={fieldClass}
                style={inputStyle}
                type="password"
                autoComplete="new-password"
                aria-describedby="profile-password-requirements"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={preview}
                required
              />
              <p id="profile-password-requirements" className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Use 12–128 characters and include at least three of: uppercase, lowercase, number, or symbol.
              </p>
              <FeedbackLine value={feedback.password} />
              <button
                className={buttonClass}
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                disabled={disabled('password')}
              >
                {busy === 'password' ? 'Changing…' : 'Change password'}
              </button>
            </form>
          </Section>

          <section
            className="rounded-[12px] p-5 flex items-start gap-3"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            role="note"
          >
            <User size={20} style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-[12px] leading-5" style={{ color: 'var(--muted-foreground)' }}>
              A Playground reset restores the demo credential, profile picture, contact number, username, and
              appearance baseline.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
