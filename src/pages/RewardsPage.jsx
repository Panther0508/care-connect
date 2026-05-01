// src/pages/RewardsPage.jsx
import { useState, useEffect } from 'react';
import { 
  getTotalPoints, 
  getBadges, 
  getStreak,
  getLeaderboard,
  redeemPoints
} from '../services/rewardsEngine';
import RewardsPanel from '../components/RewardsPanel';
import { BadgeGrid } from '../components/BadgeGrid';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function RewardsPage() {
  const [points, setPoints] = useState(0);
  const [streaks, setStreaks] = useState({
    login: { current: 0, longest: 0 },
    medication: { current: 0, longest: 0 },
    workout: { current: 0, longest: 0 },
    meal: { current: 0, longest: 0 },
    sleep: { current: 0, longest: 0 }
  });
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  
  // Assuming we have a way to get the current user ID
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
        
        // Get badges
        const allBadges = await getBadges(userId);
        setBadges(allBadges);
        
        // Get leaderboard
        const topUsers = await getLeaderboard(10);
        setLeaderboard(topUsers);
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

  const handleRedeem = async (rewardId) => {
    const result = await redeemPoints(userId, rewardId);
    if (result.success) {
      setPoints(result.newBalance);
      setRedeemModalOpen(false);
      // In a real app, show a success message
      alert('Reward redeemed successfully!');
    } else {
      alert('Not enough points for this reward');
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-900 p-4"
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-pulse rounded-full w-16 h-16 bg-teal-500/20 mb-4"></div>
          <p className="text-slate-400">Loading your rewards...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-900"
    >
      {/* Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          Your VitaChain Rewards
        </h1>
        <p className="text-slate-400">
          Earn points for healthy actions and unlock exciting rewards
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Points and Streaks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Points Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-100">VitaPoints</h3>
                <p className="text-4xl font-bold text-teal-400" aria-label={`VitaPoints, {points}`}>
                  {points}
                </p>
              </div>
              {/* Animated points pulse would go here */}
            </div>
            <p className="text-slate-400 text-sm">
              Points earned for healthy actions
            </p>
          </motion.div>

          {/* Streaks Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <h3 className="font-semibold text-slate-100 mb-3">Your Streaks</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Login:</span>
                <span className="font-medium text-teal-400">
                  {streaks.login.current} day{streaks.login.current !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Medication:</span>
                <span className="font-medium text-teal-400">
                  {streaks.medication.current} day{streaks.medication.current !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Workout:</span>
                <span className="font-medium text-teal-400">
                  {streaks.workout.current} day{streaks.workout.current !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Meal:</span>
                <span className="font-medium text-teal-400">
                  {streaks.meal.current} day{streaks.meal.current !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sleep:</span>
                <span className="font-medium text-teal-400">
                  {streaks.sleep.current} day{streaks.sleep.current !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Recent Badges Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <h3 className="font-semibold text-slate-100 mb-3">Recent Achievements</h3>
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badges.slice(-3).reverse().map(badge => (
                  <div key={badge.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                      {badge.icon}
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">{badge.name}</p>
                      <p className="text-xs text-slate-400">
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
          </motion.div>
        </div>

        {/* Badge Grid Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
         >
           <BadgeGrid userId={userId} showAll={true} />
         </motion.div>

        {/* Leaderboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-slate-100">Local Leaderboard</h3>
            <Link to="/rewards/leaderboard" className="text-sm text-teal-400 hover:underline">
              View All
            </Link>
          </div>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((user, index) => (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 50 }}
                  className="flex justify-between items-center p-3 rounded-lg bg-slate-900/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500/20 text-teal-400 text-sm">
                      #{user.rank}
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">User {user.userId.slice(0, 6)}...</p>
                      <p className="text-xs text-slate-400">
                        {user.points} VitaPoints
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-teal-400">
                    +{user.points} pts
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">
              No users on leaderboard yet. Be the first!
            </p>
          )}
        </motion.div>

        {/* Redeem Points Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-semibold text-slate-100 mb-4">Redeem Points</h3>
          <p className="text-slate-400 mb-4">
            Use your VitaPoints to unlock rewards and benefits
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Reward Cards */}
            <motion.div
              key="health_tip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 100 }}
              className="glass-card p-4 cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => handleRedeem('health_tip')}
            >
              <div className="flex items-center justify-start mb-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  💡
                </div>
                <h4 className="font-medium text-slate-100 ml-3">Health Tip</h4>
              </div>
              <p className="text-slate-400 line-clamp-2">
                Get personalized health advice from our experts
              </p>
              <div className="mt-4 flex justify-between items-start">
                <span className="font-medium text-teal-400">50 pts</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRedeem('health_tip');
                  }}
                  className="px-2 py-1 text-xs bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30"
                >
                  Redeem
                </button>
              </div>
            </motion.div>

            <motion.div
              key="workout_plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 200 }}
              className="glass-card p-4 cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => handleRedeem('workout_plan')}
            >
              <div className="flex items-center justify-start mb-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  💪
                </div>
                <h4 className="font-medium text-slate-100 ml-3">Workout Plan</h4>
              </div>
              <p className="text-slate-400 line-clamp-2">
                Custom workout routine based on your goals
              </p>
              <div className="mt-4 flex justify-between items-start">
                <span className="font-medium text-teal-400">100 pts</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRedeem('workout_plan');
                  }}
                  className="px-2 py-1 text-xs bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30"
                >
                  Redeem
                </button>
              </div>
            </motion.div>

            <motion.div
              key="nutrition_guide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 300 }}
              className="glass-card p-4 cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => handleRedeem('nutrition_guide')}
            >
              <div className="flex items-center justify-start mb-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  🥗
                </div>
                <h4 className="font-medium text-slate-100 ml-3">Nutrition Guide</h4>
              </div>
              <p className="text-slate-400 line-clamp-2">
                Personalized meal planning and recipes
              </p>
              <div className="mt-4 flex justify-between items-start">
                <span className="font-medium text-teal-400">150 pts</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRedeem('nutrition_guide');
                  }}
                  className="px-2 py-1 text-xs bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30"
                >
                  Redeem
                </button>
              </div>
            </motion.div>

            <motion.div
              key="premium_feature"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 400 }}
              className="glass-card p-4 cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => handleRedeem('premium_feature')}
            >
              <div className="flex items-center justify-start mb-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  ⭐
                </div>
                <h4 className="font-medium text-slate-100 ml-3">Premium Feature</h4>
              </div>
              <p className="text-slate-400 line-clamp-2">
                Unlock exclusive app features for 30 days
              </p>
              <div className="mt-4 flex justify-between items-start">
                <span className="font-medium text-teal-400">500 pts</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRedeem('premium_feature');
                  }}
                  className="px-2 py-1 text-xs bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30"
                >
                  Redeem
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Redeem Modal */}
      {redeemModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card p-6 max-w-md w-full relative"
          >
            <button 
              onClick={() => setRedeemModalOpen(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-200"
            >
              ×
            </button>
            <h3 className="font-semibold text-slate-100 mb-4">Confirm Redemption</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to redeem this reward?
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setRedeemModalOpen(false)}
                className="px-4 py-2 bg-slate-600/20 text-slate-100 rounded hover:bg-slate-600/30"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // In a real app, we'd actually redeem here
                  setRedeemModalOpen(false);
                }}
                className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}