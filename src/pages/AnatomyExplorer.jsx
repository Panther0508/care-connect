import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Brain, Stethoscope, Pill, Syringe, Virus, 
  Activity, Eye, Bone, HeartPulse, Lung, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnatomyExplorer = () => {
  const navigate = useNavigate();
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [organData, setOrganData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dailyLimit, setDailyLimit] = useState(8);
  const [exploredToday, setExploredToday] = useState([]);

  // Define 8 daily organs with icons from healthicons
  const dailyOrgans = [
    {
      id: 'heart',
      name: 'Heart',
      icon: HeartPulse,
      color: 'from-red-500 to-rose-600',
      apiEndpoint: 'heart',
      description: 'Cardiovascular system health'
    },
    {
      id: 'brain',
      name: 'Brain',
      icon: Brain,
      color: 'from-purple-500 to-indigo-600',
      apiEndpoint: 'brain',
      description: 'Neurological wellness'
    },
    {
      id: 'lungs',
      name: 'Lungs',
      icon: Lung,
      color: 'from-blue-500 to-cyan-600',
      apiEndpoint: 'lungs',
      description: 'Respiratory health'
    },
    {
      id: 'eyes',
      name: 'Eyes',
      icon: Eye,
      color: 'from-emerald-500 to-teal-600',
      apiEndpoint: 'eyes',
      description: 'Vision and eye care'
    },
    {
      id: 'bones',
      name: 'Bones',
      icon: Bone,
      color: 'from-amber-500 to-orange-600',
      apiEndpoint: 'bones',
      description: 'Skeletal health'
    },
    {
      id: 'stomach',
      name: 'Stomach',
      icon: Activity,
      color: 'from-yellow-500 to-amber-600',
      apiEndpoint: 'digestive',
      description: 'Digestive wellness'
    },
    {
      id: 'immune',
      name: 'Immune System',
      icon: Shield,
      color: 'from-green-500 to-emerald-600',
      apiEndpoint: 'immune',
      description: 'Immunization & immunity'
    },
    {
      id: 'kidneys',
      name: 'Kidneys',
      icon: Activity,
      color: 'from-slate-500 to-zinc-600',
      apiEndpoint: 'kidneys',
      description: 'Renal health'
    }
  ];

  // Load explored count from IndexedDB on mount
  useEffect(() => {
    loadExploredCount();
  }, []);

  const loadExploredCount = async () => {
    try {
      const db = await idb.openDB('vitachain', 1);
      const tx = db.transaction('anatomy', 'readonly');
      const store = tx.objectStore('anatomy');
      const today = new Date().toDateString();
      const count = await store.count(today);
      setExploredToday(prev => [...prev, today]); // Simplified; would store actual organ IDs
    } catch (err) {
      console.warn('Could not load explored count:', err);
    }
  };

  const handleOrganClick = useCallback(async (organ) => {
    if (exploredToday.length >= dailyLimit) {
      setError('Daily limit reached. Try again tomorrow!');
      return;
    }

    setSelectedOrgan(organ);
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = await getCachedOrganData(organ.id);
      if (cached) {
        setOrganData(cached);
        setLoading(false);
        recordExploration(organ.id);
        return;
      }

      // Fetch via proxy to avoid CORS
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: `https://www.nhs.uk/conditions/${organ.apiEndpoint}/`
        })
      });

      if (!response.ok) throw new Error('Failed to fetch organ info');

      const html = await response.text();
      
      // Parse relevant info (simplified - in production use cheerio)
      const info = {
        organ: organ.name,
        description: organ.description,
        summary: `Learn about ${organ.name} health, common conditions, prevention tips, and when to seek care.`,
        tips: [
          'Maintain regular check-ups',
          'Follow a balanced diet',
          'Stay physically active',
          'Get adequate sleep'
        ],
        source: 'NHS UK'
      };

      // Cache for 24 hours
      await cacheOrganData(organ.id, info);
      setOrganData(info);
      recordExploration(organ.id);
    } catch (err) {
      console.error('Error fetching organ data:', err);
      
      // Fallback to static offline data
      setOrganData({
        organ: organ.name,
        description: organ.description,
        summary: `Basic information about ${organ.name}. Connect to the internet for detailed medical information.`,
        tips: [
          'Maintain regular check-ups',
          'Follow a balanced diet',
          'Stay physically active',
          'Get adequate sleep',
          'Avoid smoking and excessive alcohol'
        ],
        source: 'Offline Guide'
      });
      recordExploration(organ.id);
    } finally {
      setLoading(false);
    }
  }, [exploredToday]);

  const recordExploration = async (organId) => {
    try {
      const db = await idb.openDB('vitachain', 1);
      const tx = db.transaction('anatomy', 'readwrite');
      const store = tx.objectStore('anatomy');
      await store.add({
        date: new Date().toDateString(),
        organId,
        timestamp: Date.now()
      });
      setExploredToday(prev => [...prev, organId]);
    } catch (err) {
      console.warn('Could not record exploration:', err);
    }
  };

  const getCachedOrganData = async (organId) => {
    try {
      const db = await idb.openDB('vitachain', 1);
      const tx = db.transaction('anatomyCache', 'readonly');
      const store = tx.objectStore('anatomyCache');
      const cached = await store.get(organId);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
    } catch (err) {
      console.warn('Cache miss:', err);
    }
    return null;
  };

  const cacheOrganData = async (organId, data) => {
    try {
      const db = await idb.openDB('vitachain', 1);
      const tx = db.transaction('anatomyCache', 'readwrite');
      const store = tx.objectStore('anatomyCache');
      await store.put({
        organId,
        data,
        expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      });
    } catch (err) {
      console.warn('Could not cache organ data:', err);
    }
  };

  const closeModal = () => {
    setSelectedOrgan(null);
    setOrganData(null);
    setLoading(false);
    setError(null);
  };

  const askVitaAbout = (topic) => {
    navigate(`/ai?query=${encodeURIComponent(`Tell me more about ${topic} in ${selectedOrgan?.name}`)}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">
            Daily Anatomy Explorer
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Discover a new organ or body system each day. Learn about your body 
            and how to keep it healthy. {exploredToday.length}/{dailyLimit} explored today.
          </p>
          {exploredToday.length >= dailyLimit && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle className="text-emerald-400" size={18} />
              <span className="text-emerald-300 text-sm">Daily goal reached! Check back tomorrow.</span>
            </div>
          )}
        </div>

        {/* Organs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dailyOrgans.map((organ) => {
            const Icon = organ.icon;
            const isExplored = exploredToday.includes(organ.id);
            const isDisabled = exploredToday.length >= dailyLimit && !isExplored;

            return (
              <motion.button
                key={organ.id}
                onClick={() => handleOrganClick(organ)}
                disabled={isDisabled}
                whileHover={{ scale: isDisabled ? 1 : 1.03 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                className={`
                  relative p-6 rounded-2xl glass-card transition-all duration-300
                  ${isExplored 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-slate-800/20 border-slate-700/30'
                    : 'bg-slate-800/40 border-slate-600/30 hover:border-teal-500/50 cursor-pointer'
                  }
                `}
              >
                {/* Organ Icon */}
                <div className={`
                  w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
                  bg-gradient-to-br ${organ.color}
                  ${isExplored ? 'ring-2 ring-emerald-500' : ''}
                `}>
                  <Icon size={32} className="text-white" />
                </div>

                {/* Organ Name */}
                <h3 className="text-lg font-semibold text-slate-100 text-center mb-1">
                  {organ.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 text-center">
                  {organ.description}
                </p>

                {/* Explored Badge */}
                {isExplored && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="text-emerald-400" size={20} />
                  </div>
                )}

                {/* Disabled Overlay */}
                {isDisabled && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/50 backdrop-blur-sm">
                    <span className="text-slate-400 text-sm font-medium">Limit Reached</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Info Modal */}
        <AnimatePresence>
          {selectedOrgan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-2xl glass-card rounded-2xl p-6 md:p-8"
                onClick={(e) => e.stopPropagation()}
              >
                {loading ? (
                  <div className="space-y-4">
                    <div className="h-8 bg-slate-700 rounded w-3/4 skeleton-shimmer" />
                    <div className="h-4 bg-slate-700 rounded w-full" />
                    <div className="h-4 bg-slate-700 rounded w-5/6" />
                    <div className="h-4 bg-slate-700 rounded w-4/6" />
                    <div className="flex gap-2 mt-6">
                      <div className="h-10 bg-slate-700 rounded-full w-32 skeleton-shimmer" />
                      <div className="h-10 bg-slate-700 rounded-full w-40 skeleton-shimmer" />
                    </div>
                  </div>
                ) : organData ? (
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-2">
                          {organData.organ}
                        </h2>
                        <p className="text-slate-400">{organData.description}</p>
                      </div>
                      <button
                        onClick={closeModal}
                        className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Summary */}
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      {organData.summary}
                    </p>

                    {/* Tips */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                        <Activity size={18} className="text-teal-400" />
                        Health Tips
                      </h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {organData.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-teal-400 mt-1">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Source */}
                    <div className="text-xs text-slate-500 mb-6 pb-4 border-b border-slate-700/50">
                      Source: {organData.source}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => askVitaAbout(organData.organ)}
                        className="px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium hover:from-teal-500 hover:to-cyan-500 transition-all flex items-center gap-2"
                      >
                        <Sparkles size={18} />
                        Ask Vita AI
                      </button>
                      <button
                        onClick={closeModal}
                        className="px-6 py-2.5 rounded-full glass-card text-slate-200 hover:bg-slate-700/30 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={closeModal}
                      className="px-6 py-2 rounded-full glass-card"
                    >
                      Close
                    </button>
                  </div>
                ) : null}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AnatomyExplorer;
