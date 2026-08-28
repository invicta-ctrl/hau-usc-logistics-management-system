# HAU-USC Logistics UI language guide

## Voice

Write in plain, professional, operational language. Be specific and concise. Describe the task, record, restriction, consequence, or next action; do not use slogans, promotional claims, or implementation commentary.

## Action labels

Use sentence case and prefer a verb plus its object: `Submit request`, `Approve request`, `Receive stock`, `Confirm release`, `Return item`, `Change password`, `Save username`, `Upload photo`, and `Reset Playground`. Avoid standalone `Continue`, `Proceed`, `Manage`, `Confirm`, or `Save` when the object can be named.

## Statuses

Use one stable, human-readable label for each domain status. Preserve the business meaning of `For review`, `Needs information`, `Ready to claim`, `On loan`, `Returned`, `Unavailable`, and `Pending`. Do not use color as the only status signal.

## Errors and recovery

State what happened, then the next safe action: `The request review changed. Reload the current record before trying again.` Do not claim success after a failed or uncertain write. Use `Support reference` when a diagnostic identifier must be available for support; do not expose provider, storage, contract, revision, or correlation terminology in ordinary task copy.

## Helper text

Include helper text only when it adds a requirement, restriction, format, deadline, consequence, next action, or non-obvious context. Delete text that merely repeats the heading or control label. Keep loading and empty-state copy short.

## Technical terms

Reserve infrastructure and implementation terms for the intentional Administration `System status` surface. Ordinary routes describe records and outcomes: `Current inventory records`, `Request review recorded`, or `Actions are unavailable for this account`.

## Playground terminology

Use `Playground` for the isolated environment and `Inspection mode` for non-operational sample routes. One environment note per page is enough: `PLAYGROUND INSPECTION · Sample data · Actions are unavailable.` Use `Sample data` for example records. Never imply that an inspection action changed an operational record.

## Capitalization, dates, and numbers

- Use sentence case for titles, headings, labels, buttons, tabs, statuses, and messages; preserve official names and identifiers.
- Display dates with an unambiguous month name, four-digit year, and local time when time matters.
- Use locale-aware thousands separators. Pair quantities with their unit and avoid unnecessary decimal places.
- Preserve exact account, request, lending, inventory, and event identifiers.
