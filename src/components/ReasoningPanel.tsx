import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  Brain,
  Microscope,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ChevronDown,
  ExternalLink
} from "lucide-react";

export type ReasoningStep = {
  step: number;
  action: string;
  icon: string; // emoji or identifier
  detail: string;
  duration_ms: number;
  source_urls?: string[];
  status: "complete" | "running" | "error" | "pending";
};

interface ReasoningPanelProps {
  reasoningSteps: ReasoningStep[];
  citations?: Array<{ index: number; url: string; title: string; snippet: string }>;
  modelUsed?: string;
  responseTime?: number;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  search: Search,
  inference: Brain,
  clinical: Microscope,
  complete: CheckCircle2,
  warning: AlertCircle,
  cache: Clock,
  default: FileText
};

const STEP_COLORS: Record<string, string> = {
  search: "bg-teal-500 border-teal-400 text-teal-400",
  inference: "bg-amber-500 border-amber-400 text-amber-400",
  clinical: "bg-emerald-500 border-emerald-400 text-emerald-400",
  complete: "bg-emerald-500 border-emerald-400 text-emerald-400",
  error: "bg-red-500 border-red-400 text-red-400",
  pending: "bg-slate-500 border-slate-400 text-slate-400",
  cache: "bg-blue-500 border-blue-400 text-blue-400",
  default: "bg-slate-500 border-slate-400 text-slate-400"
};

const DOT_SIZES: Record<string, number> = {
  complete: 14,
  default: 10
};

function getColorKey(step: ReasoningStep, isLast: boolean): string {
  const { icon, status, action } = step;
  const act = action.toLowerCase();

  // Search/retrieval → teal
  if (icon === "🔍" || icon === "🌐" || act.includes("search") || act.includes("retrieving")) return "search";
  // AI inference (including fallbacks) → amber
  if (icon === "🧠" || icon === "🔗" || icon === "🤖" || act.includes("generating") || act.includes("processing") || act.includes("model") || act.includes("fallback")) return "inference";
  // Cache hit → blue
  if (icon === "💾") return "cache";
  // Error
  if (status === "error") return "error";
  // Pending/skipped
  if (status === "pending") return "pending";
  // Final completion (last step) → emerald with glow
  if (isLast && status === "complete") return "complete";
  // Other complete steps (non-last) -> clinical/emerald without glow
  if (status === "complete") return "clinical";

  return "default";
}

export default function ReasoningPanel({
  reasoningSteps,
  citations = [],
  modelUsed = "AI Model",
  responseTime = 0,
  isExpanded: controlledIsExpanded,
  onToggle
}: ReasoningPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalOpen;
  const toggleExpanded = onToggle ? () => onToggle(!isExpanded) : () => setInternalOpen(!isExpanded);

  if (!reasoningSteps || reasoningSteps.length === 0) return null;

  const stepCount = reasoningSteps.length;
  const totalTime = responseTime || reasoningSteps.reduce((acc, s) => acc + (s.duration_ms || 0), 0);
  const formattedTime = totalTime < 1000 ? `${totalTime}ms` : `${(totalTime / 1000).toFixed(1)}s`;

  // Reduced motion support
  const prefersReducedMotion = useReducedMotion();
  const animDuration = prefersReducedMotion ? 0 : 0.3;

  // Timeline variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
        delayChildren: prefersReducedMotion ? 0 : 0.1
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: animDuration, ease: "easeOut" as const }
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-lg overflow-hidden">
      {/* Collapsed pill header */}
      <button
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Hide reasoning details" : "Show reasoning details"}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span className="text-sm font-medium text-slate-200">Show reasoning</span>
          <span className="text-xs text-slate-500">({stepCount} step{stepCount !== 1 ? 's' : ''})</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: animDuration, ease: "easeOut" as const }}
          className="text-slate-400"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      {/* Expanded timeline panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: animDuration, ease: "easeInOut" as const }}
            className="overflow-hidden"
          >
            {/* Model info header */}
            <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-2 text-xs text-slate-500 border-b border-white/5">
              Model: <span className="text-slate-400 font-mono">{modelUsed}</span>
              {" · "}
              Total: <span className="text-slate-400 font-mono">{formattedTime}</span>
            </div>

            {/* Vertical timeline */}
            <div className="px-3 sm:px-4 pb-4 pt-3 relative">
              {/* Connector line - positioned at left with padding */}
              <div className="absolute left-[19px] top-16 bottom-4 w-0.5 bg-gradient-to-b from-teal-500/60 via-teal-500/30 to-transparent" />

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-0"
                role="list"
                aria-label="Reasoning steps timeline"
              >
                {reasoningSteps.map((step, idx) => {
                  const isLast = idx === reasoningSteps.length - 1;
                  const colorKey = getColorKey(step, isLast);
                  const colorClass = STEP_COLORS[colorKey] || STEP_COLORS.default;
                  const dotSize = isLast && step.status === "complete" ? DOT_SIZES.complete : DOT_SIZES.default;

                  // Determine icon from step.icon string (if it's an emoji, just display it)
                  const stepIcon = step.icon && !step.icon.match(/^[A-Za-z]/) ? step.icon : undefined;
                  const IconComponent = stepIcon ? undefined : (STEP_ICONS[step.status] || STEP_ICONS.default);

                  return (
                      <motion.div
                        key={idx}
                        variants={stepVariants}
                        className="relative pl-4 sm:pl-8"
                        role="listitem"
                      >
                      {/* Step dot on connector line */}
                      <div
                        className={`absolute left-[11px] top-2 rounded-full border-2 ${colorClass} flex items-center justify-center z-10`}
                        style={{
                          width: dotSize,
                          height: dotSize,
                          boxShadow: isLast && step.status === "complete"
                            ? "0 0 12px rgba(16,185,129,0.6)"
                            : "none"
                        }}
                        aria-label={`Step ${step.step} status: ${step.status}`}
                      >
                        {stepIcon ? (
                          <span className="text-[10px] leading-none">{stepIcon}</span>
                        ) : (
                          <IconComponent size={dotSize * 0.55} />
                        )}
                      </div>

                      {/* Step content card */}
                      <div className="glass-card bg-slate-800/60 border border-slate-700/40 rounded-lg p-2 sm:p-3 shadow-sm w-full max-w-[90%] sm:max-w-[85%]">
                        {/* Header: step number, action, duration */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">
                              Step {step.step}
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-slate-100 leading-tight">
                              {step.action}
                            </span>
                          </div>
                          {step.duration_ms && (
                            <span className="text-xs text-slate-500 flex items-center gap-1 whitespace-nowrap">
                              <Clock size={11} />
                              {step.duration_ms < 1000
                                ? `${step.duration_ms}ms`
                                : `${(step.duration_ms / 1000).toFixed(1)}s`}
                            </span>
                          )}
                        </div>

                          {step.detail && (
                            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                              {step.detail}
                            </p>
                          )}

                        {/* Collapsible sources subsection */}
                        {step.source_urls && step.source_urls.length > 0 && (
                          <CollapsibleSources sources={step.source_urls} />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Collapsible sources subcomponent
function CollapsibleSources({ sources }: { sources: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs flex items-center gap-1 text-teal-400 hover:text-teal-300 transition-colors focus:outline-none"
        aria-expanded={open}
      >
        <span className="text-xs">📎</span>
        <span className="font-medium">Sources</span>
        <span className="text-slate-500">({sources.length})</span>
        <span className="transition-transform duration-200">{open ? "▴" : "▾"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 overflow-hidden"
          >
            <div className="flex flex-wrap gap-2">
              {sources.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-teal-500/12 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 hover:border-teal-500/50 transition-colors"
                  title={url}
                >
                  <ExternalLink size={10} />
                  <span>Source {i + 1}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
