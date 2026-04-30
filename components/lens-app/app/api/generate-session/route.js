// /api/generate-session - Generate session config from reviewed dimensions
// Server-side only - system prompt never exposed to client
// Uses streaming to avoid Vercel timeout limits

import {
  GENERATE_SESSION_SYSTEM_PROMPT,
  buildSessionGenerationContent,
} from "../_prompts/generate-session";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";  // Sonnet for reliable complex JSON
const MAX_TOKENS = 16000; // Session configs can be large with many dimensions
// Note: temperature param removed — deprecated in Claude 4.5+ models
const MAX_RETRIES = 2;

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

// Helper: Call Claude API and return streaming response as text
async function callClaudeStreaming(apiKey, systemPrompt, userContent) {
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
      stream: true,
      system: systemPrompt,
      messages: [
        { role: "user", content: userContent + "\n\nRespond with ONLY valid JSON. Start with { and end with }. No markdown, no backticks, no explanation." }
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Anthropic API error: ${res.status} ${errorText}`);
  }

  // Process streaming response
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

  return { fullText, stopReason };
}

// Helper: Extract error position from JSON parse error
function getErrorPosition(errorMessage) {
  const posMatch = errorMessage.match(/position\s+(\d+)/i);
  return posMatch ? parseInt(posMatch[1]) : null;
}

// Helper: Escape unescaped newlines/tabs inside JSON strings
function escapeNewlinesInStrings(text) {
  // This regex finds string contents and escapes unescaped newlines
  // Match strings: "..." but handle escaped quotes inside
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      result += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString) {
      // Escape literal control chars inside strings
      if (char === '\n') {
        result += '\\n';
        continue;
      }
      if (char === '\r') {
        result += '\\r';
        continue;
      }
      if (char === '\t') {
        result += '\\t';
        continue;
      }
      if (char === '\f') {
        result += '\\f';
        continue;
      }
      if (char === '\b') {
        result += '\\b';
        continue;
      }
    }

    result += char;
  }

  return result;
}

// Helper: Parse JSON with repair attempts
function parseJsonWithRepairs(text, prefilled = false) {
  let cleanText = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // If we used prefill, prepend the opening brace
  if (prefilled && !cleanText.startsWith("{")) {
    cleanText = "{" + cleanText;
  }

  // Extract just the JSON object if there's text before/after
  const jsonStart = cleanText.indexOf('{');
  const jsonEnd = cleanText.lastIndexOf('}');
  if (jsonStart > 0 || (jsonEnd > 0 && jsonEnd < cleanText.length - 1)) {
    console.log("[generate-session] Extracting JSON object from position", jsonStart, "to", jsonEnd);
    cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
  }

  // Log first 100 chars for debugging
  console.log("[generate-session] cleanText first 100:", cleanText.slice(0, 100));

  // Handle case where JSON is wrapped in quotes (model outputs string literal)
  if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
    console.log("[generate-session] Detected quoted JSON string, unwrapping...");
    try {
      const unwrapped = JSON.parse(cleanText); // Parse the outer string to get inner JSON
      if (typeof unwrapped === 'string' && unwrapped.startsWith('{')) {
        cleanText = unwrapped;
        console.log("[generate-session] Successfully unwrapped to:", cleanText.slice(0, 50));
      }
    } catch (e) {
      console.log("[generate-session] Failed to unwrap quoted string:", e.message);
    }
  }

  // Track last error for debugging
  let lastError = null;
  let lastErrorPos = null;

  // Attempt 1: Direct parse
  try {
    return JSON.parse(cleanText);
  } catch (err1) {
    lastError = err1.message;
    lastErrorPos = getErrorPosition(err1.message);
    console.log("[generate-session] Direct parse failed at position", lastErrorPos, ":", err1.message);
    if (lastErrorPos) {
      console.log("[generate-session] Context around error:", cleanText.slice(Math.max(0, lastErrorPos - 50), lastErrorPos + 50));
    }
  }

  // Attempt 2: Fix broken strings where model forgot closing quote before newline
  // Pattern: "text\n        "nextField": -> "text",\n        "nextField":
  let brokenStringFixed = cleanText.replace(
    /([^\\])\n(\s*)"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g,
    (match, lastChar, whitespace, fieldName) => {
      // Only fix if we're likely inside a broken string (lastChar is alphanumeric or punctuation)
      if (/[a-zA-Z0-9.,;:!?\-'")}\]]/.test(lastChar)) {
        console.log("[generate-session] Fixing broken string before field:", fieldName);
        return `${lastChar}",\n${whitespace}"${fieldName}":`;
      }
      return match;
    }
  );

  if (brokenStringFixed !== cleanText) {
    console.log("[generate-session] Applied broken string fix");
    try {
      return JSON.parse(brokenStringFixed);
    } catch (err2b) {
      console.log("[generate-session] Broken string fix parse failed:", err2b.message);
    }
  }

  // Attempt 3: Escape unescaped newlines in strings (common model error)
  const escapedText = escapeNewlinesInStrings(brokenStringFixed);
  if (escapedText !== brokenStringFixed) {
    console.log("[generate-session] Applied newline escaping, diff length:", escapedText.length - brokenStringFixed.length);
    try {
      return JSON.parse(escapedText);
    } catch (err2a) {
      console.log("[generate-session] Newline escape parse failed:", err2a.message);
    }
  }

  // Attempt 5: Basic repairs (control chars, trailing commas) — cascade from escapedText
  let repairedText = escapedText
    .replace(/[\x00-\x1F\x7F]/g, (char) => {
      if (char === '\n' || char === '\r' || char === '\t') return ' '; // Replace with space instead of keeping
      return '';
    })
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  try {
    return JSON.parse(repairedText);
  } catch (err2) {
    console.log("[generate-session] Basic repair parse failed:", err2.message);
  }

  // Attempt 6: Find longest valid JSON prefix — cascade from repairedText
  const truncated = findLastValidJson(repairedText);
  if (truncated) {
    try {
      const result = JSON.parse(truncated);
      console.log("[generate-session] Truncation repair successful, lost", cleanText.length - truncated.length, "chars");
      return result;
    } catch (err3) {
      console.log("[generate-session] Truncation parse failed:", err3.message);
    }
  }

  // Attempt 7: Try to fix incomplete strings at end of JSON
  // Pattern: JSON truncated mid-string, ending like ..."some text
  const incompleteStringFixed = repairedText.replace(
    /("[^"]*?)$/,
    (match) => {
      console.log("[generate-session] Fixing incomplete string at end");
      return match + '"}';
    }
  );
  if (incompleteStringFixed !== repairedText) {
    // Also need to close any open objects/arrays
    let fixedWithBraces = incompleteStringFixed;
    let openBraces = 0, openBrackets = 0;
    for (const char of fixedWithBraces) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
    fixedWithBraces += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces));

    try {
      const result = JSON.parse(fixedWithBraces);
      console.log("[generate-session] Incomplete string repair successful");
      return result;
    } catch (err4) {
      console.log("[generate-session] Incomplete string repair failed:", err4.message);
    }
  }

  // Log final failure context for debugging
  console.error("[generate-session] All repair attempts failed. Text stats:", {
    length: cleanText.length,
    startsWithBrace: cleanText.startsWith('{'),
    endsWithBrace: cleanText.endsWith('}'),
    firstChars: cleanText.slice(0, 50),
    lastChars: cleanText.slice(-100)
  });

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
    let { dimensions, foundationDuration = 8, candidateMaterials } = body;

    // Enforce 4-minute floor for foundation duration
    if (foundationDuration < 4) {
      console.log(`[generate-session] foundationDuration ${foundationDuration} below floor, clamping to 4`);
      foundationDuration = 4;
    }

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

    // Build user content from dimensions, foundation duration, and candidate materials
    const userContent = buildSessionGenerationContent(dimensions, foundationDuration, candidateMaterials);
    console.log(`[generate-session] User content length: ${userContent.length} chars`);

    // Try generating session config with retries
    let sessionConfig = null;
    let lastError = null;
    let lastDebug = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[generate-session] Attempt ${attempt}/${MAX_RETRIES}`);

      try {
        const { fullText, stopReason } = await callClaudeStreaming(
          apiKey,
          GENERATE_SESSION_SYSTEM_PROMPT,
          userContent
        );

        console.log("[generate-session] Stop reason:", stopReason);
        console.log("[generate-session] Response length:", fullText.length);

        if (!fullText) {
          lastError = "Empty response from AI";
          lastDebug = { issue: "empty_response", stopReason, attempt };
          continue;
        }

        if (stopReason === "max_tokens") {
          lastError = "Response truncated - max_tokens reached";
          lastDebug = { issue: "max_tokens", responseLength: fullText.length, attempt };
          continue;
        }

        // Try to parse the response
        sessionConfig = parseJsonWithRepairs(fullText, false);

        if (sessionConfig) {
          console.log(`[generate-session] Success on attempt ${attempt}`);
          break;
        }

        // Store debug info for last failed attempt
        const cleanText = fullText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        // Try to find where the parse error occurred
        let contextAroundError = null;
        try {
          JSON.parse(cleanText);
        } catch (parseErr) {
          const posMatch = parseErr.message.match(/position\s+(\d+)/i);
          if (posMatch) {
            const pos = parseInt(posMatch[1]);
            contextAroundError = cleanText.slice(Math.max(0, pos - 100), pos + 100);
          }
        }

        lastError = "Failed to parse JSON";
        lastDebug = {
          parseError: "JSON parse failed after all repair attempts",
          responseStart: fullText.slice(0, 500),
          responseEnd: fullText.slice(-300),
          contextAroundError,
          stopReason,
          responseLength: fullText.length,
          attempt
        };

      } catch (err) {
        console.error(`[generate-session] Attempt ${attempt} error:`, err.message);
        lastError = err.message;
        lastDebug = { errorMessage: err.message, attempt };
      }
    }

    if (!sessionConfig) {
      console.error("[generate-session] All attempts failed:", lastError);
      return Response.json(
        {
          error: "Failed to generate session config. Please try again.",
          debug: lastDebug
        },
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
        model: "claude-sonnet-4-6",
        maxTokens: 2500,
        // Note: temperature removed — deprecated in Claude 4.5+ models
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
