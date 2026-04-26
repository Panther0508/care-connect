import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getFacilityById } from "../services/aiSearch";
import type { Facility } from "../services/aiSearch";
import { motion, AnimatePresence } from "framer-motion";

export default function FacilityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchFacility = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getFacilityById(id);
        if (data) setFacility(data);
      } catch (err) {
        console.error('Failed to fetch facility:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFacility();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-2 text-slate-400">Loading facility details...</p>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex flex-col min-h-[70vh] items-center justify-center">
        <p className="text-slate-400">Facility not found.</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-4 btn-secondary"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[70vh]">
      <header className="pt-4 pb-6">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="text-2xl font-bold text-slate-100 mb-2 leading-tight"
        >
          {facility.name}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="text-slate-400 mb-6 text-sm"
        >
          {facility.address_city}, {facility.address_stateOrRegion}
        </motion.p>
        
        {/* Facility detail header with trust score and badges */}
        <div className="flex items-center gap-3 mb-4">
          <img src="/assets/nano_banana.png" alt="Nano-Banana" className="w-8 h-8 object-contain" />
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              facility.trust_score >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              facility.trust_score >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              Trust: {facility.trust_score}
            </span>
            {facility.contradictions && facility.contradictions.length > 0 && (
              <span 
                className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30"
                title={Array.isArray(facility.contradictions) 
                  ? facility.contradictions.map(c => typeof c === 'string' ? c : `${c.claim}: missing ${c.missing}`).join('; ')
                  : 'Potential contradictions found'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                ⚠️ Truth Gap
              </span>
            )}
          </div>
          
            {facility.is_medical_desert && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">
                🏜️ Desert Area
              </span>
            )}
        </div>
      </header>

      <section className="flex-1 overflow-y-auto">
        <div className="tab-border border-b border-slate-700/30 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`tab px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "overview" 
                ? "border-b-2 border-primary text-slate-100" 
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("capability")}
            className={`tab px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "capability" 
                ? "border-b-2 border-primary text-slate-100" 
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Capability Audit
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`tab px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "map" 
                ? "border-b-2 border-primary text-slate-100" 
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab("source")}
            className={`tab px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "source" 
                ? "border-b-2 border-primary text-slate-100" 
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Source Report
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-content">
              <div className="space-y-4">
                <div>
                  <h3 className="text-slate-100 font-semibold mb-2">Facility Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-slate-400">Type:</span>
                      <span>{facility.facilityTypeId || 'General Facility'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-slate-400">Address:</span>
                      <span>
                        {facility.address_line1 ? `${facility.address_line1}, ` : ''}{facility.address_city}, {facility.address_stateOrRegion} {facility.address_zipOrPostcode || ''}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-slate-400">Phone:</span>
                      <span>{facility.phone_numbers?.length ? facility.phone_numbers.join(', ') : 'Not available'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-slate-400">Email:</span>
                      <span>{facility.email || 'Not available'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-slate-400">Website:</span>
                      <span>{facility.websites?.length ? facility.websites[0] : 'Not available'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-slate-400">Doctors:</span>
                      <span>{facility.numberDoctors !== undefined && facility.numberDoctors !== null ? facility.numberDoctors : 'Not specified'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-20 text-slate-400">Capacity:</span>
                      <span>{facility.capacity !== undefined && facility.capacity !== null ? facility.capacity : 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-100 font-semibold mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-1">
                    {facility.specialties.map(specialty => (
                      <span
                        key={specialty}
                        className="bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full text-xs font-medium"
                      >
                        {specialty.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-100 font-semibold mb-2">Procedures</h3>
                  <div className="flex flex-wrap gap-1">
                    {facility.procedure.map(proc => (
                      <span
                        key={proc}
                        className="bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full text-xs font-medium"
                      >
                        {proc}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-100 font-semibold mb-2">Equipment</h3>
                  <div className="flex flex-wrap gap-1">
                    {facility.equipment.map(equip => (
                      <span
                        key={equip}
                        className="bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full text-xs font-medium"
                      >
                        {equip}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-100 font-semibold mb-2">Capabilities</h3>
                  <div className="flex flex-wrap gap-1">
                    {facility.capability.map(cap => (
                      <span
                        key={cap}
                        className="bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full text-xs font-medium"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "capability" && (
            <motion.div key="capability" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-content">
              <div className="space-y-4">
                {/* Chain of Thought */}
                <div>
                  <h3 className="text-slate-100 font-semibold mb-2">Agent Reasoning (Chain of Thought)</h3>
                  {facility.agent_reasoning && facility.agent_reasoning.length > 0 ? (
                    <div className="space-y-2">
                      {facility.agent_reasoning.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm">
                          <span className="flex-shrink-0 text-teal-400">{index + 1}.</span>
                          <span className="text-slate-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No detailed reasoning available.</p>
                  )}
                </div>

                {/* Contradictions */}
                {facility.contradictions.length > 0 && (
                  <div>
                    <h3 className="text-slate-100 font-semibold mb-2">Truth Gap Analysis</h3>
                    <p className="text-slate-400 mb-2">
                      Our Validator Agent found inconsistencies in this facility's reported capabilities.
                    </p>
                    <div className="space-y-2">
                      {facility.contradictions.map((contradiction, index) => (
                        <div key={index} className="p-3 bg-slate-800/30 rounded-lg border-l-2 border-l-red-400">
                          <h4 className="text-slate-100 font-medium mb-1">Contradiction #{index + 1}</h4>
                          <p className="text-sm text-slate-300">
                            {typeof contradiction === 'string' ? contradiction : `Claims "${contradiction.claim}" but missing "${contradiction.missing}".`}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-slate-800/30 rounded-lg">
                      <p className="text-sm text-slate-300">
                        <strong>Audit Notes:</strong> Our Validator Agent checked this facility against medical standards. 
                        {facility.contradictions.length} contradictions found. See details above.
                      </p>
                     </div>
                   </div>
                 )}

                {/* Validation Badge Explanation */}
                <div>
                  <h3 className="text-slate-100 font-semibold mb-2">Validation Status</h3>
                  <p className="text-sm text-slate-400">
                    This badge indicates whether the facility has passed our Agentic Validation process, 
                    where our AI cross-references multiple data sources to verify claims.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "map" && (
            <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-content">
              <div class="aspect-w-16 aspect-h-9">
                <div className="bg-slate-800/30 rounded-lg overflow-hidden">
                  {/* Static map placeholder - in real implementation would use a map component */}
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    Map showing facility location at {facility.latitude}, {facility.longitude}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-400">
                  This facility is located in {facility.address_city}, {facility.address_stateOrRegion}.
                  {facility.is_medical_desert && (
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      🏜️ Located in identified medical desert area
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "source" && (
            <motion.div key="source" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tab-content">
              <div className="space-y-4">
                {/* Source Report Insights */}
                <div>
                  <h3 className="text-slate-100 font-semibold mb-2">Source Report Insights</h3>
                  <p className="text-sm text-slate-400 mb-2">
                    This section shows the raw facility description with AI-extracted insights highlighted.
                  </p>
                  
                  {/* Original snippet with highlighted phrases */}
                  <div className="p-4 bg-slate-800/30 rounded-lg border-l-2 border-l-teal-400">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {facility.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-xs">
                      <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                        Extracted by Databricks Mosaic AI
                      </span>
                      {/* Simulate highlighted phrases with pulsing underline */}
                      <div className="relative inline-block">
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 bg-amber-400/50 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Citation */}
                {facility.citation && (
                  <div>
                    <h3 className="text-slate-100 font-semibold mb-2">AI Citation</h3>
                    <div className="p-4 bg-slate-800/30 rounded-lg border-l-2 border-l-amber-400">
                      <blockquote className="text-sm text-slate-300 italic">
                        "{facility.citation}"
                      </blockquote>
                    </div>
                  </div>
                )}

                {/* Full Raw Description */}
                <div>
                  <h3 className="text-slate-100 font-semibold mb-2">Full Facility Description</h3>
                  <div className="p-4 bg-slate-800/20 rounded-lg">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">
                      {facility.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Action Button */}
      <div className="p-4 border-t border-slate-700/30">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => window.history.back()}
          className="w-full btn-primary py-3 px-6 text-lg flex justify-center items-center gap-2"
        >
          Back to Search
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
            <path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>
          </svg>
        </motion.button>
      </div>
    </div>
  );
}