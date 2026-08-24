# Project Status

## Current state

FVR-001 has completed the Figma-native FI-00 through FI-03 implementation, authorized legacy frontend removal, and all post-removal verification. The coherent branch tree is ready for atomic publication and conditional clean-lineage propagation.

- Active frontend: `src/frontend/` through `src/index.html`.
- Functional authority: repository server, Worker, auth, domain, privacy, D1/R2, audit, and provider contracts.
- Visual authority: authenticated live Figma Make source; Figma Design is documentation/reference.
- Public Request and Lending flows submit to accepted APIs and construct receipts/tracking views only from server-confirmed state.
- FI-03 includes sign-in, session/bootstrap, logout, starter activation, email verification, account application, private status-token lookup, and supported withdrawal.
- FI-05 Inventory, FI-06 Internal Request Hub, and FI-07 Internal Lending Hub
  are accepted checkpoint-complete authenticated projections. FI-07 is DOL-only,
  reads strict Lending bootstrap v2 data, and sends review/handoff/return
  commands only through existing server-authoritative paths; it adds no Public
  Lending intake, availability fabrication, backend/auth/schema change, or stock
  approximation. Its A4 local inspection uses labelled deterministic review,
  issue, and return demonstrations with protected reads/mutations blocked. Sol
  accepted FI-07 with no findings at deterministic artifact SHA-256
  `707A00FDF4DC4BC6EB2C2053007B21F9997A9D51ADDF65F7EE1B65CAA091F738`.
  FI-08 is intake and handshake only; no FI-08 implementation packet exists.
- Guarded loopback preview uses the isolated Playground backend; Production crossover is forbidden.
- A4 is Sol-accepted: the Preview Index has an explicit loopback-only inspection context for fixture-backed presentation of protected modules. It does not create a Session, grant capabilities, bypass Worker authorization, or permit backend reads/writes.

No Production deployment, provider write, database mutation, migration, backend semantic change, or Figma write is authorized by this milestone.
