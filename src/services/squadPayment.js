const API_URL = import.meta.env.VITE_API_URL || '';

export async function initiateSquadPayment({ amount, plan, userId, email }) {
  try {
    const response = await fetch(`${API_URL}/api/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, plan, userId, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Payment initiation failed');
    }

    return { success: true, checkoutUrl: data.checkoutUrl, sessionId: data.sessionId };
  } catch (error) {
    console.error('Squad payment error:', error);
    return { success: false, error: error.message };
  }
}

export async function verifySquadPayment(sessionId) {
  // Optional: verify payment status via backend
  try {
    const response = await fetch(`${API_URL}/api/verify-payment?sessionId=${sessionId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Verification error:', error);
    return { verified: false, error: error.message };
  }
}
