import { describe, expect, it } from 'vitest';
import { AUTH_ROUTES } from '../../src/frontend/app/appRoutes';
import { isPreviewIndexHash, PREVIEW_INDEX_HASH } from '../../src/frontend/preview/index/routeHash';
import { projectPreviewIndexGate } from '../../src/frontend/preview/index/trustedGate';
import {
  ACCESS_REQUIREMENT,
  ACCESS_REQUIREMENT_LABELS,
  BACKEND_STATUS,
  BACKEND_STATUS_LABELS,
  IMPLEMENTATION_STATUS,
  IMPLEMENTATION_STATUS_LABELS,
  PREVIEW_FILTER,
  PREVIEW_FILTER_LABELS,
  PREVIEW_MODE,
  PREVIEW_MODE_LABELS,
  ROUTE_GROUP,
  ROUTE_GROUP_LABELS,
} from '../../src/frontend/preview/index/vocabulary';
import { listPreviewRoutes, PREVIEW_INDEX_REGISTRY } from '../../src/frontend/preview/index/registry';
import {
  filterPreviewRoutes,
  groupPreviewRoutes,
  searchPreviewRoutes,
} from '../../src/frontend/preview/index/selectors';

const PUBLIC_ROUTES = ['landing', 'request', 'tracking', 'borrow', 'staff-signin'];

describe('preview index trusted gate and registry foundations', () => {
  it('matches only the exact preview index hash and fails closed on variants', () => {
    expect(PREVIEW_INDEX_HASH).toBe('#/__preview/index');
    expect(isPreviewIndexHash('#/__preview/index')).toBe(true);

    for (const variant of [
      '#/__preview/index/',
      ' #/__preview/index',
      '#/__preview/Index',
      '#/__preview/INDEX',
      '#/__preview/index?x=1',
      '#/__preview/index#',
      'https://host/#/__preview/index',
      '/#/__preview/index',
      '',
    ]) {
      expect(isPreviewIndexHash(variant)).toBe(false);
    }
    for (const nonString of [null, undefined, 0, {}, [], true]) {
      expect(isPreviewIndexHash(nonString)).toBe(false);
    }
  });

  it('projects the trusted gate strictly from playground === true', () => {
    expect(projectPreviewIndexGate({ playground: true })).toEqual({
      validatedPlayground: true,
      indexAllowed: true,
    });
    expect(projectPreviewIndexGate({ playground: false })).toEqual({
      validatedPlayground: false,
      indexAllowed: false,
    });
  });

  it('defines a complete, exhaustive filter vocabulary', () => {
    expect(IMPLEMENTATION_STATUS).toEqual([
      'ACCEPTED',
      'IN_PROGRESS',
      'SURFACE_PREVIEW',
      'NOT_STARTED',
    ]);
    expect(BACKEND_STATUS).toEqual(['REAL_BACKEND', 'PARTIAL', 'VISUAL_ONLY']);
    expect(ACCESS_REQUIREMENT).toEqual(['PUBLIC', 'AUTHENTICATED']);
    expect(PREVIEW_MODE).toEqual(['REAL_MODULE', 'SURFACE_PREVIEW']);
    expect(ROUTE_GROUP).toEqual(['PUBLIC', 'STAFF', 'ADMINISTRATION']);

    expect(PREVIEW_FILTER).toEqual([
      'ALL',
      'ACCEPTED',
      'IN_PROGRESS',
      'BACKEND_WIRED',
      'PREVIEW_ONLY',
      'NOT_STARTED',
      'PUBLIC',
      'AUTHENTICATED',
    ]);
    expect(Object.keys(PREVIEW_FILTER_LABELS).sort()).toEqual([...PREVIEW_FILTER].sort());
    expect(PREVIEW_FILTER_LABELS.ALL).toBe('All');
    expect(PREVIEW_FILTER_LABELS.ACCEPTED).toBe('Accepted');
    expect(PREVIEW_FILTER_LABELS.IN_PROGRESS).toBe('In progress');
    expect(PREVIEW_FILTER_LABELS.BACKEND_WIRED).toBe('Backend-wired');
    expect(PREVIEW_FILTER_LABELS.PREVIEW_ONLY).toBe('Preview-only');
    expect(PREVIEW_FILTER_LABELS.NOT_STARTED).toBe('Not started');
    expect(PREVIEW_FILTER_LABELS.PUBLIC).toBe('Public');
    expect(PREVIEW_FILTER_LABELS.AUTHENTICATED).toBe('Authenticated');
  });

  it('exposes exact uppercase status and backend display labels', () => {
    expect(IMPLEMENTATION_STATUS_LABELS).toEqual({
      ACCEPTED: 'ACCEPTED',
      IN_PROGRESS: 'IN PROGRESS',
      SURFACE_PREVIEW: 'SURFACE PREVIEW',
      NOT_STARTED: 'NOT STARTED',
    });
    expect(BACKEND_STATUS_LABELS).toEqual({
      REAL_BACKEND: 'REAL BACKEND',
      PARTIAL: 'PARTIAL',
      VISUAL_ONLY: 'VISUAL ONLY',
    });
    expect(ACCESS_REQUIREMENT_LABELS.PUBLIC).toBe('Public');
    expect(ACCESS_REQUIREMENT_LABELS.AUTHENTICATED).toBe('Authenticated');
    expect(PREVIEW_MODE_LABELS.REAL_MODULE).toBe('Real module');
    expect(PREVIEW_MODE_LABELS.SURFACE_PREVIEW).toBe('Surface preview');
    expect(ROUTE_GROUP_LABELS).toEqual({
      PUBLIC: 'Public',
      STAFF: 'Staff',
      ADMINISTRATION: 'Administration',
    });
  });

  it('registers exactly the live public and auth route inventories without duplicates', () => {
    const entries = listPreviewRoutes();
    const expectedRoutes = [...PUBLIC_ROUTES, ...AUTH_ROUTES].sort();

    expect(entries.map((entry) => entry.route).sort()).toEqual(expectedRoutes);
    expect(entries).toHaveLength(15);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
    expect(new Set(entries.map((entry) => entry.route)).size).toBe(entries.length);
    expect(entries.every((entry) => entry.id === entry.route)).toBe(true);
  });

  it('keeps every entry to the required fields and status vocabulary', () => {
    const requiredFields = [
      'id',
      'route',
      'label',
      'group',
      'description',
      'implementationStatus',
      'backendStatus',
      'access',
      'previewMode',
    ];
    for (const entry of listPreviewRoutes()) {
      for (const field of requiredFields) {
        expect(typeof entry[field], `${entry.route}.${field}`).toBe('string');
        expect(entry[field].length, `${entry.route}.${field}`).toBeGreaterThan(0);
      }
      expect(IMPLEMENTATION_STATUS).toContain(entry.implementationStatus);
      expect(BACKEND_STATUS).toContain(entry.backendStatus);
      expect(ACCESS_REQUIREMENT).toContain(entry.access);
      expect(PREVIEW_MODE).toContain(entry.previewMode);
      expect(ROUTE_GROUP).toContain(entry.group);
    }
  });

  it('records the honest current classifications and zero-count vocabularies', () => {
    const entries = listPreviewRoutes();
    const count = (predicate) => entries.filter(predicate).length;

    expect(count((entry) => entry.implementationStatus === 'ACCEPTED')).toBe(5);
    expect(count((entry) => entry.implementationStatus === 'SURFACE_PREVIEW')).toBe(10);
    expect(count((entry) => entry.implementationStatus === 'IN_PROGRESS')).toBe(0);
    expect(count((entry) => entry.implementationStatus === 'NOT_STARTED')).toBe(0);
    expect(count((entry) => entry.backendStatus === 'REAL_BACKEND')).toBe(5);
    expect(count((entry) => entry.backendStatus === 'PARTIAL')).toBe(0);
    expect(count((entry) => entry.backendStatus === 'VISUAL_ONLY')).toBe(10);
    expect(count((entry) => entry.access === 'PUBLIC')).toBe(5);
    expect(count((entry) => entry.access === 'AUTHENTICATED')).toBe(10);
    expect(count((entry) => entry.previewMode === 'REAL_MODULE')).toBe(5);
    expect(count((entry) => entry.previewMode === 'SURFACE_PREVIEW')).toBe(10);

    for (const route of PUBLIC_ROUTES) {
      expect(entries.find((entry) => entry.route === route)).toMatchObject({
        implementationStatus: 'ACCEPTED',
        backendStatus: 'REAL_BACKEND',
        access: 'PUBLIC',
        previewMode: 'REAL_MODULE',
      });
    }
    for (const route of AUTH_ROUTES) {
      expect(entries.find((entry) => entry.route === route)).toMatchObject({
        implementationStatus: 'SURFACE_PREVIEW',
        backendStatus: 'VISUAL_ONLY',
        access: 'AUTHENTICATED',
        previewMode: 'SURFACE_PREVIEW',
      });
    }
  });

  it('derives search, filter, and group results deterministically from the registry', () => {
    expect(searchPreviewRoutes('')).toHaveLength(15);
    expect(searchPreviewRoutes('   RELEASE   ').map((entry) => entry.route)).toEqual(['release']);
    expect(searchPreviewRoutes('does-not-exist')).toEqual([]);

    expect(filterPreviewRoutes('ALL')).toHaveLength(15);
    expect(filterPreviewRoutes('ACCEPTED').map((entry) => entry.route).sort()).toEqual(
      [...PUBLIC_ROUTES].sort(),
    );
    expect(filterPreviewRoutes('BACKEND_WIRED')).toHaveLength(5);
    expect(filterPreviewRoutes('PREVIEW_ONLY')).toHaveLength(10);
    expect(filterPreviewRoutes('IN_PROGRESS')).toEqual([]);
    expect(filterPreviewRoutes('NOT_STARTED')).toEqual([]);
    expect(filterPreviewRoutes('PUBLIC')).toHaveLength(5);
    expect(filterPreviewRoutes('AUTHENTICATED')).toHaveLength(10);

    const groups = groupPreviewRoutes();
    expect(groups.map((group) => group.group)).toEqual(['PUBLIC', 'STAFF', 'ADMINISTRATION']);
    expect(groups.find((group) => group.group === 'PUBLIC').items).toHaveLength(5);
    expect(groups.find((group) => group.group === 'STAFF').items).toHaveLength(8);
    expect(groups.find((group) => group.group === 'ADMINISTRATION').items).toHaveLength(2);
  });

  it('exposes an immutable registry and pure selectors without mutable fixtures', () => {
    expect(Object.isFrozen(PREVIEW_INDEX_REGISTRY)).toBe(true);
    expect(listPreviewRoutes().every((entry) => Object.isFrozen(entry))).toBe(true);

    const all = filterPreviewRoutes('ALL');
    expect(all).not.toBe(PREVIEW_INDEX_REGISTRY);
    expect(all).toEqual([...PREVIEW_INDEX_REGISTRY]);

    const subset = listPreviewRoutes().slice(0, 3);
    const subsetFiltered = filterPreviewRoutes('ALL', subset);
    expect(subsetFiltered).not.toBe(subset);
    expect(subsetFiltered).toEqual([...subset]);
  });
});
