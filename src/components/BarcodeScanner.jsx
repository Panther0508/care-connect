// src/components/BarcodeScanner.jsx
// Medication barcode scanner using BarcodeDetector API with html5-qrcode fallback

import { useState, useRef, useEffect } from 'react';
import { getScanner } from '../lib/scannerLoader';

export default function BarcodeScanner({ onScanSuccess, onCancel }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const detectorRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      if (detectorRef.current) {
        detectorRef.current = null;
      }
    };
  }, []);

  // Try native BarcodeDetector API first
  const checkBarcodeDetector = () => {
    return 'BarcodeDetector' in window && BarcodeDetector.supportedFormats
      ? new BarcodeDetector({ formats: ['ean_13', 'code_128', 'upc_a', 'upc_e', 'qr_code'] })
      : null;
  };

  // Draw circular cropped video preview
  const drawCircularPreview = (video) => {
    const canvas = canvasRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const size = 120;
    canvas.width = size;
    canvas.height = size;

    const draw = () => {
      if (!scanning) return;

      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      const videoAspect = video.videoWidth / video.videoHeight;
      const cropSize = Math.min(video.videoWidth, video.videoHeight) * 0.8;
      const sx = (video.videoWidth - cropSize) / 2;
      const sy = (video.videoHeight - cropSize) / 2;

      ctx.drawImage(
        video,
        sx, sy, cropSize, cropSize,
        0, 0, size, size
      );
      ctx.restore();

      // Draw circular border
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Scan loop with BarcodeDetector
  const scanWithDetector = async (video) => {
    if (!detectorRef.current) {
      detectorRef.current = checkBarcodeDetector();
    }

    if (!detectorRef.current) {
      startHtml5QrcodeScan();
      return;
    }

    const detectLoop = async () => {
      if (!scanning) return;

      try {
        const barcodes = await detectorRef.current.detect(video);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          handleDecodeSuccess(rawValue);
          return;
        }
      } catch (err) {
        console.warn('BarcodeDetector scan error:', err);
      }

      animationFrameRef.current = requestAnimationFrame(detectLoop);
    };

    detectLoop();
  };

  // Fallback to html5-qrcode
  const startHtml5QrcodeScan = async () => {
    try {
      const { Html5Qrcode } = await getScanner();
      const html5Qr = new Html5Qrcode('barcode-scanner-viewport');
      scannerRef.current = html5Qr;
      setUsingFallback(true);

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          formatsToSupport: [
            2, // QR_CODE
            3, // EAN_13
            8, // CODE_128
            9, // UPC_A
            10 // UPC_E
          ]
        },
        (decodedText) => {
          handleDecodeSuccess(decodedText);
        },
        (errorMessage) => {}
      );
    } catch (err) {
      console.error('Barcode scan start error:', err);
      setError('Could not access camera. Ensure you are on HTTPS and have granted permission.');
      setScanning(false);
    }
  };

  const startScan = async () => {
    setError(null);
    setResult(null);
    setScanning(true);
    setUsingFallback(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        drawCircularPreview(videoRef.current);
        scanWithDetector(videoRef.current);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Ensure you are on HTTPS and have granted permission.');
      setScanning(false);
    }
  };

  const stopScan = async () => {
    setScanning(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (detectorRef.current) {
      detectorRef.current = null;
    }
  };

  const handleDecodeSuccess = (barcodeValue) => {
    stopScan();
    setResult(barcodeValue);
    setScanning(false);

    // Validate NDC/UPC format (10-12 digit numeric)
    const cleanCode = barcodeValue.replace(/[^0-9]/g, '');
    if (cleanCode.length >= 10 && cleanCode.length <= 12) {
      if (onScanSuccess) {
        onScanSuccess(cleanCode);
      }
    } else {
      setError('Scanned code is not a valid medication barcode (NDC/UPC). Please try again.');
    }
  };

  const handleFileScan = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    
    try {
      const { Html5Qrcode } = await getScanner();
      const html5Qr = new Html5Qrcode('barcode-scanner-viewport');
      const decoded = await html5Qr.scanFile(file, true);
      handleDecodeSuccess(decoded);
    } catch (err) {
      setError('Could not read barcode from image. Try a clearer photo.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Scan Medication Barcode</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm">
          Cancel
        </button>
      </div>

      {!scanning && !result && (
        <div className="space-y-4">
          <div className="text-center text-slate-400 text-sm">
            Point your camera at the medication barcode (NDC/UPC)
          </div>
          <div className="aspect-[3/4] max-w-[280px] mx-auto bg-slate-900 rounded-xl flex items-center justify-center">
            <div className="text-4xl mb-2">📦</div>
          </div>
        </div>
      )}

      {scanning && (
        <div className="space-y-3">
          <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {!usingFallback && (
              <canvas
                ref={canvasRef}
                className="absolute top-3 left-3 w-[120px] h-[120px] rounded-lg border-2 border-emerald-500/50"
              />
            )}
            {usingFallback && (
              <div
                id="barcode-scanner-viewport"
                className="w-full h-full"
              />
            )}
          </div>
          <div className="text-center text-slate-400 text-sm">
            {usingFallback ? 'Using QR scanner...' : 'BarcodeDetector active - scanning...'}
            <div className="w-16 h-16 mx-auto mt-2 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          </div>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
        >
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Barcode Scanned</span>
          </div>
          <div className="text-sm text-slate-300 break-all">
            {result}
          </div>
        </motion.div>
      )}

      <input
        type="file"
        ref={useRef(null)}
        accept="image/*"
        onChange={handleFileScan}
        className="hidden"
      />

      {!scanning && !result && (
        <>
          <button onClick={startScan} className="w-full btn-primary py-4">
            Start Barcode Scan
          </button>
          <label className="w-full btn-secondary py-4 text-center block cursor-pointer">
            Scan from Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileScan}
              className="hidden"
            />
          </label>
        </>
      )}

      {scanning && (
        <button onClick={stopScan} className="w-full btn-secondary py-4">
          Cancel Scan
        </button>
      )}

      {error && (
        <div className="text-amber-400 text-sm bg-amber-500/10 p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
