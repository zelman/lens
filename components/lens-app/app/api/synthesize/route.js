// /api/synthesize - Server-side proxy for lens document generation
// Synthesis prompt is loaded server-side and NEVER sent to client

import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserContent } from "../_prompts/synthesis";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 8000; // Increased for full lens document with 8 sections
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
    const callAnthropic = async () => {
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
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          system: SYNTHESIS_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
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
        console.warn("Synthesis response was truncated due to max_tokens limit");
      }

      return text;
    };

    // First attempt
    let lensDoc = await callAnthropic();

    // Validate output has enough sections (retry once if malformed)
    const sectionHeadingCount = (lensDoc.match(/^##\s+/gm) || []).length;
    if (sectionHeadingCount < 4) {
      console.warn(`Synthesis produced only ${sectionHeadingCount} sections, retrying...`);
      lensDoc = await callAnthropic();

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

    // Return the lens document (no API metadata)
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
