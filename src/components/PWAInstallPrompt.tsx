import { usePWAInstall } from "../hooks/usePWAInstall";

export default function PWAInstallPrompt() {
  const { isInstallable, isIOS, installApp } = usePWAInstall();

  if (!isInstallable && !isIOS) return null;

  return (
    <div className="glass-card p-4 text-center">
      {isIOS ? (
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Install VitaChain</h3>
          <p className="text-slate-300 mb-3">
            To install this app on your iOS device, tap the <strong>Share</strong> button <span role="img" aria-label="share">📤</span> and then <strong>Add to Home Screen</strong>.
          </p>
          <div className="text-2xl mb-2">📱</div>
        </div>
      ) : (
        <button
          onClick={installApp}
          className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Install VitaChain
        </button>
      )}
    </div>
  );
}
