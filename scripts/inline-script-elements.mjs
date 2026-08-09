export function findInlineScriptElements(html) {
  return [...String(html).matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script\s*>/giu)];
}
