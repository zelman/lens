// /api/next-steps - Generate actionable next steps from lens document
// Uses haiku for fast, cost-effective generation

import Anthropic from "@anthropic-ai/sdk";
import { NEXT_STEPS_SYSTEM_PROMPT, buildNextStepsUserContent } from "../_prompts/next-steps";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 2000;
const TIMEOUT_MS = 30000; // 30 seconds should be plenty for haiku

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const body = await request.json();
    const { lensMarkdown, metadata } = body;

    // Validate required input
    if (!lensMarkdown || typeof lensMarkdown !== "string") {
      return Response.json(
        { error: "Missing or invalid lensMarkdown" },
        { status: 400 }
      );
    }

    // Check payload size (50KB limit for this endpoint)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 50000) {
      return Response.json(
        { error: "Request too large" },
        { status: 400 }
      );
    }

    console.log(`[NextSteps] Generating next steps, lens length: ${lensMarkdown.length}, has metadata: ${!!metadata}`);

    // Build user content
    const userContent = buildNextStepsUserContent({ lensMarkdown, metadata });

    // Call Anthropic API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: NEXT_STEPS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = response.content[0]?.text || "";
      console.log(`[NextSteps] Response length: ${responseText.length}`);

      // Parse JSON response
      let nextSteps;
      try {
        // Handle potential markdown code fence wrapping
        let jsonText = responseText.trim();
        if (jsonText.startsWith("```json")) {
          jsonText = jsonText.slice(7);
        } else if (jsonText.startsWith("```")) {
          jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith("```")) {
          jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        nextSteps = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error("[NextSteps] Failed to parse response as JSON:", parseErr.message);
        console.error("[NextSteps] Raw response:", responseText.slice(0, 500));
        return Response.json(
          { error: "Failed to generate valid next steps" },
          { status: 502 }
        );
      }

      // Validate structure
      if (!nextSteps.next_steps || !Array.isArray(nextSteps.next_steps)) {
        console.error("[NextSteps] Invalid response structure - missing next_steps array");
        return Response.json(
          { error: "Invalid response structure" },
          { status: 502 }
        );
      }

      // Validate each step has required fields
      for (const step of nextSteps.next_steps) {
        if (!step.title || !step.rationale || !step.sub_actions || !step.timeline) {
          console.warn("[NextSteps] Step missing required fields:", step);
        }
      }

      return Response.json(nextSteps);

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        console.error("[NextSteps] Request timed out");
        return Response.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }

      throw error;
    }

  } catch (err) {
    console.error("NextSteps route error:", {
      name: err.name,
      message: err.message,
    });
    return Response.json(
      { error: "Failed to generate next steps" },
      { status: 500 }
    );
  }
}
