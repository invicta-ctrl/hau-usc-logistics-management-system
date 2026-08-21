# FI-03 Bounded Auth/Application Result Projection Amendment

**STATUS:** ACCEPTED  
**OWNER:** Earl  
**ACCEPTED:** 2026-08-22 Asia/Manila

Only the following Layer-B paths are authorized:

```text
src/v5/integration/admin-parity.js
  publicPanels(), afterRender(), onSubmit()
  public.verify, public.application, public.application-status only
src/v5/integration/runtime.js
  afterRender() only if the static application-status fallback conflicts with a
  real existing result.
```

Purpose: preserve already-returned verification receipts, application
receipts/status credentials, status results, and withdrawal results only long
enough for safe route-local FI-03 projection. No new endpoint, adapter/fetch,
payload/response semantics, persistence, token, route, registry mapping, or
client authority is authorized.

`dispatch()` and all backend/security behavior remain frozen: adapter behavior,
session/cookie, CSRF, verification lifecycle, status credentials,
Administrator/Director approval, activation, authorization, provider, and
D1/R2. `backend.js`, Layer-C source, migrations, provider/deployment config,
and external writes remain excluded.

Verification stays server-driven, eight-digit text with leading zero/paste/
keyboard/`one-time-code`, and never logs or URLs a code. Status and withdrawal
render only returned safe fields in plain language and never infer/collapse
verification, Administrator review, Director decision, or activation.

```text
public.signin              REALIZED
public.verify              RESPONSE_DISCARDED
public.application         RESPONSE_DISCARDED
public.application-status  RESPONSE_DISCARDED
static application status  STATIC_FALLBACK_CONFLICT
unsupported backend contracts  NONE at adoption
```

Add focused regression coverage before repair where practical. Stop for unknown
response fields, response widening, a Layer-C change, migration, provider
mutation, or client-side privilege inference.
