// /api/synthesize-premium - Premium lens synthesis with structured metadata
// Produces lens document + appended JSON metadata block for premium deliverables
// Uses the same core synthesis logic but with PREMIUM_METADATA_INSTRUCTIONS appended

import Anthropic from "@anthropic-ai/sdk";
import {
  SYNTHESIS_SYSTEM_PROMPT,
  PREMIUM_METADATA_INSTRUCTIONS,
  buildSynthesisUserContent,
  parsePremiumSynthesisResponse,
} from "../_prompts/synthesis";
import { VALIDATION_SYSTEM_PROMPT, buildValidationUserContent, buildRevisionAddendum } from "../_prompts/validation";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8000; // Increased from 6000 to accommodate metadata block
const VALIDATION_MAX_TOKENS = 1500;
const STREAM_TIMEOUT_MS = 150000; // 2.5 min for premium (more output)
const VALIDATION_TIMEOUT_MS = 30000; // 30s cap for validation calls
const MIN_VALIDATION_BUDGET_MS = 30000;

// Combined system prompt for premium synthesis
const PREMIUM_SYSTEM_PROMPT = SYNTHESIS_SYSTEM_PROMPT + PREMIUM_METADATA_INSTRUCTIONS;

// ═══════════════════════════════════════════════════════════════════════
// SENSITIVITY FILTER - same as standard synthesize route
// ═══════════════════════════════════════════════════════════════════════

const SENSITIVE_TERMS = [
  "ADHD", "attention deficit", "ASD", "autism", "dyslexia",
  "anxiety", "depression", "bipolar", "OCD",
  "DISC", "Myers-Briggs", "MBTI", "Enneagram", "StrengthsFinder", "CliftonStrengths",
  "Peacemaker", "SC profile", "Dominance", "Influencing", "Steadiness", "Compliance",
  "[work style", "[process orientation", "[behavioral", "[personality",
  "[environment preference", "[wellbeing", "[energy pattern", "[detail orientation",
  "[collaborative style", "[leadership style", "[communication style", "[work pace",
];

function buildSentencePattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const boundary = /^\[/.test(term) ? '' : '\\b';
  return new RegExp(`[^.!?]*${boundary}${escaped}${boundary}[^.!?]*(?:[.!?]|$)`, 'gim');
}

function sanitizeLensOutput(text) {
  let sanitized = text;
  let violations = [];

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

    if (documentContext !== undefined && documentContext !== null) {
      if (typeof documentContext !== "object" || Array.isArray(documentContext)) {
        return Response.json(
          { error: "documentContext must be an object" },
          { status: 400 }
        );
      }
    }

    const sectionCount = Object.keys(sectionData).length;
    if (sectionCount < 4) {
      return Response.json(
        { error: "Incomplete discovery - need at least 4 sections" },
        { status: 400 }
      );
    }

    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 200000) {
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    console.log(`[SynthesizePremium] Payload: ${payloadSize} bytes, sections: ${sectionCount}`);

    const now = new Date();
    const currentDate = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const requestStart = Date.now();
    const getElapsedMs = () => Date.now() - requestStart;

    // Truncate rawDocumentText for synthesis
    const MAX_RAW_TEXT_FOR_SYNTHESIS = 8000;
    let truncatedRawText = rawDocumentText || null;
    if (truncatedRawText && truncatedRawText.length > MAX_RAW_TEXT_FOR_SYNTHESIS) {
      console.log(`[SynthesizePremium] Truncating rawDocumentText from ${truncatedRawText.length} to ${MAX_RAW_TEXT_FOR_SYNTHESIS} chars`);
      truncatedRawText = truncatedRawText.slice(0, MAX_RAW_TEXT_FOR_SYNTHESIS) + "\n\n[content truncated for synthesis]";
    }

    // Build user content with premium flag
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
        includePremiumMetadata: true, // Premium flag
      });
      console.log(`[SynthesizePremium] userContent length: ${userContent.length} chars`);
    } catch (buildErr) {
      console.error("[SynthesizePremium] buildSynthesisUserContent failed:", buildErr.message);
      throw buildErr;
    }

    // Streaming API call helper
    const callAnthropicStreaming = async (systemPrompt, content, maxTokens = MAX_TOKENS) => {
      const streamStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

      console.log(`[SynthesizePremium] Starting streaming call, max_tokens: ${maxTokens}`);

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
        console.log(`[SynthesizePremium] Stream complete: ${chunkCount} chunks, ${fullResponse.length} chars, ${Math.round(streamDuration / 1000)}s`);

        if (!fullResponse) {
          throw new Error("Empty response from AI");
        }

        const finalMessage = await stream.finalMessage();
        if (finalMessage.stop_reason === "max_tokens") {
          console.warn("[SynthesizePremium] Response was truncated due to max_tokens limit");
        }

        return fullResponse;

      } catch (error) {
        clearTimeout(timeoutId);

        const elapsed = Math.round((Date.now() - streamStart) / 1000);

        if (error.name === "AbortError") {
          console.error(`[SynthesizePremium] Stream timed out after ${elapsed}s`);
          throw new Error(`Synthesis timed out after ${STREAM_TIMEOUT_MS / 1000}s`);
        }

        console.error(`[SynthesizePremium] Stream failed after ${elapsed}s: ${error.message}`);
        throw error;
      }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Premium Synthesis
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`[SynthesizePremium] Phase 1 starting, prompt: ${PREMIUM_SYSTEM_PROMPT.length} chars`);
    let rawResponse;
    try {
      rawResponse = await callAnthropicStreaming(PREMIUM_SYSTEM_PROMPT, userContent);
      console.log(`[SynthesizePremium] Phase 1 complete, response length: ${rawResponse.length}, elapsed: ${Math.round(getElapsedMs() / 1000)}s`);
    } catch (apiErr) {
      console.error(`[SynthesizePremium] Phase 1 FAILED: ${apiErr.name} - ${apiErr.message}`);
      throw apiErr;
    }

    // Parse the response to separate markdown from metadata
    const { markdown: lensDoc, metadata, parseError } = parsePremiumSynthesisResponse(rawResponse);

    if (parseError) {
      console.warn(`[SynthesizePremium] Metadata parse warning: ${parseError}`);
    }

    // Validate output has enough sections
    const sectionHeadingCount = (lensDoc.match(/^##\s+/gm) || []).length;
    if (sectionHeadingCount < 4) {
      console.warn(`[SynthesizePremium] Synthesis produced only ${sectionHeadingCount} sections, retrying...`);
      const retryResponse = await callAnthropicStreaming(PREMIUM_SYSTEM_PROMPT, userContent, MAX_TOKENS);
      const retryParsed = parsePremiumSynthesisResponse(retryResponse);

      const retryCount = (retryParsed.markdown.match(/^##\s+/gm) || []).length;
      if (retryCount < 4) {
        console.error(`[SynthesizePremium] Retry also produced only ${retryCount} sections`);
        return Response.json(
          { error: "Synthesis quality check failed. Please try again." },
          { status: 502 }
        );
      }

      // Use retry results - apply sanitization and return
      const { sanitized: retrySanitized, violations: retryViolations } = sanitizeLensOutput(retryParsed.markdown);
      if (retryViolations.length > 0) {
        console.warn(`[SynthesizePremium] Sensitivity filter caught ${retryViolations.length} violations in retry`);
      }
      return Response.json({
        lens: retrySanitized,
        metadata: retryParsed.metadata || null,
        premium: true,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Validation Gate (optional, time-permitting)
    // ═══════════════════════════════════════════════════════════════════════
    const elapsedMs = getElapsedMs();
    const hasTimeBudget = elapsedMs < STREAM_TIMEOUT_MS - MIN_VALIDATION_BUDGET_MS;

    let validatedLens = lensDoc;
    let validatedMetadata = metadata;

    if (hasTimeBudget) {
      try {
        const validationContent = buildValidationUserContent({
          rawDocumentText: truncatedRawText,
          lensMarkdown: lensDoc,
        });

        // Use non-streaming for validation with explicit 30s timeout via AbortController
        // Validation responses are small, so streaming overhead isn't worth it
        const validationController = new AbortController();
        const validationTimeoutId = setTimeout(() => validationController.abort(), VALIDATION_TIMEOUT_MS);

        let validationResponse;
        try {
          const validationResult = await anthropic.messages.create({
            model: MODEL,
            max_tokens: VALIDATION_MAX_TOKENS,
            system: VALIDATION_SYSTEM_PROMPT,
            messages: [{ role: "user", content: validationContent }],
          }, { signal: validationController.signal });
          clearTimeout(validationTimeoutId);
          validationResponse = validationResult.content?.[0]?.text || "";
        } catch (abortErr) {
          clearTimeout(validationTimeoutId);
          if (abortErr.name === "AbortError") {
            console.warn(`[SynthesizePremium] Validation timed out after ${VALIDATION_TIMEOUT_MS / 1000}s, proceeding with un-validated output`);
            throw abortErr; // Caught by outer try-catch, skips validation gracefully
          }
          throw abortErr;
        }

        let gapReport;
        try {
          gapReport = JSON.parse(validationResponse);
        } catch {
          gapReport = { gap_severity: "none" };
        }

        const hasSignificantGaps = gapReport.gap_severity === "high" || gapReport.gap_severity === "medium";
        const hasHallucinations = gapReport.has_hallucinations && gapReport.hallucinations?.some(h => h.severity === "high" || h.severity === "medium");
        const hasSensitivityViolations = gapReport.has_sensitivity_violations && gapReport.sensitivity_violations?.length > 0;

        if (hasSignificantGaps || hasHallucinations || hasSensitivityViolations) {
          console.log(`[SynthesizePremium] Validation found issues, triggering re-synthesis`);
          const revisionAddendum = buildRevisionAddendum(gapReport);
          const revisedSystemPrompt = PREMIUM_SYSTEM_PROMPT + revisionAddendum;

          try {
            const revisedResponse = await callAnthropicStreaming(revisedSystemPrompt, userContent);
            const revisedParsed = parsePremiumSynthesisResponse(revisedResponse);

            const revisedSectionCount = (revisedParsed.markdown.match(/^##\s+/gm) || []).length;
            if (revisedSectionCount >= 4) {
              validatedLens = revisedParsed.markdown;
              if (revisedParsed.metadata) {
                validatedMetadata = revisedParsed.metadata;
              }
            }
          } catch (resynthErr) {
            console.warn("[SynthesizePremium] Re-synthesis failed, keeping original:", resynthErr.message);
          }
        } else {
          console.log(`[SynthesizePremium] Validation passed`);
        }
      } catch (validationErr) {
        console.warn("[SynthesizePremium] Validation step failed:", validationErr.message);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: Sensitivity filter
    // ═══════════════════════════════════════════════════════════════════════
    const { sanitized, violations } = sanitizeLensOutput(validatedLens);

    if (violations.length > 0) {
      console.warn(`[SynthesizePremium] Sensitivity filter caught ${violations.length} violations`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Return premium response
    // ═══════════════════════════════════════════════════════════════════════
    return Response.json({
      lens: sanitized,
      metadata: validatedMetadata || null,
      premium: true,
    });

  } catch (err) {
    console.error("SynthesizePremium route error:", {
      name: err.name,
      message: err.message,
      cause: err.cause,
      stack: err.stack?.split('\n').slice(0, 3).join(' | ')
    });
    return Response.json(
      { error: "Failed to generate premium Lens document" },
      { status: 500 }
    );
  }
}
