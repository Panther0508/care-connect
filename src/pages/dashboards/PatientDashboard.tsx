import { useHealthGraph } from '../../hooks/useHealthGraph';
import { usePassport } from '../../hooks/usePassport';
import { useAuth } from '@clerk/clerk-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import VitaAvatar from '../../components/VitaAvatar';
import CustomizableVitaAvatar from '../../components/CustomizableVitaAvatar';
import { LiquidGlassCard } from '../../components/LiquidGlassCard';
import RewardsPanel from '../../components/RewardsPanel';
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
import { getOutbreakAlerts, invalidateCache } from '../../services/realtimeData';

// Live Health Alerts Component
const LiveHealthAlerts = () => {
  const [alertsData, setAlertsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getOutbreakAlerts();
        if (result.data) {
          setAlertsData(result.data);
        } else {
          setError(result.error || 'Data temporarily unavailable');
        }
      } catch (err) {
        setError('Data temporarily unavailable');
        console.error('Failed to fetch outbreak alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await invalidateCache('outbreaks');
      const result = await getOutbreakAlerts();
      if (result.data) {
        setAlertsData(result.data);
      } else {
        setError(result.error || 'Data temporarily unavailable');
      }
    } catch (err) {
      setError('Data temporarily unavailable');
      console.error('Failed to refresh outbreak alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !alertsData) {
    return (
      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <AlertCircle size={20} className="text-amber-400" />
          Live Health Alerts
        </h2>
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertCircle size={24} className="text-amber-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-slate-100">COVID-19</h3>
              <p className="text-slate-400 text-sm">Loading...</p>
            </div>
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Activity size={24} className="text-cyan-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-slate-100">Influenza</h3>
                <p className="text-slate-400 text-sm">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !alertsData) {
    return (
      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <AlertCircle size={20} className="text-amber-400" />
          Live Health Alerts
        </h2>
        <p className="text-slate-400 pt-4">{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-3 btn-primary px-4 py-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  const covid = alertsData?.covid;
  const influenza = alertsData?.influenza;
  const alerts = alertsData?.alerts || [];
  const updatedTimestamp = covid?.updated || influenza?.lastUpdated || Date.now();
  const timeAgo = Math.floor((Date.now() - updatedTimestamp) / (1000 * 60 * 60)); // hours ago

  return (
    <div className="glass-card p-4">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <AlertCircle size={20} className="text-amber-400" />
          Live Health Alerts
        </h2>
        <button 
          onClick={handleRefresh}
          className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
        >
          Refresh
          <AlertCircle size={16} className="text-teal-400" />
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Alert Messages */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert: any, index: number) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${alert.level === 'warning' ? 'border-amber-400 bg-amber-50/50' : 'border-teal-400 bg-teal-50/50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center ${alert.level === 'warning' ? 'bg-amber-500' : 'bg-teal-500'}/20 rounded-full shrink-0`}>
                    {alert.level === 'warning' ? <AlertCircle size={12} className="text-amber-400" /> : <Activity size={12} className="text-teal-400" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-slate-100">{alert.message}</p>
                    <p className="text-xs text-slate-500">{alert.type === 'covid' ? 'COVID-19 Alert' : 'Influenza Alert'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* COVID-19 Card */}
          <div className="glass-card p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <Heart size={20} className="text-rose-400" />
              </div>
              <h3 className="flex-1 text-base font-medium text-slate-100 ml-3">COVID-19</h3>
            </div>
            {covid ? (
              <>
                <div className="text-2xl font-bold text-slate-100">
                  {covid.cases.toLocaleString()}
                </div>
                <p className="text-slate-400">Total Cases</p>
                <div className="mt-2">
                  <div className="text-slate-400">{covid.deaths.toLocaleString()}</div>
                  <p className="text-xs text-slate-500">Deaths</p>
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-center">Data unavailable</p>
            )}
          </div>
          
          {/* Influenza Card */}
          <div className="glass-card p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Activity size={20} className="text-cyan-400" />
              </div>
              <h3 className="flex-1 text-base font-medium text-slate-100 ml-3">Influenza</h3>
            </div>
            {influenza ? (
              <>
                <div className="text-2xl font-bold text-slate-100">
                  {influenza.cases.toLocaleString()}
                </div>
                <p className="text-slate-400">Active Cases</p>
                <div className="mt-2">
                  <div className="text-slate-400">{influenza.type || 'Influenza'}</div>
                  <p className="text-xs text-slate-500">Strain</p>
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-center">Data unavailable</p>
            )}
          </div>
        </div>
        
        {/* Last Updated */}
        <div className="mt-3 pt-3 border-t border-slate-700/20 text-xs text-slate-500">
          Last updated: {timeAgo > 0 ? `${timeAgo} hour${timeAgo > 1 ? 's' : ''} ago` : 'Just now'}
        </div>
      </div>
    </div>
  );
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conditions, medications, allergies, encounters } = useHealthGraph();
  const { recentShares } = usePassport();

  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Health Ring state
  const [ringProgress, setRingProgress] = useState({ calories: 0, water: 0, steps: 0 });

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
      color: "bg-rose-500/20 text-rose-300",
      detail: conditions.length > 0 ? conditions[conditions.length - 1]?.name : "None recorded",
    },
    {
      label: "Medications",
      value: medications.length,
      icon: Pill,
      color: "bg-cyan-500/20 text-cyan-300",
      detail: medications.length > 0 ? `${medications.length} active` : "None active",
      warning: medications.length > 5,
    },
    {
      label: "Allergies",
      value: allergies.length,
      icon: Shield,
      color: "bg-amber-500/20 text-amber-300",
      detail: allergies.some((a) => a.severity === "severe")
        ? "Critical allergy recorded"
        : allergies.length > 0
        ? "Known allergies"
        : "None recorded",
    },
  ];

  // Construct care gaps
  const generateCareGaps = () => {
    const gaps: { icon: React.ElementType; text: string; color: string }[] = [];
    const recentCondition = conditions[conditions.length - 1];
    if (recentCondition) {
      gaps.push({
        icon: AlertCircle,
        text: `Follow-up needed for ${recentCondition.name}`,
        color: "text-amber-400",
      });
    }
    if (medications.length > 0) {
      gaps.push({
        icon: Pill,
        text: "Review medication interactions with your pharmacist",
        color: "text-cyan-400",
      });
    }
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

  // Recent activity
  const recentActivity = [
    ...recentShares.slice(0, 2).map((share) => ({
      type: "share",
      title: `Shared ${share.specialistType} passport`,
      time: new Date(share.timestamp).toLocaleDateString(),
      icon: Share2,
    })),
    ...conditions.slice(-2).map((c) => ({
      type: "condition",
      title: `Added condition: ${c.name}`,
      time: c.diagnosedDate || "Recently",
      icon: Heart,
    })),
    ...medications.slice(-2).map((m) => ({
      type: "medication",
      title: `Started medication: ${m.name}`,
      time: m.startDate || "Recently",
      icon: Pill,
    })),
  ]
    .sort((a, b) => 0)
    .slice(0, 4);

  // Handle AI submit
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

  // Wellness Ring component
  const WellnessRing = () => {
    const targetCalories = 2000;
    const targetWater = 2000;
    const targetSteps = 10000;
    const progressCalories = Math.min((1450 / targetCalories) * 100, 100);
    const progressWater = Math.min((1320 / targetWater) * 100, 100);
    const progressSteps = Math.min((7850 / targetSteps) * 100, 100);

    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    const arcs = [
      { label: "Cal", value: 1450, target: targetCalories, color: "#14B8A6", progress: progressCalories, offset: 0 },
      { label: "Water", value: 1320, target: targetWater, color: "#06B6D4", progress: progressWater, offset: 120 },
      { label: "Steps", value: 7850, target: targetSteps, color: "#F59E0B", progress: progressSteps, offset: 240 },
    ];

    return (
      <div className="relative flex items-center justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          {/* Background rings */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="8" />
          <circle cx="100" cy="100" r={radius - 12} fill="none" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="6" />
          <circle cx="100" cy="100" r={radius - 24} fill="none" stroke="rgba(148, 163, 184, 0.06)" strokeWidth="4" />
          
          {/* Progress arcs */}
          {arcs.map((arc, i) => (
            <circle
              key={arc.label}
              cx="100"
              cy="100"
              r={radius - i * 12}
              fill="none"
              stroke={arc.color}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * arc.progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ transform: `rotate(${arc.offset}deg)`, transformOrigin: "center" }}
            />
          ))}
        </svg>
        
        {/* Center content */}
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold text-slate-100">Today</span>
          <span className="text-lg text-slate-400 font-semibold">Wellness</span>
        </div>
      </div>
    );
  };

  const quickActions = [
    { label: "Share Passport", icon: Share2, route: "/passport", color: "from-rose-500/20 to-rose-600/20" },
    { label: "Check Medication", icon: Pill, route: "/ai", color: "from-cyan-500/20 to-cyan-600/20" },
    { label: "View Health Graph", icon: Activity, route: "/health", color: "from-teal-500/20 to-teal-600/20" },
    { label: "Outbreak Map", icon: Shield, route: "/outbreak", color: "from-amber-500/20 to-amber-600/20" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
        {/* Greeting Section - Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4"
        >
          <div className="relative">
            <CustomizableVitaAvatar size={64} />
            {/* Pulsing readiness ring */}
            <motion.div
              className="absolute -inset-2 rounded-full border-2 border-teal-400 opacity-50"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight tracking-tight">
              {timeGreeting},
              <span className="gradient-text-teal-amber ml-2">{userName}</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base">Your health command center</p>
          </div>
          {/* Customise button */}
          <button 
            onClick={() => navigate("/avatar")}
            className="ml-4 flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30 transition-colors"
          >
            ✨ Customise
          </button>
        </motion.div>

        {/* Rewards Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          <RewardsPanel />
        </motion.div>

        {/* Live Health Alerts - New Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          <LiveHealthAlerts />
        </motion.div>

       {/* Live Health Alerts - New Component */}
       {/* LiveHealthAlerts component will be rendered where the placeholder is */}

       {/* Wellness Ring - Featured Section */}
       <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 0.5, delay: 0.1 }}
         className="glass-card p-6 md:p-8"
       >
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <WellnessRing />
          <div className="flex-1 grid grid-cols-3 gap-4 text-center md:text-left">
            {[
              { label: "Calories", value: "1,450", target: "2,000", color: "#14B8A6", unit: "kcal" },
              { label: "Water", value: "1.32", target: "2.0", color: "#06B6D4", unit: "L" },
              { label: "Steps", value: "7,850", target: "10k", color: "#F59E0B", unit: "" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass-card p-4 rounded-xl"
              >
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">{stat.label}</div>
                <div className="text-xl font-bold text-slate-100" style={{ color: stat.color }}>
                  {stat.value}
                  <span className="text-sm font-normal text-slate-500">{stat.unit}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">of {stat.target} goal</div>
                <div className="mt-2 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: stat.color, width: `${i === 0 ? 72.5 : i === 1 ? 66 : 78.5}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${i === 0 ? 72.5 : i === 1 ? 66 : 78.5}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400 font-medium">All vitals tracking normally</span>
          </div>
          <button className="text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors">
            View detailed analytics
          </button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Activity size={20} className="text-teal-400" />
          Health Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.button
                key={stat.label}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/health")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="relative glass-card p-4 text-left group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${stat.color} bg-opacity-20`}>
                  <Icon size={20} />
                </div>
                <div className="text-3xl font-bold text-slate-100">
                  <span className="tabular-nums">{stat.value}</span>
                </div>
                <div className="text-sm text-slate-400 font-medium mt-1">{stat.label}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-1">{stat.detail}</div>
                {stat.warning && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
                <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-teal-400/30 transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Care Gaps / Upcoming Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
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
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-4 glass-card text-left"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${gap.color.replace('text', 'bg').replace('400', '100')}`}>
                    <Icon size={16} className={gap.color} />
                  </div>
                  <span className="flex-1 text-sm text-slate-200">{gap.text}</span>
                  <ChevronRight size={16} className="text-slate-600" />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 glass-card border-l-4 border-l-teal-400"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-500/20">
              <CheckCircle className="text-teal-400" size={20} />
            </div>
            <div>
              <div className="text-teal-200 font-medium">All caught up!</div>
              <div className="text-xs text-teal-300/80">No pending actions at this time</div>
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold text-slate-100">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                onClick={() => navigate(action.route)}
                className="glass-card p-4 text-center group"
              >
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-cyan-500/20 group-hover:from-teal-500/30 group-hover:to-cyan-500/30 transition-all">
                  <Icon size={24} className="text-teal-400" />
                </div>
                <span className="text-sm font-medium text-slate-200 group-hover:text-teal-300 transition-colors">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Quick AI Assistant */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Sparkles size={20} className="text-amber-400" />
          Ask Vita
        </h2>
        <div className="glass-card p-5">
          <form onSubmit={handleAiSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask a quick health question..."
                disabled={aiLoading}
                className="glass-input flex-1 text-sm"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuery.trim()}
                className="btn-primary px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
              </button>
            </div>
          </form>

          {aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 glass-card border-l-4 border-l-cyan-500"
            >
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
            </motion.div>
          )}

          {aiLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              Vita is thinking...
            </div>
          )}

          <button
            onClick={() => navigate("/ai")}
            className="mt-3 text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors flex items-center gap-1"
          >
            Open full AI chat
            <ChevronRight size={14} />
          </button>
        </div>
      </motion.section>

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-slate-100">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.slice(0, 4).map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.03 }}
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-3 p-4 glass-card text-left"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-700/50 text-slate-300">
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
        </motion.section>
      )}
    </motion.div>
  );
}
