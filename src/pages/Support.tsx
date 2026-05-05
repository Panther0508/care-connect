import { useState } from "react";
import { motion } from "framer-motion";
import { useStatus } from "../hooks/useStatus";
import { Send, MessageSquare, Ticket, ChevronRight, Clock, CheckCircle, XCircle } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: number;
  responses: Array<{ text: string; from: "user" | "support"; timestamp: number }>;
}

export default function Support() {
  const { showStatus } = useStatus();
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "1",
      subject: "AI response seems inaccurate",
      message: "The AI gave me advice that contradicts my doctor's recommendations.",
      status: "in_progress",
      createdAt: Date.now() - 86400000 * 2,
      responses: [
        { text: "Thank you for reporting this. We're reviewing the response.", from: "support", timestamp: Date.now() - 86400000 },
      ],
    },
  ]);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    setSubmitting(true);
    try {
      const ticket: Ticket = {
        id: Date.now().toString(),
        subject: newSubject,
        message: newMessage,
        status: "open",
        createdAt: Date.now(),
        responses: [],
      };
      setTickets(prev => [ticket, ...prev]);
      setNewSubject("");
      setNewMessage("");
      showStatus("success", "Ticket Submitted", "Our support team will respond within 24-48 hours.");
    } catch (err) {
      showStatus("error", "Submission Failed", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "open": return "text-amber-400 bg-amber-500/10";
      case "in_progress": return "text-blue-400 bg-blue-500/10";
      case "resolved": return "text-emerald-400 bg-emerald-500/10";
    }
  };

  const getStatusIcon = (status: Ticket["status"]) => {
    switch (status) {
      case "open": return <Clock size={12} />;
      case "in_progress": return <MessageSquare size={12} />;
      case "resolved": return <CheckCircle size={12} />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Help & Support</h1>
        <p className="text-slate-400">Get assistance with VitaChain</p>
      </div>

      {/* FAQ quick links */}
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { title: "How does AI work?", desc: "Learn about our offline and online modes" },
          { title: "Privacy & Security", desc: "How your data is protected" },
          { title: "Guest Mode", desc: "Using VitaChain on shared devices" },
          { title: "Voice-Only Mode", desc: "Interact without reading" },
        ].map((faq, idx) => (
          <button
            key={idx}
            className="glass-card p-4 text-left hover:border-teal-500/30 transition-all"
          >
            <h3 className="font-medium text-white mb-1">{faq.title}</h3>
            <p className="text-slate-400 text-xs">{faq.desc}</p>
          </button>
        ))}
      </div>

      {/* Support ticket form */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Ticket size={18} className="text-teal-400" />
          Submit a Support Ticket
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject</label>
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="glass-input w-full px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              placeholder="Provide details so we can help you effectively..."
              className="glass-input w-full px-4 py-3 text-sm resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newSubject.trim() || !newMessage.trim()}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-medium transition-all flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Ticket
              </>
            )}
          </button>
        </form>
      </div>

      {/* Ticket history */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white px-1">Your Tickets</h2>
        {tickets.length === 0 ? (
          <div className="glass-card p-6 text-center text-slate-400 text-sm">
            No tickets yet. Submit one above if you need help.
          </div>
        ) : (
          tickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white truncate">{ticket.subject}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs truncate">{ticket.message}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className={`text-slate-400 transition-transform ${
                    expandedTicket === ticket.id ? "rotate-90" : ""
                  }`}
                />
              </button>

              {expandedTicket === ticket.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  className="border-t border-white/5 px-4 py-3 bg-slate-900/30"
                >
                  <div className="space-y-3">
                    {ticket.responses.map((resp, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg text-sm ${
                          resp.from === "user"
                            ? "bg-teal-500/10 border border-teal-500/20 text-slate-200 ml-8"
                            : "bg-slate-700/30 border border-slate-600/30 text-slate-300"
                        }`}
                      >
                        {resp.text}
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(resp.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <p className="text-xs text-slate-500">
                      Latest status: <span className="capitalize">{ticket.status.replace("_", " ")}</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
