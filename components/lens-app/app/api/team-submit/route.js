// /api/team-submit - Store team validation form submissions to Airtable

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const BASE_ID = "appFO5zLT7ZehXaBo";
const TABLE_ID = "tblfxCLxn4GPD9C4f";

// Field IDs for Team Validation table
const FIELDS = {
  name: "fldm9WGD8CAoFsNB2",
  teamCode: "fldW3ySFjs2pksawA",
  values: "fldGgdugU01bcNjri",
  workStyle: "fldCE4sRHSiE62Udw",
  bestThing: "fldLnJa61x5tgrU4e",
  oneThing: "fldHK32QvoMLELI4k",
  submittedAt: "fldoDiYsWD3CgZFrH",
};

export async function POST(request) {
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!apiKey) {
    console.error("[team-submit] Missing AIRTABLE_API_KEY");
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { teamCode, name, values, workStyle, bestThing, oneThing, submittedAt } = body;

    // Validate required fields
    if (!teamCode || !name) {
      return Response.json(
        { error: "Missing team code or name" },
        { status: 400 }
      );
    }

    if (!values || !Array.isArray(values) || values.length !== 5) {
      return Response.json(
        { error: "Must select exactly 5 values" },
        { status: 400 }
      );
    }

    if (!workStyle || Object.keys(workStyle).length !== 5) {
      return Response.json(
        { error: "Must complete all work style questions" },
        { status: 400 }
      );
    }

    if (!bestThing || !oneThing) {
      return Response.json(
        { error: "Must complete team dynamics questions" },
        { status: 400 }
      );
    }

    // Build Airtable record
    const record = {
      fields: {
        [FIELDS.name]: name,
        [FIELDS.teamCode]: teamCode,
        [FIELDS.values]: JSON.stringify(values, null, 2),
        [FIELDS.workStyle]: JSON.stringify(workStyle, null, 2),
        [FIELDS.bestThing]: bestThing,
        [FIELDS.oneThing]: oneThing,
        [FIELDS.submittedAt]: submittedAt || new Date().toISOString(),
      },
    };

    // Submit to Airtable
    const res = await fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "unknown");
      console.error("[team-submit] Airtable error:", res.status, errorBody);
      return Response.json(
        { error: "Failed to save submission" },
        { status: 500 }
      );
    }

    const data = await res.json();
    console.log(`[team-submit] Saved submission for ${name} (team: ${teamCode})`);

    return Response.json({
      success: true,
      recordId: data.id,
    });

  } catch (err) {
    console.error("[team-submit] Route error:", err);
    return Response.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
