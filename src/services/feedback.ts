// No imports needed; uses fetch directly

/**
 * Submits feedback for a facility to the Vercel API
 * @param facilityId - The ID of the facility
 * @param helpful - Whether the facility was helpful
 * @returns Promise with the result
 */
export async function submitFeedback(facilityId: string, helpful: boolean): Promise<{ success: boolean }> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (!apiUrl) {
      throw new Error('VITE_API_URL is not configured');
    }

    const response = await fetch(`${apiUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        facilityId,
        confirmed: true, // We only submit feedback when a reservation is confirmed
        helpful
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.status}`);
    }

    return await response.json();
    } catch (err) {
      throw err;
    }
}

/**
 * Updates local counters for feedback (for offline use or immediate UI updates)
 */
export function updateLocalFeedbackCounts(helpful: boolean): void {
  // Increment total connections counter
  const connections = parseInt(localStorage.getItem('caresentinel_connections') || '0', 10);
  localStorage.setItem('caresentinel_connections', (connections + 1).toString());

  // If helpful, increment helpful counter
  if (helpful) {
    const helpfulCount = parseInt(localStorage.getItem('caresentinel_helpful') || '0', 10);
    localStorage.setItem('caresentinel_helpful', (helpfulCount + 1).toString());
  }
}

/**
 * Gets local feedback counts
 */
export function getLocalFeedbackCounts(): { connections: number; helpful: number } {
  const connections = parseInt(localStorage.getItem('caresentinel_connections') || '0', 10);
  const helpful = parseInt(localStorage.getItem('caresentinel_helpful') || '0', 10);
  return { connections, helpful };
}