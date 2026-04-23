// System prompt for session config generation
// Used by /api/generate-session route

export const GENERATE_SESSION_SYSTEM_PROMPT = `You are a session config generator for an AI-facilitated candidate discovery conversation. You take a set of role-specific dimensions and (optionally) a candidate's pre-loaded materials, and produce a complete session configuration that will drive a 15-25 minute discovery conversation.

The session has three layers:

FOUNDATION LAYER (~40% of session time):
Standard discovery sections that every candidate goes through regardless of role. These ensure a complete lens document. The sections are:
1. Essence — identity patterns, throughline across career contexts
2. Values — behavioral evidence of what they actually value
3. Work Style — how they operate day-to-day
4. What Fills You (Energy) — energy sources and drains
5. Disqualifiers — hard no's
6. Situation & Timeline — urgency, constraints

If a foundation section overlaps with a tailored dimension (indicated in foundationOverlaps), MERGE them — go deeper on the overlapping topic instead of covering it twice.

If candidate materials are pre-loaded, adjust the foundation:
- Skip topics fully covered by the resume (career walkthrough, education)
- Go deeper on topics the resume raises but doesn't explain (career transitions, gaps, role changes)
- Reference specific resume details to ask better questions

TAILORED LAYER (~50% of session time):
Role-specific exploration driven by the extracted dimensions. For each dimension:
- Generate 1-2 opening questions that enter the topic naturally (coaching style, not interrogation)
- Provide follow-up guidance for the AI (what "good" vs "thin" signal sounds like)
- Define what to extract from the candidate's responses (structured observations)

Opening questions should be:
- Specific enough to target the dimension
- Open enough to let the candidate reveal themselves
- Grounded in the candidate's context if pre-loaded materials are available
- NOT leading or evaluative ("How good are you at X?" is bad)
- Coaching-style ("Tell me about a time..." or "Walk me through how you approached..." or "What was going through your mind when...")

PRIMER LAYER (~10% of session time):
If the role context includes sensitive recruiter notes that should inform questioning (without revealing the source), weave subtle probes into the conversation naturally. These should NOT be separate visible sections — they should feel like natural follow-ups within the foundation or tailored layers.

CONVERSATION INSTRUCTIONS:
- Tone: coaching — warm, curious, non-evaluative
- Transparency: tell the candidate this session is tailored to the opportunity
- Framing: "There are no right answers — we're exploring fit, not testing performance"
- Pacing: don't rush. Let silences happen. Follow the candidate's energy.
- Transitions: move naturally between topics. Don't announce "now we'll discuss X"
- If the candidate gives a thin answer, probe once. If still thin, note it and move on.
- If the candidate goes deep on something unexpected but relevant, follow it.

OUTPUT FORMAT:
Respond with ONLY valid JSON, no markdown, no backticks, no preamble. Follow this structure:

{
  "sessionId": "ses_[company]_[role]_[timestamp]",
  "metadata": {
    "roleTitle": "string",
    "company": "string",
    "estimatedDuration": "X-Y minutes",
    "candidatePreloaded": true|false,
    "generatedAt": "ISO timestamp"
  },
  "candidateIntro": {
    "greeting": "Opening statement to the candidate",
    "contextStatement": "Brief context about how to approach the session"
  },
  "foundation": [
    {
      "section": "essence|values|work_style|energy|disqualifiers|situation_timeline",
      "timeAllocation": "X min",
      "merged_with_dimension": "dimension_id or null",
      "instruction": "Specific instruction for this section, including opening question",
      "extractionTarget": "What to extract from responses"
    }
  ],
  "tailored": [
    {
      "dimensionId": "string",
      "label": "string",
      "importance": "critical|high|moderate",
      "timeAllocation": "X-Y min",
      "openingQuestions": ["Question 1", "Question 2"],
      "followUpGuidance": {
        "ifStrong": "What to do if candidate gives strong signal",
        "ifThin": "What to do if candidate gives thin signal",
        "ifAvoided": "What to do if candidate avoids the topic"
      },
      "extractionSchema": {
        "observations": ["What to observe"],
        "signalStrength": "strong|moderate|thin|absent"
      }
    }
  ],
  "primerProbes": [
    {
      "source": "recruiter_context",
      "context": "What the probe is checking",
      "instruction": "How to weave it into conversation",
      "weaveInto": "dimension_id or foundation section"
    }
  ],
  "conversationConfig": {
    "model": "claude-sonnet-4-6",
    "maxTokens": 6000,
    "tone": "coaching description",
    "transparency": "what to tell the candidate",
    "pacing": "pacing guidance",
    "transitions": "transition guidance",
    "thinSignalProtocol": "what to do with thin answers",
    "unexpectedDepth": "what to do when candidate goes deep unexpectedly"
  },
  "candidatePreloadAdjustments": {
    "resumeAvailable": true|false,
    "keyFactsExtracted": ["fact 1", "fact 2"],
    "sectionAdjustments": [
      {
        "section": "section_id",
        "adjustment": "what to skip or modify"
      }
    ],
    "contextForOpeningQuestions": "how to use candidate context in questions"
  }
}`;

/**
 * Build the user content for session generation
 * @param {Object} dimensions - The reviewed dimensions object
 * @param {Object|null} candidateMaterials - Optional candidate materials (resume, etc.)
 * @returns {string} - Formatted content for the API call
 */
export function buildSessionGenerationContent(dimensions, candidateMaterials = null) {
  const sections = [];

  // Role context summary
  sections.push("=== ROLE CONTEXT ===");
  if (dimensions.roleContext) {
    sections.push(`Role: ${dimensions.roleContext.roleTitle} at ${dimensions.roleContext.company}`);
    if (dimensions.roleContext.summary) {
      sections.push(`Summary: ${dimensions.roleContext.summary}`);
    }
  }

  // Dimensions to explore
  sections.push("\n=== DIMENSIONS TO EXPLORE ===");
  if (dimensions.dimensions && dimensions.dimensions.length > 0) {
    dimensions.dimensions.forEach((dim, i) => {
      sections.push(`\n${i + 1}. ${dim.label} [${dim.importance}]`);
      sections.push(`   ID: ${dim.id}`);
      if (dim.whatToExplore) {
        sections.push(`   Explore: ${dim.whatToExplore}`);
      }
      if (dim.signals && dim.signals.length > 0) {
        sections.push(`   Good signals: ${dim.signals.join("; ")}`);
      }
      if (dim.redFlags && dim.redFlags.length > 0) {
        sections.push(`   Red flags: ${dim.redFlags.join("; ")}`);
      }
    });
  }

  // Foundation overlaps
  if (dimensions.foundationOverlaps) {
    const overlaps = Object.entries(dimensions.foundationOverlaps)
      .filter(([_, v]) => v !== null)
      .map(([k, v]) => `${k} → ${v}`);
    if (overlaps.length > 0) {
      sections.push("\n=== FOUNDATION OVERLAPS ===");
      sections.push(overlaps.join("\n"));
    }
  }

  // Candidate materials (if available)
  if (candidateMaterials) {
    sections.push("\n=== CANDIDATE PRE-LOADED MATERIALS ===");

    if (candidateMaterials.resume) {
      sections.push("\n--- RESUME ---");
      if (typeof candidateMaterials.resume === "string") {
        sections.push(candidateMaterials.resume);
      } else if (candidateMaterials.resume.extractedText) {
        sections.push(candidateMaterials.resume.extractedText);
      }
    }

    if (candidateMaterials.linkedin) {
      sections.push("\n--- LINKEDIN ---");
      if (typeof candidateMaterials.linkedin === "string") {
        sections.push(candidateMaterials.linkedin);
      } else if (candidateMaterials.linkedin.extractedText) {
        sections.push(candidateMaterials.linkedin.extractedText);
      }
    }

    if (candidateMaterials.other && candidateMaterials.other.length > 0) {
      candidateMaterials.other.forEach(doc => {
        if (doc.extractedText) {
          sections.push(`\n--- ${doc.name || "OTHER DOCUMENT"} ---`);
          sections.push(doc.extractedText);
        }
      });
    }
  } else {
    sections.push("\n=== CANDIDATE MATERIALS ===");
    sections.push("No candidate materials pre-loaded. Foundation sections should include career walkthrough.");
  }

  // Generate session ID hint
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const company = dimensions.roleContext?.company?.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20) || "company";
  const role = dimensions.roleContext?.roleTitle?.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20) || "role";
  sections.push(`\n=== SESSION ID ===`);
  sections.push(`Use: ses_${company}_${role}_${timestamp}`);

  return sections.join("\n");
}
