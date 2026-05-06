import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

interface CitationBadgeProps {
  index: number;
  citation: {
    title?: string;
    url: string;
  };
}

export default function CitationBadge({ index, citation }: CitationBadgeProps) {
  const [show, setShow] = useState(false);
  const { title, url } = citation;

  return (
    <>
      <button
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-medium hover:bg-teal-500/30 transition-colors"
        title={title || url}
      >
        [{index + 1}]
      </button>

      {show && (
        <div className="absolute z-50 mt-1 w-64 p-3 rounded-lg bg-slate-900/95 border border-slate-700/50 shadow-xl pointer-events-none">
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{title || url}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-teal-400">
            <ExternalLink size={12} />
            <span>Open source</span>
          </div>
        </div>
      )}
    </>
  );
}
