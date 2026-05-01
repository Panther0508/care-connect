// src/pages/PostDetail.jsx
import { useState, useEffect } from 'react';
import { getPosts, likePost, addComment } from '../services/communityEngine';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function PostDetail() {
  const { topicId, postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const posts = await getPosts(topicId, 50); // Get more posts to find the specific one
        const foundPost = posts.find(p => p.id === parseInt(postId));
        if (foundPost) {
          setPost(foundPost);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Failed to load post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [topicId, postId]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const updatedPost = await likePost(post.id, 'current-user'); // Placeholder userId
      setPost(updatedPost);
    } catch (err) {
      console.error('Failed to like post:', err);
      alert('Failed to like post');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const updatedPost = await addComment(post.id, 'current-user', newComment);
      setPost(updatedPost);
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
          <p className="text-slate-400">Loading post...</p>
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
            onClick={() => navigate(-1)} // Go back
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  if (!post) {
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
          <p className="text-slate-400 text-center mb-4">Post not found</p>
          <button 
            onClick={() => navigate(-1)} // Go back
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Go Back
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
            Post Detail
          </h1>
          <div className="flex items-center gap-2">
            <Link to={`/community/${topicId}`} className="text-sm text-teal-400 hover:underline">
              ← Back to Topic
            </Link>
            <Link to="/community" className="text-sm text-teal-400 hover:underline ml-2">
              ← Topics
            </Link>
          </div>
        </div>
        <p className="text-slate-400">
          Discussion post by {post.authorId?.substring(0, 6)}... • {new Date(post.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Post Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <div className="glass-card p-6">
          <div className="flex items-start gap-3 mb-4">
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
              <div className="mt-4 flex items-center gap-4 text-sm">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-1 text-sm 
                    ${post.likes?.includes('current-user') 
                      ? 'text-teal-400' 
                      : 'text-slate-400'}`}
                >
                  <Heart size={16} />
                  <span>{post.likes?.length || 0}</span>
                </button>
                <span className="text-slate-400">•</span>
                <button 
                  onClick={() => {
                    // Focus on comment input
                    const textarea = document.getElementById('comment-input');
                    if (textarea) textarea.focus();
                  }}
                  className="flex items-center gap-1 text-sm text-slate-400"
                >
                  <MessageSquare size={16} />
                  <span>{post.comments?.length || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comments Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <h3 className="font-semibold text-slate-100 mb-4">Comments</h3>
        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-3">
            {post.comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 30 }}
                className="glass-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <div className="text-teal-400">💬</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-slate-100">
                        User {comment.authorId?.substring(0, 6)}...
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </motion.div>

      {/* Add Comment Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <h3 className="font-semibold text-slate-100 mb-4">Add a Comment</h3>
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              id="comment-input"
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