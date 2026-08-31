import type { FrontendAdminAccount, FrontendStaffDirectoryItem } from '../../integration/backend';

export const WITHHELD_IDENTITY = 'Identity withheld by directory policy';
export const WITHHELD_ACCESS_ID = 'Access identity withheld';

export function humanize(value: string) {
  return value
    ? value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Not reported';
}

export function dateLabel(value: string) {
  if (!value) return 'Not reported';
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat('en-PH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
}

export function accountStateLabel(account: FrontendAdminAccount) {
  if (account.locked) return 'Locked';
  if (account.firstLoginPending) return 'Pending activation';
  return humanize(account.status);
}

function normalized(value: string | null | undefined) {
  return (value ?? '').trim().toLocaleLowerCase('en');
}

export function filterAdministrationAccounts(accounts: readonly FrontendAdminAccount[], query: string) {
  const needle = normalized(query);
  if (!needle) return accounts;
  return accounts.filter((account) =>
    [account.displayName, account.accessId, account.roleId, account.status, accountStateLabel(account)].some(
      (value) => normalized(value).includes(needle),
    ),
  );
}

export function filterAdministrationStaff(directory: readonly FrontendStaffDirectoryItem[], query: string) {
  const needle = normalized(query);
  if (!needle) return directory;
  return directory.filter((staff) =>
    [
      staff.displayName ?? WITHHELD_IDENTITY,
      staff.accessId ?? WITHHELD_ACCESS_ID,
      staff.linkState,
      staff.emailState,
      staff.assignmentSummary.provenanceState,
    ].some((value) => normalized(value).includes(needle)),
  );
}
