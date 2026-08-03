import { describe, expect, it } from 'vitest';
import {
  createPublicLendingService,
  USC_DEPARTMENTS,
} from '../../src/server/public-lending-service.js';

class Statement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  first() {
    return this.database.first(this);
  }

  all() {
    return this.database.all(this);
  }
}

class LendingDatabase {
  constructor() {
    this.submissions = new Map();
    this.tickets = new Map();
    this.links = [];
    this.history = [];
  }

  prepare(sql) {
    return new Statement(this, sql);
  }

  async first(statement) {
    if (statement.sql.includes('COUNT(*) AS count FROM public_lending_rate_limit_events')) {
      return { count: 0 };
    }
    if (statement.sql.includes('WHERE client_request_id = ?1')) {
      return [...this.submissions.values()].find(
        (submission) => submission.client_request_id === statement.values[0],
      );
    }
    if (
      statement.sql.includes('FROM public_lending_submissions') &&
      statement.sql.includes('receipt_digest = ?2')
    ) {
      const submission = this.submissions.get(statement.values[0]);
      return submission?.receipt_digest === statement.values[1] ? submission : null;
    }
    return null;
  }

  async all(statement) {
    if (statement.sql.includes('FROM inventory_items item')) {
      return {
        results: [
          {
            id: 'ITEM-1',
            name: 'Synthetic camera',
            category: 'Equipment',
            unit: 'piece',
            lending_unit: 'piece',
            lending_kind: 'REUSABLE',
            lending_status: 'AVAILABLE',
            lending_audience: 'STUDENTS_AND_STAFF',
            maximum_loan_quantity: 10,
            default_loan_days: 3,
            due_date_required: 1,
            acknowledgment_required: 1,
            lendable_available: 10,
            aliases_json: '[]',
          },
        ],
      };
    }
    if (statement.sql.includes('FROM public_lending_submission_tickets link')) {
      const submissionId = statement.values[0];
      return {
        results: this.links
          .filter((link) => link.submissionId === submissionId)
          .map((link) => {
            const ticket = this.tickets.get(link.ticketId);
            return {
              status: ticket.status,
              ticket_type: ticket.ticketType,
              quantity: ticket.quantity,
              unit: ticket.unit,
              due_at: ticket.dueAt,
              item_name: 'Synthetic camera',
            };
          }),
      };
    }
    if (statement.sql.includes('FROM status_history history')) {
      return {
        results: this.history
          .filter((entry) => entry.submissionId === statement.values[0])
          .map((entry) => ({ new_status: entry.status, changed_at: entry.changedAt })),
      };
    }
    return { results: [] };
  }

  async batch(statements) {
    for (const statement of statements) {
      if (statement.sql.includes('INSERT INTO public_lending_submissions')) {
        const values = statement.values;
        this.submissions.set(values[0], {
          id: values[0],
          receipt_digest: values[14],
          client_request_id: values[15],
          created_at: values[13],
          updated_at: values[13],
        });
      } else if (statement.sql.includes('INSERT INTO lending_tickets')) {
        const values = statement.values;
        this.tickets.set(values[0], {
          id: values[0],
          itemId: values[6],
          quantity: values[7],
          unit: values[8],
          dueAt: values[10],
          ticketType: values[11],
          status: 'FOR_REVIEW',
        });
      } else if (statement.sql.includes('INSERT INTO public_lending_submission_tickets')) {
        this.links.push({ submissionId: statement.values[0], ticketId: statement.values[1] });
      } else if (statement.sql.includes('INSERT INTO status_history')) {
        const link = this.links.find((candidate) => candidate.ticketId === statement.values[1]);
        this.history.push({
          submissionId: link?.submissionId,
          status: 'FOR_REVIEW',
          changedAt: statement.values[2],
        });
      }
    }
    return statements.map(() => ({ success: true, meta: { changes: 1 } }));
  }
}

const clock = { now: () => Date.parse('2026-08-03T10:00:00.000Z') };
const trackingSecret = 'synthetic-private-tracking-secret-at-least-32-bytes';

function command(overrides = {}) {
  return {
    clientRequestId: crypto.randomUUID(),
    dataUseAcknowledged: true,
    acceptableUseAcknowledged: true,
    borrowerResponsibilityAcknowledged: true,
    evidenceConsentAcknowledged: true,
    responsibilityAcknowledged: true,
    borrowerType: 'USC_STAFF',
    borrowerName: 'Synthetic Borrower',
    studentId: '12345678',
    uscDepartment: USC_DEPARTMENTS[0],
    positionRole: 'Synthetic Officer',
    contactNumber: '+639171234567',
    email: 'synthetic@example.invalid',
    purpose: 'Synthetic equipment request',
    pickupDate: '2026-08-04',
    dueDate: '2026-08-05',
    lines: [{ itemId: 'ITEM-1', quantity: 1 }],
    ...overrides,
  };
}

describe('v0.7.2 public Lending contract', () => {
  it.each([2.02, 2.03, 0.06, '1e2', ' 1 ', { valueOf: () => 1 }])(
    'rejects non-canonical operational quantity %p',
    async (quantity) => {
      const service = createPublicLendingService({
        db: new LendingDatabase(),
        trackingSecret,
        clock,
      });
      await expect(
        service.submit({ command: command({ lines: [{ itemId: 'ITEM-1', quantity }] }) }),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    },
  );

  it('returns a replay-stable private credential and tracks without exposing borrower identity', async () => {
    const db = new LendingDatabase();
    const service = createPublicLendingService({ db, trackingSecret, clock });
    const source = command({ clientRequestId: 'SYN-LENDING-1' });
    const submitted = await service.submit({ command: source, correlationId: 'COR-1' });
    const replayed = await service.submit({ command: source, correlationId: 'COR-2' });
    const tracked = await service.track({
      command: {
        submissionId: submitted.submissionId,
        trackingCode: submitted.trackingCode,
      },
      correlationId: 'COR-3',
    });

    expect(submitted).toMatchObject({ status: 'FOR_REVIEW', replayed: false });
    expect(replayed).toMatchObject({
      submissionId: submitted.submissionId,
      trackingCode: submitted.trackingCode,
      replayed: true,
    });
    expect(db.submissions.get(submitted.submissionId).receipt_digest).not.toBe(
      submitted.trackingCode,
    );
    expect(tracked).toMatchObject({
      submissionId: submitted.submissionId,
      status: 'FOR_REVIEW',
      lines: [{ itemName: 'Synthetic camera', quantity: 1, unit: 'piece' }],
      history: [{ status: 'FOR_REVIEW' }],
    });
    expect(JSON.stringify(tracked)).not.toContain('Synthetic Borrower');
    expect(JSON.stringify(tracked)).not.toContain('synthetic@example.invalid');
    expect(JSON.stringify(tracked)).not.toContain('+639171234567');
  });

  it('returns one generic error for an invalid private tracking credential', async () => {
    const db = new LendingDatabase();
    const service = createPublicLendingService({ db, trackingSecret, clock });
    const submitted = await service.submit({ command: command() });

    await expect(
      service.track({
        command: { submissionId: submitted.submissionId, trackingCode: 'invalid-tracking-code' },
      }),
    ).rejects.toMatchObject({ code: 'PUBLIC_LENDING_NOT_FOUND', status: 404 });
  });
});
