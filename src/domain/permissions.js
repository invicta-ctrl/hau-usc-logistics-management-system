import { ROLES } from './constants.js';

const MATRIX = Object.freeze({
  submit_request: Object.values(ROLES),
  review_request: [ROLES.DOL_STAFF, ROLES.COMMITTEE_HEAD, ROLES.DIRECTOR, ROLES.ADMINISTRATOR],
  receive: [ROLES.DOL_STAFF, ROLES.COMMITTEE_HEAD, ROLES.DIRECTOR, ROLES.ADMINISTRATOR],
  release: [ROLES.DOL_STAFF, ROLES.COMMITTEE_HEAD, ROLES.DIRECTOR, ROLES.ADMINISTRATOR],
  approve_lending: [ROLES.DOL_STAFF, ROLES.COMMITTEE_HEAD, ROLES.DIRECTOR, ROLES.ADMINISTRATOR],
  merge_event_item: [ROLES.COMMITTEE_HEAD, ROLES.DIRECTOR, ROLES.ADMINISTRATOR],
  diagnostics: [ROLES.ADMINISTRATOR],
  reset_demo: [ROLES.ADMINISTRATOR],
});

export function can(role, action) {
  return Boolean(MATRIX[action]?.includes(role));
}
export function permissionsFor(role) {
  return Object.fromEntries(Object.keys(MATRIX).map((action) => [action, can(role, action)]));
}
