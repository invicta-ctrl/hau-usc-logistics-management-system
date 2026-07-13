# Google Drive Evidence and Storage

## Current boundary

In the **CURRENT repository architecture**, controlled Google Drive folders store evidence/branding bytes and Sheets store restricted metadata. `DriveService.gs` owns folder resolution, privacy checks, signatures/dimensions, naming helpers, and quarantine. `EvidenceService.gs` owns evidence authorization/storage/metadata. `AdminService.gs` owns protected branding upload/version activation.

Implemented source is not proof that a live Drive is configured. No live folder, permission, upload, quarantine, or branding mutation occurred for `1.0.0-rc.1` because the authenticated Apps Script target conflicts with the documented staging target.

A Drive link is never authorization. The server permission check happens before bytes are decoded or Drive is accessed, and client/public DTOs omit private file/folder IDs and URLs.

## Canonical private folder hierarchy

`DRIVE_ROOT_FOLDER_ID` must identify the reviewed institution-owned root. The following eleven folders must be exact, unique, direct children:

| Canonical key | Exact child name | Purpose |
| --- | --- | --- |
| `DRIVE_REQUESTS_FOLDER_ID` | `Requests` | Request supporting evidence |
| `DRIVE_LENDING_FOLDER_ID` | `Lending` | Handoff and return evidence |
| `DRIVE_RELEASES_RETURNS_FOLDER_ID` | `Releases and Returns` | Recipient/release/return confirmations |
| `DRIVE_PROCUREMENT_FOLDER_ID` | `Procurement` | Deliverable/procurement evidence |
| `DRIVE_CANVASSING_FOLDER_ID` | `Canvassing` | Quotes and canvass photos |
| `DRIVE_RECEIPTS_INVOICES_FOLDER_ID` | `Receipts and Invoices` | Restock receipts and invoices |
| `DRIVE_INVENTORY_EVIDENCE_FOLDER_ID` | `Inventory Evidence` | Cycle counts and inventory support |
| `DRIVE_BRANDING_FOLDER_ID` | `Branding` | Verified private branding versions |
| `DRIVE_EXPORTS_FOLDER_ID` | `Exports` | Controlled generated exports |
| `DRIVE_BACKUPS_FOLDER_ID` | `Backups` | Restricted Drive-side recovery material |
| `DRIVE_QUARANTINE_FOLDER_ID` | `Quarantine` | Failed/partial upload recovery |

Legacy configuration aliases map forward without creating a second hierarchy:

| Legacy key | Canonical key |
| --- | --- |
| `DRIVE_RECEIPTS_FOLDER_ID` | `DRIVE_RECEIPTS_INVOICES_FOLDER_ID` |
| `DRIVE_CANVASS_FOLDER_ID` | `DRIVE_CANVASSING_FOLDER_ID` |
| `DRIVE_RELEASE_FOLDER_ID` | `DRIVE_RELEASES_RETURNS_FOLDER_ID` |
| `DRIVE_DELIVERABLE_FOLDER_ID` | `DRIVE_PROCUREMENT_FOLDER_ID` |
| `DRIVE_ARCHIVE_FOLDER_ID` | `DRIVE_BACKUPS_FOLDER_ID` |

Backups and Quarantine are intentionally distinct. An old archive alias maps to Backups only; quarantine recovery always uses the canonical Quarantine folder.

## Fail-closed resolution and setup

`validateDriveConfiguration()` and runtime folder resolution reject:

- missing, placeholder, malformed, inaccessible, or deleted IDs;
- a root or child whose sharing cannot be proven private;
- configured folders with the wrong exact name or parent;
- a child with multiple parents or a parent other than the configured root;
- duplicate exact-name direct children;
- the same folder ID assigned to different canonical keys;
- canonical/legacy alias conflicts;
- fallback to the script owner's My Drive root.

`setupDriveFolders()` is locked and additive. It verifies the root first, resolves one existing exact private direct child when present, rejects duplicates/conflicts, creates only missing canonical children, re-verifies name/parent/sharing, and synchronizes compatible alias configuration. It does not silently rename, move, re-share, or adopt an arbitrary folder.

Use an institution-controlled Shared Drive or durable institutional owner subject to HAU policy. Do not depend on a graduating student's personal account. The data/system/privacy owners must approve groups, external-sharing restrictions, retention, and offboarding.

## Upload authorization

Authorization precedes base64 decode and Drive work:

| Evidence family | Examples | Required permission |
| --- | --- | --- |
| Receiving/procurement | restock receipt/invoice, canvass quote/photo, deliverable proof | `Can_Receive` |
| Release/lending | release confirmation, lending handoff, lending return | `Can_Release` |
| Other operational support | request/inventory/exceptional evidence | `Can_Admin` unless a narrower reviewed route applies |
| Branding | official asset candidate and activation | `Can_Admin` |

The server also requires a supported evidence type, exact related entity type/ID, and idempotency key. Workflow services supply the relation; the upload endpoint is not a generic file drop.

## Byte and metadata validation

Current limits and checks:

- supported MIME: JPEG, PNG, WEBP, PDF;
- maximum decoded size: 10 MiB;
- bounded encoded input before decode and decoded length after decode;
- claimed MIME must match the normalized extension;
- magic bytes must match JPEG/PNG/WEBP/PDF structure;
- image dimensions must parse and stay within 12,000 px per side and 40,000,000 pixels;
- zero-length, unsupported, mismatched, malformed, or over-limit data is rejected before file creation;
- the server computes actual size, SHA-256, image dimensions, normalized filename, folder, uploader, and timestamps;
- stored file MIME/extension/size/parent/sharing are re-read and verified after creation.

Malware scanning and deeper PDF active-content analysis are not implemented by the current Apps Script code. Production policy must decide whether to add a scanning service, restrict PDF workflows, and require safe-viewer guidance.

## Deterministic privacy-safe names

Evidence follows a type/entity/time/server-ID pattern equivalent to:

```text
<TYPE-CODE>_<RELATED-SYSTEM-ID>_<SECONDARY-SYSTEM-ID>_<PHT-TIMESTAMP>_<EVIDENCE-ID>.<extension>
```

Names never include requester/borrower names, student numbers, emails, phone numbers, supplier contacts/tax identifiers, or the original filename. `Original_File_Name` may be retained only in restricted metadata.

Fictitious example:

```text
RR_REQ-DEMO-0042_ITM-DEMO-0017_20260713-143000_EVD-DEMO-0099.pdf
```

The evidence label may use approved system IDs and Philippine time. Operators select an entity through the authorized UI; they never paste a folder ID into a workflow form.

## Idempotency, duplicate verification, and recovery

- The client request ID returns the recorded result for a safe replay.
- A SHA-256 match for the same controlled entity/type returns the existing verified evidence and audits the duplicate attempt.
- A duplicate is accepted only after the referenced file remains accessible, private, in the expected folder, and consistent with recorded metadata.
- Drive file creation and Sheets metadata append are not atomic. If post-create verification or metadata persistence fails, the service moves the file to Quarantine when possible and records bounded recovery state.
- A failed operational workflow is never reported complete merely because bytes exist.
- Recovery uses an audited forward attachment/status action or approved retention deletion; it never fabricates metadata or silently changes posted history.

Evidence IDs, digests, uploader, creation time, and original storage relationship are immutable proof fields. Corrections supersede or append an audited state.

## Branding lifecycle

`api_uploadBrandingAsset` accepts protected file bytes and metadata; the browser never asks for a Drive ID or URL. The server:

1. re-authorizes `Can_Admin` and idempotency;
2. validates stable asset key, display/alt text, MIME/extension/magic/size/dimensions;
3. detects verified checksum duplicates;
4. creates one deterministic private version file in `Branding`;
5. verifies parent, sharing, MIME, extension, size, dimensions, and checksum;
6. records a server-owned branding version ID and history;
7. optionally activates it after storage verification.

Activation re-verifies the stored bytes/metadata, supersedes the prior active version for the same key, and appends audit/history. Public state exposes safe descriptive metadata and a built-in wordmark fallback, never private delivery URLs/IDs. No official logo was fabricated, uploaded, or activated in this task.

## Sharing and access review

1. Use institution-managed groups rather than ad hoc individual shares where policy allows.
2. Disable public/anyone-with-link/broad-domain sharing unless formally approved.
3. Separate upload authority from Drive administration and deletion/re-sharing.
4. Review membership on role change, graduation, separation, and at least quarterly.
5. Keep URLs/IDs out of public email, issues, chat, analytics, screenshots, and client errors.
6. Verify deployment-owner access and inherited sharing at every staging/production promotion.
7. Restrict Quarantine and Backups at least as strongly as operational evidence.

## Retention and incident handling

Production needs approved retention for each evidence type, branding version, backup, metadata row, audit record, and quarantined file. Destructive automation remains disabled until legal hold, incident preservation, approval, and tombstone rules are assigned.

On suspected disclosure: stop further sharing/writes, preserve metadata/audit evidence, restrict or revoke access, identify linked entities, notify institutional owners, and follow [Security and Access](SECURITY_AND_ACCESS.md). Do not delete suspected evidence before preservation is released.

## Future object storage

The **FUTURE** hosted architecture uses a private object bucket with opaque keys, encryption, checksum/size/type metadata, independent backup/export, lifecycle/legal-hold policy, and authorization on every read. Downloads use a short-lived single-object signed URL or server stream; URLs stay out of logs/referrers.

Migration copies one object, verifies digest/size/type, records the new key and restricted old Drive provenance, and reconciles before cutover. Drive remains read-only during a bounded rollback window. Do not dual-write indefinitely.
