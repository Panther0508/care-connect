// src/lib/scannerLoader.js
// Lazy loader for html5-qrcode to prevent tree-shaking issues

let scannerPromise = null;

export async function getScanner() {
  if (!scannerPromise) {
    scannerPromise = import('html5-qrcode').then(module => ({
      Html5Qrcode: module.Html5Qrcode,
      Html5QrcodeScanner: module.Html5QrcodeScanner,
    }));
  }
  return scannerPromise;
}