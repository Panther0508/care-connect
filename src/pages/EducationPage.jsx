import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getEducationModules, fetchAndStoreEducationModules } from '../services/educationEngine';
import { Sparkles, BookOpen, Activity, Heart, Shield, Sparkles as SparklesIcon, CheckCircle } from 'lucide-react';
import SkeletonCard from '../components/SkeletonCard';

const EducationPage = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadModules = async () => {
      try {
        setLoading(true);
        // Try to get from IndexedDB first
        const storedModules = await getEducationModules();
        if (storedModules.length > 0) {
          setModules(storedModules);
        } else {
          // If not in DB, fetch and store
          const modulesData = await fetchAndStoreEducationModules();
          setModules(modulesData);
        }
      } catch (err) {
        console.error('Error loading education modules:', err);
        setError('Failed to load educational content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[calc(100vh-4rem)] p-6"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 bg-slate-700 rounded w-1/3 skeleton-shimmer" />
            <div className="h-4 bg-slate-700 rounded w-1/2 skeleton-shimmer" />
          </div>
          {/* Modules grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} variant="github" lines={4} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center"
      >
        <div className="text-center">
          <AlertTriangle size={32} className="mb-4 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-100">Error</h2>
          <p className="text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary px-6 py-2"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-2xl font-bold text-slate-100">
            Health Education Center
          </h1>
          <p className="text-slate-400 max-w-xl">
            Learn about nutrition, exercise, mental wellness, and managing health conditions through interactive modules.
          </p>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group"
            >
              <Link
                to={`/education/${module.id}`}
                className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${module.color} shrink-0`}>
                    {module.icon === 'Sparkles' ? <SparklesIcon size={20} className="text-white" /> : module.icon === 'BookOpen' ? <BookOpen size={20} className="text-white" /> : module.icon === 'Activity' ? <Activity size={20} className="text-white" /> : module.icon === 'Heart' ? <Heart size={20} className="text-white" /> : module.icon === 'Shield' ? <Shield size={20} className="text-white" /> : <SparklesIcon size={20} className="text-white" />}
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-slate-100">{module.title}</h3>
                </div>
                <p className="text-slate-400 flex-1">{module.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-slate-500">
                    {module.difficulty} • {module.duration}
                  </span>
                  <ChevronRight size={18} className="text-teal-400 group-hover:text-teal-300 transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-slate-500 text-sm"
        >
          All educational content is available offline once loaded.
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EducationPage;