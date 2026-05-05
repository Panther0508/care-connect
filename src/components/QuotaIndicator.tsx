import { trendingUp, AlertCircle } from "lucide-react";

interface QuotaIndicatorProps {
  remaining: number;
  limit: number;
  model: "gemma4-31b" | "tinyllama-1.1b";
  source: "online" | "cached" | "offline";
}

export default function QuotaIndicator({ remaining, limit, model, source }: QuotaIndicatorProps) {
  // Color based on absolute quota remaining per spec:
  // green > 1000, amber > 500, red < 100
  const getColorClass = () => {
    if (remaining < 100) return "text-red-400";
    if (remaining <= 500) return "text-amber-400";
    return "text-emerald-400";
  };

  const getModelLabel = () => {
    if (source === 'cached') return 'Gemma-4 (cached)';
    if (source === 'offline') return 'TinyLlama 1.1B';
    return 'Gemma-4 31B';
  };

  const getSourceLabel = () => {
    switch (source) {
      case 'online': return 'Online';
      case 'cached': return 'Cached';
      case 'offline': return 'Offline';
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Model badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50">
        <div className={`w-2 h-2 rounded-full ${
          source === 'online' ? 'bg-teal-400 animate-pulse' :
          source === 'cached' ? 'bg-amber-400' : 'bg-slate-400'
        }`} />
        <span className="text-xs font-medium text-slate-200">{getModelLabel()}</span>
      </div>

      {/* Quota pill with progress bar */}
      <div className="relative flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50">
        <div className="text-xs text-slate-300">
          <span className="font-semibold">{remaining.toLocaleString()}</span>
          <span className="text-slate-500">/{limit.toLocaleString()}</span>
        </div>

        {/* Mini progress arc */}
        <div className="relative w-5 h-5 flex items-center justify-center">
          <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              strokeWidth="3"
              stroke="currentColor"
              strokeLinecap="round"
              className="text-slate-700"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className={getColorClass()}
              strokeDasharray={`${(remaining / limit) * 50.27} 50.27`}
            />
          </svg>
          {remaining < 100 && (
            <AlertCircle size={10} className="absolute text-red-400" />
          )}
        </div>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-50">
          {getSourceLabel()} • {remaining} queries left
        </div>
      </div>
    </div>
  );
}
