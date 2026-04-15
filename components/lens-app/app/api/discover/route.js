// /api/discover - Server-side proxy for discovery conversations
// System prompts are loaded server-side and NEVER sent to client

import { VALID_SECTIONS, buildSystemPrompt, getSectionPrompt } from "../_prompts/discovery";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1000;
const MAX_UPLOAD_SUMMARY_LENGTH = 60000; // ~15K tokens, client applies priority-based budget
const MIN_UPLOAD_SUMMARY_LENGTH = 100; // Minimum for meaningful context

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
      if (typeof msg.content !== "string" || msg.content.trim().length === 0) {
        return Response.json(
          { error: "Each message must have non-empty string content" },
          { status: 400 }
        );
      }
    }

    // Check payload size (80KB limit) - increased to accommodate 60K content budget + JSON overhead
    const payloadSize = new TextEncoder().encode(JSON.stringify(body)).length;
    if (payloadSize > 80000) {
      console.log(`[Discover] Payload rejected: ${payloadSize} bytes exceeds 80KB limit`);
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

    if (action === "reflect") {
      // Context Reflection phase - summarize uploaded materials before discovery
      let uploadSummary = context?.uploadSummary || "";
      const userName = context?.userName || "this person";

      // Log content size for debugging
      const originalLength = uploadSummary.length;
      console.log(`[Reflection] Received uploadSummary: ${originalLength} chars`);

      // Truncate if too large to prevent API errors (belt-and-suspenders with client budget)
      if (uploadSummary.length > MAX_UPLOAD_SUMMARY_LENGTH) {
        uploadSummary = uploadSummary.slice(0, MAX_UPLOAD_SUMMARY_LENGTH) + "\n\n[Content truncated for length]";
        console.log(`[Reflection] Truncated from ${originalLength} to ${uploadSummary.length} chars`);
      }

      if (!uploadSummary || uploadSummary.trim().length < MIN_UPLOAD_SUMMARY_LENGTH) {
        // No meaningful materials uploaded - return a brief acknowledgment
        return Response.json({
          response: `I don't have any uploaded materials to review yet, so I'll learn about you through our conversation. Let's dive right into discovery.`,
          hasContext: false,
        });
      }

      // Build the reflection prompt
      const reflectionSystemPrompt = `You are reviewing uploaded materials (resume, LinkedIn profile, writing samples, assessments) to summarize what you know about this person before starting a discovery conversation.

## CRITICAL: CLINICAL LABEL PROHIBITION

The following terms must NEVER appear in your summary, even if they appear in the uploaded materials:

BLOCKED TERMS (do not write these):
- ADHD, ADD, attention deficit
- anxiety, depression, bipolar, OCD, or any DSM diagnostic label
- DISC, Myers-Briggs, MBTI, Enneagram, StrengthsFinder, CliftonStrengths
- Peacemaker, Dominance, Influencing, Steadiness, Compliance (as personality terms)
- Any assessment type name, score, or profile classification (e.g., "SC profile", "Type 9")

If assessment data exists, use it to INFORM your understanding but NEVER reference the assessment or its labels. Instead of "Your DISC shows you're a Peacemaker SC", say "You seem to value stability and collaborative environments."

## YOUR TASK

Present a structured summary back to the user that demonstrates you've read and understood their materials.

The summary should cover (in 3-5 bullet points):
1. Professional identity (title, domain, level — e.g., "You're a Customer Success leader with 8+ years in B2B SaaS")
2. Key career themes/patterns you noticed
3. Notable achievements or metrics you extracted (be specific — use actual numbers and company names from resume/LinkedIn)
4. Areas to explore further in discovery (frame behavioral observations WITHOUT citing assessment labels)

IMPORTANT:
- Be specific with career data (names, numbers, titles, companies from resume/LinkedIn).
- NEVER reference assessment names or classifications. Translate behavioral signals into plain language.
- Write in second person ("You are..." not "They are...")
- End with: "Does this capture you accurately? What would you add or correct?"
- Keep the entire response under 200 words.
- DO NOT make things up. Only reference what's actually in the materials.`;

      const reflectionUserContent = `Here are ${userName}'s uploaded materials:\n\n${uploadSummary}\n\nSummarize what you know about this person based on these materials. Be specific and reference actual content from the documents.`;

      // Make the API call with the reflection prompt
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
          system: reflectionSystemPrompt,
          messages: [{ role: "user", content: reflectionUserContent }],
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "unknown");
        console.error(`[Reflection] Anthropic API error: ${res.status}`, errorBody);
        console.error(`[Reflection] Content length was: ${reflectionUserContent.length} chars`);
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
        hasContext: true,
      });
    } else if (action === "greeting") {
      // Starting a new section - build the greeting prompt
      const statusNote = context?.status
        ? `The user's current employment status is: ${context.status}.`
        : "";
      const uploadSummary = context?.uploadSummary || "";
      const contextReflection = context?.contextReflection || "";
      const sectionPrompt = getSectionPrompt(section);

      // Build context note for AI
      let contextNote = "";
      if (contextReflection) {
        contextNote = `\n\nCONTEXT FROM MATERIALS (already confirmed by user):\n${contextReflection}\n\nUse this context to inform your questions. Do NOT re-ask about things already established above.`;
      } else if (uploadSummary && uploadSummary.trim().length >= MIN_UPLOAD_SUMMARY_LENGTH) {
        contextNote = `\n\nUPLOADED MATERIALS:\n${uploadSummary}\n\nReference specific details from these materials in your opener. IMPORTANT: Never mention assessment names (DISC, Myers-Briggs, etc.) or clinical labels (ADHD, anxiety, etc.). Use behavioral language only.`;
      }

      let greetingContent;
      if (context?.reentryMode && context?.existingLens) {
        // Re-entry mode
        greetingContent = `${statusNote}\n\nThis user already has a completed lens document. They want to update the "${section}" section specifically. Here is their existing lens:\n\n${context.existingLens}\n\nYour job is to help them refine or update just this section. Start by acknowledging you've reviewed their lens and ask a targeted question about what's changed or needs updating. Keep your opener to 2-3 sentences max.`;
      } else if (establishedContext) {
        greetingContent = `${statusNote}${contextNote}\n\nNow introduce the next section with this prompt to the user: "${sectionPrompt}". Reference what you already know from prior sections and/or uploaded materials. Keep your opener to 2-3 sentences max.`;
      } else {
        greetingContent = `${statusNote}${contextNote}\n\nIntroduce this section with the following prompt: "${sectionPrompt}". If you have context from uploaded materials, reference specific details in your opener. Keep your opener to 2-3 sentences max. Start warm but don't over-introduce yourself.`;
      }

      finalMessages = [{ role: "user", content: greetingContent }];
    } else if (action === "summarize") {
      // Section complete - generate summary (self-contained with own system prompt)
      const summarizeSystemPrompt = `You are helping someone build a lens document by synthesizing a discovery conversation into structured content for that section.

Your task: Review the conversation and extract TWO parts:

1. NARRATIVE (3-5 sentences): First person, present tense, specific. Captures the authentic patterns and insights from the conversation. Use the person's own language when it's vivid.

2. SIGNALS (bullet list): The specific, filterable criteria a job-matching pipeline can score against. These should be concrete: sector names, company sizes, title preferences, behavioral indicators, hard boundaries — whatever this section surfaced that a scoring engine needs.

IMPORTANT: Never include clinical labels (ADHD, anxiety, etc.) or assessment names (DISC, Myers-Briggs, etc.) in the output. Translate any such signals into behavioral language.

No preamble — start with the narrative, then the signals.`;

      const summarizeUserPrompt = `Synthesize what you learned about me in this section into content for my lens document.`;
      const summarizeMessages = [...messages, { role: "user", content: summarizeUserPrompt }];

      // Make the API call for summarize (self-contained)
      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1500, // Summaries need more tokens
          system: summarizeSystemPrompt,
          messages: summarizeMessages,
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
      // Regular conversation turn - check if section might be complete
      const userMsgCount = messages.filter(m => m.role === "user").length;
      const assistantMsgCount = messages.filter(m => m.role === "assistant").length;
      const minMessages = ["mission", "disqualifiers", "goals"].includes(section) ? 3 : 2;
      const isLongEnough = userMsgCount >= minMessages;

      // HARD CAP: 4 questions per section (assistant messages = questions asked)
      // After 4 questions, force section completion
      const MAX_QUESTIONS_PER_SECTION = 4;
      const isAtQuestionLimit = assistantMsgCount >= MAX_QUESTIONS_PER_SECTION;

      // Build completion hint based on question count
      let completionHint = "";
      if (isAtQuestionLimit) {
        // Hard cap reached - MUST complete
        completionHint = `\n\n⚠️ QUESTION LIMIT REACHED: You have asked ${assistantMsgCount} questions in this section. You MUST wrap up now. Synthesize what you have and end with exactly: [SECTION_COMPLETE]\n\nDo NOT ask another question. Reflect briefly on what you've learned and complete the section.`;
      } else if (assistantMsgCount === MAX_QUESTIONS_PER_SECTION - 1) {
        // One question left - warn AI
        completionHint = `\n\n⚠️ FINAL QUESTION: This is your last question for this section. Make it count, then prepare to wrap up. After the user responds, you should synthesize and end with [SECTION_COMPLETE].`;
      } else if (isLongEnough) {
        // Minimum met but not at cap - gentle nudge
        completionHint = `\n\nYou may have enough to synthesize (${assistantMsgCount}/${MAX_QUESTIONS_PER_SECTION} questions asked). Before ending, verify you have the specific, filterable data this section requires (see PIPELINE NOTE above). If critical specifics are missing, ask one more targeted question instead of completing. If the section has what it needs, end with exactly: [SECTION_COMPLETE]`;
      }

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

      // Return sanitized response (no API metadata)
      return Response.json({
        response: finalResponse,
        sectionComplete: isComplete,
      });
    }

    // For greeting action, make the API call
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
    const text = data.content?.find(b => b.type === "text")?.text;

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
