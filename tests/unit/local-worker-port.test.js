import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCAL_WORKER_PORT,
  localWorkerBaseUrl,
  resolveLocalWorkerPort,
} from '../../scripts/local-worker-port.mjs';

describe('local Worker port resolver', () => {
  it('keeps 8787 as the default loopback-only harness port', () => {
    expect(resolveLocalWorkerPort(undefined)).toBe(DEFAULT_LOCAL_WORKER_PORT);
    expect(localWorkerBaseUrl(DEFAULT_LOCAL_WORKER_PORT)).toBe('http://127.0.0.1:8787');
  });

  it('accepts a valid opt-in alternate port and preserves the loopback origin', () => {
    expect(resolveLocalWorkerPort('8788')).toBe(8788);
    expect(localWorkerBaseUrl(8788)).toBe('http://127.0.0.1:8788');
  });

  it.each(['', '0', '1023', '65536', '8788.5', 'localhost', '127.0.0.1:8788'])(
    'rejects invalid local Worker port %j',
    (value) => {
      expect(() => resolveLocalWorkerPort(value)).toThrow(/integer loopback port/u);
    },
  );
});
