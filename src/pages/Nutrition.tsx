import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import VitaAvatar from '../components/VitaAvatar';
import GlassCard from '../components/GlassCard';
import { Apple, Droplets, Flame, Activity } from 'lucide-react';

const WEEKLY_DATA = [
  { date: '2026-05-01', calories: 2100, protein: 120, carbs: 200, fat: 60 },
  { date: '2026-05-02', calories: 1800, protein: 90, carbs: 180, fat: 50 },
  { date: '2026-05-03', calories: 2400, protein: 140, carbs: 250, fat: 70 },
  { date: '2026-05-04', calories: 1950, protein: 110, carbs: 190, fat: 55 },
  { date: '2026-05-05', calories: 2200, protein: 130, carbs: 210, fat: 65 },
  { date: '2026-05-06', calories: 2050, protein: 115, carbs: 205, fat: 60 },
  { date: '2026-05-07', calories: 1900, protein: 105, carbs: 185, fat: 55 },
];

const MACROS = [
  { name: 'Protein', value: 120, color: '#f43f5e' }, // Rose
  { name: 'Carbs', value: 200, color: '#3b82f6' },   // Blue
  { name: 'Fat', value: 60, color: '#f59e0b' },      // Amber
];

const RECENT_MEALS = [
  { id: 1, name: 'Oatmeal & Berries', type: 'Breakfast', cals: 350, time: '08:00 AM' },
  { id: 2, name: 'Grilled Chicken Salad', type: 'Lunch', cals: 450, time: '01:30 PM' },
  { id: 3, name: 'Greek Yogurt', type: 'Snack', cals: 150, time: '04:00 PM' },
];

export default function Nutrition() {
  const [waterGlasses, setWaterGlasses] = useState(4);
  const goalWater = 8;

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex items-center gap-4 mb-6">
        <VitaAvatar state="health" size={60} />
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Nutrition</h1>
          <p className="text-slate-400 text-sm">Track your daily intake and macros</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center mb-2">
            <Flame className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">1,900</p>
           <p className="text-base text-slate-400">kcal consumed</p>
        </GlassCard>
        
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
            <Droplets className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{waterGlasses} / {goalWater}</p>
           <p className="text-base text-slate-400">glasses of water</p>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
              className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
            >-</button>
            <button 
              onClick={() => setWaterGlasses(Math.min(goalWater, waterGlasses + 1))}
              className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center"
            >+</button>
          </div>
        </GlassCard>
      </div>

      {/* Macro Distribution */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Apple className="w-5 h-5 text-teal-400" />
          <h2 className="font-semibold text-slate-100">Today's Macros</h2>
        </div>
        
        <div className="flex items-center">
          <div className="w-1/2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MACROS}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {MACROS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-3">
            {MACROS.map(macro => (
              <div key={macro.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }}></span>
                  <span className="text-sm text-slate-300">{macro.name}</span>
                </div>
                <span className="text-sm font-semibold text-slate-100">{macro.value}g</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Weekly Chart */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-teal-400" />
          <h2 className="font-semibold text-slate-100">Weekly Calories</h2>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEEKLY_DATA}>
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={12} 
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#1e293b' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} 
              />
              <Bar dataKey="calories" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Recent Meals */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-100">Recent Meals</h2>
           <button className="text-sm text-teal-400 hover:text-teal-300">Add Meal</button>
        </div>
        <div className="space-y-3">
          {RECENT_MEALS.map((meal, index) => (
            <motion.div 
              key={meal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl"
            >
              <div>
                <p className="font-medium text-slate-200">{meal.name}</p>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-sm uppercase tracking-wider text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-full">{meal.type}</span>
                   <span className="text-sm text-slate-500">{meal.time}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-100">{meal.cals}</p>
                 <p className="text-sm text-slate-400">kcal</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}