# Lens Context Integration Spec v1.0

> Addresses the gap where uploaded materials (resume, LinkedIn, assessments) are ignored during discovery and absent from synthesis output. Derived from analysis of Ravi Katam's Lens output vs. source materials and his direct feedback (April 10, 2026 call).

---

## PART 1: Discovery Phase — Context Acknowledgment Logic

### The Problem

The AI opens each section with a blank-slate question ("What do you do?" / "Who are you at your core?") even when the user has uploaded a resume, LinkedIn profile, and other materials. This:

1. **Signals that the AI didn't read anything.** The user invested effort uploading documents. Ignoring them is a trust violation.
2. **Forces the user to repeat themselves.** They've already stated their title, metrics, career arc — now they're being asked to recite it again from memory.
3. **Wastes time.** The discovery conversation should go *deeper* than the resume, not re-cover the same ground.
4. **Produces weaker output.** Without resume grounding, the AI has to rely entirely on conversational recall for the synthesis, missing hard data (metrics, company names, scale indicators).

### The Fix: Context-First Opening

When uploaded materials exist, the AI must **demonstrate comprehension before asking its first question** in each section. The pattern is:

```
[Brief summary of what the AI already knows from uploaded docs, relevant to THIS section]
→ [Acknowledgment that this is a starting point, not the whole picture]
→ [A question that goes DEEPER than what the documents say]
```

### Implementation: Replace `openingPrompt` with `contextOpeningPrompt`

Each section gets a new field: `contextOpeningPrompt` — a template that the AI populates with specifics from the uploaded materials. When no materials are uploaded, the existing `openingPrompt` fires instead.

The `buildSystemPrompt()` function should inject a new block:

```
CONTEXT ACKNOWLEDGMENT RULES:
When the user has uploaded documents (resume, LinkedIn, etc.), you MUST open each section by:

1. Stating 1-2 specific things you already know from their materials that are relevant to THIS section.
   Use concrete details: names, numbers, companies, titles — not vague summaries.
2. Framing these as YOUR understanding that may be incomplete.
3. Asking a question that the documents CAN'T answer — something about motivation, experience quality, or pattern behind the facts.

EXAMPLE (Essence section, with resume uploaded):
"Your resume shows you've been in customer success for 8 years, scaling a team from 2 to 24 at Bigtincan while growing the portfolio from $10M to $70M ARR. That's a builder trajectory — not everyone stays through that kind of growth. What I can't tell from the resume is what makes YOU the person who does that. When you look across all of it, what's the throughline?"

EXAMPLE (Skills section, with resume uploaded):
"From your resume, I can see deep experience in enterprise account management — Cisco, Thomson Reuters, Yahoo, Harvard Medical — plus technical chops from your engineering background. That's an unusual combination for a CS leader. Which of those capabilities do you want to keep leaning into, and which ones have you outgrown?"

EXAMPLE (Values section, with resume uploaded):
"You've been at Showpad/Bigtincan for 8 years — that's unusual loyalty in SaaS. Something kept you there through acquisitions and leadership changes. What was it? And was there a point where the thing that kept you started to erode?"

ANTI-PATTERNS:
- "I see you uploaded a resume." (acknowledges the upload, not the content)
- "Based on your background in customer success..." (vague, could apply to anyone)
- "Tell me about yourself." (ignores everything uploaded)
- "Your resume mentions several accomplishments." (lazy, non-specific)
- Listing everything from the resume back to them (information dump, not conversation)

THE PRINCIPLE:
Act like a recruiter who read the candidate's materials the night before and came prepared with specific questions. Not someone flipping through the resume for the first time during the meeting.
```

### Section-Specific Context Hooks

Each section should extract different signals from the uploaded materials:

| Section | What to pull from resume/LinkedIn | What to ask that docs can't answer |
|---------|-----------------------------------|------------------------------------|
| **Essence** | Career arc, tenure patterns, trajectory shape (builder vs. maintainer) | The *why* behind the pattern. What drives the consistency. |
| **Skills & Experience** | Specific skills, tools, scale indicators, enterprise clients, technical depth | Which of these are carry-forward vs. done-with. How the skills *felt* to use. |
| **Values** | Tenure length, company transitions, role changes | What kept them, what pushed them out, what they defended. |
| **Mission & Direction** | Current/recent sector, company types, stated interests | Whether the pattern is intentional or accidental. What pulls them vs. what they fell into. |
| **Work Style** | Team size managed, geo scope, role structure | What made the good days good and the bad days bad. |
| **What Fills You** | Side projects, scope expansions, things they volunteered for | The gap between what they're good at and what gives them energy. |
| **Disqualifiers** | Company types they've left, patterns in departures | The specific red flags that made them leave or wish they had. |
| **Situation & Timeline** | Current status, recency of last role | Real urgency vs. stated urgency. What "success" looks like in 6 months. |

### Stats Extraction from Documents

The synthesis prompt needs structured data from documents for the YAML frontmatter. During discovery (or as a pre-processing step), extract:

- **Years of experience** (calculate from earliest relevant role)
- **Largest team managed** (direct reports or org size)
- **Largest book of business / ARR managed**
- **Geographic scope** (regions, countries, continents)
- **Number of products supported** (if multi-product)
- **Key NRR / retention metrics**
- **Notable enterprise clients** (brand-name signal)

These populate the `stats:` field in YAML frontmatter and ground the narrative in Section 02.

---

## PART 2: Synthesis Prompt — Resume Integration Addendum

### The Problem

The current SYNTHESIS-PROMPT.md tells the AI to write narrative prose in third person, with per-section voice guidance. But it contains **no instructions about incorporating resume/LinkedIn data** into the output. The result: synthesis is generated purely from conversational recall, and hard evidence (metrics, company names, client logos, technical skills, career trajectory milestones) gets lost.

Ravi's Lens document demonstrates this precisely:
- Section 01 (Essence) describes his interpersonal operating style but never identifies him as a CS leader who managed $40M ARR
- Section 02 (Skills) talks about "cross-functional orchestration" generically but never mentions scaling from 2 to 24 CSMs, 120% NRR, or the technical engineering background that differentiates him
- No section mentions enterprise clients (Cisco, Thomson Reuters, Yahoo, Harvard Medical), global scope (NA + EMEA), or the AI-driven health scoring framework he built
- The stats bar is empty because no structured data was extracted from his resume

### The Fix: Add Resume Integration Rules to SYNTHESIS-PROMPT.md

Insert the following block after the existing "VOICE RULES" section and before the per-section guidance:

```
## DOCUMENT CONTEXT INTEGRATION

The user may have uploaded documents during intake: resume, LinkedIn profile, writing samples, assessments. These are NOT filler — they contain structured career evidence that MUST appear in the lens document. The discovery conversation reveals motivation, values, and identity. The documents provide proof.

### Rules for integrating document evidence:

1. **Section 01 (Essence) must include professional identity, not just behavioral patterns.**
   The essence captures WHO this person is. If they're a CS leader who managed $40M ARR, that's identity — not just a metric. If they have an engineering background that makes them a different kind of CS leader, that's essence. The first sentence should establish professional identity; the subsequent paragraphs can explore operating style and behavioral patterns.
   
   WEAK: "Ravi creates alignment across systems by translating shared missions into terms that connect with what drives each person."
   STRONG: "Ravi is a customer success leader who builds CS organizations from the ground up — he scaled Bigtincan's function from 2 people to 24 while growing the portfolio from $10M to $70M ARR. What makes him unusual isn't the metrics but how he gets there: by creating alignment across entire systems and translating shared missions into terms that connect with what already drives each person."

2. **Section 02 (Skills & Experience) must be grounded in resume evidence.**
   This section should name specific companies, specific scale, specific achievements. The narrative voice should weave these naturally, not list them:
   
   WEAK: "His strength lies in creating order from chaos — running daily escalation cadences when stakes are high."
   STRONG: "His career arc moves from technical architecture (solutions engineering at InsideSales, CMS implementations at Percussion Software for clients like Cedars Sinai and the Red Cross) to customer success leadership at Bigtincan, where he oversaw a $40M ARR book achieving 120% NRR. What he carries from the technical side is rare: he can sit in a room with engineering, understand the architecture, and translate it into customer value — most CS leaders can't."

3. **Metrics belong in the narrative, not in a separate data section.**
   Don't create a "Key Metrics" subsection. Weave numbers into the prose where they demonstrate scale, impact, or differentiation:
   - Book of business size → establishes credibility and scope
   - NRR percentage → proves retention/expansion capability  
   - Team scaling numbers → proves builder trajectory
   - Enterprise client names → proves ability to operate at enterprise level

4. **Technical skills and tools appear when they differentiate.**
   If the person has Salesforce, Gainsight, and health scoring framework experience, mention these in Skills & Experience when they distinguish this person from generic CS leaders. Don't list tools; explain what they enabled.

5. **Career trajectory tells a story.**
   Use resume chronology to establish the arc in Section 02. Not as a timeline, but as a narrative:
   "He started as an engineer, moved into solutions architecture, and discovered that his real skill was translating between technical and business stakeholders. That translation ability became the foundation for everything he's built in customer success."

6. **The stats bar must be populated.**
   Extract from documents and conversation:
   - Total years of relevant experience
   - Largest team size (built or managed)
   - Key revenue metric (ARR managed, NRR achieved)
   - Geographic or market scope
   
   Format: `stats: 15+ years | 24-person CS org built | $40M ARR / 120% NRR | NA + EMEA`

### What NOT to do with document evidence:

- Don't reproduce the resume in narrative form. The Lens is not a prose resume.
- Don't let document data overwhelm conversational insights. The discovery conversation reveals what the resume can't — motivation, values, self-awareness. Both sources must be present.
- Don't attribute document evidence with "according to their resume" — write as if you simply know these things about the person.
- Don't include every metric or every company. Select what's most relevant to the person's identity and what differentiates them.
```

### Per-Section Addendum

Update the existing per-section writing guidance to include document integration notes:

**Essence (Section 01) — add:**
```
The first sentence must establish professional identity with enough specificity that a recruiter knows what level and function this person operates at. If they manage $40M ARR and 24 CSMs, that's not a detail — it's the frame. The behavioral/operating style description follows and gives depth to the professional identity. Without the professional identity anchor, the essence reads as a personality description that could apply to anyone.
```

**Skills & Experience (Section 02) — add:**
```
This section has the highest document-dependency. The career arc narrative should reference specific companies and roles to establish credibility. Metrics (ARR, NRR, team size, client names) should be woven in where they demonstrate capability at scale. The carry-forward / leave-behind framing should reference actual skills from the resume, not generic categories. If the person has an unusual background combination (e.g., engineering + CS leadership), name it explicitly — it's a differentiator.
```

**Mission & Direction (Section 04) — add:**
```
If the person's resume shows sector consistency (e.g., all B2B SaaS, or all healthcare), reference that pattern. If their resume shows sector diversity, note whether the next chapter continues the pattern or breaks it. This grounds mission statements in career evidence rather than pure aspiration.
```

**Non-Negotiables (Section 06) — add:**
```
If the person's tenure patterns or career transitions suggest disqualifiers (e.g., short stints at PE-backed companies, consistent departures from large orgs), the synthesis should connect these patterns to the stated non-negotiables. "He specifically asks how many CS people have left in the past two years" becomes more powerful when preceded by "Having built a 24-person CS org, he knows what healthy team retention looks like."
```

---

## PART 3: Implementation Checklist

### Discovery Phase Changes
- [ ] Add `CONTEXT ACKNOWLEDGMENT RULES` block to `GLOBAL_FRAMING_PROMPT`
- [ ] Add `contextOpeningPrompt` field to each section definition
- [ ] Update `buildSystemPrompt()` to inject document summary when materials exist
- [ ] Pre-process uploaded documents to extract structured data (years, team size, ARR, NRR, clients, tools)
- [ ] Store extracted data as `documentContext` object passed to both discovery and synthesis

### Synthesis Phase Changes
- [ ] Add `DOCUMENT CONTEXT INTEGRATION` section to SYNTHESIS-PROMPT.md
- [ ] Update per-section guidance with document integration notes
- [ ] Ensure the synthesis API call includes raw document text alongside conversation history
- [ ] Add `documentContext` structured data to synthesis call for stats bar population
- [ ] Update stats bar extraction to pull from `documentContext` when conversation doesn't surface metrics

### Validation
- [ ] Re-run Ravi's uploaded materials through updated discovery prompts — verify the AI opens with specific resume references
- [ ] Generate a new lens from Ravi's conversation + resume data — verify Section 01 establishes CS leadership identity, Section 02 includes $40M ARR / 120% NRR / 2→24 scaling / enterprise clients
- [ ] Verify stats bar populates: `15+ years | 24-person CS org built | $40M ARR / 120% NRR | NA + EMEA`
- [ ] Test with a user who uploads NO documents — verify graceful fallback to existing `openingPrompt`

---

*This spec is versioned as v1.0. It addresses the document-integration gap identified through Ravi Katam's tester experience. The underlying principle: the resume is proof, the conversation is depth. Neither alone produces a good Lens. Both together produce something worth sharing.*
