// /api/discover - Server-side proxy for discovery conversations
// System prompts are loaded server-side and NEVER sent to client

import { VALID_SECTIONS, buildSystemPrompt, getSectionPrompt } from "../_prompts/discovery";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1000;

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
    const { section, messages, context, action } = body;

    // Validate section
    if (!section || !VALID_SECTIONS.includes(section)) {
      return Response.json(
        { error: `Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate messages array
    if (!Array.isArray(messages)) {
      return Response.json(
        { error: "Messages must be an array" },
        { status: 400 }
      );
    }

    // Validate message structure (if not empty)
    for (const msg of messages) {
      if (!msg.role || !["user", "assistant"].includes(msg.role)) {
        return Response.json(
          { error: "Each message must have a valid role (user or assistant)" },
          { status: 400 }
        );
      }
      if (typeof msg.content !== "string") {
        return Response.json(
          { error: "Each message must have string content" },
          { status: 400 }
        );
      }
    }

    // Check payload size (50KB limit)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 50000) {
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    // Build system prompt server-side
    const establishedContext = context?.establishedContext || null;
    const systemPrompt = buildSystemPrompt(section, establishedContext);

    // Handle different actions
    let finalMessages = messages;

    if (action === "greeting") {
      // Starting a new section - build the greeting prompt
      const statusNote = context?.status
        ? `The user's current employment status is: ${context.status}.`
        : "";
      const sectionPrompt = getSectionPrompt(section);

      let greetingContent;
      if (context?.reentryMode && context?.existingLens) {
        // Re-entry mode
        greetingContent = `${statusNote}\n\nThis user already has a completed lens document. They want to update the "${section}" section specifically. Here is their existing lens:\n\n${context.existingLens}\n\nYour job is to help them refine or update just this section. Start by acknowledging you've reviewed their lens and ask a targeted question about what's changed or needs updating. Keep your opener to 2-3 sentences max.`;
      } else if (establishedContext) {
        greetingContent = `${statusNote}\n\nNow introduce the next section with this prompt to the user: "${sectionPrompt}". Keep your opener to 2-3 sentences max.`;
      } else {
        greetingContent = `${statusNote}\n\nIntroduce this section with the following prompt: "${sectionPrompt}". Keep your opener to 2-3 sentences max. Start warm but don't over-introduce yourself.`;
      }

      finalMessages = [{ role: "user", content: greetingContent }];
    } else if (action === "summarize") {
      // Section complete - generate summary
      const summarizePrompt = `Synthesize what you learned about me in this section into content for my lens document. Include TWO parts:

1. NARRATIVE (3-5 sentences): First person, present tense, specific. Captures the authentic patterns and insights from our conversation.

2. SIGNALS (bullet list): The specific, filterable criteria a job-matching pipeline can score against. These should be concrete: sector names, company sizes, title preferences, behavioral indicators, hard boundaries — whatever this section surfaced that a scoring engine needs.

No preamble — start with the narrative, then the signals.`;

      finalMessages = [...messages, { role: "user", content: summarizePrompt }];
    } else {
      // Regular conversation turn - check if section might be complete
      const userMsgCount = messages.filter(m => m.role === "user").length;
      const minMessages = ["mission", "disqualifiers", "goals"].includes(section) ? 3 : 2;
      const isLongEnough = userMsgCount >= minMessages;

      // Add completion check if long enough
      const completionHint = isLongEnough
        ? `\n\nYou may have enough to synthesize. Before ending, verify you have the specific, filterable data this section requires (see PIPELINE NOTE above). If critical specifics are missing, ask one more targeted question instead of completing. If the section has what it needs, end with exactly: [SECTION_COMPLETE]`
        : "";

      // Modify system prompt with completion hint
      const systemWithHint = systemPrompt + completionHint;

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
          system: systemWithHint,
          messages: finalMessages,
        }),
      });

      if (!res.ok) {
        console.error("Anthropic API error:", res.status);
        return Response.json(
          { error: "AI service temporarily unavailable" },
          { status: 503 }
        );
      }

      const data = await res.json();
      const text = data.content?.[0]?.text;

      if (!text) {
        return Response.json(
          { error: "Empty response from AI" },
          { status: 500 }
        );
      }

      // Check for section completion marker
      const isComplete = text.includes("[SECTION_COMPLETE]");
      const cleanText = text.replace("[SECTION_COMPLETE]", "").trim();

      // Return sanitized response (no API metadata)
      return Response.json({
        response: cleanText,
        sectionComplete: isComplete,
      });
    }

    // For greeting and summarize actions, make the API call
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
        system: systemPrompt,
        messages: finalMessages,
      }),
    });

    if (!res.ok) {
      console.error("Anthropic API error:", res.status);
      return Response.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 }
      );
    }

    const data = await res.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    // Return sanitized response
    return Response.json({
      response: text,
      sectionComplete: false,
    });

  } catch (err) {
    console.error("Discover route error:", err);
    return Response.json(
      { error: "Request failed" },
      { status: 500 }
    );
  }
}
