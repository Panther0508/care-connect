// src/components/MilestonePopup.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Activity, Target, Share2, Apple, Home } from 'lucide-react';

const MilestonePopup = ({ milestones, onClose }) => {
  // Map milestone icon string to Lucide icon
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Trophy': return Trophy;
      case 'Activity': return Activity;
      case 'Target': return Target;
      case 'Share2': return Share2;
      case 'Apple': return Apple;
      case 'Home': return Home;
      default: return Trophy;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-[90%] max-w-md p-6 bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-2xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-300"
        >
          <Activity size={20} />
        </button>

        <h2 className="mb-4 text-center text-2xl font-bold text-slate-100">
          New Milestone Achieved!
        </h2>

        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-teal-500/20 rounded-xl">
                <getIcon(milestone.icon) size={24} className="text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-100">{milestone.title}</h3>
                <p className="text-slate-400 text-sm">{milestone.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30 transition-colors"
          >
            Awesome!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MilestonePopup;