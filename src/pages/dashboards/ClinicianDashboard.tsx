import { usePassport } from '../../hooks/usePassport';
import { useMesh } from '../../hooks/useMesh';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getReferrals } from '../../lib/idb';
import VitaAvatar from '../../components/VitaAvatar';
import {
  Users,
  ClipboardList,
  FileText,
  Scan,
  UserPlus,
  Calendar,
  Clock,
  ChevronRight,
  Activity,
  Sparkles,
  Search,
  Pill
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getReferrals } from '../../lib/idb';

export default function ClinicianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { recentScans, isLoading: scansLoading } = usePassport();
  const { meshStats } = useMesh();

  const userName = user?.firstName || "Doctor";

  // Care gaps for clinician (placeholder: show pending reviews)
  const pendingReviews = 3; // placeholder from current UI

  // Patient search
  const [searchQuery, setSearchQuery] = useState("");
  const filteredScans = recentScans.filter(scan =>
    scan.patientDid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pending referrals
  const [pendingReferrals, setPendingReferrals] = useState([]);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const referrals = await getReferrals('pending');
        setPendingReferrals(referrals);
      } catch (e) {
        console.error('Failed to load referrals', e);
      }
    };
    loadPending();
  }, []);

  const stats = [
    {
      label: "Patients Scanned",
      value: recentScans.length,
      icon: Users,
      color: "bg-emerald-500/15 text-emerald-300",
      detail: `Total: ${recentScans.length} patients`,
    },
    {
      label: "Pending Reviews",
      value: pendingReviews,
      icon: ClipboardList,
      color: "bg-amber-500/15 text-amber-300",
      detail: "Requires attention",
      warning: true,
    },
    {
      label: "Notes Added",
      value: 12,
      icon: FileText,
      color: "bg-blue-500/15 text-blue-300",
      detail: "This week",
    },
  ];

  // Quick AI drug interaction checker (compact)
  const handleQuickInteraction = async () => {
    navigate("/ai");
  };

   const quickActions = [
     { label: "Scan QR Code", icon: Scan, route: "/clinician-view", color: "from-emerald-500/20 to-emerald-600/20" },
     { label: "My Profile", icon: UserPlus, route: "/clinician/profile", color: "from-blue-500/20 to-blue-600/20" },
     { label: "Check Interactions", icon: Sparkles, route: "/ai", color: "from-amber-500/20 to-amber-600/20" },
   ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5 p-4 pb-24"
    >
      {/* Greeting */}
      <div className="flex items-center gap-4">
        <VitaAvatar state="online" size={56} />
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Welcome back, Dr. {userName}
          </h1>
          <p className="text-slate-400 text-sm">Patient management & scan history</p>
        </div>
      </div>

       {/* Quick Stats */}
       <section className="space-y-3">
         <div className="grid grid-cols-3 gap-3">
           {stats.map((stat) => {
             const Icon = stat.icon;
             return (
               <motion.button
                 key={stat.label}
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.98 }}
                 className="glass-card relative p-4 hover:border-emerald-500/40 transition-all text-left"
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

        {/* Recent Scans with Patient Search */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" />
              Recent Scans
            </h2>
          </div>
          {/* Patient Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          {scansLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="skeleton-card h-24 rounded-xl" />
              ))}
            </div>
          ) : filteredScans.length > 0 ? (
            <div className="space-y-2">
              {filteredScans.slice(0, 5).map((scan) => (
                <motion.div
                  key={scan.id}
                  whileHover={{ x: 2 }}
                  className="glass-card bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 hover:border-emerald-500/40"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <div className="font-medium text-white">
                        Patient {scan.patientDid.slice(0, 8)}...{scan.patientDid.slice(-4)}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Clock size={10} />
                        {new Date(scan.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs capitalize flex items-center gap-1">
                      <Scan size={10} />
                      {scan.specialistType || "General"}
                    </div>
                  </div>
                  {scan.summary && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{scan.summary}</p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card bg-slate-800/40 rounded-xl p-6 text-center border border-slate-700/40">
              <VitaAvatar state="empty" size={48} />
              <p className="text-slate-400 mt-3 text-sm">
                {searchQuery ? 'No matching scans found.' : 'No patient scans yet.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate("/clinician-view")}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm transition-colors"
                >
                  Scan a Passport
                </button>
              )}
            </div>
          )}
        </section>

        {/* Pending Referrals */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText size={20} className="text-amber-400" />
              Pending Referrals
            </h2>
            <button onClick={() => navigate("/referral-generator")} className="text-xs text-teal-400 hover:text-teal-300">
              + New
            </button>
          </div>
          {pendingReferrals.length > 0 ? (
            <div className="space-y-2">
              {pendingReferrals.map((ref) => (
                <motion.div
                  key={ref.id}
                  whileHover={{ x: 2 }}
                  className="glass-card bg-slate-800/40 rounded-xl p-4 border border-slate-700/40"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <div className="font-medium text-white">{ref.patientName}</div>
                      <div className="text-xs text-slate-400">{ref.specialistType}</div>
                    </div>
                    <div className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs">
                      Pending
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{ref.reason}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card bg-slate-800/40 rounded-xl p-6 text-center border border-slate-700/40">
              <VitaAvatar state="empty" size={48} />
              <p className="text-slate-400 mt-3 text-sm">No pending referrals.</p>
              <button
                onClick={() => navigate("/referral-generator")}
                className="mt-3 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm transition-colors"
              >
                Create Referral
              </button>
            </div>
          )}
        </section>

       {/* Upcoming: Care Gaps / Pending Reviews */}
       {pendingReviews > 0 && (
         <section className="space-y-3">
           <h2 className="text-lg font-semibold text-white flex items-center gap-2">
             <ClipboardList size={20} className="text-amber-400" />
             Pending Reviews
           </h2>
           <motion.button
             whileHover={{ x: 2 }}
             className="glass-card w-full flex items-center gap-3 p-3"
           >
             <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
               <Clock size={16} />
             </div>
             <div className="flex-1 text-left">
               <div className="text-sm font-medium text-slate-200">3 patient charts awaiting review</div>
               <div className="text-xs text-slate-500">Updated today</div>
             </div>
             <ChevronRight size={16} className="text-slate-500" />
           </motion.button>
         </section>
       )}

      {/* Quick Actions */}
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
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${action.color} border border-white/5 hover:border-emerald-500/40 transition-all min-w-[100px]`}
              >
                <Icon size={24} className="text-white" />
                <span className="text-xs font-medium text-white text-center">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

       {/* AI Quick Tip */}
       <section className="glass-card bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl p-4 border border-purple-500/20">
         <div className="flex items-start gap-3">
           <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
             <Sparkles size={20} />
           </div>
           <div className="flex-1">
             <div className="text-sm font-medium text-white">AI Assistant</div>
             <p className="text-xs text-slate-300 mt-1">
               Need help with a drug interaction or pre-visit summary? Ask Vita.
             </p>
             <button
               onClick={() => navigate("/ai")}
               className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
             >
               Open AI Chat
               <ChevronRight size={12} />
             </button>
           </div>
         </div>
       </section>
    </motion.div>
  );
}
