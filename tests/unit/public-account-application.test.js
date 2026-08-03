import { describe, expect, it, vi } from 'vitest';
import {
  consumeApplicationStatusToken,
  privateStatusUrl,
} from '../../src/visual/public-account-application.js';

describe('public account-application token boundary', () => {
  it('consumes the fragment into memory and removes it immediately without creating a query token', () => {
    const replaceState = vi.fn();
    const token = consumeApplicationStatusToken({
      locationValue: {
        hash: '#token=synthetic_private_status_token_9472',
        pathname: '/application-status',
        search: '?view=private',
      },
      historyValue: { state: { safe: true }, replaceState },
    });

    expect(token).toBe('synthetic_private_status_token_9472');
    expect(replaceState).toHaveBeenCalledWith({ safe: true }, '', '/application-status?view=private');
    expect(replaceState.mock.calls[0][2]).not.toContain('token');
  });

  it('builds the private status route with a fragment rather than a query parameter', () => {
    const url = privateStatusUrl('synthetic_private_status_token_9472', {
      origin: 'https://logistics.example.test',
    });
    expect(url).toBe(
      'https://logistics.example.test/application-status#token=synthetic_private_status_token_9472',
    );
    expect(url).not.toContain('?token=');
  });
});
