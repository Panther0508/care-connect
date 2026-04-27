export default function handler(req, res) {
  console.log('Satellite ingest received:', req.body);
  // In a real implementation, we would process and store this data for a global dashboard
  res.status(200).json({ status: 'success', message: 'Data received' });
}