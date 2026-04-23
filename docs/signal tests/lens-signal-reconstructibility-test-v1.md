# Signal Reconstructibility Test

## Purpose
Determine whether an LLM can reconstruct a professional identity profile from standard career documents (resume + personality assessment) that is comparable in depth and insight to what a 45-minute coached discovery session produces.

## Instructions
Run both Test A and Test B with the same LLM. Attach your resume and DISC assessment to each prompt. Do NOT mention Lens, the coaching methodology, or the 8-section structure in Test B. Compare both outputs to your actual discovery artifact.

---

## TEST A — Structured (Same Framework, Shallow Input)

This tests: **Does the same structure produce the same content from documents vs. coached discovery?**

Paste this prompt along with your resume and DISC assessment:

---

```
I'm going to give you my resume and a personality assessment (DISC profile). Using ONLY the information in these documents — and reasonable inferences from them — I want you to build a deep professional identity profile for me.

Structure the profile into these 8 sections. For each section, write 2-4 paragraphs of substantive analysis. Be specific, not generic. If the documents don't contain enough information to address a section meaningfully, say so explicitly rather than filling with generalities.

**Section 1 — Essence**
What is the throughline of this person's career and identity? What patterns repeat across roles and contexts? What seems to be the core of who they are professionally — not just what they do, but who they are when they're doing it?

**Section 2 — Skills & Experience**
What capabilities should this person carry forward into their next role? What should they leave behind? Where is their expertise deepest, and where might they be outgrowing previous strengths?

**Section 3 — Values**
What values actually drive this person's decisions — not aspirational poster values, but behavioral evidence of what they prioritize? Where do their career moves reveal what they care about?

**Section 4 — Mission & Sector**
What kinds of organizations, problems, or missions would be worth this person's time and energy? What sectors or company types align with their demonstrated interests and capabilities?

**Section 5 — Work Style**
How does this person actually work? What does their collaboration pattern look like? How do they lead, communicate, and make decisions? What environment brings out their best work?

**Section 6 — Energy Sources**
What fills this person up professionally? What drains them? What kinds of work make them lose track of time, and what kinds make them watch the clock?

**Section 7 — Disqualifiers**
Based on everything in these documents, what should this person absolutely avoid in their next role? What are the hard no's — the environments, cultures, or situations that would be a poor fit?

**Section 8 — Situation & Context**
What can you infer about where this person is in their career right now? What's their likely mindset, urgency level, and what constraints might they be navigating?

Important:
- Only use information present in or directly inferable from the attached documents.
- When you're extrapolating beyond what the documents explicitly state, flag it as an inference.
- If a section can't be meaningfully addressed from these documents, say "Insufficient signal from provided documents" and explain what's missing.
- Do not fabricate specific examples, anecdotes, or preferences that aren't grounded in the source material.
```

---

## TEST B — Blind (No Framework Provided)

This tests: **What does an LLM generate organically when asked for a professional identity profile? Does it converge on similar dimensions, or miss critical areas?**

Paste this prompt along with your resume and DISC assessment:

---

```
I'm going to give you my resume and a personality assessment (DISC profile). I want you to build the most comprehensive, honest, and insightful professional identity profile you can from these documents.

Don't just summarize my resume. I want you to go deeper — tell me who I am professionally, not just what I've done. Think of this as the document a career coach would write after deeply studying everything about me, capturing things I might not articulate about myself.

Rules:
- Only use information present in or directly inferable from the attached documents.
- When you're extrapolating beyond what the documents explicitly state, flag it as an inference.
- Do not fabricate specific examples, anecdotes, or preferences that aren't grounded in the source material.
- If there are important dimensions of professional identity that these documents simply can't reveal, name those gaps explicitly at the end.
- Be specific and concrete, not generic. If something you write could apply to any mid-career professional, it's not specific enough.
- Be honest. Include tensions, contradictions, or limitations you observe — not just strengths.
```

---

## EVALUATION FRAMEWORK

After running both tests, compare the outputs against your actual Lens discovery artifact using these criteria:

### 1. Signal Overlap (0-100%)
For each of the 8 sections in your actual discovery artifact, estimate what percentage of the key insights also appear in the LLM reconstruction.
- **80-100%**: The signal is largely reconstructible from documents. Moat is thin.
- **50-79%**: Partial reconstruction. Discovery adds meaningful signal but isn't entirely unique.
- **Below 50%**: Discovery generates substantially new signal. Moat is real.

### 2. Missing Dimensions
What did the discovery process surface that the LLM reconstruction completely missed? These gaps ARE the moat. List them.

### 3. Depth vs. Accuracy
The LLM might produce content that sounds deep but is wrong. Compare factual accuracy against your self-knowledge:
- What did the LLM get right?
- What did it get plausibly wrong (reasonable inference, but incorrect)?
- What did it get confidently wrong (stated with certainty, but inaccurate)?

### 4. "Coached Out" Insights
Flag any insights in your actual discovery artifact that you believe would NOT have emerged without the coaching interaction — things you didn't know about yourself until the conversation surfaced them. These are the highest-value signals and the strongest evidence for the discovery process.

### 5. Generic vs. Specific
Count how many statements in each output could apply to any experienced professional in your field vs. how many are genuinely specific to you. The ratio matters.

### 6. Test B Coverage
Did the blind test (no framework) naturally cover the same 8 dimensions? What did it add? What did it miss entirely? If it missed Essence, Values, Energy, or Disqualifiers — those gaps represent what the coached framework uniquely captures.

---

## RECORDING RESULTS

After evaluation, summarize findings in this format:

```
SIGNAL RECONSTRUCTIBILITY TEST — [Date]
Subject: [Name]
LLM Used: [Model]
Input Documents: Resume, DISC Assessment

TEST A (Structured) — Overall Signal Overlap: ___%
  Section 1 (Essence):        ___% overlap | Notes:
  Section 2 (Skills):         ___% overlap | Notes:
  Section 3 (Values):         ___% overlap | Notes:
  Section 4 (Mission):        ___% overlap | Notes:
  Section 5 (Work Style):     ___% overlap | Notes:
  Section 6 (Energy):         ___% overlap | Notes:
  Section 7 (Disqualifiers):  ___% overlap | Notes:
  Section 8 (Situation):      ___% overlap | Notes:

TEST B (Blind) — Dimensions Covered: ___ of 8
  Missing dimensions:
  Added dimensions not in framework:

COACHED-OUT INSIGHTS (from actual discovery, not reconstructible):
  1.
  2.
  3.

CONFIDENTLY WRONG INFERENCES:
  1.
  2.

VERDICT:
  [ ] Signal is largely reconstructible — moat is thinner than assumed
  [ ] Partial reconstruction — discovery adds meaningful but incremental signal
  [ ] Discovery generates substantially new signal — moat is real

IMPLICATIONS FOR PRODUCT THESIS:
```
