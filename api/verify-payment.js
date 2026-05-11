export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId, transaction_ref } = req.query;
  if (!sessionId && !transaction_ref) {
    return res.status(400).json({ error: 'Missing sessionId or transaction_ref' });
  }

  const transactionRef = sessionId || transaction_ref;
  const secretKey = process.env.SQUAD_SECRET_KEY;
  if (!secretKey) {
    console.error('SQUAD_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Payment service not configured' });
  }

  try {
    const response = await fetch(\`https://sandbox-api-d.squadco.com/transaction/verify/\${transactionRef}\`, {
      headers: {
        'Authorization': \`Bearer \${secretKey}\`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      throw new Error(errData.message || \`Squad API error: \${response.status}\`);
    }

    const data = await response.json();
    // Return relevant fields
    res.status(200).json({
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      customer_email: data.customer?.email,
    });
  } catch (error) {
    console.error('Squad verification error:', error);
    res.status(500).json({ error: error.message });
  }
}
