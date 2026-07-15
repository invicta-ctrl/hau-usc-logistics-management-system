import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const APPS_SCRIPT_RUNTIME_SOURCE =
  'globalThis.__HAU_RUNTIME_CONFIG__={backendMode:"apps-script",appEnvironment:String(document.body?.dataset?.appEnvironment||"").toUpperCase(),bootstrapContractVersion:Number(document.body?.dataset?.bootstrapContractVersion||1),compositeRequestsEnabled:document.body?.dataset?.compositeRequestsEnabled==="true",foodRequestsEnabled:document.body?.dataset?.foodRequestsEnabled==="true"};';

const INCLUDE_MARKERS = Object.freeze({
  appStyles: "<?!= include_('AppStyles'); ?>",
  appBody: "<?!= include_('AppBody'); ?>",
  appScript: "<?!= include_('AppScript'); ?>",
});
const REQUEST_ONLY_VALUE_MARKER = "<?= requestOnly ? 'true' : 'false' ?>";
const APP_ENVIRONMENT_VALUE_MARKER = '<?= appEnvironment ?>';
const BOOTSTRAP_CONTRACT_VERSION_VALUE_MARKER = '<?= bootstrapContractVersion ?>';
const COMPOSITE_REQUESTS_ENABLED_VALUE_MARKER = "<?= compositeRequestsEnabled ? 'true' : 'false' ?>";
const FOOD_REQUESTS_ENABLED_VALUE_MARKER = "<?= foodRequestsEnabled ? 'true' : 'false' ?>";

const TAG_NAME_CHAR = /[A-Za-z0-9:_-]/;
const ATTR_NAME_CHAR = /[^\s=/>]/;

function skipWhitespace(value, index) {
  let cursor = index;
  while (cursor < value.length && /\s/.test(value[cursor])) cursor += 1;
  return cursor;
}

function parseAttributes(raw, cursor, end) {
  const attributes = new Map();
  let index = cursor;
  while (index < end) {
    index = skipWhitespace(raw, index);
    if (index >= end || raw[index] === '/' || raw[index] === '>') break;
    const nameStart = index;
    while (index < end && ATTR_NAME_CHAR.test(raw[index])) index += 1;
    const name = raw.slice(nameStart, index).toLowerCase();
    if (!name) {
      index += 1;
      continue;
    }
    index = skipWhitespace(raw, index);
    let value = '';
    if (raw[index] === '=') {
      index = skipWhitespace(raw, index + 1);
      const quote = raw[index] === '"' || raw[index] === "'" ? raw[index] : '';
      if (quote) {
        index += 1;
        const valueStart = index;
        while (index < end && raw[index] !== quote) index += 1;
        value = raw.slice(valueStart, index);
        if (raw[index] === quote) index += 1;
      } else {
        const valueStart = index;
        while (index < end && !/[\s>]/.test(raw[index])) index += 1;
        value = raw.slice(valueStart, index);
      }
    }
    attributes.set(name, value);
  }
  return attributes;
}

function parseTagAt(source, start) {
  if (source[start] !== '<') return null;
  if (source.startsWith('<!--', start)) {
    const close = source.indexOf('-->', start + 4);
    return {
      type: 'comment',
      start,
      end: close === -1 ? source.length : close + 3,
      raw: source.slice(start, close === -1 ? source.length : close + 3),
    };
  }
  let cursor = start + 1;
  if (source[cursor] === '!' || source[cursor] === '?') {
    let quote = '';
    cursor += 1;
    while (cursor < source.length) {
      const char = source[cursor];
      if (quote) {
        if (char === quote) quote = '';
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '>') {
        cursor += 1;
        break;
      }
      cursor += 1;
    }
    return {
      type: 'declaration',
      start,
      end: cursor,
      raw: source.slice(start, cursor),
    };
  }

  let closing = false;
  if (source[cursor] === '/') {
    closing = true;
    cursor += 1;
  }
  cursor = skipWhitespace(source, cursor);
  const nameStart = cursor;
  while (cursor < source.length && TAG_NAME_CHAR.test(source[cursor])) cursor += 1;
  if (cursor === nameStart) return null;
  const name = source.slice(nameStart, cursor).toLowerCase();
  const attributesStart = cursor;
  let quote = '';
  while (cursor < source.length) {
    const char = source[cursor];
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      cursor += 1;
      break;
    }
    cursor += 1;
  }
  const end = cursor;
  const beforeClose = source.slice(start, end).replace(/>\s*$/, '').trimEnd();
  return {
    type: 'tag',
    name,
    closing,
    selfClosing: !closing && beforeClose.endsWith('/'),
    start,
    end,
    raw: source.slice(start, end),
    attributes: closing ? new Map() : parseAttributes(source, attributesStart, end - 1),
  };
}

function isRawTextClosingTag(source, index, tagName) {
  if (source[index] !== '<' || source[index + 1] !== '/') return false;
  const candidate = source.slice(index + 2, index + 2 + tagName.length);
  if (candidate.toLowerCase() !== tagName) return false;
  const next = source[index + 2 + tagName.length];
  return next === '>' || next === '/' || /\s/.test(next || '');
}

function findRawTextClosingTag(source, fromIndex, tagName) {
  let cursor = fromIndex;
  while (cursor < source.length) {
    const candidate = source.indexOf('<', cursor);
    if (candidate === -1) return -1;
    if (isRawTextClosingTag(source, candidate, tagName)) return candidate;
    cursor = candidate + 1;
  }
  return -1;
}

export function tokenizeHtml(source) {
  const tokens = [];
  let cursor = 0;
  let textStart = 0;
  const pushText = (end, type = 'text', context = '') => {
    if (end > textStart) {
      tokens.push({ type, context, start: textStart, end, raw: source.slice(textStart, end) });
    }
  };

  while (cursor < source.length) {
    const open = source.indexOf('<', cursor);
    if (open === -1) break;
    const tag = parseTagAt(source, open);
    if (!tag) {
      cursor = open + 1;
      continue;
    }
    pushText(open);
    tokens.push(tag);
    cursor = tag.end;
    textStart = cursor;

    if (
      tag.type === 'tag' &&
      !tag.closing &&
      !tag.selfClosing &&
      (tag.name === 'script' || tag.name === 'style')
    ) {
      const closeStart = findRawTextClosingTag(source, cursor, tag.name);
      if (closeStart === -1) {
        if (cursor < source.length) {
          tokens.push({
            type: 'raw-text',
            context: tag.name,
            start: cursor,
            end: source.length,
            raw: source.slice(cursor),
          });
        }
        tag.elementEnd = source.length;
        return tokens;
      }
      if (closeStart > cursor) {
        tokens.push({
          type: 'raw-text',
          context: tag.name,
          start: cursor,
          end: closeStart,
          raw: source.slice(cursor, closeStart),
        });
      }
      const closeTag = parseTagAt(source, closeStart);
      if (!closeTag || closeTag.type !== 'tag' || !closeTag.closing || closeTag.name !== tag.name) {
        throw new Error(`Invalid closing ${tag.name} tag.`);
      }
      tokens.push(closeTag);
      tag.elementEnd = closeTag.end;
      closeTag.elementStart = tag.start;
      cursor = closeTag.end;
      textStart = cursor;
    }
  }
  pushText(source.length);
  return tokens;
}

function oneElement(tokens, name, closing) {
  const matches = tokens.filter(
    (token) => token.type === 'tag' && token.name === name && token.closing === closing,
  );
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one ${closing ? 'closing' : 'opening'} <${name}> tag; found ${matches.length}.`,
    );
  }
  return matches[0];
}

function removeRanges(source, ranges) {
  if (!ranges.length) return source;
  const sorted = ranges
    .map(([start, end]) => [Math.max(0, start), Math.min(source.length, end)])
    .sort((left, right) => left[0] - right[0]);
  const merged = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
    else merged.push(range);
  }
  let output = '';
  let cursor = 0;
  for (const [start, end] of merged) {
    output += source.slice(cursor, start);
    cursor = end;
  }
  return output + source.slice(cursor);
}

function removeBuildReferences(section, location) {
  const tokens = tokenizeHtml(section);
  const ranges = [];
  for (const token of tokens) {
    if (token.type !== 'tag' || token.closing) continue;
    if (token.name === 'style') {
      throw new Error(
        `Inline <style> content is not allowed in the expanded ${location}; CSS must come from Vite assets.`,
      );
    }
    if (token.name === 'script') {
      const src = token.attributes.get('src');
      if (!src) {
        throw new Error(
          `Inline <script> content is not allowed in the expanded ${location}; JavaScript must come from Vite chunks.`,
        );
      }
      ranges.push([token.start, token.elementEnd ?? token.end]);
      continue;
    }
    if (token.name === 'link') {
      const rel = (token.attributes.get('rel') || '').toLowerCase().split(/\s+/);
      if (rel.includes('stylesheet')) ranges.push([token.start, token.end]);
    }
  }
  return removeRanges(section, ranges).trim();
}

export function splitExpandedSourceHtml(source) {
  if (source.includes('<?') || source.includes('?>')) {
    throw new Error('Expanded source HTML unexpectedly contains an Apps Script template delimiter.');
  }
  const tokens = tokenizeHtml(source);
  const htmlOpen = oneElement(tokens, 'html', false);
  const htmlClose = oneElement(tokens, 'html', true);
  const headOpen = oneElement(tokens, 'head', false);
  const headClose = oneElement(tokens, 'head', true);
  const bodyOpen = oneElement(tokens, 'body', false);
  const bodyClose = oneElement(tokens, 'body', true);
  if (!(
    htmlOpen.end <= headOpen.start &&
    headClose.end <= bodyOpen.start &&
    bodyClose.end <= htmlClose.start
  )) {
    throw new Error('Expanded source HTML has an invalid document order.');
  }
  const headInner = source.slice(headOpen.end, headClose.start);
  const bodyInner = source.slice(bodyOpen.end, bodyClose.start);
  return {
    doctype: source.slice(0, htmlOpen.start).trim() || '<!doctype html>',
    htmlOpen: htmlOpen.raw,
    headOpen: headOpen.raw,
    bodyOpen: bodyOpen.raw,
    head: removeBuildReferences(headInner, 'head'),
    body: removeBuildReferences(bodyInner, 'body'),
  };
}

export function escapeRawTextClosingTags(source, tagName) {
  return String(source).replace(new RegExp(`</${tagName}`, 'gi'), `<\\/${tagName}`);
}

function assertNoTemplateDelimiter(source, label) {
  if (source.includes('<?') || source.includes('?>')) {
    throw new Error(`${label} contains an Apps Script template delimiter.`);
  }
}

function normalizeSources(sources, label) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error(`At least one ${label} source is required.`);
  }
  return sources.map((source, index) => {
    const value = typeof source === 'string' ? source : String(source ?? '');
    if (!value.trim()) throw new Error(`${label} source ${index + 1} is empty.`);
    assertNoTemplateDelimiter(value, `${label} source ${index + 1}`);
    return value.trim();
  });
}

function indentBlock(source, spaces) {
  const prefix = ' '.repeat(spaces);
  return source
    .split('\n')
    .map((line) => (line ? `${prefix}${line.trimStart()}` : line))
    .join('\n');
}

function countOccurrences(source, needle) {
  let count = 0;
  let cursor = 0;
  while (cursor <= source.length - needle.length) {
    const found = source.indexOf(needle, cursor);
    if (found === -1) break;
    count += 1;
    cursor = found + needle.length;
  }
  return count;
}

function addRuntimeAttributes(bodyOpen) {
  if (/\sdata-request-only\s*=/i.test(bodyOpen)) {
    throw new Error('Expanded source body already defines data-request-only.');
  }
  if (/\sdata-app-environment\s*=/i.test(bodyOpen)) {
    throw new Error('Expanded source body already defines data-app-environment.');
  }
  if (/\sdata-bootstrap-contract-version\s*=/i.test(bodyOpen)) {
    throw new Error('Expanded source body already defines data-bootstrap-contract-version.');
  }
  if (/\sdata-composite-requests-enabled\s*=/i.test(bodyOpen)) {
    throw new Error('Expanded source body already defines data-composite-requests-enabled.');
  }
  if (/\sdata-food-requests-enabled\s*=/i.test(bodyOpen)) {
    throw new Error('Expanded source body already defines data-food-requests-enabled.');
  }
  const closingIndex = bodyOpen.lastIndexOf('>');
  if (closingIndex <= 0 || bodyOpen[closingIndex - 1] === '/') {
    throw new Error('Expanded source body opening tag is invalid.');
  }
  return `${bodyOpen.slice(0, closingIndex)} data-request-only="${REQUEST_ONLY_VALUE_MARKER}" data-app-environment="${APP_ENVIRONMENT_VALUE_MARKER}" data-bootstrap-contract-version="${BOOTSTRAP_CONTRACT_VERSION_VALUE_MARKER}" data-composite-requests-enabled="${COMPOSITE_REQUESTS_ENABLED_VALUE_MARKER}" data-food-requests-enabled="${FOOD_REQUESTS_ENABLED_VALUE_MARKER}"${bodyOpen.slice(closingIndex)}`;
}

export function createAppsScriptFiles({ expandedHtml, scriptSources, styleSources }) {
  const shell = splitExpandedSourceHtml(expandedHtml);
  const scripts = normalizeSources(scriptSources, 'JavaScript');
  const styles = normalizeSources(styleSources, 'CSS');
  const joinedScript = scripts.join('\n;\n');
  const joinedStyle = styles.join('\n');
  const safeScript = escapeRawTextClosingTags(joinedScript, 'script');
  const safeStyle = escapeRawTextClosingTags(joinedStyle, 'style');
  if (/<\/script/i.test(safeScript)) throw new Error('JavaScript remains unsafe for an HTML script element.');
  if (/<\/style/i.test(safeStyle)) throw new Error('CSS remains unsafe for an HTML style element.');

  const appBody = `${shell.body}\n`;
  const appStyles = `<style id="hau-app-styles">\n${safeStyle}\n</style>\n`;
  const appScript = `<script id="hau-app-script">\n${APPS_SCRIPT_RUNTIME_SOURCE}\nglobalThis.__HAU_APP_SCRIPT_LOADED__=true;\n${safeScript}\n</script>\n`;
  const bodyOpen = addRuntimeAttributes(shell.bodyOpen);
  const index = `${shell.doctype}\n${shell.htmlOpen}\n  ${shell.headOpen}\n${shell.head ? `${indentBlock(shell.head, 4)}\n` : ''}    ${INCLUDE_MARKERS.appStyles}\n  </head>\n  ${bodyOpen}\n    ${INCLUDE_MARKERS.appBody}\n    ${INCLUDE_MARKERS.appScript}\n  </body>\n</html>\n`;

  for (const [name, marker] of Object.entries(INCLUDE_MARKERS)) {
    if (countOccurrences(index, marker) !== 1) {
      throw new Error(`Apps Script Index.html must contain ${name} exactly once.`);
    }
  }
  new Function(`${APPS_SCRIPT_RUNTIME_SOURCE}\n${safeScript}`);
  return { index, appBody, appStyles, appScript };
}

function flattenRollupOutputs(result) {
  const outputs = Array.isArray(result) ? result : [result];
  return outputs.flatMap((entry) => entry?.output ?? []);
}

export function collectViteAssetSources(result) {
  const outputs = flattenRollupOutputs(result);
  const scriptChunks = outputs
    .filter((entry) => entry.type === 'chunk')
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
  const styleAssets = outputs
    .filter((entry) => entry.type === 'asset' && entry.fileName.toLowerCase().endsWith('.css'))
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
  if (scriptChunks.length !== 1) {
    throw new Error(`Expected one inlined JavaScript entry chunk; found ${scriptChunks.length}.`);
  }
  if (styleAssets.length < 1) throw new Error('Vite did not emit an application CSS asset.');
  return {
    scriptSources: scriptChunks.map((entry) => entry.code),
    styleSources: styleAssets.map((entry) =>
      typeof entry.source === 'string' ? entry.source : Buffer.from(entry.source).toString('utf8'),
    ),
  };
}

export async function createAppsScriptBundleFromProject() {
  const [{ build }, { authoritativeVisual }] = await Promise.all([
    import('vite'),
    import('./authoritative-visual-plugin.mjs'),
  ]);
  const sourceHtml = (await readFile(resolve('src/index.html'), 'utf8')).replace(/\r\n?/g, '\n');
  const visualPlugin = authoritativeVisual();
  const expandedHtml = await visualPlugin.transformIndexHtml(sourceHtml);
  const viteResult = await build({
    configFile: false,
    root: 'src',
    base: './',
    logLevel: 'error',
    plugins: [authoritativeVisual()],
    build: {
      write: false,
      emptyOutDir: false,
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000,
      modulePreload: { polyfill: false },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          entryFileNames: 'app.js',
          assetFileNames: 'assets/[name][extname]',
        },
      },
    },
  });
  const assets = collectViteAssetSources(viteResult);
  return createAppsScriptFiles({ expandedHtml, ...assets });
}

export function assembleAppsScriptTemplate(
  files,
  {
    requestOnly = false,
    appEnvironment = 'STAGING',
    bootstrapContractVersion = 2,
    compositeRequestsEnabled = false,
    foodRequestsEnabled = false,
  } = {},
) {
  const normalizedEnvironment = String(appEnvironment).trim().toUpperCase();
  if (!['STAGING', 'PRODUCTION'].includes(normalizedEnvironment)) {
    throw new Error('Apps Script environment must be STAGING or PRODUCTION.');
  }
  const normalizedBootstrapContractVersion = Number(bootstrapContractVersion);
  if (![1, 2].includes(normalizedBootstrapContractVersion)) {
    throw new Error('Apps Script bootstrap contract version must be 1 or 2.');
  }

  let assembled = files.index;
  const replacements = [
    [INCLUDE_MARKERS.appStyles, files.appStyles],
    [INCLUDE_MARKERS.appBody, files.appBody],
    [INCLUDE_MARKERS.appScript, files.appScript],
    [REQUEST_ONLY_VALUE_MARKER, requestOnly ? 'true' : 'false'],
    [APP_ENVIRONMENT_VALUE_MARKER, normalizedEnvironment],
    [BOOTSTRAP_CONTRACT_VERSION_VALUE_MARKER, String(normalizedBootstrapContractVersion)],
    [COMPOSITE_REQUESTS_ENABLED_VALUE_MARKER, compositeRequestsEnabled ? 'true' : 'false'],
    [FOOD_REQUESTS_ENABLED_VALUE_MARKER, foodRequestsEnabled ? 'true' : 'false'],
  ];
  for (const [marker, value] of replacements) {
    if (countOccurrences(assembled, marker) !== 1) {
      throw new Error(`Template marker ${marker} must appear exactly once before assembly.`);
    }
    assembled = assembled.replace(marker, () => value.trimEnd());
  }
  if (assembled.includes('<?') || assembled.includes('?>')) {
    throw new Error('Assembled Apps Script document still contains a template delimiter.');
  }
  return assembled;
}

function tagCounts(tokens, name) {
  return tokens.filter((token) => token.type === 'tag' && !token.closing && token.name === name).length;
}

export function analyzeAssembledDocument(document) {
  const tokens = tokenizeHtml(document);
  const bodyOpen = oneElement(tokens, 'body', false);
  const bodyClose = oneElement(tokens, 'body', true);
  const visibleBodyText = tokens
    .filter((token) => token.type === 'text' && token.start >= bodyOpen.end && token.end <= bodyClose.start)
    .map((token) => token.raw)
    .join(' ');
  const suspiciousVisibleText = visibleBodyText.match(
    /(?:globalThis\.|api_getBootstrapData|document\.addEventListener|=>|\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=|\bfunction\s+[A-Za-z_$][\w$]*\s*\(|\bclass\s+[A-Za-z_$][\w$]*\s*(?:extends\s+[A-Za-z_$][\w$]*\s*)?\{)/g,
  );
  return {
    scriptCount: tagCounts(tokens, 'script'),
    styleCount: tagCounts(tokens, 'style'),
    bodyCount: tagCounts(tokens, 'body'),
    suspiciousVisibleJavaScriptTokenCount: suspiciousVisibleText?.length ?? 0,
    visibleBodyText,
    tokens,
  };
}

function positionsOf(source, needle, caseInsensitive = false) {
  const haystack = caseInsensitive ? source.toLowerCase() : source;
  const target = caseInsensitive ? needle.toLowerCase() : needle;
  const positions = [];
  let cursor = 0;
  while (cursor <= haystack.length - target.length) {
    const found = haystack.indexOf(target, cursor);
    if (found === -1) break;
    positions.push(found);
    cursor = found + target.length;
  }
  return positions;
}

function sha256(source) {
  return createHash('sha256').update(source).digest('hex');
}

export function bundleDiagnostics(files) {
  const markers = ['<script', '</script', '<style', '</style', '<?', '?>'];
  return Object.fromEntries(
    Object.entries(files).map(([name, source]) => [
      name,
      {
        bytes: Buffer.byteLength(source),
        sha256: sha256(source),
        markers: Object.fromEntries(
          markers.map((marker) => {
            const positions = positionsOf(source, marker, marker.startsWith('<'));
            return [marker, { count: positions.length, positions }];
          }),
        ),
      },
    ]),
  );
}

export function extractRawTextElementContent(source, tagName, id) {
  const tokens = tokenizeHtml(source);
  const starts = tokens.filter(
    (token) =>
      token.type === 'tag' &&
      !token.closing &&
      token.name === tagName &&
      (!id || token.attributes.get('id') === id),
  );
  if (starts.length !== 1) {
    throw new Error(`Expected exactly one <${tagName}>${id ? `#${id}` : ''}; found ${starts.length}.`);
  }
  const start = starts[0];
  const raw = tokens.find(
    (token) => token.type === 'raw-text' && token.context === tagName && token.start === start.end,
  );
  return raw?.raw ?? '';
}
