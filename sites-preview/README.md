# GPT Sites Preview Adapter

This adapter serves the committed `../dist/index.html` candidate unchanged at
every front-end route. It returns a safe 404 for `/api/*` and contains no
credentials, private data, provider identifiers, or protected operations.

Build with `npm run build` from this directory, then package through the GPT
Sites repository helper. The generated `dist/` is an upload artifact and is not
hand-edited.
