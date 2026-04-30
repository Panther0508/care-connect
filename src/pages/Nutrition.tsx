// src/pages/Nutrition.tsx
// Daily nutrition tracking with food database, meal sections, and charts

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, X, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { addFoodLog, getFoodLogsForRange, getFoodLogsForDate } from '../lib/idb';
import { searchFoods, FoodItem } from '../services/foodDatabase';
import { useStatus } from '../hooks/useStatus';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function NutritionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [dayLogs, setDayLogs] = useState<any[]>([]);
  const [weekLogs, setWeekLogs] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<typeof MEALS[number]>('breakfast');
  const { showStatus } = useStatus();

  // Load data for date
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const logs = await getFoodLogsForDate(user.id, selectedDate);
      setDayLogs(logs);
    };
    load();
  }, [user, selectedDate]);

  // Load week data for chart
  useEffect(() => {
    const loadWeek = async () => {
      if (!user) return;
      const end = selectedDate;
      const start = new Date(new Date(selectedDate).getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const logs = await getFoodLogsForRange(user.id, start, end);
      setWeekLogs(logs);
    };
    loadWeek();
  }, [user, selectedDate]);

  // Search food
  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(async () => {
        const results = await searchFoods(query);
        setSearchResults(results);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const addFood = (food: FoodItem) => {
    const grams = 100; // default serving
    const factor = grams / 100;
    const log = {
      userId: user!.id,
      date: selectedDate,
      meal: selectedMeal,
      foodId: food.id,
      foodName: food.name,
      servingSize: grams,
      calories: Math.round(food.caloriesPer100g * factor),
      protein: parseFloat((food.proteinPer100g * factor).toFixed(1)),
      carbs: parseFloat((food.carbsPer100g * factor).toFixed(1)),
      fat: parseFloat((food.fatPer100g * factor).toFixed(1)),
      fiber: food.fiberPer100g ? parseFloat((food.fiberPer100g * factor).toFixed(1)) : 0,
      timestamp: Date.now(),
    };
    addFoodLog(log).then(() => {
      setQuery('');
      setShowSearch(false);
      // Refresh day logs
      getFoodLogsForDate(user!.id, selectedDate).then(setDayLogs);
      showStatus('success', 'Food Added', `${food.name} added to ${selectedMeal}`);
    });
  };

  const removeMealItem = async (log: any) => {
    showStatus('info', 'Not Implemented', 'Deleting food items will be available soon.');
  };

  // Totals per meal
  const mealTotals = useMemo(() => {
    const map: Record<string, any> = { breakfast: {}, lunch: {}, dinner: {}, snack: {} };
    dayLogs.forEach(log => {
      const m = map[log.meal] || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      m.calories += log.calories;
      m.protein += log.protein;
      m.carbs += log.carbs;
      m.fat += log.fat;
      m.fiber += log.fiber;
      map[log.meal] = m;
    });
    return map;
  }, [dayLogs]);

  const dailyTotals = useMemo(() => {
    return {
      calories: Object.values(mealTotals).reduce((sum: number, m: any) => sum + (m.calories || 0), 0),
      protein: Object.values(mealTotals).reduce((sum: number, m: any) => sum + (m.protein || 0), 0),
      carbs: Object.values(mealTotals).reduce((sum: number, m: any) => sum + (m.carbs || 0), 0),
      fat: Object.values(mealTotals).reduce((sum: number, m: any) => sum + (m.fat || 0), 0),
      fiber: Object.values(mealTotals).reduce((sum: number, m: any) => sum + (m.fiber || 0), 0),
    };
  }, [mealTotals]);

  // Weekly chart data
  const weeklyChartData = useMemo(() => {
    const weekMap: Record<string, { date: string; calories: number }> = {};
    weekLogs.forEach(log => {
      if (!weekMap[log.date]) {
        weekMap[log.date] = { date: log.date, calories: 0 };
      }
      weekMap[log.date].calories += log.calories;
    });
    return Object.values(weekMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [weekLogs]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Nutrition Tracker</h1>
        <p className="text-slate-400">Track your daily food intake</p>
      </div>

      {/* Date selector */}
      <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-teal-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-slate-900/50 border border-slate-700/30 rounded-lg px-3 py-2 text-sm text-slate-100"
          />
        </div>
      </div>

      {/* Meal tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-700/50">
        {MEALS.map(meal => (
          <button
            key={meal}
            onClick={() => setSelectedMeal(meal)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedMeal === meal
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600'
            }`}
          >
            {meal.charAt(0).toUpperCase() + meal.slice(1)}
          </button>
        ))}
      </div>

      {/* Add food */}
      <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search foods..."
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100"
          />
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium"
          >
            <Plus size={18} />
          </button>
        </div>

        {showSearch && query.length >= 2 && (
          <div className="max-h-48 overflow-y-auto border border-slate-700/50 rounded-lg bg-slate-900/50">
            {searchResults.length === 0 ? (
              <p className="p-3 text-slate-400 text-sm">No foods found</p>
            ) : (
              searchResults.map(food => (
                <button
                  key={food.id}
                  onClick={() => addFood(food)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-700/50 text-sm text-slate-200"
                >
                  {food.name} - {food.caloriesPer100g} cal/100g
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Today's meals */}
      <div className="space-y-3">
        {MEALS.map(meal => {
          const logs = dayLogs.filter(l => l.meal === meal);
          const totals = mealTotals[meal] || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
          return (
            <div key={meal} className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white capitalize">{meal}</h3>
                <span className="text-sm text-slate-400">{totals.calories} cal</span>
              </div>
              {logs.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No foods added</p>
              ) : (
                <div className="space-y-2">
                  {logs.map(log => (
                    <div key={log.id || log.timestamp} className="flex items-center justify-between text-sm bg-slate-900/30 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-slate-200">{log.foodName}</span>
                        <span className="text-slate-500 ml-2">{log.servingSize}g</span>
                      </div>
                      <span className="text-slate-400">{log.calories} cal</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Daily summary */}
      <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
        <h3 className="font-medium text-white mb-3">Daily Summary</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="bg-slate-900/50 rounded-lg p-2">
            <div className="text-lg font-bold text-teal-400">{Math.round(dailyTotals.calories)}</div>
            <div className="text-xs text-slate-400">Calories</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <div className="text-lg font-bold text-blue-400">{Math.round(dailyTotals.protein)}g</div>
            <div className="text-xs text-slate-400">Protein</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <div className="text-lg font-bold text-amber-400">{Math.round(dailyTotals.carbs)}g</div>
            <div className="text-xs text-slate-400">Carbs</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <div className="text-lg font-bold text-yellow-400">{Math.round(dailyTotals.fat)}g</div>
            <div className="text-xs text-slate-400">Fat</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <div className="text-lg font-bold text-green-400">{Math.round(dailyTotals.fiber)}g</div>
            <div className="text-xs text-slate-400">Fiber</div>
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      {weeklyChartData.length > 0 && (
        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
          <h3 className="font-medium text-white mb-3">Weekly Calories</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '0.5rem' }} />
                <Bar dataKey="calories" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}
