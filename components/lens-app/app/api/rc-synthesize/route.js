// /api/rc-synthesize - Generate candidate scorecard from R→C discovery conversation
// System prompts are loaded server-side and NEVER sent to client

import { RC_SYNTHESIS_SYSTEM_PROMPT, buildRCSynthesisUserContent } from "../_prompts/rc-synthesis";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4000;
const TEMPERATURE = 0.3; // Lower temperature for consistent scoring

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

    // Check if we have enough data to generate a scorecard
    const sectionCount = Object.keys(sectionData).length;
    if (sectionCount === 0) {
      return Response.json(
        { error: "No section data to synthesize" },
        { status: 400 }
      );
    }

    console.log(`[RC-Synthesize] Generating scorecard for session ${sessionConfig.sessionId}, ${sectionCount} sections`);

    // Build user content
    const userContent = buildRCSynthesisUserContent({
      sessionConfig,
      sectionData,
      candidateContext: candidateContext || null,
    });

    // Call Anthropic API
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

    const data = await res.json();
    const text = data.content?.find(b => b.type === "text")?.text;

    if (!text) {
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Parse JSON response
    let scorecard;
    try {
      // Handle potential markdown code blocks that the AI might include
      let jsonText = text.trim();

      // Remove markdown code blocks if present
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      scorecard = JSON.parse(jsonText);

      // Validate required fields
      if (!scorecard.overallAssessment || !scorecard.dimensionScores) {
        throw new Error("Missing required scorecard fields");
      }

    } catch (parseErr) {
      console.error("[RC-Synthesize] Failed to parse scorecard JSON:", parseErr);
      console.error("[RC-Synthesize] Raw response:", text.slice(0, 500));

      // Return a fallback scorecard structure with error
      return Response.json({
        scorecard: null,
        error: "Failed to parse scorecard",
        rawResponse: text.slice(0, 2000), // Include partial raw response for debugging
      });
    }

    // Add metadata
    scorecard.generatedAt = new Date().toISOString();
    scorecard.sessionId = sessionConfig.sessionId;

    console.log(`[RC-Synthesize] Scorecard generated: fitScore=${scorecard.overallAssessment?.fitScore}, recommendation=${scorecard.overallAssessment?.recommendation}`);

    return Response.json({ scorecard });

  } catch (err) {
    console.error("[RC-Synthesize] Route error:", err);
    return Response.json(
      { error: "Request failed" },
      { status: 500 }
    );
  }
}
