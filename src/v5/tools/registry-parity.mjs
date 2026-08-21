/* Confirm that v4 preserves the accepted v3 route/state/navigation shape.
   Presentational icon names may evolve without weakening route parity. */

import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const v4Root = resolve(here, '..');
const v3Root = resolve(v4Root, '..', 'impeccable-whole-site-redesign-v3');

const load = async (root) => import(pathToFileURL(resolve(root, 'src', 'registry.js')).href);
const [v3, v4] = await Promise.all([load(v3Root), load(v4Root)]);
const navigationShape = (items) => items.map(({ id, label }) => ({ id, label }));

const registryShape = (mod) => ({
  surfaces: mod.SURFACES.map(({ id, name, group, tier, kind, states }) => ({
    id,
    name,
    group,
    tier,
    kind,
    states,
  })),
  groups: mod.GROUPS,
  nav: navigationShape(mod.NAV),
  navAdmin: navigationShape(mod.NAV_ADMIN),
  tabs: navigationShape(mod.TABS),
});

const expected = registryShape(v3);
const actual = registryShape(v4);
const pass = JSON.stringify(expected) === JSON.stringify(actual);
const stateCount = actual.surfaces.reduce((sum, surface) => sum + surface.states.length, 0);

console.log(
  JSON.stringify(
    {
      pass,
      surfaces: actual.surfaces.length,
      stateVariants: stateCount,
      operationsNav: actual.nav.length,
      administrationNav: actual.navAdmin.length,
      mobileTabs: actual.tabs.length,
    },
    null,
    2,
  ),
);

if (!pass) process.exitCode = 1;
