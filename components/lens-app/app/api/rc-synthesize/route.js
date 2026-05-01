// /api/rc-synthesize - Generate candidate lens document from R→C discovery conversation
// The lens is a conversation catalyst, not an assessment verdict
// System prompts are loaded server-side and NEVER sent to client
// Includes post-synthesis validation gate (ported from /api/synthesize)
// v1.1: SDK streaming to avoid Vercel timeout cliff (matches /api/synthesize pattern)
// v1.2: Premium metadata output for radar chart, essence statement, key phrases

import Anthropic from "@anthropic-ai/sdk";
import { RC_SYNTHESIS_SYSTEM_PROMPT, RC_PREMIUM_METADATA_INSTRUCTIONS, buildRCSynthesisUserContent, parsePremiumSynthesisResponse } from "../_prompts/rc-synthesis";
import { VALIDATION_SYSTEM_PROMPT, buildValidationUserContent, buildRevisionAddendum } from "../_prompts/validation";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8000; // Premium output: 7-section narrative + metadata JSON block
const VALIDATION_MAX_TOKENS = 1500; // Gap report is smaller
// Note: temperature param removed — deprecated in Claude 4.5+ models

// Full system prompt with premium metadata instructions appended
const FULL_SYSTEM_PROMPT = RC_SYNTHESIS_SYSTEM_PROMPT + RC_PREMIUM_METADATA_INSTRUCTIONS;

// Streaming eliminates the hard timeout cliff - Vercel timeout applies to time between bytes, not total request time
const STREAM_TIMEOUT_MS = 120000; // 2 min total budget now safe with streaming
const MIN_VALIDATION_BUDGET_MS = 30000; // More time for validation since we're not racing the clock

// ═══════════════════════════════════════════════════════════════════════
// HARD POST-PROCESSING FILTER - catches clinical labels that slip through
// Matches /api/synthesize implementation for parity
// ═══════════════════════════════════════════════════════════════════════

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

// Build source material for validation from R→C data
// Priority: candidateContext.resumeText (actual resume) > sectionData (conversation summaries)
function buildRCSourceMaterial(sectionData, sessionConfig, candidateContext) {
  const parts = [];

  // Include role context
  const meta = sessionConfig?.metadata || {};
  if (meta.roleTitle || meta.company) {
    parts.push(`Role Context: ${meta.roleTitle || "Unknown"} at ${meta.company || "Unknown"}`);
  }

  // PRIMARY: Include actual resume text if available (this is what validation needs!)
  if (candidateContext?.resumeText && candidateContext.resumeText.trim().length > 100) {
    parts.push(`[RESUME]\n${candidateContext.resumeText}`);
  }

  // Include supporting docs if available
  if (candidateContext?.supportingDocsText && candidateContext.supportingDocsText.trim().length > 50) {
    parts.push(`[SUPPORTING DOCUMENTS]\n${candidateContext.supportingDocsText}`);
  }

  // SECONDARY: Include section summaries as conversation context
  for (const [sectionId, data] of Object.entries(sectionData || {})) {
    const content = typeof data === "string" ? data : (data?.summary || "");
    if (content.trim()) {
      parts.push(`[${sectionId}]\n${content}`);
    }
  }

  return parts.join("\n\n");
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  // Initialize SDK client
  const anthropic = new Anthropic({ apiKey });

  try {
    const body = await request.json();
    const { sessionConfig, sectionData, candidateContext } = body;

    // Validate session config
    if (!sessionConfig || !sessionConfig.sessionId) {
      return Response.json(
        { error: "Missing session configuration" },
        { status: 400 }
      );
    }

    // Validate section data
    if (!sectionData || typeof sectionData !== "object") {
      return Response.json(
        { error: "Missing section data" },
        { status: 400 }
      );
    }

    const sectionCount = Object.keys(sectionData).length;
    if (sectionCount === 0) {
      return Response.json(
        { error: "No section data to synthesize" },
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

    console.log(`[RC-Synthesize] Generating lens for session ${sessionConfig.sessionId}, ${sectionCount} sections, payload: ${payloadSize} bytes`);

    // ═══════════════════════════════════════════════════════════════════════
    // TIMEOUT BUDGET MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    const requestStart = Date.now();

    // Build user content with premium metadata flag
    let userContent;
    try {
      userContent = buildRCSynthesisUserContent({
        sessionConfig,
        sectionData,
        candidateContext: candidateContext || null,
        includePremiumMetadata: true,
      });
      console.log(`[RC-Synthesize] userContent: ${userContent.length} chars, prompt: ${FULL_SYSTEM_PROMPT.length} chars`);
    } catch (buildErr) {
      console.error("[RC-Synthesize] buildRCSynthesisUserContent failed:", buildErr.message);
      throw buildErr;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SDK STREAMING HELPER
    // Vercel's timeout applies to time between bytes, not total request time
    // A 90-second generation that streams chunks every 500ms will succeed
    // ═══════════════════════════════════════════════════════════════════════
    const callAnthropicStreaming = async (systemPrompt, content, maxTokens = MAX_TOKENS) => {
      const streamStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

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
        console.log(`[RC-Synthesize] Stream complete: ${chunkCount} chunks, ${fullResponse.length} chars, ${Math.round(streamDuration / 1000)}s`);

        if (!fullResponse) {
          throw new Error("Empty response from AI");
        }

        // Check final message for stop reason
        const finalMessage = await stream.finalMessage();
        if (finalMessage.stop_reason === "max_tokens") {
          console.warn("[RC-Synthesize] Response was truncated due to max_tokens limit");
        }

        return fullResponse;

      } catch (error) {
        clearTimeout(timeoutId);

        const elapsed = Math.round((Date.now() - streamStart) / 1000);

        if (error.name === "AbortError") {
          console.error(`[RC-Synthesize] Stream timed out after ${elapsed}s`);
          throw new Error(`Synthesis timed out after ${STREAM_TIMEOUT_MS / 1000}s`);
        }

        console.error(`[RC-Synthesize] Stream failed after ${elapsed}s, ${chunkCount} chunks: ${error.message}`);
        throw error;
      }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Initial Synthesis (SDK streaming for large output)
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`[RC-Synthesize] Phase 1 starting with SDK streaming (premium metadata enabled)`);
    let rawResponse = await callAnthropicStreaming(FULL_SYSTEM_PROMPT, userContent);

    // Parse response to extract markdown and metadata
    let { markdown: lensDoc, metadata, parseError } = parsePremiumSynthesisResponse(rawResponse);
    if (parseError) {
      console.warn(`[RC-Synthesize] Metadata parse warning: ${parseError}`);
    }
    if (metadata) {
      console.log(`[RC-Synthesize] Extracted metadata with soft_gates:`, Object.keys(metadata.soft_gates || {}));
    }

    console.log("[RC-Synthesize] Phase 1 complete. Length:", lensDoc.length);

    if (!lensDoc) {
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Validate lens has required sections
    const sectionHeadingCount = (lensDoc.match(/^##\s+/gm) || []).length;
    if (sectionHeadingCount < 5) {
      console.error(`[RC-Synthesize] Lens has only ${sectionHeadingCount} sections`);
      return Response.json(
        { error: "Generated Lens is incomplete. Please try again." },
        { status: 500 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Validation Gate (if time budget allows)
    // ═══════════════════════════════════════════════════════════════════════
    const elapsedMs = Date.now() - requestStart;
    const remainingBudget = STREAM_TIMEOUT_MS - elapsedMs;
    const hasTimeBudget = remainingBudget >= MIN_VALIDATION_BUDGET_MS;

    if (!hasTimeBudget) {
      console.log(`[RC-Synthesize] Skipping validation - only ${Math.round(remainingBudget / 1000)}s remaining (need ${MIN_VALIDATION_BUDGET_MS / 1000}s)`);
    }

    // Build source material for validation (includes resume + supporting docs if available)
    const rcSourceMaterial = buildRCSourceMaterial(sectionData, sessionConfig, candidateContext);
    const validationContent = hasTimeBudget && rcSourceMaterial.length > 100
      ? buildValidationUserContent({
          rawDocumentText: rcSourceMaterial,
          lensMarkdown: lensDoc,
        })
      : null;

    if (validationContent) {
      // Calculate validation budget - cap at 30s or remaining budget - 5s (whichever is smaller)
      const validationBudgetMs = Math.min(30000, remainingBudget - 5000);

      // Skip validation entirely if insufficient budget (< 10s isn't enough for a meaningful check)
      if (validationBudgetMs < 10000) {
        console.log(`[RC-Synthesize] Skipping validation - insufficient budget (${Math.round(validationBudgetMs / 1000)}s)`);
      } else {
        try {
          const validationController = new AbortController();
          const validationTimeout = setTimeout(() => validationController.abort(), validationBudgetMs);

          let validationResult;
          try {
            validationResult = await anthropic.messages.create({
              model: MODEL,
              max_tokens: VALIDATION_MAX_TOKENS,
              system: VALIDATION_SYSTEM_PROMPT,
              messages: [{ role: "user", content: validationContent }],
            }, { signal: validationController.signal });
            clearTimeout(validationTimeout);
          } catch (abortErr) {
            clearTimeout(validationTimeout);
            if (abortErr.name === "AbortError") {
              console.warn(`[RC-Synthesize] Validation timed out after ${validationBudgetMs / 1000}s, proceeding with un-validated output`);
              throw abortErr; // Will be caught by outer try-catch and skip validation gracefully
            }
            throw abortErr;
          }
          const validationResponse = validationResult.content?.[0]?.text || "";

          // Parse gap report JSON
          let gapReport;
          try {
            gapReport = JSON.parse(validationResponse);
          } catch (parseErr) {
            console.warn("[RC-Synthesize] Failed to parse validation response as JSON:", parseErr.message);
            gapReport = { gap_severity: "none" };
          }

          // Check if re-synthesis is needed
          const hasSignificantGaps = gapReport.gap_severity === "high" || gapReport.gap_severity === "medium";
          const hasHallucinations = gapReport.has_hallucinations && gapReport.hallucinations?.some(h => h.severity === "high" || h.severity === "medium");
          const hasSensitivityViolations = gapReport.has_sensitivity_violations && gapReport.sensitivity_violations?.length > 0;

          if (hasSignificantGaps || hasHallucinations || hasSensitivityViolations) {
            const reasons = [];
            if (hasSensitivityViolations) reasons.push("sensitivity violations");
            if (hasHallucinations) reasons.push("hallucinations");
            if (hasSignificantGaps) reasons.push("gaps");

            // Check if we have enough time budget for re-synthesis (~15s minimum)
            const resynthBudget = STREAM_TIMEOUT_MS - (Date.now() - requestStart);
            if (resynthBudget < 15000) {
              console.log(`[RC-Synthesize] Validation found issues (${reasons.join(", ")}) but only ${Math.round(resynthBudget / 1000)}s remaining - skipping re-synthesis`);
            } else {
              console.log(`[RC-Synthesize] Validation found issues: ${reasons.join(", ")}, triggering re-synthesis (${Math.round(resynthBudget / 1000)}s remaining)`);

              // Build revision addendum and append to full system prompt (with premium metadata)
              const revisionAddendum = buildRevisionAddendum(gapReport);
              const revisedSystemPrompt = FULL_SYSTEM_PROMPT + revisionAddendum;

              // Re-run synthesis with gap instructions (use streaming for large output)
              try {
                const revisedRawResponse = await callAnthropicStreaming(revisedSystemPrompt, userContent);
                const revisedParsed = parsePremiumSynthesisResponse(revisedRawResponse);

                // Validate revised output before accepting it
                const revisedSectionCount = (revisedParsed.markdown.match(/^##\s+/gm) || []).length;
                if (revisedSectionCount < 5) {
                  console.warn(`[RC-Synthesize] Re-synthesis produced only ${revisedSectionCount} sections, keeping original`);
                } else {
                  lensDoc = revisedParsed.markdown;
                  metadata = revisedParsed.metadata || metadata; // Keep original metadata if re-synthesis didn't produce any
                  console.log("[RC-Synthesize] Re-synthesis accepted");
                }
              } catch (resynthErr) {
                console.warn("[RC-Synthesize] Re-synthesis failed, keeping original:", resynthErr.message);
              }
            }
          } else {
            console.log(`[RC-Synthesize] Validation passed with severity: ${gapReport.gap_severity || "none"}`);
          }
        } catch (validationErr) {
          // Validation is a quality gate, not a hard requirement
          console.warn("[RC-Synthesize] Validation step failed, continuing with original synthesis:", validationErr.message);
        }
      } // end else (sufficient budget)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: Hard post-processing filter (catches anything that slipped through)
    // ═══════════════════════════════════════════════════════════════════════
    const { sanitized, violations } = sanitizeLensOutput(lensDoc);

    if (violations.length > 0) {
      console.warn(`[RC-Synthesize] Sensitivity filter caught ${violations.length} violations:`,
        violations.map(v => v.type === "sentence" ? `[sentence removed]` : v.original).join(", ")
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Return final lens document with metadata
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`[RC-Synthesize] Lens generated successfully (metadata: ${metadata ? 'yes' : 'no'})`);

    return Response.json({
      lens: sanitized,
      metadata: metadata || null,
      premium: true,
    });

  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError' || err.message?.includes('timeout');
    console.error("[RC-Synthesize] Route error:", {
      name: err.name,
      message: err.message,
      isTimeout,
      stack: err.stack?.split('\n').slice(0, 3).join(' | ')
    });
    return Response.json(
      { error: "Failed to generate Lens document" },
      { status: 500 }
    );
  }
}
