# R→C Step 4: Candidate Discovery Conversation Fork — Claude Code Brief v1.0

> **Depends on:** RecruiterRoleForm.jsx (Step 1), /api/extract-dimensions (Step 2), /api/generate-session (Step 3)
> **Consumes:** `session-config` from sessionStorage (written by Step 3)
> **Produces:** A candidate lens document shaped by the role context
> **Status:** BRIEF — ready for Claude Code

---

## WHAT THIS IS

The final piece of the R→C recruiter flow. When a recruiter completes the role input form, dimensions are extracted, and a session config is generated, the candidate needs to go through a tailored discovery conversation that produces a lens document specifically useful for evaluating fit against that role.

Right now, the standard candidate flow (LensIntake.jsx) runs 8 fixed sections with generic coaching prompts. This step creates an alternative entry point where the discovery conversation is governed by the session-config — different sections, different time allocations, different probing strategies, all tuned to the dimensions the recruiter and AI identified as critical for this specific role.

## WHAT EXISTS

### Session Config Object (from Step 3)

The `/api/generate-session` endpoint produces a session config stored in sessionStorage under key `session-config`. Based on the session generation brief (rc-session-generation-brief.md v1.1), this object contains:

```json
{
  "role_title": "VP Customer Success",
  "company": "Clarion Health",
  "dimensions": [
    {
      "id": "dim_1",
      "name": "Healthcare Domain Expertise",
      "priority": "critical",
      "time_minutes": 4,
      "opening_question": "...",
      "probe_strategies": ["..."],
      "signals_to_extract": ["..."]
    }
  ],
  "total_time_minutes": 25,
  "engagement_detection": {
    "patterns": ["deflection", "rehearsed_response", "energy_shift", "contradiction", "specificity_drop", "unsolicited_depth"]
  }
}
```

### Existing Candidate Flow (LensIntake.jsx, ~2200 lines)

The current flow has:
- Phase architecture (intro → context upload → status → discovery → synthesis → done)
- 8 hardcoded discovery sections with per-section system prompts in `/api/_prompts/discovery.js`
- `/api/discover` route handler (conversation loop with Claude)
- `/api/synthesize` route handler (produces lens document)
- Validation gate (post-synthesis QA)
- Session persistence, file upload, guardrails

### Role Context (from Step 1)

Stored in sessionStorage under key `recruiter-role-context`. Contains everything the recruiter entered: role title, company, stakeholders, objectives, ranked priorities, documents uploaded, etc.

## WHAT TO BUILD

### Option A: Fork LensIntake.jsx (Recommended)

Create a new component `RecruiterCandidateIntake.jsx` that reuses the existing infrastructure but swaps the discovery section configuration.

**Route:** `/recruiter/candidate` (or `/discover?mode=recruiter`)

**Flow differences from standard LensIntake.jsx:**

1. **No intro phase.** The recruiter has already set up the session. The candidate lands on a page that says something like: "[Company] is using Lens to help understand your fit for the [Role Title] position. This conversation takes about [total_time] minutes."

2. **Context upload stays.** Candidates still upload resume, LinkedIn, writing samples, etc. Same upload UI, same extraction logic.

3. **Status selection removed.** The recruiter flow implies the candidate is being evaluated — the status context is "being considered for a role."

4. **Discovery sections are dynamic, not hardcoded.** Instead of 8 fixed sections from `discovery.js`, the sections are generated from `session-config.dimensions`. Each dimension becomes a discovery section with:
   - `id` from the dimension
   - `label` = dimension name
   - `systemContext` = built from the dimension's probe strategies, signals to extract, and engagement detection patterns
   - `openingPrompt` = the dimension's opening question
   - `softCap` / `hardCap` = derived from `time_minutes` (roughly: 1 min ≈ 1 question, so a 4-min dimension gets softCap 3, hardCap 5)
   - Priority-based ordering (critical dimensions first)

5. **System prompts include role context.** Each discovery section's system prompt should include:
   - The role title and company name
   - The specific signals this dimension is looking for
   - The engagement detection patterns (same 6 patterns across all sections)
   - A framing instruction: "You are conducting a focused discovery conversation to help [Company] understand this candidate's fit for the [Role Title] position. Your goal is to extract honest behavioral evidence, not rehearsed interview answers."

6. **Synthesis prompt includes role context.** The synthesis call should receive:
   - All conversation data from the dynamic sections
   - The full role context (from `recruiter-role-context` in sessionStorage)
   - The dimension definitions and priority levels
   - Instruction to produce a lens document that explicitly addresses each dimension with evidence from the conversation

7. **Output is a standard lens document** with the same markdown + YAML structure, but the dimensions and signals are role-specific rather than generic.

### New Files

```
app/
  recruiter/
    candidate/
      page.js                          ← Next.js route
  components/
    RecruiterCandidateIntake.jsx       ← Main component (~800-1200 lines estimated)
  api/
    _prompts/
      rc-discovery.js                  ← Dynamic section prompt builder
      rc-synthesis.js                  ← Role-context-aware synthesis prompt
```

### Prompt Architecture

**`rc-discovery.js`** — exports a function, not static strings:

```javascript
export function buildRCDiscoveryPrompt(dimension, roleContext, engagementPatterns) {
  return `SECTION: ${dimension.name}
  
ROLE CONTEXT: You are evaluating a candidate for ${roleContext.role_title} at ${roleContext.company}.

MISSION: Extract behavioral evidence for: ${dimension.signals_to_extract.join(', ')}

PRIORITY: ${dimension.priority}

PROBE STRATEGIES:
${dimension.probe_strategies.map(s => `- ${s}`).join('\n')}

ENGAGEMENT DETECTION:
Watch for these patterns and adapt:
${engagementPatterns.map(p => `- ${p}`).join('\n')}

IMPORTANT: This is not a job interview. You are a coach helping the candidate articulate who they actually are in relation to this specific dimension. Push past rehearsed answers. Ask for specific examples. Name what you're hearing back to them.

[Standard guardrails: single question per turn, no clinical labels, etc.]`;
}
```

**`rc-synthesis.js`** — modified synthesis prompt that:
- Receives the role context alongside conversation data
- Structures the lens document around the role's dimensions (not the generic 8)
- Includes a "Fit Signals" section for each dimension: what evidence supports fit, what evidence raises questions
- Produces the tension map that James Pratt's validation test also uses — where does the candidate's identity create productive friction with what the role requires?

### API Routes

**`/api/discover`** — reuse the existing route. The system prompt is already passed from the client via the section config. The RC discovery prompts just need to be assembled client-side from the session-config and passed through the same API.

**`/api/synthesize`** — may need a small modification to accept a `mode` parameter:
- `mode: "standard"` → existing synthesis prompt
- `mode: "recruiter"` → RC synthesis prompt with role context

Or: create a separate `/api/rc-synthesize` route if the prompt differences are large enough to warrant it. Claude Code should assess during implementation.

### Session Persistence

- Use the same localStorage pattern as LensIntake.jsx
- Store phase, section progress, and conversation history
- On return, check for both `session-config` and `recruiter-role-context` in sessionStorage — if either is missing, redirect to `/recruiter` with a message

### What NOT to Build

- **No scoring in this step.** The lens document is the output. Scoring (matching the candidate lens against the role lens) is a separate future step (`/api/score-role`).
- **No recruiter dashboard.** The recruiter gets the lens document via the same download/copy mechanism as the standard flow. A dashboard for viewing multiple candidates is future work.
- **No multi-candidate management.** One candidate at a time. The recruiter sends the link, the candidate completes it, the lens document is produced.
- **No authentication.** Same as the standard flow — shareable link, no login.

## CANDIDATE EXPERIENCE

The candidate should NOT feel like they're being interviewed or assessed. The framing is:

> "[Company] wants to understand you beyond your resume. This is a guided conversation — about 25 minutes — designed to help articulate who you are as a professional. The output is a document that both you and [Company] will see. Nothing is hidden."

This preserves the core Lens principle: the lens is a conversation catalyst, not an assessment verdict. The candidate owns their lens document.

## TESTING

Use the three existing test scenarios from `rc-lens-test-data-v1.0.md`:
1. Clarion Health / Maria Gutierrez (VP Customer Success, healthcare)
2. [Scenario 2 from test data]
3. [Scenario 3 from test data]

For each: complete the recruiter flow → extract dimensions → generate session → run candidate through discovery → verify lens document addresses the role's dimensions with behavioral evidence.

The live session test already validated that the session config produces good coaching-style questions (per the April 15 session log). This step wires that into the actual product flow.

## OPEN QUESTIONS FOR CLAUDE CODE

1. **Fork vs. parameterize?** Is it cleaner to create RecruiterCandidateIntake.jsx as a new component, or to add a `mode` prop to LensIntake.jsx? The existing component is 2200 lines — forking avoids regression risk but creates maintenance burden. Claude Code should assess the shared surface area and decide.

2. **Synthesis route: extend or duplicate?** If the RC synthesis prompt shares <50% with the standard synthesis prompt, a separate route is cleaner. If >50% shared, extend with a mode flag.

3. **Session-config validation.** What happens if the session-config is malformed or missing dimensions? Need graceful degradation — fall back to a reasonable default rather than crashing.

4. **Candidate link generation.** How does the recruiter send the candidate to the right URL? For now, the recruiter manually shares a link like `lens-app-five.vercel.app/recruiter/candidate`. The session-config is in the recruiter's browser sessionStorage, which means the candidate needs to be on the same device OR we need a way to transfer the config. Options: (a) encode config in URL params (long but works), (b) store config server-side with an ID and pass the ID in the URL, (c) for POC, just demo on the same device. Claude Code should implement option (c) for POC with architecture that doesn't preclude (b) later.

---

*This brief completes the R→C POC flow: recruiter defines role → AI extracts dimensions → recruiter reviews → session generated → candidate goes through tailored discovery → lens document produced. The end-to-end demo is the thing to show Graham Kittle, James's network contacts, and Jenn Monkiewicz.*
