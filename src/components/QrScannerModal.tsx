import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, CheckCircle2, Keyboard } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
}

export default function QrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Escanear Código QR',
  subtitle = 'Apunte la cámara del dispositivo al código QR generado'
}: QrScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setCameraError(null);
      setManualCode('');
      return;
    }

    // Start scanner after modal mounts
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setCameraError(null);
      const element = document.getElementById(readerElementId);
      if (!element) return;

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {}
      }

      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 }
        },
        (decodedText) => {
          stopScanner();
          onScanSuccess(decodedText.trim());
        },
        () => {
          // ignore scan frame failure
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.warn('Error iniciando cámara QR:', err);
      setCameraError(err?.message || 'No se pudo acceder a la cámara. Verifique los permisos o ingrese el código manualmente.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error deteniendo scanner:', e);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopScanner();
      onScanSuccess(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold leading-tight">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col items-center justify-center overflow-y-auto">
          {/* Camera View Area */}
          <div className="w-full relative bg-slate-950 rounded-xl overflow-hidden min-h-[280px] flex items-center justify-center border border-slate-800 shadow-inner">
            <div id={readerElementId} className="w-full h-full" />

            {cameraError && (
              <div className="absolute inset-0 p-4 bg-slate-900/95 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                <p className="text-xs font-bold text-white mb-1">Acceso a Cámara no disponible</p>
                <p className="text-[11px] text-slate-400 mb-4 px-2">{cameraError}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startScanner}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reintentar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManual(true)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    <Keyboard className="w-3.5 h-3.5" /> Ingreso manual
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Controls below camera */}
          <div className="w-full mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 cursor-pointer py-1"
            >
              <Keyboard className="w-4 h-4" />
              <span>{showManual ? 'Ocultar ingreso manual' : '¿Problemas con la cámara? Ingresar código'}</span>
            </button>

            {isScanning && (
              <button
                type="button"
                onClick={startScanner}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 py-1"
                title="Reiniciar lector"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Manual Input form */}
          {showManual && (
            <form onSubmit={handleManualSubmit} className="w-full mt-3 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ID de Registro o Despacho (ej. OP-... o DESP-...):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pegue o escriba el código..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validar</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
