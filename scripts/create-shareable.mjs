import { copyFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('dist/index.html');
const destination = resolve('HAU-USC_Logistics-Prototype-Shareable.html');

await readFile(source, 'utf8');
await copyFile(source, destination);

console.log('Created HAU-USC_Logistics-Prototype-Shareable.html');
