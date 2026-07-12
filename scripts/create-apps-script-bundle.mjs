import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = await readFile(resolve('dist/index.html'), 'utf8');
const runtimeConfiguration =
  '<script>globalThis.__HAU_RUNTIME_CONFIG__={backendMode:"apps-script",appEnvironment:"STAGING"};</script>';
const output = source.replace('<head>', `<head>${runtimeConfiguration}`);

await mkdir(resolve('apps-script'), { recursive: true });
await writeFile(resolve('apps-script/Index.html'), output);
console.log('Created apps-script/Index.html for clasp staging deployment.');

