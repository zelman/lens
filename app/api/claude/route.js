// app/api/claude/route.js
// Server-side proxy for Claude API calls
// Keeps ANTHROPIC_API_KEY secure (never sent to browser)

export async function POST(request) {
  const body = await request.json();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return Response.json(
        { error: errorData.error || "API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Claude API proxy error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
