import { describe, expect, it } from 'vitest';
import {
  canonicalUsername,
  isGovernedUsername,
  RESERVED_USERNAMES,
  usernamePolicyIssue,
} from '../../src/domain/username.js';

describe('governed username policy', () => {
  it('stores accepted usernames in lowercase canonical form', () => {
    expect(canonicalUsername('  Synthetic.User-01  ')).toBe('synthetic.user-01');
    expect(isGovernedUsername('Synthetic.User-01')).toBe(true);
  });

  it.each([
    'abc',
    'a'.repeat(33),
    '.synthetic',
    'synthetic.',
    'synthetic..user',
    'synthetic_-user',
    'synthetic user',
    'synthetic@user',
  ])('rejects invalid format %s', (username) => {
    expect(usernamePolicyIssue(username)).toBe('FORMAT');
  });

  it('blocks reserved names explicitly', () => {
    expect(RESERVED_USERNAMES.has('administrator')).toBe(true);
    expect(usernamePolicyIssue('Administrator')).toBe('RESERVED');
    expect(isGovernedUsername('administrator')).toBe(false);
  });
});
