import { motion } from "framer-motion";
import { MessageCircle, Heart, Share2, User, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getPosts, createPost, likePost, addComment, TOPICS } from "../services/communityEngine";
import { useStatus } from "../hooks/useStatus";
import LoadingSpinner from "../components/LoadingSpinner";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  topic: string;
  content: string;
  likes: string[];
  comments: Array<{ id: string; authorId: string; authorName: string; text: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { showStatus } = useStatus();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("general");
  const [showCreate, setShowCreate] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [commenting, setCommenting] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      setError(null);
      const data = await getPosts(null, 20);
      setPosts(data as Post[]);
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError("Could not load community posts.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newPostContent.trim()) return;

    try {
      const post = await createPost(user.id, selectedTopic, newPostContent.trim());
      const newPost: Post = {
        ...post,
        authorName: user.user_metadata?.displayName || user.email || "User",
        authorAvatar: "👤",
        likes: [],
        comments: [],
      } as Post;
       setPosts([newPost, ...posts]);
       setNewPostContent("");
       showStatus("success", "Posted!", "Your post has been shared.");
     } catch (err) {
      console.error("Failed to create post:", err);
      showStatus("error", "Failed", "Could not create post.");
    }
  }

  async function handleLike(postId: string) {
    if (!user) return;
    try {
      const updated = await likePost(postId, user.id);
      setPosts(posts.map((p) => (p.id === postId ? (updated as Post) : p)));
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  }

  async function handleAddComment(postId: string) {
    if (!user || !commentText[postId]?.trim()) return;
    try {
      setCommenting(postId);
      const updatedPost = await addComment(postId, user.id, commentText[postId].trim());
      setPosts(posts.map((p) => (p.id === postId ? (updatedPost as Post) : p)));
      setCommentText({ ...commentText, [postId]: "" });
    } catch (err) {
      console.error("Failed to add comment:", err);
      showStatus("error", "Failed", "Could not add comment.");
    } finally {
      setCommenting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Loading community posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Community</h1>
          <p className="text-slate-400 text-sm">Connect with others on the same journey</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-rose-300">{error}</p>
          <button
            onClick={loadPosts}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-white"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Community</h1>
        <p className="text-slate-400 text-sm">Connect with others on the same journey</p>
      </div>

      {/* Create Post */}
      {showCreate ? (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreatePost}
          className="glass-card p-4 space-y-3"
        >
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white"
          >
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newPostContent.trim()}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
            >
              Post
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full px-4 py-3 bg-teal-600/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <User size={16} />
          Create Post
        </button>
      )}

      {/* Posts list */}
      <div className="space-y-4">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-xl">
                {post.authorAvatar}
              </div>
              <div>
                <p className="font-medium text-white text-sm">{post.authorName}</p>
                <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed mb-3">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1.5 hover:text-rose-400 transition-colors ${user && post.likes?.includes(user.id) ? "text-rose-400" : ""}`}
              >
                <Heart size={16} fill={user && post.likes?.includes(user.id) ? "currentColor" : "none"} />
                {post.likes?.length || 0}
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById(`comments-${post.id}`);
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-1.5 hover:text-teal-400 transition-colors"
              >
                <MessageCircle size={16} />
                {post.comments?.length || 0}
              </button>
              <button
                onClick={() => {
                  navigator.share?.({
                    text: post.content,
                    title: "Community Post",
                  });
                }}
                className="flex items-center gap-1.5 hover:text-slate-200 ml-auto"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>

            {/* Comments */}
            {post.comments?.length > 0 && (
              <div id={`comments-${post.id}`} className="mt-4 pt-4 border-t border-white/5 space-y-3">
                {post.comments.map((c) => (
                  <div key={c.id} className="flex gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm">
                      {c.authorAvatar || "👤"}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300">
                        <span className="font-medium">{c.authorName}</span> {c.text}
                      </p>
                      <p className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={commentText[post.id] || ""}
                onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddComment(post.id);
                }}
              />
              <button
                onClick={() => handleAddComment(post.id)}
                disabled={commenting === post.id || !commentText[post.id]?.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:opacity-50 rounded-lg text-white transition-colors"
              >
                {commenting === post.id ? <Loader2 size={16} className="animate-spin" /> : "Send"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
