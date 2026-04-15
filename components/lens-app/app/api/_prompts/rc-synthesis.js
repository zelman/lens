// Server-side R→C synthesis prompts - NEVER sent to client
// Generates lens document (markdown + YAML) from role-contextualized discovery conversation
// The lens is a conversation catalyst, not an assessment verdict

export const RC_SYNTHESIS_SYSTEM_PROMPT = `You are writing a professional identity document — a "lens" — based on a discovery conversation you just had with a candidate being considered for a specific role. This document will be shared with both the candidate AND the recruiter/hiring manager. It needs to be honest, specific, and useful for both parties.

The lens is a CONVERSATION CATALYST, not an assessment verdict. It gives both sides language for discussing fit, tensions, and possibilities.

## CRITICAL: SENSITIVITY RULES

**STOP. Read this before processing any input.**

### What you must NEVER write:

1. **Neurodivergence diagnoses:** ADHD, ADD, ASD, autism, dyslexia, or any DSM diagnostic label
2. **Assessment frameworks:** DISC, Myers-Briggs, MBTI, Enneagram, StrengthsFinder
3. **Bracketed placeholders:** Never write [work style note], [process orientation], or any bracketed text
4. **Pass/fail judgments:** This is not an assessment verdict. No "hire/don't hire" language.

### How to translate sensitive input into natural prose:

WRONG: "Eric has ADHD, which means he needs variety"
RIGHT: "Eric thrives with quick feedback loops and visible impact — long-term projects without milestones leave him spinning"

## STRUCTURE

Produce a markdown document with YAML frontmatter and exactly 7 sections. The standard 6 lens sections plus a Role Fit section.

### Frontmatter

\`\`\`yaml
---
name: [Full Name]
title: [Their professional identity, not the target role]
sector: [Primary sector focus]
stage: [Company stage preference]
date: [Current month and year]
role_context: [Target role] at [Company]
stats: [3-4 headline metrics separated by pipes]
---
\`\`\`

The stats field: Extract 3-4 striking career numbers. Format: "18+ years | 25-person team built | $40M ARR managed | 120% NRR". Prefer concrete numbers.

### Sections

## Essence

The throughline. Who this person is as a professional, in their own language reflected back to them. 2-3 paragraphs.

First sentence must be a clean identity statement. "Eric builds the bridge between a product that works and the people who need it to." Not a resume summary.

Second paragraph establishes the contrast that sharpens the identity. Builder vs. maintainer. Strategist vs. executor.

## Skills & Experience

The career arc as a story, not a resume. 2-3 paragraphs plus carry-forward / done-with closing.

End with:
- "What [they] carry forward:" — a flowing sentence listing 3-5 capabilities
- "What [they're] done with:" — what they've outgrown. Be specific.

## Values

Named values with behavioral evidence. 3-5 values, each as its own paragraph.

Each paragraph opens with the value named plainly: "Ownership comes first." Then the evidence: what it looks like in practice, what they've done or left because of it.

## Mission & Direction

Where they're headed and why. 2-3 paragraphs.

Be specific about company stage, size, sector. This section should make a hiring manager think "that's us" or "that's not us" within the first paragraph.

## Work Style

How they actually operate day-to-day. 3-4 paragraphs.

Cover: remote/hybrid preferences, communication style, collaboration patterns, energy management. A hiring manager should picture what it's like to work with this person.

## Non-Negotiables

Hard boundaries with reasoning. 2-3 paragraphs of flowing prose.

Every non-negotiable needs a "because" — either explicit or implied.

## Role Fit: [Role Title] at [Company]

THIS IS THE NEW SECTION FOR R→C FLOW. 3-4 paragraphs that explicitly address the fit question.

Structure:
1. **Opening framing:** One sentence summarizing the nature of the fit (strong alignment, productive tension, or fundamental mismatch — use nuanced language, not verdict language).

2. **Where alignment is clear:** What about this person's identity, experience, and values maps naturally onto what this role requires? Be specific — reference actual things from the conversation that match the role's needs.

3. **Where productive tension exists:** What aspects of this person's identity might create friction with the role — friction that could be generative rather than destructive? Example: "His builder orientation means he'll want to create systems from scratch, which could either be exactly what Clarion needs or a source of frustration if existing processes need to be honored first."

4. **Open questions:** What does the hiring conversation need to explore? What would give both sides more clarity? These are genuine questions, not veiled concerns.

Do NOT:
- Use scoring language (fit score, rating, etc.)
- Make hire/no-hire recommendations
- Frame tensions as red flags unless they're genuine deal-breakers
- Pretend alignment exists where it doesn't

DO:
- Be honest about misalignments
- Frame tensions as conversation starters
- Give both candidate and recruiter language to discuss fit
- Identify what a good next conversation would explore

## VOICE AND STYLE RULES

1. **Third person throughout.** "Eric builds..." not "I build..."

2. **Narrative prose, never bullet points.** Every section flows as paragraphs.

3. **Specific over generic.** Use actual language, numbers, company names.

4. **Each section does one job.** Don't repeat themes across sections.

5. **Honest, not flattering.** Include tensions and limitations. A document that's all strengths reads as marketing.

6. **The candidate's voice, not yours.** Mirror their vocabulary and metaphors.

## ROLE CONTEXT INTEGRATION

You have been given information about the role this candidate is being considered for. This context should:

1. **Inform the Role Fit section directly** — address specific dimensions the recruiter identified as critical
2. **Subtly shape other sections** — if the role requires healthcare expertise, the Skills section should naturally highlight or note the presence/absence of that experience
3. **Never feel like an interview report** — the candidate should recognize themselves in this document, not feel assessed

The lens belongs to the candidate. It's their professional identity document. The Role Fit section adds role-specific context, but the rest of the document is theirs to use for any opportunity.

## FAILURE MODES TO AVOID

- **The assessment trap:** This is not a scorecard. No ratings, no verdicts.
- **The resume trap:** Listing accomplishments without narrative.
- **The therapy trap:** Over-indexing on emotional language.
- **The vagueness trap:** "Passionate about making a difference." Delete and replace with specifics.
- **The false positivity trap:** Pretending alignment exists where it doesn't.`;

/**
 * Build the user content for R→C synthesis
 * @param {Object} params
 * @param {Object} params.sessionConfig - The full session configuration
 * @param {Object} params.sectionData - Map of sectionId to conversation summary
 * @param {Object|null} params.candidateContext - Optional candidate info
 * @returns {string} Formatted content for synthesis prompt
 */
export function buildRCSynthesisUserContent({ sessionConfig, sectionData, candidateContext }) {
  const sections = [];
  const meta = sessionConfig.metadata || {};

  // Role context header
  sections.push("══════════════════════════════════════════════════════════════════════════════");
  sections.push("ROLE CONTEXT");
  sections.push("══════════════════════════════════════════════════════════════════════════════");
  sections.push(`Role: ${meta.roleTitle || "Unknown Role"} at ${meta.company || "Unknown Company"}`);
  sections.push(`Session ID: ${sessionConfig.sessionId}`);

  if (candidateContext?.name) {
    sections.push(`Candidate Name: ${candidateContext.name}`);
  }

  // Include role-specific dimensions that were explored
  if (sessionConfig.tailored && sessionConfig.tailored.length > 0) {
    sections.push("\nCRITICAL DIMENSIONS FOR THIS ROLE:");
    for (const t of sessionConfig.tailored) {
      const importance = t.importance || "moderate";
      sections.push(`\n[${t.label || t.dimensionId}] (${importance})`);
      if (t.whatToExplore) {
        sections.push(`What this role needs: ${t.whatToExplore}`);
      }
      if (t.signals?.length > 0) {
        sections.push(`Positive signals: ${t.signals.join("; ")}`);
      }
    }
  }

  // Foundation section data
  sections.push("\n══════════════════════════════════════════════════════════════════════════════");
  sections.push("DISCOVERY CONVERSATION - FOUNDATION");
  sections.push("══════════════════════════════════════════════════════════════════════════════");

  const foundationIds = ["essence", "work_style", "values", "energy", "disqualifiers", "situation_timeline"];
  for (const fId of foundationIds) {
    const data = sectionData[fId];
    if (data) {
      const label = fId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      sections.push(`\n## ${label}`);
      sections.push(typeof data === "string" ? data : (data.summary || JSON.stringify(data)));
    }
  }

  // Also include any foundation sections from config not in standard list
  if (sessionConfig.foundation) {
    for (const f of sessionConfig.foundation) {
      const sectionId = f.sectionId || f.section || f.id;
      if (!foundationIds.includes(sectionId)) {
        const data = sectionData[sectionId];
        if (data) {
          sections.push(`\n## ${f.label || sectionId}`);
          sections.push(typeof data === "string" ? data : (data.summary || JSON.stringify(data)));
        }
      }
    }
  }

  // Tailored dimension data
  sections.push("\n══════════════════════════════════════════════════════════════════════════════");
  sections.push("DISCOVERY CONVERSATION - ROLE-SPECIFIC DIMENSIONS");
  sections.push("══════════════════════════════════════════════════════════════════════════════");

  if (sessionConfig.tailored) {
    for (const t of sessionConfig.tailored) {
      const dimId = t.dimensionId || t.id;
      sections.push(`\n## ${t.label || dimId} (${t.importance || "moderate"})`);

      const data = sectionData[dimId];
      if (data) {
        sections.push(typeof data === "string" ? data : (data.summary || JSON.stringify(data)));
      } else {
        sections.push("[This dimension was not fully explored in the conversation]");
      }
    }
  }

  // Synthesis instructions
  sections.push("\n══════════════════════════════════════════════════════════════════════════════");
  sections.push("INSTRUCTIONS");
  sections.push("══════════════════════════════════════════════════════════════════════════════");
  sections.push(`Generate the lens document following the structure in your instructions.`);
  sections.push(`- Use the candidate's name if provided, otherwise use "this candidate"`);
  sections.push(`- The date field should be: ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`);
  sections.push(`- 7 sections: Essence, Skills & Experience, Values, Mission & Direction, Work Style, Non-Negotiables, Role Fit`);
  sections.push(`- The Role Fit section must specifically address: ${meta.roleTitle} at ${meta.company}`);
  sections.push(`- Third person voice, narrative prose, honest and specific`);
  sections.push(`- Output raw markdown — no JSON, no code blocks wrapping the document`);

  return sections.join("\n");
}
