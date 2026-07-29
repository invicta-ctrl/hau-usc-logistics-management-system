import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function sanitizeLabel(value) {
  const normalized = String(value || 'command')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'command';
}

export function appendTail(current, chunk, limit) {
  const incoming = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
  if (incoming.length >= limit) return incoming.subarray(incoming.length - limit);
  const combined = Buffer.concat([current, incoming]);
  return combined.length > limit ? combined.subarray(combined.length - limit) : combined;
}

export function parseArgs(argv) {
  const separator = argv.indexOf('--');
  if (separator < 0 || separator === argv.length - 1) {
    throw new Error(
      'Usage: run-capped.mjs [--label NAME] [--success-bytes N] [--failure-bytes N] -- COMMAND [ARGS...]',
    );
  }
  const options = { label: 'command', successBytes: 4096, failureBytes: 12288 };
  for (let index = 0; index < separator; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === '--label') options.label = value;
    else if (key === '--success-bytes') options.successBytes = Number(value);
    else if (key === '--failure-bytes') options.failureBytes = Number(value);
    else throw new Error(`Unknown option: ${key}`);
    index += 1;
  }
  for (const [name, value] of [
    ['successBytes', options.successBytes],
    ['failureBytes', options.failureBytes],
  ]) {
    if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  }
  return { ...options, command: argv[separator + 1], args: argv.slice(separator + 2) };
}

export function buildWindowsCommandLine(command, args) {
  const tokens = [command, ...args].map((value) => String(value));
  for (const token of tokens) {
    if (!token || /[\r\n"&|<>^%!()]/.test(token)) {
      throw new Error('Windows .cmd/.bat commands reject empty tokens, quotes, and shell metacharacters');
    }
  }
  return tokens.map((token) => (/\s/.test(token) ? `"${token}"` : token)).join(' ');
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export async function runCapped(argv, cwd = process.cwd()) {
  const options = parseArgs(argv);
  const needsWindowsShell = process.platform === 'win32' && /\.(?:cmd|bat)$/i.test(options.command);
  const executable = needsWindowsShell
    ? buildWindowsCommandLine(options.command, options.args)
    : options.command;
  const childArgs = needsWindowsShell ? [] : options.args;
  const logs = path.join(cwd, '.codex', 'runtime', 'logs');
  fs.mkdirSync(logs, { recursive: true });
  const logPath = path.join(logs, `${timestamp()}-${sanitizeLabel(options.label)}.log`);
  const stream = fs.createWriteStream(logPath, { flags: 'wx' });
  const tailLimit = Math.max(options.successBytes, options.failureBytes);
  let tail = Buffer.alloc(0);

  const child = spawn(executable, childArgs, {
    cwd,
    shell: needsWindowsShell ? process.env.ComSpec || 'cmd.exe' : false,
    windowsHide: true,
  });
  const capture = (chunk) => {
    stream.write(chunk);
    tail = appendTail(tail, chunk, tailLimit);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);

  const result = await new Promise((resolve) => {
    child.once('error', (error) => {
      capture(Buffer.from(`${error.stack || error.message}\n`));
      resolve({ code: 127, signal: null });
    });
    child.once('close', (code, signal) => resolve({ code: code ?? 1, signal }));
  });
  await new Promise((resolve) => stream.end(resolve));

  const cap = result.code === 0 ? options.successBytes : options.failureBytes;
  const visible = tail.length > cap ? tail.subarray(tail.length - cap) : tail;
  if (visible.length) process.stdout.write(visible);
  if (visible.length && visible.at(-1) !== 10) process.stdout.write('\n');
  console.log(`run-capped: exit=${result.code}${result.signal ? ` signal=${result.signal}` : ''}`);
  console.log(`run-capped: full-log=${logPath}`);
  return result.code;
}

async function main() {
  try {
    process.exitCode = await runCapped(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
