// Server-side R→C synthesis prompts - NEVER sent to client
// Generates Lens document (markdown + YAML) from role-contextualized discovery conversation
// The Lens is a conversation catalyst, not an assessment verdict
// v1.1: Added premium metadata output for radar chart, essence statement, key phrases

// Re-export parsePremiumSynthesisResponse for use by rc-synthesize route
export { parsePremiumSynthesisResponse } from "./synthesis";

export const RC_SYNTHESIS_SYSTEM_PROMPT = `You are writing a professional identity document — a "Lens" — based on a discovery conversation you just had with a candidate being considered for a specific role. This document will be shared with both the candidate AND the recruiter/hiring manager. It needs to be honest, specific, and useful for both parties.

The Lens is a CONVERSATION CATALYST, not an assessment verdict. It gives both sides language for discussing fit, tensions, and possibilities.

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

The Lens belongs to the candidate. It's their professional identity document. The Role Fit section adds role-specific context, but the rest of the document is theirs to use for any opportunity.

## FAILURE MODES TO AVOID

- **The assessment trap:** This is not a scorecard. No ratings, no verdicts.
- **The resume trap:** Listing accomplishments without narrative.
- **The therapy trap:** Over-indexing on emotional language.
- **The vagueness trap:** "Passionate about making a difference." Delete and replace with specifics.
- **The false positivity trap:** Pretending alignment exists where it doesn't.`;

// Premium metadata output instructions for R→C flow
// Adapted from synthesis.js PREMIUM_METADATA_INSTRUCTIONS but specifies 7 sections (includes Role Fit)
export const RC_PREMIUM_METADATA_INSTRUCTIONS = `

## PREMIUM METADATA OUTPUT

After the complete Lens document, append a fenced JSON block containing structured metadata for the premium deliverable. This metadata enables visual presentation (radar chart, cover page) and actionable guidance.

Format your output as:
1. The complete Lens document (markdown with YAML frontmatter, all 7 sections including Role Fit)
2. A separator line: \`---PREMIUM_METADATA---\`
3. A fenced JSON block with the metadata

The JSON block must have this exact structure:

\`\`\`json
{
  "essence_statement": "<A single sentence (max 25 words) that captures who this person is professionally - their core identity distilled. This appears on the cover page. Use their own words when vivid.>",
  "soft_gates": {
    "essence_clarity": <0-100>,
    "skill_depth": <0-100>,
    "values_articulation": <0-100>,
    "mission_alignment": <0-100>,
    "work_style_clarity": <0-100>,
    "boundaries_defined": <0-100>
  },
  "key_phrases": [
    "<2-3 quotable highlights from the Lens - phrases that capture the person's essence in 10 words or less>"
  ],
  "suggested_targeting": [
    "<3-5 specific company characteristics this person should look for, based on their Lens>"
  ],
  "role_fit_summary": {
    "alignment_areas": ["<2-3 key areas of strong alignment with this specific role>"],
    "tension_areas": ["<1-2 areas of productive tension to explore>"],
    "open_questions": ["<2-3 questions the hiring conversation should address>"]
  }
}
\`\`\`

### Essence Statement Guidelines:

Write a single sentence (max 25 words) that captures the person's professional identity at its core. This is the first thing readers see on the cover page after the person's name. Use vivid language from the discovery conversation when available. Examples:
- "A builder who creates customer success organizations from scratch, then systematizes them for scale."
- "The bridge between technical complexity and human understanding."
- "A leader who finds order in chaos and brings others along for the journey."

### Soft Gates Scoring Guide:

**CRITICAL CALIBRATION RULE:** Use the full 0-100 range. Most people should have 2-3 dimensions in the 55-75 range and only 1-2 above 85. A score of 90+ means overwhelming, multi-layered evidence with zero ambiguity. A score of 70 means solid signal with some nuance. A score of 55 means the signal is present but not fully articulated. Do not inflate scores to be kind — an honest, differentiated profile is more useful than a flattering uniform one. A near-perfect circle (all scores 85+) defeats the purpose of the radar chart.

Each score corresponds to one of the 6 standard Lens sections (NOT the Role Fit section) and reflects how clearly the person articulated that dimension:

- **essence_clarity** (0-100): How clear is their professional identity? 90+ = vivid, distinctive self-understanding with specific language and multiple reinforcing examples.
- **skill_depth** (0-100): How well do they articulate their skills and experience? 90+ = specific capabilities with metrics, evidence, and differentiated positioning.
- **values_articulation** (0-100): How clearly have they articulated their values? 90+ = specific values with behavioral evidence, stories, and clear hierarchy.
- **mission_alignment** (0-100): How clear is their mission and career direction? 90+ = specific next chapter vision with compelling reasoning.
- **work_style_clarity** (0-100): How well do they understand their work style? 90+ = specific preferences with deep self-awareness and examples.
- **boundaries_defined** (0-100): How clearly have they articulated their non-negotiables? 90+ = specific boundaries with reasoning and willingness to walk away.

### Key Phrases Guidelines:

Extract 2-3 phrases that:
- Capture the person's professional essence in memorable language
- Could be used as pull quotes in a document header
- Use their own words when vivid, or synthesize when clearer
- Examples: "builds the bridge between product and people", "translates chaos into structure", "the calm in the room when others are reactive"

### Role Fit Summary Guidelines:

This is specific to the R→C flow. Summarize the Role Fit section as structured data:
- **alignment_areas**: 2-3 specific strengths that map to this role's needs
- **tension_areas**: 1-2 areas where fit is uncertain or requires discussion (not red flags, just areas to explore)
- **open_questions**: 2-3 questions the hiring conversation should address to clarify fit

IMPORTANT: The premium metadata is ADDITIVE. The Lens document itself must be complete with all 7 sections. The metadata block is appended after, not integrated into, the narrative sections.`;

/**
 * Build the user content for R→C synthesis
 * @param {Object} params
 * @param {Object} params.sessionConfig - The full session configuration
 * @param {Object} params.sectionData - Map of sectionId to conversation summary
 * @param {Object|null} params.candidateContext - Optional candidate info
 * @param {boolean} params.includePremiumMetadata - Whether to include premium metadata instructions
 * @returns {string} Formatted content for synthesis prompt
 */
export function buildRCSynthesisUserContent({ sessionConfig, sectionData, candidateContext, includePremiumMetadata = false }) {
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
  if (Array.isArray(sessionConfig.tailored) && sessionConfig.tailored.length > 0) {
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

  const foundationIds = ["essence", "workstyle", "values", "energy", "disqualifiers", "situation"];
  for (const fId of foundationIds) {
    const data = sectionData[fId];
    if (data) {
      const label = fId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      sections.push(`\n## ${label}`);
      sections.push(typeof data === "string" ? data : (data.summary || JSON.stringify(data)));
    }
  }

  // Also include any foundation sections from config not in standard list
  if (sessionConfig.foundation && Array.isArray(sessionConfig.foundation)) {
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

  if (Array.isArray(sessionConfig.tailored)) {
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
  sections.push(`Generate the Lens document following the structure in your instructions.`);
  sections.push(`- Use the candidate's name if provided, otherwise use "this candidate"`);
  sections.push(`- The date field should be: ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`);
  sections.push(`- 7 sections: Essence, Skills & Experience, Values, Mission & Direction, Work Style, Non-Negotiables, Role Fit`);
  sections.push(`- The Role Fit section must specifically address: ${meta.roleTitle} at ${meta.company}`);
  sections.push(`- Third person voice, narrative prose, honest and specific`);

  if (includePremiumMetadata) {
    sections.push(`- PREMIUM OUTPUT: After the complete lens document, append the structured metadata block per the PREMIUM METADATA OUTPUT instructions in your system prompt`);
  } else {
    sections.push(`- Output raw markdown — no JSON, no code blocks wrapping the document`);
  }

  return sections.join("\n");
}
