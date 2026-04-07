export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Missing AIRTABLE_TOKEN' });
  }

  const BASE_ID = 'appFO5zLT7ZehXaBo';
  const TABLE_ID = 'tblUAyulKOKXiRoOx';

  // Extract IP from Vercel request headers
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown';

  const {
    sessionId,
    name,
    betterThanResume,
    wouldShare,
    surfacedInsights,
    mostValuable,
    mostValuableWhy,
    weakest,
    weakestWhy,
    missing,
    feelsLikeYou,
    pricingReaction,
  } = req.body;

  const fields = {
    Name: name || 'Anonymous',
    'Better Than Resume': betterThanResume || null,
    'Would Share': wouldShare || null,
    'Surfaced New Insights': surfacedInsights || null,
    'Most Valuable Section': mostValuable || null,
    'Most Valuable Why': mostValuableWhy || null,
    'Weakest Section': weakest || null,
    'Weakest Why': weakestWhy || null,
    'Whats Missing': missing || null,
    'Feels Like You (1-10)': feelsLikeYou != null ? Number(feelsLikeYou) : null,
    'Pricing Reaction': pricingReaction || null,
    'Submitted At': new Date().toISOString(),
    'IP Address': ip,
  };

  try {
    let response;

    if (sessionId) {
      // Update existing record (from timing instrumentation)
      response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${sessionId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields }),
        }
      );
    } else {
      // Create new record (no session ID)
      response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ records: [{ fields }] }),
        }
      );
    }

    if (!response.ok) {
      const err = await response.text();
      console.error('Airtable error:', err);
      return res.status(500).json({ error: 'Airtable write failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
