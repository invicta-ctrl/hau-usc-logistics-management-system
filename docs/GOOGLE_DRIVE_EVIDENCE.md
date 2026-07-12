# Google Drive Evidence

All evidence flows through `EvidenceService.gs` and `DriveService.gs`. No operational service may call `DriveApp` directly.

## Required configuration

Assign all seven folder keys in `17_CONFIG`: root, receipts, canvass, release, deliverable, lending, and archive. Missing or inaccessible folders return `SETUP_REQUIRED`/`DRIVE_FOLDER_INVALID`; the code never uploads to My Drive root.

## Validation and privacy

Allowed MIME types are JPEG, PNG, WEBP, and PDF; maximum size is 10 MB. The original extension must match the claimed MIME type. Empty, executable, HTML, script, mismatched, and unsupported files are rejected. Production validation should additionally verify file signatures and image dimensions before broad launch.

Filenames follow `<CODE>_<RELATED-ID>_<SECONDARY-ID>_<YYYYMMDD-HHMMSS>_<EVIDENCE-ID>.<ext>`. They never include borrower/requester names, student IDs, email, phone, or original user-provided filename. The human-readable `Evidence_Label` uses system IDs and PHT time.

## Deduplication and recovery

A SHA-256 digest is compared within the same related entity. A match returns the existing evidence and writes a duplicate-attempt audit event. If Drive succeeds but metadata fails twice, the file is moved to the configured archive/recovery folder and the operation reports failure. A failed upload must never be reported as success or silently coupled to an operational transaction.

Folder sharing should use least privilege. Define evidence retention, access classification, legal hold, and deletion policy with HAU before production.
