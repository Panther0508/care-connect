import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, FileText, BookOpen, Save, MessageCircle, ExternalLink } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { Skeleton } from '../components/ui/skeleton';
import { saveLiterature } from '../lib/idb';

const SkeletonCard = () => (
  <div className="glass-card rounded-2xl p-5 border border-slate-700/40">
    <Skeleton className="h-6 w-3/4 mb-3" />
    <Skeleton className="h-4 w-1/2 mb-2" />
    <Skeleton className="h-4 w-1/3 mb-3" />
    <Skeleton className="h-12 w-full mb-3" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-28" />
    </div>
  </div>
);

export default function LiteratureSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    articleType: 'all',
    freeFullText: false,
  });

  const searchPubMed = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResults([]);
    
    try {
      let searchQuery = query.trim();
      
      if (filters.freeFullText) {
        searchQuery += ' AND free full text[sb]';
      }
      
      if (filters.articleType !== 'all') {
        const typeMap = { 'journal': 'Journal Article', 'review': 'Review', 'clinical': 'Clinical Trial' };
        searchQuery += ` AND ${typeMap[filters.articleType]}[Publication Type]`;
      }
      
      if (filters.dateFrom) {
        searchQuery += ` AND ${filters.dateFrom}[Date - Publication]:${filters.dateTo || '3000'}[Date - Publication]`;
      }
      
      const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmode=json&retmax=20&sort=date`;
      
      const proxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: esearchUrl }),
      });
      
      if (!proxyResponse.ok) throw new Error('Search failed');
      
      const searchData = await proxyResponse.json();
      const pmids = searchData.esearchresult?.idlist || [];
      
      if (pmids.length === 0) {
        setResults([]);
        return;
      }
      
      const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
      
      const fetchResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: efetchUrl }),
      });
      
      if (!fetchResponse.ok) throw new Error('Failed to fetch article details');
      
      const xmlText = await fetchResponse.text();
      const parsedResults = parsePubMedXML(xmlText);
      setResults(parsedResults);
    } catch (err) {
      console.error('PubMed search error:', err);
      setError('Failed to search PubMed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parsePubMedXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const articles = [];
    const articleElements = xmlDoc.querySelectorAll('MedlineCitation, PubmedArticle');
    
    articleElements.forEach(article => {
      const pmid = article.querySelector('PMID')?.textContent || '';
      const articleData = article.querySelector('Article') || article;
      
      const title = articleData.querySelector('ArticleTitle')?.textContent || 'No title';
      
      const authors = Array.from(articleData.querySelectorAll('Author'))
        .map(a => {
          const lastName = a.querySelector('LastName')?.textContent || '';
          const firstName = a.querySelector('ForeName')?.textContent || '';
          const collective = a.querySelector('CollectiveName')?.textContent || '';
          return collective || `${lastName} ${firstName}`.trim();
        })
        .filter(a => a)
        .slice(0, 3);
      
      const journal = articleData.querySelector('Journal Title')?.textContent || 
                      articleData.querySelector('Title')?.textContent || 'Unknown Journal';
      
      const pubDate = articleData.querySelector('PubDate') || articleData.querySelector('DateCompleted');
      let formattedDate = '';
      if (pubDate) {
        const year = pubDate.querySelector('Year')?.textContent || '';
        const month = pubDate.querySelector('Month')?.textContent || '';
        const day = pubDate.querySelector('Day')?.textContent || '';
        formattedDate = [year, month, day].filter(Boolean).join(' ');
      }
      
      const abstractText = articleData.querySelector('AbstractText')?.textContent || '';
      
      articles.push({
        pmid,
        title,
        authors: authors.length > 0 ? authors : ['Unknown'],
        journal,
        pubDate: formattedDate || 'Unknown',
        abstract: abstractText || 'No abstract available.',
      });
    });
    
    return articles;
  };

  const handleSave = async (article) => {
    try {
      await saveLiterature({ ...article, savedAt: Date.now() });
    } catch (err) {
      console.error('Failed to save article:', err);
    }
  };

  const handleDiscussWithAI = (abstract) => {
    const encodedAbstract = encodeURIComponent(abstract.substring(0, 1000));
    navigate(`/ai?context=${encodedAbstract}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPubMed();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-4 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Literature Search</h1>
            <p className="text-slate-400 text-sm">Search PubMed for medical literature</p>
          </div>
        </div>

        <GlassCard className="p-5">
          <div className="space-y-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter search terms (e.g., diabetes treatment)"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Article Type</label>
                <select
                  value={filters.articleType}
                  onChange={(e) => setFilters({ ...filters, articleType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-100"
                >
                  <option value="all">All Types</option>
                  <option value="journal">Journal Articles</option>
                  <option value="review">Reviews</option>
                  <option value="clinical">Clinical Trials</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.freeFullText}
                    onChange={(e) => setFilters({ ...filters, freeFullText: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-teal-500 focus:ring-teal-500/50"
                  />
                  <span className="text-sm text-slate-300">Free full text</span>
                </label>
              </div>
            </div>

            <button
              onClick={searchPubMed}
              disabled={loading || !query.trim()}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Search PubMed
                </>
              )}
            </button>
          </div>
        </GlassCard>

        {error && (
          <div className="glass-card rounded-xl p-4 border border-red-500/30 bg-red-500/10">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Results ({results.length})</h2>
            <AnimatePresence>
              {results.map((article, idx) => (
                <motion.div
                  key={article.pmid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard className="p-5 border-slate-700/40">
                    <div className="space-y-3">
                      <h3 className="text-white font-medium leading-tight">{article.title}</h3>
                      <div className="text-sm text-slate-400">
                        <p>{article.authors.join(', ')}</p>
                        <p>{article.journal} • {article.pubDate}</p>
                      </div>
                      <p className="text-slate-300 text-sm line-clamp-3">{article.abstract}</p>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSave(article)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                        >
                          <Save size={14} />
                          Save
                        </button>
                        <button
                          onClick={() => handleDiscussWithAI(article.abstract)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 rounded-lg text-xs transition-colors"
                        >
                          <MessageCircle size={14} />
                          Discuss with Vita AI
                        </button>
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                        >
                          <ExternalLink size={14} />
                          PubMed
                        </a>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="glass-card rounded-xl p-8 text-center border border-slate-700/40">
            <BookOpen size={48} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-300">No results found. Try adjusting your search terms.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}