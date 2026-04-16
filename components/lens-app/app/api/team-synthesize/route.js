// /api/team-synthesize - Generate Team Identity Portrait from team submissions
// Fetches submissions from Airtable, synthesizes with Claude

import { TEAM_SYNTHESIS_SYSTEM_PROMPT, buildTeamSynthesisUserContent } from "../_prompts/team-synthesis";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 2000;
const TEMPERATURE = 0.5;

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const BASE_ID = "appFO5zLT7ZehXaBo";
const TABLE_ID = "tblfxCLxn4GPD9C4f";

export async function POST(request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const airtableKey = process.env.AIRTABLE_API_KEY;

  if (!anthropicKey || !airtableKey) {
    console.error("[team-synthesize] Missing API keys");
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { teamCode } = body;

    if (!teamCode) {
      return Response.json(
        { error: "Missing team code" },
        { status: 400 }
      );
    }

    console.log(`[team-synthesize] Fetching submissions for team: ${teamCode}`);

    // Fetch submissions from Airtable
    const filterFormula = encodeURIComponent(`{Team Code} = "${teamCode}"`);
    const airtableRes = await fetch(
      `${AIRTABLE_API_URL}/${BASE_ID}/${TABLE_ID}?filterByFormula=${filterFormula}`,
      {
        headers: {
          "Authorization": `Bearer ${airtableKey}`,
        },
      }
    );

    if (!airtableRes.ok) {
      console.error("[team-synthesize] Airtable fetch error:", airtableRes.status);
      return Response.json(
        { error: "Failed to fetch team submissions" },
        { status: 500 }
      );
    }

    const airtableData = await airtableRes.json();
    const records = airtableData.records || [];

    if (records.length === 0) {
      return Response.json(
        { error: "No submissions found for this team" },
        { status: 404 }
      );
    }

    if (records.length < 3) {
      return Response.json(
        { error: `Only ${records.length} submissions found. Need at least 3 team members for meaningful synthesis.` },
        { status: 400 }
      );
    }

    console.log(`[team-synthesize] Found ${records.length} submissions`);

    // Transform Airtable records to submission format
    const submissions = records.map(r => ({
      name: r.fields["Name"],
      values: r.fields["Values"],
      workStyle: r.fields["Work Style"],
      bestThing: r.fields["Best Thing"],
      oneThing: r.fields["One Thing to Change"],
    }));

    // Build user content
    const userContent = buildTeamSynthesisUserContent(submissions, teamCode);

    // Call Anthropic API
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: TEAM_SYNTHESIS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "unknown");
      console.error("[team-synthesize] Anthropic API error:", res.status, errorBody);
      return Response.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 }
      );
    }

    const data = await res.json();
    const portrait = data.content?.find(b => b.type === "text")?.text;

    if (!portrait) {
      return Response.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    console.log(`[team-synthesize] Portrait generated for team ${teamCode} (${portrait.length} chars)`);

    return Response.json({
      portrait,
      teamCode,
      memberCount: records.length,
    });

  } catch (err) {
    console.error("[team-synthesize] Route error:", err);
    return Response.json(
      { error: "Failed to generate team portrait" },
      { status: 500 }
    );
  }
}
