import { motion } from "framer-motion";
import { MessageCircle, Heart, Share2, User } from "lucide-react";

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
}

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: "Amina Ibrahim",
    avatar: "👩",
    content: "Finally hit my 30-day medication streak! 💪 The reminders really help.",
    likes: 24,
    comments: 5,
    time: "2h ago",
  },
  {
    id: "2",
    author: "Dr. Adebayo",
    avatar: "👨‍⚕️",
    content: "Reminder: Flu season is here. Get vaccinated and keep your hands clean! 🩺",
    likes: 156,
    comments: 23,
    time: "5h ago",
  },
  {
    id: "3",
    author: "Chinedu Okafor",
    avatar: "👨",
    content: "Anyone else using the new lab report scanner? It's a game changer for managing my diabetes.",
    likes: 18,
    comments: 7,
    time: "1d ago",
  },
];

export default function CommunityPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Community</h1>
        <p className="text-slate-400 text-sm">Connect with others on the same journey</p>
      </div>

      <div className="space-y-4">
        {MOCK_POSTS.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-xl">
                {post.avatar}
              </div>
              <div>
                <p className="font-medium text-white text-sm">{post.author}</p>
                <p className="text-xs text-slate-500">{post.time}</p>
              </div>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed mb-3">{post.content}</p>
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              <button className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                <Heart size={16} />
                {post.likes}
              </button>
              <button className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
                <MessageCircle size={16} />
                {post.comments}
              </button>
              <button className="flex items-center gap-1.5 hover:text-slate-200 ml-auto">
                <Share2 size={16} />
                Share
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <button className="w-full px-4 py-3 bg-teal-600/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
        <User size={16} />
        Create Post
      </button>
    </motion.div>
  );
}
