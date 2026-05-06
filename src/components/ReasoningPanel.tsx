import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Globe, BookOpen, Microscope, AlertCircle, CheckCircle } from "lucide-react";

interface ReasoningStep {
  type: string;
  title: string;
  description: string;
  duration?: number; // ms
  sources?: string[]; // URLs
}

interface ReasoningPanelProps {
  reasoningSteps: ReasoningStep[];
}

export default function ReasoningPanel({ reasoningSteps }: ReasoningPanelProps) {
  const [open, setOpen] = useState(true);

  if (!reasoningSteps || reasoningSteps.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-sm font-medium text-slate-200">Reasoning Process</span>
          <span className="text-xs text-slate-500">({reasoningSteps.length} step{reasoningSteps.length !== 1 ? 's' : ''})</span>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      {/* Timeline */}
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {reasoningSteps.map((step, idx) => {
            const Icon = STEP_ICONS[step.type] || Clock;
            const colorClass = STEP_COLORS[step.type] || "text-slate-400 bg-slate-500/20 border-slate-500/30";
            return (
              <div key={idx} className="relative pl-6">
                {/* Vertical line */}
                {idx !== reasoningSteps.length - 1 && (
                  <div className="absolute left-2 top-6 bottom-[-1.25rem] w-0.5 bg-slate-700/50" />
                )}
                {/* Dot + icon */}
                <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border ${colorClass} flex items-center justify-center`}>
                  <Icon size={10} />
                </div>
                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-slate-200">{step.title}</span>
                    {step.duration && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {step.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                  {step.sources && step.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {step.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                        >
                          Source {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
