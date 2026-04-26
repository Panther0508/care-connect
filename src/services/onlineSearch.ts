export async function searchOnline(query: string) {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${apiUrl}/api/search`, {
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
