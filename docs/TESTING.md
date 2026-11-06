# Manual QA checklist

These checks require real portal accounts and a browser with the extension loaded. Use test accounts where possible. Never paste a password into the extension or save real tokens in fixtures.

## Browser installation

- [ ] Load `dist/chrome` in Chrome and confirm the popup and Options page open.
- [ ] Load `dist/firefox/manifest.json` in Firefox through `about:debugging` and confirm no manifest or service-worker errors.
- [ ] Load the Chrome-derived package in Edge and Opera.
- [ ] Close and reopen each browser; confirm the periodic alarm continues after the background worker sleeps.

## UCAM

- [ ] Sign in to UCAM in a regular tab and confirm the extension detects the session without requesting a password.
- [ ] Run “Check now” and inspect each enabled page against `src/adapters/ucam/selectors.ts`.
- [ ] Save sanitized HTML for each page where the provisional selectors do not match; remove names, IDs, course identifiers, and personal details first.
- [ ] Add a new notice or other test update and confirm it appears once in Recent Updates.
- [ ] Sign out and confirm the UI indicates that UCAM login is required.

## ELMS

- [ ] Sign in to ELMS in a regular tab and confirm the MoodleSession cookie is reflected as Connected in Options.
- [ ] Run “Check now” and compare extracted materials, assignments, and forum links with the ELMS dashboard.
- [ ] Sign out of ELMS and confirm the adapter returns to the not-logged-in state and shows the login call to action.

## Notifications and settings

- [ ] Confirm three or more new updates coalesce into one desktop notification.
- [ ] Confirm quiet hours suppress desktop notifications while the badge still reflects unread updates.
- [ ] Confirm “Mute 30 min” expires and notifications resume.
- [ ] Click a notification and confirm its update is marked read and its portal URL opens.
- [ ] Confirm “Mark all read” clears the badge and “Clear update history” removes saved updates.
- [ ] Verify all popup and Options controls are keyboard accessible and readable in light and dark mode.

## Release artifacts

- [ ] Confirm all four `build/*-mv3.zip` archives contain a root `manifest.json` and load in their target browser.
- [ ] Confirm the notification sound is a valid WAV and plays when sound is enabled in a supported browser.
