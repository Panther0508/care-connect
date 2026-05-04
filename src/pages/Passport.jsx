// src/pages/Passport.jsx
// Universal Health Passport — main page

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClinicianTypeSelector from '../components/ClinicianTypeSelector';
import PreVisitSummary from '../components/PreVisitSummary';
import QRCodeDisplay from '../components/QRCodeDisplay';
import QRScanner from '../components/QRScanner';
import { generatePassport, initPassport } from '../services/passport';
import { getCurrentHealthState } from '../services/healthGraph';
import MagnifyingLoader from '../components/MagnifyingLoader';

export default function Passport() {
  const [step, setStep] = useState('select'); // 'select' | 'review' | 'qr' | 'scan'
  const [specialist, setSpecialist] = useState(null);
  const [summaryText, setSummaryText] = useState('');
  const [qrDataURL, setQrDataURL] = useState('');
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    initPassport();
    setHealthData(getCurrentHealthState());
  }, []);

  const handleSelectSpecialist = async (type) => {
    setSpecialist(type);
    setLoading(true);
    setStep('review');

    try {
      const result = await generatePassport(type);
      setSummaryText(result.summaryText);
      setQrDataURL(result.qrDataURL);
      setCredential(result.credential);
    } catch (err) {
      console.error('Failed to generate passport:', err);
      alert('Failed to generate passport. Ensure AI model is loaded and health data exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = () => {
    setStep('qr');
  };

  const handleScanAnother = () => {
    setStep('scan');
  };

  const handleBackToSelect = () => {
    setStep('select');
    setSpecialist(null);
  };

  const handleScanSuccess = (validation) => {
    // Could import into health graph in future
    alert(`Credential verified for ${validation.claims.healthSummary.specialist}`);
  };

   if (!healthData) {
     return (
       <div className="flex items-center justify-center py-20">
         <MagnifyingLoader size={32} />
       </div>
     );
   }

  // Check if health data exists
  const hasHealthData = healthData.conditions.length > 0 || healthData.medications.length > 0;

  if (!hasHealthData && step === 'select') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Health Passport</h1>
          <p className="text-slate-400 text-sm">
            Create a portable, verifiable health summary for your clinician.
          </p>
        </header>

        <div className="glass-card p-6 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">No health data yet</h3>
          <p className="text-slate-400 mb-4">
            You need to add some health records before generating a passport.
          </p>
          <a href="/health" className="btn-primary inline-block">
            Add Health Data
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Health Passport</h1>
        <p className="text-slate-400 text-sm">
          Generate a W3C Verifiable Credential for your clinician.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ClinicianTypeSelector onSelect={handleSelectSpecialist} />
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
             {loading ? (
               <div className="flex items-center justify-center py-20">
                 <MagnifyingLoader size={32} />
                 <span className="ml-3 text-slate-300">Generating summary...</span>
               </div>
             ) : (
              <PreVisitSummary
                specialist={specialist}
                summaryText={summaryText}
                healthData={healthData}
                onConfirm={handleShowQR}
                onBack={handleBackToSelect}
              />
            )}
          </motion.div>
        )}

        {step === 'qr' && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <QRCodeDisplay
              qrDataURL={qrDataURL}
              credential={credential}
              onDone={handleBackToSelect}
              onScanAnother={handleScanAnother}
            />
          </motion.div>
        )}

        {step === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <QRScanner onCredentialScanned={handleScanSuccess} onBack={handleBackToSelect} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick scan link when not scanning */}
      {step === 'select' && (
        <div className="text-center pt-4">
          <button onClick={() => setStep('scan')} className="text-teal-400 hover:text-teal-300 text-sm">
            Already have a QR code? Scan it here
          </button>
        </div>
      )}
    </div>
  );
}
