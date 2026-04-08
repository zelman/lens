# Lens Project — Competitive Landscape & Market Position
**Last updated: April 8, 2026**

---

## Executive Summary

The Lens Project operates in a market with well-funded competitors at every layer of the hiring stack — screening (SquarePeg), assessment (Pymetrics/Harver), coaching (BetterUp), and talent intelligence (Eightfold). None of them generate the signal Lens generates. The competitive moat is empirically validated: three independent AI systems reconstructed only ~43% of a Lens discovery artifact from standard career documents, with the largest gaps in the dimensions most predictive of job fit (values, energy, disqualifiers).

The strategic position that emerged from stress testing across three AI models and four competitor deep-dives: **Lens is a signal layer, not a platform.** It generates the coached identity signal that no screening tool, assessment instrument, or data inference engine can produce — then that signal feeds into whatever matching, evaluation, or placement process the buyer already uses.

The most validated buyer: **retained executive recruiters** placing $300K+ roles, where the cost of a mis-hire exceeds $1M and 45 minutes of discovery is trivial relative to existing diligence.

---

## The Market Map

### Where Lens Sits

The hiring intelligence market has four layers. Most competitors operate in one. Lens operates between all of them.

**Layer 1: Screening & Sourcing** (score candidates against roles from existing data)
- SquarePeg, Eightfold, LinkedIn Recruiter, Greenhouse, Lever
- Their input: resumes, LinkedIn, ATS history, behavioral exhaust
- Their output: ranked candidate lists, match scores
- Their limitation: they only work with data that already exists

**Layer 2: Assessment** (generate new candidate data through standardized instruments)
- DISC, StrengthsFinder, Myers-Briggs, CliftonStrengths
- Pymetrics (acquired by Harver) — gamified behavioral assessment
- Their input: candidate completes a fixed-format assessment
- Their output: trait scores, personality profiles
- Their limitation: self-report, gameable, systematically distorts identity (proven by signal test)

**Layer 3: Coaching & Development** (ongoing engagement to develop talent)
- BetterUp, Torch, CoachHub, Bravely
- Their input: ongoing 1:1 sessions
- Their output: development plans, behavioral change over time
- Their limitation: no portable artifact, no matching capability, unit economics don't scale

**Layer 4: Talent Intelligence** (infer workforce capabilities from aggregated data)
- Eightfold, Gloat, Beamery
- Their input: 1.6B+ career profiles, skills graphs, work activity data
- Their output: skills-based matching, internal mobility, workforce planning
- Their limitation: inference from behavioral exhaust, no discovery, no identity-level signal

**Lens occupies a unique position:** It generates new, high-quality signal through coached discovery (like Layer 2/3) but produces a structured, scoreable artifact that can feed into any Layer 1 or Layer 4 system. It's the signal source, not the matching engine.

---

## Competitor Profiles

### SquarePeg
**Status:** Active | **Threat:** Medium | **Tier:** Assessment & Matching
- **What they do:** AI candidate screening via ATS integration. Score, rank, and enrich applicant profiles.
- **Key facts:** Founded 2016, $6.6M raised, $2.8M revenue (2024), 17 people, bootstrapped until Feb 2025
- **Critical signal:** Started as a bidirectional matching marketplace (candidates take assessments, get matched to jobs). Pivoted to employer-side screening only. Dropped the candidate-facing experience.
- **What this means for Lens:** SquarePeg tried bidirectional with shallow assessments and retreated. Their pivot validates that the candidate side requires depth to sustain. SquarePeg does R→C screening with commodity data. Lens would do R→C with deep identity signal — different tier of hiring decision, not the same market.
- **Investor thesis (Thomas Otter, Acadian Ventures):** "Glassbox" explainability. Opportunities for $100M ARR businesses solving one part of recruitment well.

### Pymetrics (acquired by Harver)
**Status:** Acquired (Aug 2022) | **Threat:** Low | **Tier:** Assessment
- **What they did:** Neuroscience-based behavioral games measuring cognitive and emotional attributes. $56.6M raised.
- **Core insight:** Founder Frida Polli: "People are notoriously bad at knowing themselves and then reporting that in an accurate way." This is the Oh/Wang/Mount argument Lens builds on.
- **What happened:** Acquired by Harver, brand dissolved, methodology became a feature inside enterprise hiring stack (1,300+ customers, volume hiring focus).
- **What this means for Lens:** Assessment science gets absorbed into enterprise hiring stacks as a feature, not a product. Lens's defense: the user-owned artifact and coach network don't reduce cleanly to an enterprise feature. Also validates internal mobility as a use case (Pymetrics had talent mobility angle).

### BetterUp
**Status:** Active (struggling) | **Threat:** Low | **Tier:** Coaching Platform
- **What they do:** AI + human coaching for enterprise leadership development. $628M raised, peaked at $4.7B valuation.
- **The trouble:** 20%+ revenue miss, multiple layoff rounds, coach revolt over pay cuts, revolving C-suite, high user churn. Fundamental tension: positioned as SaaS but delivers coaching services.
- **What this means for Lens:** BetterUp is the cautionary tale investors will reference when they hear "coaching + AI." Lens must proactively differentiate: (1) Lens is discovery infrastructure, not ongoing coaching. (2) Value accrues in a single session producing a durable artifact. (3) Doesn't depend on enterprise L&D budgets. (4) Coach model is facilitated discovery (one-time), not therapeutic coaching (ongoing). BetterUp's coach revolt also validates James Pratt's insight: coaches need client demand generation, not workflow efficiency tools.

### Eightfold AI
**Status:** Active | **Threat:** Medium (strategically most important) | **Tier:** Talent Intelligence
- **What they do:** AI-native talent intelligence platform. Skills-based matching for hiring, internal mobility, workforce planning. 1.6B+ career profiles, "Digital Twin" employee profiles.
- **Key facts:** Founded 2016, $400M+ raised, $2.1B valuation, ~100M+ ARR, S&P Global and DOD as customers
- **Critical insight:** Eightfold owns the internal mobility space — the enterprise wedge that all three stress-test AIs identified as Lens's strongest path. Competing with them is not viable. But they have a fundamental blind spot: they only work with data that already exists. They infer identity from behavioral exhaust (email, Slack, project data). They cannot generate coached discovery signal.
- **What this means for Lens:** The strategic question is complement, not compete. A Lens discovery artifact fed into Eightfold's skills graph would be more predictive than either alone. This is the "signal layer" thesis in practice.
- **Also notable:** Co-founders launched Viven ($35M, Khosla), a digital twin startup for enterprise knowledge management. They're splitting attention.

### Jack & Jill
**Status:** Active | **Threat:** Low | **Tier:** Direct Competitor
- **What they do:** AI recruiting platform, $20M seed. Structured preference-based matching at recruiter-level intelligence.
- **What this means for Lens:** Wide but shallow. No coaching depth, no portable artifacts, no weighted scoring, no coach network. Lens's floor is coaching-level depth; J&J's ceiling is recruiter-level intelligence.

### Traditional Psychometrics (DISC, StrengthsFinder, Myers-Briggs)
**Status:** Active | **Threat:** Low but insidious
- **The signal test proved these actively mislead.** All three LLMs trusted the DISC Peacemaker profile over behavioral evidence, producing a systematically distorted identity portrait. DISC said "avoids conflict, prefers stability." Discovery said "requires candor, walked away from comfortable environments." The assessment doesn't just miss identity — it constructs a false version of it.

---

## The Signal Test: Empirical Evidence for the Moat

**Test design:** Three independent LLMs (ChatGPT, Gemini, Perplexity) given a resume + DISC assessment. Asked to build an 8-section identity profile. Outputs compared to actual Lens discovery artifact.

**Result: ~43% average signal overlap.** Discovery generates substantially new signal.

**Where documents succeed (~70-80% overlap):**
- Skills & Experience — resume content, reframed
- Situation & Context — career stage, largely inferable

**Where documents fail (~13-30% overlap):**
- Values — LLMs said "stability, reliability." Discovery said "ownership, candor."
- Energy — LLMs said "drained by conflict." Discovery said "drained by maintenance."
- Disqualifiers — LLMs missed entirely. No PE exclusion, no company size/funding caps, no salary floor reasoning.

**The DISC distortion:** Every LLM trusted the assessment instrument over the person. Gemini called the subject a "Loyal Second-in-Command" — the opposite of the discovery, which produced "builder who demands ownership." This is not a marginal error. It's a hiring recommendation that would place the candidate in the wrong role.

**The diagnostic vs. agency gap:** Every LLM framed limitations as weaknesses to manage. Discovery frames the same territory as boundaries the candidate has chosen. One produces a document for managing someone; the other produces a document for placing them correctly.

---

## Where Lens Fits: Three Market Positions

### Position 1: Diagnostic Layer for Executive Search (Primary — validating now)
**Buyer:** Retained executive recruiters placing $300K+ roles
**Value prop:** "Your candidates all look similar on paper. This diagnostic reveals who they actually are, justifies your placement fee, and reduces your failure rate."
**How it works:** Candidate completes discovery → recruiter receives identity artifact → uses it for differentiation, client briefing, and interview preparation
**Revenue model:** Per-candidate fee or per-search engagement
**Why it works here:** At this tier, 45 minutes is trivial, depth is obviously justified, the recruiter needs differentiation, and a mis-hire costs $1M+
**Validation status:** Beth Stewart intro active. Building cohort of 5-8 recruiter conversations.

### Position 2: Signal Layer for Enterprise Talent Intelligence (Future — after Position 1 validates)
**Buyer:** Enterprise HR/talent teams already using Eightfold, Gloat, or similar
**Value prop:** "Your talent intelligence platform only knows what people have done. We tell you who they are."
**How it works:** Employees complete discovery → identity artifacts feed into existing skills graph / matching engine → dramatically richer internal mobility matching
**Revenue model:** Enterprise seat license or per-discovery fee
**Why it works here:** Solves the 77% lost talent / 25% confidence gap (Aptitude Research). Eightfold can't generate this signal themselves.
**Validation status:** Thesis only. Requires Position 1 validation first, then targeted enterprise conversations.

### Position 3: Discovery Tool for Individuals via Coach Network (Ongoing — freemium wedge)
**Buyer:** Individual professionals (free tier), coaches (platform)
**Value prop:** "Understand your professional identity with coaching-level depth. Get a document that makes every job search tool work better for you."
**How it works:** Individual completes discovery → receives portable artifact → uses it for job search, interviews, career decisions. Coaches use Lens as their discovery tool → earn clients through the platform.
**Revenue model:** Free discovery (distribution), paid matching/monitoring subscription ($50/mo), coach platform fees
**Why it works here:** Builds the data flywheel, validates the methodology at scale, creates the coach network that differentiates from assessment tools
**Validation status:** Active tester cohort. Jared completed full flow. Feedback loop in progress.

---

## Strategic Principles (Updated April 8, 2026)

1. **Signal layer, not platform.** Lens generates the signal; others own the relationships and matching engines. This is the viable path given Eightfold and SquarePeg's positions.

2. **Exec recruiter first.** Clearest buyer with urgency, budget, and use case where depth is justified. Validate here before broadening.

3. **Portfolio depth is the moat.** Resume + DISC is the floor. The more material (LinkedIn, writing, 360, audio/video, coaching notes), the richer the artifact, the wider the gap from inference-based competitors.

4. **Discovery generates new signal — proven.** ~43% overlap between document-based reconstruction and discovery artifact. The moat is real and concentrated in the highest-value dimensions.

5. **Assessments actively mislead — proven.** DISC distortion demonstrated across three models. Use this as a concrete, demonstrable positioning claim.

6. **Agency, not diagnosis.** Lens frames boundaries as choices, not weaknesses. This produces different hiring decisions than assessment-based profiles.

7. **Complement the gorillas, don't fight them.** Eightfold for internal mobility, SquarePeg for volume screening, Greenhouse/Lever for ATS. Lens is the signal source that makes all of them better.

8. **Oh/Wang/Mount reframed honestly.** Self-report is the floor. Observer ratings are the ceiling. Facilitated discovery is the empirically untested middle ground. The SBIR research question is measuring how close it gets.

---

## Open Questions

1. **Does Beth Stewart's world actually want this?** The thesis is strong. The buyer validation is pending. 5-8 conversations will answer it.
2. **What's the recurring revenue model?** Artifact is one-time. Matching, monitoring, or enterprise seats must provide the subscription. Need a clear answer before investor conversations.
3. **Signal layer vs. standalone — does the architecture change?** If Lens is primarily a diagnostic feeding into other systems, the product surface area shrinks (no matching engine needed) but the integration surface area grows (APIs, data formats, partner relationships).
4. **Microsoft patent US20250378320A1** — potential prior art for "generative agent guided conversations for artifact completion." Filed before the provisional. Must read and distinguish for nonprovisional.
5. **Can the discovery hold up at scale without quality degradation?** The SBIR research question. If AI-facilitated discovery maintains coaching-level validity, the addressable market expands dramatically. If it degrades, the product remains a premium-tier tool dependent on human coaches.

---

*This document supersedes previous competitive analysis scattered across chat threads. It should be updated as validation conversations produce new signal.*
