import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { ObjetoPerdido, DespachoObjetosPerdidos } from '../types/objetosPerdidos';
import { 
  fetchObjetosPerdidos, 
  fetchDespachos, 
  firmarHallazgoObjeto, 
  confirmarTransporteDespacho 
} from '../lib/objetosPerdidosService';
import QrScannerModal from '../components/QrScannerModal';
import { 
  Camera, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Bus, 
  User, 
  Package, 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  PenTool, 
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';

export default function RegistrarFirma() {
  const { user } = useAuth();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);

  // Scanned entity state
  const [detectedType, setDetectedType] = useState<'none' | 'objeto' | 'despacho'>('none');
  const [currentObjeto, setCurrentObjeto] = useState<ObjetoPerdido | null>(null);
  const [currentDespacho, setCurrentDespacho] = useState<DespachoObjetosPerdidos | null>(null);

  // Despacho checklist verification states (for transporter)
  const [itemChecks, setItemChecks] = useState<Record<string, { verificado: boolean; obs: string }>>({});

  // Status and feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const currentUser = user || {
    id: 'user-default',
    nombre_apellido: 'Usuario del Sistema',
    rol: 'Conductor'
  } as any;

  const handleProcessCode = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setScannedCode(cleanCode);
    setLoadingCode(true);
    setFeedbackSuccess(null);
    setFeedbackError(null);
    setCurrentObjeto(null);
    setCurrentDespacho(null);
    setDetectedType('none');

    try {
      if (cleanCode.startsWith('OP-') || cleanCode.includes('OP')) {
        // Find Objeto
        const list = await fetchObjetosPerdidos();
        const found = list.find(o => o.id.toLowerCase() === cleanCode.toLowerCase());
        if (found) {
          setCurrentObjeto(found);
          setDetectedType('objeto');
        } else {
          setFeedbackError(`No se encontró ningún objeto perdido con el código "${cleanCode}".`);
        }
      } else if (cleanCode.startsWith('DESP-') || cleanCode.includes('DESP')) {
        // Find Despacho
        const list = await fetchDespachos();
        const found = list.find(d => d.id.toLowerCase() === cleanCode.toLowerCase());
        if (found) {
          setCurrentDespacho(found);
          setDetectedType('despacho');

          // Initialize checklist
          const initialChecks: Record<string, { verificado: boolean; obs: string }> = {};
          found.items.forEach(item => {
            initialChecks[item.objeto_id] = {
              verificado: true,
              obs: ''
            };
          });
          setItemChecks(initialChecks);
        } else {
          setFeedbackError(`No se encontró ningún despacho con el código "${cleanCode}".`);
        }
      } else {
        // Attempt search across both
        const [objList, despList] = await Promise.all([fetchObjetosPerdidos(), fetchDespachos()]);
        const foundObj = objList.find(o => o.id.toLowerCase() === cleanCode.toLowerCase());
        if (foundObj) {
          setCurrentObjeto(foundObj);
          setDetectedType('objeto');
        } else {
          const foundDesp = despList.find(d => d.id.toLowerCase() === cleanCode.toLowerCase());
          if (foundDesp) {
            setCurrentDespacho(foundDesp);
            setDetectedType('despacho');
            const initialChecks: Record<string, { verificado: boolean; obs: string }> = {};
            foundDesp.items.forEach(item => {
              initialChecks[item.objeto_id] = { verificado: true, obs: '' };
            });
            setItemChecks(initialChecks);
          } else {
            setFeedbackError(`El código "${cleanCode}" no corresponde a un objeto o despacho registrado.`);
          }
        }
      }
    } catch (err: any) {
      setFeedbackError(err?.message || 'Error procesando código escaneado.');
    } finally {
      setLoadingCode(false);
    }
  };

  // 1. Conductor confirma hallazgo
  const handleConfirmarFirmaConductor = async () => {
    if (!currentObjeto) return;
    setActionLoading(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const updated = await firmarHallazgoObjeto(currentObjeto.id, currentUser);
      setCurrentObjeto(updated);
      setFeedbackSuccess(`¡Constancia de aceptación firmada con éxito por ${currentUser.nombre_apellido}!`);
    } catch (err: any) {
      setFeedbackError(err?.message || 'Error al firmar constancia.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Transportador controla y transporta
  const handleToggleItemCheck = (objetoId: string) => {
    setItemChecks(prev => ({
      ...prev,
      [objetoId]: {
        ...prev[objetoId],
        verificado: !prev[objetoId]?.verificado
      }
    }));
  };

  const handleItemObsChange = (objetoId: string, obs: string) => {
    setItemChecks(prev => ({
      ...prev,
      [objetoId]: {
        ...prev[objetoId],
        obs
      }
    }));
  };

  const handleConfirmarTransporte = async () => {
    if (!currentDespacho) return;

    // Check if any unchecked item lacks observation
    const unverifiedWithoutObs = currentDespacho.items.filter(item => {
      const check = itemChecks[item.objeto_id];
      return check && !check.verificado && !check.obs.trim();
    });

    if (unverifiedWithoutObs.length > 0) {
      setFeedbackError('Por favor ingrese una observación para cada artículo desmarcado antes de continuar.');
      return;
    }

    setActionLoading(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const updated = await confirmarTransporteDespacho(
        currentDespacho.id,
        currentUser,
        itemChecks
      );
      setCurrentDespacho(updated);
      setFeedbackSuccess(`¡Despacho cerrado y aceptado para transporte por ${currentUser.nombre_apellido}! Los objetos pasan al estado "Enviado".`);
    } catch (err: any) {
      setFeedbackError(err?.message || 'Error confirmando transporte.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Header
        title="Registrar Firma y Verificación Móvil"
        subtitle="Escaneo de códigos QR para confirmación de hallazgos por conductores y control de despachos para transportadores"
      />

      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
        {/* User Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Personal Conectado</p>
              <h3 className="text-sm font-bold text-slate-800">{currentUser.nombre_apellido}</h3>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
            {currentUser.rol || 'Personal'}
          </span>
        </div>

        {/* Big Scan Action Button */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-600/30 border border-blue-400/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-lg font-bold">Escanear Código QR</h2>
          <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1 mb-5">
            Abra la cámara del móvil para escanear el QR del objeto hallado en Garita o el despacho precintado.
          </p>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            <span>Abrir Cámara de Escaneo</span>
          </button>
        </div>

        {/* Manual Code Input Option */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            O ingresar código de registro manualmente:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej. OP-260827-1234 o DESP-260827-123"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            <button
              type="button"
              disabled={loadingCode || !scannedCode.trim()}
              onClick={() => handleProcessCode(scannedCode)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loadingCode ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {feedbackSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-3 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Acción Realizada</p>
              <p className="mt-0.5 text-emerald-800">{feedbackSuccess}</p>
            </div>
          </div>
        )}

        {feedbackError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atención</p>
              <p className="mt-0.5 text-red-800">{feedbackError}</p>
            </div>
          </div>
        )}

        {/* 1. SCANNED OBJETO CARD */}
        {detectedType === 'objeto' && currentObjeto && (
          <div className="bg-white border-2 border-blue-500 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-sm">Objeto Perdido Identificado</h3>
              </div>
              <span className="font-mono text-xs font-black bg-blue-700 px-2 py-0.5 rounded">
                {currentObjeto.id}
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Descripción</span>
                  <span className="text-sm font-bold text-slate-800">{currentObjeto.descripcion}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Planilla N°:</span>
                    <span className="font-bold text-slate-700">{currentObjeto.numero_planilla}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Fecha Hallazgo:</span>
                    <span className="font-bold text-slate-700">{currentObjeto.fecha_hallazgo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Unidad / Sector:</span>
                    <span className="font-bold text-slate-700">{currentObjeto.unidad_interno} ({currentObjeto.sector_hallazgo})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Personal Registrado:</span>
                    <span className="font-bold text-slate-700">{currentObjeto.personal_hallazgo}</span>
                  </div>
                </div>
              </div>

              {/* Status and Signature check */}
              {currentObjeto.conductor_firmo ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                  <p className="font-bold text-emerald-900 text-xs">Constancia de Aceptación ya Firmada</p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Firmado por: <strong>{currentObjeto.conductor_firma_usuario || 'Conductor'}</strong>
                    {currentObjeto.conductor_firma_fecha && ` el ${new Date(currentObjeto.conductor_firma_fecha).toLocaleString()}`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                    <p className="font-bold flex items-center gap-1">
                      <PenTool className="w-3.5 h-3.5 text-blue-600" />
                      Declaración de Aceptación Digital:
                    </p>
                    <p className="mt-1 text-blue-800">
                      Yo, <strong>{currentUser.nombre_apellido}</strong> ({currentUser.rol || 'Conductor'}), confirmo haber encontrado y entregado este objeto perdido en Garita, dando plena constancia desde mi dispositivo móvil.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleConfirmarFirmaConductor}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{actionLoading ? 'Registrando firma...' : 'Confirmar y Asentar Firma de Hallazgo'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. SCANNED DESPACHO CARD */}
        {detectedType === 'despacho' && currentDespacho && (
          <div className="bg-white border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm">Despacho a Oficina</h3>
              </div>
              <span className="font-mono text-xs font-black bg-emerald-700 px-2 py-0.5 rounded">
                {currentDespacho.id}
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Precinto de Seguridad N°:</span>
                  <span className="font-bold text-slate-800 text-xs">{currentDespacho.numero_precinto}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fecha Envío:</span>
                  <span className="font-bold text-slate-800">{currentDespacho.fecha_envio}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Despachado en Garita por:</span>
                  <span className="font-bold text-slate-700">{currentDespacho.operador_despacha_nombre}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Estado Actual:</span>
                  <span className="font-bold text-emerald-700">{currentDespacho.estado}</span>
                </div>
              </div>

              {/* Transporter item checklist */}
              {currentDespacho.estado === 'Pendiente de Transporte' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Control de Artículos en Caja ({currentDespacho.items.length})
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Chequee cada ítem físico presente
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {currentDespacho.items.map((item, idx) => {
                      const check = itemChecks[item.objeto_id] || { verificado: true, obs: '' };
                      return (
                        <div key={item.objeto_id || idx} className="p-3 bg-white hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={check.verificado}
                                onChange={() => handleToggleItemCheck(item.objeto_id)}
                                className="w-4 h-4 text-emerald-600 rounded mt-0.5 cursor-pointer"
                              />
                              <div>
                                <span className="font-mono text-[10px] font-bold text-slate-500 block">
                                  {item.objeto_id} • Planilla {item.numero_planilla}
                                </span>
                                <p className="font-bold text-slate-800 text-xs mt-0.5">
                                  {item.descripcion}
                                </p>
                              </div>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              check.verificado ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {check.verificado ? 'Presente' : 'Faltante'}
                            </span>
                          </div>

                          {/* If unchecked, require observation */}
                          {!check.verificado && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <input
                                type="text"
                                required
                                placeholder="Indique motivo u observación por la que no está en la caja..."
                                value={check.obs}
                                onChange={(e) => handleItemObsChange(item.objeto_id, e.target.value)}
                                className="w-full px-2 py-1 text-[11px] bg-red-50 border border-red-200 rounded text-red-900 focus:outline-none focus:border-red-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                    <p className="font-semibold">Responsabilidad de Transporte:</p>
                    <p className="mt-0.5">
                      Al presionar <strong>"Controlado y Transportar"</strong>, usted asumirá la custodia de la caja precintada durante el traslado a oficinas de administración.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleConfirmarTransporte}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{actionLoading ? 'Procesando...' : 'Controlado y Transportar'}</span>
                  </button>
                </div>
              ) : currentDespacho.estado === 'En Tránsito' ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto" />
                  <p className="font-bold text-blue-900">Despacho en Viaje a Administración</p>
                  <p className="text-xs text-blue-700">
                    Transportador a cargo: <strong>{currentDespacho.transportador_nombre}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Al llegar a oficinas, el personal de recepción escaneará este despacho para ingresarlo a custodia.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                  <p className="font-bold text-emerald-900">Despacho Ya Entregado y Recepcionado</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Recibido en administración por: <strong>{currentDespacho.receptor_nombre}</strong>
                  </p>
                  {currentDespacho.ubicacion_oficina && (
                    <p className="text-[11px] text-slate-600 mt-1 font-semibold">
                      {currentDespacho.ubicacion_oficina}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(decoded) => {
          setIsScannerOpen(false);
          handleProcessCode(decoded);
        }}
        title="Escanear Código QR"
        subtitle="Apunte al código del objeto o despacho"
      />
    </>
  );
}
