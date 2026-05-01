// src/components/BadgeGrid.jsx
import { useState, useEffect } from 'react';
import { getBadges, BADGES } from '../services/rewardsEngine';
import { motion } from 'framer-motion';

export function BadgeGrid({ userId, showAll = true }) {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      setLoading(true);
      try {
        const badges = await getBadges(userId);
        setEarnedBadges(badges);
      } catch (error) {
        console.error('Failed to load badges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
    
    // Refresh periodically
    const interval = setInterval(loadBadges, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="glass-card p-4"
      >
        <div className="grid grid-cols-2 gap-4 h-32">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse rounded-lg bg-teal-500/10"></div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Filter badges based on showAll prop
  const badgesToShow = showAll ? BADGES : earnedBadges;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="glass-card p-4"
    >
      <h3 className="font-semibold text-slate-100 mb-4">
        {showAll ? 'All Achievements' : 'Your Achievements'}
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badgesToShow.map(badge => {
          const isEarned = earnedBadges.some(eb => eb.id === badge.id);
          const earnedBadge = earnedBadges.find(eb => eb.id === badge.id);
          
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: isEarned ? 1 : 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: badge.id.length * 10 }}
              className={`group flex flex-col items-center p-3 rounded-lg border 
                ${isEarned 
                  ? 'border-teal-500/20 bg-teal-500/5' 
                  : 'border-slate-600/20 bg-slate-900/20'}
                hover:scale-105 transition-transform duration-300`}
            >
              {/* Badge Icon */}
              <div className="w-12 h-12 flex items-center justify-center rounded-full mb-2
                ${isEarned 
                  ? 'bg-teal-500/20 text-teal-400' 
                  : 'bg-slate-600/20 text-slate-400'}"
              >
                {badge.icon}
              </div>
              
              {/* Badge Name */}
              <p className="font-medium text-center text-slate-100 
                ${isEarned ? '' : 'line-through'}">
                {badge.name}
              </p>
              
              {/* Badge Description */}
              <p className="text-xs text-center text-slate-400 mt-1 line-clamp-2">
                {badge.description}
              </p>
              
              {/* Earned indicator */}
              {isEarned && (
                <div className="mt-2 flex items-center gap-1 text-xs text-teal-400">
                  <span>Earned</span>
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                </div>
              )}
              
              {/* Lock indicator for unearned badges */}
              {!isEarned && showAll && (
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <span>Locked</span>
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                </div>
              )}
              
              {/* Progress indicator for unearned badges (simplified) */}
              {!isEarned && showAll && badge.id === 'health_scribe' && (
                <div className="mt-2 w-full h-1 bg-slate-600/20 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500/20 rounded-full" style={{ width: '60%' }}></div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Show total earned count when showing all badges */}
      {showAll && (
        <div className="mt-4 text-center text-slate-400">
          <p>
            {earnedBadges.length} of {BADGES.length} badges earned
          </p>
        </div>
      )}
    </motion.div>
  );
}