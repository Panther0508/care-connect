import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Phone, MapPin, Clock, CheckCircle } from 'lucide-react';
import { useStatus } from '../hooks/useStatus';

export default function ContactUs() {
  const { showStatus } = useStatus();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      showStatus('error', 'Missing Fields', 'Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call or use actual endpoint when backend is ready
      await new Promise(r => setTimeout(r, 1200));
      setSubmitted(true);
      showStatus('success', 'Message Sent', 'We\'ll get back to you within 24-48 hours.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      showStatus('error', 'Send Failed', 'Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-white mb-2">Contact Us</h1>
        <p className="text-slate-400 text-sm mb-6">We're here to help with any questions</p>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Message Sent!</h2>
            <p className="text-slate-400 text-sm mb-4">
              Thank you for reaching out. Our support team will respond within 24–48 hours.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-colors"
            >
              Send Another Message
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact form */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="glass-input w-full px-4 py-2.5 text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="glass-input w-full px-4 py-2.5 text-sm"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                  <input
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="glass-input w-full px-4 py-2.5 text-sm"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    className="glass-input w-full px-4 py-2.5 text-sm resize-none"
                    placeholder="Describe your issue or question..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact info sidebar */}
            <div className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Mail className="text-teal-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Email</h3>
                    <p className="text-slate-400 text-sm">support@vitachain.ng</p>
                    <p className="text-slate-500 text-xs mt-1">Response within 24–48 hours</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Phone className="text-teal-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Phone (Nigeria)</h3>
                    <p className="text-slate-400 text-sm">+234 800 VITA CHAIN</p>
                    <p className="text-slate-500 text-xs mt-1">Mon–Fri, 8am–6pm WAT</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <MapPin className="text-teal-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Office</h3>
                    <p className="text-slate-400 text-sm">Lagos, Nigeria</p>
                    <p className="text-slate-500 text-xs mt-1">Remote-first team</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Clock className="text-teal-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Response Time</h3>
                    <p className="text-slate-400 text-sm">24–48 hours</p>
                    <p className="text-slate-500 text-xs mt-1">For urgent matters, use emergency services</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
