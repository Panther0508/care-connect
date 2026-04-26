export async function searchOnline(query: string) {
  const baseUrl = import.meta.env.VITE_API_URL;
  const url = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/api/search` : '/api/search';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Online search failed: ${res.status} ${errorText}`);
  }
  const data = await res.json();
  return data.results;
}
