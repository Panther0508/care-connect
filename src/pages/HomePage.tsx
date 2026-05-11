import { useState, useEffect } from "react";
import { FacilityCard } from "../components/FacilityCard";
import { searchCare, type Facility } from "../services/aiSearch";
import { useIDB } from "../hooks/useIDB";
import { getAllFacilities } from "../lib/idb";
import { motion, AnimatePresence } from "framer-motion";
import VitaAvatar from "../components/VitaAvatar";
import { useStatus } from "../hooks/useStatus";
import { getOutbreakAlerts, isDemoModeEnabled } from "../services/meshOutbreakDetector";
import MagnifyingLoader from "../components/MagnifyingLoader";

const PLACEHOLDERS = [
  "Pediatric malaria care near Kano...",
  "Emergency surgery within 10km...",
  "Speech therapy for children..."
];

const QUICK_NEEDS = ["Emergency birth", "Child convulsions", "Malaria crisis"];

export default function HomePage() {
  const { showStatus } = useStatus();
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Facility[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(false);
  const [outbreakAlerts, setOutbreakAlerts] = useState<any[]>([]);
  const [advancedQuery, setAdvancedQuery] = useState({
    condition: "",
    location: "",
    specialRequirements: "",
    ruralOnly: false,
    publicFacility: false,
    availability247: false
  });
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

   // Load outbreak alerts for display
   useEffect(() => {
     const loadAlerts = async () => {
       try {
         const alerts = await getOutbreakAlerts();
         setOutbreakAlerts(alerts.filter((a: any) => a.status === 'active'));
       } catch (e) { console.error('Failed to load outbreak alerts:', e); }
     };
     loadAlerts();
     const interval = setInterval(loadAlerts, 30000);
     return () => clearInterval(interval);
   }, []);

   // Check demo mode flag
   useEffect(() => {
     const checkDemo = async () => {
       const demo = await isDemoModeEnabled();
       setIsSimulating(demo);
     };
     checkDemo();
   }, []);

   // Real-time outbreak alert listener
   useEffect(() => {
     const handleOutbreakAlert = (event: Event) => {
       const detail = (event as any).detail;
       if (detail) {
         setOutbreakAlerts(prev => [detail, ...prev]);
       }
     };
     window.addEventListener('outbreakAlert', handleOutbreakAlert);
     return () => window.removeEventListener('outbreakAlert', handleOutbreakAlert);
   }, []);

  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setQuery(q);

    try {
      const res = await searchCare(q);
      setResults(res);
      if (res.length === 0) {
        showStatus('error', 'No Results', 'Try different wording or register a need so we can watch 24/7.');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      showStatus('error', 'Search Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdvancedSearch = async () => {
    setIsSearching(true);
    try {
      const { condition, location, specialRequirements, ruralOnly, publicFacility, availability247 } = advancedQuery;

      // Get all facilities from IDB
      const allFacilities = await getAllFacilities();

      // Filter based on criteria
      let filteredResults = allFacilities;

      if (condition) {
        filteredResults = filteredResults.filter(f =>
          f.description.toLowerCase().includes(condition.toLowerCase()) ||
          f.procedure.some(p => p.toLowerCase().includes(condition.toLowerCase()))
        );
      }

      if (location) {
        filteredResults = filteredResults.filter(f =>
          f.address_city.toLowerCase().includes(location.toLowerCase()) ||
          f.address_stateOrRegion.toLowerCase().includes(location.toLowerCase())
        );
      }

      if (specialRequirements) {
        filteredResults = filteredResults.filter(f =>
          f.description.toLowerCase().includes(specialRequirements.toLowerCase()) ||
          f.capability.some(c => c.toLowerCase().includes(specialRequirements.toLowerCase())) ||
          f.equipment.some(e => e.toLowerCase().includes(specialRequirements.toLowerCase()))
        );
      }

      setResults(filteredResults);
      setIsSearching(false);
      setAdvancedPanelOpen(false);
    } catch (err) {
      console.error('Advanced search failed:', err);
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <header className="pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="flex-1">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-extrabold mb-4 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-br from-white via-teal-300 to-teal-500 pb-2 tracking-tight"
            >
              Guardian of Care, <br /> 
              <span className="text-teal-400 text-glow">Anywhere.</span>
            </motion.h1>
               <motion.p 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                 className="text-slate-400 text-base md:text-lg max-w-md"
               >
                 VitaChain provides instant AI-powered facility discovery — fully offline and 100% private.
               </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring" }}
            className="hidden md:block w-48 h-48 relative"
          >
            <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full animate-pulse" />
            <VitaAvatar state="health" size={192} className="relative z-10" />
          </motion.div>
        </div>

        {/* Medical Desert Alerts Section (Requirement 7.1) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="cursor-pointer hover:bg-slate-700/30 rounded-lg p-4 flex items-center gap-3 transition-colors"
          onClick={() => {/* Would navigate to crisis map */}}
        >
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <path d="M4 4v16h16V4"/>
              <path d="M8 13h8"/>
              <path d="M12 8v5"/>
            </svg>
          </div>
          <div>
            <h4 className="text-slate-100 font-semibold mb-1">Our AI has identified high-risk regional gaps</h4>
            <p className="text-sm text-slate-400">Tap to view the Crisis Map showing medical deserts</p>
          </div>
        </motion.div>

         {/* Outbreak Alerts (Requirement 7.5) */}
         {outbreakAlerts.length > 0 && (
           <div data-outbreak-alert className="glass-card p-4 border-l-4 border-rose-500 bg-rose-500/10">
             <div className="flex items-center gap-2 text-rose-300 font-semibold mb-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M4 4v16h16V4"/>
                 <path d="M8 13h8"/>
                 <path d="M12 8v5"/>
               </svg>
               Active Health Alerts
               {isSimulating && (
                 <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                   Simulated
                 </span>
               )}
             </div>
            <div className="space-y-1">
              {outbreakAlerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="text-sm text-slate-200">
                  <span className="capitalize">{alert.term}</span> — {alert.count} cases in {alert.region}
                </div>
              ))}
            </div>
          </div>
        )}

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur animate-pulse" />
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 rounded-2xl blur-md opacity-50 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative glass-card flex items-center gap-3 p-2 shadow-glow z-10 bg-slate-900/60 border-white/10 focus-within:border-teal-500/50 transition-colors">
            <div className="pl-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            
            <div className="flex-1 relative h-10 flex items-center">
              <AnimatePresence mode="wait">
                {!query && (
                  <motion.span 
                    key={placeholderIdx}
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute text-slate-500 pointer-events-none text-sm font-medium"
                  >
                    {PLACEHOLDERS[placeholderIdx]}
                  </motion.span>
                )}
              </AnimatePresence>
              <input
                type="text"
                className="bg-transparent text-slate-100 outline-none w-full relative z-10 text-sm font-medium placeholder:text-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search for a condition, treatment, or specialist..."
              />
            </div>
            
            <div className="flex items-center gap-2 pr-2">
              {/* Advanced Search Toggle Icon */}
              <button 
                onClick={() => setAdvancedPanelOpen(!advancedPanelOpen)}
                className={`p-2 rounded-lg transition-colors ${advancedPanelOpen ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="Advanced Reasoning"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>
                </svg>
              </button>

               <AnimatePresence mode="wait">
                 {isSearching ? (
                   <div className="w-10 h-10 flex items-center justify-center">
                     <MagnifyingLoader size={20} />
                   </div>
                 ) : (
                   <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSearch()} 
                    className="btn-primary"
                  >
                    Search
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Advanced Reasoning Panel (Requirement 2.1) */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: advancedPanelOpen ? 1 : 0, y: advancedPanelOpen ? 0 : -10 }} 
          transition={{ opacity: { duration: 0.3 }, y: { duration: 0.3 }}}
          className={advancedPanelOpen ? "glass-card p-4 mb-4" : "hidden"}
        >
          <h3 className="text-slate-100 font-semibold mb-3 flex items-center gap-2">
            <img src="/assets/nano_banana.jpg" alt="Nano-Banana" className="w-6 h-6 object-contain" />
            Advanced Reasoning Panel
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Build complex queries to find facilities with specific capabilities
          </p>
          
          <div className="space-y-3">
            {/* Condition/Procedure Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Condition/Procedure</label>
              <input
                type="text"
                value={advancedQuery.condition}
                onChange={(e) => setAdvancedQuery(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 outline-none focus:border-teal-400"
                placeholder="e.g., appendectomy"
              />
            </div>
            
            {/* Location Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={advancedQuery.location}
                onChange={(e) => setAdvancedQuery(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 outline-none focus:border-teal-400"
                placeholder="e.g., Bihar or Patna"
              />
            </div>
            
            {/* Special Requirements Textarea */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Special Requirements</label>
              <textarea
                value={advancedQuery.specialRequirements}
                onChange={(e) => setAdvancedQuery(prev => ({ ...prev, specialRequirements: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 outline-none focus:border-teal-400 h-12 resize-none"
                placeholder="e.g., part-time doctors, ICU with ventilator"
              />
            </div>
            
            {/* Optional Toggles */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={advancedQuery.ruralOnly}
                  onChange={(e) => setAdvancedQuery(prev => ({ ...prev, ruralOnly: e.target.checked }))}
                  className="h-4 w-4 text-teal-600 bg-slate-700 border-slate-600 rounded focus:ring-teal-500"
                />
                <label className="text-sm text-slate-300 cursor-pointer">Rural only</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={advancedQuery.publicFacility}
                  onChange={(e) => setAdvancedQuery(prev => ({ ...prev, publicFacility: e.target.checked }))}
                  className="h-4 w-4 text-teal-600 bg-slate-700 border-slate-600 rounded focus:ring-teal-500"
                />
                <label className="text-sm text-slate-300 cursor-pointer">Public facility</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={advancedQuery.availability247}
                  onChange={(e) => setAdvancedQuery(prev => ({ ...prev, availability247: e.target.checked }))}
                  className="h-4 w-4 text-teal-600 bg-slate-700 border-slate-600 rounded focus:ring-teal-500"
                />
                <label className="text-sm text-slate-300 cursor-pointer">24/7 availability</label>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleAdvancedSearch}
              className="w-full btn-primary py-2 px-4 text-sm flex justify-center items-center gap-2"
            >
              Reason
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </motion.button>
          </div>
         </motion.div>
       </header>

     {/* Quick needs section */}
     <motion.div 
       initial={{ opacity: 0 }} 
       animate={{ opacity: 1 }} 
       transition={{ delay: 0.5 }}
       className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
     >
       <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Quick needs:</span>
       {QUICK_NEEDS.map(need => (
         <button 
           key={need} 
           onClick={() => handleSearch(need)}
           className="bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-slate-300 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors"
         >
           {need}
         </button>
       ))}
     </motion.div>

     <section className="mt-2 min-h-[300px]">
      <AnimatePresence mode="wait">
        {!hasSearched && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 text-slate-500 flex flex-col items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 opacity-50">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            Enter a care need and tap Search.
          </motion.div>
        )}

        {hasSearched && isSearching && (
          <motion.div key="skeletons" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-5 border-l-2 border-slate-700 animate-pulse">
                <div className="h-5 bg-slate-700/50 rounded w-2/3 mb-4" />
                <div className="h-4 bg-slate-700/30 rounded w-1/3 mb-3" />
                <div className="flex gap-2 mb-4">
                  <div className="h-5 w-16 bg-slate-700/20 rounded-full" />
                  <div className="h-5 w-20 bg-slate-700/20 rounded-full" />
                </div>
                <div className="h-3 bg-slate-800 rounded w-full mb-2" />
                <div className="h-3 bg-slate-800 rounded w-4/5" />
              </div>
            ))}
          </motion.div>
        )}

        {hasSearched && !isSearching && results.length === 0 && (
          <motion.div key="no-results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 flex flex-col items-center gap-4">
            <div className="w-32 h-32 bg-slate-800/50 rounded-full flex items-center justify-center mb-2 shadow-inner border border-white/5">
              <VitaAvatar state="empty" size={96} />
            </div>
            <p className="text-slate-300 max-w-xs leading-relaxed font-medium">
              We couldn't find a match yet. Try different wording, or register a need so we can watch 24/7.
            </p>
          </motion.div>
        )}

        {hasSearched && !isSearching && results.length > 0 && (
          <motion.div key="results" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="flex flex-col gap-2">
            <h2 className="text-slate-300 font-semibold mb-2">Available Care</h2>
            {results.map((facility, index) => (
              <FacilityCard key={facility.id} facility={facility} index={index} />
            ))}
            
            {!navigator.onLine && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center justify-center gap-1.5 text-xs text-amber-400/80 bg-amber-500/10 py-2 rounded-lg border border-amber-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Searched offline — your privacy is protected.
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  </div>
);
}