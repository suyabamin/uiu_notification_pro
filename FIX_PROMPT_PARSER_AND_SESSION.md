# FIX PROMPT — "Parser Outdated for ELMS" + "UCAM Login Required" (copy everything below the line into your coding agent)

---

## BUG REPORT (from the real browser)

The popup now shows meaningful states (good), but the extension still cannot work on the real portals:

1. **ELMS (Moodle): `Parser Suspect`** with the message "0 items matched on active session. Portal layout may have changed." The session is valid (logged in) but every parser returns 0 items. So the parsers were written for **mock fixtures** and do not match the real UIU ELMS HTML.
2. **UCAM: `Login Required`** although the user may be logged in. Possible false positive in session detection, wrong login/start URLs, or a layout (frames, postbacks) the code does not understand.

Real portal base URLs (use these as the source of truth):
- ELMS: `https://elms.uiu.ac.bd/`
- UCAM: `https://ucam.uiu.ac.bd/`
(Known login pages: `https://elms.uiu.ac.bd/login/index.php` and `https://ucam.uiu.ac.bd/Security/LogIn.aspx`.)

## ROOT PROBLEM TO SOLVE FOREVER

Hard-coded CSS selectors written from guesses will break again whenever the theme, Moodle version, or UCAM layout changes. We cannot see the real logged-in HTML ourselves. The permanent solution is NOT "better guessed selectors". It is:

1. **Theme-independent extraction** (rely on stable URL patterns and data, not CSS classes).
2. **Layered fallbacks** so something always works.
3. **Auto-discovery** of what exists on the user's real portal.
4. **A built-in sanitized sample capture tool** so real fixtures can be produced with one click, without the user hand-editing HTML.
5. **Self-diagnosis and visible health**, so a layout change is detected and explained, never silent.
6. **Contract tests + canaries** so regressions are caught immediately.

Read `docs/AGENTS.md` and `docs/SECURITY.md` first. All hard rules still apply (MV3, no password storage, only the two hosts, minimal permissions, no secrets in logs, no remote code, untrusted-HTML handling). Where this prompt needs an exception, it is stated explicitly in section 3 (Layer 1) and you must record it in `docs/AGENTS.md` and `docs/SECURITY.md`.

---

## STEP 0: Fix configuration first

Create `src/adapters/portals.config.ts` as the single source of truth:

```ts
export const PORTALS = {
  elms: {
    baseUrl: "https://elms.uiu.ac.bd/",
    loginUrls: ["https://elms.uiu.ac.bd/login/index.php"],
    startUrls: ["https://elms.uiu.ac.bd/my/", "https://elms.uiu.ac.bd/my/courses.php"],
  },
  ucam: {
    baseUrl: "https://ucam.uiu.ac.bd/",
    loginUrls: ["https://ucam.uiu.ac.bd/Security/LogIn.aspx"],
    startUrls: ["https://ucam.uiu.ac.bd/"],
  },
} as const;
```
- Remove every mock host, localhost or test-only URL from production code paths (keep them only in `tests/`).
- Host allow-list and manifest host permissions must be derived from this config and verified by a test.
- Handle redirects: `https://ucam.uiu.ac.bd/` may redirect to a login page or to a home page. Record the redirect chain (hosts and paths only) in diagnostics.

---

## STEP 1: Build the "Capture Sample" tool FIRST (this removes the fixture bottleneck forever)

Add Dashboard → Diagnostics → **"Capture page sample"**. Behavior:
1. User chooses a portal and a page (from a list of discovered/known URLs, or pastes a URL on the allow-list).
2. The extension fetches it with the logged-in session (GET) and runs a **sanitizer** in the offscreen document:
   - Remove all `<script>` contents, inline event handlers, `<style>` bodies (keep class names and structure), `<iframe>` src, images' src (replace with `about:blank`), `<input type=hidden>` values, `__VIEWSTATE`, `__EVENTVALIDATION`, `sesskey`, tokens, cookies, emails, phone numbers, URLs query values for `sesskey`/`token`/`key`.
   - Replace personal text with placeholders: the user's name (detect from the user menu/profile text), student ID patterns, email addresses → `[REDACTED_NAME]`, `[REDACTED_ID]`, `[REDACTED_EMAIL]`.
   - **Keep structure**: tags, classes, `id`, `data-*` attributes, link paths (`/course/view.php?id=123`, `/mod/resource/view.php?id=45`), headings, and course/activity titles (these are not personal; offer a toggle "Anonymize titles" which replaces text with `Title 1`, `Title 2` while keeping tag structure).
3. Show a preview (text only, never rendered HTML) with a redaction summary ("removed 14 tokens, 3 emails, 1 name").
4. Buttons: **Copy to clipboard**, **Download .html**. Saved files are named `<portal>-<page>-<date>.html` and are ready to drop into `fixtures/<portal>/real/`.
5. Also add **"Capture structural fingerprint"**: a compact JSON describing the page: all distinct URL path patterns found in links with counts (for example `/course/view.php?id=*`: 8, `/mod/resource/view.php?id=*`: 23), the top-level landmark structure (nav, main, region ids/roles), list of `data-region`/`data-for` values, Moodle version (from `<meta name="generator">` or `M.cfg.version`/body classes), theme name (body class `theme-*`/`path-*`/`format-*`), and counts per tag/class family. This tiny JSON is safe to paste into chat and tells us the real structure without sharing the full page.
6. Unit-test the sanitizer with fixtures containing fake names, emails, tokens; it must never leak them. Add a test that the output contains none of a list of "canary secrets".

---

## STEP 2: ELMS extraction, three layers (try in order, merge results, never silently empty)

### Layer 1 (preferred, theme-independent): Moodle web-service AJAX, read-only
Moodle exposes `M.cfg` in the page (contains `wwwroot`, `sesskey`, `userId`). The standard AJAX endpoint is `POST /lib/ajax/service.php?sesskey=<sesskey>&info=<method>`.
- Extract `sesskey` **in memory only** from the fetched page (`M.cfg` inline script, parsed as text with a regex; never executed, never stored, never logged).
- **Documented exception to the GET-only rule:** allow `POST` **only** to `https://elms.uiu.ac.bd/lib/ajax/service.php` and **only** for an explicit whitelist of read-only methods. Any other POST remains forbidden. Update `docs/AGENTS.md` rule 8 and `docs/SECURITY.md` accordingly, and add a unit test that blocks non-whitelisted methods and non-ELMS hosts.
- Whitelisted read-only methods (use only if they respond; handle "service disabled / access denied" gracefully):
  - `core_course_get_enrolled_courses_by_timeline_classification`
  - `core_course_get_contents` (course sections and modules)
  - `core_course_get_updates_since` (what changed since a timestamp, ideal for change detection)
  - `core_calendar_get_action_events_by_timesort`
  - `message_popup_get_popup_notifications`
  - `gradereport_user_get_grade_items` (if available)
  - `mod_forum_get_forum_discussions` (if available)
- If a method returns an exception (access control, disabled), record it as `LAYER1_METHOD_UNAVAILABLE` per method and fall through to Layer 2 for that data type. Feature-detect, do not assume.
- This layer is controlled by a setting "Use Moodle API when available" (default ON) so the user can disable it.

### Layer 2: URL-pattern HTML parsing (theme-independent GET fallback)
Do not depend on theme CSS classes. Moodle URLs are stable across themes. Algorithm:
1. Fetch `/my/courses.php` and `/my/` and collect **all anchors** whose `href` matches `/course/view.php?id=<n>`. De-duplicate by id. Course name = the anchor's visible text or `title`/`aria-label`; if empty, fetch the course page `<title>`/`h1`. This yields the course list even if the theme changes.
2. For each watched course, fetch `/course/view.php?id=<n>` and collect all anchors matching module URL patterns: `/mod/<modname>/view.php?id=<cmid>` (resource, folder, page, url, assign, quiz, forum, book, label via surrounding text, etc.). Derive: `cmid` from the URL, `modtype` from the path, `name` from the anchor text with hidden helper text (`.accesshide`, `.sr-only`, "File", "Folder") removed, `section` from the nearest ancestor with a section-like marker (`data-sectionid`, `id^="section-"`, `li.section`, `[data-for="section"]`; if none found, use "Unknown section").
3. Also read `/mod/<modname>/index.php?id=<courseId>` for assign, forum, quiz, resource lists when helpful.
4. Grades: fetch `/grade/report/user/index.php?id=<courseId>`; extract table rows by structure (a table containing a grade/percentage-like cell), not by class names; fall back to Layer 3 text diff.
5. Announcements: find the forum whose module name is "Announcements"/"News forum" or `modtype_forum` with that title; list discussions by anchors matching `/mod/forum/discuss.php?d=<n>`.
6. Calendar: `/calendar/view.php?view=upcoming`, events by anchors matching `/calendar/view.php?...&time=` or `data-event-id`.
7. Notifications: `/message/output/popup/notifications.php` or `/admin/tool/...` equivalents, items by anchors and timestamps.
8. Keep `selectors.ts`, but as **optional enhancers** (extra fields like due date), never as the only way to find items. Every optional field failing must lower confidence, not return 0 items.
9. Compute a **confidence score** and `layer` used per parser; show it in Diagnostics.

### Layer 3: Generic content-region diff (last resort, always available)
If Layers 1 and 2 yield nothing for a page: pick the main content region heuristically (`[role=main]`, `#region-main`, `main`, `#page-content`, else largest text-bearing container excluding nav/header/footer/aside), remove volatile nodes (scripts, styles, hidden inputs, timestamps/clock, sesskey), normalize text, hash it, and report **"This page changed"** with a line-level text diff. Items = the page itself. This guarantees notifications even when structure is unknown, and feeds `PARSER_EMPTY_SUSPECT` only when even the page text is empty.

### Health logic
- `PARSER_SUSPECT` only when **all three layers** return nothing for a page that previously produced items, or the page is clearly not the expected one.
- If Layer 1 or 2 works, status = `connected` (with a small "degraded: using fallback" tag if Layer 3 was needed).
- Preserve the last good snapshot when a cycle is suspect; never emit mass "removed".

---

## STEP 3: UCAM extraction (ASP.NET WebForms, layout unknown)

Do not guess UCAM pages. Use **discovery**:

### 3.1 Fix session detection (the "Login Required" false positive)
- Reproduce with diagnostics: for `https://ucam.uiu.ac.bd/`, record status, redirect chain (host+path), `<title>`, whether a password input exists, whether a logout link exists, whether `__VIEWSTATE` exists, and which rule decided "login required".
- Decide logged-in vs logged-out using **multiple signals with scoring**, never one URL check:
  - Logged-out signals: final path contains `Security/LogIn.aspx` (case-insensitive), a visible `input[type=password]` with a submit button, no logout link.
  - Logged-in signals: link/button with text or href containing "logout", "log out", "sign out", `Logout.aspx`; presence of a student-name header region; menu navigation with many internal links.
  - Case-insensitive comparisons, ignore query strings and trailing slashes.
- If the portal opens in the user's tab as logged-in but the background fetch gets the login page, investigate: cookie `SameSite`, session bound to something else, or a required header. Report evidence. Possible legitimate fixes within the rules: perform the fetch from the offscreen document or an extension page with the same host permissions; verify `credentials: "include"`; test with `cache: "no-store"`. Do not store passwords. If it truly cannot be solved without the user, show a clear "Open UCAM and log in, then click Re-check" flow with a **Re-check** button that works immediately.
- Add a state "Logged in, nothing configured yet" (not an error) when the session is valid but no pages are watched.

### 3.2 Menu/link auto-discovery
After a valid session is detected, fetch the home page and **discover navigation**:
- Collect same-host anchors from the menu/nav/sidebar/main areas; exclude `javascript:`, `__doPostBack`, logout, external hosts, files that download, and anchors that need POST.
- Group by menu section using ancestor headings/list structure; show name + path.
- Dashboard → **UCAM Pages**: shows discovered pages as a checklist ("Notice Board", "Result", "Dues", etc., names come from the portal). The user ticks what to watch; each becomes a Watched Page automatically (Layer 3 generic diff with volatile-content stripping: `__VIEWSTATE`, `__EVENTVALIDATION`, `__EVENTTARGET`, hidden inputs, timestamps, counters).
- Smart defaults: pre-tick pages whose names/paths match notice/announcement/result/grade/due/payment/routine/exam/registration (English only keywords, configurable).
- For tables, offer **row-level diff** (rows added/changed) in addition to text diff.
- Pages requiring postback to show content are marked "needs interaction (not supported in v1)" with an explanation, not an error.

### 3.3 Sample capture for UCAM
The same "Capture page sample" and "structural fingerprint" tools work for UCAM pages so parsers for specific pages (notices, results) can be added later from real samples.

---

## STEP 4: Make failures impossible to hide

- Popup status text must be specific: `Connected`, `Connected (fallback mode)`, `Login required`, `Parser outdated (page: <name>)`, `Offline`, `Error: <code>`. Each has an action button (Log in / Re-check / View diagnostics / Capture sample).
- The yellow banner "Parser Outdated" must include: which page, which layers were tried, results per layer, and two buttons: **Capture sample** and **Copy diagnostic report**.
- Diagnostics shows per portal: layers attempted, item counts per layer, confidence, last good run, next run.
- All errors use the typed error taxonomy; no empty catch blocks.
- Self-healing from the earlier resilience work must remain (watchdog alarm, mutex TTL, offscreen recreate, circuit breaker).

---

## STEP 5: Contract tests and canaries (so it never silently rots)

1. **Pattern-based parser tests** against `fixtures/elms/mock/` AND `fixtures/elms/real/` (skip if empty) and against **mutated theme variants** (same content wrapped in different class names/structures: Boost, Classic, a custom theme with no helpful classes). Layer 2 must still find the same courses/activities in all variants.
2. **Layer fallback tests:** disable Layer 1 → Layer 2 works; break Layer 2 selectors → Layer 3 reports page change; break everything → `PARSER_SUSPECT` with the right message.
3. **Session tests (UCAM):** table-driven tests for the scoring (login page, home page with logout link, home page with different casing, ASP.NET page with hidden inputs only, redirect chain to login).
4. **Sanitizer tests:** canary secrets never appear in output; structure is preserved.
5. **Allow-list/POST rule tests:** POST allowed only to ELMS `service.php` with whitelisted methods; everything else rejected.
6. **Baseline/diff E2E** on the mock portal after switching mock to also serve a "different theme" variant: new material, due-date change, new announcement, new notice → correct notifications.
7. **Runtime canary:** each cycle compares the current page fingerprint (URL pattern counts, landmark structure) with the last good fingerprint; a big drift raises "Layout changed" with details, even if parsing still returns something. Store only the compact fingerprint.
8. Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build:chrome && pnpm build:edge && pnpm scan:bundle && pnpm test:e2e`. Keep coverage ≥ 85 % for `core/` and `adapters/`.

---

## STEP 6: Final report (required)

1. What was wrong: concrete evidence for ELMS (which layer failed and why) and UCAM (which signal produced the false "login required").
2. What changed (by file) and which layers are active.
3. Test results and coverage.
4. **Manual steps for me** (Chrome and Edge): reload extension → log in to both portals → Dashboard → Diagnostics → Run → "Capture structural fingerprint" for ELMS home, one ELMS course page, UCAM home → copy the three fingerprints and reports back to you. Then tick UCAM pages to watch and verify a notification via "Simulate change".
5. Known limitations and what real samples (if any) would still improve accuracy.

Work in order Step 0 → 6. Commit after each step with Conventional Commits. Do not invent selectors for pages you have not seen; build discovery, fallbacks and capture tools instead. Do not weaken security rules beyond the single documented POST exception.
