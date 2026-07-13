# Google Drive Evidence and Storage

## Current boundary

In the **CURRENT** Apps Script architecture, controlled Google Drive folders store evidence bytes and `12_EVIDENCE` stores searchable metadata. All application uploads flow through `EvidenceService.gs` and `DriveService.gs`. Workflow services pass semantic metadata to that boundary; they do not choose arbitrary folders or call `DriveApp` themselves.

A Drive link is not an authorization decision. Access is determined by Drive sharing and the server permission check performed before bytes are decoded. Never use link possession as a substitute for role checks.

## Required folder configuration

All seven keys must be assigned to reviewed folders. IDs are stored in controlled environment configuration and must never be committed, copied into screenshots, or included in public test output.

| Configuration key             | Purpose                                                  | Expected application permission |
| ----------------------------- | -------------------------------------------------------- | ------------------------------- |
| `DRIVE_ROOT_FOLDER_ID`        | Approved parent for application-owned evidence hierarchy | Setup/admin only                |
| `DRIVE_RECEIPTS_FOLDER_ID`    | Restock invoices/receipts                                | `Can_Receive` upload path       |
| `DRIVE_CANVASS_FOLDER_ID`     | Quote documents and canvass photos                       | `Can_Receive` upload path       |
| `DRIVE_RELEASE_FOLDER_ID`     | Recipient/release confirmation                           | `Can_Release` upload path       |
| `DRIVE_DELIVERABLE_FOLDER_ID` | Deliverable receipt and delivery proof                   | `Can_Receive` upload path       |
| `DRIVE_LENDING_FOLDER_ID`     | Lending handoff and return evidence                      | `Can_Release` upload path       |
| `DRIVE_ARCHIVE_FOLDER_ID`     | Recovery quarantine for partially completed uploads      | Admin/recovery only             |

Missing, placeholder, malformed, inaccessible, or wrong-environment configuration fails closed with `SETUP_REQUIRED`, `CONFIGURATION_INVALID`, or `DRIVE_FOLDER_INVALID`. There is no fallback to the script owner's My Drive root. The root must itself be configured and accessible before child-folder setup; setup may not create an unreviewed hierarchy elsewhere.

Recommended ownership is an institution-controlled Shared Drive or equivalent durable institutional owner, subject to HAU policy. Do not make folders public, transfer them to a personal account, or depend on a graduating student's account. The DOL data owner, system owner, and privacy owner must approve group membership, external-sharing restrictions, retention, and offboarding.

## Upload authorization and validation

Authorization occurs before base64 decoding or Drive access:

| Evidence family           | Examples                                                                 | Required permission |
| ------------------------- | ------------------------------------------------------------------------ | ------------------- |
| Receiving/procurement     | restock receipt, invoice, canvass quote/photo, deliverable receipt/proof | `Can_Receive`       |
| Release/lending           | release confirmation, lending handoff, lending return                    | `Can_Release`       |
| Other supporting document | admin migration/reconciliation or exceptional evidence                   | `Can_Admin`         |

The current validator accepts JPEG, PNG, WEBP, and PDF, with a maximum decoded size of 10 MB. It rejects empty content, unsupported MIME types, and a filename extension that does not match the claimed MIME. Executables, HTML, and scripts are unsupported. File type is still client-asserted metadata; file-signature inspection, image-dimension limits, malware scanning, and PDF active-content controls are **PLANNED** launch-hardening work.

The server also requires a supported evidence type, related entity ID/type, idempotency key, and authorized user. User-supplied entity IDs are validated against the workflow by the business command; an upload endpoint must not become a generic file drop.

## Naming and metadata

Normalized filenames follow:

```text
<TYPE-CODE>_<RELATED-SYSTEM-ID>_<SECONDARY-SYSTEM-ID>_<PHT-TIMESTAMP>_<EVIDENCE-ID>.<extension>
```

They never contain a borrower or requester name, student number, email address, phone number, supplier tax number, or original user-supplied filename. The human-readable `Evidence_Label` uses approved type labels, system identifiers, and Philippine time. `Original_File_Name` may be retained in the restricted metadata row for investigation, so it must never be copied into request-only DTOs, public logs, or generated public filenames.

### Fully fictitious example

This example contains no live identifier or person:

```text
Input:
  evidence type: RESTOCK_RECEIPT
  related entity: REQ-DEMO-0042
  secondary entity: ITEM-DEMO-0017
  original filename: sample-receipt.pdf

Normalized Drive filename:
  RR_REQ-DEMO-0042_ITEM-DEMO-0017_20260713-143000_EVID-DEMO-0099.pdf

Restricted metadata:
  Evidence_Label = "Restock receipt | REQ-DEMO-0042 | ITEM-DEMO-0017 | 2026-07-13 14:30 PHT"
  SHA256 = stored digest, never used as a public URL token
  Drive_File_ID / Drive_Folder_ID = private configuration-derived references
  Upload_Status = UPLOADED
```

Do not copy fictional values into a live environment as defaults. Operators select the real related entity through the authorized UI; they never paste a folder ID into a workflow form.

## Deduplication, idempotency, and compensation

Evidence upload has two distinct protections:

- The command idempotency key returns the recorded result when the same command is retried.
- A SHA-256 digest match for the same related entity and uploaded status returns the existing evidence and appends a duplicate-attempt audit event.

Drive creation and Sheet metadata append are not one atomic transaction. If Drive succeeds but metadata persistence fails, the service moves the file to the configured archive/recovery folder, labels it as quarantine, and reports failure. It must never report an operational workflow as complete merely because bytes exist. Recovery staff reconcile quarantined files by correlation ID and either perform an audited forward attachment or delete them under an approved retention/incident process; they do not fabricate metadata or silently move files back.

The evidence row is immutable as proof of the original upload. Corrections use a superseding/reversal relationship or an auditable status update defined by policy; do not overwrite a digest, Drive reference, uploader, or creation time.

## Sharing, access review, and link handling

1. Use institution-managed groups, not individual ad hoc shares, wherever the platform and HAU policy allow.
2. Disable public and broad domain-link sharing unless a formally approved use case requires it.
3. Separate upload authority from Drive administration. Application operators do not need permission to re-share or delete folder contents.
4. Review group membership at least quarterly and immediately on role change, graduation, separation, or incident.
5. Treat copied Drive URLs as restricted records. Do not send them in public email, issue trackers, chat transcripts, analytics, or client error telemetry.
6. Validate service/deployment owner access and folder inheritance during every staging and production promotion.
7. Keep the archive/recovery folder narrower than routine operational folders.

## Retention, deletion, and legal hold

Production requires approved durations for each evidence type, backup copy, metadata row, audit event, and recovery-quarantine file. Until those durations and the responsible approver are recorded, destructive automation remains disabled. A deletion job must check legal hold, investigation status, linked immutable ledger/audit needs, and backup expiry, then record an auditable tombstone without reusing the evidence ID.

If access or disclosure is suspected, stop further sharing, preserve audit and metadata evidence, rotate or revoke affected access, identify every linked entity, notify the HAU incident/privacy owners through the approved channel, and follow [Security and Access](SECURITY_AND_ACCESS.md). Do not delete suspected evidence before the incident owner releases preservation.

## Future object-storage model

In the **FUTURE** hosted architecture, evidence moves to private object storage with opaque object keys, server-side encryption, checksum verification, lifecycle policy, versioning or object lock where required, and separate metadata in PostgreSQL. The API authorizes each read and issues only a short-lived signed URL or streams the bytes. Anyone possessing an unexpired signed URL may use it, so URLs must be short-lived, excluded from logs/referrers, scoped to one object and operation, and never stored as permanent evidence authority.

Migration must copy bytes, verify digest/size/type, write the new object version, preserve the old Drive reference as restricted provenance, and reconcile counts before cutover. Drive stays read-only during a bounded rollback window. If reconciliation fails, disable new-storage reads/writes and return to the prior Drive-backed release; do not dual-write indefinitely.
