# Lens Serverless Proxy Architecture v1.0

*April 3, 2026 — Post-testing deployment spec*

---

## Problem

All Lens components that call the Anthropic API (`lens-form.jsx`, `lens-intake.jsx`, `lens-scorer.jsx`, Role Lens Scorer) currently make **direct client-side `fetch` calls** to `https://api.anthropic.com/v1/messages`. This works inside Claude.ai artifacts because Anthropic's infrastructure proxies the request and injects the API key server-side. It fails — or exposes the key — the moment these components run anywhere else.

Even within Claude.ai, the current pattern exposes **system prompts, scoring logic, dimension weights, and coaching persona instructions** in the browser's Network tab. For a patent-pending product, this is an unacceptable IP leak.

### What's exposed today (in browser dev tools)

- Full system prompt text (scoring rubrics, coaching instructions, dimension definitions)
- Model selection and parameters
- Raw API response JSON (scores, rationales, signal extractions)
- Conversation history for multi-turn discovery sessions
- Any uploaded document content sent as context

### What's at risk on standalone deployment (Vercel)

- API key must exist somewhere — hardcoded in client JS = credential theft
- No rate limiting = abuse and runaway costs
- No request validation = prompt injection via manipulated payloads

---

## Architecture: Vercel Serverless Proxy

The pattern already exists in `lens-feedback.zip` where `api/submit.js` proxies Airtable writes. Extend the same approach to cover all Anthropic API calls.

### Principle

**The client never talks to Anthropic. The client talks to your API routes. Your API routes talk to Anthropic.**

```
┌──────────────┐         ┌──────────────────┐         ┌─────────────────┐
│              │  POST   │                  │  POST   │                 │
│  Client JSX  │ ──────► │  /api/discover   │ ──────► │  Anthropic API  │
│              │ ◄────── │  /api/synthesize │ ◄────── │                 │
│              │  JSON   │  /api/score      │  JSON   │                 │
└──────────────┘         └──────────────────┘         └─────────────────┘
                          │                  │
                          │  ANTHROPIC_API_KEY (env var)
                          │  System prompts (server-side only)
                          │  Rate limiting
                          │  Request validation
                          │  Logging (optional)
                          │
```

---

## API Routes

### 1. `/api/discover` — Discovery Conversation

The most complex route. Handles the 8-section multi-turn coaching conversation.

**Client sends:**

```json
{
  "section": "essence",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "context": {
    "status": "actively_searching",
    "uploadSummary": "Resume: product_manager_resume.pdf, LinkedIn: linkedin_export.pdf"
  }
}
```

**Server does:**

1. Validates `section` is one of the 8 known sections
2. Validates `messages` array structure (alternating roles, reasonable length)
3. Looks up the **system prompt** for this section from a server-side config (never sent to client)
4. Injects `context` into the system prompt as needed
5. Calls Anthropic API with `ANTHROPIC_API_KEY` from env
6. Returns assistant response only (strips API metadata)

**Client receives:**

```json
{
  "response": "Based on what you've shared about your time at Apple..."
}
```

**Key detail:** The 8 section-specific system prompts (`systemContext`, `workflowHint`, `scoreDimension`) currently live in the JSX as constants. They move to a server-side module — either a JS file in `api/` or fetched from `guardrails.yaml` in the repo.

### 2. `/api/synthesize` — Lens Document Generation

Called once at the end of the discovery flow. Takes all 8 sections' conversation history and produces the markdown + YAML lens document.

**Client sends:**

```json
{
  "conversations": {
    "essence": [...messages],
    "skills": [...messages],
    "values": [...messages],
    "mission": [...messages],
    "workstyle": [...messages],
    "energy": [...messages],
    "disqualifiers": [...messages],
    "situation": [...messages]
  },
  "status": "actively_searching",
  "uploadedContext": "..."
}
```

**Server does:**

1. Validates all 8 sections present with non-empty message arrays
2. Assembles the synthesis system prompt (server-side only — this is the most IP-sensitive prompt, contains the full lens document schema and signal extraction logic)
3. Calls Anthropic API
4. Returns the generated lens document

**Client receives:**

```json
{
  "lens": "---\nname: Eric Zelman\ndimensions:\n  mission:\n    weight: 25\n    signals: [...]\n..."
}
```

### 3. `/api/score` — Opportunity Scoring (C→R)

Used by `lens-scorer.jsx`. Simpler — single-turn, no conversation state.

**Client sends:**

```json
{
  "opportunity": "Paste of job listing or company description...",
  "lens": "Full lens document markdown (or YAML frontmatter only)"
}
```

**Server does:**

1. Validates `opportunity` is non-empty, reasonable length (cap at ~15K chars)
2. Validates `lens` is present and parseable
3. Assembles scoring system prompt with dimension weights and rubric (server-side only)
4. Calls Anthropic API
5. Parses JSON response, validates score structure
6. Returns structured score

**Client receives:**

```json
{
  "composite": 74,
  "classification": "WATCH",
  "dimensions": { "mission": { "score": 18, "max": 25, "rationale": "..." }, ... },
  "strengths": ["..."],
  "red_flags": ["..."]
}
```

### 4. `/api/score-role` — Candidate Scoring (R→C)

Used by the Role Lens Scorer. Same pattern as `/api/score` but with the role lens as the governing document and candidate materials as input. Gate Tolerance and Analysis Depth parameters pass through.

**Client sends:**

```json
{
  "candidate": "Candidate materials...",
  "roleLens": "Role lens document...",
  "gateTolerance": "standard",
  "analysisDepth": "standard"
}
```

---

## Server-Side Module: Prompt Registry

All system prompts live in a single server-side module. The client never sees them.

```
api/
  _prompts/
    discovery.js      ← 8 section prompts + context injection logic
    synthesis.js      ← lens document generation prompt + schema
    scoring.js        ← C→R scoring rubric + dimension weights
    role-scoring.js   ← R→C scoring rubric + evaluation modes
  discover.js         ← route handler
  synthesize.js       ← route handler
  score.js            ← route handler
  score-role.js       ← route handler
```

The `_prompts/` directory is never served to clients (Vercel convention: underscore-prefixed folders are private). This is where `guardrails.yaml` integration would wire in — the route handlers read scoring config at request time rather than hardcoding it.

---

## Environment Variables

Set in Vercel dashboard → Settings → Environment Variables:

| Variable | Purpose | Scope |
|---|---|---|
| `ANTHROPIC_API_KEY` | API authentication | Production + Preview |
| `AIRTABLE_TOKEN` | Feedback form writes | Production + Preview |
| `RATE_LIMIT_SECRET` | (optional) signed token for abuse prevention | Production |

**Never in client-side code. Never in git.**

---

## Security Layers

### Rate Limiting

Vercel's Edge Middleware or a simple in-memory counter per route:

- `/api/discover` — 100 requests/hour per IP (multi-turn conversation = many calls)
- `/api/synthesize` — 5 requests/hour per IP (one per completed session)
- `/api/score` — 30 requests/hour per IP
- `/api/score-role` — 30 requests/hour per IP

For the tester phase, IP-based limiting is fine. For production, move to session tokens or user auth.

### Request Validation

Each route validates:

- Required fields present
- String lengths within bounds (reject payloads > 50KB for discover, > 200KB for synthesize)
- Section names match known enum values
- Message arrays have correct role alternation
- No injection patterns in section/status fields (though these aren't interpolated into prompts unsafely)

### Response Sanitization

Strip everything except the content the client needs. The client never sees:

- `model` used
- `usage` (token counts)
- `stop_reason`
- Any API error details beyond a generic message

---

## Migration Path: Client-Side Changes

The JSX refactor is minimal. Every component currently has a block like this:

```javascript
// CURRENT (client-side, insecure)
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,        // ← exposed
    messages: [...],
  }),
});
const data = await response.json();
const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("");
```

It becomes:

```javascript
// TARGET (proxied, secure)
const response = await fetch("/api/score", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    opportunity: input.trim(),
    lens: LENS_DOCUMENT,
  }),
});
const data = await response.json();
// data is already the structured score — no parsing needed
```

The `SYSTEM_PROMPT` constant is deleted from the client-side code entirely. The response parsing simplifies because the server returns clean, validated JSON rather than raw API output.

---

## File Upload Handling

The discovery flow accepts file uploads (resume, LinkedIn PDF, writing samples, etc.). These contain PII and need special handling.

**Current state:** Files are read client-side as text/base64, included in the conversation context sent to the API. They never persist server-side.

**Proxied state — two options:**

**Option A: Client-side extraction (simpler, recommended for now)**
Files are still read client-side. Extracted text is sent to `/api/discover` as part of the `context` field. Files never touch the server's filesystem. This matches the current behavior but routed through the proxy.

*Privacy advantage:* File content transits the proxy but isn't stored. The proxy is ephemeral (Vercel serverless functions have no persistent filesystem).

**Option B: Server-side upload + extraction (future)**
Files upload to a temporary store (Vercel Blob, S3), server extracts text, includes in API context, then deletes the file. Better for large files and PDF parsing but adds infrastructure.

**Recommendation:** Start with Option A. It's the smallest delta from current behavior. Move to Option B when file size limits or PDF parsing quality becomes a bottleneck.

---

## Deployment: Project Structure

```
lens-app/
├── public/
│   └── index.html              ← or Next.js pages
├── components/
│   ├── lens-intake.jsx         ← calls /api/discover, /api/synthesize
│   ├── lens-scorer.jsx         ← calls /api/score
│   ├── role-scorer.jsx         ← calls /api/score-role
│   └── lens-feedback.jsx       ← calls /api/submit (existing)
├── api/
│   ├── _prompts/
│   │   ├── discovery.js
│   │   ├── synthesis.js
│   │   ├── scoring.js
│   │   └── role-scoring.js
│   ├── discover.js
│   ├── synthesize.js
│   ├── score.js
│   ├── score-role.js
│   └── submit.js               ← existing Airtable proxy
├── vercel.json
├── package.json
└── .env.local                   ← local dev only, gitignored
```

---

## Tester URL Preservation

Existing tester URLs must not change. The Vercel deployment can add API routes alongside the existing static pages without breaking current paths. If the feedback form is currently at `/feedback` and the intake is at `/intake`, those stay. The `/api/*` routes are additive.

---

## Privacy Implications (Summary)

| Data | Current | After Proxy | Notes |
|---|---|---|---|
| API key | Hidden by Claude.ai proxy | Hidden by Vercel env var | Equivalent safety |
| System prompts | Visible in browser Network tab | Server-side only, never sent to client | Major improvement |
| Conversation content | Sent directly to Anthropic | Sent via your Vercel function → Anthropic | You gain a logging/audit point |
| Uploaded files | Read client-side, sent to Anthropic | Read client-side, sent via proxy → Anthropic | No change in exposure |
| Lens document | Client-side only | Client-side, optionally persisted server-side | Persistence is a future decision |
| Scores/results | Full API response visible | Sanitized response only | Cleaner, no metadata leakage |

---

## What This Doesn't Solve (Yet)

- **User authentication** — anyone with the URL can use the tool. Fine for tester phase. Needs auth before public launch.
- **Conversation persistence** — sessions are still lost on tab close. Airtable or a database backend is the next layer.
- **Usage tracking** — no visibility into per-user API consumption. Add logging to the proxy routes when needed.
- **GDPR/CCPA compliance** — the proxy creates a data processing point. If you store any conversation data server-side, you need a privacy policy and data handling disclosures.

---

## Implementation Priority

1. **`/api/score`** — simplest route (single turn, no conversation state). Refactor `lens-scorer.jsx` first as the proof of concept.
2. **`/api/score-role`** — same pattern, different prompt.
3. **`/api/discover`** — most complex (multi-turn, section routing, context injection). Do this after the scoring routes prove the pattern.
4. **`/api/synthesize`** — depends on discover being done.

Estimated effort: `/api/score` is a few hours including testing. The full set is a weekend of focused work.

---

*This document goes in `docs/` in the `zelman/lens` repo. The `_prompts/` directory and route handlers are the implementation artifacts that follow.*
