// /api/rc-discover - Server-side proxy for R→C candidate discovery conversations
// System prompts are loaded server-side and NEVER sent to client

import { buildRCSystemPrompt, getSectionOpeningPrompt, buildEstablishedContext } from "../_prompts/rc-discovery";

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
    const { sessionConfig, section, messages, action, context } = body;

    // Validate session config
    if (!sessionConfig || !sessionConfig.sessionId) {
      return Response.json(
        { error: "Missing session configuration" },
        { status: 400 }
      );
    }

    // Validate section
    if (!section || !section.id) {
      return Response.json(
        { error: "Missing section" },
        { status: 400 }
      );
    }

    // Validate messages
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
      if (typeof msg.content !== "string" || msg.content.trim().length === 0) {
        return Response.json(
          { error: "Each message must have non-empty string content" },
          { status: 400 }
        );
      }
    }

    // Build established context from prior sections
    const establishedContext = context?.establishedContext || null;
    const systemPrompt = buildRCSystemPrompt(section, sessionConfig, establishedContext);

    // Handle different actions
    if (action === "greeting") {
      // Generate section opener
      const openingPrompt = getSectionOpeningPrompt(section, sessionConfig);
      const introContext = sessionConfig.candidateIntro;
      const currentSectionIndex = context?.currentSectionIndex ?? 0;

      let greetingContent;
      if (currentSectionIndex === 0 && introContext) {
        // First section - include candidate intro
        greetingContent = `${introContext.greeting || ""}\n\n${introContext.contextStatement || ""}\n\nNow open this section naturally. Your opening question: "${openingPrompt}"`;
      } else {
        // Subsequent section - transition smoothly
        greetingContent = `Transition to this new section. Your opening question: "${openingPrompt}"`;
      }

      const greetingMessages = [{ role: "user", content: greetingContent }];

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
          messages: greetingMessages,
        }),
      });

      if (!res.ok) {
        console.error("Anthropic API error (greeting):", res.status);
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

      return Response.json({
        response: text,
        sectionComplete: false,
      });

    } else if (action === "summarize") {
      // Section summarization for lens synthesis
      const summarizeSystemPrompt = `You are extracting key observations from a discovery section to inform a candidate lens document.

Extract:
1. KEY INSIGHTS: 2-3 observations about who this person is professionally
2. NOTABLE QUOTES: The most revealing thing they said in their own words
3. PATTERNS: Any recurring themes or through-lines that emerged
4. OPEN THREADS: Questions or areas worth exploring further (or "none")

Format as flowing narrative text (not JSON). Be specific and use their language. Keep it concise.`;

      const summarizeUserPrompt = `Summarize what you learned about this candidate in the "${section.label || section.id}" section.`;
      const summarizeMessages = [...messages, { role: "user", content: summarizeUserPrompt }];

      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1500,
          system: summarizeSystemPrompt,
          messages: summarizeMessages,
        }),
      });

      if (!res.ok) {
        console.error("Anthropic API error (summarize):", res.status);
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

      return Response.json({
        response: text,
        sectionComplete: true,
      });

    } else {
      // Regular conversation turn
      const assistantMsgCount = messages.filter(m => m.role === "assistant").length;
      const maxQuestions = section.questions || (section.type === "foundation" ? 2 : 3);

      // Build completion hint based on question count
      let completionHint = "";
      if (assistantMsgCount >= maxQuestions) {
        // Hard cap reached - MUST complete
        completionHint = `\n\n⚠️ QUESTION LIMIT REACHED: You have asked ${assistantMsgCount} questions in this section. You MUST wrap up now. Briefly reflect what you learned and end with exactly: [SECTION_COMPLETE]\n\nDo NOT ask another question.`;
      } else if (assistantMsgCount === maxQuestions - 1) {
        // One question left - warn AI
        completionHint = `\n\n⚠️ FINAL QUESTION: This is your last question for this section. Make it count, then prepare to wrap up.`;
      } else if (assistantMsgCount >= 2 && section.type === "foundation") {
        // Foundation section minimum met
        completionHint = `\n\nYou have enough signal for this foundation section. Consider wrapping up with [SECTION_COMPLETE] unless something critical is missing.`;
      }

      const systemWithHint = systemPrompt + completionHint;

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
          messages: messages,
        }),
      });

      if (!res.ok) {
        console.error("Anthropic API error (conversation):", res.status);
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

      // Check for section completion marker
      const isComplete = text.includes("[SECTION_COMPLETE]");
      const cleanText = text.replaceAll("[SECTION_COMPLETE]", "").trim();

      // If AI only returned the completion marker with no content, provide a fallback
      const finalResponse = cleanText || "Thank you for sharing that. Let me capture what we've covered.";

      return Response.json({
        response: finalResponse,
        sectionComplete: isComplete,
      });
    }

  } catch (err) {
    console.error("RC-Discover route error:", err);
    return Response.json(
      { error: "Request failed" },
      { status: 500 }
    );
  }
}
