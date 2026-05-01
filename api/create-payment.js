export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount, plan, userId, email } = req.body;

  if (!amount || !plan || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const secretKey = process.env.SQUAD_SECRET_KEY;
  if (!secretKey) {
    console.error('SQUAD_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Payment service not configured' });
  }

  try {
    // Create Squad checkout session
    const response = await fetch('https://api.squaddev.co/v1/checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'NGN',
        description: `VitaChain ${plan} Plan`,
        metadata: {
          userId,
          plan,
        },
        // Return URLs after payment
        redirect_url: `${process.env.VITE_API_URL}/subscription?success=true`,
        cancel_url: `${process.env.VITE_API_URL}/subscription?canceled=true`,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(()=>({}));
      throw new Error(errData.message || `Squad API error: ${response.status}`);
    }

    const data = await response.json();

    // Return checkout URL or session ID
    res.status(200).json({
      success: true,
      checkoutUrl: data.checkout_url || data.url,
      sessionId: data.id,
    });
  } catch (error) {
    console.error('Squad payment creation failed:', error);
    res.status(500).json({ error: error.message });
  }
}
