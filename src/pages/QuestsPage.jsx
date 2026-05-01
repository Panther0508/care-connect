// src/pages/QuestsPage.jsx
import { useState, useEffect } from 'react';
import { getActiveQuests, getAvailableQuests, getQuestHistory } from '../services/questEngine';
import { QuestCard } from '../components/QuestCard';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function QuestsPage() {
  const [activeQuests, setActiveQuests] = useState([]);
  const [availableQuests, setAvailableQuests] = useState([]);
  const [questHistory, setQuestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'available', 'history'

  useEffect(() => {
    const loadQuestsData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assuming we have a way to get the current user ID
        const userId = 'current-user'; // Placeholder
        
        // Load all three types of quests
        const [active, available, history] = await Promise.all([
          getActiveQuests(userId),
          getAvailableQuests(userId),
          getQuestHistory(userId)
        ]);
        
        setActiveQuests(active);
        setAvailableQuests(available);
        setQuestHistory(history);
      } catch (err) {
        console.error('Failed to load quests data:', err);
        setError('Failed to load quests data');
      } finally {
        setLoading(false);
      }
    };

    loadQuestsData();
    
    // Set up a listener for changes (in a real app, this would use IndexedDB change listeners)
    // For now, we'll just refresh every 30 seconds
    const interval = setInterval(loadQuestsData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-900 p-4"
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-pulse rounded-full w-16 h-16 bg-teal-500/20 mb-4"></div>
          <p className="text-slate-400">Loading your quests...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-900 p-4"
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          <p className="text-slate-400 text-center mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            Retry
          </button>
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
          Health Quests & Challenges
        </h1>
        <p className="text-slate-400">
          Embark on journeys to achieve your health goals and earn rewards
        </p>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 
              ${activeTab === 'active' 
                ? 'bg-teal-500 text-white rounded' 
                : 'bg-slate-600/20 text-slate-100 hover:bg-slate-600/30'}`}
          >
            Active Quests
          </button>
          <button 
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 
              ${activeTab === 'available' 
                ? 'bg-teal-500 text-white rounded' 
                : 'bg-slate-600/20 text-slate-100 hover:bg-slate-600/30'}`}
          >
            Available Quests
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 
              ${activeTab === 'history' 
                ? 'bg-teal-500 text-white rounded' 
                : 'bg-slate-600/20 text-slate-100 hover:bg-slate-600/30'}`}
          >
            Quest History
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        {activeTab === 'active' && (
          <>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Your Active Quests
            </h2>
            {activeQuests.length > 0 ? (
              <div className="space-y-4">
                {activeQuests.map(quest => (
                  <QuestCard 
                    key={quest.id} 
                    quest={quest} 
                    onProgressUpdate={(result) => {
                      // In a real app, we would update the quests list
                      // For now, we'll just refresh the data
                      // setActiveQuests(prev => prev.map(q => q.id === quest.id ? { ...q, progress: result.progress } : q));
                    }}
                    onAbandon={(questId) => {
                      // Remove abandoned quest from list
                      setActiveQuests(prev => prev.filter(q => q.id !== questId));
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                You don't have any active quests yet. 
                <Link 
                  to="/quests" 
                  onClick={() => setActiveTab('available')}
                  className="text-teal-400 font-medium underline"
                >
                  Browse available quests
                </Link>
                to start your journey!
              </p>
            )}
          </>
        )}
        
        {activeTab === 'available' && (
          <>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Available Quests
            </h2>
            {availableQuests.length > 0 ? (
              <div className="space-y-4">
                {availableQuests.map(quest => (
                  <QuestCard 
                    key={quest.id} 
                    quest={quest} 
                    onProgressUpdate={(result) => {
                      // In a real app, we would move this quest to active
                      // For now, we'll just refresh the data
                      // setAvailableQuests(prev => prev.filter(q => q.id !== quest.id));
                      // setActiveQuests(prev => [...prev, { ...quest, progress: result.progress }]);
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                No quests available at the moment. Please check back later.
              </p>
            )}
          </>
        )}
        
        {activeTab === 'history' && (
          <>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Quest History
            </h2>
            {questHistory.length > 0 ? (
              <div className="space-y-4">
                {questHistory.map(quest => (
                  <motion.div
                    key={quest.questId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: quest.questId.length * 10 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <div className="text-teal-400">🏆</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-slate-100">
                            {quest.title}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(quest.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">
                          Completed! Earned {quest.rewardPoints} VitaPoints
                          {quest.badgeUnlock && ` + ${quest.badgeUnlock.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} badge`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">
                You haven't completed any quests yet. Start your first quest to begin building your history!
              </p>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}