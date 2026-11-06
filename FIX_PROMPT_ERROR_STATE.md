# FIX PROMPT — "error" status on both portals (copy everything below the line into your coding agent)

---

## BUG REPORT

In the real browser (Chrome/Edge), the popup of **UIU Notification** shows:
- ELMS (Moodle): **error**
- UCAM Portal: **error**
- Updates (0), no notifications ever, "Check Now" does not help.

Both portals fail at the same time, so the cause is most likely in shared infrastructure (service worker, fetch layer, offscreen parser, storage validation, orchestrator, permissions), not only in one portal's parser. The popup shows only the word "error" with no reason, which is itself a defect.

## YOUR MISSION

1. Find the **real root cause(s)** with evidence (no guessing, no blind edits).
2. Fix them properly.
3. Make the extension **self-diagnosing and self-healing**, so that this class of failure is either impossible, recovered automatically, or explained clearly to the user with an actionable button. The goal: it keeps working permanently, across browser restarts, service-worker sleep, extension updates, session expiry, network drops, and portal layout changes.
4. Prove it with automated tests.

Read `docs/AGENTS.md` and `docs/SECURITY.md` first. All hard rules still apply (MV3, no password storage, GET only, two allowed hosts, minimal permissions, no secrets in logs, no remote code).

---

## PHASE A: Make errors visible (do this FIRST, before any fix)

### A1. Error taxonomy
Create `core/errors.ts` with a typed error model. Every failure in the pipeline must be converted into one of these (never a bare "error"):

| Code | Meaning | User-facing action |
|------|---------|--------------------|
| `PERMISSION_HOST_MISSING` | Host permission not granted or wrong pattern | "Grant access" button (request permission) |
| `NETWORK_OFFLINE` | No internet / DNS failure | Auto-retry, show "Offline" |
| `NETWORK_TIMEOUT` | Request > 20 s | Auto-retry with backoff |
| `NETWORK_BLOCKED` | TLS/connection refused/blocked by network | Show message, retry later |
| `HTTP_4XX` / `HTTP_5XX` | Server errors (with status) | Backoff |
| `HTTP_429` | Rate limited | 1 h backoff, explain |
| `SESSION_EXPIRED` | Login page returned | "Log in" button (opens login URL) |
| `SESSION_UNKNOWN` | Could not tell | Re-check, show details |
| `REDIRECT_OFF_ALLOWLIST` | Redirected to a non-allowed host | Block, show host name only |
| `OFFSCREEN_CREATE_FAILED` | Offscreen document could not be created | Auto-recreate, then show details |
| `OFFSCREEN_NO_RESPONSE` | Parser host did not answer in 5 s | Recreate and retry once |
| `PARSER_EMPTY_SUSPECT` | Page loaded but parser found 0 items where items existed before | "Parser may be outdated" banner + diagnostic report |
| `PARSER_EXCEPTION` | Parser threw | Log (redacted), isolate failing parser only |
| `STORAGE_VALIDATION_FAILED` | Zod rejected stored/new data | Auto-migrate or reset only the broken key, keep the rest |
| `STORAGE_QUOTA` | Storage full | Prune history automatically |
| `NOTIFICATION_PERMISSION_DENIED` | OS/browser blocks notifications | Show how to enable |
| `CYCLE_LOCKED` | Stale mutex | Auto-clear if older than 5 min |
| `INTERNAL_BUG` | Anything unexpected | Show short code + "Copy diagnostic report" |

Each error carries: `code`, `stage`, `portal`, `url` (path only, no query), `httpStatus?`, `message` (safe), `at`, `retryable`, `userAction?`.

### A2. Show the reason in the UI
- Popup status pill: `ELMS ● Login required` / `● Offline` / `● Parser outdated` / `● Error: <short reason>`. Clicking a pill expands a panel with: reason in plain English and Bangla, last success time, next retry time, and the action button (Log in / Grant access / Retry / Copy report).
- Dashboard → Diagnostics: per-portal timeline of the last 50 cycle stages with PASS/FAIL, error code, duration.
- Never show a bare "error".

### A3. Full pipeline diagnostic (`TEST_PIPELINE` message + "Run Diagnostics" button, which already exists in the popup footer; make it actually run this)
Run one cycle step by step per portal and output a table (PASS/FAIL + details + duration):
1. Manifest/permissions: `chrome.permissions.contains` for both host origins; notification permission level.
2. Alarm: `chrome.alarms.getAll()`; next scheduled time; last run time.
3. Service worker state: mutex value and age.
4. Storage: read/write/validate roundtrip for `settings`, `snapshot:*`, `status`, `meta`; report any Zod issue paths (not values).
5. Offscreen: `chrome.offscreen.hasDocument()`, create if missing, ping/pong within 2 s.
6. Fetch each target URL: status, final URL host and path, content-type, byte length, elapsed ms. No cookies, no HTML in output.
7. Session detection: result and which signal matched (URL pattern, login form, logout link).
8. Parse: per parser `ok`, `itemCount`, `warnings`, `parserVersion`.
9. Snapshot and baseline state: exists? item count? `baselineDone`?
10. Diff: counts of added/modified/removed against previous snapshot.
11. Notification pipeline: which filters would suppress (type disabled, muted course, quiet hours, snooze, hide-details), then send a real test notification and report success or `chrome.runtime.lastError`.
12. "Copy diagnostic report" produces a sanitized JSON/text (no cookies, tokens, sesskey, student ID, HTML).

Add a persistent, redacted ring-buffer logger (200 entries) used by every stage. No empty `catch {}` anywhere: lint rule `no-empty` plus a custom rule or test that fails on swallowed errors.

---

## PHASE B: Root-cause investigation (collect evidence for each suspect, report PASS/FAIL)

Both portals failing at once points first to these. Check them all:

1. **Host permissions:** manifest patterns must match actual URLs, e.g. `https://elms.uiu.ac.bd/*` and `https://ucam.uiu.ac.bd/*`. Check that WXT build output manifest really contains them, and that the permission is *granted* at runtime (some setups need `permissions.request`). A fetch without effective host permission fails or omits cookies.
2. **Fetch options:** `credentials: "include"` present? Not using `mode: "no-cors"` (which returns opaque responses and breaks reading)? `redirect: "follow"`? Not sending forbidden headers?
3. **Cookies not sent / SameSite:** if the portal cookies are `SameSite=Lax/Strict`, background fetches with host permission normally still work in extensions; verify with a real request and compare status and final URL. If login page is returned despite being logged in, investigate cookie partitioning/SameSite and consider alternatives that keep security rules intact (for example, perform the fetch from an offscreen document or an extension page with the same host permissions, or use `chrome.cookies` only if justified and documented). Do not store passwords.
4. **Offscreen document:** wrong `url` path in `chrome.offscreen.createDocument` (WXT output path differs from source path), missing `offscreen` permission, wrong `reasons` (use `DOM_PARSER`), `justification` missing, or creating it twice (throws). Add `hasDocument()` guard and a recreate-on-failure path. Confirm message passing returns a value (use `sendMessage` with a response, return `true` for async).
5. **Service worker lifecycle:** long awaits or unhandled promise rejections killing the cycle; listeners registered asynchronously (they must be registered synchronously at top level); alarm not recreated on `onInstalled`/`onStartup`; top-level code throwing during module init.
6. **Storage + Zod:** schema mismatch between stored defaults and the validator (for example missing field, enum mismatch, `undefined` vs `null`), causing every read to throw and the status to become "error". Verify default settings parse successfully. Verify migrations run.
7. **Orchestrator exception handling:** one thrown error marks both portals as "error" because try/catch is outside the per-portal loop. Must be per portal, per course, per parser.
8. **Status mapping bug:** UI maps any non-success (including `login_required`, `parser_suspect`, "never checked") to "error". Fix mapping to the taxonomy.
9. **Allow-list bug:** `isAllowedUrl` rejects valid URLs (trailing dot, port, uppercase, `www.`, query strings) or rejects redirect targets.
10. **Mock leftovers:** code that still points to mock hosts, localhost, or test-only allow-list overrides in production builds.
11. **Content Security Policy:** CSP blocks something the offscreen or UI needs (inline style/script), producing runtime errors.
12. **Wrong URLs:** parsers/collectors request paths that do not exist on the real portals (404/redirect). UCAM login URL is `https://ucam.uiu.ac.bd/Security/LogIn.aspx` and ELMS login is `https://elms.uiu.ac.bd/login/index.php`.

Report each suspect with evidence (log lines, status codes, stack traces, manifest excerpt). State clearly which are the confirmed root causes.

---

## PHASE C: Fix, and make it permanent

### C1. Fix confirmed causes minimally and correctly.

### C2. Resilience layer (this is what makes it work "all the time")
1. **Isolation:** failures are contained per portal → per course → per parser. One failing course/parser never marks the whole portal as error; partial results are still diffed and notified, with a warning.
2. **Alarm self-healing:**
   - Create/verify the alarm on `onInstalled`, `onStartup`, service-worker boot, settings change, and every time the popup/dashboard opens.
   - A **watchdog alarm** (every 5 min, `chrome.alarms`) checks: is the main check overdue by > 2× interval? If so, run a cycle now and recreate the main alarm.
3. **Mutex with TTL:** `cycleRunningSince` in `storage.session` (plus fallback in local); auto-release after 5 minutes; always released in `finally`.
4. **Offscreen self-healing:** `ensureOffscreen()` used before every parse: checks `hasDocument`, creates if needed, pings; on failure closes and recreates once, then raises `OFFSCREEN_*` error.
5. **Retry policy:** network errors/5xx: up to 2 retries with exponential backoff and jitter; 429: 1 h portal backoff; per-portal **circuit breaker** (open after 5 consecutive failures, half-open probe after cool-down; state visible in UI).
6. **Session recovery:** on `SESSION_EXPIRED`, show one notification (max once per 6 h) with a click action to open the login page; when the user logs in, the next "Check now" or the next alarm recovers automatically; also listen for tab updates to the portal host (without needing the `tabs` permission, use `chrome.webNavigation` only if justified; otherwise rely on popup/status polling) to trigger a quick re-check after login.
7. **Storage safety:** validate on read; if one key is corrupted, repair or reset **that key only** and log it, never wipe everything. Versioned migrations with tests. Prune history by count/age. Never let a storage failure crash the cycle.
8. **Parser resilience:** each parser returns `{ok, items, warnings, parserVersion}`; multiple fallback selectors; `PARSER_EMPTY_SUSPECT` when a previously non-empty source returns 0 items or drops > 50 %; never emit mass "removed"; keep last good snapshot instead of overwriting it with a suspect one.
9. **Network awareness:** skip cycles quietly when `navigator.onLine` is false, retry on the `online` event.
10. **Update safety:** on extension update, run migrations and recreate alarms/offscreen automatically.
11. **Notification fallbacks:** if `chrome.notifications.create` fails, still update the badge and in-extension center, and show the "notifications blocked" guidance.
12. **Generic safety net:** if a portal-specific parser breaks, the Watched Page generic detector still reports raw content changes for configured pages.
13. **Defaults sanity:** default settings must produce notifications for high-priority changes (quiet hours off, snooze off, all kinds enabled).

### C3. Unknown real layouts
Do **not** invent selectors for pages you have not seen. If a parser returns 0 items on real pages, ask me for the exact sanitized fixture(s) (use `fixtures/elms/real/` and `fixtures/ucam/real/`), and meanwhile surface `PARSER_EMPTY_SUSPECT` visibly. Use the diagnostic report to tell me exactly which page and parser need a real sample.

---

## PHASE D: Tests (must be added; they must fail before the fix and pass after)

**Unit**
- Error mapping: every thrown error type maps to the right taxonomy code.
- Status mapping: each code → correct UI status; "never checked" is not "error".
- Zod: default settings/snapshot/status parse; corrupted key repairs only that key.
- Mutex TTL auto-release; watchdog triggers overdue cycle; alarm recreated when missing.
- Circuit breaker transitions (closed → open → half-open → closed).
- `isAllowedUrl`: accepts real portal URLs (with query, uppercase host, trailing slash) and rejects lookalikes.
- Parser returning 0 items → `PARSER_EMPTY_SUSPECT`, previous snapshot preserved, no mass removals.
- Login page response → `SESSION_EXPIRED` (never "connected").
- Baseline → mutate → exact expected changes; stable IDs across two fetches (no false "modified").
- Dedup never blocks genuinely new changes.

**Integration / E2E (Playwright, extension loaded, mock portal)**
- Fresh install → alarm exists, offscreen created, onboarding shown.
- Logged-out portal → "Login required" with action button; after login → connected, baseline silent.
- Mutate mock: new material, changed due date, new notice, new grade → notification + badge within one cycle after "Check now".
- Kill/restart service worker mid-cycle → next cycle recovers; stale mutex cleared.
- Simulate browser restart → alarm recreated.
- Offscreen closed manually → auto-recreated.
- Mock server returns 429, 500, timeout, redirect to off-allowlist host → correct codes and UI messages, other portal unaffected.
- Corrupt one storage key → only that key reset, extension keeps working.
- Notifications permission denied → badge and in-extension center still work, guidance shown.
- Popup never shows a bare "error": every error state shows a reason and an action.

**Regression guard:** a test that scans the source for empty catch blocks and for UI strings equal to just `"error"`.

Keep coverage ≥ 85 % for `core/` and `adapters/`. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build:chrome && pnpm build:edge && pnpm scan:bundle && pnpm test:e2e`.

---

## PHASE E: Final report (required)

1. The diagnostic table from a real run (sanitized).
2. Confirmed root cause(s) with evidence, and which suspects were ruled out.
3. List of code changes grouped by file.
4. Resilience features implemented (C2 checklist with status).
5. Test results and coverage.
6. **Manual verification checklist** for me on real ELMS and UCAM in Chrome and Edge (steps: reload extension, log in, Run Diagnostics, Check now, close/reopen browser, wait for alarm, simulate change).
7. The exact list of real fixtures still needed (page name, URL path, how to save) if any parser is still unverified.

Work in order A → B → C → D → E. Commit after each phase with Conventional Commits. Do not skip Phase A and B. Do not weaken any rule in `AGENTS.md`/`SECURITY.md` to make the error go away.
