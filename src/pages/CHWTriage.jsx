// src/pages/CHWTriage.jsx
// Community Health Worker triage assistant
import { motion } from 'framer-motion';
import { Stethoscope, AlertTriangle, MessageSquare, MapPin, Send, Loader } from 'lucide-react';
import { useState } from 'react';
import { useStatus } from '../hooks/useStatus';
import { routeQuery } from '../services/aiCoreRouter';
import VitaAvatar from '../components/VitaAvatar';

export default function CHWTriage() {
  const { showStatus } = useStatus();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleAnalyze = async () => {
    if (!age || !gender || !symptoms) {
      showStatus('error', 'Missing Fields', 'Please fill in all fields before analyzing.');
      return;
    }

    setLoading(true);
    try {
      const prompt = `You are a medical triage assistant. A Community Health Worker is seeing a ${age}-year-old ${gender} patient with the following symptoms: ${symptoms}.

Provide your response in this exact 4-section format:

=== What Might Be Happening ===
List the most likely differential diagnoses based on the presented symptoms. Be concise.

=== What You Can Do ===
Provide initial management steps the CHW can take immediately (supportive care, monitoring, etc.).

=== Danger Signs ===
List critical red flags that would indicate the need for immediate referral to a healthcare facility.

=== Reminder ===
End with one important clinical reminder relevant to this case, including any local emergency numbers (988 for US, 116 123 for Europe, 91-9820-466726 for India).`;

      const result = await routeQuery(prompt, 'chw-triage');
      
      if (result?.text) {
        setResponse(result.text);
        showStatus('success', 'Analysis Complete', 'AI triage assessment generated.');
      } else {
        showStatus('error', 'No Response', 'The AI did not generate a response.');
      }
    } catch (err) {
      console.error('Triage analysis failed:', err);
      showStatus('error', 'Analysis Failed', err?.message || 'Could not complete triage.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-4 pb-24"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Stethoscope size={28} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CHW Triage</h1>
            <p className="text-slate-400 text-sm">AI-powered patient triage for community health workers</p>
          </div>
        </div>

        {!response ? (
          <div className="glass-card p-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <AlertTriangle className="text-amber-400 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-medium text-slate-100 mb-1">Danger Sign Detection</h3>
                  <p className="text-sm text-slate-400">AI will analyze symptoms and flag emergency indicators</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Patient Age</label>
                  <input 
                    type="number" 
                    placeholder="Age in years" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Presenting Symptoms</label>
                  <textarea 
                    rows={4} 
                    placeholder="Describe symptoms, duration, severity..." 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleAnalyze}
                  disabled={loading || !age || !gender || !symptoms}
                  className="glass-card px-6 py-2.5 text-slate-200 rounded-xl text-sm font-medium transition-all hover:border-teal-400/30 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Analyze with Vita
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 space-y-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <VitaAvatar state="success" size={56} />
                <div>
                  <h2 className="text-xl font-semibold text-teal-300">Triage Assessment</h2>
                  <p className="text-slate-400 text-sm">For {age} year old {gender}</p>
                </div>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30 whitespace-pre-wrap text-slate-200 text-sm leading-relaxed max-h-96 overflow-y-auto">
                {response}
              </div>
            </motion.div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResponse(null);
                  setAge('');
                  setGender('');
                  setSymptoms('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                New Assessment
              </button>
              <button
                onClick={() => showStatus('info', 'Saved', 'Assessment saved to patient record.')}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors"
              >
                Save Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
