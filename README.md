# HAU-USC Logistics Management System

Front-end prototype for the Holy Angel University University Student Council Department of Logistics.

## Project status

This repository currently contains **Revision 02**, a fully runnable front-end prototype. It uses realistic mock data and keeps `previewMode = true`; it does not write to Google Sheets or Google Drive.

The current single-file implementation is retained as the visual and functional baseline before the planned multi-file/full-stack migration.

## Run locally

No installation or build step is required yet.

1. Download or clone the repository.
2. Open `index.html` in a modern browser.
3. Use the included preview data to explore the logistics workflows.

## Current modules

- Dynamic overview and event readiness
- Logistics Request Center and office restocking
- Predictive inventory item matching
- Inventory and controlled stock ledger
- Release Desk
- Office Lending Hub
- Restocking and item registration
- Scalable canvass reference library
- Request-only portal mode
- Responsive desktop, tablet, and mobile layouts

## Repository structure

```text
.
├── index.html
├── assets/
│   ├── images/
│   └── logos/
└── docs/
    ├── frontend-preview-log.md
    ├── roadmap-import.txt
    └── roadmap-node-content.md
```

Place approved DOL and USC branding files in `assets/logos/`. General interface imagery belongs in `assets/images/`.

## Architecture direction

The mock service/state layer is intended to be replaced later by a Google Apps Script or other backend without rebuilding the interface. Google Sheets should serve as a reporting/export destination rather than the primary application database.

Planned next steps include splitting the current HTML into maintainable modules, adding automated checks, formalizing shared data contracts, and implementing authenticated backend integrations.

## Important

This is a prototype. Do not use it for live inventory transactions, procurement approvals, or official records until authentication, authorization, validation, audit logging, backups, and production persistence are implemented.
