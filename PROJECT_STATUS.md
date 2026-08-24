# Project Status

## Current state

FVR-001 has completed the Figma-native FI-00 through FI-03 implementation, authorized legacy frontend removal, and all post-removal verification. The coherent branch tree is ready for atomic publication and conditional clean-lineage propagation.

- Active frontend: `src/frontend/` through `src/index.html`.
- Functional authority: repository server, Worker, auth, domain, privacy, D1/R2, audit, and provider contracts.
- Visual authority: authenticated live Figma Make source; Figma Design is documentation/reference.
- Public Request and Lending flows submit to accepted APIs and construct receipts/tracking views only from server-confirmed state.
- FI-03 includes sign-in, session/bootstrap, logout, starter activation, email verification, account application, private status-token lookup, and supported withdrawal.
- FI-05 Inventory and FI-06 Internal Request Hub are accepted,
  checkpoint-complete authenticated projections. FI-06 is DOL-only, reads the
  strict Request bootstrap v2 contract, and sends review commands only through
  the existing server-authoritative path; it does not add Release or stock math.
  A4 local inspection uses only labelled deterministic fixtures with protected
  reads and mutations blocked. FI-07 remains intake and handshake only.
- Guarded loopback preview uses the isolated Playground backend; Production crossover is forbidden.
- A4 is Sol-accepted: the Preview Index has an explicit loopback-only inspection context for fixture-backed presentation of protected modules. It does not create a Session, grant capabilities, bypass Worker authorization, or permit backend reads/writes.

No Production deployment, provider write, database mutation, migration, backend semantic change, or Figma write is authorized by this milestone.
