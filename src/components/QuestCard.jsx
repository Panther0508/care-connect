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
      // In a real app, we would determine what action constitutes progress
      // For demonstration, we'll increment by 10% when the card is clicked
      const result = await updateQuestProgress(
        'current-user', // Placeholder userId
        quest.id,
        10 // Increment by 10%
      );
      
      if (result.success) {
        setProgress(result.progress);
        if (onProgressUpdate) {
          onProgressUpdate(result);
        }
        
        // Show celebration if completed
        if (result.completed) {
          // In a real app, we would trigger a celebration
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
    if (!window.confirm('Are you sure you want to abandon this quest?')) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await abandonQuest(
        'current-user', // Placeholder userId
        quest.id
      );
      
      if (result.success) {
        if (onAbandon) {
          onAbandon(quest.id);
        }
        // In a real app, we would refresh the quests list
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 hover:scale-105 transition-transform duration-300 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Quest Icon - based on difficulty */}
        <div className="w-10 h-10 flex-shrink-0 
          ${quest.difficulty === 'easy' 
            ? 'bg-green-500/20 text-green-400' 
            : quest.difficulty === 'medium' 
              ? 'bg-yellow-500/20 text-yellow-400' 
              : 'bg-red-500/20 text-red-400'}"
          className="flex items-center justify-center rounded-lg">
          {/* Difficulty indicator */}
          <div className="w-4 h-4 rounded-full 
            ${quest.difficulty === 'easy' 
              ? 'bg-green-500' 
              : quest.difficulty === 'medium' 
                ? 'bg-yellow-500' 
                : 'bg-red-500'}">
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-slate-100">{quest.title}</h3>
            <span className="text-xs 
              ${quest.difficulty === 'easy' 
                ? 'text-green-500' 
                : quest.difficulty === 'medium' 
                  ? 'text-yellow-500' 
                  : 'text-red-500'} 
              font-medium">
              {quest.difficulty}
            </span>
          </div>
          
          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
            {quest.description}
          </p>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span>{quest.rewardPoints} pts</span>
            </div>
            {quest.badgeUnlock && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Badge</span>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-700/20 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>{progress}%</span>
            <span>{quest.daysRemaining} days left</span>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row sm:space-x-2">
            <button 
              onClick={handleProgress}
              disabled={loading || progress >= 100}
              className="w-full sm:w-auto px-4 py-2 
                ${loading 
                  ? 'bg-slate-600/20 text-slate-400' 
                  : 'bg-teal-500 text-white'} 
                rounded hover:bg-teal-600 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              {loading ? 'Updating...' : progress >= 100 ? 'Completed' : 'Progress'}
            </button>
            {progress < 100 && (
              <button 
                onClick={handleAbandon}
                className="w-full sm:w-auto px-4 py-2 
                  bg-slate-600/20 text-slate-400 rounded hover:bg-slate-600/30
                  transition-all duration-200"
              >
                Abandon
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}