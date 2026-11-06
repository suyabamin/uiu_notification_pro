# Privacy Policy — UniPortal Monitor

**Last updated:** 2026-11-06
**Effective for:** UniPortal Monitor extension v1.0.0+

## Summary (TL;DR)

- We collect **nothing** that leaves your device.
- We store **no passwords**.
- We send **no data** to any server operated by us.
- We use **no analytics, tracking, or crash reporting**.

---

## 1. What We Collect

**Nothing.** This extension does not transmit any data to any server
operated by the developer.

---

## 2. What Is Stored Locally (On Your Device Only)

| Data | Where | Purpose | Retention |
|------|-------|---------|-----------|
| Extension settings | `chrome.storage.local` | Remember your preferences | Until you clear or uninstall |
| ELMS API token (if provided) | `chrome.storage.local` | Authenticate to ELMS API | Until you revoke or uninstall |
| Portal snapshots (parsed item lists only — **never full HTML**) | `chrome.storage.local` | Detect changes between checks | Overwritten each cycle |
| Update history (last 200 records) | `chrome.storage.local` | Show recent updates in popup | Rolls over; clearable |
| Transient session data (notified IDs, cookie cache) | `chrome.storage.session` | Deduplicate notifications | Auto-cleared on browser exit |

---

## 3. What We NEVER Do

- ❌ Never store your username or password.
- ❌ Never transmit data to third-party servers.
- ❌ Never read content from other websites.
- ❌ Never use analytics, telemetry, or crash reporters.
- ❌ Never sell, share, or monetize your data.
- ❌ Never inject ads or affiliate links.
- ❌ Never automate login form submission.

---

## 4. What Leaves Your Device

Only the following network requests, both to servers **you already use**:

| Destination | Purpose | Auth |
|-------------|---------|------|
| `https://ucam.uiu.ac.bd/*` | Read your UCAM portal pages | Your existing session cookie |
| `https://elms.uiu.ac.bd/*` | Call Moodle Web Services API | Your revocable API token |

No requests are made to any other domain.

---

## 5. Your Controls

| Control | How |
|---------|-----|
| Revoke ELMS token | Settings → ELMS → "Revoke token" |
| Clear update history | Settings → General → "Clear update history" |
| Clear all settings | Settings → General → "Clear all settings" |
| Disable notifications | Settings → Notifications → toggle off |
| Disable quiet hours | Settings → Notifications |
| Uninstall everything | Remove extension from browser |

Uninstalling the extension causes the browser to delete all extension storage.

---

## 6. Third Parties

We use **no** third-party services. No fonts from Google Fonts (bundled
locally). No CDN scripts. No external APIs.

---

## 7. Children's Privacy

This extension is not directed at children under 13. It does not knowingly
collect data from anyone, including children.

---

## 8. Changes to This Policy

Any changes will be:
- Reflected in the "Last updated" date above.
- Noted in `CHANGELOG.md`.
- Shown as a notice in the extension options page for major changes.

---

## 9. Contact

For privacy questions or concerns:
- Open a GitHub issue on the project repository.
- For security-sensitive matters, use GitHub private security advisory.

---

## 10. Open Source

This extension is open source. You can inspect every line of code to verify
the claims in this policy. The build you install from the store is
reproducible from the source in the public repository.