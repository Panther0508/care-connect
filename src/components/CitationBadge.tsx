import { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";

interface CitationBadgeProps {
  index: number;
  citation: {
    title?: string;
    url: string;
    snippet?: string;
  };
}

export default function CitationBadge({ index, citation }: CitationBadgeProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { title, url, snippet } = citation;

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShow(true);
  };

  const handleMouseLeave = () => {
    // Auto-hide after 5 seconds
    timeoutRef.current = setTimeout(() => {
      setShow(false);
    }, 5000);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
    setShow(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Truncate snippet to ~120 chars
  const displaySnippet = snippet ? `${snippet.substring(0, 120)}${snippet.length > 120 ? '...' : ''}` : '';

  return (
    <>
      <button
        data-testid="citation-badge"
        onClick={handleOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-teal-500/12 border border-teal-500/30 text-teal-400 text-xs font-medium hover:bg-teal-500/20 hover:border-teal-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        title={title || url}
        aria-label={`Citation ${index + 1}: ${title || url}`}
      >
        [{index + 1}]
      </button>

      {show && (
        <div
          className="absolute z-50 mt-1 w-72 p-3 rounded-lg bg-slate-900/95 border border-slate-700/50 shadow-xl pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200"
          style={{ pointerEvents: "auto" }}
        >
          {title && (
            <p className="text-xs font-semibold text-slate-100 leading-tight mb-1 line-clamp-2">
              {title}
            </p>
          )}
          {displaySnippet && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
              {displaySnippet}
            </p>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
            <span>Open in new tab</span>
          </a>
        </div>
      )}
    </>
  );
}
