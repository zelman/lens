// /api/synthesize - Server-side proxy for lens document generation
// Synthesis prompt is loaded server-side and NEVER sent to client
// Includes post-synthesis validation gate (v1.1) - now detects hallucinations
// v1.2: Streaming API to avoid Vercel timeout cliff

import Anthropic from "@anthropic-ai/sdk";
import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserContent } from "../_prompts/synthesis";
import { VALIDATION_SYSTEM_PROMPT, buildValidationUserContent, buildRevisionAddendum } from "../_prompts/validation";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 6000; // Reduced from 8000 for faster generation (lens typically ~4000 tokens)
const VALIDATION_MAX_TOKENS = 1500; // Gap report is smaller (reduced from 2000)
// Note: temperature param removed — deprecated in Claude 4.5+ models
// Streaming eliminates the hard timeout cliff - Vercel timeout applies to time between bytes, not total request time
const STREAM_TIMEOUT_MS = 120000; // 2 min total budget now safe with streaming
const MIN_VALIDATION_BUDGET_MS = 30000; // More time for validation since we're not racing the clock

// ═══════════════════════════════════════════════════════════════════════
// HARD POST-PROCESSING FILTER - catches clinical labels that slip through
// This is a belt-and-suspenders approach: even if the model ignores prompt
// instructions, this code catches it before the lens is returned.
//
// Strategy: Remove entire sentences containing sensitive terms rather than
// leaving bracketed placeholders. The surrounding prose should still flow.
// ═══════════════════════════════════════════════════════════════════════

// Sensitive terms that trigger sentence removal (case-insensitive)
// Note: "ADD" removed - too many false positives with common word "add".
// Coverage maintained via "ADHD" and "attention deficit".
const SENSITIVE_TERMS = [
  // Clinical/neurodivergence labels
  "ADHD", "attention deficit", "ASD", "autism", "dyslexia",
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
  // Bracketed terms like "[work style" don't work with \b word boundary
  const boundary = /^\[/.test(term) ? '' : '\\b';
  // Match sentence containing the term, including end-of-string for unpunctuated final sentences
  return new RegExp(`[^.!?]*${boundary}${escaped}${boundary}[^.!?]*(?:[.!?]|$)`, 'gim');
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

  // Initialize Anthropic client
  const anthropic = new Anthropic({ apiKey });

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

    // Log payload details for debugging
    console.log(`[Synthesize] Payload: ${payloadSize} bytes, sections: ${sectionCount}, rawDoc: ${rawDocumentText?.length || 0} chars`);

    // Build current date
    const now = new Date();
    const currentDate = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // Track request start for budget logging (streaming removes hard timeout cliff)
    const requestStart = Date.now();
    const getElapsedMs = () => Date.now() - requestStart;

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
    let userContent;
    try {
      userContent = buildSynthesisUserContent({
        userName,
        pronouns,
        status,
        sectionData,
        currentDate,
        documentContext: documentContext || null,
        rawDocumentText: truncatedRawText,
      });
      console.log(`[Synthesize] userContent length: ${userContent.length} chars (streaming enabled)`);
    } catch (buildErr) {
      console.error("[Synthesize] buildSynthesisUserContent failed:", buildErr.message);
      throw buildErr;
    }

    // Call Anthropic API with streaming to avoid timeout cliff
    // Vercel's timeout applies to time between bytes, not total request time
    // A 90-second generation that streams chunks every 500ms will succeed
    const callAnthropicStreaming = async (systemPrompt, content, maxTokens = MAX_TOKENS) => {
      const streamStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

      console.log(`[Synthesize] Starting streaming call, max_tokens: ${maxTokens}`);

      let fullResponse = "";
      let chunkCount = 0;

      try {
        const stream = await anthropic.messages.stream({
          model: MODEL,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: "user", content }],
        }, {
          signal: controller.signal,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            fullResponse += event.delta.text;
            chunkCount++;
          }
        }

        clearTimeout(timeoutId);

        const streamDuration = Date.now() - streamStart;
        console.log(`[Synthesize] Stream complete: ${chunkCount} chunks, ${fullResponse.length} chars, ${Math.round(streamDuration / 1000)}s`);

        if (!fullResponse) {
          throw new Error("Empty response from AI");
        }

        // Check final message for stop reason
        const finalMessage = await stream.finalMessage();
        if (finalMessage.stop_reason === "max_tokens") {
          console.warn("[Synthesize] Response was truncated due to max_tokens limit");
        }

        return fullResponse;

      } catch (error) {
        clearTimeout(timeoutId);

        const elapsed = Math.round((Date.now() - streamStart) / 1000);

        if (error.name === "AbortError") {
          console.error(`[Synthesize] Stream timed out after ${elapsed}s`);
          throw new Error(`Synthesis timed out after ${STREAM_TIMEOUT_MS / 1000}s`);
        }

        console.error(`[Synthesize] Stream failed after ${elapsed}s, ${chunkCount} chunks: ${error.message}`);
        throw error;
      }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Initial Synthesis (streaming)
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`[Synthesize] Phase 1 starting (streaming), prompt: ${SYNTHESIS_SYSTEM_PROMPT.length} chars`);
    let lensDoc;
    try {
      lensDoc = await callAnthropicStreaming(SYNTHESIS_SYSTEM_PROMPT, userContent);
      console.log(`[Synthesize] Phase 1 complete, lensDoc length: ${lensDoc.length}, elapsed: ${Math.round(getElapsedMs() / 1000)}s`);
    } catch (apiErr) {
      console.error(`[Synthesize] Phase 1 FAILED: ${apiErr.name} - ${apiErr.message}`);
      throw apiErr;
    }

    // Validate output has enough sections (retry once if malformed)
    const sectionHeadingCount = (lensDoc.match(/^##\s+/gm) || []).length;
    if (sectionHeadingCount < 4) {
      console.warn(`Synthesis produced only ${sectionHeadingCount} sections, retrying...`);
      lensDoc = await callAnthropicStreaming(SYNTHESIS_SYSTEM_PROMPT, userContent, MAX_TOKENS);

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
    // PHASE 2: Validation Gate (streaming removes time pressure)
    // ═══════════════════════════════════════════════════════════════════════
    const elapsedMs = getElapsedMs();
    // With streaming, we can afford validation - only skip if we've been running unusually long
    const hasTimeBudget = elapsedMs < STREAM_TIMEOUT_MS - MIN_VALIDATION_BUDGET_MS;

    if (!hasTimeBudget) {
      console.log(`Skipping validation - elapsed ${Math.round(elapsedMs / 1000)}s exceeds budget`);
    }

    // Pass truncated text to validation so it only flags gaps from content synthesis actually saw
    // (If validation saw full text, it could flag gaps that re-synthesis could never fix)
    const validationContent = hasTimeBudget ? buildValidationUserContent({
      rawDocumentText: truncatedRawText,
      lensMarkdown: lensDoc,
    }) : null;

    if (validationContent) {
      try {
        const validationResponse = await callAnthropicStreaming(
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

          // With streaming, we can always attempt re-synthesis
          console.log(`Validation found issues: ${reasons.join(", ")}, triggering re-synthesis`);

          // Build revision addendum and append to original synthesis prompt
          const revisionAddendum = buildRevisionAddendum(gapReport);
          const revisedSystemPrompt = SYNTHESIS_SYSTEM_PROMPT + revisionAddendum;

          // Re-run synthesis with gap instructions
          try {
            const revisedLens = await callAnthropicStreaming(revisedSystemPrompt, userContent);

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
      { error: "Failed to generate Lens document" },
      { status: 500 }
    );
  }
}
