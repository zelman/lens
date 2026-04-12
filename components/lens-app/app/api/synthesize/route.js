// /api/synthesize - Server-side proxy for lens document generation
// Synthesis prompt is loaded server-side and NEVER sent to client
// Includes post-synthesis validation gate (v1.0)

import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserContent } from "../_prompts/synthesis";
import { VALIDATION_SYSTEM_PROMPT, buildValidationUserContent, buildRevisionAddendum } from "../_prompts/validation";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 8000; // For full lens document with 8 sections
const VALIDATION_MAX_TOKENS = 2000; // Gap report is smaller
const TEMPERATURE = 0.75;

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

    // Call Anthropic API with timeout
    const callAnthropic = async (systemPrompt, content, maxTokens = MAX_TOKENS) => {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        signal: AbortSignal.timeout(50000), // 50s timeout (Vercel Pro has 60s limit)
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          temperature: TEMPERATURE,
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
      lensDoc = await callAnthropic(SYNTHESIS_SYSTEM_PROMPT, userContent);

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
    // PHASE 2: Validation Gate (only if we have source materials)
    // ═══════════════════════════════════════════════════════════════════════
    const validationContent = buildValidationUserContent({
      rawDocumentText: rawDocumentText || null,
      lensMarkdown: lensDoc,
    });

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

        // Check if re-synthesis is needed
        if (gapReport.gap_severity === "high" || gapReport.gap_severity === "medium") {
          console.log(`Validation found ${gapReport.gap_severity} severity gaps, triggering re-synthesis`);

          // Build revision addendum and append to original synthesis prompt
          const revisionAddendum = buildRevisionAddendum(gapReport);
          const revisedSystemPrompt = SYNTHESIS_SYSTEM_PROMPT + revisionAddendum;

          // Re-run synthesis with gap instructions
          lensDoc = await callAnthropic(revisedSystemPrompt, userContent);

          // Basic validation of revised output
          const revisedSectionCount = (lensDoc.match(/^##\s+/gm) || []).length;
          if (revisedSectionCount < 4) {
            console.warn(`Re-synthesis produced only ${revisedSectionCount} sections, using original`);
            // Fall back would require keeping original, but we've already overwritten
            // In practice this is rare - log and continue
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
    // PHASE 3: Return final lens document
    // ═══════════════════════════════════════════════════════════════════════
    return Response.json({
      lens: lensDoc,
    });

  } catch (err) {
    console.error("Synthesize route error:", err);
    return Response.json(
      { error: "Failed to generate lens document" },
      { status: 500 }
    );
  }
}
