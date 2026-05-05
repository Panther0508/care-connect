import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Share2 } from "lucide-react";

const TOPICS: Record<string, { name: string; posts: Array<{ id: string; author: string; content: string; likes: number }> }> = {
  diabetes: {
    name: "Diabetes Management",
    posts: [
      { id: "1", author: "Amina", content: "My HbA1c dropped to 6.8% after dietary changes!", likes: 42 },
      { id: "2", author: "Dr. Smith", content: "New study confirms GLP-1 benefits for weight loss", likes: 128 },
    ],
  },
  mental_health: {
    name: "Mental Wellness",
    posts: [
      { id: "3", author: "Chinedu", content: "Meditation helped my anxiety. Try the 5-minute sessions.", likes: 35 },
    ],
  },
};

export default function TopicFeed() {
  const { topicId } = useParams();
  const topic = TOPICS[topicId as keyof typeof TOPICS] || { name: "Unknown", posts: [] };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">{topic.name}</h1>
      </div>

      <div className="space-y-4">
        {topic.posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <p className="text-slate-200 text-sm mb-3">{post.content}</p>
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              <button className="flex items-center gap-1.5 hover:text-rose-400">
                <Heart size={16} /> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 hover:text-teal-400">
                <MessageCircle size={16} /> Reply
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
