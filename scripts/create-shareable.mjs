import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('dist/index.html');
const destination = resolve('HAU-USC_Logistics-Prototype-Shareable.html');

const standalone = (await readFile(source, 'utf8')).replace(/\r+\n/g, '\n');
await writeFile(source, standalone);
await writeFile(destination, standalone);

console.log('Created HAU-USC_Logistics-Prototype-Shareable.html');
