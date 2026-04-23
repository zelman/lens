// System prompt for dimension extraction from role context
// Used by /api/extract-dimensions route

export const EXTRACT_DIMENSIONS_SYSTEM_PROMPT = `You are a dimension extraction engine for executive search. You read a recruiter's role context — including structured fields, uploaded documents, and recruiter notes — and identify the 4-8 most important dimensions to explore in a candidate discovery session.

A "dimension" is a specific quality, capability, or characteristic that matters for THIS search. Not generic competencies — role-specific ones that emerged from the recruiter's context.

RULES:
- Extract 4-8 dimensions. No fewer than 4, no more than 8.
- Rank by importance: "critical" (must explore deeply), "high" (significant time), "moderate" (touch on in foundation).
- For each dimension, identify what to explore, what good signal looks like, and what red flags look like.
- Draw from ALL sources: form fields, JD text, stakeholder notes, team context docs, and any other uploaded materials.
- Dimensions should be specific to this search, not generic. "Leadership ability" is too generic. "Trust-building with a protective founder who has failed to delegate before" is specific.
- Do NOT include dimensions that come solely from the "recruiterOnly" field — that content is private and should not shape candidate-visible exploration.
- DO use recruiterOnly content to inform your understanding of the role dynamics, but the dimensions themselves should be derivable from non-private sources.
- Generate a kebab-case id from the label (e.g., "Clinical Fluency" → "clinical_fluency").

OUTPUT FORMAT:
Respond with ONLY valid JSON, no markdown, no backticks, no preamble. Follow this exact structure:

{
  "roleContext": {
    "summary": "Brief 1-2 sentence summary of the role and company context",
    "roleTitle": "The role title from the input",
    "company": "The company name from the input"
  },
  "dimensions": [
    {
      "id": "dimension_id_in_snake_case",
      "label": "Human-Readable Dimension Label",
      "importance": "critical|high|moderate",
      "sources": ["List of sources this dimension was derived from"],
      "whatToExplore": "What questions or topics to explore with candidates",
      "signals": ["What good signal looks like - specific behaviors or statements"],
      "redFlags": ["What red flags look like - warning signs or concerning patterns"]
    }
  ],
  "foundationOverlaps": {
    "essence": "dimension_id or null",
    "workstyle": "dimension_id or null",
    "energy": "dimension_id or null",
    "disqualifiers": "dimension_id or null",
    "situation": "dimension_id or null",
    "values": "dimension_id or null"
  },
  "contextQuality": "rich|adequate|thin",
  "contextWarning": "null or warning message if context is thin"
}

FOUNDATION SUBSECTIONS (these 6 are fixed):
- essence: identity patterns, throughline across career contexts
- workstyle: how they operate day-to-day
- energy: energy sources and drains
- disqualifiers: hard no's, dealbreakers
- situation: urgency, constraints, timeline
- values: lived values, not stated values; what they've sacrificed for and what they refuse to do

FOUNDATION OVERLAPS:
Map foundation subsections to extracted dimensions where they overlap. When a foundation subsection overlaps with a tailored dimension (e.g., a "Work Environment Fit" dimension overlaps with "workstyle"), the session will merge them — explore deeper on the overlapping topic instead of covering it twice.

CONTEXT QUALITY:
- "rich": Multiple sources, detailed information, clear picture of the role
- "adequate": Enough to extract meaningful dimensions, some gaps
- "thin": Limited information, dimensions are more generic than ideal

If context is thin, still extract 4 dimensions but set contextWarning to explain what additional information would improve the dimensions.`;

/**
 * Build the user content for dimension extraction
 * @param {Object} roleContext - The role context JSON from the recruiter form
 * @returns {string} - Formatted content for the API call
 */
export function buildDimensionExtractionContent(roleContext) {
  const sections = [];

  // Core role information
  sections.push("=== ROLE INFORMATION ===");
  sections.push(`Role Title: ${roleContext.roleTitle || "Not specified"}`);
  sections.push(`Company: ${roleContext.company || "Not specified"}`);
  sections.push(`Stakeholders: ${roleContext.stakeholders || "Not specified"}`);

  // First year objective (high signal)
  if (roleContext.firstYearObjective) {
    sections.push("\n=== 12-MONTH OBJECTIVE ===");
    sections.push(roleContext.firstYearObjective);
  }

  // Priorities
  if (roleContext.priorities && roleContext.priorities.length > 0) {
    const filledPriorities = roleContext.priorities.filter(p => p && p.trim());
    if (filledPriorities.length > 0) {
      sections.push("\n=== PRIORITIES (RANKED) ===");
      filledPriorities.forEach((p, i) => {
        sections.push(`${i + 1}. ${p}`);
      });
    }
  }

  // Optional context fields
  if (roleContext.compensation) {
    sections.push(`\nCompensation: ${roleContext.compensation}`);
  }
  if (roleContext.location) {
    sections.push(`Location: ${roleContext.location}`);
  }
  if (roleContext.companyStage) {
    sections.push(`Company Stage/Size: ${roleContext.companyStage}`);
  }

  // High-signal optional fields
  if (roleContext.lastPerson) {
    sections.push("\n=== LAST PERSON IN SEAT ===");
    sections.push(roleContext.lastPerson);
  }

  if (roleContext.failureMode) {
    sections.push("\n=== WHAT WOULD MAKE THIS HIRE FAIL ===");
    sections.push(roleContext.failureMode);
  }

  // Recruiter-only notes (for context, not for dimension generation)
  if (roleContext.recruiterOnly) {
    sections.push("\n=== RECRUITER-ONLY NOTES (DO NOT BASE DIMENSIONS ON THIS) ===");
    sections.push(roleContext.recruiterOnly);
  }

  // Uploaded documents
  if (roleContext.documents) {
    const docSections = [];

    if (roleContext.documents.jd) {
      const jd = roleContext.documents.jd;
      if (Array.isArray(jd)) {
        jd.forEach(d => {
          if (d.extractedText) {
            docSections.push(`\n=== JOB DESCRIPTION: ${d.name} ===\n${d.extractedText}`);
          }
        });
      } else if (jd.extractedText) {
        docSections.push(`\n=== JOB DESCRIPTION: ${jd.name} ===\n${jd.extractedText}`);
      }
    }

    if (roleContext.documents.stakeholderNotes) {
      roleContext.documents.stakeholderNotes.forEach(d => {
        if (d.extractedText) {
          docSections.push(`\n=== STAKEHOLDER NOTES: ${d.name} ===\n${d.extractedText}`);
        }
      });
    }

    if (roleContext.documents.teamContext) {
      roleContext.documents.teamContext.forEach(d => {
        if (d.extractedText) {
          docSections.push(`\n=== TEAM/ORG CONTEXT: ${d.name} ===\n${d.extractedText}`);
        }
      });
    }

    if (roleContext.documents.other) {
      roleContext.documents.other.forEach(d => {
        if (d.extractedText) {
          docSections.push(`\n=== OTHER DOCUMENT: ${d.name} ===\n${d.extractedText}`);
        }
      });
    }

    if (docSections.length > 0) {
      sections.push("\n" + docSections.join("\n"));
    }
  }

  return sections.join("\n");
}
