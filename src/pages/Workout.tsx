import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Plus, Trash2, Edit2, Save, X, Play, CheckCircle, Target, Flame, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { getAllExercises, searchExercises, addWorkoutLog, getWorkoutLogsForUser, addExercise, storeExercises } from "../lib/idb";
import { useStatus } from "../hooks/useStatus";
import { format } from "date-fns";
import MagnifyingLoader from "../components/MagnifyingLoader";

export default function Workout() {
  const { showStatus, dismissStatus } = useStatus();
  const [exercises, setExercises] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showingHistory, setShowingHistory] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    loadExercises();
    loadWorkoutHistory();
  }, []);

  const loadExercises = async () => {
    try {
      const ex = await getAllExercises();
      setExercises(ex);
    } catch (err) {
      console.error('Failed to load exercises:', err);
      showStatus('error', 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkoutHistory = async () => {
    try {
      const logs = await getWorkoutLogsForUser('current-user', 20);
      setWorkoutLogs(logs);
    } catch (err) {
      console.error('Failed to load workout history:', err);
    }
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      try {
        const results = await searchExercises(q);
        setExercises(results);
      } catch (err) {
        console.error('Search failed:', err);
      }
    } else if (q.length === 0) {
      loadExercises();
    }
  };

  const toggleExercise = (exercise) => {
    const exists = selectedExercises.find(e => e.id === exercise.id);
    if (exists) {
      setSelectedExercises(prev => prev.filter(e => e.id !== exercise.id));
    } else {
      setSelectedExercises(prev => [...prev, {
        ...exercise,
        sets: [{ reps: 10, weight: 0 }],
        notes: ''
      }]);
    }
  };

  const updateExerciseSets = (exerciseId, newSets) => {
    setSelectedExercises(prev => prev.map(ex => 
      ex.id === exerciseId ? { ...ex, sets: newSets } : ex
    ));
  };

  const addSet = (exerciseId) => {
    setSelectedExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: [...ex.sets, { reps: 10, weight: 0 }] };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId, setIndex) => {
    setSelectedExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const newSets = ex.sets.filter((_, i) => i !== setIndex);
        return { ...ex, sets: newSets };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    setSelectedExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const newSets = [...ex.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        return { ...ex, sets: newSets };
      }
      return ex;
    }));
  };

  const calculateTotalVolume = (sets) => {
    return sets.reduce((total, set) => total + (set.weight * set.reps), 0);
  };

  const handleSaveWorkout = async () => {
    if (selectedExercises.length === 0) {
      showStatus('warning', 'Please select at least one exercise');
      return;
    }

    setIsLogging(true);
    try {
      const workout = {
        userId: 'current-user',
        date: new Date().toISOString().split('T')[0],
        workoutName: 'Custom Workout',
        totalDuration: 45,
        totalVolume: selectedExercises.reduce((sum, ex) => sum + calculateTotalVolume(ex.sets), 0),
        exercises: selectedExercises.map(ex => ({
          name: ex.name,
          sets: ex.sets
        })),
        notes: selectedExercises.map(ex => `${ex.name}: ${ex.sets.length} sets`).join(' | '),
        timestamp: Date.now()
      };

      await addWorkoutLog(workout);
      await loadWorkoutHistory();
      setSelectedExercises([]);
      showStatus('success', 'Workout saved successfully!');
    } catch (err) {
      console.error('Failed to save workout:', err);
      showStatus('error', 'Failed to save workout');
    } finally {
      setIsLogging(false);
    }
  };

  const toggleHistory = () => {
    setShowingHistory(!showingHistory);
  };

  const toggleExerciseDetails = (exId) => {
    setExpandedExercise(expandedExercise === exId ? null : exId);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/20 flex items-center justify-center">
              <Dumbbell size={20} className="text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Workout Tracker</h1>
              <p className="text-sm text-slate-400">Track your fitness progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Workout Builder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-teal-400" />
              Build Your Workout
            </h2>

            {/* Search Exercises */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search exercises..."
                className="glass-input w-full px-4 py-3 rounded-xl text-slate-100 placeholder-slate-500 focus:border-teal-400/50 transition-colors"
              />
            </div>

            {/* Exercise List */}
            <div className="max-h-80 overflow-y-auto space-y-2 mb-6 pr-2">
              <AnimatePresence>
                {exercises.map((exercise) => {
                  const isSelected = selectedExercises.find(e => e.id === exercise.id);
                  return (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-teal-500/20 border border-teal-500/30' 
                          : 'glass-card hover:border-teal-400/20'
                      }`}
                      onClick={() => toggleExercise(exercise)}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-100 truncate">{exercise.name}</h3>
                        <p className="text-sm text-slate-400">{exercise.category} • {exercise.equipment || 'Bodyweight'}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{exercise.instructions?.[0] || ''}</p>
                      </div>
                      <div className="ml-4">
                        {isSelected ? (
                          <CheckCircle size={24} className="text-teal-400" />
                        ) : (
                          <div className="w-6 h-6 rounded-lg border border-slate-600" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {exercises.length === 0 && (
                <p className="text-center text-slate-400 py-8">No exercises found</p>
              )}
            </div>

            {/* Selected Exercises */}
            <AnimatePresence>
              {selectedExercises.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-md font-semibold text-slate-100">Your Workout Plan</h3>
                  {selectedExercises.map((exercise) => (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass-card rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-100">{exercise.name}</h4>
                          <p className="text-sm text-slate-400">{exercise.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExerciseDetails(exercise.id)}
                            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                          >
                            {expandedExercise === exercise.id ? (
                              <ChevronUp size={16} className="text-slate-400" />
                            ) : (
                              <ChevronDown size={16} className="text-slate-400" />
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedExercises(prev => prev.filter(e => e.id !== exercise.id))}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Sets */}
                      <div className="space-y-2 mb-3">
                        {exercise.sets.map((set, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm text-slate-400 w-12">Set {index + 1}</span>
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) => updateSet(exercise.id, index, 'reps', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 glass-input rounded-lg px-2 py-1 text-sm text-center"
                              placeholder="Reps"
                            />
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) => updateSet(exercise.id, index, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-20 glass-input rounded-lg px-2 py-1 text-sm text-center"
                              placeholder="Weight"
                            />
                            <span className="text-sm text-slate-400">kg</span>
                            <button
                              onClick={() => removeSet(exercise.id, index)}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addSet(exercise.id)}
                          className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
                        >
                          <Plus size={14} />
                          Add Set
                        </button>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedExercise === exercise.id && exercise.instructions && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-slate-700 pt-3 mt-3"
                          >
                            <p className="text-sm text-slate-300 leading-relaxed">
                              <strong className="text-slate-200">How to:</strong>{' '}
                              {exercise.instructions.join(' ')}
                            </p>
                            {exercise.musclesPrimary && (
                              <p className="text-sm text-slate-400 mt-2">
                                <strong>Targets:</strong> {exercise.musclesPrimary.join(', ')}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Set Stats */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700">
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Target size={14} className="text-teal-400" />
                          <span>{exercise.sets.length} sets</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Flame size={14} className="text-orange-400" />
                          <span>{calculateTotalVolume(exercise.sets)} kg</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Clock size={14} className="text-blue-400" />
                          <span>~{exercise.sets.length * 3} min</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Save Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveWorkout}
                    disabled={isLogging}
                    className="w-full py-4 px-6 rounded-xl font-medium text-white text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLogging ? (
                      <>
                        <MagnifyingLoader size={16} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Workout ({selectedExercises.reduce((sum, ex) => sum + calculateTotalVolume(ex.sets), 0)} kg total)
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Workout History Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <button
              onClick={toggleHistory}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-teal-500/20 flex items-center justify-center">
                  <Clock size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Workout History</h2>
                  <p className="text-sm text-slate-400">{workoutLogs.length} workouts completed</p>
                </div>
              </div>
              {showingHistory ? (
                <ChevronUp size={20} className="text-slate-400" />
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </button>

            <AnimatePresence>
              {showingHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  {workoutLogs.length === 0 ? (
                    <p className="text-center text-slate-400 py-4">No workout history yet</p>
                  ) : (
                    workoutLogs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-100">{log.workoutName}</h4>
                          <span className="text-sm text-slate-400">
                            {format(new Date(log.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">
                          {log.exercises.length} exercises • {log.totalVolume} kg total volume
                        </p>
                        {log.notes && (
                          <p className="text-sm text-slate-500">{log.notes}</p>
                        )}
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
