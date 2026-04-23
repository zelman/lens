# NSF SBIR Project Pitch — DRAFT v1.0

**Suggested Topic Area:** AI (Artificial Intelligence) — subtopic AI1: Cognitive Science-based Technologies
**Alternate:** HC (Human-Computer Interaction)
**Company:** Zelman Labs LLC, Providence, RI (formed, EIN obtained, SAM.gov registration in process)
**PI:** Eric Zelman

---

## 1. The Technology Innovation
*(Up to 3,500 characters — current: ~3,480)*

The labor market's core matching infrastructure — resumes, keyword-parsed job descriptions, and applicant tracking systems — relies on surface-level lexical overlap to connect people with opportunities. Decades of industrial-organizational psychology research demonstrate that this approach systematically fails to capture the signals that predict fit and retention. Oh, Wang, and Mount (2011) showed in a meta-analysis of 44,000+ participants that observer-constructed personality profiles predict job performance significantly better than self-report instruments. This finding implies that extraction method matters — how professional identity is captured affects its predictive validity. Yet no commercial system has attempted to bridge the gap between standardized self-report instruments (DISC, MBTI, Plum) and true observer-grade assessment. Resumes remain self-reported, static, and optimized for keyword retrieval. The result: Aptitude Research (2024) found that 77% of employers report losing quality talent due to inadequate matching.

We are developing a system that replaces keyword matching with structured signal matching for career-opportunity fit assessment. The innovation has two components:

First, an AI-facilitated discovery process that produces a "lens document" — a structured, portable, machine-readable professional identity representation encoded in YAML frontmatter and markdown. Unlike standardized assessments, the lens captures weighted dimensions of professional identity (mission alignment, role fit, cultural orientation, skill transfer potential, work style, and energy patterns) through a guided conversational process grounded in executive coaching methodologies. The AI probes, reflects, and challenges — functioning as a structured interviewer informed by coaching frameworks, not a questionnaire. The research question is whether this coached conversational extraction produces professional representations with higher predictive validity than conventional self-report methods, approaching (though not replicating) the observer-grade advantage Oh, Wang, and Mount identified.

Second, a bidirectional scoring engine that evaluates fit from both sides of a potential hire. A candidate lens scores opportunities (candidate-to-role), and a role lens — encoding what a team actually needs through structured stakeholder alignment, beyond the job description — scores candidates (role-to-candidate). Each direction uses asymmetric dimensions with different weights, producing quantified fit assessments with dimension-level rationale.

This bidirectional approach is technically novel. The closest prior commercial attempt (SquarePeg, acquired 2022) attempted bidirectional psychometric matching using standardized self-report instruments and pivoted away. No existing system runs coached conversational discovery on both sides or produces a portable, candidate-owned structured identity document that functions as both a self-knowledge artifact and a machine-readable scoring input.

A provisional patent application (No. 64/015,187) covering the structured lens document format, the bidirectional scoring methodology, and the coach-AI discovery architecture was filed March 24, 2026.

---

## 2. The Technical Objectives and Challenges
*(Up to 3,500 characters — current: ~3,450)*

The Phase I project would establish scientific and technical feasibility of the core hypothesis: that AI-facilitated coached conversational discovery produces professional representations with higher predictive validity for job-fit than conventional self-report methods (resumes, standardized assessment instruments). This is inspired by the Oh, Wang, and Mount (2011) finding that observer ratings outperform self-report — but we are explicit that AI-facilitated discovery is not observer-grade assessment. The research question is how close it gets, and whether the gap it closes relative to standardized instruments is commercially significant.

**Objective 1: Quantify signal extraction quality from coached AI discovery vs. baseline methods.**
The fundamental technical risk is whether an AI-guided coaching-informed conversational process can extract professional identity signals with sufficient depth and accuracy to outperform resumes and standardized assessments for fit prediction. We will conduct a controlled study comparing lens documents generated through (a) AI-only discovery with coaching-informed prompts, (b) coach-facilitated AI discovery (human coach guiding the AI process), and (c) resume + standardized assessment baseline across a cohort of mid-career professionals. Signal quality will be measured by inter-rater reliability of the extracted dimensions, coverage of the six-dimension schema, and presence of fit-critical signals that resumes and assessments systematically omit (cultural misalignment, energy drains, values conflicts, stakeholder alignment gaps).

**Objective 2: Validate bidirectional scoring accuracy against expert human judgment.**
The second technical risk is whether the structured scoring engine produces fit assessments that align with expert evaluations. We will generate candidate-to-role and role-to-candidate scores for real professional-opportunity pairs where hiring outcomes are known, then measure concordance between the system's dimensional scores and retrospective assessments from hiring managers, executive recruiters, and candidates. Ground truth in hiring is noisy — we will use both successful placements and acknowledged mismatches to calibrate scoring thresholds and dimension weights. Early validation with a retired Goldman Sachs Partner (30 years in Human Capital Management) confirmed that this depth of discovery is justified for high-stakes placements ($300K+/board-level) where mis-hire costs are catastrophic.

**Objective 3: Determine minimum viable discovery depth for scoring reliability.**
A critical design question for commercial viability is how much conversational discovery is required before a lens document produces reliable scores. Too little yields a glorified questionnaire; too much creates adoption barriers. We will systematically vary discovery session length and measure the point at which additional conversation stops materially improving scoring accuracy — the feasibility threshold. This establishes the technical boundary between what can be automated (self-serve) and what requires human coaching facilitation, directly informing the product's scalability architecture and pricing model (per-search vs. subscription).

---

## 3. The Market Opportunity
*(Up to 1,750 characters — current: ~1,740)*

The global talent acquisition technology market exceeds $35 billion annually. Our primary entry market is executive search software and assessment ($4.8B), targeting retained boutiques conducting 20–60 C-suite searches per year at $150–250K average fees. At the $300K+ placement tier, a failed hire costs $1M+ in lost execution, team disruption, and restarted search — making structured discovery economically justified at $2–5K per search.

Validation conversations with senior hiring leaders confirm: the pain at this tier is stakeholder misalignment (partners disagreeing on what a search requires), not candidate filtering. Existing tools — ATS platforms (keyword matching), standardized assessments (Plum, DISC), and emerging AI career tools (Jack & Jill, Torre.ai) — address filtering but not alignment. No product operates at the intersection of structured stakeholder alignment, coached identity discovery, and bidirectional scoring.

The secondary enterprise wedge is internal mobility. Approximately 70% of organizations are investing in mobility tools, but only 25% are confident their approach works (Aptitude Research, 2024). Existing platforms (Gloat, Fuel50, Eightfold AI) match on skills taxonomy only — no identity signals (values, energy, work style). Our system adds the identity layer these platforms lack, with lower gaming risk because the employee is intrinsically motivated.

The consumer application (AI-facilitated lens generation + automated opportunity scoring at $50/month) serves as the methodology demonstration and individual entry point. The coaching industry ($20B+ globally, 167K active coaches) represents a quality channel — coach-facilitated lenses produce measurably richer signal than self-serve, creating a natural premium tier.

---

## 4. The Company and Team
*(Up to 1,750 characters — current: ~1,730)*

Zelman Labs LLC is an early-stage technology company based in Providence, Rhode Island, developing AI-powered tools for professional identity representation and career-opportunity matching. The company was formed in 2026 with a provisional patent filing and working prototype.

Eric Zelman, founder and proposed PI, brings 18 years of customer success and support operations leadership in B2B SaaS, most recently as VP at Bigtincan (acquired by Vector Capital, merged into Showpad). His experience building and scaling post-sale organizations from zero — managing retention economics, team culture, and hiring decisions — directly informs the product thesis that identity signals predict retention better than credentials. He holds a Post Graduate Program in Cloud Computing from UT Austin (2026).

The working proof-of-concept includes: an AI discovery engine with coaching-informed guardrails (live, deployed on Vercel), candidate-to-role and role-to-candidate scorers (operational), a bidirectional matching specification, and a serverless proxy architecture securing API integrations. An active tester cohort has completed the full discovery flow and provided structured feedback driving three product iterations.

Validation conversations include a retired Goldman Sachs Partner (30 years HCM, COO, CDO) who confirmed the enterprise thesis and identified executive recruiters as the primary buyer. The thesis has been independently stress-tested by four AI models across two prompt versions, producing eight confirmed strategic pivots that have been incorporated into product positioning. The discovery architecture encodes executive coaching methodologies (identity mapping, values elicitation, behavioral evidence frameworks) into structured AI conversational protocols, grounding the system in validated practice rather than unconstrained generative AI.

---

*DRAFT v1.0 — not for submission. Character counts are approximate. Changes from v0.3: Oh/Wang/Mount reframed as inspiration (not "operationalized finding"); research question made explicit ("how close does coached discovery get to observer-grade?"); market section updated to exec search primary entry ($4.8B SAM, per-search pricing); Edie Hunt validation cited; stress test cited; company status updated (LLC formed, SAM.gov in process); competitive landscape updated (Plum, Torre.ai, Jack & Jill named); role lens / stakeholder alignment concept added. Remaining review items: (1) whether the reframed research question is stronger or weaker for NSF reviewers, (2) whether citing the stress test adds credibility or looks unusual, (3) PI background for non-traditional researcher.*
