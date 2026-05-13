import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Image, FileText, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { classifyFromFile } from "../services/imageClassifier";
import { useStatus } from "../hooks/useStatus";
import LoadingSpinner from "../components/LoadingSpinner";

interface AnalysisResult {
  success: boolean;
  results: Array<{ rank: number; label: string; score: number; confidence: number }>;
  topResult: { label: string; score: number };
  timestamp: string;
  requiresFollowUp: boolean;
}

export default function LabReport() {
  const { showStatus } = useStatus();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showStatus("error", "Invalid File", "Please select an image file.");
      return;
    }
    setSelectedFile(file);
    setError(null);
    setResult(null);
    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!selectedFile) return;
    setAnalyzing(true);
    setError(null);
    try {
      const analysis = await classifyFromFile(selectedFile);
      setResult(analysis as AnalysisResult);
      showStatus("success", "Analysis Complete", "Image has been analyzed.");
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "Analysis failed. Please try again.");
      showStatus("error", "Analysis Failed", err.message || "Could not analyze image.");
    } finally {
      setAnalyzing(false);
    }
  }

  function clearAll() {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Lab Report Scanner</h1>
        <p className="text-slate-400">Upload a lab report or medical image for AI analysis</p>
      </div>

      {/* Upload area */}
      <div className="glass-card p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="lab-upload"
        />
        <label
          htmlFor="lab-upload"
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/5 transition-all"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-contain" />
          ) : (
            <>
              <Upload className="text-slate-400 mb-2" size={32} />
              <p className="text-sm text-slate-300">Click to upload an image</p>
              <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP</p>
            </>
          )}
        </label>

        {selectedFile && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image className="text-teal-400" size={20} />
              <span className="text-sm text-slate-200 truncate max-w-[200px]">{selectedFile.name}</span>
            </div>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Analyze button */}
      {selectedFile && !analyzing && !result && (
        <button
          onClick={handleAnalyze}
          className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <FileText size={18} />
          Analyze Image
        </button>
      )}

      {/* Loading */}
      {analyzing && (
        <div className="flex flex-col items-center gap-4 py-8">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Analyzing image with AI...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex items-start gap-3 text-rose-300"
        >
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="text-emerald-400" size={24} />
              <h2 className="text-lg font-semibold text-white">Analysis Results</h2>
            </div>

            {/* Top result highlight */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 mb-4">
              <p className="text-xs text-slate-400 mb-1">Top Prediction</p>
              <p className="text-xl font-bold text-white capitalize">{result.topResult.label}</p>
              <p className="text-sm text-teal-300">Confidence: {result.topResult.score}%</p>
            </div>

            {/* Full rankings */}
            <h3 className="text-sm font-medium text-white mb-3">All Possibilities</h3>
            <div className="space-y-3">
              {result.results.map((item) => (
                <div key={item.rank}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-200 capitalize">{item.label}</span>
                    <span className="text-slate-400">{item.score}%</span>
                  </div>
                  <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ duration: 0.6, delay: item.rank * 0.1 }}
                      className={`h-full ${
                        item.rank === 1 ? "bg-gradient-to-r from-teal-500 to-cyan-500" : "bg-slate-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          {result.requiresFollowUp && (
            <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-400 flex-shrink-0" size={20} />
                <div className="text-sm text-amber-200">
                  <p className="font-semibold mb-1">Medical Follow-up Recommended</p>
                  <p>
                    This result warrants evaluation by a healthcare professional. Please consult a doctor for proper diagnosis.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors"
          >
            Analyze Another Image
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
