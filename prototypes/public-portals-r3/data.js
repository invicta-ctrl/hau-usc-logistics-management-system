/* Design fixture data for the R3 public portals prototype.
   NOT production data. Shapes mirror the payloads the real modules consume at
   production 0.8.2 / c316e047 so the prototype cannot drift from the contract
   without the drift being obvious. */

export const RELEASE = {
  environment: 'DESIGN PROTOTYPE',
  appVersion: '0.8.2',
  candidateSha: 'c316e047',
  schemaVersion: '30',
};

/* /api/public/lending/catalog */
export const LENDING_CATALOG = {
  uscDepartments: [
    'Office of the President',
    'Committee on Activities',
    'Committee on Finance',
    'Committee on Publications',
    'Department of Logistics',
  ],
  process: [
    'Browse the borrower-safe catalog and choose your items.',
    'Tell us who is borrowing and give the required details.',
    'Submit — the request starts For Review.',
    'Authorized staff check eligibility and availability.',
    'If approved, you are told when and where to claim.',
    'Return by the due date; condition is recorded on the ledger.',
  ],
  items: [
    {
      id: 'itm-0114', productId: 'LND-0114', name: 'Folding chair',
      category: 'Furniture', type: 'REUSABLE', availability: 'AVAILABLE',
      unit: 'piece', maximumQuantity: 20, defaultLoanDays: 7,
      description: 'Stackable steel-frame chair for assemblies and general activity seating.',
      dueDateRequired: true, acknowledgmentRequired: false,
      aliases: ['monobloc', 'seat'],
    },
    {
      id: 'itm-0088', productId: 'LND-0088', name: 'Trestle table',
      category: 'Furniture', type: 'REUSABLE', availability: 'LIMITED',
      unit: 'piece', maximumQuantity: 6, defaultLoanDays: 7,
      description: 'Folding table for registration counters and activity stations.',
      restrictions: 'Indoor use only. Two-person carry required.',
      dueDateRequired: true, acknowledgmentRequired: false,
      aliases: ['long table'],
    },
    {
      id: 'itm-0203', productId: 'LND-0203', name: 'Wireless microphone',
      category: 'Audio', type: 'REUSABLE', availability: 'ELIGIBILITY_REQUIRED',
      unit: 'set', maximumQuantity: 2, defaultLoanDays: 3,
      description: 'Handheld UHF microphone with receiver, batteries not included.',
      eligibility: 'Approved council activity with a named officer-in-charge.',
      handlingNotes: 'Return in the case with both antennae seated.',
      dueDateRequired: true, acknowledgmentRequired: true,
      aliases: ['mic', 'uhf'],
    },
    {
      id: 'itm-0450', productId: 'LND-0450', name: 'Extension cord, 10m',
      category: 'Power', type: 'REUSABLE', availability: 'AVAILABLE',
      unit: 'piece', maximumQuantity: 8, defaultLoanDays: 5,
      description: 'Heavy-duty 10-metre extension with four grounded outlets.',
      handlingNotes: 'Coil loosely; do not knot.',
      dueDateRequired: true, acknowledgmentRequired: false,
      aliases: ['extension', 'power cord'],
    },
    {
      id: 'itm-0512', productId: 'LND-0512', name: 'Whiteboard marker set',
      category: 'Supplies', type: 'CONSUMABLE', availability: 'AVAILABLE',
      unit: 'set', maximumQuantity: 4,
      description: 'Four-colour dry-erase marker set for committee sessions.',
      dueDateRequired: false, acknowledgmentRequired: false,
      aliases: ['marker', 'pen'],
    },
    {
      id: 'itm-0620', productId: 'LND-0620', name: 'Portable PA speaker',
      category: 'Audio', type: 'REUSABLE', availability: 'UNAVAILABLE',
      unit: 'unit', maximumQuantity: 1, defaultLoanDays: 2,
      description: 'Battery PA speaker with stand. Currently out for maintenance.',
      dueDateRequired: true, acknowledgmentRequired: true,
    },
  ],
};

export const BORROWER_TYPES = [
  { value: 'USC_STAFF', label: 'USC Staff / Officer', hint: 'Department or office borrower' },
  { value: 'ANGELITE', label: 'Angelite Student', hint: 'Academic borrower' },
];

/* Acknowledgments — exactly the five the lending module requires.
   `conditional` ones become required only when a selected item carries the rule. */
export const LENDING_ACKS = [
  { name: 'responsibilityAcknowledged', conditional: true,
    title: 'Responsibility acknowledgment',
    body: 'Required for the current selection — this item carries a governed acknowledgment rule.' },
  { name: 'dataUseAcknowledged',
    title: 'Privacy acknowledgment',
    body: 'I read the Privacy Notice and understand the data use, private review, governed retention, correction, and support paths.' },
  { name: 'acceptableUseAcknowledged',
    title: 'Acceptable Use acknowledgment',
    body: 'I will provide accurate authorized information and will not put secrets, unrelated sensitive data, or another person’s information in this request.' },
  { name: 'borrowerResponsibilityAcknowledged',
    title: 'Borrower responsibility',
    body: 'I understand this starts For Review and I must follow eligibility, pickup, care, condition, return, due-date, and correction instructions from authorized logistics staff.' },
  { name: 'evidenceConsentAcknowledged',
    title: 'Evidence and photo acknowledgment',
    body: 'If evidence is later requested through a protected workflow, I will share only relevant content I am authorized to provide and have consent for.' },
];

/* /api/public/request/options */
export const REQUEST_OPTIONS = {
  purposes: [
    { value: 'EVENT_ACTIVITY_SUPPORT', label: 'Event or activity support', hint: 'For an approved event series and sub-event.' },
    { value: 'OFFICE_INVENTORY_PANTRY', label: 'Office inventory or pantry', hint: 'For approved office inventory or pantry needs.' },
  ],
  requesterTypes: ['USC Officer', 'USC Staff', 'Committee Head', 'Department Representative'],
  organizations: [
    'Committee on Activities',
    'Committee on Finance',
    'Committee on Publications',
    'Office of the President',
  ],
  eventSeries: [
    { id: 'evs-01', name: 'General Assembly 2026–2027', events: [
      { id: 'evt-01', name: 'Day 1 — opening plenary' },
      { id: 'evt-02', name: 'Day 2 — committee sessions' },
    ]},
    { id: 'evs-02', name: 'Angelite Week 2026', events: [
      { id: 'evt-03', name: 'Opening rites' },
      { id: 'evt-04', name: 'Inter-college cup' },
    ]},
  ],
  stockAreas: ['Council pantry', 'Main office supplies', 'Publications store', 'Events store'],
  lineCategories: ['Furniture', 'Audio', 'Power', 'Supplies', 'Pantry'],
  units: ['piece', 'set', 'box', 'pack', 'unit'],
};

/* Exactly the four acknowledgments the request module requires. */
export const REQUEST_ACKS = [
  { name: 'reviewAcknowledged', title: 'Review acknowledgment',
    body: 'I understand this request starts For Review and that submitting it does not reserve stock or guarantee fulfilment.' },
  { name: 'dataUseAcknowledged', title: 'Privacy acknowledgment',
    body: 'I read the Privacy Notice and understand the data use, private review, governed retention, correction, and support paths.' },
  { name: 'acceptableUseAcknowledged', title: 'Acceptable Use acknowledgment',
    body: 'I will provide accurate authorized information and will not put secrets, unrelated sensitive data, or another person’s information in this request.' },
  { name: 'evidenceConsentAcknowledged', title: 'Evidence and photo acknowledgment',
    body: 'If evidence is later requested through a protected workflow, I will share only relevant content I am authorized to provide and have consent for.' },
];

export const REQUEST_STEPS = [
  'Request purpose',
  'Requester',
  'Context',
  'Request lines',
  'Review and submit',
];
