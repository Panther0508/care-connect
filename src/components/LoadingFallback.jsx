export default function LoadingFallback({ message = 'Loading...', showProgress = false }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          {/* Fixed centered Vita avatar - does NOT rotate */}
          <div className="w-20 h-20 mx-auto">
            <img
              src="/avatars/vita-loading.png"
              alt="Vita loading"
              className="w-full h-full object-contain"
              loading="lazy"
              onError={(e) => { e.target.src = '/avatars/default.png'; }}
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
              }}
            />
          </div>
          {/* Rotating ring around the avatar - pure CSS spin using Tailwind animate-spin */}
          <div
            className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-t-teal-500 border-transparent animate-spin"
            style={{
              boxShadow: '0 0 12px rgba(20, 184, 166, 0.3)',
            }}
          />
        </div>
        <p className="text-slate-300 font-medium">{message}</p>
        {showProgress && (
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400"
              style={{
                width: '100%',
                animation: 'progressIndeterminate 1.5s ease-in-out infinite',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

