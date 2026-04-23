// /api/rc-synthesize - Generate candidate lens document from R→C discovery conversation
// The lens is a conversation catalyst, not an assessment verdict
// System prompts are loaded server-side and NEVER sent to client
// Includes post-synthesis validation gate (ported from /api/synthesize)

import { RC_SYNTHESIS_SYSTEM_PROMPT, buildRCSynthesisUserContent } from "../_prompts/rc-synthesis";
import { VALIDATION_SYSTEM_PROMPT, buildValidationUserContent, buildRevisionAddendum } from "../_prompts/validation";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 6000; // Lens documents require extended token limit for 7-section narrative
const VALIDATION_MAX_TOKENS = 1500; // Gap report is smaller
// Note: temperature param removed — deprecated in Claude 4.5+ models

// Timeout budget management (Vercel Pro = 60s, leave 2s buffer)
const REQUEST_DEADLINE_MS = 58000;
const MIN_VALIDATION_BUDGET_MS = 20000; // Skip validation if less than 20s remaining

// ═══════════════════════════════════════════════════════════════════════
// HARD POST-PROCESSING FILTER - catches clinical labels that slip through
// Matches /api/synthesize implementation for parity
// ═══════════════════════════════════════════════════════════════════════

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
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

// Build source material for validation from R→C conversation data
// (R→C doesn't have rawDocumentText; we use sectionData summaries instead)
function buildRCSourceMaterial(sectionData, sessionConfig) {
  const parts = [];

  // Include role context
  const meta = sessionConfig?.metadata || {};
  if (meta.roleTitle || meta.company) {
    parts.push(`Role Context: ${meta.roleTitle || "Unknown"} at ${meta.company || "Unknown"}`);
  }

  // Include all section summaries as source material
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

    console.log(`[RC-Synthesize] Generating lens for session ${sessionConfig.sessionId}, ${sectionCount} sections`);

    // ═══════════════════════════════════════════════════════════════════════
    // TIMEOUT BUDGET MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    const requestStart = Date.now();
    const getRemainingTimeout = () => Math.max(5000, REQUEST_DEADLINE_MS - (Date.now() - requestStart));

    // Build user content
    let userContent;
    try {
      userContent = buildRCSynthesisUserContent({
        sessionConfig,
        sectionData,
        candidateContext: candidateContext || null,
      });
      console.log(`[RC-Synthesize] userContent: ${userContent.length} chars, prompt: ${RC_SYNTHESIS_SYSTEM_PROMPT.length} chars`);
    } catch (buildErr) {
      console.error("[RC-Synthesize] buildRCSynthesisUserContent failed:", buildErr.message);
      throw buildErr;
    }

    // Helper for non-streaming API calls (used for validation and re-synthesis)
    const callAnthropicNonStreaming = async (systemPrompt, content, maxTokens = MAX_TOKENS) => {
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
        console.error("[RC-Synthesize] Anthropic API error:", res.status, errorText);
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text;

      if (!text) {
        throw new Error("Empty response from AI");
      }

      return text;
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Initial Synthesis (streaming for large output)
    // ═══════════════════════════════════════════════════════════════════════
    const phase1Budget = getRemainingTimeout();
    console.log(`[RC-Synthesize] Phase 1 starting, budget: ${Math.round(phase1Budget / 1000)}s`);
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
        max_tokens: MAX_TOKENS,
        stream: true,
        system: RC_SYNTHESIS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "unknown");
      console.error(`[RC-Synthesize] Anthropic API error: ${res.status}`, errorBody);
      return Response.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Process streaming response
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let lensDoc = "";
    let stopReason = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              lensDoc += parsed.delta.text;
            } else if (parsed.type === "message_delta" && parsed.delta?.stop_reason) {
              stopReason = parsed.delta.stop_reason;
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      }
    }

    console.log("[RC-Synthesize] Phase 1 complete. Stop reason:", stopReason, "Length:", lensDoc.length);

    if (!lensDoc) {
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    if (stopReason === "max_tokens") {
      console.warn("[RC-Synthesize] Response truncated - max_tokens reached");
    }

    // Validate lens has required sections
    const sectionHeadingCount = (lensDoc.match(/^##\s+/gm) || []).length;
    if (sectionHeadingCount < 5) {
      console.error(`[RC-Synthesize] Lens has only ${sectionHeadingCount} sections`);
      return Response.json(
        { error: "Generated lens is incomplete. Please try again." },
        { status: 500 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Validation Gate (if time budget allows)
    // ═══════════════════════════════════════════════════════════════════════
    const remainingBudget = getRemainingTimeout();
    const hasTimeBudget = remainingBudget >= MIN_VALIDATION_BUDGET_MS;

    if (!hasTimeBudget) {
      console.log(`[RC-Synthesize] Skipping validation - only ${Math.round(remainingBudget / 1000)}s remaining (need ${MIN_VALIDATION_BUDGET_MS / 1000}s)`);
    }

    // Build source material from sectionData for validation
    const rcSourceMaterial = buildRCSourceMaterial(sectionData, sessionConfig);
    const validationContent = hasTimeBudget && rcSourceMaterial.length > 100
      ? buildValidationUserContent({
          rawDocumentText: rcSourceMaterial,
          lensMarkdown: lensDoc,
        })
      : null;

    if (validationContent) {
      try {
        const validationResponse = await callAnthropicNonStreaming(
          VALIDATION_SYSTEM_PROMPT,
          validationContent,
          VALIDATION_MAX_TOKENS
        );

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
          const resynthBudget = getRemainingTimeout();
          if (resynthBudget < 15000) {
            console.log(`[RC-Synthesize] Validation found issues (${reasons.join(", ")}) but only ${Math.round(resynthBudget / 1000)}s remaining - skipping re-synthesis`);
          } else {
            console.log(`[RC-Synthesize] Validation found issues: ${reasons.join(", ")}, triggering re-synthesis (${Math.round(resynthBudget / 1000)}s remaining)`);

            // Build revision addendum and append to original synthesis prompt
            const revisionAddendum = buildRevisionAddendum(gapReport);
            const revisedSystemPrompt = RC_SYNTHESIS_SYSTEM_PROMPT + revisionAddendum;

            // Re-run synthesis with gap instructions
            try {
              const revisedLens = await callAnthropicNonStreaming(revisedSystemPrompt, userContent);

              // Validate revised output before accepting it
              const revisedSectionCount = (revisedLens.match(/^##\s+/gm) || []).length;
              if (revisedSectionCount < 5) {
                console.warn(`[RC-Synthesize] Re-synthesis produced only ${revisedSectionCount} sections, keeping original`);
              } else {
                lensDoc = revisedLens;
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
    // PHASE 4: Return final lens document
    // ═══════════════════════════════════════════════════════════════════════
    console.log(`[RC-Synthesize] Lens generated successfully`);

    return Response.json({ lens: sanitized });

  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError' || err.message?.includes('timeout');
    console.error("[RC-Synthesize] Route error:", {
      name: err.name,
      message: err.message,
      isTimeout,
      stack: err.stack?.split('\n').slice(0, 3).join(' | ')
    });
    return Response.json(
      { error: "Failed to generate lens document" },
      { status: 500 }
    );
  }
}
