// api/impact.js - VitaChain Impact Metrics Endpoint
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return community impact metrics
  // In production, these would come from aggregated mesh data in KV
  const impact = {
    watching: 1247,
    connections: 834,
    facilities: 156,
    outbreakAlerts: 12,
    healthPassportsGenerated: 2891,
    meshNodesActive: 47,
    regionsServed: ['NG', 'GH', 'KE', 'TZ', 'ZA'],
    lastUpdated: new Date().toISOString(),
  };

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  return res.status(200).json(impact);
}
