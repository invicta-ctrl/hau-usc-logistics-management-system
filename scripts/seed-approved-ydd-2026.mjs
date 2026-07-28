const baseUrl = String(process.env.HAU_STAGING_BASE_URL ?? '').replace(/\/$/u, '');
const accessId = String(process.env.HAU_STAGING_ACCESS_ID ?? '');
const password = String(process.env.HAU_STAGING_PASSWORD ?? '');

if (!baseUrl || !accessId || !password) {
  throw new Error('Set HAU_STAGING_BASE_URL, HAU_STAGING_ACCESS_ID, and HAU_STAGING_PASSWORD privately.');
}
if (!/^https:\/\//u.test(baseUrl)) throw new Error('The staging base URL must use HTTPS.');

const sourceReference = 'HAU_USC_Logistics_v0.7.0_Complete_Continuation_From_Phase16_OAuth_2026-07-26.md';
const supersedesReference =
  'July 4 meeting notes: August 10 and August 12 schedule (superseded historical planning context)';
const seedKey = `ydd-2026-approved-${Date.now()}`;

const approvedDays = [
  {
    date: '2026-09-01',
    activities: [
      {
        name: 'Pottery Making / Textile Weaving / Basket Weaving Workshop',
        activityType: 'Workshop',
        timeStatus: 'TBA',
        startAt: null,
        endAt: null,
        venue: 'Plaza San Jose',
        includedItems: [],
      },
    ],
  },
  {
    date: '2026-09-02',
    activities: [
      {
        name: 'DAPUGAN: Lutong Pamana Competition',
        activityType: 'Competition',
        timeStatus: 'SCHEDULED',
        startAt: '2026-09-02T08:00:00+08:00',
        endAt: '2026-09-02T12:00:00+08:00',
        venue: 'STL Kitchen Laboratory',
        includedItems: [],
      },
      {
        name: 'SIGASIG: Laro ng Lahi',
        activityType: 'Traditional Games',
        timeStatus: 'SCHEDULED',
        startAt: '2026-09-02T09:00:00+08:00',
        endAt: '2026-09-02T12:00:00+08:00',
        venue: 'Covered Court',
        includedItems: ['Sipa', 'Kadang-kadang', 'Sack Race', 'Sabayang Paglakad', 'Chinese Garter'],
      },
      {
        name: 'HARANA: Pagsulat at Pag-awit ng Kundiman',
        activityType: 'Competition',
        timeStatus: 'SCHEDULED',
        startAt: '2026-09-02T13:00:00+08:00',
        endAt: '2026-09-02T14:30:00+08:00',
        venue: 'IH Gymnasium',
        includedItems: [],
      },
      {
        name: 'KABILIN: Sarsuwela Competition',
        activityType: 'Competition',
        timeStatus: 'SCHEDULED',
        startAt: '2026-09-02T14:30:00+08:00',
        endAt: '2026-09-02T16:30:00+08:00',
        venue: 'IH Gymnasium',
        includedItems: [],
      },
      {
        name: 'SILAK: The Search for the Luminary',
        activityType: 'Cultural Program / Competition',
        timeStatus: 'SCHEDULED',
        startAt: '2026-09-02T16:30:00+08:00',
        endAt: '2026-09-02T20:30:00+08:00',
        venue: 'IH Gymnasium',
        includedItems: [],
      },
      {
        name: 'Awarding Ceremony',
        activityType: 'Ceremony',
        timeStatus: 'SCHEDULED',
        startAt: '2026-09-02T20:30:00+08:00',
        endAt: '2026-09-02T21:00:00+08:00',
        venue: 'IH Gymnasium',
        includedItems: [],
      },
    ],
  },
];

const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ accessId, password }),
});
const login = await loginResponse.json();
if (!loginResponse.ok || login.state !== 'AUTHENTICATED') {
  throw new Error(`Staging authentication failed (${loginResponse.status}).`);
}
if (!['SYSTEM_OWNER', 'ADMINISTRATOR', 'DIRECTOR'].includes(login.user?.authorization?.roleId)) {
  throw new Error('The staging account is not authorized for event management.');
}
const cookie = loginResponse.headers.get('set-cookie')?.split(';', 1)[0];
if (!cookie || !login.csrfToken)
  throw new Error('The staging session did not return protected session state.');

const call = async (method, command = {}) => {
  const response = await fetch(`${baseUrl}/api/${method}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
      'x-csrf-token': login.csrfToken,
    },
    body: JSON.stringify(command),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok === false) {
    throw new Error(`${method} failed (${response.status}): ${result.code ?? 'UNKNOWN'}`);
  }
  return result;
};

let directory = await call('getEventManagement');
const matchingSeries = directory.eventSeries.filter(
  (entry) => entry.name.trim().toLocaleLowerCase('en-US') === 'youth development days 2026',
);
if (matchingSeries.length > 1)
  throw new Error('Duplicate Youth Development Days 2026 series require review.');

let eventSeriesId;
if (matchingSeries.length === 1) {
  const series = matchingSeries[0];
  const saved = await call('saveEventSeries', {
    clientRequestId: `${seedKey}-series-update`,
    eventSeriesId: series.id,
    expectedRevision: series.revision,
    name: 'Youth Development Days 2026',
    year: 2026,
    status: 'ACTIVE',
    sourceReference,
    supersedesReference,
    notes: '',
    reason: 'Apply the approved September 1-2 schedule and record supersession.',
  });
  eventSeriesId = saved.eventSeriesId;
} else {
  const saved = await call('saveEventSeries', {
    clientRequestId: `${seedKey}-series-create`,
    name: 'Youth Development Days 2026',
    year: 2026,
    status: 'ACTIVE',
    sourceReference,
    supersedesReference,
    notes: '',
    reason: 'Create the owner-approved Youth Development Days 2026 hierarchy.',
  });
  eventSeriesId = saved.eventSeriesId;
}

directory = await call('getEventManagement');
for (const historicalDate of ['2026-08-10', '2026-08-12']) {
  const historicalDays = directory.eventDays.filter(
    (entry) => entry.seriesId === eventSeriesId && entry.date === historicalDate && entry.active,
  );
  if (historicalDays.length > 1)
    throw new Error(`Duplicate historical event days exist for ${historicalDate}.`);
  if (historicalDays.length === 1) {
    const day = historicalDays[0];
    await call('saveEventDay', {
      clientRequestId: `${seedKey}-archive-${historicalDate}`,
      eventDayId: day.id,
      eventSeriesId,
      expectedRevision: day.revision,
      date: day.date,
      name: day.name,
      status: 'ARCHIVED',
      notes: supersedesReference,
      reason: 'Archive the earlier schedule as superseded historical planning context.',
    });
  }
}

for (const approvedDay of approvedDays) {
  directory = await call('getEventManagement');
  const matchingDays = directory.eventDays.filter(
    (entry) => entry.seriesId === eventSeriesId && entry.date === approvedDay.date && entry.active,
  );
  if (matchingDays.length > 1) throw new Error(`Duplicate active event days exist for ${approvedDay.date}.`);
  let eventDayId;
  if (matchingDays.length === 1) {
    const day = matchingDays[0];
    const saved = await call('saveEventDay', {
      clientRequestId: `${seedKey}-day-update-${approvedDay.date}`,
      eventDayId: day.id,
      eventSeriesId,
      expectedRevision: day.revision,
      date: approvedDay.date,
      status: 'UPCOMING',
      notes: '',
      reason: 'Reconcile the event day to the approved September schedule.',
    });
    eventDayId = saved.eventDayId;
  } else {
    const saved = await call('saveEventDay', {
      clientRequestId: `${seedKey}-day-create-${approvedDay.date}`,
      eventSeriesId,
      date: approvedDay.date,
      status: 'UPCOMING',
      notes: '',
      reason: 'Create the approved September event day.',
    });
    eventDayId = saved.eventDayId;
  }

  directory = await call('getEventManagement');
  const activeActivities = directory.activities.filter(
    (entry) => entry.eventDayId === eventDayId && entry.active,
  );
  const approvedNames = new Set(approvedDay.activities.map((entry) => entry.name));
  const unexpected = activeActivities.filter((entry) => !approvedNames.has(entry.name));
  if (unexpected.length) {
    throw new Error(`Unexpected active activities require review for ${approvedDay.date}.`);
  }

  for (const approvedActivity of approvedDay.activities) {
    const matches = activeActivities.filter((entry) => entry.name === approvedActivity.name);
    if (matches.length > 1) throw new Error(`Duplicate activity: ${approvedActivity.name}.`);
    const existing = matches[0];
    await call('saveEventActivity', {
      clientRequestId: `${seedKey}-activity-${approvedDay.date}-${approvedDay.activities.indexOf(approvedActivity)}`,
      ...(existing ? { activityId: existing.id, expectedRevision: existing.revision } : {}),
      eventDayId,
      ...approvedActivity,
      status: 'UPCOMING',
      responsibleCommitteeId: null,
      supportingCommitteeIds: [],
      preparationDeadline: null,
      requestWindowOpensAt: null,
      requestWindowClosesAt: null,
      releaseDeadline: null,
      readinessPercentage: null,
      preparationProgress: null,
      notes: '',
      sourceReference,
      reason: existing
        ? 'Reconcile known activity truth and clear unapproved operational values.'
        : 'Create the approved event activity without inventing operational values.',
    });
  }
}

directory = await call('getEventManagement');
const finalSeries = directory.eventSeries.filter(
  (entry) => entry.name === 'Youth Development Days 2026' && entry.status === 'ACTIVE',
);
const finalDays = directory.eventDays.filter((entry) => entry.seriesId === eventSeriesId && entry.active);
const finalActivities = directory.activities.filter(
  (entry) =>
    entry.seriesId === eventSeriesId && entry.active && finalDays.some((day) => day.id === entry.eventDayId),
);
if (finalSeries.length !== 1 || finalDays.length !== 2 || finalActivities.length !== 7) {
  throw new Error(
    'Final YDD 2026 hierarchy did not reconcile to one series, two days, and seven activities.',
  );
}
if (finalDays.some((entry) => ['2026-08-10', '2026-08-12'].includes(entry.date))) {
  throw new Error('A superseded August event day is still active.');
}
if (
  finalActivities.some(
    (entry) =>
      entry.ownerReviewStatus !== 'OWNER_REVIEW_REQUIRED' ||
      entry.responsibleCommitteeId !== null ||
      entry.readinessPercentage !== null ||
      entry.preparationProgress !== null,
  )
) {
  throw new Error('Unknown operational values were not preserved as owner-review-required nulls.');
}

process.stdout.write(
  JSON.stringify({
    ok: true,
    eventSeriesId,
    eventCode: finalSeries[0].code,
    eventDays: finalDays.length,
    activities: finalActivities.length,
    historyRecords: directory.history.filter((entry) => entry.seriesId === eventSeriesId).length,
  }),
);
