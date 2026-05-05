import { useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ExternalLink, FileText } from "lucide-react";

interface Article {
  id: string;
  title: string;
  source: string;
  abstract: string;
  date: string;
  url: string;
}

const MOCK_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Advances in Type 2 Diabetes Management",
    source: "Journal of Clinical Endocrinology",
    abstract: "Recent studies suggest that early intensive glycaemic control reduces long-term cardiovascular events. New GLP-1 agonists show promise.",
    date: "2026-03-15",
    url: "https://example.com",
  },
  {
    id: "2",
    title: "Hypertension Treatment in African Populations",
    source: "The Lancet Global Health",
    abstract: "Low-dose thiazides remain first-line therapy. Salt reduction interventions show significant population-level impact.",
    date: "2026-01-22",
    url: "https://example.com",
  },
  {
    id: "3",
    title: "Maternal Health Interventions in Rural Settings",
    source: "BMJ Global Health",
    abstract: "Community health worker programmes reduce maternal mortality by 30% when combined with telemedicine support.",
    date: "2025-11-08",
    url: "https://example.com",
  },
];

export default function LiteratureSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>(MOCK_ARTICLES);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults(MOCK_ARTICLES);
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const filtered = MOCK_ARTICLES.filter((a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.abstract.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Literature Search</h1>
        <p className="text-slate-400 text-sm">Find evidence-based medical research</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="glass-card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search PubMed, Cochrane, guidelines..."
              className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="space-y-3">
        {results.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-400">
            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p>No articles found.</p>
          </div>
        ) : (
          results.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4"
            >
              <h3 className="font-semibold text-white leading-snug mb-1">{article.title}</h3>
              <p className="text-xs text-teal-400 mb-2">
                {article.source} • {new Date(article.date).toLocaleDateString()}
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">{article.abstract}</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-teal-400 hover:underline mt-3"
              >
                Read full article <ExternalLink size={12} />
              </a>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
