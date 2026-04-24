// /api/rc-discover - Server-side proxy for R→C candidate discovery conversations
// System prompts are loaded server-side and NEVER sent to client

import { buildRCSystemPrompt, getSectionOpeningPrompt, buildEstablishedContext } from "../_prompts/rc-discovery";
import {
  sectionBudgetFromConfig,
  getBudgetStatus,
} from "../../../lib/session-timing";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
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
    const { sessionConfig, section, messages, action, context, candidateMaterials } = body;

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

    // SECURITY: Validate message count integrity
    // Client must send expectedQuestionCount matching actual assistant messages
    // This adds friction for clients trying to manipulate question count
    const actualAssistantCount = messages.filter(m => m.role === "assistant").length;
    if (context?.expectedQuestionCount !== undefined) {
      if (context.expectedQuestionCount !== actualAssistantCount) {
        console.warn(`[rc-discover] Question count mismatch: expected ${context.expectedQuestionCount}, got ${actualAssistantCount}`);
        return Response.json(
          { error: "Message integrity check failed. Please refresh and try again." },
          { status: 400 }
        );
      }
    }

    // Build established context from prior sections
    const establishedContext = context?.establishedContext || null;
    const systemPrompt = buildRCSystemPrompt(section, sessionConfig, establishedContext, candidateMaterials);

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

      // Include budget status for section start
      const { maxQuestions } = sectionBudgetFromConfig(section);

      return Response.json({
        response: text,
        sectionComplete: false,
        budgetStatus: {
          questionsAsked: 1, // The greeting counts as first question
          maxQuestions,
          remaining: maxQuestions - 1,
          exhausted: false,
        },
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
      // Use timing module for budget calculation
      // SECURITY: Always recalculate maxQuestions from durationMin server-side
      // Do NOT trust client-provided maxQuestions
      const { maxQuestions, durationMinHint } = sectionBudgetFromConfig(section);
      const questionsAsked = messages.filter(m => m.role === "assistant").length;

      // CRITICAL: If budget already exhausted, do NOT call AI
      // Return immediately with transition signal
      if (questionsAsked >= maxQuestions) {
        const currentSectionIndex = context?.currentSectionIndex ?? 0;
        const totalSections = context?.totalSections ?? 1;
        const hasNextSection = currentSectionIndex + 1 < totalSections;

        return Response.json({
          response: "Thank you for sharing that. Let me capture what we've covered before we move on.",
          sectionComplete: true,
          budgetStatus: {
            questionsAsked,
            maxQuestions,
            remaining: 0,
            exhausted: true,
          },
          transition: {
            from: section.id,
            to: hasNextSection ? `section_${currentSectionIndex + 1}` : null,
            reason: "budget_exhausted",
            timestamp: new Date().toISOString(),
            isSessionComplete: !hasNextSection,
          },
        });
      }

      const budgetStatus = getBudgetStatus({ questionsAsked, maxQuestions });

      // Build completion hint based on budget status
      let completionHint = "";
      let forceTransition = false;

      // Check if THIS response will exhaust the budget
      const willExhaustBudget = questionsAsked + 1 >= maxQuestions;

      if (willExhaustBudget) {
        // This is the LAST allowed response - tell AI to wrap up
        forceTransition = true;
        completionHint = `\n\n⚠️ FINAL QUESTION: This is your last question for this section (${questionsAsked + 1}/${maxQuestions}). Wrap up naturally and end with exactly: [SECTION_COMPLETE]\n\nDo NOT ask another question after this.`;
      } else if (budgetStatus.nearLimit) {
        // One question left after this one
        completionHint = `\n\n⚠️ APPROACHING LIMIT: You have ${maxQuestions - questionsAsked - 1} questions remaining after this one. Start wrapping up soon.`;
      } else if (questionsAsked >= 2 && section.type === "foundation") {
        // Foundation section minimum met
        completionHint = `\n\nYou have enough signal for this foundation section (${questionsAsked}/${maxQuestions}). Consider wrapping up with [SECTION_COMPLETE] unless something critical is missing.`;
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
      const isComplete = text.includes("[SECTION_COMPLETE]") || forceTransition;
      const cleanText = text.replaceAll("[SECTION_COMPLETE]", "").trim();

      // If AI only returned the completion marker with no content, provide a fallback
      const finalResponse = cleanText || "Thank you for sharing that. Let me capture what we've covered.";

      // Build response payload with budget status
      const responsePayload = {
        response: finalResponse,
        sectionComplete: isComplete,
        budgetStatus: {
          questionsAsked: questionsAsked + 1, // +1 for this turn's response
          maxQuestions,
          remaining: Math.max(0, maxQuestions - questionsAsked - 1),
          exhausted: questionsAsked + 1 >= maxQuestions,
        },
      };

      // Add transition signal if section is complete
      if (isComplete) {
        const reason = forceTransition ? "budget_exhausted" : "section_complete";
        const currentSectionIndex = context?.currentSectionIndex ?? 0;
        const totalSections = context?.totalSections ?? 1;
        const hasNextSection = currentSectionIndex + 1 < totalSections;

        responsePayload.transition = {
          from: section.id,
          to: hasNextSection ? `section_${currentSectionIndex + 1}` : null,
          reason,
          timestamp: new Date().toISOString(),
          isSessionComplete: !hasNextSection,
        };
      }

      return Response.json(responsePayload);
    }

  } catch (err) {
    console.error("RC-Discover route error:", err);
    return Response.json(
      { error: "Request failed" },
      { status: 500 }
    );
  }
}
