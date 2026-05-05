// src/components/ReasoningPanel.jsx
// Collapsible Glass Card - Shows AI's chain-of-thought reasoning
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Search,
  BookOpen,
  Pill,
  CheckCircle,
  Stethoscope,
  Microscope,
  Activity,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../services/translation/useTranslation';
import i18n from '../i18n';

const STEP_ICONS = {
  search: Search,
  reference: BookOpen,
  analysis: Pill,
  clinical: Stethoscope,
  lab: Microscope,
  conclusion: CheckCircle
};

const STEP_COLORS = {
  search: 'text-blue-400',
  reference: 'text-purple-400',
  analysis: 'text-amber-400',
  clinical: 'text-emerald-400',
  lab: 'text-cyan-400',
  conclusion: 'text-teal-400'
};

export default function ReasoningPanel({ reasoningSteps, isOpen: initialOpen = false, onToggle }) {
  const { t } = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(initialOpen);

  const handleToggle = () => {
    setInternalIsOpen(!internalIsOpen);
    if (onToggle) onToggle();
  };

  const isOpen = internalIsOpen;

  if (!reasoningSteps || reasoningSteps.length === 0) return null;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: isOpen ? 1 : 0.8 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-700/50">
            <Activity size={18} className="text-teal-400" />
          </div>
           <span className="font-medium text-slate-100">{t('aiReasoning')}</span>
         </div>
         <div className="flex items-center gap-2">
           <span className="text-xs text-slate-400">
             {reasoningSteps.length} {reasoningSteps.length === 1 ? t('step') : t('steps')}
           </span>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      {/* Reasoning Steps */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {reasoningSteps.map((step, index) => {
                const Icon = STEP_ICONS[step.type] || Activity;
                const color = STEP_COLORS[step.type] || 'text-slate-400';

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 50 }}
                    className="flex gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                  >
                    {/* Step Number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-bold text-slate-300">
                      {index + 1}
                    </div>

                    {/* Step Icon & Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} className={color} />
                         <span className="text-base font-medium text-slate-200">
                           {step.title}
                         </span>
                       </div>
                       <p className="text-sm text-slate-400 leading-relaxed">
                        {step.description}
                      </p>
                      {step.sources && step.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {step.sources.map((source, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-700/50 text-slate-300"
                            >
                              📄 {source}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper: Construct reasoning steps from a routeQuery result
export function buildReasoningSteps(queryResult, webContext = null) {
  const steps = [];

  // Step 1: Web search (if available)
  if (webContext?.web?.length || webContext?.pubmed?.length) {
    steps.push({
      type: 'search',
      title: 'Web & Literature Search',
      description: `Searched across Web (${webContext.web?.length || 0} results), PubMed (${webContext.pubmed?.length || 0} articles)${webContext.clinicalTrials ? `, ClinicalTrials.gov (${webContext.clinicalTrials.length} trials)` : ''}`,
      sources: [
        ...(webContext.web?.slice(0, 2).map(r => r.title) || []),
        ...(webContext.pubmed?.slice(0, 1).map(a => a.title) || [])
      ].slice(0, 3)
    });
  }

  // Step 2: Drug safety (if applicable)
  if (webContext?.openFDA?.length) {
    steps.push({
      type: 'analysis',
      title: 'Drug Safety Check',
      description: `Checked OpenFDA adverse events: ${webContext.openFDA.length} record${webContext.openFDA.length !== 1 ? 's' : ''} found`,
      sources: ['OpenFDA API']
    });
  }

  // Step 3: Epidemiology (if applicable)
  if (webContext?.who || webContext?.diseaseSh) {
    steps.push({
      type: 'reference',
      title: 'Epidemiological Context',
      description: 'Retrieved latest WHO health statistics and disease outbreak data',
      sources: ['WHO GHO', 'disease.sh']
    });
  }

  // Step 4: Model used
  steps.push({
    type: 'clinical',
    title: `${queryResult.model === 'gemma4-31b' ? 'Gemma 4 31B' : queryResult.model === 'tinyllama-1.1b' ? 'TinyLlama 1.1B' : queryResult.model} Reasoning`,
    description: queryResult.source === 'online'
      ? 'Online AI generated response with evidence-based reasoning'
      : queryResult.source === 'cached-gemma'
      ? 'Retrieved from cached Gemma response (offline-capable)'
      : 'Offline TinyLlama generated response',
    sources: queryResult.citations?.map(c => c.source) || []
  });

  // Step 5: Final synthesis
  steps.push({
    type: 'conclusion',
    title: 'Response Synthesis',
    description: `Answer synthesized from ${webContext ? 'multiple sources' : 'model knowledge'}. ${queryResult.citations?.length || 0} citation${(queryResult.citations?.length || 0) !== 1 ? 's' : ''} attached.`,
    sources: []
  });

  return steps;
}
