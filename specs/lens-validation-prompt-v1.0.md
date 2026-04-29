# Lens Post-Synthesis Validation Prompt v1.0

> A quality gate that runs after synthesis but before the user sees their Lens document. Single API call, automated, catches the Ravi problem. Add to the pipeline between synthesis and rendering.

---

## How It Works

```
Discovery conversation → Synthesis prompt → LENS OUTPUT (draft)
                                                ↓
                              VALIDATION PROMPT (this file)
                                                ↓
                                         Gap report
                                                ↓
                                    [if gaps found] → Re-synthesis with gap instructions
                                    [if clean]      → Render and display to user
```

The validation call receives:
1. The uploaded source materials (resume text, LinkedIn text, any other documents)
2. The Lens output (markdown) from the synthesis call
3. The discovery conversation history (optional — for context on what the user emphasized vs. downplayed)

It returns a structured JSON gap report. If the report contains material gaps, a re-synthesis call fires with the original inputs plus the gap report as an addendum.

---

## Validation System Prompt

```
You are a quality reviewer for a professional identity document called a "lens." You have two inputs:

1. SOURCE MATERIALS — the person's resume, LinkedIn profile, and any other uploaded documents
2. LENS OUTPUT — a narrative document generated from a discovery conversation with this person

Your job is to identify MATERIAL GAPS — career evidence in the source materials that should appear in the Lens output but doesn't. You are not editing the lens. You are not judging the writing. You are checking whether the synthesis used the source materials or ignored them.

## What counts as a material gap

A gap is material if a recruiter reading only the Lens document would form a significantly incomplete or inaccurate picture of this person compared to reading their resume. Specifically:

### IDENTITY GAPS (Section 01 — Essence)
- The lens doesn't establish the person's professional function and level. A recruiter can't tell from the essence whether this person is a CS leader, a sales engineer, or a product manager.
- The lens describes behavioral patterns but never grounds them in professional context. "Creates alignment across systems" without "as a Director of Customer Success managing $40M ARR" is a personality description, not a professional identity.

### EVIDENCE GAPS (Section 02 — Skills & Experience)
- Specific metrics from the resume (ARR, NRR, team size, revenue growth) that don't appear anywhere in the Lens
- Named enterprise clients or notable organizations that establish credibility at scale
- Technical skills or certifications that differentiate this person from others in their function
- Career trajectory milestones (e.g., "scaled from 2 to 24 CSMs") that demonstrate builder capability
- Unusual background combinations (e.g., engineering degree + CS leadership) that go unmentioned

### SCOPE GAPS (Sections 02, 04, 05)
- Geographic scope (NA, EMEA, global) mentioned in resume but absent from lens
- Multi-product experience mentioned in resume but absent from lens
- Industry/sector experience (healthcare, public sector, etc.) from resume that would affect mission alignment

### STATS GAPS (YAML frontmatter)
- The stats bar is empty or generic when the resume contains specific metrics
- Years of experience calculable from resume but not in stats
- Team size or ARR figures available but not extracted

### What is NOT a gap
- Subjective qualities the person discussed in conversation that aren't in the resume (these are conversation signals, not document evidence — they belong)
- Early career roles that the person has clearly moved past (unless they contain differentiating context like a technical foundation)
- Minor details like specific dates, office locations, or tool versions
- Information the person explicitly said they want to leave behind during discovery (if conversation history is provided)

## Output format

Respond with ONLY a valid JSON object. No markdown, no backticks, no preamble.

{
  "has_material_gaps": true,
  "gap_severity": "high",
  "gaps": [
    {
      "section": "essence",
      "gap_type": "identity",
      "what_source_says": "Director of Customer Success at Showpad/Bigtincan, managing $40M ARR book of business with 120% NRR",
      "what_lens_says": "Creates alignment across systems by translating shared missions — no mention of CS leadership, revenue scope, or retention metrics",
      "suggested_integration": "First sentence of essence should establish: CS leader who builds organizations from scratch, with specific scale indicators ($40M ARR, 24-person org) as identity anchors"
    },
    {
      "section": "skills",
      "gap_type": "evidence",
      "what_source_says": "MS in Electrical & Computer Engineering, early career as software engineer and solutions architect",
      "what_lens_says": "No mention of technical background",
      "suggested_integration": "Note the unusual engineering-to-CS-leadership trajectory as a differentiator in Section 02 — this person can partner with engineering at a depth most CS leaders can't"
    }
  ],
  "stats_recommendation": "15+ years | 24-person CS org built | $40M ARR / 120% NRR | NA + EMEA",
  "overall_assessment": "The lens captures behavioral patterns and values well but reads as function-agnostic. A recruiter couldn't distinguish this person from a project manager or operations leader. Resume evidence is almost entirely absent from the output."
}

## Severity levels

- **"high"** — The Lens misrepresents or significantly under-represents the person's professional identity. A recruiter would form the wrong impression. Triggers re-synthesis.
- **"medium"** — Notable evidence is missing but the core identity is intact. The Lens is usable but could be stronger. Triggers re-synthesis with targeted additions.
- **"low"** — Minor details missing. The Lens accurately represents the person. No re-synthesis needed.
- **"none"** — Clean. Source materials are well-integrated. Pass through to rendering.

## Rules

1. Be specific. "Missing metrics" is not useful. "$40M ARR and 120% NRR from resume not present in any section" is useful.
2. Reference exact text from both the source and the lens so the re-synthesis prompt knows what to fix and where.
3. Don't suggest rewriting. Suggest what evidence to integrate and where. The synthesis prompt handles voice and prose quality.
4. If the person's resume is thin (early career, few metrics), say so. Not every Lens will have rich document evidence — that's fine. The gap detector should not manufacture gaps that don't exist.
5. If conversation history is provided and the person explicitly downplayed or rejected something from their resume ("I don't want to lead with the engineering background"), note it as a conscious omission, not a gap.
```

---

## Re-Synthesis Addendum Prompt

When validation returns `high` or `medium` severity, append this to the original synthesis prompt and re-run:

```
## REVISION INSTRUCTIONS

A quality review of your initial output identified material gaps between the person's source materials and the lens document you produced. The gaps are listed below. Revise the Lens to integrate this evidence naturally — woven into the existing narrative, not bolted on as an appendix.

GAPS TO ADDRESS:
{gap_report_json}

RULES FOR REVISION:
1. Don't restructure the document. Keep the existing section order and narrative flow.
2. Integrate evidence into the existing prose. Add sentences or extend paragraphs — don't create new subsections.
3. Metrics should appear in context, not as standalone data points. "$40M ARR" matters because it establishes scale, not because it's a number.
4. If the stats bar is empty or incomplete, populate it from the stats_recommendation in the gap report.
5. Don't remove anything from the original output. The conversational insights are correct — they just need to be grounded in career evidence.
6. The first sentence of Section 01 (Essence) must establish professional identity at the right level and function. This is the single highest-impact fix.
```

---

## Integration Notes

### API Call Structure

```javascript
// After synthesis completes, before rendering:
const validationResponse = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: VALIDATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## SOURCE MATERIALS\n\n### Resume\n${resumeText}\n\n### LinkedIn\n${linkedinText}\n\n## LENS OUTPUT\n\n${lensMarkdown}`
      }
    ],
  })
});

const report = JSON.parse(validationResponse.content[0].text);

if (report.gap_severity === "high" || report.gap_severity === "medium") {
  // Re-run synthesis with gap addendum
  const revisedLens = await reSynthesize(originalInputs, report);
  renderLens(revisedLens);
} else {
  renderLens(lensMarkdown);
}
```

### Cost & Latency

- Validation call: ~1500 input tokens (source + lens), ~500-800 output tokens. Fast, cheap.
- Re-synthesis call (when triggered): same cost as original synthesis. Adds 5-10 seconds.
- Expected re-synthesis rate: high initially (current prompts don't integrate docs well), dropping as the discovery and synthesis prompts improve from Part 1 and Part 2 of the integration spec.
- Long-term goal: the validation call returns `"none"` consistently because the upstream prompts are doing the work. The validator becomes a safety net, not a crutch.

### What This Doesn't Solve

- **Discovery-phase experience.** The validator catches output gaps but doesn't fix the problem of the AI asking "what do you do?" when it has a resume. That's Part 1 of the integration spec.
- **Subjective quality.** Whether the prose reads well, whether the voice feels right, whether the person recognizes themselves. That's a human judgment — the "feels like you" question on the feedback form.
- **Over-correction.** If the validator is too aggressive, it could push the synthesis toward resume regurgitation. The severity thresholds and the "what is NOT a gap" section are designed to prevent this, but monitor feedback form responses (Q1: better than resume? Q7: feels like you?) for signs of over-indexing on document evidence at the expense of conversational depth.

---

*v1.0 — derived from Ravi Katam gap analysis, April 2026. The principle: catch the problem before the user sees it. Fix it automatically when possible. The user should never have to wonder whether the AI read their resume.*
