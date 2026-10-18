---
trigger: glob
description: Follow the portal Figma screens and both accessible responsive themes
globs: "apps/web/**"
---

# Portal UI rules

Read `docs/SCREEN-MAP.md` and `docs/DESIGN-SYSTEM.md`.

Use individual Figma screen appearance ahead of conflicting older Foundations colors. Build semantic tokens and reusable controls. Do not paste a dashboard screenshot into the interface or copy fixed desktop coordinates into responsive layouts.

Support English, both themes and desktop/tablet/mobile. Use rem for typography. Verify focus, labels, keyboard use, dialogs, empty/loading/error states and contrast in both themes. Use the real Clerk authentication and security flows styled to match the design; do not create a second password store.

Client-facing flows contain meaningful product language, not implementation details. Do not present fictional Figma invoice amounts, timestamps, names or activity counts as live data. Do not expose Owner actions to Clients. Backend permissions remain authoritative.

Request browser notification permission only after an explicit user action. Private pages and API responses must not be cached for offline access by the service worker.
