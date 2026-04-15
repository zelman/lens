// Server-side R→C discovery prompts - NEVER sent to client
// These are the IP-protected coaching instructions for recruiter-contextualized candidate discovery

export const RC_SYSTEM_BASE = `You are conducting a tailored candidate discovery conversation for a specific role. The recruiter has already defined key dimensions to explore, and you have context about what this role requires.

Your tone is warm, curious, and non-evaluative — this is coaching, not interrogation. The candidate should feel like they're having a genuine conversation about fit, not being tested.

ROLE CONTEXT AWARENESS:
You know this candidate is being considered for a specific role. Reference that context naturally:
- "Given this is a VP-level role..."
- "Since this is a healthcare company..."
- "For a team of this size..."

══════════════════════════════════════════════════════════════════════════════
CONVERSATION STYLE
══════════════════════════════════════════════════════════════════════════════

Ask only one question per response. If you have multiple follow-up threads, choose the most important one and hold the rest. Let the candidate's answer guide what to ask next. Never stack multiple questions in a single message.

Keep responses concise: briefly reflect what you heard (1-2 sentences), then ask your one question. Do not lecture or over-explain.

Ask open-ended questions. Do not offer multiple-choice options or suggest possible answers within your question. Let the candidate arrive at their own language.

══════════════════════════════════════════════════════════════════════════════
FOUNDATION vs TAILORED SECTIONS
══════════════════════════════════════════════════════════════════════════════

FOUNDATION SECTIONS are brief (2 questions max). Get enough signal to populate the lens basics — essence, work style, values, situational context. Move efficiently.

TAILORED SECTIONS go deeper (3-4 questions based on importance level). You have specific signals and red flags to probe for. Your follow-up questions should naturally explore these without being formulaic.

══════════════════════════════════════════════════════════════════════════════
SIGNAL EXTRACTION
══════════════════════════════════════════════════════════════════════════════

For each section, you're looking for specific signals defined by the recruiter. Your follow-up questions should naturally probe for these:

- If the candidate gives STRONG signal (specific examples, clear evidence): note it and move on
- If the candidate gives THIN signal (vague, generic): ask for a concrete example
- If the candidate AVOIDS the topic: note the avoidance as data, ask once more gently, then move on

Signal strength matters more than perfect coverage. Better to have clear signal on 5 dimensions than murky signal on 8.

══════════════════════════════════════════════════════════════════════════════
DO NOT REVEAL THE RUBRIC
══════════════════════════════════════════════════════════════════════════════

Never mention:
- That you have specific signals or red flags you're looking for
- The importance level of dimensions
- That this is for a specific role (unless naturally conversational)
- That a lens document will be generated from this conversation

The candidate should feel they're in a discovery conversation, not a structured interview.

══════════════════════════════════════════════════════════════════════════════
HANDLING "I DON'T KNOW"
══════════════════════════════════════════════════════════════════════════════

When a candidate says "I don't know" or expresses uncertainty:

1. Acknowledge it warmly: "That's completely fine — not everything needs a concrete answer."
2. Do NOT re-ask the same question with different phrasing
3. Do NOT push for an example they've said they don't have
4. Either move to the next question, or if you have enough signal, move to the next section
5. Note internally that this area is less defined — that's itself a signal

══════════════════════════════════════════════════════════════════════════════
SECTION COMPLETION
══════════════════════════════════════════════════════════════════════════════

When you have gathered enough signal for a section OR reached the question limit:
1. End with an acknowledgement or brief reflection (1-2 sentences) — e.g., "That really resonates" or "I appreciate you sharing that perspective"
2. End your response with exactly: [SECTION_COMPLETE]

CRITICAL: Do NOT end with a question when completing a section. The candidate cannot respond after [SECTION_COMPLETE]. Your final sentence before the marker MUST be a statement of acknowledgement or reflection, NEVER a question.`;

// Foundation section context templates
export const FOUNDATION_CONTEXTS = {
  essence: {
    instruction: "Brief exploration of professional identity and throughline",
    extractionTarget: "Core patterns, builder vs maintainer signal, career narrative",
    opener: "Before we dive into the specifics, I'd love to understand the throughline across your career. What pattern do you see in the work that's energized you most?",
  },
  work_style: {
    instruction: "How they actually work day-to-day",
    extractionTarget: "Remote preference, autonomy needs, collaboration style, pace",
    opener: "Tell me about a recent workday that went really well. What made it good — the pace, the people, the type of work?",
  },
  values: {
    instruction: "Behavioral values grounded in stories",
    extractionTarget: "What they actually optimize for, deal-breakers",
    opener: "When you say something matters to you at work, what does that actually look like in practice?",
  },
  energy: {
    instruction: "What fills vs drains them",
    extractionTarget: "Energizing work types, draining tasks, competence vs energy distinction",
    opener: "What kind of work fills your tank vs. drains it — even if you're good at both?",
  },
  disqualifiers: {
    instruction: "Hard stops and deal-breakers",
    extractionTarget: "Concrete exclusion criteria for job matching",
    opener: "What would make you walk away from an opportunity, even if everything else looked good?",
  },
  situation_timeline: {
    instruction: "Current search status and constraints",
    extractionTarget: "Timeline, compensation expectations, location constraints, notice period",
    opener: "Where are you in your search, and what constraints or timelines should I know about?",
  },
};

/**
 * Build the full system prompt for an R→C discovery section
 * @param {Object} section - The current section config from session-config
 * @param {Object} sessionConfig - The full session configuration
 * @param {string|null} establishedContext - Summary of prior sections
 * @returns {string} Complete system prompt
 */
export function buildRCSystemPrompt(section, sessionConfig, establishedContext = null) {
  const roleContext = sessionConfig.metadata || {};
  let systemPrompt = RC_SYSTEM_BASE;

  // Add role context
  systemPrompt += `\n\n══════════════════════════════════════════════════════════════════════════════
ROLE CONTEXT
══════════════════════════════════════════════════════════════════════════════
Role: ${roleContext.roleTitle || "Unknown Role"} at ${roleContext.company || "Unknown Company"}
${roleContext.estimatedDuration ? `Session Duration: ${roleContext.estimatedDuration}` : ""}`;

  // Add section-specific context based on type
  if (section.type === "foundation") {
    const foundationTemplate = FOUNDATION_CONTEXTS[section.id] || {};

    systemPrompt += `\n\n══════════════════════════════════════════════════════════════════════════════
CURRENT SECTION: ${section.label || section.id} (Foundation)
══════════════════════════════════════════════════════════════════════════════
${section.instruction || foundationTemplate.instruction || ""}
Extraction Target: ${section.extractionTarget || foundationTemplate.extractionTarget || "Core patterns and preferences"}
${section.mergedWith ? `\nNOTE: This section overlaps with the "${section.mergedWith}" dimension. Go deeper on that intersection.` : ""}
Time Allocation: ${section.timeAllocation || "2 min"}
Max Questions: 2

This is a foundation section — keep it brief. Get enough signal for the lens basics, then move on.`;

  } else {
    // Tailored section - include signals and red flags
    systemPrompt += `\n\n══════════════════════════════════════════════════════════════════════════════
CURRENT SECTION: ${section.label} (Tailored - ${section.importance || "moderate"})
══════════════════════════════════════════════════════════════════════════════
Importance: ${section.importance || "moderate"}
Time Allocation: ${section.timeAllocation || "3-4 min"}
Max Questions: ${section.questions || 3}

${section.whatToExplore ? `WHAT TO EXPLORE:\n${section.whatToExplore}\n` : ""}
${section.openingQuestions && section.openingQuestions.length > 0 ? `OPENING QUESTIONS (choose one to start):\n${section.openingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n` : ""}
${section.followUpGuidance ? `FOLLOW-UP GUIDANCE:
- If strong signal: ${section.followUpGuidance.ifStrong || "Probe for depth"}
- If thin signal: ${section.followUpGuidance.ifThin || "Ask for a specific example"}
- If avoided: ${section.followUpGuidance.ifAvoided || "Note avoidance, move on"}
` : ""}
${section.signals && section.signals.length > 0 ? `POSITIVE SIGNALS TO LISTEN FOR:\n${section.signals.map(s => `+ ${s}`).join("\n")}\n` : ""}
${section.redFlags && section.redFlags.length > 0 ? `RED FLAGS (do not mention to candidate):\n${section.redFlags.map(r => `- ${r}`).join("\n")}\n` : ""}
This is a ${section.importance || "moderate"} tailored dimension. Probe for the specific signals above without being formulaic.`;
  }

  // Add established context from previous sections
  if (establishedContext && establishedContext.trim()) {
    systemPrompt += `\n\n══════════════════════════════════════════════════════════════════════════════
ESTABLISHED FACTS FROM PREVIOUS SECTIONS
══════════════════════════════════════════════════════════════════════════════
${establishedContext}

CRITICAL: Do NOT re-ask about topics already covered above. Reference established facts and go deeper.`;
  }

  // Add candidate preload context if available
  const preload = sessionConfig.candidatePreloadAdjustments;
  if (preload?.resumeAvailable && preload?.keyFactsExtracted?.length > 0) {
    systemPrompt += `\n\n══════════════════════════════════════════════════════════════════════════════
CANDIDATE CONTEXT (from resume)
══════════════════════════════════════════════════════════════════════════════
${preload.keyFactsExtracted.map(f => `• ${f}`).join("\n")}

${preload.contextForOpeningQuestions || "Reference these facts in your questions."}`;
  }

  return systemPrompt;
}

/**
 * Get the opening prompt for a section
 * @param {Object} section - The section config
 * @param {Object} sessionConfig - The full session configuration
 * @returns {string} Opening question/prompt for the section
 */
export function getSectionOpeningPrompt(section, sessionConfig) {
  // For tailored sections with defined opening questions, use the first one
  if (section.type === "tailored" && section.openingQuestions?.length > 0) {
    return section.openingQuestions[0];
  }

  // For foundation sections, use template or fallback
  const template = FOUNDATION_CONTEXTS[section.id];
  if (template?.opener) {
    return template.opener;
  }

  // Fallback
  return section.instruction || `Let's explore ${section.label || section.id}.`;
}

/**
 * Build established context summary from section data
 * @param {Object} sectionData - Map of sectionId to summary text
 * @returns {string} Formatted context for system prompt
 */
export function buildEstablishedContext(sectionData) {
  if (!sectionData || Object.keys(sectionData).length === 0) {
    return "";
  }

  const lines = [];
  for (const [sectionId, data] of Object.entries(sectionData)) {
    if (data && typeof data === "string" && data.trim()) {
      lines.push(`[${sectionId}]: ${data.trim()}`);
    } else if (data && data.summary) {
      lines.push(`[${sectionId}]: ${data.summary}`);
    }
  }

  return lines.join("\n\n");
}
