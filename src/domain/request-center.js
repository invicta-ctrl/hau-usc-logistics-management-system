export const REQUEST_CENTER_CATEGORIES = Object.freeze({
  VENUE: 'Venue / Facility',
  LOGISTICS: 'Logistics',
  EQUIPMENT: 'Equipment',
  OTHER: 'Other',
});

export const REQUEST_CENTER_CHOICES = Object.freeze({
  [REQUEST_CENTER_CATEGORIES.VENUE]: Object.freeze([
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
  ]),
  [REQUEST_CENTER_CATEGORIES.LOGISTICS]: Object.freeze([
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
  ]),
  [REQUEST_CENTER_CATEGORIES.EQUIPMENT]: Object.freeze([
    'Sound System',
    'Microphone',
    'Wireless Microphone',
    'Microphone Stand',
    'Extension Cord',
    'Projector',
    'Projector Screen',
    'LED Lights',
    'LED Wall',
  ]),
});

export const REQUEST_CENTER_UNITS = Object.freeze([
  'piece',
  'set',
  'unit',
  'chair',
  'table',
  'facility',
  'day',
]);

export function isApprovedRequestCenterChoice(category, name) {
  return REQUEST_CENTER_CHOICES[category]?.includes(name) === true;
}
