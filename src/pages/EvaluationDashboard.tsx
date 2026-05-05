import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ClipboardList, BarChart3, Calendar, Send, Star, TrendingUp } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { Progress } from '../components/ui/progress';
import { storeEvaluation, getAllEvaluations, getEvaluationsForUser, Evaluation } from '../lib/idb';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function EvaluationDashboard() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    evaluatorId: 'admin',
    evaluatorName: 'Administrator',
    ratings: {
      communication: 3,
      clinicalSkills: 3,
      professionalism: 3,
      efficiency: 3,
    },
    comments: '',
    goals: '',
  });

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const allEvals = await getAllEvaluations();
      setEvaluations(allEvals);
    } catch (error) {
      console.error('Failed to load evaluations:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.userId || !formData.userName) return;

    const overallScore = Math.round(
      (formData.ratings.communication + formData.ratings.clinicalSkills +
       formData.ratings.professionalism + formData.ratings.efficiency) / 4
    );

    try {
      await storeEvaluation({
        ...formData,
        date: Date.now(),
        overallScore,
      });
      loadEvaluations();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save evaluation:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      userName: '',
      evaluatorId: 'admin',
      evaluatorName: 'Administrator',
      ratings: {
        communication: 3,
        clinicalSkills: 3,
        professionalism: 3,
        efficiency: 3,
      },
      comments: '',
      goals: '',
    });
  };

  const chartData = evaluations.slice(0, 10).reverse().map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: e.overallScore,
  }));

  const averageScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Evaluation Dashboard</h1>
          <p className="text-slate-400 text-sm">Performance reviews and feedback</p>
        </div>
        <ClipboardList size={32} className="text-teal-400" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-500/15 text-teal-300">
              <ClipboardList size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{evaluations.length}</div>
              <div className="text-xs text-slate-400">Total Evaluations</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-300">
              <Star size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{averageScore}/5</div>
              <div className="text-xs text-slate-400">Average Score</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-300">
              <Calendar size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {evaluations.length > 0 ? new Date(evaluations[0].date).toLocaleDateString() : '-'}
              </div>
              <div className="text-xs text-slate-400">Latest Evaluation</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Chart */}
      {evaluations.length > 1 && (
        <GlassCard className="p-4">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-teal-400" />
            Performance Trend
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis domain={[1, 5]} stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  dot={{ fill: '#2dd4bf', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* New Evaluation Button */}
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-medium transition-colors"
      >
        <Send size={16} />
        New Evaluation
      </button>

      {/* Evaluation Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">New Performance Evaluation</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="User ID"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
                <input
                  type="text"
                  placeholder="User Name"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="space-y-3">
                {Object.entries(formData.ratings).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-slate-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <span className="text-xs text-slate-400">{value}/5</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={value}
                      onChange={(e) => setFormData({
                        ...formData,
                        ratings: { ...formData.ratings, [key]: parseInt(e.target.value) }
                      })}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <textarea
                placeholder="Comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 h-20 resize-none"
              />

              <textarea
                placeholder="Goals for next period"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 h-20 resize-none"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium"
                >
                  Submit
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Past Evaluations */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar size={18} className="text-teal-400" />
          Past Evaluations
        </h3>
        {evaluations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No evaluations recorded yet</div>
        ) : (
          <div className="space-y-3">
            {evaluations.slice(0, 10).map((evalItem) => (
              <motion.div
                key={evalItem.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card bg-slate-800/40 rounded-xl p-4 border border-slate-700/40"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-white">{evalItem.userName}</div>
                    <div className="text-xs text-slate-400">
                      Evaluated on {new Date(evalItem.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-teal-400">{evalItem.overallScore}/5</div>
                    <Progress value={evalItem.overallScore * 20} className="w-20 h-1.5 mt-1" />
                  </div>
                </div>
                {evalItem.comments && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{evalItem.comments}</p>
                )}
                {evalItem.goals && (
                  <div className="mt-2 text-xs">
                    <span className="text-slate-500">Goals: </span>
                    <span className="text-slate-300">{evalItem.goals}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}