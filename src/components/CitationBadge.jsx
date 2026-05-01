// src/components/CitationBadge.jsx
// Inline citation badge with tooltip and source link
import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

export default function CitationBadge({ citation, index, compact = false }) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (compact) {
    return (
      <span className="relative inline-block">
        <button
          onClick={() => setTooltipOpen(!tooltipOpen)}
          className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-teal-500/20 text-teal-300 rounded-full hover:bg-teal-500/30 transition-colors"
          title={`Source ${index + 1}`}
        >
          {index + 1}
        </button>

        {tooltipOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setTooltipOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 glass-card rounded-lg shadow-xl"
            >
              {citation.url ? (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-slate-700/30 -mx-2 px-2 py-1 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 line-clamp-3">
                        {citation.snippet || citation.title || 'View source'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {getDomain(citation.url)}
                      </p>
                    </div>
                    <ExternalLink size={12} className="text-slate-400 flex-shrink-0" />
                  </div>
                </a>
              ) : (
                <p className="text-sm text-slate-300">
                  {citation.snippet || 'No source URL available'}
                </p>
              )}
            </motion.div>
          </>
        )}
      </span>
    );
  }

  // Regular tooltip version
  return (
    <span className="relative inline-block">
      <button
        onClick={() => setTooltipOpen(!tooltipOpen)}
        className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold bg-teal-500/20 text-teal-300 rounded hover:bg-teal-500/30 transition-colors"
        title={`Source ${index + 1}: ${citation.title || citation.url}`}
      >
        {index + 1}
      </button>

      {tooltipOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setTooltipOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 glass-card rounded-lg shadow-xl"
          >
            {citation.url ? (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-slate-700/30 -mx-2 px-2 py-1 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-2">
                  <FileText size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 mb-1">
                      {citation.title || 'Source'}
                    </p>
                    <p className="text-sm text-slate-300 line-clamp-3">
                      {citation.snippet}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <ExternalLink size={10} />
                      {getDomain(citation.url)}
                    </p>
                  </div>
                </div>
              </a>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-200 mb-1">
                  {citation.title}
                </p>
                <p className="text-sm text-slate-300">{citation.snippet}</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </span>
  );
}
