// /api/generate-session - Generate session config from reviewed dimensions
// Server-side only - system prompt never exposed to client

import {
  GENERATE_SESSION_SYSTEM_PROMPT,
  buildSessionGenerationContent,
} from "../_prompts/generate-session";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 6000;
const TEMPERATURE = 0.5; // Slightly higher for natural conversation flow

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("[generate-session] Missing ANTHROPIC_API_KEY");
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { dimensions, candidateMaterials } = body;

    // Validate dimensions
    if (!dimensions || typeof dimensions !== "object") {
      return Response.json(
        { error: "Missing or invalid dimensions" },
        { status: 400 }
      );
    }

    // Check minimum dimension count
    if (!dimensions.dimensions || dimensions.dimensions.length < 1) {
      return Response.json(
        { error: "At least one dimension is required" },
        { status: 400 }
      );
    }

    // Check role context
    if (!dimensions.roleContext?.roleTitle || !dimensions.roleContext?.company) {
      return Response.json(
        { error: "Role title and company are required in roleContext" },
        { status: 400 }
      );
    }

    // Check payload size (200KB limit for session generation)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 200000) {
      console.log(`[generate-session] Payload rejected: ${payloadSize} bytes exceeds 200KB limit`);
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    // Build user content from dimensions and candidate materials
    const userContent = buildSessionGenerationContent(dimensions, candidateMaterials);

    // Call Anthropic API
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(58000), // 58s timeout (tight for Vercel Pro)
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: GENERATE_SESSION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("[generate-session] Anthropic API error:", res.status, errorText);
      return Response.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 }
      );
    }

    const data = await res.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      console.error("[generate-session] Empty response from AI");
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Parse JSON response
    let sessionConfig;
    try {
      // Clean up any markdown formatting that might have slipped through
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      sessionConfig = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("[generate-session] Failed to parse response as JSON:", parseErr.message);
      console.error("[generate-session] Raw response:", text.slice(0, 500));
      return Response.json(
        { error: "Failed to generate session config. Please try again." },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!sessionConfig.sessionId) {
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const company = dimensions.roleContext.company.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
      const role = dimensions.roleContext.roleTitle.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);
      sessionConfig.sessionId = `ses_${company}_${role}_${timestamp}`;
    }

    if (!sessionConfig.metadata) {
      sessionConfig.metadata = {
        roleTitle: dimensions.roleContext.roleTitle,
        company: dimensions.roleContext.company,
        estimatedDuration: "15-25 minutes",
        candidatePreloaded: !!candidateMaterials,
        generatedAt: new Date().toISOString(),
      };
    }

    if (!sessionConfig.conversationConfig) {
      sessionConfig.conversationConfig = {
        model: "claude-sonnet-4-20250514",
        maxTokens: 6000,
        temperature: 0.5,
        tone: "Warm, curious, coaching-style. Non-evaluative.",
        transparency: "Tell the candidate this session is tailored to the opportunity",
        pacing: "Don't rush. Let silences happen. Follow the candidate's energy.",
        transitions: "Move naturally between topics. Don't announce sections.",
        thinSignalProtocol: "Probe once. If still thin, note it and move on.",
        unexpectedDepth: "If relevant, follow the candidate's lead.",
      };
    }

    return Response.json(sessionConfig);

  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      console.error("[generate-session] Request timed out");
      return Response.json(
        { error: "Request timed out. Please try again." },
        { status: 504 }
      );
    }

    console.error("[generate-session] Error:", err);
    return Response.json(
      { error: "Failed to generate session" },
      { status: 500 }
    );
  }
}
