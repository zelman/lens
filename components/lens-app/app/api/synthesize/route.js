// /api/synthesize - Server-side proxy for lens document generation
// Synthesis prompt is loaded server-side and NEVER sent to client
// Includes post-synthesis validation gate (v1.1) - now detects hallucinations

import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserContent } from "../_prompts/synthesis";
import { VALIDATION_SYSTEM_PROMPT, buildValidationUserContent, buildRevisionAddendum } from "../_prompts/validation";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 6000; // Reduced from 8000 for faster generation (lens typically ~4000 tokens)
const VALIDATION_MAX_TOKENS = 1500; // Gap report is smaller (reduced from 2000)
// Note: temperature param removed — deprecated in Claude 4.5+ models
const REQUEST_DEADLINE_MS = 58000; // Total time budget for all API calls (Vercel Pro = 60s, leave 2s buffer)
const MIN_VALIDATION_BUDGET_MS = 20000; // Skip validation if less than 20s remaining (need time for validation + potential re-synthesis)

// ═══════════════════════════════════════════════════════════════════════
// HARD POST-PROCESSING FILTER - catches clinical labels that slip through
// This is a belt-and-suspenders approach: even if the model ignores prompt
// instructions, this code catches it before the lens is returned.
//
// Strategy: Remove entire sentences containing sensitive terms rather than
// leaving bracketed placeholders. The surrounding prose should still flow.
// ═══════════════════════════════════════════════════════════════════════

// Sensitive terms that trigger sentence removal (case-insensitive)
const SENSITIVE_TERMS = [
  // Clinical/neurodivergence labels
  "ADHD", "ADD", "attention deficit", "ASD", "autism", "dyslexia",
  "anxiety", "depression", "bipolar", "OCD",
  // Assessment frameworks
  "DISC", "Myers-Briggs", "MBTI", "Enneagram", "StrengthsFinder", "CliftonStrengths",
  // DISC terminology (as personality descriptors)
  "Peacemaker", "SC profile", "Dominance", "Influencing", "Steadiness", "Compliance",
  // Bracketed placeholders (in case model generates them despite instructions)
  "[work style", "[process orientation", "[behavioral", "[personality",
  "[environment preference", "[wellbeing", "[energy pattern", "[detail orientation",
  "[collaborative style", "[leadership style", "[communication style", "[work pace",
];

// Build regex to match any sentence containing sensitive terms
function buildSentencePattern(term) {
  // Escape special regex characters in the term
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match sentence containing the term (from start of sentence or after period to next period)
  return new RegExp(`[^.!?]*\\b${escaped}\\b[^.!?]*[.!?]`, 'gi');
}

function sanitizeLensOutput(text) {
  let sanitized = text;
  let violations = [];

  // Remove entire sentences containing any sensitive term
  for (const term of SENSITIVE_TERMS) {
    const pattern = buildSentencePattern(term);
    const matches = sanitized.match(pattern);
    if (matches) {
      for (const match of matches) {
        violations.push({ type: "sentence", term, original: match.trim() });
      }
      sanitized = sanitized.replace(pattern, "");
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

    // Truncate rawDocumentText for synthesis (sectionData already has insights, don't need full docs)
    // This prevents synthesis timeout - 8K chars (~2K tokens) is enough for evidence grounding
    // Combined with sectionData (~15K tokens), this keeps total input under model's fast-path
    const MAX_RAW_TEXT_FOR_SYNTHESIS = 8000;
    let truncatedRawText = rawDocumentText || null;
    if (truncatedRawText && truncatedRawText.length > MAX_RAW_TEXT_FOR_SYNTHESIS) {
      console.log(`[Synthesize] Truncating rawDocumentText from ${truncatedRawText.length} to ${MAX_RAW_TEXT_FOR_SYNTHESIS} chars`);
      truncatedRawText = truncatedRawText.slice(0, MAX_RAW_TEXT_FOR_SYNTHESIS) + "\n\n[content truncated for synthesis]";
    }

    // Build user content server-side (including document context if available)
    const userContent = buildSynthesisUserContent({
      userName,
      pronouns,
      status,
      sectionData,
      currentDate,
      documentContext: documentContext || null,
      rawDocumentText: truncatedRawText,
    });

    // Call Anthropic API with shared timeout budget
    const callAnthropic = async (systemPrompt, content, maxTokens = MAX_TOKENS) => {
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

    // Validate output has enough sections (retry once if malformed)
    const sectionHeadingCount = (lensDoc.match(/^##\s+/gm) || []).length;
    if (sectionHeadingCount < 4) {
      console.warn(`Synthesis produced only ${sectionHeadingCount} sections, retrying...`);
      lensDoc = await callAnthropic(SYNTHESIS_SYSTEM_PROMPT, userContent, MAX_TOKENS);

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

    // Pass truncated text to validation so it only flags gaps from content synthesis actually saw
    // (If validation saw full text, it could flag gaps that re-synthesis could never fix)
    const validationContent = hasTimeBudget ? buildValidationUserContent({
      rawDocumentText: truncatedRawText,
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
    console.error("Synthesize route error:", {
      name: err.name,
      message: err.message,
      cause: err.cause,
      stack: err.stack?.split('\n').slice(0, 3).join(' | ')
    });
    return Response.json(
      { error: "Failed to generate lens document" },
      { status: 500 }
    );
  }
}
