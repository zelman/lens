// /api/score - Server-side proxy for R→C candidate scoring
// Accepts scorer requests and returns structured score data with dimensions block
// Build: 2026.04.30-score-dimensions

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

// Map current score keys to standardized dimension keys
const DIMENSION_MAP = {
  builder_orientation: "role",
  relational_fit: "culture",
  domain_fluency: "skill",
  values_alignment: "mission",
  work_style_compatibility: "work_style",
  energy_match: "energy",
};

// Transform scores object to dimensions format
function transformToDimensions(scores) {
  if (!scores || typeof scores !== "object") return null;

  const dimensions = {};
  for (const [oldKey, newKey] of Object.entries(DIMENSION_MAP)) {
    const scoreData = scores[oldKey];
    if (scoreData) {
      dimensions[newKey] = {
        score: scoreData.score,
        confidence: scoreData.confidence ?? null,
        evidence: scoreData.rationale || null,
      };
    }
  }
  return dimensions;
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

    // Support both legacy format (system, userMessage) and scorer format (systemPrompt, roleLens, candidateInput)
    let system, userMessage;

    if (body.systemPrompt && body.roleLens && body.candidateInput) {
      // Scorer page format
      system = body.systemPrompt;
      userMessage = `ROLE LENS:\n${body.roleLens}\n\nCANDIDATE PROFILE:\n${body.candidateInput}`;
    } else if (body.system && body.userMessage) {
      // Legacy format
      system = body.system;
      userMessage = body.userMessage;
    } else {
      return Response.json(
        { error: "Missing required fields: provide (systemPrompt, roleLens, candidateInput) or (system, userMessage)" },
        { status: 400 }
      );
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message || "Anthropic API error" },
        { status: response.status }
      );
    }

    // Parse Claude's JSON response from content
    const textContent = data.content?.[0]?.text;
    if (!textContent) {
      return Response.json(
        { error: "No response content from model" },
        { status: 500 }
      );
    }

    let scoreData;
    try {
      scoreData = JSON.parse(textContent);
    } catch (parseErr) {
      // If Claude didn't return valid JSON, return the raw text with error flag
      return Response.json(
        { error: "Model response was not valid JSON", raw: textContent },
        { status: 500 }
      );
    }

    // Add dimensions block (transformed from scores)
    if (scoreData.scores) {
      scoreData.dimensions = transformToDimensions(scoreData.scores);
    }

    return Response.json(scoreData);

  } catch (err) {
    console.error("[/api/score] Error:", err);
    return Response.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
