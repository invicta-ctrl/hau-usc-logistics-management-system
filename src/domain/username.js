export const USERNAME_MIN_LENGTH = 4;
export const USERNAME_MAX_LENGTH = 32;

export const RESERVED_USERNAMES = Object.freeze(
  new Set([
    'admin',
    'administrator',
    'anonymous',
    'api',
    'help',
    'mail',
    'owner',
    'postmaster',
    'root',
    'security',
    'support',
    'system',
    'undefined',
    'webmaster',
    'www',
  ]),
);

const USERNAME_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;

export function canonicalUsername(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US');
}

export function usernamePolicyIssue(value) {
  const username = canonicalUsername(value);
  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH ||
    !USERNAME_PATTERN.test(username)
  ) {
    return 'FORMAT';
  }
  if (RESERVED_USERNAMES.has(username)) return 'RESERVED';
  return '';
}

export function isGovernedUsername(value) {
  return usernamePolicyIssue(value) === '';
}
