# Claude Code Sessions Table Spec

**Purpose:** Enable context sync between Claude Code (CLI) and Claude AI (web) without manual copy-pasting.

**Base:** Lens (`appFO5zLT7ZehXaBo`)

**Table Name:** `Claude Code Sessions`

---

## Schema

| Field Name | Type | Description |
|------------|------|-------------|
| Session Date | dateTime | When the session occurred |
| Summary | multilineText | 2-4 sentence description of what was accomplished |
| Commits | multilineText | List of commit hashes + messages from the session |
| Files Changed | multilineText | Key files created/modified (not exhaustive, just notable ones) |
| Build ID | singleLineText | If a build was created (e.g., `2026.04.07-b`) |
| Open Items | multilineText | Unfinished work, blockers, or next steps |
| Decisions Made | multilineText | Architectural/strategic decisions that should persist |
| Context for AI | multilineText | Anything Claude AI specifically needs to know for continuity |
| Agent | singleSelect | Options: `Claude Code`, `Claude AI`, `Both` |
| Status | singleSelect | Options: `Complete`, `Interrupted`, `Handoff` |

---

## Field Details

### Session Date
- Type: `dateTime`
- Format: ISO 8601
- Timezone: America/New_York

### Summary
- Type: `multilineText`
- Example: "Implemented timing instrumentation for discovery flow. Created /api/session route, instrumented LensIntake.jsx with beforeunload handler, linked feedback form to session records."

### Commits
- Type: `multilineText`
- Format: One commit per line, hash + message
- Example:
  ```
  8107d1a feat(instrumentation): add timing and drop-off tracking
  82cbedc docs: add strategic-brief v1.2 and core-narrative v1.2
  ```

### Files Changed
- Type: `multilineText`
- Format: One file per line, mark new files
- Example:
  ```
  components/lens-app/app/api/session/route.js (new)
  components/lens-app/app/components/LensIntake.jsx
  CHANGELOG.md
  ```

### Build ID
- Type: `singleLineText`
- Format: `YYYY.MM.DD-letter`
- Example: `2026.04.07-b`

### Open Items
- Type: `multilineText`
- Format: Bulleted list
- Example:
  ```
  - Token exposed in chat, needs rotation
  - Not yet pushed to Vercel
  ```

### Decisions Made
- Type: `multilineText`
- Format: Bulleted list of decisions with context
- Example:
  ```
  - Competitive intel now goes to Airtable, not markdown
  - Session timing uses shared Airtable record approach
  ```

### Context for AI
- Type: `multilineText`
- Purpose: Specific context Claude AI needs to continue work
- Example: "Timing instrumentation complete and tested locally. 9 new fields added to Lens Feedback table. Opus code review passed after fixes."

### Agent
- Type: `singleSelect`
- Choices:
  - `Claude Code` - Session was in CLI
  - `Claude AI` - Session was in web UI
  - `Both` - Handoff or mixed session

### Status
- Type: `singleSelect`
- Choices:
  - `Complete` - Work finished cleanly
  - `Interrupted` - Session ended unexpectedly
  - `Handoff` - Explicitly passing to the other agent

---

## Usage Pattern

1. **Claude Code** writes a row at session end
2. **Claude AI** reads recent rows via MCP to catch up
3. Either can mark `Handoff` when passing work to the other
4. Both can query: "Show me the last 3 sessions" to get context

---

## After Table Creation

Provide the **Table ID** (starts with `tbl`) to Claude Code so it can:
1. Update CLAUDE.md session hygiene section
2. Begin writing session summaries automatically
