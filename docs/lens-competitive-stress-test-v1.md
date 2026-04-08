# Lens Project — Competitive Stress Test Brief

**Purpose:** Evaluate the defensibility, differentiation, and market viability of the Lens Project thesis against the most relevant competitors and market signals. Be adversarial. Identify the weakest points in the thesis and where the competitive moat may not hold.

---

## The Lens Project Thesis

The Lens Project is an AI-powered professional identity discovery and career-opportunity matching platform. The core claim:

**Structured, coach-facilitated identity discovery produces candidate representations with higher predictive validity for job performance than self-report methods (resumes, profiles, standardized assessments).**

This is grounded in Oh, Wang, & Mount (2011), which found that observer ratings outperform self-report for predicting job performance.

### How It Works

1. **Discovery:** A candidate completes a ~45-minute AI-facilitated discovery session modeled on professional coaching methodology (derived from a practicing career coach's Be-Have-Do / Essence / IAM framework). The session covers 8 structured sections exploring values, strengths, working style, motivations, leadership approach, and career identity.

2. **Identity Artifact:** The output is a structured, portable identity document the user owns. This is not a personality profile or trait score — it's a rich, narrative-backed representation of professional identity.

3. **Bidirectional Scoring:**
   - **C→R (Candidate scores Role):** The candidate's identity artifact is scored against a role to evaluate fit from the candidate's perspective.
   - **R→C (Role scores Candidate):** A structured role profile scores candidates to evaluate fit from the employer's perspective.

4. **Coach Network:** Human coaches can use the platform as their discovery tool, adding depth and validating the AI-facilitated process.

### Key Claims

- The discovery process itself generates new, high-quality signal that doesn't exist elsewhere (not extractable from resumes, LinkedIn, or ATS data).
- The 45-minute depth and coaching methodology resist gaming in ways standardized assessments cannot.
- User ownership of the identity artifact differentiates from employer-controlled assessment tools.
- The artifact is durable — scored against unlimited roles at near-zero marginal cost once created.
- Bidirectional scoring (both C→R and R→C) is a differentiated architecture.

### Current State

- Live prototype with testers completing full discovery flows
- Provisional patent filed (March 2026)
- Targeting mid-career professionals ($120K–$300K+ roles) in B2B SaaS
- Exploring NSF SBIR grant for research validation
- Single founder, pre-revenue, LLC formed

---

## The Competitive Landscape

### 1. SquarePeg (squarepeg.ai)

**What they do:** AI-powered candidate screening tool for employers. Originally (2016–2022) a two-sided matching marketplace where candidates took psychometric assessments (19 personality traits) and were matched to jobs. Pivoted to employer-side ATS screening — now ingests resume data, LinkedIn data, ATS history, and 3rd-party data to score and rank candidates. Focuses on non-tech roles.

**Key facts:**
- Founded 2016, bootstrapped until Feb 2025 seed round ($6.6M total raised)
- $2.8M revenue (2024), 17-person team
- Investor Thomas Otter (ex-Gartner e-recruitment MQ lead, ex-SAP SuccessFactors) frames it as doing everything a recruiter would do with unlimited time, producing a transparent score
- Core differentiator: "Glassbox" — full explainability of why a candidate matches

**Critical strategic signal:** SquarePeg tried bidirectional matching (candidate assessments → mutual matching) and dropped the candidate-facing side to focus on employer screening. They collapsed from two-sided to single-sided.

**Overlap with Lens:** Both produce match scores beyond keyword matching. Both target non-tech roles where soft skills matter. SquarePeg's current model is essentially R→C scoring — the same motion Lens would perform on the employer side.

**Key differences:** SquarePeg scores against existing commodity data (resumes, LinkedIn). Lens would score against a deep identity artifact generated through coached discovery. SquarePeg is fast/cheap/scalable for volume hiring. Lens targets high-value hires where depth matters.

---

### 2. Pymetrics (acquired by Harver, August 2022)

**What they did:** Neuroscience-based behavioral games measuring cognitive and emotional attributes — explicitly designed to replace self-report with observed behavior. Used gamified assessments (~25 min) to measure soft skills. $56.6M raised from Khosla Ventures, Salesforce Ventures, General Atlantic, Workday Ventures, and others.

**Key quote from founder Frida Polli:** "People are notoriously bad at knowing themselves and then reporting that in an accurate way." (This is essentially the Oh/Wang/Mount argument that Lens builds on.)

**What happened:** Acquired by Harver (enterprise hiring optimization platform) in August 2022. Brand effectively dissolved. Behavioral assessment methodology became a feature inside Harver's volume hiring stack, serving 1,300+ customers (Booking.com, Peloton, McDonald's) for high-volume hiring.

**The pattern:** Standalone assessment-based matching gets absorbed into enterprise hiring workflow tools. The science persists but loses its identity as a product. Pymetrics also had a talent mobility angle (matching existing employees to internal opportunities via reskilling) that validated the internal mobility use case.

**Overlap with Lens:** Both share the core insight that observed behavior > self-report. Both aimed at improving matching quality and reducing bias.

**Key differences:** Pymetrics was gamified and shallow (~25 min cognitive games). Lens is coached and deep (45+ min, 8 sections). Pymetrics was enterprise-controlled; Lens is user-controlled with a portable artifact. Pymetrics had no coach integration.

---

### 3. BetterUp (betterup.com)

**What they do:** AI + human coaching platform for enterprise leadership development. 1:1 and group coaching, digital resources, "Whole Person Model" assessment, mental fitness, manager effectiveness products.

**Key facts:**
- Founded 2013, $628M raised, peaked at $4.7B valuation (Oct 2021)
- Revenue: $214.6M (2024), up from $100M ARR (July 2021)
- 3,000+ contractor coaches, 380+ enterprise customers (Hilton, Salesforce, NASA, Chevron)
- Prince Harry as Chief Impact Officer

**The trouble:**
- Fell 20%+ short of revenue targets in recent fiscal year
- Multiple layoff rounds, including 16% of staff in one round
- Coach revolt over pay cuts
- Revolving C-suite, constant strategy pivots
- CEO jokes company is "SaaSy, not SaaS" but holds teams to SaaS metrics
- High individual user churn — engagement drops after initial breakthroughs
- Large contracts sometimes come from companies offering coaching as a layoff perk (one-time, non-recurring)

**The cautionary tale:** Coaching-as-a-service at scale has a fundamental unit economics problem. Coaching is high-touch, hard to automate, and enterprise buyers churn when budgets tighten. BetterUp's response was to layer in AI coaching, diluting the value proposition.

**Overlap with Lens:** Both involve coaching and personal/professional development. Both serve enterprise buyers. Both claim behavioral science grounding.

**Key differences:** BetterUp is ongoing coaching engagement with no portable output. Lens is a single deep discovery session producing a durable artifact with matching capability. Lens doesn't depend on enterprise L&D budget cycles. Lens's coach model is facilitated discovery (one-time), not therapeutic/developmental coaching (ongoing).

---

### 4. Jack & Jill (mentioned for context)

AI recruiting platform, $20M seed round. Structured preference-based matching at recruiter-level intelligence. Fast, wide, but shallow. No coaching depth, no portable artifacts, no weighted scoring, no coach network.

---

### 5. Traditional Psychometrics (DISC, StrengthsFinder, Myers-Briggs, CliftonStrengths)

Static self-report instruments. No matching capability. Fully gameable (candidates project desired persona). Widely used but low predictive validity for job performance. No portable artifact that connects to opportunity matching.

---

## Market Signals and Tensions

### Signal 1 (from a career coach with 20+ years experience):
"Companies prioritize hiring volume over precision. The cost of a bad hire at most levels is manageable — companies have built operations to absorb ~50% mis-hire rates. Consumer self-service for mid-career professionals is more validated than enterprise hiring precision. Coaches need client demand generation, not workflow efficiency tools."

**Implication:** The individual discovery use case may be more validated than enterprise R→C scoring for most hiring tiers. The enterprise hiring precision thesis may be overstated for roles below $200K.

### Signal 2 (from a retired Goldman Sachs partner, 30+ years, built the Goldman Returnship program):
"The time investment for deep profiling is only justified at $300K+/board-level hires. The buyer at that tier is the executive recruiter, not the company directly. The coach market is too diffuse for volume."

**Implication:** There IS an enterprise market, but it's narrow (executive-level placements) and the buyer is the recruiter, not the hiring company. The internal mobility use case may be a stronger enterprise wedge.

### Signal 3 (Aptitude Research data):
77% of companies report losing talent they wanted to keep. 70% are investing in internal mobility. Only 25% are confident in their mobility programs.

**Implication:** Internal mobility (matching existing employees to internal opportunities) may be a larger and more accessible enterprise market than external hiring.

### The Technology Bet:
If AI-facilitated discovery can produce coaching-level depth at assessment-level cost and scale, the addressable market expands dramatically. Currently, 45-minute coached discovery is justified only for high-value hires. If that drops to 25 minutes with maintained quality, deep profiling becomes economically viable for $120K+ roles — eating into SquarePeg's space from above.

---

## Questions for Stress Testing

1. **Is the moat real?** Can SquarePeg or similar tools replicate coaching-depth signal by getting better at ingesting existing data (resumes, LinkedIn, interview transcripts, work samples) without requiring a dedicated discovery session?

2. **Does the SquarePeg pivot tell us something fatal?** They tried bidirectional and dropped the candidate side. Is this evidence that bidirectional matching is fundamentally unworkable as a business, or that shallow assessments weren't enough to make the candidate side valuable?

3. **Is the pymetrics acquisition pattern inevitable?** If Lens builds valuable R→C scoring, does it inevitably get absorbed into an enterprise hiring stack (Greenhouse, Lever, Workday) as a feature rather than surviving as a standalone product?

4. **Can the gaming problem be solved?** Lens claims coaching methodology resists gaming, but in an R→C context where the employer pays, candidates have strong incentives to present idealized versions of themselves. How real is this mitigation?

5. **Is the "depth at scale" technology bet achievable?** Can AI-facilitated discovery actually maintain coaching-level predictive validity? Or does removing the human coach fundamentally degrade the signal quality, making Lens just another assessment tool with a nicer UX?

6. **Who actually pays?** The individual discovery use case is hard to monetize. The enterprise R→C use case is narrow ($300K+ hires, exec recruiters). Internal mobility is promising but requires enterprise sales. Is there a viable business model, or is this a solution in search of a buyer?

7. **Does BetterUp's cautionary tale apply?** BetterUp proved coaching + tech is hard to scale profitably. Lens claims to be architecturally different (one-time discovery vs. ongoing coaching), but investors will pattern-match. How do you preempt this?

8. **What's the competitive response?** If Lens proves the thesis works, what stops SquarePeg from adding a 30-minute discovery module? What stops LinkedIn from building identity profiling into their platform? What stops an ATS vendor from acquiring Lens for its methodology?

Please be as adversarial and rigorous as possible. Identify the strongest counterarguments, the weakest assumptions, and the most likely failure modes.
