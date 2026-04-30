import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, Scale, Flame, Dumbbell, Target, TrendingUp } from "lucide-react";
import {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateMacrosFromCalories,
  calculateOneRepMax,
  type BMICategory,
  type ActivityLevel,
  type MacroPreset,
} from "@finegym/fitness-calc";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const ACTIVITY_OPTIONS: Array<{label: string, value: ActivityLevel}> = [
  { label: "Sedentary (little/no exercise)", value: "sedentary" },
  { label: "Light (1-3 days/week)", value: "light" },
  { label: "Moderate (3-5 days/week)", value: "moderate" },
  { label: "Active (6-7 days/week)", value: "active" },
  { label: "Very Active (hard daily)", value: "very_active" },
];

const MACRO_RATIOS: Record<MacroPreset, { protein: number; carbs: number; fat: number }> = {
  "balanced": { protein: 0.3, carbs: 0.4, fat: 0.3 },
  "high_protein": { protein: 0.4, carbs: 0.35, fat: 0.25 },
  "low_carb": { protein: 0.3, carbs: 0.2, fat: 0.5 },
  "keto": { protein: 0.2, carbs: 0.05, fat: 0.75 },
};

export default function CalculatorsPage() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activity, setActivity] = useState<ActivityLevel>("sedentary");
  const [macroGoal, setMacroGoal] = useState<MacroPreset>("balanced");
  const [bodyFat, setBodyFat] = useState("");
  const [weightLifted, setWeightLifted] = useState("");
  const [reps, setReps] = useState("");
  const [oneRM, setOneRM] = useState<number | null>(null);

  const w = parseFloat(weight) || 0;
  const h = parseFloat(height) || 0;
  const a = parseFloat(age) || 0;
  const bf = parseFloat(bodyFat) || 0;

  const bmiResult = useMemo(() => (w && h) ? calculateBMI(w, h) : null, [w, h]);
  const bmi = bmiResult?.bmi ?? null;
  const bmiCategory = bmiResult?.category ?? null;

  const bmiColor = useMemo(() => {
    if (!bmiCategory) return "";
    if (bmiCategory.includes("underweight")) return "text-blue-400";
    if (bmiCategory === "normal") return "text-green-400";
    if (bmiCategory.includes("overweight")) return "text-amber-400";
    if (bmiCategory.includes("obese")) return "text-red-400";
    return "text-slate-400";
  }, [bmiCategory]);

  const bmiCategoryLabel = useMemo(() => {
    if (!bmiCategory) return "";
    return bmiCategory.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }, [bmiCategory]);

  const bmrResult = useMemo(() => {
    if (!w || !h || !a) return null;
    return calculateBMR(w, h, a, gender);
  }, [w, h, a, gender]);

  const bmr = bmrResult?.bmr ?? null;

  const tdeeResult = useMemo(() => {
    if (!w || !h || !a) return null;
    return calculateTDEE(w, h, a, gender, activity);
  }, [w, h, a, gender, activity]);

  const tdee = tdeeResult?.tdee ?? null;

  const macros = useMemo(() => {
    if (!tdee) return null;
    return calculateMacrosFromCalories(tdee, macroGoal);
  }, [tdee, macroGoal]);

  const calculateOneRepMaxHandler = () => {
    const wLifted = parseFloat(weightLifted);
    const r = parseFloat(reps);
    if (wLifted > 0 && r > 0) {
      const result = calculateOneRepMax(wLifted, r);
      setOneRM(Math.round(result.oneRepMax));
    } else {
      setOneRM(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator className="text-teal-400" />
          Calculators
        </h1>
        <p className="text-slate-400 text-sm">BMI, BMR, macros, and 1RM</p>
      </div>

      <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Scale size={18} />
          BMI Calculator
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Height (cm)</label>
            <input type="number" value={height} onChange={e => setHeight(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Age</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100" />
          </div>
        </div>
        {bmi !== null && (
          <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/20 text-center">
            <div className={`text-3xl font-bold ${bmiColor}`}>{bmi.toFixed(1)}</div>
            <div className="text-slate-300">{bmiCategoryLabel}</div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Flame size={18} />
          Metabolism
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Gender</label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map(g => (
                <button key={g.value} onClick={() => setGender(g.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium ${gender === g.value ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-slate-700/50 text-slate-400 border border-slate-700/30 hover:border-slate-600"}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Activity</label>
            <select value={activity} onChange={e => setActivity(e.target.value as ActivityLevel)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100">
              {ACTIVITY_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>
        {bmr !== null && tdee !== null && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/20">
            <div className="text-center"><div className="text-2xl font-bold">{Math.round(bmr)}</div>
              <div className="text-xs text-slate-400">BMR (cal/day)</div></div>
            <div className="text-center"><div className="text-2xl font-bold">{Math.round(tdee)}</div>
              <div className="text-xs text-slate-400">TDEE (cal/day)</div></div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Dumbbell size={18} />
          Lean Body Mass
        </h3>
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1 block">Body Fat %</label>
          <input type="number" value={bodyFat} onChange={e => setBodyFat(e.target.value)}
            placeholder="e.g., 20" className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100" />
        </div>
        {bf > 0 && w > 0 && (
          <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/20 text-center">
            <div className="text-3xl font-bold text-teal-400">{Math.round(w * (1 - bf / 100))} kg</div>
            <div className="text-slate-300">Estimated Lean Body Mass</div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target size={18} />
          Macro Split
        </h3>
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1 block">Goal</label>
          <select value={macroGoal} onChange={e => setMacroGoal(e.target.value as MacroPreset)}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100">
            <option value="balanced">Balanced</option>
            <option value="high_protein">High Protein</option>
            <option value="low_carb">Low Carb</option>
            <option value="keto">Keto</option>
          </select>
        </div>
        {macros && (
          <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/20">
            <div className="text-sm text-slate-400 mb-2">Daily Targets ({Math.round(macros.calories)} cal)</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-800 rounded-lg"><div className="font-bold text-green-400">{Math.round(macros.protein)}g</div>
                <div className="text-xs text-slate-400">Protein</div></div>
              <div className="p-3 bg-slate-800 rounded-lg"><div className="font-bold text-blue-400">{Math.round(macros.carbs)}g</div>
                <div className="text-xs text-slate-400">Carbs</div></div>
              <div className="p-3 bg-slate-800 rounded-lg"><div className="font-bold text-yellow-400">{Math.round(macros.fat)}g</div>
                <div className="text-xs text-slate-400">Fat</div></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} />
          One Rep Max (1RM)
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><label className="text-xs text-slate-400 mb-1 block">Weight (kg)</label>
            <input type="number" value={weightLifted} onChange={e => setWeightLifted(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100" />
          </div>
          <div><label className="text-xs text-slate-400 mb-1 block">Reps</label>
            <input type="number" value={reps} onChange={e => setReps(e.target.value)}
              min="1" max="20" className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100" />
          </div>
        </div>
        <button onClick={calculateOneRepMaxHandler}
          className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors">
          Calculate 1RM
        </button>
        {oneRM !== null && (
          <div className="mt-4 p-4 bg-slate-900/30 rounded-xl border border-slate-700/20 text-center">
            <div className="text-3xl font-bold text-teal-400">{oneRM} kg</div>
            <div className="text-slate-300">Estimated 1 Rep Max</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
