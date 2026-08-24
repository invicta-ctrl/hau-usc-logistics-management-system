import { useEffect, useRef, useState, type ReactNode } from 'react';
import { User } from 'lucide-react';
import { ThemeToggle } from '../brand/ThemeToggle';
import { FrontendApiError, frontendBackend, type FrontendProfile } from '../../integration/backend';

type Field = { label: string; value: string };

function unavailable(value: string) {
  return value || 'Not available';
}

function DetailGrid({ fields }: { fields: Field[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2">
      {fields.map((field, index) => (
        <div
          key={field.label}
          className="px-5 py-4"
          style={{
            borderTop: index >= 2 ? '1px solid var(--border)' : 'none',
            borderLeft: index % 2 === 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: 'var(--muted-foreground)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {field.label}
          </p>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: 13,
              color: 'var(--foreground)',
              letterSpacing: -0.15,
              overflowWrap: 'anywhere',
            }}
          >
            {unavailable(field.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProfileSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-[12px] overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2
          style={{
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--foreground)',
            letterSpacing: -0.2,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: 'var(--muted-foreground)',
            letterSpacing: '0.4px',
            marginTop: 2,
          }}
        >
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}

function ProfileLoading() {
  return (
    <div
      className="max-w-[1180px] mx-auto px-5 md:px-8 py-8"
      aria-busy="true"
      aria-label="Loading account profile"
    >
      <p
        className="mb-6"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: 'var(--muted-foreground)',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
        }}
      >
        Account / Profile
      </p>
      <div
        className="rounded-[14px] p-6 flex items-center gap-5"
        style={{ background: '#40070a', border: '1px solid rgba(242,209,92,0.22)' }}
      >
        <div
          className="rounded-full animate-pulse"
          style={{ width: 72, height: 72, background: 'rgba(232,185,60,0.24)' }}
        />
        <div className="flex flex-col gap-3 w-full max-w-[340px]">
          <div
            className="rounded animate-pulse"
            style={{ height: 20, background: 'rgba(250,238,203,0.18)' }}
          />
          <div
            className="rounded animate-pulse"
            style={{ height: 12, width: '68%', background: 'rgba(250,238,203,0.12)' }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {[0, 1].map((card) => (
          <div
            key={card}
            className="rounded-[12px] p-5 animate-pulse"
            style={{ minHeight: 188, background: 'var(--card)', border: '1px solid var(--border)' }}
          />
        ))}
      </div>
      <p
        className="mt-5"
        role="status"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: 'var(--muted-foreground)',
          letterSpacing: '0.4px',
        }}
      >
        Loading account profile…
      </p>
    </div>
  );
}

export function ProfileRoute({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const [profile, setProfile] = useState<FrontendProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const requestRef = useRef<{ retryKey: number; promise: Promise<FrontendProfile> } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setProfile(null);

    if (!requestRef.current || requestRef.current.retryKey !== retryKey) {
      requestRef.current = { retryKey, promise: frontendBackend.profile() };
    }

    void requestRef.current.promise
      .then((next) => {
        if (active) setProfile(next);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof FrontendApiError
              ? reason.message
              : 'The account profile is temporarily unavailable.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryKey]);

  if (loading) return <ProfileLoading />;

  if (error || !profile) {
    return (
      <div className="max-w-[760px] mx-auto px-5 md:px-8 py-12">
        <section
          className="rounded-[12px] p-6"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          aria-labelledby="profile-unavailable-heading"
        >
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: 'var(--muted-foreground)',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            Account / Profile
          </p>
          <h1
            id="profile-unavailable-heading"
            className="mt-3"
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 32px)',
              color: 'var(--foreground)',
              letterSpacing: '-0.8px',
            }}
          >
            Profile unavailable
          </h1>
          <p
            role="alert"
            className="mt-3"
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: 14,
              color: 'var(--muted-foreground)',
              lineHeight: '22px',
            }}
          >
            {error ?? 'The account profile response was incomplete.'}
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="mt-6 rounded-[8px] px-4 py-2 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Retry profile
          </button>
        </section>
      </div>
    );
  }

  const personalFields: Field[] = [
    { label: 'Display name', value: profile.displayName },
    { label: 'Legal name', value: profile.legalName },
    { label: 'Verified email', value: profile.verifiedEmail || 'Not verified' },
    { label: 'Username', value: profile.username },
    { label: 'Contact number', value: profile.contactNumber },
    { label: 'Account code', value: profile.accountCode },
  ];
  const affiliationFields: Field[] = [
    { label: 'Institution', value: profile.affiliation.institutionId },
    {
      label: 'Department',
      value: profile.affiliation.departmentDisplayName || profile.affiliation.departmentId,
    },
    { label: 'Course', value: profile.affiliation.courseId },
    { label: 'Year level', value: profile.affiliation.yearLevel },
  ];

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-8 pb-10">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol
          className="flex items-center gap-2"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--muted-foreground)' }}
        >
          <li>Account</li>
          <li aria-hidden="true">/</li>
          <li style={{ color: 'var(--foreground)' }}>Profile</li>
        </ol>
      </nav>

      <section
        className="rounded-[14px] overflow-hidden mb-6"
        style={{ background: '#40070a', border: '1px solid rgba(242,209,92,0.22)' }}
        aria-labelledby="profile-heading"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 px-5 sm:px-6 py-6">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 72, height: 72, background: '#e8b93c' }}
            aria-label="Initials avatar"
            role="img"
          >
            <span
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#40070a',
              }}
            >
              {profile.avatar.initials}
            </span>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: '#f6e29a',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              account.profile
            </p>
            <h1
              id="profile-heading"
              style={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(22px, 3vw, 30px)',
                color: '#fff',
                letterSpacing: '-0.7px',
                overflowWrap: 'anywhere',
              }}
            >
              {profile.displayName}
            </h1>
            <p
              style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: '#f6e29a' }}
            >
              {profile.accessSummary.roleLabel} · Server-decided access scope
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-5 sm:px-6 pb-5">
          <span
            className="inline-flex items-center rounded-full px-3 py-1"
            style={{
              background: 'rgba(232,185,60,0.2)',
              color: '#e8b93c',
              border: '1px solid rgba(232,185,60,0.35)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.35px',
            }}
          >
            {profile.roleId}
          </span>
          <span
            className="inline-flex items-center rounded-full px-3 py-1"
            style={{
              color: 'rgba(250,238,203,0.72)',
              border: '1px solid rgba(242,209,92,0.18)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.35px',
            }}
          >
            {profile.accessSummary.scopeMode || 'Assigned scope'}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_292px] gap-6">
        <div className="flex flex-col gap-6">
          <ProfileSection
            title="Personal information"
            subtitle="Read-only · sourced from the authenticated profile contract"
          >
            <DetailGrid fields={personalFields} />
          </ProfileSection>

          <ProfileSection
            title="University Student Council information"
            subtitle="Read-only affiliation from the authenticated profile contract"
          >
            <DetailGrid fields={affiliationFields} />
          </ProfileSection>

          <ProfileSection
            title="Account and access"
            subtitle="Capabilities and workspaces are server-projected; this page does not change them."
          >
            <div className="px-5 py-4 flex flex-col gap-5">
              <div>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    color: 'var(--muted-foreground)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Capabilities
                </p>
                {profile.accessSummary.capabilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.accessSummary.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="inline-flex items-center rounded-[6px] px-2.5 py-1"
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10,
                          color: dark ? '#bbf7d0' : '#1f6b41',
                          background: dark ? 'rgba(74, 154, 104, 0.2)' : 'rgba(31,107,65,0.1)',
                          border: dark ? '1px solid rgba(187,247,208,0.3)' : '1px solid rgba(31,107,65,0.22)',
                          letterSpacing: '0.3px',
                        }}
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      fontSize: 13,
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    No server-projected capabilities are available.
                  </p>
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    color: 'var(--muted-foreground)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  Workspace scope
                </p>
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    fontSize: 13,
                    color: 'var(--foreground)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {profile.accessSummary.workspaceIds.length > 0
                    ? profile.accessSummary.workspaceIds.join(', ')
                    : 'No workspace assignments are available.'}
                </p>
                {profile.accessSummary.defaultWorkspaceId && (
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      color: 'var(--muted-foreground)',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Default workspace: {profile.accessSummary.defaultWorkspaceId}
                  </p>
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    color: 'var(--muted-foreground)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  Credential version
                </p>
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    fontSize: 13,
                    color: 'var(--foreground)',
                  }}
                >
                  {profile.credentialVersion}
                </p>
              </div>
            </div>
          </ProfileSection>

          <ProfileSection
            title="Preferences"
            subtitle="Theme is local to this browser; profile fields remain read-only."
          >
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--foreground)',
                  }}
                >
                  Theme
                </p>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    color: 'var(--muted-foreground)',
                    marginTop: 2,
                  }}
                >
                  {dark ? 'Dark' : 'Light'} · persists in this browser
                </p>
              </div>
              <ThemeToggle dark={dark} onToggle={onToggle} small />
            </div>
          </ProfileSection>
        </div>

        <aside className="flex flex-col gap-4">
          <ProfileSection title="Account record" subtitle="Current contract evidence">
            <div className="px-4 py-4 flex flex-col gap-4">
              <div>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    color: 'var(--muted-foreground)',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  Updated at
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    fontSize: 12,
                    color: 'var(--foreground)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {profile.updatedAt}
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    color: 'var(--muted-foreground)',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  Revision
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    fontSize: 12,
                    color: 'var(--foreground)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {profile.revision}
                </p>
              </div>
              {profile.committeeIds.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <p
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      color: 'var(--muted-foreground)',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Committee scope
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      fontSize: 12,
                      color: 'var(--foreground)',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {profile.committeeIds.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </ProfileSection>

          <section
            className="rounded-[12px] px-4 py-4 flex flex-col gap-3"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            role="note"
            aria-label="Portrait and biography unavailable"
          >
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color: 'var(--muted-foreground)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Contract-gated
            </p>
            <p
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 12,
                color: 'var(--muted-foreground)',
                lineHeight: '18px',
              }}
            >
              Portrait and biography are not available from the current profile contract. Initials are used as
              the supported fallback.
            </p>
            <div
              className="rounded-[8px] flex items-center justify-center"
              style={{ height: 72, background: 'var(--border)', border: '1px dashed var(--border)' }}
              aria-hidden="true"
            >
              <User size={20} strokeWidth={1} color="var(--muted-foreground)" />
            </div>
          </section>

          <section
            className="rounded-[12px] px-4 py-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            aria-labelledby="activity-heading"
          >
            <h2
              id="activity-heading"
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 13,
                color: 'var(--foreground)',
              }}
            >
              Account activity
            </h2>
            <p
              className="mt-2"
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 12,
                color: 'var(--muted-foreground)',
                lineHeight: '18px',
              }}
            >
              Activity history is unavailable because the current profile API does not provide an activity
              endpoint.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
