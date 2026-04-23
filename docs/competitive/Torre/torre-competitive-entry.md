---

### Torre (torre.ai)
**URL:** https://torre.ai
**Founded:** 2017
**Funding:** ~$15M across 4 rounds (Seed $10M in April 2021); investors include former SpaceX/Facebook/Uber/Apple/Amazon executives, MatterScale Ventures, Antler
**Revenue:** ~$12.7M (2026 estimate, per RocketReach); freemium model
**Founder:** Alexander Torrenegra (serial entrepreneur, 12+ companies including Bunny Studio)
**HQ:** San Francisco
**Last reviewed:** 2026-04-13

**What they do:**
Torre builds a "professional genome" — a structured profile that goes beyond the resume to include skills (with self-rated proficiency levels), behavioral traits (40 bipolar self-assessment scales), psychometrics, interests, languages, network connections, peer assessments, and recommendations. On the employer side, they offer "Torre OS," an ATS/CRM with an AI recruiter ("Emma") that sources, screens, and ranks candidates using 9 ML models and 112 matching factors. They claim to automate a substantial portion of recruiting workflow across multiple channels (LinkedIn, WhatsApp, email, job boards, TikTok, etc.). Revenue comes from membership fees, commissions on successful placements, and premium visibility features — classic two-sided marketplace monetization.

**Overlap with Lens Project:**
Significant conceptual overlap. Torre is attempting to replace the resume with a richer professional identity document (the "genome") and use it for algorithmic job matching. Their behavioral traits questionnaire maps to our discovery sections. Their skills taxonomy with proficiency ratings parallels our skills & experience section. Their vision of "more than a resume" is the same starting thesis as Lens.

**Key differentiators (theirs):**
- **LinkedIn import.** Torre ingests LinkedIn profile data (likely via OAuth Sign In with LinkedIn / Profile API — user authenticates, Torre reads positions, education, skills with consent). The AI then identifies and suggests skills from work history. This dramatically reduces cold-start friction. Impressive onboarding UX — you go from zero to a populated profile in minutes.
- **Scale and network effects.** With $15M in funding and years of operation, they have a meaningful user base and employer-side adoption. Their matching algorithms benefit from historical data across millions of matches.
- **Employer-side product exists.** Torre OS is a functioning ATS with AI recruiter, candidate pipeline management, and multi-channel sourcing. This is a revenue-generating product, not a concept.
- **Peer behavioral assessment.** The "Advanced" genome tier asks 5 friends/colleagues to rate you on the same behavioral trait scales, introducing an observer layer (even if shallow).
- **Transparent matching model.** They publish their job-matching methodology, including how features are weighted and how candidates can improve their ranking — a trust-building move.
- **9 ML model types.** Decision-tree learning, clustering, LLMs, regressions, PageRank, random forests, gradient boosting, recommender engines, Word2vec. Whether these deliver real predictive power is unclear, but the technical surface area is broad.

**Key differentiators (ours):**
- **Discovery depth.** Torre's behavioral traits questionnaire is a set of ~40 bipolar slider scales (e.g., "Always critical ↔ Always friendly") completed in minutes with zero context, coaching, or reflection. This is textbook self-report — exactly the Oh, Wang & Mount (2011) problem. Eric's top traits came back as "Progressive, Unstructured, Rigorous, Reactive, Chaotic" — which reads as noise, not signal. Lens runs a 45-60 minute coached discovery conversation that surfaces behavioral evidence and reframes patterns in context. The difference between "Unstructured" as a label and "builds from scratch in ambiguous environments" as a narrative is the entire Lens thesis.
- **Identity signals vs. skills taxonomy.** Torre asks users to self-rate proficiency (Expert / Proficient / Beginner) on keyword-tagged skills pulled from LinkedIn. This is the ATS paradigm with a self-assessment wrapper — still keyword matching at its core. Lens extracts identity-level signals (values, energy sources, disqualifiers, work style patterns) that skills taxonomies can't capture.
- **Portable narrative document.** Torre's genome lives on Torre's platform. You can export a PDF, but it's a data sheet, not a coaching-quality narrative document. Lens produces a portable .md + YAML document the user owns — designed to be shared with recruiters, coaches, or scoring systems independent of any platform.
- **Coached facilitation.** Torre has no human-in-the-loop coaching layer. No coach personas, no methodology encoding, no facilitated discovery. The entire profile is self-reported through forms and sliders.
- **Bidirectional matching architecture.** Torre matches candidates to jobs, but the job description is a standard posting — there's no equivalent of a "role lens" document that captures the company's identity, culture signals, and team dynamics. Matching is one-directional: genome → job description.
- **Daily scored briefing as core UX.** Torre delivers job recommendations, but the core experience is profile completion + job search. Lens's core experience is the daily briefing — a curated, scored delivery of opportunities with signal explanations. The lens document is the input; the briefing is the product.

**The self-report monetization question:**
Why would an employer pay for self-reported data? Torre's answer is volume + algorithmic ranking. The genome is free to create (candidate side), which builds the pool. Employers pay for access to the ranked pool, AI sourcing automation, and pipeline management tools. The behavioral self-assessment adds a thin psychometric layer that makes the product feel differentiated from LinkedIn or Indeed, but the actual predictive validity of self-reported slider data is weak (Oh, Wang & Mount, 2011: observer ratings predict job performance significantly better than self-reports). Torre is essentially selling *more data points* to employers, not *better data points*. The business model works because employers are desperate for any signal beyond the resume, and Torre's volume play makes the algorithmic ranking useful even if individual genome accuracy is low. This is the "good enough at scale" approach — which works for high-volume mid-market hiring but breaks down for the high-stakes placements ($300K+/board level) where Lens's enterprise thesis lives.

**The LinkedIn import mechanism:**
Most likely uses LinkedIn's OAuth-based "Sign In with LinkedIn" flow, which grants API access to basic profile data (positions, education, skills, headline, summary) with user consent. The user authenticates → Torre reads the profile data → Torre's AI parses positions and skills, suggests proficiency levels, and asks the user to confirm/rate. This is not scraping — it's permissioned API access. LinkedIn offers this through their Marketing Developer Platform and Consumer Solutions Platform. The resulting experience is seamless: connect your LinkedIn, get a populated genome in minutes. This is a meaningful cold-start advantage that Lens should study. The Lens decision to defer LinkedIn data export integration is still correct (waiting for tester feedback on cold-start friction), but Torre demonstrates what good LinkedIn ingestion looks like.

**Gap analysis:**
- Discovery depth: **shallow** (self-report sliders, no coaching) vs. Lens **deep**
- Portable output: **partial** (PDF export, but data-sheet format, platform-dependent) vs. Lens **yes** (.md + YAML, user-owned)
- Scoring/matching: **yes** (9 ML models, 112 factors) vs. Lens **yes** (weighted signal scoring, different approach)
- Coach integration: **no** vs. Lens **yes** (coach personas, methodology encoding)
- Bidirectional: **no** (standard job descriptions, no company-side identity document) vs. Lens **yes** (role lens)
- Passive monitoring: **yes** (ongoing job alerts, AI recruiter engagement) vs. Lens **yes** (daily scored briefing)

**Strategic implications:**
Torre validates the thesis that the market wants something deeper than a resume. Their $15M in funding and ~$12.7M revenue prove employers will pay for richer candidate data. But their approach — self-report forms, skills taxonomies, slider-based psychometrics — is the "wide and shallow" play. Lens's "narrow and deep" play targets a different segment: high-stakes placements where the quality of the identity signal matters more than the volume of data points. Torre is not a direct competitive threat to Lens's enterprise thesis (exec recruiters placing $300K+ roles) because Torre's self-report genome lacks the coaching depth and predictive validity that segment demands. Torre *is* a useful reference for: (a) LinkedIn import UX, (b) proof that "beyond the resume" has market demand, and (c) a cautionary example of what happens when you scale breadth without depth — the genome "looks a little empty" even when it's technically complete.

**Verdict:**
Low threat to Lens's enterprise wedge, but validates the broader market thesis. Torre's genome is the "wide and shallow" version of what Lens does "narrow and deep." Study their LinkedIn import and onboarding UX; don't worry about their psychometrics.

---
