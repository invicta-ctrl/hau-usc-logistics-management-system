# Known Limitations

- Local mock mode is preview-only browser persistence with no shared concurrency or durable backup. Apps Script mode uses the server boundary; the future REST mode remains reserved.
- Local role display is demonstrative. Apps Script authorization always resolves the active Google identity and server-side access row.
- Version 0.5.0 near-live behavior for authenticated internal sessions uses 15-second jittered scoped polling, not WebSockets or guaranteed server push. Hidden/offline/inactive tabs pause, failures back off, dirty input defers refresh, and normal visibility/network timing can exceed the owner-approved p95-at-or-below-25-second staging target. The request-only portal stays outside the internal polling controller.
- Dirty-state protection defers refresh; it does not merge simultaneous edits. The user must choose when to reload and may need to re-enter conflicting changes.
- The direct-edit revision mechanism detects relevant spreadsheet edits after the installable trigger is configured; it does not make manual sheet editing a supported transactional workflow or add row-level conflict resolution.
- The operational edit trigger is environment-specific and is not created by repository commands. Each staging/production spreadsheet requires explicit reviewed setup.
- Google Sheets remains appropriate for a controlled low-volume pilot, not high-throughput transactional concurrency. Revision polling signals change but does not turn Sheets into an ACID database.
- Evidence in local mock mode validates type/size and stores metadata only; object URLs are session-local. Apps Script evidence still depends on reviewed Drive configuration and retention policy.
- Browser exports are simple JSON/CSV structures, not signed official reports.
- Printable release and label views use browser printing, not a controlled PDF service.
- Generated catalog/quote rows prove pagination but are fictional.
- Formal accessibility conformance, records-retention approval, institutional identity policy, sustained concurrency/load testing, offline editing, and disaster-recovery exercises remain future work.
- The 0.5.0 repository gates and complete configured Playwright matrix pass locally, but live two-session polling, direct-edit trigger behavior, operational workflow acceptance, and manual accessibility checks still require a separately authorized staging exercise.
- The restored visual compatibility runtime is still generated as one large controller and has not yet been migrated view-by-view to the hardened modular service contract.
- Legacy browser confirmations and broad rerender behavior remain inside that compatibility runtime; do not copy those patterns into new controllers.
- GitHub's file viewer does not execute HTML. Download `dist/index.html`, use GitHub Pages, or run `npm run dev`/`npm run preview` to interact with the site.
