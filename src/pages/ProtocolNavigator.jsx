// src/pages/ProtocolNavigator.jsx
// WHO IMCI/ANC protocol reference for CHWs
import { motion } from 'framer-motion';
import { BookOpen, Search, ChevronRight } from 'lucide-react';

export default function ProtocolNavigator() {
  const protocols = [
    { id: 'imci', name: 'IMCI - Integrated Management of Childhood Illness', age: '2 months - 5 years' },
    { id: 'anc', name: 'ANC - Antenatal Care', age: 'Pregnant women' },
    { id: 'nut', name: 'Nutrition - SAM/MAM Management', age: 'All ages' },
    { id: 'wfi', name: 'WFP -通则', age: 'General' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <BookOpen size={28} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Protocol Navigator</h1>
            <p className="text-slate-400 text-sm">WHO IMCI, ANC, and clinical guidelines</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search protocols..."
              className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {protocols.map(p => (
              <div key={p.id} className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:border-teal-500/30 transition-colors cursor-pointer flex items-center justify-between group">
                <div>
                  <h3 className="font-medium text-slate-100">{p.name}</h3>
                  <p className="text-sm text-slate-400">{p.age}</p>
                </div>
                <ChevronRight className="text-slate-500 group-hover:text-teal-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
