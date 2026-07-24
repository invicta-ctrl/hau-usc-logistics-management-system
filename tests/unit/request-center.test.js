import { describe, expect, it } from 'vitest';
import {
  isApprovedRequestCenterChoice,
  REQUEST_CENTER_CATEGORIES,
  REQUEST_CENTER_CHOICES,
  REQUEST_CENTER_UNITS,
} from '../../src/domain/request-center.js';

describe('authenticated Request Center governed choices', () => {
  it('preserves the exact approved venue, logistics, and equipment registries', () => {
    expect(REQUEST_CENTER_CHOICES[REQUEST_CENTER_CATEGORIES.VENUE]).toEqual([
      'University Theater',
      'PGN Auditorium',
      'PGN Function Room',
      'SJH Academic Hall',
      'Holy Guardian Angel Chapel',
      'Piazza',
      'Plaza San Jose',
      'Student Center',
      'IH Gymnasium',
      'IH Amphitheater',
      'Covered Court',
    ]);
    expect(REQUEST_CENTER_CHOICES[REQUEST_CENTER_CATEGORIES.LOGISTICS]).toEqual([
      'Philippine Flag',
      'School Flag',
      'Department Flag/s',
      'Monoblock Chairs',
      'Rostrum',
      'Platform',
      'Standing Boards',
      'Long Tables',
      'Small Tables',
      'Electric Fan/s',
      'Decorative Plant/s',
    ]);
    expect(REQUEST_CENTER_CHOICES[REQUEST_CENTER_CATEGORIES.EQUIPMENT]).toEqual([
      'Sound System',
      'Microphone',
      'Wireless Microphone',
      'Microphone Stand',
      'Extension Cord',
      'Projector',
      'Projector Screen',
      'LED Lights',
      'LED Wall',
    ]);
  });

  it('accepts only governed category/name pairs and approved units', () => {
    expect(isApprovedRequestCenterChoice('Equipment', 'Projector')).toBe(true);
    expect(isApprovedRequestCenterChoice('Logistics', 'Projector')).toBe(false);
    expect(isApprovedRequestCenterChoice('Other', 'Projector')).toBe(false);
    expect(REQUEST_CENTER_UNITS).toEqual([
      'piece',
      'set',
      'unit',
      'chair',
      'table',
      'facility',
      'day',
    ]);
  });
});
