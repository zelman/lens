// /api/rc-session-fetch - Fetch R→C session by token
// Returns session config for candidate intake hydration

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const BASE_ID = "appFO5zLT7ZehXaBo";
const TABLE_ID = "tbleGAd6aEFbDm5nK"; // R→C Sessions

// Field IDs for R→C Sessions table
const FIELDS = {
  sessionToken: "fldnuWc4FLYaPNvgU",
  recruiterRoleContext: "fldeWSKVOdDCd0Cfb",
  sessionConfig: "fldlaGMcV8jAzu99U",
  expiresAt: "fldaofxjXJVRw3TYt",
  claimedAt: "fldAYxjLyvPs24I1L",
  recruiterName: "fldIypcMRmtbUrGk8",
};

export async function GET(request) {
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!apiKey) {
    console.error("[rc-session-fetch] Missing AIRTABLE_API_KEY");
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 500 }
    );
  }

  try {
    // Get token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || token.length < 8) {
      return Response.json(
        { error: "Invalid session token" },
        { status: 400 }
      );
    }

    // Look up session by token
    const filterFormula = encodeURIComponent(`{Session Token} = "${token}"`);
    const res = await fetch(
      `${AIRTABLE_API_URL}/${BASE_ID}/${TABLE_ID}?filterByFormula=${filterFormula}&maxRecords=1`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "unknown");
      console.error("[rc-session-fetch] Airtable error:", res.status, errorBody);
      return Response.json(
        { error: "Failed to fetch session" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const records = data.records || [];

    if (records.length === 0) {
      console.log(`[rc-session-fetch] Session not found: ${token}`);
      return Response.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const record = records[0];
    const fields = record.fields;

    // Check expiration
    const expiresAt = fields[FIELDS.expiresAt];
    if (expiresAt && new Date(expiresAt) < new Date()) {
      console.log(`[rc-session-fetch] Session expired: ${token}`);
      return Response.json(
        { error: "Session has expired" },
        { status: 410 }
      );
    }

    // Set Claimed At on first fetch (informational only)
    const claimedAt = fields[FIELDS.claimedAt];
    if (!claimedAt) {
      // Fire-and-forget update - don't block the response
      fetch(`${AIRTABLE_API_URL}/${BASE_ID}/${TABLE_ID}/${record.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            [FIELDS.claimedAt]: new Date().toISOString(),
          },
        }),
      }).catch((err) => {
        console.warn("[rc-session-fetch] Failed to set claimedAt:", err.message);
      });
    }

    // Parse stored JSON
    let recruiterRoleContext = null;
    let sessionConfig = null;

    try {
      const roleContextStr = fields[FIELDS.recruiterRoleContext];
      if (roleContextStr) {
        recruiterRoleContext = JSON.parse(roleContextStr);
      }
    } catch (e) {
      console.error("[rc-session-fetch] Failed to parse recruiterRoleContext:", e.message);
    }

    try {
      const sessionConfigStr = fields[FIELDS.sessionConfig];
      if (sessionConfigStr) {
        sessionConfig = JSON.parse(sessionConfigStr);
      }
    } catch (e) {
      console.error("[rc-session-fetch] Failed to parse sessionConfig:", e.message);
    }

    if (!sessionConfig) {
      return Response.json(
        { error: "Invalid session data" },
        { status: 500 }
      );
    }

    console.log(`[rc-session-fetch] Retrieved session: ${token}`);

    return Response.json({
      recruiterRoleContext,
      sessionConfig,
    });

  } catch (err) {
    console.error("[rc-session-fetch] Route error:", err);
    return Response.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
