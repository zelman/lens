# Lens Project — Pressure Test Round 2

*Building on validated findings from Round 1 (Gemini, ChatGPT, Perplexity). These prompts go deeper on the specific risks, opportunities, and open questions that emerged.*

---

## 1. The SquarePeg Autopsy — Why Did Bidirectional Fit Matching Fail?

> A startup called SquarePeg (founded 2016, NYC) built exactly what most people say should exist: a psychometric-driven matching platform that assessed both candidates and employers on personality traits, values, environment fit, and work style using I/O psychology — 19 validated workplace personality constructs. They had Fortune 100 clients. They had a Chief Science Officer from academia. They measured both sides and matched algorithmically.
>
> They've since pivoted to AI-powered resume screening — essentially abandoning the fit-matching thesis in favor of speed and efficiency.
>
> **My question:** Why did this approach fail to gain traction? Specifically: (1) Was the problem that self-report assessments produce data too shallow to predict real-world fit? (2) Was it that employers refused to do the introspective work required to build honest company/team profiles? (3) Was the marketplace chicken-and-egg problem insurmountable — not enough employers to attract candidates, not enough candidates to attract employers? (4) Was ROI unprovable in terms that TA leaders and CFOs recognized? (5) Or was the market simply not ready in 2016-2019 for this kind of product, and might conditions have changed now that AI has normalized deeper human-machine interaction? Analyze each failure mode and assess which ones a coaching-facilitated discovery approach (vs. self-report surveys) would actually solve, and which ones would persist regardless of method.

---

## 2. The Data Quality Problem — Self-Report vs. Coached Discovery

> Pymetrics' founder Frida Polli stated that "people are notoriously bad at knowing themselves and then reporting that in an accurate way." Pymetrics addressed this by using neuroscience-based games instead of questionnaires. But games measure cognitive and behavioral traits — they don't surface values, energy patterns, dealbreakers, or what someone actually needs to thrive in a specific seat.
>
> I'm proposing a third path: AI-guided coaching conversations that follow threads, surface what people can't self-report, and produce a structured, machine-readable artifact (a "lens document") as the output.
>
> **My question:** What does the research say about the comparative validity of these three data collection methods for predicting job fit and retention? (1) Self-report surveys/assessments (DISC, Big Five, SquarePeg-style instruments), (2) Behavioral/cognitive games (Pymetrics, gamified assessments), (3) Structured conversational elicitation (coaching, structured interviews, AI-guided discovery). Specifically, I want to know: which method produces the deepest signal about values and work-style fit (not just cognitive traits)? Which is hardest to game or perform for? Which produces data that hiring managers actually trust and use in decisions? And is there any precedent — academic or commercial — for AI-conducted structured interviews or coaching conversations being used as assessment inputs?

---

## 3. Internal Mobility as the Enterprise Wedge

> Three independent AI research responses flagged internal mobility as potentially more tractable than external hiring for a "deep fit" product. The logic: you already have the employee (no cold-start problem), you already have the team/role context, the stakes are lower (a bad internal move is recoverable), and the pain is well-articulated by HR leaders ("we're losing great people because we can't help them find the right internal role").
>
> Platforms like Gloat, Fuel50, and the internal mobility features of Workday, SAP SuccessFactors, and ServiceNow already play in this space — but they match on skills and experience, not on identity, values, energy, or work-style fit.
>
> **My question:** Map the internal talent mobility market as of 2026. Who are the key players (Gloat, Fuel50, Eightfold AI, Phenom, iMocha, others)? What do they actually match on — skills taxonomy only, or something deeper? What are their known limitations? Is there published evidence that skills-only matching leads to failed internal moves or low engagement in new roles? And most importantly: is there an open lane for a product that adds an "identity layer" — values, energy, work style, dealbreakers — on top of the existing skills infrastructure? Would enterprise buyers pay for that, or would they see it as redundant to their existing mobility tools?

---

## 4. The Employer Self-Assessment Problem — Can Companies Be Honest?

> The biggest structural barrier to bidirectional matching isn't candidate-side — it's employer-side. Companies are notoriously bad at describing their own culture beyond platitudes. Deep, candid team profiles might expose unflattering truths (high conflict, political dynamics, low stability) that legal and communications teams resist codifying. Multiple research sources flagged this as the primary reason bidirectional matching has never scaled.
>
> I'm designing a "role lens" — a structured profile of what it's actually like to sit in a specific seat on a specific team — that can be built through AI-guided discovery with the hiring manager, not through a company-wide culture survey.
>
> **My question:** What approaches have been tried to capture honest, structured data about team culture, management style, and role reality at the team level (not company level)? Consider: Glassdoor and Blind (anonymous employee reviews), culture assessment tools (Culture Amp, Lattice, 15Five), exit interview analysis, manager 360s, and any academic research on measuring "person-environment fit" from the environment side. What works? What doesn't? Is there evidence that team-level data (my direct manager's style, this team's operating cadence, this role's actual autonomy level) is more predictive of fit than company-level data (our values are innovation and collaboration)? And what's the lightest-weight, least politically threatening way to capture this data from a hiring manager during a normal req-creation or intake process?

---

## 5. Proving the Lens Changes Decisions — What Would "Weak Signal" Look Like?

> The hardest thing to prove early is that a lens document actually changes hiring outcomes. Full predictive validity (did the person thrive 18 months later?) takes years to establish. I need proxy signals that I can measure in weeks or months.
>
> **My question:** In the history of hiring assessment tools — from structured interviews to psychometric tests to AI-based screening — what proxy metrics were used early on to demonstrate value before long-term outcome data was available? I'm looking for precedents: what did Pymetrics, Hogan, SHL, or Criteria Corp measure in their first 1-2 years to convince buyers the tool worked? Consider: interview-to-offer conversion rates, time-to-productivity, manager satisfaction at 30/60/90 days, candidate withdrawal rates, offer acceptance rates, early attrition (0-6 months), interviewer confidence scores, or anything else. Which of these proxy signals is most credible to enterprise HR buyers, and which can be collected with the smallest sample size? I need to design a measurement framework that works with 10-50 users, not 10,000.

---

## 6. The Coaching-to-Artifact Bridge — Is There Academic Precedent?

> My core thesis is that coaching produces measurable ROI when it generates a functional artifact — a structured document that governs downstream decisions. Standalone coaching struggles to demonstrate ROI because the outcomes are subjective and ephemeral. A lens document makes coaching outcomes concrete: it becomes the input to a scoring system, a matching engine, an interview prep tool.
>
> **My question:** Is there academic or commercial precedent for this specific bridge — coaching or structured self-discovery that produces a reusable, machine-readable artifact which then powers automated decisions? Consider: career development plans that feed into talent management systems, leadership assessments that inform succession planning, Individual Development Plans (IDPs) in enterprise HR, or any research on "coaching artifacts" and their downstream utility. Also consider the reverse: are there studies showing that coaching outcomes improve when the output is a concrete deliverable versus when coaching is purely conversational? I'm looking for evidence that the artifact itself changes the value proposition of coaching — not just that coaching is good, but that coaching-plus-artifact is categorically different.

---

## 7. The "Why Now" Question — What Changed in 2024-2026?

> If this problem has existed for decades, why would a solution work now when it didn't before? SquarePeg tried in 2016. Pymetrics launched in 2013 (acquired 2022). The psychometric assessment industry has been around since the 1960s. What's different about the 2024-2026 moment?
>
> **My question:** What structural, technological, or behavioral shifts have occurred in the last 2-3 years that make a coaching-depth, AI-facilitated career identity product more viable now than it would have been in 2018? Consider: (1) LLM capabilities making coached conversation possible without a human coach, (2) the Great Resignation / Great Reshuffle normalizing career introspection, (3) remote work making culture-fit harder to assess through traditional means, (4) the AI hype cycle making buyers receptive to AI-guided discovery, (5) the failure of pure speed-optimization tools (job boards, AI resume writers) to reduce mis-hire rates, (6) Gen Z workforce expectations around values alignment and psychological safety, (7) the rise of internal mobility as a retention strategy. Which of these shifts are real and durable versus hype? And which ones most directly create demand for the specific product I'm building?

---

*Patent Pending — App #64/015,187 — Confidential*
