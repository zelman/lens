// /api/synthesize - Server-side proxy for lens document generation
// Synthesis prompt is loaded server-side and NEVER sent to client
// Includes post-synthesis validation gate (v1.1) - now detects hallucinations

import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserContent } from "../_prompts/synthesis";
import { VALIDATION_SYSTEM_PROMPT, buildValidationUserContent, buildRevisionAddendum } from "../_prompts/validation";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 8000; // For full lens document with 8 sections
const VALIDATION_MAX_TOKENS = 1500; // Gap report is smaller (reduced from 2000)
const TEMPERATURE = 0.7;
const RETRY_TEMPERATURE = 0.8; // Slightly higher for retry variation
const REQUEST_DEADLINE_MS = 55000; // Total time budget for all API calls (Vercel Pro = 60s)
const MIN_VALIDATION_BUDGET_MS = 20000; // Skip validation if less than 20s remaining (need time for validation + potential re-synthesis)

// ═══════════════════════════════════════════════════════════════════════
// HARD POST-PROCESSING FILTER - catches clinical labels that slip through
// This is a belt-and-suspenders approach: even if the model ignores prompt
// instructions, this code catches it before the lens is returned.
// ═══════════════════════════════════════════════════════════════════════
const SENSITIVITY_PATTERNS = [
  // Clinical labels - match as whole words, case-insensitive
  { pattern: /\bADHD\b/gi, replacement: "[work style note]" },
  { pattern: /\bADD\b/gi, replacement: "[work style note]" },
  { pattern: /\battention deficit\b/gi, replacement: "[work style note]" },
  { pattern: /\banxiety\b/gi, replacement: "[environment preference]" },
  { pattern: /\bdepression\b/gi, replacement: "[wellbeing note]" },
  { pattern: /\bbipolar\b/gi, replacement: "[energy pattern]" },
  { pattern: /\bOCD\b/gi, replacement: "[detail orientation]" },
  // Assessment names
  { pattern: /\bDISC\b/gi, replacement: "[behavioral style]" },
  { pattern: /\bMyers-Briggs\b/gi, replacement: "[personality framework]" },
  { pattern: /\bMBTI\b/gi, replacement: "[personality framework]" },
  { pattern: /\bEnneagram\b/gi, replacement: "[personality framework]" },
  { pattern: /\bStrengthsFinder\b/gi, replacement: "[strengths assessment]" },
  { pattern: /\bCliftonStrengths\b/gi, replacement: "[strengths assessment]" },
  // DISC profile terms (as personality descriptors)
  { pattern: /\bPeacemaker\b/gi, replacement: "[collaborative style]" },
  { pattern: /\bSC profile\b/gi, replacement: "[behavioral preference]" },
  { pattern: /\bDominance\b/gi, replacement: "[leadership style]" },
  { pattern: /\bInfluencing\b/gi, replacement: "[communication style]" },
  { pattern: /\bSteadiness\b/gi, replacement: "[work pace preference]" },
  { pattern: /\bCompliance\b/gi, replacement: "[process orientation]" },
];

// Sentences that reference clinical labels need full rewrite, not just word replacement
const SENTENCE_BLOCKERS = [
  /[^.]*\bhas ADHD\b[^.]*\./gi,
  /[^.]*\bwith ADHD\b[^.]*\./gi,
  /[^.]*\btheir ADHD\b[^.]*\./gi,
  /[^.]*\bhis ADHD\b[^.]*\./gi,
  /[^.]*\bher ADHD\b[^.]*\./gi,
  /[^.]*\bADHD means\b[^.]*\./gi,
  /[^.]*\bADHD shapes\b[^.]*\./gi,
];

function sanitizeLensOutput(text) {
  let sanitized = text;
  let violations = [];

  // First pass: remove entire sentences that reference clinical labels
  for (const blocker of SENTENCE_BLOCKERS) {
    const matches = sanitized.match(blocker);
    if (matches) {
      for (const match of matches) {
        violations.push({ type: "sentence", original: match.trim() });
        // Remove the sentence entirely - the behavioral insight will be elsewhere
        sanitized = sanitized.replace(match, "");
      }
    }
  }

  // Second pass: replace individual terms that slipped through
  for (const { pattern, replacement } of SENSITIVITY_PATTERNS) {
    const matches = sanitized.match(pattern);
    if (matches) {
      for (const match of matches) {
        violations.push({ type: "term", original: match, replacement });
      }
      sanitized = sanitized.replace(pattern, replacement);
    }
  }

  // Clean up any double spaces or empty lines left by sentence removal
  sanitized = sanitized.replace(/\n\s*\n\s*\n/g, "\n\n");
  sanitized = sanitized.replace(/  +/g, " ");

  return { sanitized, violations };
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { sectionData, userName, pronouns, status, documentContext, rawDocumentText } = body;

    // Validate section data
    if (!sectionData || typeof sectionData !== "object") {
      return Response.json(
        { error: "Missing or invalid sectionData" },
        { status: 400 }
      );
    }

    // Validate documentContext if provided (optional but must be valid shape)
    if (documentContext !== undefined && documentContext !== null) {
      if (typeof documentContext !== "object" || Array.isArray(documentContext)) {
        return Response.json(
          { error: "documentContext must be an object" },
          { status: 400 }
        );
      }
    }

    // Check that we have at least some sections
    const sectionCount = Object.keys(sectionData).length;
    if (sectionCount < 4) {
      return Response.json(
        { error: "Incomplete discovery - need at least 4 sections" },
        { status: 400 }
      );
    }

    // Check payload size (200KB limit for synthesis)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 200000) {
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    // Build current date
    const now = new Date();
    const currentDate = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // Track request start for shared timeout budget
    const requestStart = Date.now();
    const getRemainingTimeout = () => Math.max(5000, REQUEST_DEADLINE_MS - (Date.now() - requestStart));

    // Build user content server-side (including document context if available)
    const userContent = buildSynthesisUserContent({
      userName,
      pronouns,
      status,
      sectionData,
      currentDate,
      documentContext: documentContext || null,
      rawDocumentText: rawDocumentText || null,
    });

    // Call Anthropic API with shared timeout budget
    const callAnthropic = async (systemPrompt, content, maxTokens = MAX_TOKENS, temp = TEMPERATURE) => {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        signal: AbortSignal.timeout(getRemainingTimeout()),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          temperature: temp,
          system: systemPrompt,
          messages: [{ role: "user", content }],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        console.error("Anthropic API error:", res.status, errorText);
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text;
      const stopReason = data.stop_reason;

      if (!text) {
        throw new Error("Empty response from AI");
      }

      // Warn if response was truncated due to max_tokens
      if (stopReason === "max_tokens") {
        console.warn("Response was truncated due to max_tokens limit");
      }

      return text;
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Initial Synthesis
    // ═══════════════════════════════════════════════════════════════════════
    let lensDoc = await callAnthropic(SYNTHESIS_SYSTEM_PROMPT, userContent);

    // Validate output has enough sections (retry once if malformed with higher temperature)
    const sectionHeadingCount = (lensDoc.match(/^##\s+/gm) || []).length;
    if (sectionHeadingCount < 4) {
      console.warn(`Synthesis produced only ${sectionHeadingCount} sections, retrying with higher temperature...`);
      lensDoc = await callAnthropic(SYNTHESIS_SYSTEM_PROMPT, userContent, MAX_TOKENS, RETRY_TEMPERATURE);

      // Validate retry attempt
      const retryCount = (lensDoc.match(/^##\s+/gm) || []).length;
      if (retryCount < 4) {
        console.error(`Retry also produced only ${retryCount} sections`);
        return Response.json(
          { error: "Synthesis quality check failed. Please try again." },
          { status: 502 }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Validation Gate (only if we have source materials AND time budget)
    // ═══════════════════════════════════════════════════════════════════════
    const remainingBudget = getRemainingTimeout();
    const hasTimeBudget = remainingBudget >= MIN_VALIDATION_BUDGET_MS;

    if (!hasTimeBudget) {
      console.log(`Skipping validation - only ${Math.round(remainingBudget / 1000)}s remaining (need ${MIN_VALIDATION_BUDGET_MS / 1000}s)`);
    }

    const validationContent = hasTimeBudget ? buildValidationUserContent({
      rawDocumentText: rawDocumentText || null,
      lensMarkdown: lensDoc,
    }) : null;

    if (validationContent) {
      try {
        const validationResponse = await callAnthropic(
          VALIDATION_SYSTEM_PROMPT,
          validationContent,
          VALIDATION_MAX_TOKENS
        );

        // Parse gap report JSON
        let gapReport;
        try {
          gapReport = JSON.parse(validationResponse);
        } catch (parseErr) {
          console.warn("Failed to parse validation response as JSON:", parseErr.message);
          // Continue with original lens if validation parsing fails
          gapReport = { gap_severity: "none" };
        }

        // Check if re-synthesis is needed (gaps OR hallucinations OR sensitivity violations)
        const hasSignificantGaps = gapReport.gap_severity === "high" || gapReport.gap_severity === "medium";
        const hasHallucinations = gapReport.has_hallucinations && gapReport.hallucinations?.some(h => h.severity === "high" || h.severity === "medium");
        const hasSensitivityViolations = gapReport.has_sensitivity_violations && gapReport.sensitivity_violations?.length > 0;

        if (hasSignificantGaps || hasHallucinations || hasSensitivityViolations) {
          const reasons = [];
          if (hasSensitivityViolations) reasons.push("sensitivity violations");
          if (hasHallucinations) reasons.push("hallucinations");
          if (hasSignificantGaps) reasons.push("gaps");

          // Check if we have enough time budget for re-synthesis (~15s minimum)
          const resynthBudget = getRemainingTimeout();
          if (resynthBudget < 15000) {
            console.log(`Validation found issues (${reasons.join(", ")}) but only ${Math.round(resynthBudget / 1000)}s remaining - skipping re-synthesis`);
          } else {
            console.log(`Validation found issues: ${reasons.join(", ")}, triggering re-synthesis (${Math.round(resynthBudget / 1000)}s remaining)`);

            // Build revision addendum and append to original synthesis prompt
            const revisionAddendum = buildRevisionAddendum(gapReport);
            const revisedSystemPrompt = SYNTHESIS_SYSTEM_PROMPT + revisionAddendum;

            // Re-run synthesis with gap instructions
            try {
              const revisedLens = await callAnthropic(revisedSystemPrompt, userContent);

              // Validate revised output before accepting it
              const revisedSectionCount = (revisedLens.match(/^##\s+/gm) || []).length;
              if (revisedSectionCount < 4) {
                console.warn(`Re-synthesis produced only ${revisedSectionCount} sections, keeping original`);
                // Keep original lensDoc (don't overwrite)
              } else {
                lensDoc = revisedLens;
              }
            } catch (resynthErr) {
              console.warn("Re-synthesis failed, keeping original:", resynthErr.message);
              // Keep original lensDoc
            }
          }
        } else {
          console.log(`Validation passed with severity: ${gapReport.gap_severity || "none"}`);
        }
      } catch (validationErr) {
        // Validation is a quality gate, not a hard requirement
        // If it fails, continue with the original synthesis
        console.warn("Validation step failed, continuing with original synthesis:", validationErr.message);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: Hard post-processing filter (catches anything that slipped through)
    // ═══════════════════════════════════════════════════════════════════════
    const { sanitized, violations } = sanitizeLensOutput(lensDoc);

    if (violations.length > 0) {
      console.warn(`Sensitivity filter caught ${violations.length} violations:`,
        violations.map(v => v.type === "sentence" ? `[sentence removed]` : v.original).join(", ")
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Return final lens document
    // ═══════════════════════════════════════════════════════════════════════
    return Response.json({
      lens: sanitized,
    });

  } catch (err) {
    console.error("Synthesize route error:", err);
    return Response.json(
      { error: "Failed to generate lens document" },
      { status: 500 }
    );
  }
}
