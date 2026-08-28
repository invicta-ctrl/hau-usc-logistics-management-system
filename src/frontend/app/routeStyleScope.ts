/**
 * Embedded route styles are intentionally retained for Make-v44 parity, but a
 * route must never style the surrounding authenticated shell or Preview Index.
 * Keep each route's root-token rules outside the scope, then contain the
 * route-local selectors (including its responsive rules) beneath that root.
 */
export function scopeRouteCss(
  rootSelector: '.adm' | '.rel' | '.sup',
  css: string,
  leadingLocalSelectors: readonly string[] = [],
) {
  let source = css;
  for (const selector of leadingLocalSelectors) {
    source = source.replaceAll(selector, `${rootSelector} ${selector}`);
  }

  const rootRuleEnd = `${rootSelector} button:disabled{opacity:.45}`;
  const rootRuleAt = source.indexOf(rootRuleEnd);
  if (rootRuleAt < 0) {
    throw new Error(`Missing route-style root boundary for ${rootSelector}`);
  }

  const boundary = rootRuleAt + rootRuleEnd.length;
  const localRules = source
    .slice(boundary)
    // Once inside @scope, a second copy of the root selector no longer selects
    // the scope root. Convert post-boundary rooted rules so desktop and mobile
    // descendants retain their intended route-local behavior.
    .replaceAll(`${rootSelector}{`, ':scope{')
    .replaceAll(`${rootSelector} `, ':scope ');

  return `${source.slice(0, boundary)}@scope (${rootSelector}){${localRules}}`;
}
