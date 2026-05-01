// src/pages/TopicFeed.jsx
import { useState, useEffect } from 'react';
import { getPosts, likePost, addComment } from '../services/communityEngine';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Heart, MessageSquare } from 'lucide-react';

export function TopicFeed() {
  const { topicId } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');

  // Find topic name from TOPICS (we'll import it)
  const topicName = topicId; // In a real app, we'd map from TOPICS

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const topicData = await getPosts(topicId, 20);
        setPosts(topicData);
      } catch (err) {
        console.error('Failed to load posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [topicId]);

  const handleLike = async (postId) => {
    try {
      const updatedPost = await likePost(postId, 'current-user'); // Placeholder userId
      // Update the post in the list
      setPosts(posts.map(post => post.id === postId ? updatedPost : post));
    } catch (err) {
      console.error('Failed to like post:', err);
      alert('Failed to like post');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      // We need to know which post we are commenting on - in a real app, this would be from UI state
      // For simplicity, we'll assume we are commenting on the first post (not ideal)
      // This is a placeholder implementation
      const updatedPost = await addComment(posts[0]?.id || 0, 'current-user', newComment);
      setPosts(posts.map(post => post.id === updatedPost.id ? updatedPost : post));
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-900 p-4"
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-pulse rounded-full w-16 h-16 bg-teal-500/20 mb-4"></div>
          <p className="text-slate-400">Loading posts...</p>
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
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-slate-100">
            {topicName}
          </h1>
          <Link to="/community" className="text-sm text-teal-400 hover:underline">
            ← Back to Topics
          </Link>
        </div>
        <p className="text-slate-400">
          Discussions and support for {topicName}
        </p>
      </div>

      {/* Posts List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 50 }}
              className="glass-card p-4 mb-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <div className="text-teal-400">👤</div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-slate-100">
                      User {post.authorId?.substring(0, 6)}...
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap">{post.content}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 text-sm 
                        ${post.likes?.includes('current-user') 
                          ? 'text-teal-400' 
                          : 'text-slate-400'}`}
                    >
                      <Heart size={16} />
                      <span>{post.likes?.length || 0}</span>
                    </button>
                    <button 
                      onClick={() => {
                        // In a real app, we'd open a comment input for this specific post
                        // For now, we'll just focus the new comment input (not ideal)
                        alert('Comment feature would open here for this post');
                      }}
                      className="flex items-center gap-1 text-sm text-slate-400"
                    >
                      <MessageSquare size={16} />
                      <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">
              No posts yet. Be the first to start a discussion!
            </p>
            <Link 
              to={`/community/${topicId}/new`} 
              className="inline-block mt-4 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Start a Discussion
            </Link>
          </div>
        )}
      </motion.div>

      {/* New Comment Form (simplified - in reality this would be per post) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <h3 className="font-semibold text-slate-100 mb-3">Add a Comment</h3>
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="glass-input flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="btn-primary px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}