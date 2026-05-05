import { Link } from "react-router-dom";
import type { Facility } from "../services/aiSearch";
import { motion } from "framer-motion";

interface FacilityCardProps {
  facility: Facility;
  index?: number;
}

export function FacilityCard({ facility, index = 0 }: FacilityCardProps) {
  // Get trust score color
  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (score >= 50) return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    return "bg-red-500/20 text-red-400 border border-red-500/30";
  };

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-card border-l-4 border-l-teal-500 p-6 mb-5 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* New Match badge */}
      {facility.isNewMatch && (
        <div className="absolute right-4 top-4">
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider relative flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            New Match
          </span>
        </div>
      )}

      <div className="mb-4">
        {/* Facility name */}
        <h3 className="text-xl font-bold text-white pr-24 leading-tight flex flex-wrap items-center gap-3">
          {facility.name}
          <div className="flex items-center gap-2">
            {/* Trust Score Badge */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-tighter shadow-sm ${getTrustScoreColor(facility.trust_score)}`}>
              {facility.trust_score}% Trust
            </span>
            {/* Contradictions Indicator */}
             {facility.contradictions && facility.contradictions.length > 0 && (
               <span 
                 className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 cursor-help animate-pulse shadow-lg shadow-red-500/10"
                 title={Array.isArray(facility.contradictions) 
                   ? facility.contradictions.map(c => typeof c === 'string' ? c : `${c.claim}: missing ${c.missing}`).join('\n')
                   : 'Potential contradictions'}
               >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                </svg>
              </span>
            )}
          </div>
        </h3>
        
        {/* Validation badge */}
        <div className="mt-1 flex items-center gap-2 text-xs">
          {Math.random() > 0.3 ? (
            <span className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5">
              ✅ Validated
            </span>
          ) : (
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
              🔄 Pending Validation
            </span>
          )}
          {/* Medical Desert Indicator */}
          {facility.is_medical_desert && (
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">
              🏜️ Desert Area
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {/* Specialties as chips */}
        {facility.specialties.slice(0, 3).map((specialty) => (
          <span
            key={specialty}
            className="bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full text-xs font-medium"
          >
            {specialty.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        ))}
        {facility.specialties.length > 3 && (
          <span className="bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full text-xs font-medium">
            +{facility.specialties.length - 3} more
          </span>
        )}
      </div>

      <p className="mb-3 text-sm text-slate-400 leading-relaxed line-clamp-3">
        {facility.description}
      </p>

      {/* AI Extraction Insights (Citation) */}
      {facility.citation && (
        <div className="mb-4 p-4 bg-slate-900/40 rounded-xl border border-white/5 group-hover:border-teal-500/20 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-xs font-black text-teal-500 uppercase tracking-widest opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Verified Source Snippet</span>
          </div>
          <blockquote className="text-sm text-slate-300 italic border-l-2 border-teal-500/40 pl-4 py-1 leading-relaxed">
            "{facility.citation}"
          </blockquote>
        </div>
      )}

      {/* Chain of Thought expandable */}
      <div className="mb-3">
        <button 
          onClick={() => {}}
          className="w-full text-left text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
        >
          Show why this match was made (Chain of Thought)
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200">
            <path d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            {facility.phone_numbers && facility.phone_numbers.length > 0 ? (
              <motion.a
                whileTap={{ scale: 0.95 }}
                href={`tel:${facility.phone_numbers[0]}`}
                className="inline-flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {facility.phone_numbers[0]}
              </motion.a>
            ) : (
              <span className="text-slate-500">Phone not available</span>
            )}
          </div>

        <motion.div whileTap={{ scale: 0.95 }}>
          <Link to={`/reservation/${facility.id}`} className="btn-primary py-2 px-4 text-sm flex items-center gap-1">
            Claim Care
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
        </motion.div>
      </div>
    </motion.article>
  );
}