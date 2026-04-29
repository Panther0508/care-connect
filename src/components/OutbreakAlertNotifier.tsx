import { useEffect, useCallback } from 'react';
import { useStatus } from '../hooks/useStatus';

export default function OutbreakAlertNotifier() {
  const { showStatus } = useStatus();

  const handleOutbreakAlert = useCallback((event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail) {
      showStatus(
        'alert',
        'Community Health Alert',
        `${detail.count} people in ${detail.region} recently searched for "${detail.term}". Consider consulting a health worker if you experience symptoms.`,
        { duration: 15000 }
      );
    }
  }, [showStatus]);

  useEffect(() => {
    window.addEventListener('outbreakAlert', handleOutbreakAlert);
    return () => window.removeEventListener('outbreakAlert', handleOutbreakAlert);
  }, [handleOutbreakAlert]);

  return null; // No UI
}
