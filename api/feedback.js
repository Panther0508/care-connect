export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { facilityId, confirmed, helpful } = req.body;

    if (!facilityId || typeof facilityId !== 'string') {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    console.log(`Feedback received for facility ${facilityId}: confirmed=${confirmed}, helpful=${helpful}`);

    // Log feedback for analytics (could store in KV in production)
    // For demo purposes, just acknowledge
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Feedback error detail:', err);
    return res.status(500).json({ error: err.message });
  }
}
