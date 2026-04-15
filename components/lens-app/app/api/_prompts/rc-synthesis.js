// Server-side R→C synthesis prompts - NEVER sent to client
// Generates structured scorecard from discovery conversation

export const RC_SYNTHESIS_SYSTEM_PROMPT = `You are generating a candidate scorecard for a recruiter. This scorecard summarizes a tailored discovery conversation for a specific role.

══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
══════════════════════════════════════════════════════════════════════════════

Produce a JSON object (not markdown, not wrapped in code blocks) with this structure:

{
  "sessionId": "string",
  "candidateName": "string or null",
  "generatedAt": "ISO timestamp",
  "roleContext": {
    "roleTitle": "string",
    "company": "string"
  },
  "overallAssessment": {
    "fitScore": 1-5,
    "fitLabel": "Strong Fit | Good Fit | Moderate Fit | Weak Fit | Poor Fit",
    "summary": "2-3 sentence narrative summary of overall fit",
    "topStrengths": ["strength 1", "strength 2"],
    "topConcerns": ["concern 1", "concern 2"],
    "recommendation": "Advance | Advance with Caution | Do Not Advance | Needs More Information"
  },
  "dimensionScores": [
    {
      "dimensionId": "string",
      "label": "string",
      "importance": "critical | high | moderate",
      "score": 1-5,
      "signalStrength": "strong | moderate | thin | absent",
      "evidence": "1-2 sentence summary of what the candidate said",
      "signalsMatched": ["signal 1", "signal 2"],
      "redFlagsTriggered": [],
      "notes": "Additional context for recruiter"
    }
  ],
  "foundationSummary": {
    "essence": "Brief summary or null if not explored",
    "workStyle": "Brief summary or null",
    "values": "Brief summary or null",
    "disqualifiers": "Brief summary or null",
    "situationTimeline": "Brief summary or null"
  },
  "recruiterNotes": {
    "suggestedProbes": ["Question to ask in follow-up interview"],
    "contextForClient": "What to tell the hiring manager about this candidate",
    "riskFactors": ["Potential risks to explore further"]
  }
}

══════════════════════════════════════════════════════════════════════════════
SCORING RUBRIC
══════════════════════════════════════════════════════════════════════════════

Overall fitScore (1-5):
5 = Strong Fit - Strong evidence across critical dimensions, exceeds expectations
4 = Good Fit - Solid evidence, meets expectations, minor gaps only
3 = Moderate Fit - Mixed evidence, some gaps or concerns, worth exploring
2 = Weak Fit - Significant gaps in critical dimensions, concerns outweigh strengths
1 = Poor Fit - Red flags triggered or fundamental misalignment

Dimension scores (1-5):
5 = Exceeds expectations, strong specific evidence
4 = Meets expectations, clear evidence
3 = Partially meets, some gaps
2 = Below expectations, significant gaps
1 = Does not meet, red flags present

Signal strength definitions:
- "strong": Candidate provided specific examples with depth and clarity
- "moderate": Candidate gave relevant answers but lacked specificity
- "thin": Candidate gave surface-level answers, needed significant probing
- "absent": Candidate avoided topic or couldn't provide relevant experience

══════════════════════════════════════════════════════════════════════════════
RECOMMENDATION LOGIC
══════════════════════════════════════════════════════════════════════════════

"Advance" - fitScore 4-5, no red flags on critical dimensions
"Advance with Caution" - fitScore 3-4, minor concerns to probe further
"Do Not Advance" - fitScore 1-2, red flags on critical dimensions, fundamental misalignment
"Needs More Information" - Key dimensions have "thin" or "absent" signal, can't assess fairly

══════════════════════════════════════════════════════════════════════════════
CRITICAL RULES
══════════════════════════════════════════════════════════════════════════════

1. Base scores ONLY on what the candidate actually said in the conversation
2. Do NOT infer capabilities not demonstrated
3. If a critical dimension has "thin" or "absent" signal, this should impact overall fit
4. Red flags should be explicitly noted in the output, not buried in narrative
5. The recommendation should be actionable for the recruiter
6. Be specific in evidence — reference actual quotes or examples when possible

SENSITIVITY:
- Do NOT include clinical labels (ADHD, anxiety, etc.)
- Do NOT include assessment names (DISC, Myers-Briggs, etc.)
- Do NOT include sensitive personal information
- Frame all observations in professional behavioral terms

OUTPUT: Raw JSON only. No markdown formatting, no code blocks, no preamble.`;

/**
 * Build the user content for synthesis API call
 * @param {Object} params
 * @param {Object} params.sessionConfig - The full session configuration
 * @param {Object} params.sectionData - Map of sectionId to conversation summary
 * @param {Object|null} params.candidateContext - Optional candidate info (name, etc.)
 * @returns {string} Formatted content for synthesis prompt
 */
export function buildRCSynthesisUserContent({ sessionConfig, sectionData, candidateContext }) {
  const sections = [];

  // Role context
  sections.push("=== ROLE CONTEXT ===");
  sections.push(`Role: ${sessionConfig.metadata?.roleTitle || "Unknown"} at ${sessionConfig.metadata?.company || "Unknown"}`);
  sections.push(`Session ID: ${sessionConfig.sessionId}`);

  if (candidateContext?.name) {
    sections.push(`Candidate: ${candidateContext.name}`);
  }

  // Foundation sections
  sections.push("\n=== FOUNDATION SECTIONS ===");
  const foundationIds = ["essence", "work_style", "values", "energy", "disqualifiers", "situation_timeline"];

  for (const fId of foundationIds) {
    const data = sectionData[fId];
    if (data) {
      sections.push(`\n[${fId}]:`);
      sections.push(typeof data === "string" ? data : (data.summary || JSON.stringify(data)));
    }
  }

  // Also check foundation array from session config
  if (sessionConfig.foundation) {
    for (const f of sessionConfig.foundation) {
      const sectionId = f.sectionId || f.section || f.id;
      if (!foundationIds.includes(sectionId)) {
        const data = sectionData[sectionId];
        if (data) {
          sections.push(`\n[${sectionId}] (foundation):`);
          sections.push(typeof data === "string" ? data : (data.summary || JSON.stringify(data)));
        }
      }
    }
  }

  // Tailored dimensions
  sections.push("\n=== TAILORED DIMENSIONS ===");

  if (sessionConfig.tailored) {
    for (const t of sessionConfig.tailored) {
      const dimId = t.dimensionId || t.id;
      sections.push(`\n[${t.label || dimId}] (${t.importance || "moderate"})`);
      sections.push(`Importance: ${t.importance || "moderate"}`);

      if (t.signals?.length > 0) {
        sections.push(`Signals to look for: ${t.signals.join("; ")}`);
      }
      if (t.redFlags?.length > 0) {
        sections.push(`Red flags: ${t.redFlags.join("; ")}`);
      }

      const data = sectionData[dimId];
      if (data) {
        sections.push(`Conversation data:`);
        sections.push(typeof data === "string" ? data : (data.summary || JSON.stringify(data)));
      } else {
        sections.push("Conversation data: NOT EXPLORED");
      }
    }
  }

  // Instructions
  sections.push("\n=== INSTRUCTIONS ===");
  sections.push("Generate the scorecard JSON based on the conversation data above.");
  sections.push("Score each tailored dimension based on the signal strength and evidence provided.");
  sections.push("If a dimension was not explored, mark signalStrength as 'absent' and score as 2.");
  sections.push("Provide an overall assessment and actionable recommendation.");
  sections.push("Output raw JSON only — no markdown, no code blocks.");

  return sections.join("\n");
}
