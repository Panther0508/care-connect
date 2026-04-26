// src/services/onlineSearch.js
export async function searchOnline(query) {
  // Get base URL from environment variable, default to localhost for dev
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/search`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  if (!response.ok) {
    throw new Error(`Online search failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}