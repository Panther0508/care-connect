import { useSessionTimeout } from '../hooks/useSessionTimeout';

/**
 * Example component demonstrating useSessionTimeout hook
 */
export function SessionTimeoutExample() {
  // Reset session after 5 minutes of inactivity
  const { 
    resetTimer, 
    getIdleTime, 
    getRemainingTime, 
    isIdle 
  } = useSessionTimeout(
    5 * 60 * 1000, // 5 minutes in milliseconds
    () => {
      // Handle timeout - e.g., logout user, show modal, etc.
      console.log('Session timed out due to inactivity');
      // In a real app, you might:
      // - Redirect to login page
      // - Show a warning modal
      // - Clear sensitive data
    },
    ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] // Default activities
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Session Timeout Example</h2>
      <p className="mb-2">Idle time: {Math.floor(getIdleTime() / 1000)} seconds</p>
      <p className="mb-2">Time remaining: {Math.floor(getRemainingTime() / 1000)} seconds</p>
      <p className="mb-2">Is idle: {isIdle ? 'Yes' : 'No'}</p>
      <button 
        onClick={resetTimer}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Manual Reset
      </button>
      {isIdle && (
        <div className="mt-4 p-3 bg-red-500/20 rounded border border-red-500/50 text-red-400">
          Session has expired! Please take action.
        </div>
      )}
    </div>
  );
}