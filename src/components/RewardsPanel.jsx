// src/components/RewardsPanel.jsx
import { useState, useEffect } from 'react';
import { getTotalPoints, getStreak, getBadges } from '../services/rewardsEngine';
import { motion } from 'framer-motion';

export default function RewardsPanel() {
  const [points, setPoints] = useState(0);
  const [streaks, setStreaks] = useState({
    login: { current: 0, longest: 0 },
    medication: { current: 0, longest: 0 },
    workout: { current: 0, longest: 0 },
    meal: { current: 0, longest: 0 },
    sleep: { current: 0, longest: 0 }
  });
  const [recentBadges, setRecentBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assuming we have a way to get the current user ID
  // In a real app, this would come from auth context
  const userId = 'current-user'; // Placeholder

  useEffect(() => {
    const loadRewardsData = async () => {
      setLoading(true);
      try {
        // Get total points
        const totalPoints = await getTotalPoints(userId);
        setPoints(totalPoints);
        
        // Get streaks
        const loginStreak = await getStreak(userId, 'login');
        const medicationStreak = await getStreak(userId, 'medication');
        const workoutStreak = await getStreak(userId, 'workout');
        const mealStreak = await getStreak(userId, 'meal');
        const sleepStreak = await getStreak(userId, 'sleep');
        
        setStreaks({
          login: loginStreak,
          medication: medicationStreak,
          workout: workoutStreak,
          meal: mealStreak,
          sleep: sleepStreak
        });
        
        // Get recent badges (last 3 earned)
        const allBadges = await getBadges(userId);
        const recent = allBadges.slice(-3).reverse(); // Most recent first
        setRecentBadges(recent);
      } catch (error) {
        console.error('Failed to load rewards data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRewardsData();
    
    // Set up a listener for changes (in a real app, this would use IndexedDB change listeners)
    // For now, we'll just refresh every 30 seconds
    const interval = setInterval(loadRewardsData, 30000);
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
        <div className="flex items-center justify-center h-16">
          <div className="animate-pulse rounded-full w-8 h-8 bg-tear-500/20"></div>
          <div className="animate-pulse rounded-full w-8 h-8 bg-teal-500/20 ml-2"></div>
          <div className="animate-pulse rounded-full w-8 h-8 bg-teal-500/20 ml-2"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="glass-card p-4"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-slate-100">VitaPoints</h3>
          <p className="text-3xl font-bold text-teal-400" aria-label={`VitaPoints, {points}`}>
            {points}
          </p>
        </div>
        {/* Animated points counter would go here in a more advanced version */}
      </div>
      
      <div className="space-y-3">
        {/* Streaks Section */}
        <div className="border-t pb-3 pt-2">
          <h4 className="font-medium text-slate-300 mb-2">Your Streaks</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col items-center">
              <p className="font-medium">Login</p>
              <p className="text-teal-400 font-bold">{streaks.login.current} day{streaks.login.current !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-400">Best: {streaks.login.longest}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-medium">Medication</p>
              <p className="text-teal-400 font-bold">{streaks.medication.current} day{streaks.medication.current !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-400">Best: {streaks.medication.longest}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-medium">Workouts</p>
              <p className="text-teal-400 font-bold">{streaks.workout.current} day{streaks.workout.current !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-400">Best: {streaks.workout.longest}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-medium">Meals</p>
              <p className="text-teal-400 font-bold">{streaks.meal.current} day{streaks.meal.current !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-400">Best: {streaks.meal.longest}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-medium">Sleep</p>
              <p className="text-teal-400 font-bold">{streaks.sleep.current} day{streaks.sleep.current !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-400">Best: {streaks.sleep.longest}</p>
            </div>
          </div>
        </div>
        
        {/* Recent Badges Section */}
        <div className="border-t pb-3 pt-2">
          <h4 className="font-medium text-slate-300 mb-2">Recent Achievements</h4>
          {recentBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentBadges.map(badge => (
                <div key={badge.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{badge.name}</p>
                    <p className="text-xs text-slate-400">
                      {/* Format date */}
                      {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center">
              No recent achievements. Keep going to earn your first badge!
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}