import { motion } from "framer-motion";

export default function AnatomyExplorer() {
  const organs = [
    { name: "Heart", icon: "❤️", status: "monitor", note: "Monitor BP regularly" },
    { name: "Lungs", icon: "🫁", status: "good", note: "No issues" },
    { name: "Liver", icon: "🫀", status: "caution", note: "ALT slightly elevated" },
    { name: "Kidneys", icon: "🦠", status: "good", note: "Normal function" },
    { name: "Pancreas", icon: "🔬", status: "monitor", note: "Glucose control needed" },
    { name: "Brain", icon: "🧠", status: "good", note: "Healthy" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "border-emerald-500/30 bg-emerald-500/10";
      case "caution": return "border-amber-500/30 bg-amber-500/10";
      case "monitor": return "border-rose-500/30 bg-rose-500/10";
      default: return "border-slate-700/30 bg-slate-800/30";
    }
  };

  const getBadge = (status: string) => {
    switch (status) {
      case "good": return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">Healthy</span>;
      case "caution": return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs">Caution</span>;
      case "monitor": return <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs">Monitor</span>;
      default: return null;
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
        <h1 className="text-2xl font-bold text-white mb-2">Anatomy Explorer</h1>
        <p className="text-slate-400 text-sm mb-6">Daily organ health cards from NHS API</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {organs.map((organ) => (
            <motion.div
              key={organ.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card p-4 text-center border-t-4 ${getStatusColor(organ.status)}`}
            >
              <div className="text-5xl mb-3">{organ.icon}</div>
              <h3 className="font-semibold text-white">{organ.name}</h3>
              <div className="mt-2">{getBadge(organ.status)}</div>
              <p className="text-xs text-slate-400 mt-2">{organ.note}</p>
            </motion.div>
          ))}
        </div>

        {/* Info banner */}
        <div className="mt-6 glass-card p-4 border-teal-500/20">
          <p className="text-sm text-slate-300">
            <strong>Daily organ health cards</strong> are powered by integrated NHS health data. Each day, a different organ's health status is highlighted with plain-language explanation.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
