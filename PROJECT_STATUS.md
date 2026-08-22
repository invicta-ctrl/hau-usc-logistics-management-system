# Project Status

## Current state

FVR-001 has completed the Figma-native FI-00 through FI-03 implementation, authorized legacy frontend removal, and all post-removal verification. The coherent branch tree is ready for atomic publication and conditional clean-lineage propagation.

- Active frontend: `src/frontend/` through `src/index.html`.
- Functional authority: repository server, Worker, auth, domain, privacy, D1/R2, audit, and provider contracts.
- Visual authority: authenticated live Figma Make source; Figma Design is documentation/reference.
- Public Request and Lending flows submit to accepted APIs and construct receipts/tracking views only from server-confirmed state.
- FI-03 includes sign-in, session/bootstrap, logout, starter activation, email verification, account application, private status-token lookup, and supported withdrawal.
- Authenticated operational workspaces remain deferred to FI-04 and are not exposed as synthetic state.
- Guarded loopback preview uses the isolated Playground backend; Production crossover is forbidden.

No Production deployment, provider write, database mutation, migration, backend semantic change, or Figma write is authorized by this milestone.
