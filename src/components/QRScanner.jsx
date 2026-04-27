// src/components/QRScanner.jsx
// Scans QR codes containing Verifiable Credentials

import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { importCredential } from '../services/passport';

const SCANNER_ID = 'qr-scanner';

export default function QRScanner({ onCredentialScanned, onBack }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        const html5Qr = new Html5Qrcode(SCANNER_ID);
        html5Qr.stop().catch(() => {});
      }
    };
  }, []);

  const startScan = async () => {
    setError(null);
    setResult(null);

    const html5Qr = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = html5Qr;

    try {
      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code detected
          handleScanSuccess(decodedText);
        },
        () => {
          // Scan failed - ignore
        }
      );
      setScanning(true);
    } catch (err) {
      console.error('QR scan start error:', err);
      setError('Could not access camera. Ensure you are on HTTPS and have granted permission.');
    }
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (e) {}
    }
  };

  const handleScanSuccess = async (qrText) => {
    stopScan();

    // Attempt to parse as VC
    const validation = await importCredential(qrText);

    if (validation.isValid) {
      setResult({ valid: true, claims: validation.claims, vc: validation.vc });
      if (onCredentialScanned) {
        onCredentialScanned(validation);
      }
    } else {
      setResult({ valid: false, reason: validation.reason });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Scan Health Passport</h2>
        <button onClick={onBack} className="text-slate-400 hover:text-slate-200 text-sm">
          Cancel
        </button>
      </div>

      {/* Scanner Viewport */}
      <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
        {!scanning && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-sm">Camera will open below</p>
          </div>
        )}
        <div id={SCANNER_ID} className={`w-full ${scanning ? 'block' : 'hidden'}`} />
      </div>

      {/* Controls */}
      {!scanning && !result && (
        <button onClick={startScan} className="w-full btn-primary py-4">
          Start Camera Scan
        </button>
      )}

      {scanning && (
        <button onClick={stopScan} className="w-full btn-secondary py-4">
          Cancel Scan
        </button>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl ${result.valid ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}
        >
          {result.valid ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Valid Credential</span>
              </div>

              <div className="text-sm text-slate-300 space-y-2">
                <div><span className="text-slate-500">Specialist:</span> {result.claims.healthSummary?.specialist}</div>
                <div><span className="text-slate-500">Issued:</span> {new Date(result.vc.issuanceDate).toLocaleDateString()}</div>
                <div>
                  <span className="text-slate-500 block mb-1">Summary:</span>
                  <p className="text-slate-400 text-xs leading-relaxed">{result.claims.healthSummary?.summary}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-400 text-sm">
              Invalid credential: {result.reason || 'Unknown error'}
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <div className="text-amber-400 text-sm bg-amber-500/10 p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
