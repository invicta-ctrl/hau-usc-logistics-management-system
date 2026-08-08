/* Sanitized illustrative data for the design preview.
   Nothing here is a real record. No real names, emails, phone numbers,
   student identifiers, supplier tax details, credentials, or provider
   resource ids appear. Organisation names are generic; person entries are
   role-labelled placeholders. Every figure shown in the interface is marked
   illustrative at the surface level. */

export const WORKSPACES = [
  { id: 'administrator', slug: 'admin', name: 'Administrator', sub: 'Control Centre' },
  { id: 'director', slug: 'director', name: 'Director', sub: 'Executive Overview' },
  { id: 'food', slug: 'food', name: 'Food Committee', sub: 'Sourcing and readiness' },
  { id: 'inventory-pantry', slug: 'inventory', name: 'Inventory Committee', sub: 'Stock and circulation' },
  { id: 'materials', slug: 'materials', name: 'Materials Committee', sub: 'Canvass and deliverables' },
];

export const SCOPES = [
  { id: 'ALL', name: 'All authorized operations', sub: 'Global authorized view' },
  { id: 'COM_FOOD', name: 'Food Committee', sub: 'Committee scope' },
  { id: 'COM_INVENTORY_PANTRY', name: 'Inventory and Pantry Committee', sub: 'Committee scope' },
  { id: 'COM_MATERIALS', name: 'Materials Committee', sub: 'Committee scope' },
  { id: 'EVT_DEMO_AURORA', name: 'Aurora Commons Week', sub: 'Illustrative event scope' },
];

export const ROLE_VIEWS = [
  { id: 'ADMINISTRATOR', name: 'Administrator' },
  { id: 'DIRECTOR', name: 'Director' },
  { id: 'COMMITTEE_HEAD', name: 'Committee Head' },
  { id: 'DOL_STAFF', name: 'DOL Staff' },
  { id: 'SYSTEM_OWNER', name: 'System Owner' },
  { id: 'REQUESTER', name: 'Requester' },
];

export const REQUESTS = [
  {
    ref: 'REQ-DEMO-431',
    title: 'Sound system and stage materials',
    org: 'Illustrative Executive Council',
    event: 'Aurora Commons Week · Route A',
    committee: 'COM_MATERIALS',
    status: 'FOR_REVIEW',
    lines: 6,
    routed: 0,
    needed: '2032-05-19',
    age: '2 days',
  },
  {
    ref: 'REQ-DEMO-430',
    title: 'Pantry restock for volunteer briefing',
    org: 'Illustrative Student Welfare Committee',
    event: 'Aurora Commons Week · Route B',
    committee: 'COM_FOOD',
    status: 'FOR_REVIEW',
    lines: 4,
    routed: 0,
    needed: '2032-05-18',
    age: '2 days',
  },
  {
    ref: 'REQ-DEMO-426',
    title: 'Printing and signage for registration',
    org: 'Illustrative Engineering Council',
    event: 'Aurora Commons Week · Route A',
    committee: 'COM_MATERIALS',
    status: 'FOR_CANVASSING',
    lines: 3,
    routed: 3,
    needed: '2032-05-17',
    age: '4 days',
  },
  {
    ref: 'REQ-DEMO-421',
    title: 'Monobloc chairs and folding tables',
    org: 'Illustrative Executive Council',
    event: 'Lantern Forum',
    committee: 'COM_INVENTORY_PANTRY',
    status: 'READY_TO_RELEASE',
    lines: 2,
    routed: 2,
    needed: '2032-05-12',
    age: '9 days',
  },
  {
    ref: 'REQ-DEMO-417',
    title: 'Cleaning supplies for venue turnover',
    org: 'Illustrative Facilities Committee',
    event: 'Lantern Forum',
    committee: 'COM_INVENTORY_PANTRY',
    status: 'PARTIALLY_RELEASED',
    lines: 5,
    routed: 5,
    needed: '2032-05-11',
    age: '11 days',
  },
  {
    ref: 'REQ-DEMO-410',
    title: 'Extension cords and power strips',
    org: 'Illustrative Business Council',
    event: 'Not linked',
    committee: 'COM_INVENTORY_PANTRY',
    status: 'WAITING_FOR_BUDGET',
    lines: 2,
    routed: 2,
    needed: '2032-05-24',
    age: '14 days',
  },
  {
    ref: 'REQ-DEMO-403',
    title: 'Refreshments for officer orientation',
    org: 'Illustrative Student Welfare Committee',
    event: 'North Star Welcome Lab',
    committee: 'COM_FOOD',
    status: 'COMPLETED',
    lines: 3,
    routed: 3,
    needed: '2032-05-04',
    age: '19 days',
  },
  {
    ref: 'REQ-DEMO-399',
    title: 'Tarpaulin reprint after design change',
    org: 'Illustrative Nursing Council',
    event: 'Aurora Commons Week · Route B',
    committee: 'COM_MATERIALS',
    status: 'REJECTED',
    lines: 1,
    routed: 1,
    needed: '2032-05-09',
    age: '21 days',
  },
];

export const REQUEST_LINES = [
  { item: 'Sound system (full set)', qty: 1, unit: 'set', route: 'ISSUE_FROM_STOCK', onHand: 2 },
  { item: 'Wireless microphone', qty: 4, unit: 'piece', route: 'ISSUE_FROM_STOCK', onHand: 6 },
  { item: 'Stage riser panel', qty: 8, unit: 'piece', route: 'PROCUREMENT_REQUIRED', onHand: 0 },
  { item: 'Extension cord, 10 m', qty: 6, unit: 'piece', route: 'ISSUE_FROM_STOCK', onHand: 11 },
  { item: 'Gaffer tape', qty: 4, unit: 'roll', route: 'PENDING_DECISION', onHand: 3 },
  { item: 'Cable ramp', qty: 4, unit: 'piece', route: 'PENDING_DECISION', onHand: 0 },
];

export const LOANS = [
  {
    ref: 'LOAN-DEMO-221',
    item: 'Portable PA system',
    borrower: 'Illustrative Education Council',
    kind: 'USC officer',
    status: 'OVERDUE',
    due: '2032-05-03',
    days: 4,
    evidence: true,
  },
  {
    ref: 'LOAN-DEMO-219',
    item: 'Folding table, 6 ft',
    borrower: 'Illustrative Sports Committee',
    kind: 'USC officer',
    status: 'OVERDUE',
    due: '2032-05-05',
    days: 2,
    evidence: true,
  },
  {
    ref: 'LOAN-DEMO-226',
    item: 'Projector and screen',
    borrower: 'Illustrative Arts Council',
    kind: 'USC staff',
    status: 'ON_LOAN',
    due: '2032-05-12',
    days: 0,
    evidence: true,
  },
  {
    ref: 'LOAN-DEMO-228',
    item: 'Tent, 10 × 10',
    borrower: 'Illustrative student organisation',
    kind: 'Student',
    status: 'READY_TO_CLAIM',
    due: '2032-05-14',
    days: 0,
    evidence: false,
  },
  {
    ref: 'LOAN-DEMO-229',
    item: 'Megaphone',
    borrower: 'Illustrative Student Welfare Committee',
    kind: 'USC officer',
    status: 'FOR_REVIEW',
    due: 'Not set',
    days: 0,
    evidence: false,
  },
  {
    ref: 'LOAN-DEMO-215',
    item: 'Monobloc chair (set of 20)',
    borrower: 'Illustrative Engineering Council',
    kind: 'USC officer',
    status: 'RETURNED',
    due: '2032-04-30',
    days: 0,
    evidence: true,
  },
];

export const RELEASES = [
  {
    ref: 'REQ-DEMO-421',
    title: 'Monobloc chairs and folding tables',
    recipient: 'Illustrative Executive Council',
    status: 'READY_TO_RELEASE',
    released: 0,
    total: 60,
  },
  {
    ref: 'REQ-DEMO-417',
    title: 'Cleaning supplies for venue turnover',
    recipient: 'Illustrative Facilities Committee',
    status: 'PARTIALLY_RELEASED',
    released: 18,
    total: 42,
  },
  {
    ref: 'REQ-DEMO-394',
    title: 'Registration kits',
    recipient: 'Illustrative Business Council',
    status: 'PARTIALLY_RELEASED',
    released: 90,
    total: 120,
  },
  {
    ref: 'REQ-DEMO-403',
    title: 'Refreshments for officer orientation',
    recipient: 'Illustrative Student Welfare Committee',
    status: 'COMPLETED',
    released: 75,
    total: 75,
  },
];

export const INVENTORY = [
  {
    ref: 'ITM-DEMO-156',
    name: 'Monobloc chair',
    category: 'EQUIPMENT',
    handling: 'Reusable Asset',
    onHand: 240,
    reserved: 60,
    unit: 'piece',
    status: 'ACTIVE',
    low: false,
  },
  {
    ref: 'ITM-DEMO-161',
    name: 'Folding table, 6 ft',
    category: 'EQUIPMENT',
    handling: 'Reusable Asset',
    onHand: 34,
    reserved: 12,
    unit: 'piece',
    status: 'ACTIVE',
    low: false,
  },
  {
    ref: 'ITM-DEMO-204',
    name: 'Extension cord, 10 m',
    category: 'EQUIPMENT',
    handling: 'Reusable Asset',
    onHand: 11,
    reserved: 6,
    unit: 'piece',
    status: 'ACTIVE',
    low: true,
  },
  {
    ref: 'ITM-DEMO-312',
    name: 'Bond paper, A4',
    category: 'OFFICE_SUPPLIES',
    handling: 'Consumable',
    onHand: 8,
    reserved: 0,
    unit: 'ream',
    status: 'ACTIVE',
    low: true,
  },
  {
    ref: 'ITM-DEMO-333',
    name: 'Disinfectant solution',
    category: 'CLEANING_SUPPLIES',
    handling: 'Consumable',
    onHand: 3,
    reserved: 2,
    unit: 'bottle',
    status: 'ACTIVE',
    low: true,
  },
  {
    ref: 'ITM-DEMO-398',
    name: 'Tarpaulin, 3 × 5 ft',
    category: 'PRINTING_SIGNAGE',
    handling: 'Consumable',
    onHand: 0,
    reserved: 0,
    unit: 'piece',
    status: 'ACTIVE',
    low: true,
  },
  {
    ref: 'ITM-DEMO-441',
    name: 'Instant coffee sachet',
    category: 'PANTRY_FOOD',
    handling: 'Consumable',
    onHand: 180,
    reserved: 24,
    unit: 'pack',
    status: 'ACTIVE',
    low: false,
  },
  {
    ref: 'ITM-DEMO-477',
    name: 'Portable PA system',
    category: 'EQUIPMENT',
    handling: 'Loanable',
    onHand: 2,
    reserved: 1,
    unit: 'set',
    status: 'ACTIVE',
    low: false,
  },
  {
    ref: 'ITM-DEMO-490',
    name: 'Storage crate (unclassified)',
    category: null,
    handling: 'Unverified',
    onHand: 14,
    reserved: 0,
    unit: 'piece',
    status: 'ACTIVE',
    low: false,
  },
];

export const LEDGER = [
  { date: '2032-05-07', type: 'ISSUE', ref: 'REQ-DEMO-417', actor: 'Inventory staff', qty: -18, balance: 11 },
  { date: '2032-05-05', type: 'RECEIPT', ref: 'RCV-DEMO-142', actor: 'Inventory staff', qty: 12, balance: 29 },
  { date: '2032-05-02', type: 'LOAN_RETURN', ref: 'LOAN-DEMO-215', actor: 'Lending desk', qty: 4, balance: 17 },
  { date: '2032-04-29', type: 'LOAN_OUT', ref: 'LOAN-DEMO-215', actor: 'Lending desk', qty: -4, balance: 13 },
  { date: '2032-04-22', type: 'ADJUSTMENT_OUT', ref: 'ADJ-DEMO-108', actor: 'Committee head', qty: -2, balance: 17 },
  { date: '2032-04-01', type: 'OPENING_BALANCE', ref: 'IMP-DEMO-101', actor: 'System', qty: 19, balance: 19 },
];

export const EVENTS = [
  {
    name: 'Aurora Commons Week',
    window: '1–2 June 2032',
    subEvents: 7,
    readiness: 62,
    requests: 9,
    status: 'ACTIVE',
  },
  {
    name: 'Lantern Forum',
    window: '12 May 2032',
    subEvents: 2,
    readiness: 88,
    requests: 4,
    status: 'ACTIVE',
  },
  {
    name: 'North Star Welcome Lab',
    window: '4 May 2032',
    subEvents: 3,
    readiness: 100,
    requests: 3,
    status: 'COMPLETED',
  },
];

export const ACTIVITY = [
  { time: '09:32', text: 'Request REQ-DEMO-431 submitted through the public Request Center', kind: 'Request' },
  { time: '09:15', text: 'Loan LOAN-DEMO-215 returned and stock restored', kind: 'Lending' },
  { time: '08:47', text: 'Receiving RCV-DEMO-142 recorded 12 items against ITM-DEMO-204', kind: 'Receiving' },
  { time: '08:30', text: 'Request REQ-DEMO-421 accepted and reserved', kind: 'Request' },
  { time: 'Yesterday', text: 'Partial release recorded for REQ-DEMO-417 (18 of 42)', kind: 'Release' },
  { time: 'Yesterday', text: 'Item ITM-DEMO-490 flagged as needing classification', kind: 'Inventory' },
];

export const PROCUREMENT = [
  { ref: 'CNV-DEMO-131', item: 'Stage riser panel', suppliers: 3, preferred: 'Illustrative Supplier B', status: 'FOR_CANVASSING' },
  { ref: 'CNV-DEMO-129', item: 'Tarpaulin, 3 × 5 ft', suppliers: 2, preferred: 'Not decided', status: 'WAITING_FOR_BUDGET' },
  { ref: 'CNV-DEMO-126', item: 'Cable ramp', suppliers: 4, preferred: 'Illustrative Supplier A', status: 'TO_BE_PROCURED' },
  { ref: 'CNV-DEMO-121', item: 'Registration kit folder', suppliers: 3, preferred: 'Illustrative Supplier C', status: 'PROCURED' },
];

export const RESTOCKING = [
  { ref: 'RST-DEMO-158', item: 'Bond paper, A4', requested: 20, received: 0, unit: 'ream', status: 'TO_BE_PROCURED' },
  { ref: 'RST-DEMO-157', item: 'Disinfectant solution', requested: 24, received: 12, unit: 'bottle', status: 'PARTIALLY_RECEIVED' },
  { ref: 'RST-DEMO-155', item: 'Instant coffee sachet', requested: 60, received: 60, unit: 'pack', status: 'RESTOCKED' },
];

export const ACCOUNTS = [
  { name: 'Logistics Office', role: 'ADMINISTRATOR', committee: null, status: 'ACTIVE', mapped: true },
  { name: 'Department Director', role: 'DIRECTOR', committee: null, status: 'ACTIVE', mapped: true },
  { name: 'Food Committee Head', role: 'COMMITTEE_HEAD', committee: 'COM_FOOD', status: 'ACTIVE', mapped: true },
  { name: 'Inventory Staff A', role: 'DOL_STAFF', committee: 'COM_INVENTORY_PANTRY', status: 'ACTIVE', mapped: true },
  { name: 'Materials Staff B', role: 'DOL_STAFF', committee: 'COM_MATERIALS', status: 'ACTIVE', mapped: true },
  { name: 'Pending Applicant', role: 'REQUESTER', committee: null, status: 'FOR_REVIEW', mapped: false },
];

export const HEALTH = [
  { name: 'Release identity', value: 'v0.7.2 · schema 30', tone: 'done' },
  { name: 'Database', value: 'Healthy', tone: 'done' },
  { name: 'Evidence storage', value: 'Healthy', tone: 'done' },
  { name: 'Recovery checkpoint', value: 'Illustrative record · 2032-05-06', tone: 'done' },
  { name: 'Email delivery', value: 'Not configured', tone: 'progress' },
  { name: 'Directory synchronisation', value: 'Illustrative · not run since 2032-05-05', tone: 'progress' },
  { name: 'Background reconciliation', value: 'Unavailable', tone: 'alert' },
];

export const NOTIFICATIONS = [
  { title: '2 loans are overdue', body: 'Follow up on pending returns.', tone: 'alert' },
  { title: '2 requests await review', body: 'Each line needs one routing decision.', tone: 'info' },
  { title: '4 items are low or out of stock', body: 'Check restocking before the next event.', tone: 'progress' },
];

export const INVENTORY_COMPOSITION = [
  { label: 'Available', value: 842, color: 'var(--tone-done-fg)' },
  { label: 'Reserved', value: 230, color: 'var(--gold-600)' },
  { label: 'For canvassing', value: 96, color: 'var(--tone-info-fg)' },
  { label: 'On loan', value: 80, color: 'var(--ox-600)' },
];
