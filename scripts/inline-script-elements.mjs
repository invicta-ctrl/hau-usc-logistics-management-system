const OPEN_SCRIPT = '<script';
const CLOSE_SCRIPT = '</script';

function isTagBoundary(character) {
  return character === '>' || (character !== undefined && /\s/u.test(character));
}

function findTagStart(lowerHtml, token, fromIndex) {
  let index = lowerHtml.indexOf(token, fromIndex);
  while (index >= 0 && !isTagBoundary(lowerHtml[index + token.length])) {
    index = lowerHtml.indexOf(token, index + token.length);
  }
  return index;
}

export function findInlineScriptElements(html) {
  const source = String(html);
  const lowerHtml = source.toLowerCase();
  const scripts = [];
  let cursor = 0;

  while (cursor < source.length) {
    const openStart = findTagStart(lowerHtml, OPEN_SCRIPT, cursor);
    if (openStart < 0) break;
    const openEnd = source.indexOf('>', openStart + OPEN_SCRIPT.length);
    if (openEnd < 0) break;
    const closeStart = findTagStart(lowerHtml, CLOSE_SCRIPT, openEnd + 1);
    if (closeStart < 0) break;
    const closeEnd = source.indexOf('>', closeStart + CLOSE_SCRIPT.length);
    if (closeEnd < 0) break;

    const match = [source.slice(openStart, closeEnd + 1), source.slice(openEnd + 1, closeStart)];
    match.index = openStart;
    scripts.push(match);
    cursor = closeEnd + 1;
  }

  return scripts;
}
