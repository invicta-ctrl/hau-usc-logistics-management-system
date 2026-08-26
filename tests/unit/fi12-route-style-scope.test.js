import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scopeRouteCss } from '../../src/frontend/app/routeStyleScope.ts';

const routeMounts = [
  ['.adm', 'src/frontend/app/AdministrationRoute.tsx'],
  ['.rel', 'src/frontend/app/ReleaseDeskRoute.tsx'],
  ['.sup', 'src/frontend/app/SupplyRoutes.tsx'],
];

function fixture(root) {
  return `${root}{color:canvas}${root} button:disabled{opacity:.45}header{margin-top:22px}@media(max-width:768px){${root}{padding:14px}header{display:block}}`;
}

describe('FI-12 route-style containment', () => {
  it.each(routeMounts)('contains local selectors below %s without losing its responsive root rule', (root) => {
    const scoped = scopeRouteCss(root, fixture(root));
    expect(scoped).toContain(`@scope (${root}){header{margin-top:22px}`);
    expect(scoped).toContain('@media(max-width:768px){:scope{padding:14px}header{display:block}}');
    expect(scoped).not.toContain(`${root}}@scope`);
  });

  it.each(routeMounts)('%s is used by its route-owned style mount', (root, file) => {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');
    expect(source).toContain(`scopeRouteCss("${root}", css`);
  });

  it('prefixes Supply’s event selectors that precede its root-token rules', () => {
    const scoped = scopeRouteCss('.sup', `.event-stack{display:grid}${fixture('.sup')}`, ['.event-stack']);
    expect(scoped).toContain('.sup .event-stack{display:grid}');
  });
});
