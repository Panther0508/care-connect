import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Heart,
  Pill,
  Apple,
  Dumbbell,
  AlertTriangle,
  Stethoscope,
  ClipboardCheck,
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { getCurrentHealthState } from '../services/healthGraph';
import { getAllFoods } from '../lib/idb';
import { getAllExercises } from '../lib/idb';
import {
  storeCarePlan,
  getAllCarePlans,
  logCarePlanTask,
  getCarePlanLogsForDate,
  deleteCarePlan
} from '../lib/idb';
import { LiquidGlassCard } from '../components/LiquidGlassCard';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';

// Condition icon mapping
const conditionIcons = {
  hypertension: 'heart',
  diabetes: 'activity',
  asthma: 'wind',
  copd: 'lungs',
  hiv: 'virus',
  tb: 'virus',
  headache: 'brain',
  arthritis: 'bone',
  default: 'stethoscope'
};

// Condition colors
const conditionColors = {
  hypertension: { bg: 'bg-rose-500/20', border: 'border-rose-400/50', icon: 'text-rose-400' },
  diabetes: { bg: 'bg-cyan-500/20', border: 'border-cyan-400/50', icon: 'text-cyan-400' },
  asthma: { bg: 'bg-sky-500/20', border: 'border-sky-400/50', icon: 'text-sky-400' },
  copd: { bg: 'bg-teal-500/20', border: 'border-teal-400/50', icon: 'text-teal-400' },
  hiv: { bg: 'bg-amber-500/20', border: 'border-amber-400/50', icon: 'text-amber-400' },
  tb: { bg: 'bg-orange-500/20', border: 'border-orange-400/50', icon: 'text-orange-400' },
  default: { bg: 'bg-indigo-500/20', border: 'border-indigo-400/50', icon: 'text-indigo-400' }
};

// Get icon component
const getIcon = (name) => {
  switch (name) {
    case 'heart': return Heart;
    case 'activity': return Activity;
    case 'wind': return Activity;
    case 'virus': return AlertTriangle;
    case 'brain': return Activity;
    case 'bone': return Activity;
    default: return Stethoscope;
  }
};

// Filter foods suitable for condition
const getFoodsForCondition = (conditionName, allFoods) => {
  const c = conditionName.toLowerCase();
  if (c.includes('hypertension') || c.includes('pressure')) {
    return allFoods.filter((f) =>
      f.name?.toLowerCase().includes('banana') ||
      f.name?.toLowerCase().includes('spinach') ||
      f.name?.toLowerCase().includes('sweet potato') ||
      f.name?.toLowerCase().includes('beans') ||
      f.name?.toLowerCase().includes('oat')
    ).slice(0, 4);
  }
  if (c.includes('diabetes')) {
    return allFoods.filter((f) =>
      f.name?.toLowerCase().includes('quinoa') ||
      f.name?.toLowerCase().includes('lentils') ||
      f.name?.toLowerCase().includes('broccoli') ||
      f.name?.toLowerCase().includes('avocado') ||
      f.name?.toLowerCase().includes('nuts')
    ).slice(0, 4);
  }
  if (c.includes('asthma') || c.includes('copd')) {
    return allFoods.filter((f) =>
      f.name?.toLowerCase().includes('salmon') ||
      f.name?.toLowerCase().includes('spinach') ||
      f.name?.toLowerCase().includes('carrot') ||
      f.name?.toLowerCase().includes('citrus')
    ).slice(0, 4);
  }
  return allFoods.filter((f) =>
    ['spinach', 'broccoli', 'salmon', 'chicken', 'sweet potato'].some(keyword =>
      f.name?.toLowerCase().includes(keyword)
    )
  ).slice(0, 4);
};

// Filter exercises suitable for condition
const getExercisesForCondition = (conditionName, allExercises) => {
  const c = conditionName.toLowerCase();
  if (c.includes('hypertension')) {
    return allExercises.filter((e) =>
      ['walking', 'stretching', 'swimming', 'cycling'].some(m =>
        e.name?.toLowerCase().includes(m) || e.category?.toLowerCase().includes(m)
      )
    ).slice(0, 3);
  }
  if (c.includes('diabetes')) {
    return allExercises.filter((e) =>
      ['walk', 'brisk', 'cycling', 'strength'].some(m =>
        e.name?.toLowerCase().includes(m) || e.category?.toLowerCase().includes(m)
      )
    ).slice(0, 3);
  }
  if (c.includes('asthma')) {
    return allExercises.filter((e) =>
      ['breathing', 'stretching', 'yoga', 'walking'].some(m =>
        e.name?.toLowerCase().includes(m) || e.category?.toLowerCase().includes(m)
      )
    ).slice(0, 3);
  }
  if (c.includes('copd')) {
    return allExercises.filter((e) =>
      ['walking', 'stretching', 'diaphragmatic'].some(m =>
        e.name?.toLowerCase().includes(m) || e.category?.toLowerCase().includes(m)
      )
    ).slice(0, 3);
  }
  return allExercises.filter((e) =>
    ['stretching', 'walking', 'bodyweight'].some(m =>
      e.name?.toLowerCase().includes(m) || e.category?.toLowerCase().includes(m)
    )
  ).slice(0, 3);
};

// Generate daily tasks based on condition
const generateDailyTasks = (condition) => {
  const tasks = [
    { id: 'symptom_check', label: 'Check symptoms and record how you feel' },
    { id: 'medication', label: 'Take prescribed medications' },
    { id: 'hydration', label: 'Drink at least 8 glasses of water' },
  ];

  if (condition.name?.toLowerCase().includes('hypertension')) {
    tasks.push({ id: 'bp_check', label: 'Check blood pressure (morning & evening)' });
  }
  if (condition.name?.toLowerCase().includes('diabetes')) {
    tasks.push({ id: 'glucose_check', label: 'Check blood glucose levels' });
    tasks.push({ id: 'foot_check', label: 'Check feet for sores or swelling' });
  }
  if (condition.name?.toLowerCase().includes('asthma') || condition.name?.toLowerCase().includes('copd')) {
    tasks.push({ id: 'peak_flow', label: 'Use peak flow meter (if available)' });
    tasks.push({ id: 'breathing_exercises', label: 'Complete breathing exercises' });
  }
  tasks.push({ id: 'healthy_diet', label: 'Follow recommended diet plan' });
  tasks.push({ id: 'light_activity', label: 'Do recommended light exercise' });

  return tasks;
};

const getWarningSigns = (conditionName) => {
  const c = conditionName.toLowerCase();
  if (c.includes('hypertension')) {
    return ['Severe headache', 'Chest pain', 'Shortness of breath', 'Vision changes', 'Nausea or vomiting'];
  }
  if (c.includes('diabetes')) {
    return ['Very high blood glucose (>300 mg/dL)', 'Persistent nausea or vomiting', 'Severe abdominal pain', 'Confusion or drowsiness', 'Fruity-smelling breath'];
  }
  if (c.includes('asthma')) {
    return ['Worsening wheezing', 'Shortness of breath at rest', 'Difficulty speaking in full sentences', 'Blue lips or fingernails', 'No improvement with rescue inhaler'];
  }
  if (c.includes('copd')) {
    return ['Severe shortness of breath', 'Blueish lips or fingernails', 'Confusion or dizziness', 'Rapid heartbeat', 'Worsening cough with fever'];
  }
  if (c.includes('hiv')) {
    return ['Fever above 101°F', 'Severe diarrhea', 'Persistent cough', 'Rapid weight loss', 'Severe fatigue'];
  }
  if (c.includes('tb')) {
    return ['Cough lasting more than 2 weeks', 'Coughing up blood', 'Chest pain', 'Fever and night sweats', 'Unexplained weight loss'];
  }
  return ['Worsening symptoms', 'Fever', 'Severe pain', 'Difficulty breathing', 'Confusion'];
};

const getRedFlags = (conditionName) => {
  return ['Difficulty breathing', 'Chest pain or pressure', 'Severe headache or confusion', 'Uncontrolled bleeding', 'Loss of consciousness', 'Severe allergic reaction'];
};

// Emergency contacts
const emergencyContacts = {
  nigeria: { ambulance: '112', poison: '0806-322-3223', fg: '112' },
  kenya: { ambulance: '999', police: '999', fg: '999' },
  ghana: { ambulance: '112', police: '191', fg: '112' }
};

export default function CarePlans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conditions, setConditions] = useState([]);
  const [carePlans, setCarePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const userId = user?.id || 'guest';

  // Load data on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const healthState = getCurrentHealthState();
        setConditions(healthState.conditions);
        const existingPlans = await getAllCarePlans();
        setCarePlans(existingPlans);
        setGenerated(existingPlans.length > 0);

        // Load today's completion logs
        if (existingPlans.length > 0) {
          const logs = await getCarePlanLogsForDate(userId, today);
          setCarePlans(prev => prev.map(plan => {
            const planLogs = logs.filter(l => l.conditionId === plan.conditionId);
            return {
              ...plan,
              dailyTasks: plan.dailyTasks.map(task => ({
                ...task,
                completed: planLogs.some(l => l.taskId === task.id && l.completed)
              }))
            };
          }));
        }
      } catch (err) {
        console.error('Failed to load:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Generate care plan for a condition
  const generateCarePlan = async (condition) => {
    const existing = carePlans.find(p => p.conditionId === condition.id);
    if (existing) return;

    const allFoods = await getAllFoods();
    const allExercises = await getAllExercises();

    const conditionName = condition.name;
    const conditionId = condition.id;

    const getFoodReason = (food) => {
      if (conditionName.toLowerCase().includes('hypertension')) {
        if (food.toLowerCase().includes('banana')) return 'High in potassium, helps lower blood pressure';
        if (food.toLowerCase().includes('spinach')) return 'Rich in magnesium and potassium';
      }
      if (conditionName.toLowerCase().includes('diabetes')) {
        if (food.toLowerCase().includes('quinoa')) return 'Low glycemic index, high fiber';
        if (food.toLowerCase().includes('lentils')) return 'High protein, stabilizes blood sugar';
      }
      return 'Nutrient-dense, supports overall health';
    };

    const plan = {
      conditionId,
      conditionName,
      conditionIcon: conditionIcons[conditionName.toLowerCase()] || 'stethoscope',
      createdAt: Date.now(),
      dailyTasks: generateDailyTasks(condition),
      medications: [],
      dietRecommendations: getFoodsForCondition(conditionName, allFoods || []).map((f) => ({
        foodId: f.id,
        name: f.name,
        reason: getFoodReason(f.name)
      })),
      exercises: getExercisesForCondition(conditionName, allExercises || []).map((e) => ({
        id: e.id,
        name: e.name,
        description: e.instructions?.[0] || '',
        instructions: e.instructions || []
      })),
      warningSigns: getWarningSigns(conditionName),
      emergencyContact: emergencyContacts.nigeria,
      redFlags: getRedFlags(conditionName)
    };

    await storeCarePlan(plan);
    setCarePlans(prev => [...prev, plan]);
    setGenerated(true);

    // Load today's logs for the new plan
    const logs = await getCarePlanLogsForDate(userId, today);
    setCarePlans(prev => prev.map(p => {
      if (p.conditionId === conditionId) {
        return {
          ...p,
          dailyTasks: p.dailyTasks.map(task => ({
            ...task,
            completed: logs.some(l => l.taskId === task.id && l.completed)
          }))
        };
      }
      return p;
    }));
  };

  // Toggle task completion
  const toggleTask = async (conditionId, taskId) => {
    const plan = carePlans.find(p => p.conditionId === conditionId);
    if (!plan) return;

    const task = plan.dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    setCarePlans(prev => prev.map(p => {
      if (p.conditionId === conditionId) {
        return {
          ...p,
          dailyTasks: p.dailyTasks.map(t =>
            t.id === taskId ? { ...t, completed: newCompleted } : t
          )
        };
      }
      return p;
    }));

    await logCarePlanTask({
      userId,
      conditionId,
      taskId,
      date: today,
      completed: newCompleted,
      timestamp: Date.now()
    });
  };

  // Calculate progress
  const getProgress = (plan) => {
    const done = plan.dailyTasks.filter(t => t.completed).length;
    return Math.round((done / plan.dailyTasks.length) * 100);
  };

  // Load medications from healthGraph
  const healthState = getCurrentHealthState();
  const meds = healthState.medications || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-300">
          Loading your care plans...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full glass-card hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-2">
              <Heart className="text-rose-400" size={28} />
              Care Plans
            </h1>
            <p className="text-slate-400">Evidence-based self-management for your conditions</p>
          </div>
        </div>
        {!generated && (
          <Button
            onClick={() => conditions.forEach(generateCarePlan)}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="mr-2" size={18} />
            Generate Plans
          </Button>
        )}
      </div>

      {conditions.length === 0 ? (
        <LiquidGlassCard className="p-8 text-center">
          <Stethoscope className="mx-auto mb-4 text-slate-400" size={64} />
          <h2 className="text-xl font-semibold text-slate-100 mb-2">No conditions recorded</h2>
          <p className="text-slate-400 mb-6">Add health conditions to generate personalized care plans</p>
          <button
            onClick={() => navigate('/health')}
            className="btn-primary px-6 py-3 rounded-xl"
          >
            Add Health Conditions
          </button>
        </LiquidGlassCard>
      ) : generated ? (
        <div className="space-y-6">
          {carePlans.map((plan) => {
            const scheme = conditionColors[plan.conditionName.toLowerCase()] || conditionColors.default;
            const Icon = getIcon(plan.conditionIcon);
            const progress = getProgress(plan);

            return (
              <motion.div
                key={plan.conditionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`relative overflow-hidden rounded-2xl border ${scheme.border} ${scheme.bg} p-6 backdrop-blur-xl`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${scheme.bg} border ${scheme.border}`}>
                      <Icon className={scheme.icon} size={28} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-100">{plan.conditionName}</h2>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Created {new Date(plan.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      deleteCarePlan(plan.conditionId);
                      setCarePlans(prev => {
                        const newPlans = prev.filter(p => p.conditionId !== plan.conditionId);
                        if (newPlans.length === 0) setGenerated(false);
                        return newPlans;
                      });
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-300">Today's Progress</span>
                    <span className="text-sm text-slate-400">{progress}% complete</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-slate-700/50" />
                </div>

                {/* Daily Monitoring */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <ClipboardCheck size={18} className="text-teal-400" />
                    Daily Tasks
                    <span className="text-xs text-slate-400 ml-2">Check off completed items</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {plan.dailyTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${task.completed ? 'bg-teal-900/20 border-teal-500/30' : 'border-slate-700/30 hover:bg-white/5'}`}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(plan.conditionId, task.id)}
                          className="data-[state=checked]:bg-teal-500"
                        />
                        <span className={`flex-1 text-sm ${task.completed ? 'text-slate-300 line-through' : 'text-slate-200'}`}>
                          {task.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medication Schedule */}
                {meds.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                      <Pill size={18} className="text-cyan-400" />
                      Medications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {meds.map((med, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-slate-700/30 bg-white/5">
                          <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          <div>
                            <div className="text-sm font-medium text-slate-100">{med.name}</div>
                            <div className="text-xs text-slate-400">{med.dose} – {med.frequency}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diet Recommendations */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <Apple size={18} className="text-emerald-400" />
                    Recommended Foods
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {plan.dietRecommendations.map((food, idx) => (
                      <div key={idx} className="flex flex-col items-center p-3 rounded-lg border border-slate-700/30 bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                          <Apple className="text-emerald-400" size={18} />
                        </div>
                        <span className="text-sm font-medium text-slate-200 text-center">{food.name}</span>
                        <span className="text-xs text-slate-400 text-center mt-1">{food.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercise Guidance */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                    <Dumbbell size={18} className="text-amber-400" />
                    Safe Exercises
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {plan.exercises.map((ex, idx) => (
                      <div key={idx} className="p-4 rounded-lg border border-slate-700/30 bg-white/5">
                        <h4 className="text-sm font-semibold text-slate-100 mb-1">{ex.name}</h4>
                        <p className="text-xs text-slate-400 mb-2">{ex.description}</p>
                        {ex.instructions?.length > 0 && (
                          <details className="text-xs text-slate-400">
                            <summary className="cursor-pointer text-teal-400">View instructions</summary>
                            <ol className="list-decimal list-inside mt-2 space-y-1">
                              {ex.instructions.slice(0, 3).map((step, i) => (
                                <li key={i} className="text-slate-300">{step}</li>
                              ))}
                            </ol>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning Signs & Emergency Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-900/10">
                    <h3 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Warning Signs
                    </h3>
                    <ul className="space-y-2">
                      {plan.warningSigns.map((sign, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                          {sign}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg border border-red-500/30 bg-red-900/10">
                    <h3 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      When to Seek Help
                    </h3>
                    <div className="mb-3">
                      <div className="text-sm text-slate-300 mb-1">Emergency: {plan.emergencyContact.phone}</div>
                      <div className="text-xs text-slate-400">National Emergency: 112</div>
                    </div>
                    <ul className="space-y-2">
                      {plan.redFlags.slice(0, 4).map((flag, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <LiquidGlassCard className="p-8 text-center">
          <Sparkles className="mx-auto mb-4 text-teal-400" size={64} />
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Care Plans Ready to Generate</h2>
          <p className="text-slate-400 mb-6">
            Based on your {conditions.length} recorded condition{conditions.length > 1 ? 's' : ''}, we can create personalized self-management plans.
          </p>
          <Button
            onClick={() => conditions.forEach(generateCarePlan)}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="mr-2" size={18} />
            Generate All Plans
          </Button>
        </LiquidGlassCard>
      )}
    </motion.div>
  );
}
