import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  FrontendAdminAccount,
  FrontendStaffActivityHistory,
  FrontendStaffDirectoryItem,
} from '../../integration/backend';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import {
  accountStateLabel,
  dateLabel,
  filterAdministrationAccounts,
  filterAdministrationStaff,
  humanize,
  WITHHELD_ACCESS_ID,
  WITHHELD_IDENTITY,
} from './administrationPresentation';

export type Fi10Tab = 'Accounts & access' | 'Staff directory' | 'Activity';
export type Fi10LoadState = 'loading' | 'ready' | 'denied' | 'unavailable';
export type ActivityLoadState = Fi10LoadState | 'selection';

type AdministrationRecordsPanelProps = {
  tab: Fi10Tab;
  accounts: readonly FrontendAdminAccount[];
  directory: readonly FrontendStaffDirectoryItem[];
  selectedAccount: FrontendAdminAccount | null;
  selectedStaff: FrontendStaffDirectoryItem | null;
  activity: FrontendStaffActivityHistory | null;
  activityState: ActivityLoadState;
  inspection: boolean;
  onSelectAccount: (account: FrontendAdminAccount) => void;
  onSelectStaff: (staff: FrontendStaffDirectoryItem) => void;
  onReviewActivity: (staff: FrontendStaffDirectoryItem) => void;
  onRetryActivity: () => void;
};

function useMobileAdministrationInspector() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 59.99rem)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 59.99rem)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return isMobile;
}

function RecordsState({
  kind,
  heading,
  detail,
  children,
}: {
  kind: string;
  heading: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <section className="administration-records-state">
      <p className="eye">{kind}</p>
      <h2>{heading}</h2>
      <p>{detail}</p>
      {children}
    </section>
  );
}

function SearchField({
  value,
  onChange,
  shown,
  total,
}: {
  value: string;
  onChange: (value: string) => void;
  shown: number;
  total: number;
}) {
  return (
    <div className="administration-records-search">
      <label>
        <span>Search this loaded page</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Name, access identity, role, or state"
          autoComplete="off"
        />
      </label>
      <p role="status" aria-live="polite">
        {shown} of {total} loaded {total === 1 ? 'record' : 'records'} shown
      </p>
    </div>
  );
}

function AccountInspector({ account }: { account: FrontendAdminAccount | null }) {
  return (
    <>
      <p className="eye">Read-only account record</p>
      <h2 id="administration-record-inspector-title">{account?.displayName || 'No account selected'}</h2>
      {account ? (
        <dl>
          <div>
            <dt>Access ID</dt>
            <dd>{account.accessId}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{humanize(account.roleId)}</dd>
          </div>
          <div>
            <dt>Account state</dt>
            <dd>{accountStateLabel(account)}</dd>
          </div>
          <div>
            <dt>Activation</dt>
            <dd>{account.firstLoginPending ? 'Pending activation' : 'No pending activation reported'}</dd>
          </div>
        </dl>
      ) : (
        <p className="administration-records-note">
          Select an account record to inspect its supported fields.
        </p>
      )}
      <section className="administration-records-boundary" aria-label="Account action boundary">
        <b>READ-ONLY RECORD</b>
        <p>
          Access, role, approval, and account-state changes remain in their assigned authorized workflows.
        </p>
      </section>
    </>
  );
}

function StaffInspector({
  staff,
  onReviewActivity,
}: {
  staff: FrontendStaffDirectoryItem | null;
  onReviewActivity: (staff: FrontendStaffDirectoryItem) => void;
}) {
  return (
    <>
      <p className="eye">Privacy-bound staff record</p>
      <h2 id="administration-record-inspector-title">
        {staff?.displayName || (staff ? WITHHELD_IDENTITY : 'No staff record selected')}
      </h2>
      {staff ? (
        <>
          <dl>
            <div>
              <dt>Access identity</dt>
              <dd>{staff.accessId || 'Withheld by directory policy'}</dd>
            </div>
            <div>
              <dt>Link state</dt>
              <dd>{humanize(staff.linkState)}</dd>
            </div>
            <div>
              <dt>Email state</dt>
              <dd>{humanize(staff.emailState)}</dd>
            </div>
            <div>
              <dt>Current assignments</dt>
              <dd>{staff.assignmentSummary.activeCount}</dd>
            </div>
            <div>
              <dt>Retained assignments</dt>
              <dd>{staff.assignmentSummary.historicalCount}</dd>
            </div>
            <div>
              <dt>Quarantined assignments</dt>
              <dd>{staff.assignmentSummary.quarantinedCount}</dd>
            </div>
            <div>
              <dt>Assignment provenance</dt>
              <dd>{humanize(staff.assignmentSummary.provenanceState)}</dd>
            </div>
          </dl>
          <button
            className="administration-records-activity-action"
            type="button"
            onClick={() => onReviewActivity(staff)}
          >
            Review retained activity
          </button>
        </>
      ) : (
        <p className="administration-records-note">
          Select a record to inspect its supported directory fields.
        </p>
      )}
      <section className="administration-records-boundary" aria-label="Directory privacy boundary">
        <b>PRIVACY-BOUND · READ-ONLY</b>
        <p>Contact details, birthdays, raw person identifiers, and roster editing are not exposed here.</p>
      </section>
    </>
  );
}

function ActivityPanel({
  activity,
  activityState,
  inspection,
  selectedStaff,
  onRetry,
}: Pick<AdministrationRecordsPanelProps, 'activity' | 'activityState' | 'inspection' | 'selectedStaff'> & {
  onRetry: () => void;
}) {
  return (
    <section className="administration-activity" data-fi10-activity="true">
      <header className="administration-records-section-header">
        <div>
          <p className="eye">Append-only activity</p>
          <h2>Retained staff account activity</h2>
        </div>
        <b>{inspection ? 'Sanitized preview · no live history' : 'One record per retained event'}</b>
      </header>
      {inspection ? (
        <p className="administration-records-note">
          Staff activity is unavailable in inspection mode. Use Administration to review authorized account
          activity.
        </p>
      ) : !selectedStaff || activityState === 'selection' ? (
        <p className="administration-records-note">
          Select a staff directory record to review its retained activity.
        </p>
      ) : activityState === 'loading' ? (
        <div
          className="administration-records-skeleton"
          aria-busy="true"
          aria-label="Loading selected staff activity"
        />
      ) : activityState === 'denied' ? (
        <RecordsState
          kind="Denied"
          heading="Activity history is not available to your account"
          detail="This message does not confirm whether an activity record exists."
        >
          <button type="button" onClick={onRetry}>
            Retry read-only load
          </button>
        </RecordsState>
      ) : activityState === 'unavailable' ? (
        <RecordsState
          kind="Unavailable"
          heading="Retained activity is temporarily unavailable"
          detail="No history was changed or removed."
        >
          <button type="button" onClick={onRetry}>
            Retry read-only load
          </button>
        </RecordsState>
      ) : !activity || activity.items.length === 0 ? (
        <p className="administration-records-note">
          No retained activity is available in the current response. The history remains append-only and
          read-only.
        </p>
      ) : (
        <ol className="administration-activity-list" aria-label="Retained staff account activity">
          {activity.items.map((entry, index) => (
            <li key={entry.occurredAt + entry.eventType + entry.actionCode + index}>
              <div className="administration-activity-primary">
                <b>{humanize(entry.actionCode)}</b>
                <span>{humanize(entry.eventType)}</span>
              </div>
              <dl>
                <div>
                  <dt>Occurred</dt>
                  <dd>{dateLabel(entry.occurredAt)}</dd>
                </div>
                <div>
                  <dt>State transition</dt>
                  <dd>
                    {humanize(entry.previousLinkState || entry.previousAssignmentState)} →{' '}
                    {humanize(entry.linkState || entry.assignmentState)}
                  </dd>
                </div>
                <div>
                  <dt>Effective from</dt>
                  <dd>{dateLabel(entry.newEffectiveFrom || entry.oldEffectiveFrom)}</dd>
                </div>
                <div>
                  <dt>Effective to</dt>
                  <dd>{dateLabel(entry.newEffectiveTo || entry.oldEffectiveTo)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
      <p className="administration-records-note">This view includes only authorized activity details.</p>
    </section>
  );
}

export function AdministrationRecordsPanel({
  tab,
  accounts,
  directory,
  selectedAccount,
  selectedStaff,
  activity,
  activityState,
  inspection,
  onSelectAccount,
  onSelectStaff,
  onReviewActivity,
  onRetryActivity,
}: AdministrationRecordsPanelProps) {
  const isMobile = useMobileAdministrationInspector();
  const inspectorRef = useRef<HTMLElement>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [accountQuery, setAccountQuery] = useState('');
  const [staffQuery, setStaffQuery] = useState('');
  const filteredAccounts = useMemo(
    () => filterAdministrationAccounts(accounts, accountQuery),
    [accountQuery, accounts],
  );
  const filteredStaff = useMemo(
    () => filterAdministrationStaff(directory, staffQuery),
    [directory, staffQuery],
  );
  const activeStaff = selectedStaff ?? directory[0] ?? null;
  const showInspector = !isMobile || inspectorOpen;

  useDialogFocusTrap({
    open: isMobile && inspectorOpen,
    dialogRef: inspectorRef,
    inertSelector: '[data-administration-modal-background]',
  });

  useEffect(() => {
    setInspectorOpen(false);
  }, [tab]);

  useEffect(() => {
    if (!isMobile) setInspectorOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !inspectorOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInspectorOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [inspectorOpen, isMobile]);

  if (tab === 'Activity') {
    return (
      <ActivityPanel
        activity={activity}
        activityState={activityState}
        inspection={inspection}
        selectedStaff={selectedStaff}
        onRetry={onRetryActivity}
      />
    );
  }

  const isAccountTab = tab === 'Accounts & access';
  const query = isAccountTab ? accountQuery : staffQuery;
  const shown = isAccountTab ? filteredAccounts.length : filteredStaff.length;
  const total = isAccountTab ? accounts.length : directory.length;

  return (
    <div className="administration-records">
      <section
        className="administration-records-master"
        data-administration-modal-background
        data-administration-records-background="true"
      >
        <header className="administration-records-section-header">
          <div>
            <p className="eye">{isAccountTab ? 'Account access' : 'Staff directory'}</p>
            <h2>{isAccountTab ? 'Assigned identity and access' : 'Authorized staff records'}</h2>
          </div>
          <b>{inspection ? 'Sample data' : 'Current authorized page'}</b>
        </header>
        <SearchField
          value={query}
          onChange={isAccountTab ? setAccountQuery : setStaffQuery}
          shown={shown}
          total={total}
        />
        {total === 0 ? (
          <p className="administration-records-note">
            {isAccountTab
              ? 'No account records are available in the current response.'
              : 'No staff records are available for this account.'}
          </p>
        ) : shown === 0 ? (
          <section className="administration-records-filtered-empty">
            <h3>No loaded records match this search</h3>
            <p>Clear the page search to return to the authorized records already loaded.</p>
            <button type="button" onClick={() => (isAccountTab ? setAccountQuery('') : setStaffQuery(''))}>
              Clear page search
            </button>
          </section>
        ) : isAccountTab ? (
          <ol className="administration-record-list" aria-label="Authorized account records">
            {filteredAccounts.map((account) => (
              <li key={account.accessId} data-administration-account-record>
                <button
                  type="button"
                  data-administration-account-open
                  aria-pressed={selectedAccount?.accessId === account.accessId}
                  onClick={() => {
                    onSelectAccount(account);
                    if (isMobile) setInspectorOpen(true);
                  }}
                >
                  <span className="administration-record-list__identity">
                    <b>{account.displayName}</b>
                    <span>{account.accessId}</span>
                  </span>
                  <span>{humanize(account.roleId)}</span>
                  <em>{accountStateLabel(account)}</em>
                  <span className="administration-record-list__open">Open account record</span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="administration-record-list" aria-label="Authorized staff records">
            {filteredStaff.map((staff, index) => (
              <li key={staff.opaquePersonId} data-administration-staff-record>
                <button
                  type="button"
                  data-administration-staff-open
                  aria-label={`Open staff record ${index + 1}`}
                  aria-pressed={activeStaff?.opaquePersonId === staff.opaquePersonId}
                  onClick={() => {
                    onSelectStaff(staff);
                    if (isMobile) setInspectorOpen(true);
                  }}
                >
                  <span className="administration-record-list__identity">
                    <b>{staff.displayName || WITHHELD_IDENTITY}</b>
                    <span>{staff.accessId || WITHHELD_ACCESS_ID}</span>
                  </span>
                  <span>{humanize(staff.linkState)}</span>
                  <em>{staff.assignmentSummary.activeCount} current</em>
                  <span className="administration-record-list__open">Open staff record</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
      {showInspector ? (
        <aside
          ref={inspectorRef}
          className={`administration-records-inspector${isMobile ? ' administration-records-inspector--mobile' : ''}`}
          role={isMobile ? 'dialog' : 'complementary'}
          aria-modal={isMobile ? true : undefined}
          aria-labelledby="administration-record-inspector-title"
          tabIndex={isMobile ? -1 : undefined}
        >
          {isMobile ? (
            <button
              className="administration-records-inspector__back"
              type="button"
              data-dialog-initial-focus
              onClick={() => setInspectorOpen(false)}
            >
              Back to records
            </button>
          ) : null}
          {isAccountTab ? (
            <AccountInspector account={selectedAccount ?? accounts[0] ?? null} />
          ) : (
            <StaffInspector staff={activeStaff} onReviewActivity={onReviewActivity} />
          )}
        </aside>
      ) : null}
    </div>
  );
}
