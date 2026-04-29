# Claude Code Session Brief: R→C Role Input Form

**Date:** April 14, 2026
**Kanban card:** "R→C: Structured Role Input Form"
**Spec reference:** `recruiter-candidate-lens-spec-v0.1.md` (§1, §4, §10)
**Repo:** `zelman/lens`
**Deploy target:** `lens-app-five.vercel.app`

---

## Objective

Build the recruiter-facing role input form — Step 1 of the R→C POC. This is the recruiter's first interaction with the product. They enter context about a search (role details, priorities, uploaded documents) that will later prime a tailored candidate discovery session.

This is a NEW route/page in the existing Lens app, not a modification to the candidate intake form.

---

## Design System (MANDATORY — International Style)

Match the existing candidate intake form exactly:

- **Background:** White (#FFFFFF)
- **Typography:** Helvetica Neue / Helvetica / Arial, sans-serif. Black type (#1A1A1A)
- **Primary accent:** Red (#D93025) — buttons, active states, progress indicators
- **Secondary accent:** Orange (#E8590C) — step numbers, footnote callouts
- **Positive signals:** Green (#2D6A2D)
- **Rules:** Hairline (1-2px), black for section boundaries, light gray (#EEEEEE) for subdivisions
- **Border radius:** ZERO. No rounded corners anywhere.
- **Card borders:** Subtle (#EEE), gray container bg (#F0F0F0)
- **All-caps section labels:** Red, spaced — but do NOT use wide character spacing on "LENS PROJECT" or similar branding
- **Principle:** The design is invisible. Content does the work.

---

## Architecture Requirements

### API Proxy (CRITICAL)
All Anthropic API calls MUST go through Vercel serverless functions (`/api/` routes). NO client-side API keys. This is the same pattern as the existing app:
- Client sends request to `/api/chat` (or similar)
- Serverless function adds `ANTHROPIC_API_KEY` from environment
- Response proxied back to client
- Production config: `claude-sonnet-4-6`, MAX_TOKENS 6000, temperature 0.5, timeout budget 58s

### Document Upload Architecture
Follow the same pattern as the candidate intake form's 5-category upload system:
- Client-side file selection with type/size validation
- PDF text extraction (for JDs, team docs, org charts)
- Files read as text/base64 and sent to API as context — NOT stored server-side in MVP
- File metadata persisted to session storage (names, sizes, types) for re-upload prompts on return
- Binary content cannot be serialized — show warm notice listing previously uploaded files if user returns

### Session Persistence
Same pattern as intake form:
- Phase, status, and form field data saved to storage on every change
- File metadata saved (not binary content)
- "Start over" button to clear state
- "If you close the tab" messaging explaining what's saved vs. what needs re-upload

---

## Privacy & Security

### Data handling disclosures (visible in UI)
The recruiter and their client need to trust this tool with sensitive search data. Include clear, visible messaging:
- "Your data is processed in real-time and not stored on our servers"
- "API calls are encrypted in transit (TLS)"
- "Uploaded documents are used as context for this session only and are not retained"
- Consider a small "Privacy" or "How we handle your data" expandable section at the top of the form

### Technical security
- API keys: server-side only via Vercel env vars (never in client bundle)
- No document persistence to disk or database in MVP — documents are session-scoped
- No logging of document contents
- Sensitivity filter: same pattern as candidate lens — remove sentences with clinical labels if they appear in uploaded content

### Future considerations (not MVP, but design for it)
- Recruiter authentication (firm-level accounts)
- Data isolation between firms
- Audit trail for who accessed which candidate lens

---

## Form Structure

### Phase 1 — Intro ("Define your search")
- Brief explanation of what the role input does and how it will shape candidate sessions
- Time estimate: "5-10 minutes to enter role context, plus any documents you have"
- Privacy notice (expandable)

### Phase 2 — Role Context (structured fields)
The recruiter enters key information about the search:

**IMPORTANT: Field type principle.** Default to free text inputs unless the options are truly finite and universal. Recruiters describe searches in rich, specific language ("Series B, $45M raised, 85 employees, founded 2021"). Dropdowns lose that signal. Only use dropdowns/selects for fields where every possible answer is known in advance (e.g., currency type, country). When in doubt, use text.

**Required fields:**
- Role title (text)
- Company name (text)
- Hiring manager / key stakeholder name(s) (text)
- What does this role need to accomplish in the first 12 months? (textarea — this is the real role lens signal, not the JD)
- Top 3-5 priorities for this hire, ranked (sortable list or numbered textareas)

**Optional fields:**
- Compensation range (text or structured min/max)
- Location requirements (text — remote, hybrid, specific city)
- Company stage / size (TEXT INPUT, NOT a dropdown — recruiter needs to enter specifics like "Series B ($45M raised), 85 employees, founded 2021")
- What happened with the last person in this seat? (textarea — sensitive, high-signal)
- What would make this hire fail? (textarea — surfaces disqualifiers)
- Anything the candidate should NOT know during the discovery session? (textarea — feeds the recruiter-only notes bucket, never injected)

### Phase 3 — Document Upload
Recruiter-appropriate upload categories (parallel to candidate intake's 5 categories):

1. **Job description** (PDF, DOCX, TXT — single file) — "The formal JD, if one exists. We'll use it as a starting point, not a constraint."
2. **Stakeholder notes** (PDF, DOCX, TXT — multiple files) — "Meeting notes, intake call notes, emails from the hiring manager — anything that captures what the client actually said."
3. **Team/org context** (PDF, DOCX, TXT, images — multiple files) — "Org charts, team bios, company culture docs, internal decks about the team."
4. **Candidate materials to pre-load** (PDF, DOCX, TXT — multiple files) — "If you already have the candidate's resume or LinkedIn, upload here so the discovery session doesn't re-ask what's already known."
5. **Anything else** (any file type) — "Compensation data, market research, previous search briefs, whatever context would help."

Each category gets guidance copy explaining what it's for and why it matters (same UX pattern as candidate form).

### Phase 4 — Review & Confirm
- Summary of all entered fields and uploaded documents
- Ability to edit any section before proceeding
- "Generate candidate session link" button — this is the handoff to Step 2 (session generation)
- In MVP, this can generate a JSON blob of the role context that will be consumed by the session generation step (which may be built separately)

---

## Technical Notes

### File handling
- Same file types as candidate intake: PDF, DOCX, TXT, MD, HTML, images (PNG, JPG for screenshots of org charts etc.)
- PDF text extraction via existing pattern
- DOCX text extraction (if the candidate intake already handles this, reuse)
- Max file sizes: same as candidate intake
- Client-side extraction preferred over server-side to minimize data transit

### Component structure
- New route: suggest `/recruiter` or `/role` in the app
- Can share styled components with the candidate intake (progress bar, upload components, phase navigation)
- Keep as a single page component for MVP (like `lens-intake.jsx` pattern)
- Consider a shared design system file if one doesn't exist yet (extract common styles from intake form)

### What this produces
The role input form outputs a structured role context object:
```json
{
  "roleTitle": "VP of Customer Success",
  "company": "Acme Corp",
  "stakeholders": "Jane Smith (CEO), Bob Lee (COO)",
  "firstYearObjective": "Rebuild enterprise CS function...",
  "priorities": ["Reduce churn from 8% to 4%", "Hire team of 5", "..."],
  "compensation": "$280K-$350K base + equity",
  "location": "Remote, NYC preferred",
  "companyStage": "Series B, 85 employees",
  "lastPerson": "Left after 8 months — misalignment with CEO...",
  "failureMode": "Someone who needs heavy structure...",
  "recruiterOnly": "Candidate thinks they left voluntarily but...",
  "documents": {
    "jd": { "name": "VP_CS_JD.pdf", "extractedText": "..." },
    "stakeholderNotes": [...],
    "teamContext": [...],
    "candidateMaterials": [...],
    "other": [...]
  }
}
```

This object gets consumed by the session generation step (separate build). For now, the form can store this to session storage and display a confirmation.

---

## Reference files
- `lens-intake.jsx` (~680 lines) — design and UX reference for the candidate side
- `lens-form.jsx` (~800 lines) — Claude API integration reference
- `api/submit.js` in feedback form — Vercel serverless proxy pattern
- `recruiter-candidate-lens-spec-v0.1.md` — full R→C spec

---

## Definition of Done
- [ ] New route in lens app accessible at `/recruiter` (or similar)
- [ ] All 4 phases functional with navigation
- [ ] International Style design matching candidate intake form
- [ ] Document upload working for all 5 categories with text extraction
- [ ] Session persistence (form state survives refresh, files need re-upload)
- [ ] Privacy notice visible
- [ ] No API keys in client bundle
- [ ] Role context object stored to session on form completion
- [ ] Deployed to `lens-app-five.vercel.app`
- [ ] Claude Code session row written to Airtable
