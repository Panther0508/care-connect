import { motion } from "framer-motion";
import { X, MessageSquare, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatHistoryEntry {
  id: string;
  title: string;
  preview: string;
  createdAt: number;
  messages: any[];
}

interface ChatHistorySidebarProps {
  open: boolean;
  onClose: () => void;
  history: ChatHistoryEntry[];
  onSelectChat: (entry: ChatHistoryEntry) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
}

export default function ChatHistorySidebar({
  open,
  onClose,
  history,
  onSelectChat,
  onDeleteChat,
  onNewChat,
}: ChatHistorySidebarProps) {
  const navigate = useNavigate();

  return (
    <motion.aside
      initial={{ x: "-100%" }}
      animate={{ x: open ? 0 : "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center">
            <MessageSquare size={20} className="text-white" />
          </div>
           <div>
             <h2 className="text-white font-bold text-xl tracking-tight">Chat History</h2>
             <p className="text-slate-400 text-xs">{history.length} conversations</p>
           </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 hover:border-teal-400/50 transition-all group"
        >
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 group-hover:text-teal-300">
            <Plus size={18} />
          </div>
          <span className="flex-1 text-left text-teal-200 text-sm font-medium">New Chat</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {history.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8 px-4">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p>No past conversations yet.</p>
            <p className="text-xs mt-1">Start a chat to see it here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-3 cursor-pointer hover:border-teal-500/30 transition-all group relative"
                onClick={() => {
                  onSelectChat(entry);
                  onClose();
                }}
              >
                <div className="font-medium text-slate-200 text-sm line-clamp-1 mb-1 pr-6">
                  {entry.title}
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 mb-2">
                  {entry.preview}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(entry.createdAt).toLocaleDateString()}{" "}
                  {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(entry.id);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Chat Settings
        </button>
      </div>
    </motion.aside>
  );
}
