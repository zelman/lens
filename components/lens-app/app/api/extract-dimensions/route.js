// /api/extract-dimensions - Extract role-specific dimensions from recruiter context
// Server-side only - system prompt never exposed to client
// Uses streaming to avoid Vercel timeout limits

import {
  EXTRACT_DIMENSIONS_SYSTEM_PROMPT,
  buildDimensionExtractionContent,
} from "../_prompts/extract-dimensions";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4000;
const TEMPERATURE = 0.3; // Low temperature for consistency

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("[extract-dimensions] Missing ANTHROPIC_API_KEY");
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { roleContext } = body;

    // Validate role context
    if (!roleContext || typeof roleContext !== "object") {
      return Response.json(
        { error: "Missing or invalid roleContext" },
        { status: 400 }
      );
    }

    // Check minimum required fields
    if (!roleContext.roleTitle || !roleContext.company) {
      return Response.json(
        { error: "Role title and company are required" },
        { status: 400 }
      );
    }

    // Check payload size (100KB limit for dimension extraction)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 100000) {
      console.log(`[extract-dimensions] Payload rejected: ${payloadSize} bytes exceeds 100KB limit`);
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    // Build user content from role context
    const userContent = buildDimensionExtractionContent(roleContext);
    console.log(`[extract-dimensions] User content length: ${userContent.length} chars`);

    // Call Anthropic API with streaming to avoid Vercel timeout
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        stream: true, // Enable streaming
        system: EXTRACT_DIMENSIONS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("[extract-dimensions] Anthropic API error:", res.status, errorText);
      return Response.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Process streaming response and collect full text
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
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
              fullText += parsed.delta.text;
            } else if (parsed.type === "message_delta" && parsed.delta?.stop_reason) {
              stopReason = parsed.delta.stop_reason;
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      }
    }

    console.log("[extract-dimensions] Stop reason:", stopReason);
    console.log("[extract-dimensions] Response length:", fullText.length);

    if (!fullText) {
      console.error("[extract-dimensions] Empty response from AI");
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Parse JSON response
    let dimensionResult;
    try {
      // Clean up any markdown formatting that might have slipped through
      const cleanText = fullText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      dimensionResult = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("[extract-dimensions] Failed to parse response as JSON:", parseErr.message);
      console.error("[extract-dimensions] Raw response:", fullText.slice(0, 500));

      // Return fallback dimensions for thin context
      return Response.json({
        roleContext: {
          summary: `${roleContext.roleTitle} at ${roleContext.company}`,
          roleTitle: roleContext.roleTitle,
          company: roleContext.company,
        },
        dimensions: [
          {
            id: "role_fit",
            label: "Role Fit",
            importance: "critical",
            sources: ["Role title"],
            whatToExplore: "How well does the candidate's experience align with this role's core responsibilities?",
            signals: ["Relevant experience", "Clear understanding of the role"],
            redFlags: ["Misaligned expectations", "Lack of relevant context"],
          },
          {
            id: "leadership_style",
            label: "Leadership Style",
            importance: "high",
            sources: ["General"],
            whatToExplore: "How does the candidate lead and influence others?",
            signals: ["Clear leadership philosophy", "Concrete examples"],
            redFlags: ["Vague answers", "No concrete examples"],
          },
          {
            id: "culture_alignment",
            label: "Culture Alignment",
            importance: "high",
            sources: ["General"],
            whatToExplore: "Will this person thrive in this company's environment?",
            signals: ["Values alignment", "Work style compatibility"],
            redFlags: ["Mismatched expectations", "Red flags about past environments"],
          },
          {
            id: "motivation",
            label: "Motivation & Timing",
            importance: "moderate",
            sources: ["General"],
            whatToExplore: "Why is this person interested and what's their timeline?",
            signals: ["Clear motivation", "Reasonable timeline"],
            redFlags: ["Unclear motivation", "Unrealistic expectations"],
          },
        ],
        foundationOverlaps: {
          work_style: null,
          values: "culture_alignment",
          essence: null,
          mission_sector: null,
          energy: "motivation",
          disqualifiers: null,
          situation_timeline: "motivation",
        },
        contextQuality: "thin",
        contextWarning: "Unable to parse AI response. Using fallback dimensions. Add more context (documents, detailed objectives) for better results.",
      });
    }

    // Validate dimension count
    if (!dimensionResult.dimensions || dimensionResult.dimensions.length < 4) {
      console.warn("[extract-dimensions] Too few dimensions returned:", dimensionResult.dimensions?.length);
    }

    // Ensure we have the required structure
    if (!dimensionResult.roleContext) {
      dimensionResult.roleContext = {
        summary: `${roleContext.roleTitle} at ${roleContext.company}`,
        roleTitle: roleContext.roleTitle,
        company: roleContext.company,
      };
    }

    if (!dimensionResult.foundationOverlaps) {
      dimensionResult.foundationOverlaps = {
        work_style: null,
        values: null,
        essence: null,
        mission_sector: null,
        energy: null,
        disqualifiers: null,
        situation_timeline: null,
      };
    }

    return Response.json(dimensionResult);

  } catch (err) {
    console.error("[extract-dimensions] Error:", err);
    return Response.json(
      { error: "Failed to extract dimensions" },
      { status: 500 }
    );
  }
}
