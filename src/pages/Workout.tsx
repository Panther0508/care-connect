import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Timer,
  Play,
  Pause,
  X,
  Check,
  Dumbbell,
  Target,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Award
} from "lucide-react";
import { getAllExercises, addWorkoutLog } from "../lib/idb";
import type { Exercise } from "../lib/idb";

export default function WorkoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exercisesList, setExercisesList] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [workoutName, setWorkoutName] = useState("My Workout");
  const [started, setStarted] = useState(false);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [sets, setSets] = useState<Array<{ reps: number; weight: number; rpe?: number }>>([]);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    getAllExercises().then(setExercisesList);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return exercisesList;
    const q = search.toLowerCase();
    return exercisesList.filter(e => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
  }, [exercisesList, search]);

  const addExercise = (ex: Exercise) => {
    setSelectedExercises(prev => [...prev, ex]);
  };

  const removeExercise = (idx: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== idx));
    if (currentExerciseIdx >= idx) setCurrentExerciseIdx(prev => Math.max(prev - 1, 0));
  };

  const beginWorkout = () => {
    if (selectedExercises.length === 0) return;
    setStarted(true);
    setCurrentExerciseIdx(0);
    setSets([{ reps: 0, weight: 0 }]);
    setTimer(0);
    setRunning(false);
    setNotes("");
  };

  const addSet = () => {
    setSets(prev => [...prev, { reps: 0, weight: 0 }]);
  };

  const updateSet = (idx: number, field: "reps" | "weight" | "rpe", value: number) => {
    setSets(prev => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const removeSet = (idx: number) => {
    setSets(prev => prev.filter((_, i) => i !== idx));
  };

  const nextExercise = useCallback(() => {
    if (currentExerciseIdx < selectedExercises.length - 1) {
      setCurrentExerciseIdx(prev => prev + 1);
      setSets([{ reps: 0, weight: 0 }]);
    } else {
      completeWorkout();
    }
  }, [currentExerciseIdx, selectedExercises.length]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (running) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval!);
  }, [running]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const completeWorkout = async () => {
    if (!user) return;
    const log = {
      userId: user.id,
      date: new Date().toISOString().split("T")[0],
      name: workoutName,
      exercises: selectedExercises.map((ex, idx) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: sets,
      })),
      duration: Math.floor(timer / 60),
      notes,
      timestamp: Date.now(),
    };
    await addWorkoutLog(log);
    setShowCompleteModal(true);
  };

  const handleFinishModal = () => {
    setShowCompleteModal(false);
    navigate("/workout-history");
  };

  if (!started) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
        <div>
          <h1 className="text-2xl font-bold text-white">Workout</h1>
          <p className="text-slate-400 text-sm">Select exercises to build your routine</p>
        </div>

        <input
          type="text"
          value={workoutName}
          onChange={e => setWorkoutName(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100"
          placeholder="Workout Name"
        />

        <div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100"
            placeholder="Search exercises..."
          />
          <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
            {filtered.map(ex => (
              <button
                key={ex.id}
                onClick={() => addExercise(ex)}
                disabled={selectedExercises.find(e => e.id === ex.id)}
                className="w-full text-left px-3 py-2 bg-slate-800/40 hover:bg-slate-700/60 disabled:opacity-50 text-slate-200 rounded-lg text-sm"
              >
                <span className="font-medium">{ex.name}</span>
                <span className="text-xs text-slate-500 block">{ex.category}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedExercises.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-white">Routine ({selectedExercises.length})</h3>
            {selectedExercises.map((ex, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl">
                <div>
                  <div className="font-medium text-slate-200">{ex.name}</div>
                  <div className="text-xs text-slate-400">{ex.category}</div>
                </div>
                <button onClick={() => removeExercise(idx)} className="text-red-400 text-sm px-2 py-1 rounded bg-red-500/10">Remove</button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={beginWorkout}
          disabled={selectedExercises.length === 0}
          className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <Dumbbell size={20} />
          Start Workout
        </button>
      </motion.div>
    );
  }

  const currentEx = selectedExercises[currentExerciseIdx];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h1 className="text-2xl font-bold text-white truncate max-w-[200px]">{workoutName}</h1>
          <p className="text-slate-400 text-sm">
            Exercise {currentExerciseIdx + 1} of {selectedExercises.length}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-2">
          <Timer size={16} className="text-teal-400" />
          <span className="font-mono text-slate-200">{formatTime(timer)}</span>
          <button onClick={() => setRunning(!running)} className="text-slate-400 hover:text-white">
            {running ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 mb-4">
        {selectedExercises.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-all ${idx === currentExerciseIdx ? "bg-teal-400 w-4" : "bg-slate-600"}`}
          />
        ))}
      </div>

      {/* Current Exercise Card */}
      <div className="flex-1 bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 mb-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">{currentEx?.name}</h2>
          <p className="text-slate-400 text-sm">{currentEx?.category}</p>
        </div>

        {currentEx?.instructions && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Target size={14} />
              Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-400">
              {currentEx.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Sets */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Dumbbell size={14} />
            Sets
          </h3>
          {sets.map((set, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl border border-slate-700/30">
              <div className="w-8 text-center text-slate-400 text-sm font-mono">#{idx + 1}</div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Reps</label>
                  <input
                    type="number"
                    min="0"
                    value={set.reps}
                    onChange={e => updateSet(idx, "reps", parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={set.weight}
                    onChange={e => updateSet(idx, "weight", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">RPE (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={set.rpe || ""}
                    onChange={e => updateSet(idx, "rpe", parseInt(e.target.value) || undefined)}
                    placeholder="-"
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm text-center"
                  />
                </div>
              </div>
              <button
                onClick={() => removeSet(idx)}
                disabled={sets.length <= 1}
                className="text-slate-500 hover:text-red-400 disabled:opacity-30"
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <button
            onClick={addSet}
            className="w-full py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg text-sm transition-colors"
          >
            + Add Set
          </button>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="text-sm text-slate-300 mb-1 block">Notes for this exercise</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-200 resize-none"
            placeholder="How did it feel? Any modifications?"
          />
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentExerciseIdx(Math.max(0, currentExerciseIdx - 1))}
          disabled={currentExerciseIdx === 0}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <button
          onClick={nextExercise}
          className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
        >
          {currentExerciseIdx === selectedExercises.length - 1 ? (
            <>
              <Check size={18} />
              Finish
            </>
          ) : (
            <>
              <ChevronRight size={18} />
              Next
            </>
          )}
        </button>
      </div>

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award size={32} className="text-teal-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Workout Complete!</h2>
              <p className="text-slate-400 text-sm mt-1">Great job! Your workout has been saved.</p>
            </div>
            <div className="space-y-2 text-sm text-slate-300 mb-6">
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-mono">{formatTime(timer)}</span>
              </div>
              <div className="flex justify-between">
                <span>Exercises</span>
                <span>{selectedExercises.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sets</span>
                <span>{sets.reduce((sum, s) => sum + 1, 0)}</span>
              </div>
            </div>
            <button
              onClick={handleFinishModal}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold"
            >
              View History
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
