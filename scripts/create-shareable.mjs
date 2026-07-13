import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('dist/index.html');
const destinations = Object.freeze([
  { file: 'HAU-USC_Logistics-Prototype-Shareable.html', portalMode: null },
  { file: 'HAU-USC_Logistics-Main-Hub-Shareable.html', portalMode: 'internal' },
  { file: 'HAU-USC_Logistics-Request-Center-Shareable.html', portalMode: 'request' },
  { file: 'HAU-USC_Logistics-Lending-Hub-Shareable.html', portalMode: 'lending' },
]);

function withPortalMode(html, portalMode) {
  if (!portalMode) return html;
  let replaced = false;
  const result = html.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    if (/\bdata-portal-mode\s*=/i.test(attributes)) {
      throw new Error('The standalone source already defines data-portal-mode.');
    }
    replaced = true;
    return `<body${attributes} data-portal-mode="${portalMode}">`;
  });
  if (!replaced) throw new Error('The standalone source is missing its body element.');
  return result;
}

const standalone = (await readFile(source, 'utf8'))
  .replace(/\r+\n/g, '\n')
  .replace(/[\t ]+$/gm, '');
await writeFile(source, standalone);
for (const destination of destinations) {
  await writeFile(resolve(destination.file), withPortalMode(standalone, destination.portalMode));
}

console.log(`Created ${destinations.length} standalone shareable HTML artifacts.`);
