# Team Identity Validation Test — Experiment Spec v1.0

> **Origin:** James Pratt, April 15, 2026 call
> **Purpose:** Validate the core Role Lens premise before building the full intake flow
> **Status:** SPEC — not yet executed

---

## THE HYPOTHESIS

An AI can synthesize individual values and work-style inputs from a team into a team identity portrait that the team recognizes as accurate.

If this works, it proves the foundational capability behind the role lens: that Lens can articulate "who we are" for a group in a way that resonates — which is the prerequisite for matching candidates against that identity.

If this doesn't work, the full Role Lens build is premature.

## WHY THIS MATTERS

James's framing: "Before you spend the time and energy to build all of that stuff... is there a simpler way that you can see if there's signal here?"

The Role Lens schema (`role-lens-schema.md`) defines a full intake flow with stakeholder interviews, team dynamics mapping, and scoring output. That's a significant build. This experiment isolates the single riskiest assumption: **can AI synthesize group identity from individual inputs in a way that feels true?**

Every assessment tool James has seen — StrengthsFinder, DISC, colors — is basically a horoscope. The bar here isn't perfection. It's resonance: does the team say "yes, that's us"?

## EXPERIMENT DESIGN

### Participants

Target: 5–10 teams of 3–8 people each. Ideal mix:

- 2–3 exec teams (C-suite or VP-level) — these are the actual buyer persona
- 2–3 functional teams (engineering, sales, product) — easier to recruit, validates breadth
- 1–2 teams where you have an insider who can facilitate (Graham Kittle at H&S, James's network respondents, Edie McCarthy's contacts)

### Input Collection (Per Team Member)

Each team member completes a **10-minute async form**. No login, no account — just a shareable link per team.

**Section 1: Your Values (5 min)**

Prompt: "Pick 5 values from this list that most shape how you work. For each, write one sentence about what it looks like in practice — not what it means in the dictionary, but how it shows up on your team."

Provide a curated list of ~40 values (drawn from James's workshop vocabulary + the candidate lens values section). Include an "other" field for unlisted values.

Why behavioral evidence: James's insight — people say "autonomy" but rule with a rod of iron. The behavioral sentence is the check. It's not a lie detector, but it surfaces the gap between poster values and practiced values better than a bare checkbox.

**Section 2: Work Style (3 min)**

Five forced-choice pairs (pick the one that's more true of you):

1. I prefer to move fast and iterate / I prefer to plan thoroughly before acting
2. I do my best work alone / I do my best work collaborating
3. I'm energized by new problems / I'm energized by mastering known problems
4. I communicate directly, even if it's uncomfortable / I prefer to build consensus before raising concerns
5. I'm most productive with clear structure / I'm most productive with open-ended freedom

Each pair maps to a work-style dimension that feeds the synthesis.

**Section 3: What Makes This Team Work — and What Doesn't (2 min)**

Two open-text prompts:

- "What's the best thing about how this team works together?"
- "What's the one thing that, if it changed, would make this team significantly better?"

These are the highest-signal fields. They surface the real dynamics — the stuff that doesn't show up in values checklists.

### Synthesis

Once all team members have submitted, the AI synthesizes a **Team Identity Portrait** — a 1-page document with four sections:

**1. SHARED VALUES**
The values that clustered across the team, with the behavioral evidence aggregated. "This team operates with a strong bias toward [value]. In practice, that looks like [synthesized behavioral examples]."

**2. WORK STYLE SIGNATURE**
The team's aggregate work style profile. Where there's strong consensus (e.g., 6/7 prefer to move fast), state it confidently. Where there's divergence (e.g., 4/7 collaborative, 3/7 independent), name the tension explicitly — this is where the interesting signal lives.

**3. TEAM DYNAMICS**
Synthesized from the open-text "what works / what could change" responses. The AI looks for convergent themes and surfaces them. If 5 of 7 people independently say "we're great at rallying in a crisis but bad at long-term planning," that's a real signal.

**4. THE TENSION MAP**
Where values or work styles diverge meaningfully across the team. Not presented as a problem — presented as "here's where the productive friction lives." This is the section that makes it more than a horoscope. Horoscopes never tell you what's hard.

### Validation

Present the Team Identity Portrait back to the team (ideally in a 30-minute group session, or async with a feedback form). Collect:

1. **Accuracy score** (1–10): "How well does this represent who your team actually is?"
2. **Surprise factor**: "Did anything in here surprise you?" (Yes/No + what)
3. **Conversation catalyst**: "Did reading this make you want to discuss anything as a team?" (Yes/No + what)
4. **Would you use this?**: "If you were hiring someone for this team, would you want them to see this document?" (Yes/No/With edits)

The success threshold isn't a specific number — it's pattern recognition across the cohort:

- **Strong signal:** Accuracy 7+ across most teams, "conversation catalyst" = Yes for most, "would you use this" = Yes/With edits
- **Weak signal:** Accuracy 5–6, some conversation catalyst, mixed on usage
- **No signal:** Accuracy <5, teams say "this is generic," no conversation catalyst

## WHAT THIS IS NOT

This is not a product. There's no scoring, no candidate matching, no API. It's a manual experiment:

1. Eric sends a Google Form (or a simple Lens-hosted form if time allows)
2. Eric runs the synthesis through Claude with a purpose-built prompt
3. Eric formats the output as a clean 1-pager
4. Eric presents it to the team and collects feedback

Total effort per team: ~2 hours of Eric's time. Total effort for 5 teams: ~10 hours + recruitment.

## CONNECTION TO THE ROLE LENS

If this experiment succeeds, the Team Identity Portrait becomes the **core of the Role Lens document**. The Role Lens schema already defines sections for team dynamics, values alignment, and work style — this experiment validates that AI can fill those sections from real input.

The synthesis prompt used in this experiment becomes the seed for the `/api/synthesize-team` endpoint. The form becomes the seed for the stakeholder intake flow.

If this experiment fails, it tells you either: (a) the input format needs work, (b) the synthesis prompt needs work, or (c) the premise itself doesn't hold. Each of those is a different next step, and knowing which one is worth the 10 hours.

## IMPLEMENTATION SEQUENCE

**Phase 1: Build the form (1 day)**
- Simple form: team code, name, values picker, work style pairs, two open-text fields
- Can be Google Forms for v0, or a lightweight Lens-hosted page if it helps recruiting ("come try this thing I'm building")
- No auth, no persistence — just collect and store

**Phase 2: Write the synthesis prompt (half day)**
- System prompt that ingests all team members' responses and produces the four-section portrait
- Test with synthetic data first (fabricate 5 team members, run synthesis, evaluate quality)
- Iterate prompt until the tension map section consistently surfaces real divergence rather than platitudes

**Phase 3: Recruit teams (1–2 weeks)**
- Pipeline: James's HR leader network respondents, Graham Kittle (H&S team?), Edie McCarthy's contacts, personal network (Brendan's team? Niels's team at Remedy?)
- Pitch: "I'm testing whether AI can capture team identity. Takes 10 min per person. You'll get a free team portrait back."
- The pitch itself is a validation signal — if people don't want to do it, the product has a demand problem

**Phase 4: Run and present (1–2 weeks)**
- Collect responses, synthesize, format, present, collect feedback
- Log everything in Airtable (new table or extend Feedback Archive)

**Phase 5: Decide (1 day)**
- If strong signal → feed learnings into Role Lens schema, build the real intake flow
- If weak signal → iterate on input format or synthesis prompt, run again
- If no signal → reassess whether team identity synthesis is the right entry point

## OPEN QUESTIONS

1. **Should the form be Lens-branded or neutral?** Lens-branded helps with recruiting and brand building. Neutral avoids priming bias in the results.
2. **Group presentation vs. async feedback?** Group is higher-signal (you see the reaction in real time) but harder to schedule. Async scales better.
3. **How much context to give the team beforehand?** Too much ("we're testing whether AI can understand your team") primes them to be generous. Too little ("fill out this form") gets low engagement.
4. **Can this double as recruiter validation?** If Graham Kittle participates with his H&S team, you get both the experiment data AND the recruiter's reaction to the concept. Two birds.

---

*"The most successful tech companies are the ones that are really good at finding and getting to signal quickly, and also letting that lead them." — James Pratt, April 15, 2026*
