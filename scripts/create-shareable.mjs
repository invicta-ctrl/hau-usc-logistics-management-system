import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { shareableModules } from './shareable-module-registry.mjs';

const source = resolve('dist/index.html');
const destination = resolve('HAU-USC_Logistics-Prototype-Shareable.html');
const moduleDirectory = resolve('shareable-html-modules');

function replaceRequired(html, from, to, label) {
  if (!html.includes(from)) throw new Error(`Cannot create shareable module: missing ${label}.`);
  return html.replace(from, to);
}

export function createModuleShareable(standalone, module) {
  let html = standalone;
  html = replaceRequired(
    html,
    '<html lang="en">',
    `<html lang="en" data-shareable-module="${module.id}">`,
    'root HTML element',
  );
  html = replaceRequired(
    html,
    '<title>HAU-USC Logistics Prototype</title>',
    `<title>HAU-USC Logistics - ${module.title}</title>`,
    'document title',
  );
  html = replaceRequired(html, '<body>', `<body data-default-view="${module.id}">`, 'body element');
  html = replaceRequired(
    html,
    '<button class="active" data-view="overview">',
    '<button data-view="overview">',
    'default active navigation button',
  );
  html = replaceRequired(
    html,
    '<section id="overview" class="view active">',
    '<section id="overview" class="view">',
    'default active view',
  );
  html = replaceRequired(
    html,
    `<button data-view="${module.id}">`,
    `<button class="active" data-view="${module.id}">`,
    `${module.id} navigation button`,
  );
  html = replaceRequired(
    html,
    `<section id="${module.id}" class="view">`,
    `<section id="${module.id}" class="view active">`,
    `${module.id} view`,
  );
  html = replaceRequired(
    html,
    '<h1 id="pageTitle">Operations Overview</h1>',
    `<h1 id="pageTitle">${module.title}</h1>`,
    'page heading',
  );
  return html.replace(/[ \t]+$/gm, '');
}

export async function generateShareableArtifacts() {
  const standalone = (await readFile(source, 'utf8')).replace(/\r+\n/g, '\n').replace(/[ \t]+$/gm, '');
  await writeFile(source, standalone);
  await writeFile(destination, standalone);

  if (moduleDirectory === resolve('.') || !moduleDirectory.endsWith('shareable-html-modules')) {
    throw new Error('Refusing to replace an unexpected shareable module directory.');
  }
  await rm(moduleDirectory, { recursive: true, force: true });
  await mkdir(moduleDirectory, { recursive: true });
  await Promise.all(
    shareableModules.map((module) =>
      writeFile(resolve(moduleDirectory, module.filename), createModuleShareable(standalone, module)),
    ),
  );

  console.log(
    `Created the all-in-one shareable and ${shareableModules.length} module shareables in shareable-html-modules/.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await generateShareableArtifacts();
}
