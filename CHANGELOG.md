# Changelog

## v1.0.0

Initial cross-browser implementation:

- Manifest V3 extension skeleton with popup and settings pages.
- Local settings, update history, snapshot storage, and runtime messaging.
- Persistent alarm scheduling, check orchestration, notification coalescing, quiet hours, deduplication, and unread badge.
- ELMS token validation, course/material polling, and token expiry handling.
- UCAM cookie presence checks and provisional section scraping/parsing.
- Chrome, Firefox, Edge, and Opera build archives.

Before relying on a production release, verify UCAM selectors and Moodle API permissions against real portals, implement custom notification audio, and complete the manual checklist in `docs/TESTING.md`.
