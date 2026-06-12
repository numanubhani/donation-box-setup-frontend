'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { playScanBeep } from '@/lib/beep';

interface QRScannerProps {
  active: boolean;
  onScan: (code: string) => void;
}

export default function QRScanner({ active, onScan }: QRScannerProps) {
  const elementId = useId().replace(/:/g, '');
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void; isScanning: boolean } | null>(null);
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const [status, setStatus] = useState<'idle' | 'loading' | 'scanning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  onScanRef.current = onScan;

  useEffect(() => {
    if (!active) {
      setStatus('idle');
      setErrorMessage('');
      scannedRef.current = false;
      return;
    }

    let cancelled = false;
    scannedRef.current = false;

    const cleanup = async () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;

      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // ignore stop errors during teardown
      }
      scanner.clear();
    };

    const startScanner = async () => {
      setStatus('loading');
      setErrorMessage('');

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const html5QrCode = new Html5Qrcode(elementId, { verbose: false });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.7);
            return { width: size, height: size };
          },
        };

        const onSuccess = (decodedText: string) => {
          if (scannedRef.current || cancelled) return;
          scannedRef.current = true;
          playScanBeep();
          onScanRef.current(decodedText.trim());
        };

        const cameraConfigs: MediaTrackConstraints[] = [
          { facingMode: 'environment' },
          { facingMode: 'user' },
        ];

        let started = false;
        for (const cameraConfig of cameraConfigs) {
          try {
            await html5QrCode.start(cameraConfig, config, onSuccess, () => {});
            started = true;
            break;
          } catch {
            // try next camera
          }
        }

        if (!started) {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras.length > 0) {
            await html5QrCode.start(cameras[0].id, config, onSuccess, () => {});
            started = true;
          }
        }

        if (!started) {
          throw new Error('No camera found on this device.');
        }

        if (!cancelled) setStatus('scanning');
      } catch (err) {
        if (cancelled) return;
        await cleanup();

        let msg = 'Could not start camera. Use manual entry below.';
        if (err instanceof Error) {
          if (err.message.includes('NotAllowed') || err.message.includes('Permission')) {
            msg = 'Camera permission denied. Allow camera access in your browser settings.';
          } else if (err.message.includes('secure') || err.message.includes('HTTPS')) {
            msg = 'Camera requires a secure connection (HTTPS). Use manual entry below.';
          } else if (err.message) {
            msg = err.message;
          }
        }

        setErrorMessage(msg);
        setStatus('error');
      }
    };

    const timer = setTimeout(() => {
      void startScanner();
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      void cleanup();
    };
  }, [active, elementId]);

  return (
    <div className="qr-scanner rounded-xl overflow-hidden bg-slate-900 aspect-video relative min-h-[240px]">
      <div id={elementId} className="w-full h-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white">
          <Loader2 size={32} className="animate-spin mb-2" />
          <p className="text-sm">Starting camera...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-center p-4">
          <AlertCircle size={40} className="text-amber-500 mb-2" />
          <p className="text-sm text-slate-600">{errorMessage}</p>
          <p className="text-xs text-slate-400 mt-1">Use manual entry below</p>
        </div>
      )}

      {status === 'scanning' && (
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
          <p className="text-xs text-white bg-black/50 inline-block px-3 py-1 rounded-full">
            Point camera at QR code
          </p>
        </div>
      )}
    </div>
  );
}
