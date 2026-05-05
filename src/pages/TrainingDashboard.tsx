import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GraduationCap, Clock, CheckCircle, Play, Award } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { Progress } from '../components/ui/progress';
import {
  storeTrainingRecord,
  getTrainingRecordsForUser,
  TrainingModule,
  TrainingRecord
} from '../lib/idb';

const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'patient-care-101',
    title: 'Patient Care Fundamentals',
    description: 'Core principles of patient interaction, privacy, and safety protocols.',
    duration: 45,
    category: 'Clinical',
    content: 'This module covers essential patient care practices...'
  },
  {
    id: 'data-privacy',
    title: 'Data Privacy & Security',
    description: 'HIPAA compliance, data handling, and security best practices.',
    duration: 30,
    category: 'Compliance',
    content: 'Learn about patient data protection and privacy regulations...'
  },
  {
    id: 'emergency-response',
    title: 'Emergency Response',
    description: 'Triage protocols and emergency situation handling.',
    duration: 60,
    category: 'Emergency',
    content: 'Emergency procedures and rapid response protocols...'
  },
  {
    id: 'cultural-competency',
    title: 'Cultural Competency',
    description: 'Working effectively with diverse patient populations.',
    duration: 25,
    category: 'Soft Skills',
    content: 'Cultural sensitivity and communication strategies...'
  },
  {
    id: 'documentation-standards',
    title: 'Documentation Standards',
    description: 'Proper documentation and record keeping practices.',
    duration: 40,
    category: 'Clinical',
    content: 'Medical documentation best practices...'
  },
  {
    id: 'medication-safety',
    title: 'Medication Safety',
    description: 'Safe medication administration and error prevention.',
    duration: 50,
    category: 'Clinical',
    content: 'Medication safety protocols and double-check procedures...'
  }
];

export default function TrainingDashboard() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [assignMode, setAssignMode] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      // Get records for current user (placeholder user ID)
      const userRecords = await getTrainingRecordsForUser('current-user');
      setRecords(userRecords);
    } catch (error) {
      console.error('Failed to load training records:', error);
    }
  };

  const isCompleted = (moduleId: string) => {
    return records.some(r => r.moduleId === moduleId && r.completed);
  };

  const completedCount = TRAINING_MODULES.filter(m => isCompleted(m.id)).length;
  const progress = (completedCount / TRAINING_MODULES.length) * 100;

  const handleModuleClick = (module: TrainingModule) => {
    setSelectedModule(module);
    setShowModal(true);
  };

  const handleComplete = async () => {
    if (!selectedModule) return;
    
    try {
      await storeTrainingRecord({
        userId: 'current-user',
        moduleId: selectedModule.id,
        completed: true,
        completedAt: Date.now()
      });
      loadRecords();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to complete module:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedModule || !assignUserId) return;
    
    try {
      await storeTrainingRecord({
        userId: assignUserId,
        moduleId: selectedModule.id,
        completed: false,
        assignedBy: 'admin'
      });
      setAssignMode(false);
      setAssignUserId('');
    } catch (error) {
      console.error('Failed to assign module:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Dashboard</h1>
          <p className="text-slate-400 text-sm">Professional development modules</p>
        </div>
        <GraduationCap size={32} className="text-teal-400" />
      </div>

      {/* Progress Overview */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-500/15 text-teal-300">
            <Award size={24} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Progress</span>
              <span className="text-slate-400 text-sm">{completedCount}/{TRAINING_MODULES.length} modules</span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-800" />
          </div>
        </div>
      </GlassCard>

      {/* Module Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Training Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TRAINING_MODULES.map((module) => {
            const completed = isCompleted(module.id);
            return (
              <motion.div
                key={module.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <GlassCard
                  className="p-4 cursor-pointer h-full flex flex-col"
                  onClick={() => handleModuleClick(module)}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-white">{module.title}</h3>
                      {completed && (
                        <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                      {module.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {module.duration} min
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800/50 rounded-full">
                        {module.category}
                      </span>
                    </div>
                  </div>
                  <button className="mt-3 flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm">
                    <Play size={14} />
                    {completed ? 'Review' : 'Start'}
                  </button>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Module Modal */}
      {showModal && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{selectedModule.title}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {selectedModule.duration} minutes
                </span>
                <span className="px-2 py-0.5 bg-slate-800/50 rounded-full">
                  {selectedModule.category}
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-6">
                {selectedModule.content || selectedModule.description}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-sm"
                >
                  Close
                </button>
                {!isCompleted(selectedModule.id) && (
                  <button
                    onClick={handleComplete}
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}