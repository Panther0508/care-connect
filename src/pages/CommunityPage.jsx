// src/pages/CommunityPage.jsx
import { useState, useEffect } from 'react';
import { getTopics } from '../services/communityEngine';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import SkeletonCard from '../components/SkeletonCard';

export function CommunityPage() {
  const [topics, setTopics] = useState([]);
  const [displayedTopics, setDisplayedTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true);
      setError(null);
      try {
        const topicData = await getTopics();
        setTopics(topicData);
        setDisplayedTopics(topicData.slice(0, 10));
        setHasMore(topicData.length > 10);
      } catch (err) {
        console.error('Failed to load topics:', err);
        setError('Failed to load community topics');
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  const loadMore = async () => {
    const nextBatch = topics.slice(displayedTopics.length, displayedTopics.length + 10);
    setDisplayedTopics(prev => [...prev, ...nextBatch]);
    setHasMore(displayedTopics.length + nextBatch.length < topics.length);
  };

  const { sentinelRef, isFetching } = useInfiniteScroll(loadMore, hasMore);

  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true);
      setError(null);
      try {
        const topicData = await getTopics();
        setTopics(topicData);
      } catch (err) {
        console.error('Failed to load topics:', err);
        setError('Failed to load community topics');
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-900 p-4"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-slate-700 rounded w-1/3 skeleton-shimmer" />
            <div className="h-4 bg-slate-700 rounded w-1/2 skeleton-shimmer" />
          </div>
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} variant="github" lines={3} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-900 p-4"
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          <p className="text-slate-400 text-center mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-900"
    >
      {/* Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          Community
        </h1>
        <p className="text-slate-400">
          Connect with others on similar health journeys
        </p>
        <Link to="/community" className="inline-block mt-4 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600">
          New Post
        </Link>
      </div>

      {/* Topics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Health Topics
        </h2>
        <p className="text-slate-400 mb-4">
          Join discussions about health topics that matter to you
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTopics.map(topic => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: topic.id.length * 10 }}
              className="glass-card p-4 cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => {
                // Navigate to topic feed
                window.location.href = `/community/${topic.id}`;
              }}
            >
              <div className="flex items-center justify-start mb-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  {/* Topic-specific icons would go here */}
                  <div className="text-teal-400 text-2xl">
                    {/* Placeholder icon */}
                    <span>💬</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-slate-100">{topic.name}</h3>
                  <p className="text-xs text-slate-400">
                    {topic.postCount} post{topic.postCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-teal-400">Join Discussion</span>
                <ChevronRight size={14} className="text-teal-400" />
              </div>
            </motion.div>
          ))}
        </div>
        {isFetching && <div className="text-center py-4 text-slate-400">Loading more topics...</div>}
        <div ref={sentinelRef} className="h-10" />
      </motion.div>
    </motion.div>
  );
}