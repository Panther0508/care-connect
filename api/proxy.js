// Using native globalThis.fetch (Node 18+)

// CORS-enabled serverless proxy for bypassing browser restrictions
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

   const { targetUrl, method = 'POST', headers = {}, body } = req.body;

   if (!targetUrl || typeof targetUrl !== 'string') {
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.status(400).json({ error: 'targetUrl is required' });
     return;
   }

   try {
     // Build forwarded headers
     const forwardedHeaders = {
       'User-Agent': 'Mozilla/5.0 (compatible; VitaChain/1.0)',
       'Accept': 'application/json, text/plain, */*',
       ...headers,
     };

     // Add HuggingFace Authorization if target is HF and we have a key
     if (targetUrl.includes('api-inference.huggingface.co') || targetUrl.includes('huggingface.co')) {
       const hfKey = process.env.VITE_HF_API_KEY || process.env.HF_API_KEY;
       if (hfKey) {
         forwardedHeaders['Authorization'] = `Bearer ${hfKey}`;
       }
     }

     const response = await fetch(targetUrl, {
       method: method,
       headers: forwardedHeaders,
       body: body !== undefined ? JSON.stringify(body) : undefined,
       signal: AbortSignal.timeout(15000),
     });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(response.status).json(data);
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      error: 'Proxy request failed',
      details: error.message,
    });
  }
}
