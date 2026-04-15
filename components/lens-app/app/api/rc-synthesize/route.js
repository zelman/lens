// /api/rc-synthesize - Generate candidate lens document from R→C discovery conversation
// The lens is a conversation catalyst, not an assessment verdict
// System prompts are loaded server-side and NEVER sent to client

import { RC_SYNTHESIS_SYSTEM_PROMPT, buildRCSynthesisUserContent } from "../_prompts/rc-synthesis";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 6000; // Lens documents require extended token limit for 7-section narrative
const TEMPERATURE = 0.5; // Balanced for narrative prose

// Sensitive terms that should never appear in output
const SENSITIVE_TERMS = [
  "ADHD", "ADD", "attention deficit", "ASD", "autism", "dyslexia",
  "anxiety", "depression", "bipolar", "OCD",
  "DISC", "Myers-Briggs", "MBTI", "Enneagram", "StrengthsFinder",
];

function sanitizeLensOutput(text) {
  let sanitized = text;
  let violations = [];

  for (const term of SENSITIVE_TERMS) {
    const pattern = new RegExp(`[^.!?]*\\b${term}\\b[^.!?]*[.!?]`, "gi");
    const matches = sanitized.match(pattern);
    if (matches) {
      violations.push(...matches.map(m => m.trim()));
      sanitized = sanitized.replace(pattern, "");
    }
  }

  // Clean up whitespace
  sanitized = sanitized.replace(/\n\s*\n\s*\n/g, "\n\n");
  sanitized = sanitized.replace(/  +/g, " ");

  return { sanitized, violations };
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

    // Build user content
    const userContent = buildRCSynthesisUserContent({
      sessionConfig,
      sectionData,
      candidateContext: candidateContext || null,
    });

    // Call Anthropic API with streaming to avoid timeout
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

    console.log("[RC-Synthesize] Stop reason:", stopReason);
    console.log("[RC-Synthesize] Response length:", fullText.length);

    if (!fullText) {
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    if (stopReason === "max_tokens") {
      console.warn("[RC-Synthesize] Response truncated - max_tokens reached");
    }

    // Validate lens has required sections
    const sectionHeadingCount = (fullText.match(/^##\s+/gm) || []).length;
    if (sectionHeadingCount < 5) {
      console.error(`[RC-Synthesize] Lens has only ${sectionHeadingCount} sections`);
      return Response.json(
        { error: "Generated lens is incomplete. Please try again." },
        { status: 500 }
      );
    }

    // Sanitize sensitive content
    const { sanitized, violations } = sanitizeLensOutput(fullText);
    if (violations.length > 0) {
      console.warn(`[RC-Synthesize] Sensitivity filter caught ${violations.length} violations`);
    }

    console.log(`[RC-Synthesize] Lens generated successfully`);

    return Response.json({ lens: sanitized });

  } catch (err) {
    console.error("[RC-Synthesize] Route error:", err);
    return Response.json(
      { error: "Failed to generate lens document" },
      { status: 500 }
    );
  }
}
