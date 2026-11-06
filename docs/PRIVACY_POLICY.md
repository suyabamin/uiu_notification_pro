# Privacy Policy

UniPortal Monitor stores settings, recent updates, snapshots, and last-check timestamps in browser extension storage on the user's device.

## Portal access

- UCAM uses existing browser session cookies. The extension does not request or store a UCAM password.
- ELMS uses the existing Moodle session cookie and fetches dashboard HTML from `https://elms.uiu.ac.bd/` over HTTPS.
- UCAM requests are restricted to `https://ucam.uiu.ac.bd/` over HTTPS.

## Data use and sharing

Portal data is used only to detect changes and display notifications. The extension does not include analytics, telemetry, advertising, crash reporting, or remote code. It does not send portal data to a developer-operated server.

## User controls

Users may disable either portal, clear update history, or remove the extension. Removing the extension deletes its locally stored extension data according to browser behavior.

## Security

The extension never reads, stores, or logs portal passwords. Session cookies are read only to check whether the portal is logged in; requests are sent to their respective portal over HTTPS.

## Limitations

Portal pages and selectors may change. UCAM selectors and ELMS dashboard parsing must be validated against current portal behavior before a production release.
