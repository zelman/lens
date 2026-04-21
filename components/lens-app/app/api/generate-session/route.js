// /api/generate-session - Generate session config from reviewed dimensions
// Server-side only - system prompt never exposed to client
// Uses streaming to avoid Vercel timeout limits

import {
  GENERATE_SESSION_SYSTEM_PROMPT,
  buildSessionGenerationContent,
} from "../_prompts/generate-session";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4000; // Enough for full session config JSON
const TEMPERATURE = 0.5; // Slightly higher for natural conversation flow

// Helper: Try to find a valid JSON substring by progressively truncating
function findLastValidJson(text) {
  // Find positions of closing braces that might end valid JSON
  const closingPositions = [];
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) closingPositions.push(i + 1);
    }
  }

  // Try each potential end point from longest to shortest
  for (let i = closingPositions.length - 1; i >= 0; i--) {
    const candidate = text.slice(0, closingPositions[i]);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

export async function POST(request) {
  console.log("[generate-session] Request received");
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
    console.log("[generate-session] Parsed body, dimensions count:", body.dimensions?.dimensions?.length);
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
    console.log(`[generate-session] User content length: ${userContent.length} chars`);

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

            // Handle different event types
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              fullText += parsed.delta.text;
            } else if (parsed.type === "message_delta" && parsed.delta?.stop_reason) {
              stopReason = parsed.delta.stop_reason;
            } else if (parsed.type === "message_stop") {
              // End of message
            }
          } catch (e) {
            // Skip non-JSON lines (like event: lines)
          }
        }
      }
    }

    console.log("[generate-session] Stop reason:", stopReason);
    console.log("[generate-session] Response length:", fullText.length);

    if (!fullText) {
      console.error("[generate-session] Empty response from AI");
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Check if response was truncated
    if (stopReason === "max_tokens") {
      console.error("[generate-session] Response truncated - max_tokens reached");
      return Response.json(
        { error: "Session config generation truncated. Please try again." },
        { status: 500 }
      );
    }

    // Parse JSON response with repair attempts
    let sessionConfig;
    let cleanText = fullText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    console.log("[generate-session] Clean text first 200 chars:", cleanText.slice(0, 200));
    console.log("[generate-session] Clean text last 200 chars:", cleanText.slice(-200));

    // First attempt: direct parse
    try {
      sessionConfig = JSON.parse(cleanText);
    } catch (parseErr1) {
      console.log("[generate-session] First parse failed, attempting repairs...");
      console.log("[generate-session] Parse error:", parseErr1.message);

      // Repair attempt 1: Fix unescaped control characters in strings
      let repairedText = cleanText
        .replace(/[\x00-\x1F\x7F]/g, (char) => {
          // Keep newlines and tabs that might be intentional, escape others
          if (char === '\n' || char === '\r' || char === '\t') return char;
          return '';
        });

      // Repair attempt 2: Fix trailing commas before } or ]
      repairedText = repairedText
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');

      // Repair attempt 3: Fix malformed string values that accidentally start new objects
      // Pattern: "key": "value text...Schema": { -> "key": "value text..."
      // This happens when Claude accidentally continues into another property
      repairedText = repairedText
        .replace(/"([^"]*?)([a-zA-Z]+)":\s*\{/g, (match, before, word, offset) => {
          // Only fix if this looks like it's inside a string value (not a real property)
          // Check if there's an unclosed string before this
          const textBefore = repairedText.slice(Math.max(0, offset - 200), offset);
          const quoteCount = (textBefore.match(/"/g) || []).length;
          // If odd number of quotes, we're inside a string - truncate
          if (quoteCount % 2 === 1) {
            console.log("[generate-session] Repair: truncating malformed string at:", word);
            return `"${before.slice(0, -word.length).trim()}"`;
          }
          return match;
        });

      try {
        sessionConfig = JSON.parse(repairedText);
        console.log("[generate-session] Repair successful");
      } catch (parseErr2) {
        console.log("[generate-session] Repair attempt 2 failed:", parseErr2.message);

        // Repair attempt 4: Try truncating at the last valid closing brace
        const lastValidClose = findLastValidJson(cleanText);
        if (lastValidClose) {
          try {
            sessionConfig = JSON.parse(lastValidClose);
            console.log("[generate-session] Truncation repair successful");
          } catch (parseErr3) {
            // Fall through to error handling
          }
        }
      }

      if (!sessionConfig) {
        // Extract error position for debugging
        const posMatch = parseErr1.message.match(/position (\d+)/);
        const errorPos = posMatch ? parseInt(posMatch[1]) : null;
        const contextAround = errorPos ? cleanText.slice(Math.max(0, errorPos - 100), errorPos + 100) : null;

        console.error("[generate-session] Failed to parse response as JSON:", parseErr1.message);
        console.error("[generate-session] Context around error:", contextAround);
        return Response.json(
          {
            error: "Failed to generate session config. Please try again.",
            debug: {
              parseError: parseErr1.message,
              responseStart: fullText.slice(0, 500),
              responseEnd: fullText.slice(-300),
              contextAroundError: contextAround,
              stopReason,
              responseLength: fullText.length
            }
          },
          { status: 500 }
        );
      }
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
        maxTokens: 2500,
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
    console.error("[generate-session] Error:", err);
    return Response.json(
      { error: "Failed to generate session" },
      { status: 500 }
    );
  }
}
