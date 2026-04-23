// /api/merge - Server-side proxy for merging updated sections into existing lens
// Merge prompt is loaded server-side and NEVER sent to client

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 4000;

// Server-side merge prompt (never exposed to client)
const MERGE_SYSTEM_PROMPT = "You are merging an updated section into an existing lens document. Preserve the document structure, YAML frontmatter format, and all other sections unchanged. Only update the specific section that was re-discovered.";

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
    const { existingLens, sectionLabel, updatedContent } = body;

    // Validate required fields
    if (!existingLens || typeof existingLens !== "string") {
      return Response.json(
        { error: "Missing or invalid existingLens" },
        { status: 400 }
      );
    }

    if (!sectionLabel || typeof sectionLabel !== "string") {
      return Response.json(
        { error: "Missing or invalid sectionLabel" },
        { status: 400 }
      );
    }

    if (!updatedContent || typeof updatedContent !== "string") {
      return Response.json(
        { error: "Missing or invalid updatedContent" },
        { status: 400 }
      );
    }

    // Check payload size (200KB limit)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 200000) {
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    // Build user message (server-side)
    const userMessage = `Here is the user's existing lens document:

${existingLens}

They have just updated the "${sectionLabel}" section. Here is the new content for that section:

${updatedContent}

Merge this updated section into the existing lens document. Keep everything else intact. Only update the ${sectionLabel} section (both narrative and any related YAML frontmatter signals). Return the complete updated lens document.`;

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
        system: MERGE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic API error:", res.status);
      return Response.json(
        { error: "Failed to merge section" },
        { status: 503 }
      );
    }

    const data = await res.json();
    const mergedDoc = data.content?.[0]?.text;

    if (!mergedDoc) {
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Return merged document (no API metadata)
    return Response.json({
      lens: mergedDoc,
    });

  } catch (err) {
    console.error("Merge route error:", err);
    return Response.json(
      { error: "Failed to merge section" },
      { status: 500 }
    );
  }
}
