import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  bundleDiagnostics,
  createAppsScriptBundleFromProject,
} from './apps-script-bundle-lib.mjs';

const [files, distIndex] = await Promise.all([
  createAppsScriptBundleFromProject(),
  readFile(resolve('dist/index.html'), 'utf8'),
]);
await mkdir(resolve('apps-script'), { recursive: true });
await Promise.all([
  writeFile(resolve('apps-script/Index.html'), files.index),
  writeFile(resolve('apps-script/AppBody.html'), files.appBody),
  writeFile(resolve('apps-script/AppStyles.html'), files.appStyles),
  writeFile(resolve('apps-script/AppScript.html'), files.appScript),
]);

console.log(
  JSON.stringify(
    {
      message: 'Created parser-safe split Apps Script bundle from separate Vite outputs.',
      nodeVersion: process.version,
      npmUserAgent: process.env.npm_config_user_agent ?? 'unknown',
      files: bundleDiagnostics({ distIndex, ...files }),
    },
    null,
    2,
  ),
);
