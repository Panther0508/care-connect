import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, ArrowLeft } from "lucide-react";

const POSTS = {
  "1": {
    id: "1",
    author: "Amina Ibrahim",
    avatar: "👩",
    content: "Finally hit my 30-day medication streak! 💪 The reminders really help.",
    likes: 24,
    comments: [
      { id: "c1", author: "Dr. Adebayo", text: "That's wonderful consistency!" },
    ],
  },
};

export default function PostDetail() {
  const { postId } = useParams();
  const post = POSTS[postId as keyof typeof POSTS];

  if (!post) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center text-slate-400">
        Post not found
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Post</h1>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-xl">
            {post.avatar}
          </div>
          <span className="font-medium text-white">{post.author}</span>
        </div>
        <p className="text-slate-200 text-sm leading-relaxed mb-4">{post.content}</p>
        <div className="flex items-center gap-4 text-slate-400 text-sm border-t border-white/5 pt-3">
          <button className="flex items-center gap-1.5 hover:text-rose-400">
            <Heart size={16} /> {post.likes}
          </button>
          <button className="flex items-center gap-1.5 hover:text-teal-400">
            <MessageCircle size={16} /> {post.comments.length}
          </button>
          <button className="flex items-center gap-1.5 hover:text-slate-200 ml-auto">
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <h2 className="font-semibold text-white">Comments</h2>
        {post.comments.map((comment) => (
          <div key={comment.id} className="glass-card p-4">
            <p className="font-medium text-white text-sm">{comment.author}</p>
            <p className="text-slate-300 text-sm mt-1">{comment.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
