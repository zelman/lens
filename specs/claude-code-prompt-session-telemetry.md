# Claude Code Session: Session Telemetry Instrumentation

One P0 task remaining for the Lens intake app at `lens-app-five.vercel.app`.

## Context

The Lens intake app is a Next.js app on Vercel (project ID `prj_YWUA0aYI8wbrB8jkCPcGFCLLah3e`, team `team_y3ulCyty9FDcnYLvdNznZRnB`). Production URL: `lens-app-five.vercel.app`. Repo: `github.com/zelman/lens`.

**Already completed today (builds 2026.04.14-a through 2026.04.14-c):**
- Content budget fix: 60K char budget with priority ordering (resume > assessments > writing > other > linkedin) in `/api/discover`
- Slice bug fix for negative indices in budget truncation
- Synthesis timeout fix: `rawDocumentText` truncated to 8K chars for `/api/synthesize`, validation receives same truncated text
- Upload guidance copy added to Materials phase

The content budget fix already tracks pre-truncation and post-truncation character counts internally. This session wires that data (and much more) into a persistent Airtable table.

---

## Task: Session Telemetry to Airtable

**Goal:** Instrument the intake app to log session-level telemetry to Airtable so we can answer:
1. How long is each section taking?
2. Where do users fatigue, stall, or abandon?
3. What is overall utilization (sessions/day, completions, error rate)?
4. Is the content budget right-sized?

**Create a new Airtable table** in base `appFO5zLT7ZehXaBo` called "Lens Sessions" with these fields:

**Session Identity:**
- Session ID (singleLineText) — UUID generated client-side on app load
- Name (singleLineText) — from intake form name field, if provided
- Build Version (singleLineText) — e.g. 2026.04.14-c
- User Agent (singleLineText) — browser/device for debugging
- IP Address (singleLineText) — captured server-side from `x-forwarded-for` or `x-real-ip` request headers in `/api/log-session`. Do NOT send IP from the client. Helps distinguish unique users from repeat sessions by the same person.

**Session Lifecycle:**
- Session Start (dateTime) — timestamp when app loads
- Session End (dateTime) — timestamp when user completes synthesis OR abandons
- Total Duration (number) — seconds from start to end
- Status (singleSelect: Completed / Abandoned / Error)
- Abandonment Phase (singleSelect: Materials / Status / Context / Discovery) — null if completed
- Abandonment Section (number) — 1-8 discovery section where user stopped, null if not in discovery

**Phase Timestamps (all dateTime, null if never reached):**
- Materials Start
- Materials End
- Status Start
- Status End
- Context Start (reflection generation begins)
- Context End (reflection succeeds or fails)
- Discovery Start
- Discovery End
- Synthesis Start
- Synthesis End

**File Upload Metrics:**
- File Count (number) — total files uploaded
- Pre-Truncation Total Chars (number) — raw total extracted characters BEFORE content budget is applied. This is the true input volume.
- Total Extracted Chars (number) — total characters AFTER content budget truncation (what gets sent to the API)
- Chars Truncated (number) — Pre-Truncation minus Total Extracted
- Content Budget Applied (checkbox) — whether truncation was triggered
- File Breakdown (multilineText) — JSON: [{category, filename, size_kb, extracted_chars, truncated_to}]

**Discovery Section Timing:**
- Discovery Section Timing (multilineText) — JSON array:
  [{section: 1, name: "Professional Identity", start: ISO, end: ISO, duration_sec: N, messages: N}, ...]
  This captures per-section duration AND message count (proxy for engagement depth vs. one-word answers).

**Error Tracking:**
- Reflection Result (singleSelect: Success / Failed / Skipped)
- API Errors (multilineText) — JSON array of {timestamp, route, status_code, error_message}

**Implementation:**

Client-side:
- Generate session UUID on app mount
- Log timestamps at each phase transition (already have phase state)
- Track discovery section start/end via existing section navigation
- Count messages per section from conversation state
- Capture pre-truncation and post-truncation char counts from the content budget step (these values already exist in the 2026.04.14-b code — wire them into the telemetry object)
- On completion or abandonment (beforeunload + visibilitychange), fire final write

Server-side:
- New Vercel route: `/api/log-session`
- Accepts session telemetry payload, writes to Airtable
- Fire-and-forget (don't block user flow on logging failures)
- Include Airtable API token as env var (already have pattern from feedback form and the existing Airtable env vars)
- Capture IP address from request headers (`x-forwarded-for` or `x-real-ip`) and append to the Airtable payload server-side. Do NOT send IP from the client.

Abandonment detection:
- `navigator.sendBeacon` on `beforeunload` for best-effort capture
- `visibilitychange` event as backup
- Don't build server-side cleanup for v1 — just capture what we can client-side

**Test:** Run through full intake. Verify Airtable row appears with all fields populated including IP address. Run a second session and abandon mid-discovery — verify abandonment fields capture correctly. Upload heavy files and confirm Pre-Truncation Total Chars > Total Extracted Chars when budget fires.

---

## Important Notes

- Bump the build version after this task is complete.
- The Airtable API token is already in Vercel env vars from prior work — reuse the same pattern for `/api/log-session`.
- Write a Claude Code Sessions row to Airtable table `tblLgWUHElcbKABKF` in base `appFO5zLT7ZehXaBo` when this session is complete.
- Commit to `zelman/lens` repo with a descriptive commit message.
