# v0.7.0 Phase 15 Onward — Owner Decisions

Status: ACCEPTED
Recorded: 2026-07-26
Authority: owner-supplied continuation prompt
Authority SHA-256: `86f5eb826b5f640dd386f82627af547f57849dfca9c866aa421551973221c0fe`

## Private USC directory source

- The owner-approved private USC officer and staff Google Sheet is the authoritative identity source.
- Its provider identifier and reader credential remain outside Git.
- The `Official` worksheet is read through a dedicated service account with viewer-only Sheet access and the read-only Google Sheets OAuth scope.
- General Sheet access is restricted.
- The import minimizes data to Student ID, HAU institutional email, display name, verification result, active state, and review notes.
- Complete, unique rows in the owner-approved official source project as verified and active.
- Duplicate or incomplete rows are quarantined and are not written.
- Unrelated personal fields, including birthdays, phone numbers, working email addresses, pronouns, program, and year level, are not imported.

## Events

- Administrators and Directors will create real events in the website.
- No event spreadsheet is required before launch.
- Empty event views must explain that no upcoming event exists and that an Administrator or Director can add the first event.
- No event names, dates, venues, committees, deadlines, or readiness values may be invented.

## Inventory

- The owner-approved private inventory Google Sheet is the authoritative migration source.
- Its provider identifier remains outside Git.
- Inventory work must be previewed, mapped, quarantined where incomplete, rehearsed on staging, reconciled exactly, backed up, and reversible before any production write.
- No production inventory migration is authorized before the Phase 17 and production gates pass.

## Organization and language

- Cleanup is inventory-first, reversible, and evidence-led; unknown or unique work must not be deleted.
- User-facing website text must use ordinary language and hide implementation details from ordinary users.
- Contextual guidance uses reusable `?` help and `!` warning cues where it improves understanding.
