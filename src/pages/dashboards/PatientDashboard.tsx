import { useHealthGraph } from '../../hooks/useHealthGraph';
import { usePassport } from '../../hooks/usePassport';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import VitaAvatar from '../../components/VitaAvatar';
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  Heart,
  Pill,
  Shield,
  Activity,
  Share2,
  Edit3,
  FilePlus,
  ChevronRight
} from 'lucide-react';
import { getCurrentHealthState } from '../../services/healthGraph';
import { askMedicalQuestion } from '../../services/medicalAI';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conditions, medications, allergies, encounters } = useHealthGraph();
  const { recentShares } = usePassport();

  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userName = user?.firstName || "there";

  // Health snapshot stats
  const stats = [
    {
      label: "Conditions",
      value: conditions.length,
      icon: Heart,
      color: "bg-rose-500/15 text-rose-300",
      detail: conditions.length > 0 ? conditions[conditions.length - 1]?.name : "None recorded",
    },
    {
      label: "Medications",
      value: medications.length,
      icon: Pill,
      color: "bg-blue-500/15 text-blue-300",
      detail: medications.length > 0 ? `${medications.length} active` : "None active",
      warning: medications.length > 5, // Example: many meds might indicate interactions
    },
    {
      label: "Allergies",
      value: allergies.length,
      icon: Shield,
      color: "bg-amber-500/15 text-amber-300",
      detail: allergies.some((a) => a.severity === "severe")
        ? "Critical allergy recorded"
        : allergies.length > 0
        ? "Known allergies"
        : "None recorded",
    },
  ];

  // Construct care gaps from health data (simple heuristic for demo)
  const generateCareGaps = () => {
    const gaps: { icon: React.ElementType; text: string; color: string }[] = [];

    // Age-based or condition-based gaps (placeholder logic)
    const recentCondition = conditions[conditions.length - 1];
    if (recentCondition) {
      gaps.push({
        icon: AlertCircle,
        text: `Follow-up needed for ${recentCondition.name}`,
        color: "text-amber-400",
      });
    }

    // Medication review
    if (medications.length > 0) {
      gaps.push({
        icon: Pill,
        text: "Review medication interactions with your pharmacist",
        color: "text-blue-400",
      });
    }

    // No conditions? Suggest adding health info
    if (conditions.length === 0 && medications.length === 0) {
      gaps.push({
        icon: Activity,
        text: "Complete your health profile to get personalized insights",
        color: "text-teal-400",
      });
    }

    return gaps;
  };

  const careGaps = generateCareGaps();

  // Recent activity: combine passport shares and recent health updates
  const recentActivity = [
    ...recentShares.slice(0, 2).map((share) => ({
      type: "share",
      title: `Shared ${share.specialistType} passport`,
      time: new Date(share.timestamp).toLocaleDateString(),
      icon: Share2,
    })),
    ...conditions
      .slice(-2)
      .map((c) => ({
        type: "condition",
        title: `Added condition: ${c.name}`,
        time: c.diagnosedDate || "Recently",
        icon: Heart,
      })),
    ...medications
      .slice(-2)
      .map((m) => ({
        type: "medication",
        title: `Started medication: ${m.name}`,
        time: m.startDate || "Recently",
        icon: Pill,
      })),
  ]
    .sort((a, b) => {
      // Sort by date descending - simplified; would need proper date parsing
      return 0;
    })
    .slice(0, 4);

  // Quick AI inline
  const handleAiSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiResponse(null);
    try {
      const healthState = getCurrentHealthState();
      const answer = await askMedicalQuestion(healthState, aiQuery.trim());
      setAiResponse(answer);
      setAiQuery("");
    } catch (err) {
      console.error(err);
      setAiResponse("Sorry, I couldn't process that question right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const quickActions = [
    { label: "Share Passport", icon: Share2, route: "/passport", color: "from-rose-500/20 to-rose-600/20" },
    { label: "Check Medication", icon: Pill, route: "/ai", color: "from-blue-500/20 to-blue-600/20" },
    { label: "View Health Graph", icon: Activity, route: "/health", color: "from-teal-500/20 to-teal-600/20" },
    { label: "Outbreak Map", icon: Shield, route: "/outbreak", color: "from-amber-500/20 to-amber-600/20" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5 p-4 pb-24"
    >
      {/* Greeting & Avatar */}
      <div className="flex items-center gap-4">
        <VitaAvatar state="online" size={56} />
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            {timeGreeting}, {userName}
          </h1>
          <p className="text-slate-400 text-sm">Your health command center</p>
        </div>
      </div>

      {/* Health Graph Snapshot Card */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity size={20} className="text-teal-400" />
          Health Snapshot
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.button
                key={stat.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/health")}
                className="relative bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40 hover:border-teal-500/40 transition-all group text-left"
              >
                <div className={`p-2 rounded-xl w-fit mb-2 ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{stat.detail}</div>
                {stat.warning && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Upcoming Actions / Care Gaps */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertCircle size={20} className="text-amber-400" />
          Upcoming Actions
        </h2>
        {careGaps.length > 0 ? (
          <div className="space-y-2">
            {careGaps.map((gap, idx) => {
              const Icon = gap.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/40"
                >
                  <div className={`p-2 rounded-lg bg-slate-700/50 ${gap.color}`}>
                    <Icon size={16} />
                  </div>
                  <span className="flex-1 text-sm text-slate-200">{gap.text}</span>
                  <ChevronRight size={16} className="text-slate-500" />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-teal-900/30 to-cyan-900/30 rounded-xl border border-teal-700/20">
            <CheckCircle className="text-teal-400" size={24} />
            <div>
              <div className="text-teal-200 font-medium">All caught up!</div>
              <div className="text-xs text-teal-300/70">No pending actions at this time</div>
            </div>
          </div>
        )}
      </section>

      {/* Quick AI Assistant */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles size={20} className="text-amber-400" />
          Ask Vita
        </h2>
        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/40">
          <form onSubmit={handleAiSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask a quick health question..."
                disabled={aiLoading}
                className="flex-1 bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuery.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
              </button>
            </div>
          </form>

          {/* Inline AI Response */}
          {aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-teal-500/20"
            >
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
            </motion.div>
          )}

          {aiLoading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              Vita is thinking...
            </div>
          )}

          <button
            onClick={() => navigate("/ai")}
            className="mt-2 text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            Open full AI chat
            <ChevronRight size={12} />
          </button>
        </div>
      </section>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.slice(0, 4).map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/40"
                >
                  <div className="p-2 rounded-lg bg-slate-700/50 text-slate-300">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-200">{activity.title}</div>
                    <div className="text-xs text-slate-500">{activity.time}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Actions Row */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.route)}
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${action.color} border border-white/5 hover:border-teal-500/40 transition-all min-w-[100px]`}
              >
                <Icon size={24} className="text-white" />
                <span className="text-xs font-medium text-white text-center">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
