---
name: session-wrapup
description: "End-of-session project hygiene and handoff generator. Use this skill whenever the user says 'wrap up', 'session summary', 'what changed', 'commit checklist', 'end of session', 'let's close out', or any variation of wrapping up a work session. Also trigger when a long session has produced artifacts, decisions, or code changes and the user asks what needs to happen next. This skill prevents knowledge from dying in chat threads by producing a structured handoff. Use it even if the user doesn't explicitly ask — if you detect a natural session boundary after substantive work, suggest running it."
---

# Session Wrap-Up

Generate a structured session summary and commit checklist at the end of any substantive work session. The goal is to capture everything that changed so nothing gets lost between conversations.

## When to Trigger

- User explicitly asks to wrap up or summarize the session
- A long session has produced code, documents, decisions, or research
- You detect a natural stopping point after substantive work (suggest it proactively)
- User asks "what do I need to commit" or "what changed today"

## Output Format

Generate a markdown document with these sections. Skip any section that doesn't apply to the current session.

### 1. SESSION SUMMARY
One paragraph: what was the goal, what was accomplished, what's unfinished.

### 2. ARTIFACTS CHANGED OR CREATED
For each artifact touched this session:

```
- **[filename]** (v[X.X] → v[X.X])
  - What changed: [brief description]
  - Location: [where it lives or should live]
  - Status: [draft / stable / needs review]
  - Artifact Registry: [yes/no — does it need an Airtable entry?]
```

If a new artifact was created, note that it needs a new row in the Artifact Registry (base appFO5zLT7ZehXaBo, table tblcE723hIH692lSy).

### 3. DECISIONS MADE
Bullet list of any strategic, architectural, or design decisions made during the session. These are the things most likely to be lost if not written down. Format:

```
- **[Decision]**: [What was decided and why, in one sentence]
```

### 4. CONTEXT FILE UPDATES NEEDED
Identify which CONTEXT files need updating and what specifically should change:

```
- **CONTEXT-lens-project.md**: [what to add/update]
- **CONTEXT-cross-project_1.md**: [what to add/update]
- **CONTEXT-archive.md**: [what to add/update]
```

Draft the actual text to insert or replace when possible — don't just say "update the status." Write the replacement paragraph.

### 5. GIT COMMIT CHECKLIST
Ordered list of what needs to be committed via Claude Code:

```
1. [ ] [repo]: [file] — [what changed]
2. [ ] [repo]: [file] — [what changed]
```

Group by repo (zelman/lens, zelman/tidepool, zelman/job_search, zelman/work).

### 6. MEMORY UPDATES
If anything changed that should be reflected in Claude's persistent memory (stable personal facts, tool configurations, project structure changes), list specific memory edits to make. Format:

```
- ADD: "[memory text]"
- REPLACE line [N]: "[new text]"
- REMOVE line [N]: "[reason]"
```

### 7. NEXT SESSION STARTING POINT
2-3 sentences describing where to pick up. Include:
- What's unfinished
- What's blocked on external input (Nathan, James, Todd, etc.)
- Any time-sensitive items

### 8. CLAUDE CODE SESSIONS TABLE

Write a row to the Claude Code Sessions table in Airtable. This step is **not optional** for any session that produced substantive work.

**Routing:**

| Project | Base | Table |
|---------|------|-------|
| Job Search | `appFEzXvPWvRtXgRY` | `tblHhzGpsgNJUIqy0` |
| Lens Project | `appFO5zLT7ZehXaBo` | `tblLgWUHElcbKABKF` |

**Fields to populate:**

- **Session Date**: Current datetime (America/New_York)
- **Summary**: Reuse Section 1, condensed to 2-4 sentences
- **Commits**: From Section 5 (hashes + messages if known, otherwise planned commits)
- **Files Changed**: From Section 2 (notable files only)
- **Build ID**: If applicable, format `YYYY.MM.DD-letter`
- **Open Items**: From Section 7 (unfinished work, blockers)
- **Decisions Made**: From Section 3
- **Context for AI**: What the *other* Claude agent needs to cold-start this work. Not a recap. What would break without it?
- **Agent**: `Claude Code`, `Claude AI`, or `Both`
- **Status**: `Complete`, `Interrupted`, or `Handoff`

If the session was interrupted, still write the row with Status = `Interrupted` and capture whatever is known.

## Rules

- **Be specific, not vague.** "Update CONTEXT" is useless. "Add bidirectional lens spec completion to the What's Been Built section of CONTEXT-lens-project.md" is useful.
- **Version numbers matter.** If an artifact was iterated, note both the starting and ending version.
- **Don't invent changes.** Only list things that actually happened in this session.
- **Legal artifacts are local only.** Never include git commit items for anything in the legal/ directory. Note them as "local only — do not commit."
- **Draft the CONTEXT updates.** Don't just flag them — write the actual replacement text so the user can paste or hand it to Claude Code.
- **Always write the Airtable row.** The session summary document is for the human. The Airtable row is for the other Claude agent. Both are required for substantive sessions.
