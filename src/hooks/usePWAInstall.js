import { useEffect, useState, useRef } from 'react';

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    // Detect iOS
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      deferredPromptRef.current = e;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      // Clear the deferredPrompt so the install button is hidden
      deferredPromptRef.current = null;
      setIsInstallable(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    const isAlreadyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isAlreadyInstalled) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    // Show the prompt
    const promptEvent = deferredPromptRef.current;
    if (promptEvent) {
      promptEvent.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await promptEvent.userChoice;
      // Reset the deferred prompt variable, since prompt() can only be called once.
      deferredPromptRef.current = null;
      setIsInstallable(false);
      return outcome;
    }
    return null;
  };

  return { isInstallable, isIOS, installApp };
}