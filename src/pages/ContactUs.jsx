import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Globe, CheckCircle } from "lucide-react";
import { storeContactSubmission } from "../lib/idb";

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message.trim()) return;
    setSubmitting(true);
    try {
      // Store locally
      await storeContactSubmission({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        timestamp: Date.now(),
      });
      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Failed to send contact message:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 p-4 pb-24"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Mail size={28} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Contact Us</h1>
          <p className="text-slate-400 text-sm">We'd love to hear from you</p>
        </div>
      </div>

      {success ? (
        <div className="glass-card p-8 text-center space-y-4">
          <CheckCircle size={48} className="text-emerald-400 mx-auto" />
          <h2 className="text-xl font-semibold text-white">Message Sent!</h2>
          <p className="text-slate-400">
            Thank you for contacting us. We'll get back to you shortly.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="btn-secondary mx-auto"
          >
            Send another message
          </button>
        </div>
      ) : (
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="glass-input w-full"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="glass-input w-full"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="glass-input w-full"
                placeholder="What's this about?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                className="glass-input w-full resize-none"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm mb-3">Or reach us directly:</p>
            <a
              href="mailto:nmesirionyengbaronye@gmail.com"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
            >
              <Mail size={16} />
              nmesirionyengbaronye@gmail.com
            </a>
            <div className="mt-4">
              <a
                href="https://github.com/Panther0508/vitachain"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Globe size={16} />
                GitHub Repository
              </a>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
