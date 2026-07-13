# Essential Bootstrap and Lazy Module Contract

Status: Slice 2 local implementation checkpoint, contract version 2.

This document describes the repository-local read contract used by the reversible Apps Script bootstrap migration. It contains no deployment, spreadsheet, Drive, roster, credential, or operational-record values.

## Essential bootstrap

The sole browser service adapter may call `api_getEssentialBootstrapData` when the server-rendered Apps Script runtime flag `HAU_BOOTSTRAP_CONTRACT_VERSION` resolves to `2`. The response is an `essential-bootstrap` envelope with:

- contract and version metadata;
- app/schema version, backend mode, environment, and request-only state;
- sanitized current-user identity, capability booleans, and bounded scopes;
- enabled minimal navigation entries;
- bounded module configuration (`maxPageSize`, `defaultPageSize`, compatibility flag, and active-module-only flag);
- an optional operational revision and safe read/cache/payload metrics. The server measures the final UTF-8 serialized response and rejects responses over 100 KiB.

The essential response never contains full collections. In particular, it does not contain ledger, reservation, audit, status-history, evidence, roster, lending, procurement, or deliverable records.

## Lazy module response

The adapter may call `api_getBootstrapModule` only for the active module. Supported module names are `overview`, `request`, `lending`, `release`, `restocking`, `procurement`, and `inventory`. Each response is a `bootstrap-module` envelope containing only the allowlisted data keys for that module, bounded pagination, revision metadata, cache policy, and safe metrics.

Module queries accept positive integer pages, page sizes from 1 through 50, and query/filter strings no longer than 80 characters. Every module collection uses those bounded inputs; committee-scoped internal sessions fail closed for rows without a matching explicit committee scope. The client controller deduplicates identical in-flight requests, cancels stale responses, and renders only the current module.

## Privacy and authorization

Apps Script remains authoritative for authorization and request-only enforcement. Request-only sessions may load only the public request module. Essential/current-user DTOs and request-only module DTOs omit email, student identifiers, contacts, supplier tax identifiers, Drive identifiers/URLs, evidence, audit, history, ledger, and roster fields. Authorized internal module DTOs remain capability/scope-filtered, session-operational, and non-cacheable; their operational fields are never accepted in request-only responses. Client validation rejects unknown top-level/data fields, JSON-unsafe values, circular values, and sensitive field names in request-only module responses, plus unsupported schema/version values.

## Read and cache policy

`withRequestReadCache_` deduplicates repeated repository reads during one server request and exposes only bounded read-count/cache-hit metrics. Empty sheets are cached as well. The browser caches only validated responses explicitly marked `PUBLIC_REFERENCE`, with a 100 KB entry limit, eight-entry LRU bound, and server-provided TTL. Session-operational responses are never cached.

## Migration and rollback

The existing `api_getBootstrapData` endpoint remains available as the compatibility path. `HAU_BOOTSTRAP_CONTRACT_VERSION` is an allowlisted Script Property: absent or `1` uses the existing path; explicit `2` uses essential bootstrap followed by one active-module request. New endpoints are dormant when the flag is below `2`. Rollback is therefore a Script Property change to `1`, followed by a code revert if required. No deployment or external-system change is part of this checkpoint.

## Verification boundary

Contract, pagination, deduplication, cache, cancellation, privacy, adapter routing, Apps Script VM, and packaged Chromium tests use synthetic fixtures only. Generated visual/runtime and Apps Script partials are refreshed through the repository build path. Staging cold/warm timing, `clasp` checks requiring a configured staging script, deployment response shape, and production-volume payloads remain unknowns.
