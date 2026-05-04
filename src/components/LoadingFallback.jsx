import MagnifyingLoader from './MagnifyingLoader';

export default function LoadingFallback({ message = 'Loading...', showProgress = false }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <MagnifyingLoader size={80} />
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

