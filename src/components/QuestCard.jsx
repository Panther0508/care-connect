// src/components/QuestCard.jsx
import { useState } from 'react';
import { updateQuestProgress, abandonQuest } from '../services/questEngine';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function QuestCard({ quest, onProgressUpdate, onAbandon }) {
  const [progress, setProgress] = useState(quest.progress || 0);
  const [loading, setLoading] = useState(false);

  const handleProgress = async () => {
    setLoading(true);
    try {
      const result = await updateQuestProgress('current-user', quest.id, 10);
      if (result.success) {
        setProgress(result.progress);
        if (onProgressUpdate) onProgressUpdate(result);
        if (result.completed) {
          alert(`Quest completed! You earned ${result.reward} VitaPoints`);
        }
      }
    } catch (err) {
      console.error('Failed to update quest progress:', err);
      alert('Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm('Are you sure you want to abandon this quest?')) return;
    setLoading(true);
    try {
      const result = await abandonQuest('current-user', quest.id);
      if (result.success) {
        if (onAbandon) onAbandon(quest.id);
        alert('Quest abandoned');
      } else {
        alert(result.error || 'Failed to abandon quest');
      }
    } catch (err) {
      console.error('Failed to abandon quest:', err);
      alert('Failed to abandon quest');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = () => {
    switch (quest.difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getDotColor = () => {
    switch (quest.difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 hover:scale-105 transition-transform duration-300 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 flex-shrink-0 ${getDifficultyColor()} flex items-center justify-center rounded-lg`}>
          <div className={`w-4 h-4 rounded-full ${getDotColor()}`} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-slate-100">{quest.title}</h3>
            <span className="text-xs text-slate-400">
              {quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : `${quest.duration || 7}d`}
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-3">{quest.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-teal-400 font-medium">{quest.rewardPoints} pts</span>
              {quest.badgeUnlock && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  🏆 {quest.badgeUnlock.replace('_', ' ')}
                </span>
              )}
            </div>
            {quest.completed ? (
              <span className="text-xs text-green-400 font-medium">Completed</span>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleProgress}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  Progress
                </button>
                <button
                  onClick={handleAbandon}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                >
                  Abandon
                </button>
              </div>
            )}
          </div>
          {quest.progress !== undefined && (
            <div className="mt-3 w-full bg-slate-700/30 rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
