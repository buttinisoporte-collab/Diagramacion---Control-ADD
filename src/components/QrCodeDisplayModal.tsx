import React, { useEffect, useState } from 'react';
import { generateQrDataUrl } from '../lib/objetosPerdidosService';
import { QrCode, X, Copy, Check, Printer } from 'lucide-react';

interface QrCodeDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  dataValue: string;
  details?: { label: string; value: string }[];
}

export default function QrCodeDisplayModal({
  isOpen,
  onClose,
  title,
  subtitle,
  dataValue,
  details = []
}: QrCodeDisplayModalProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && dataValue) {
      generateQrDataUrl(dataValue).then(url => setQrUrl(url));
    } else {
      setQrUrl('');
    }
  }, [isOpen, dataValue]);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(dataValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="text-base font-bold leading-tight">{title}</h3>
              {subtitle && <p className="text-xs text-blue-100">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center overflow-y-auto">
          <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-md mb-4 flex items-center justify-center">
            {qrUrl ? (
              <img src={qrUrl} alt="Código QR" className="w-64 h-64 object-contain" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400 text-sm animate-pulse">
                Generando QR...
              </div>
            )}
          </div>

          {/* ID with copy */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex items-center justify-between">
            <span className="font-mono text-sm font-black text-slate-800 tracking-wider">
              {dataValue}
            </span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* Extra Details */}
          {details.length > 0 && (
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-left text-xs mb-2">
              {details.map((d, i) => (
                <div key={i} className="flex justify-between items-center py-0.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-semibold">{d.label}:</span>
                  <span className="font-bold text-slate-800 text-right">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500 mt-2">
            El personal puede escanear este código directamente desde la sección <strong>"Registrar Firma"</strong> de su teléfono.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
