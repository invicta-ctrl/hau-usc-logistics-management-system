# Known Limitations

- Preview-only local browser persistence; no shared concurrency or durable backup.
- Role switcher is demonstrative and not authentication/authorization.
- Apps Script and REST adapters are stubs; no external writes occur.
- Evidence validates type/size and stores metadata only; object URLs are session-local.
- Browser exports are simple JSON/CSV structures, not signed official reports.
- Printable release and label views use browser printing, not a controlled PDF service.
- Generated catalog/quote rows prove pagination but are fictional.
- Formal accessibility, privacy, records-retention, institutional SSO, concurrency, offline, and disaster-recovery testing remain future work.
- Playwright browser binaries were unavailable in the implementation environment; responsive/focus assertions are provided but require execution on a machine or CI runner with Chromium installed.
- `dist/index.html` should be served over HTTP for normal development. Direct `file://` behavior can vary by browser security policy even though assets are inlined.
