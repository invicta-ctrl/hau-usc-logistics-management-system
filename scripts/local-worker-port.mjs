export const DEFAULT_LOCAL_WORKER_PORT = 8787;

export function resolveLocalWorkerPort(value = process.env.HAU_CLOUDFLARE_LOCAL_PORT) {
  if (value === undefined) return DEFAULT_LOCAL_WORKER_PORT;
  if (!/^(?:[1-9]\d{0,4})$/u.test(value)) {
    throw new Error('HAU_CLOUDFLARE_LOCAL_PORT must be an integer loopback port from 1024 through 65535.');
  }
  const port = Number(value);
  if (port < 1024 || port > 65535) {
    throw new Error('HAU_CLOUDFLARE_LOCAL_PORT must be an integer loopback port from 1024 through 65535.');
  }
  return port;
}

export function localWorkerBaseUrl(port = resolveLocalWorkerPort()) {
  return `http://127.0.0.1:${port}`;
}
