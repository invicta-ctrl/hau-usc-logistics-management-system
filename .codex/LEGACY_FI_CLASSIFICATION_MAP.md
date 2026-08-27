# Legacy FI Classification Map

STATUS: FI_FM_PARALLEL_A1__COMPACT_ROUTING_MAP
AUTHORITY: FI-FM-PARALLEL-A1 owner amendment; compact classification only; no lane or provider resource is established by this file.

| Legacy slices | Classification | State and routing |
| --- | --- | --- |
| FI-09 through FI-13 | FRONTEND_INTEGRATION | Closed/frozen local FI work. FI-13 is the latest checkpoint: receipt `.codex/FI13_FINAL_CRAFT_EXACT_FRONTEND_FREEZE_RECEIPT.md`; source commit `a377f079ce39f6c8b8e5e76f80f59b62e932d80e`; tree `4177693026d0b239dff6255d5a4cbaa52cf26d86`; application artifact SHA-256 `B1B1F51E7C5DB3B96F7EB55A9CFE3C6E7F36B9D741807219BB6BEA2FB1B20556`. |
| FI-14 | FRONTEND_MIGRATION | Alias `FM-01 / LEGACY-FI14`. Terminal migration-reconciliation blocker: sealed expected schema `30` conflicts with live isolated D1 schema `32`; provider-manifest/schema reconciliation requires separate owner authority. |
| FI-15 | FRONTEND_MIGRATION | Future whole-product acceptance. Route any frontend defects back to FI; do not start it from this transition. |
| FI-16 through FI-17 | PRODUCTION_RELEASE | Outside FI-FM-PARALLEL-A1. |

BOUNDARY: This map neither creates nor owns the FM lane or any FM/provider resource. It preserves the FI-14 Production boundary and does not authorize a retry, deploy, migration, data write, or Production action.
