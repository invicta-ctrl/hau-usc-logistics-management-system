# Legacy FI Classification Map

STATUS: FI14_FI17_LOCAL_COMPLETION__ACTIVE_CLASSIFICATION
AUTHORITY: Earl's 2026-08-27 FI-14 through FI-17 Local Integration Completion Owner Amendment; no FM lane or provider resource is established by this file.

| Legacy slices | Classification | State and routing |
| --- | --- | --- |
| FI-09 through FI-13 | FRONTEND_INTEGRATION | Closed/frozen local FI work. FI-13 is the latest checkpoint: receipt `.codex/FI13_FINAL_CRAFT_EXACT_FRONTEND_FREEZE_RECEIPT.md`; source commit `a377f079ce39f6c8b8e5e76f80f59b62e932d80e`; tree `4177693026d0b239dff6255d5a4cbaa52cf26d86`; application artifact SHA-256 `B1B1F51E7C5DB3B96F7EB55A9CFE3C6E7F36B9D741807219BB6BEA2FB1B20556`. |
| LEGACY-FI14 / FM-01 | FRONTEND_MIGRATION | Preserved historical isolated Playground attempt only. Its schema 30/32 reconciliation remains outside FI and does not block active FI-14. |
| FI-14 | FRONTEND_INTEGRATION | Active local runtime and backend-contract completion on `frontend-design-integration`; no Playground or Production deployment. |
| FI-15 | FRONTEND_INTEGRATION | Owner-accepted local end-to-end workflow integration. |
| FI-16 | FRONTEND_INTEGRATION | Owner-accepted final local hardening and five-width acceptance matrix. |
| FI-17 | FRONTEND_INTEGRATION | Owner-accepted production-mode local build, artifact freeze, and FI closure. |

BOUNDARY: This map neither creates nor owns the FM lane or any FM/provider resource. Active FI-14 through FI-17 are local-only; no legacy migration retry, deployment, provider/schema/data write, or Production action is authorized.
