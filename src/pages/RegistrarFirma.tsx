import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { ObjetoPerdido, DespachoObjetosPerdidos } from '../types/objetosPerdidos';
import { fetchObjetosPerdidos, fetchDespachos, firmarHallazgoObjeto, confirmarTransporteDespacho, getFirmaInfo } from '../lib/objetosPerdidosService';
import QrScannerModal from '../components/QrScannerModal';
import { QrCode, CheckCircle2, FileText, User, Package, Check, PenTool, RefreshCw } from 'lucide-react';

export default function RegistrarFirma() {
  const { user } = useAuth();
  const currentUser = user || { id: 'user-default', nombre_apellido: 'Usuario del Sistema', rol: 'Personal' } as any;

  const [activeTab, setActiveTab] = useState<'registro' | 'historial'>('registro');
  const [historialFirmas, setHistorialFirmas] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [detectedType, setDetectedType] = useState<'none' | 'objeto' | 'despacho'>('none');
  const [currentObjeto, setCurrentObjeto] = useState<ObjetoPerdido | null>(null);
  const [currentDespacho, setCurrentDespacho] = useState<DespachoObjetosPerdidos | null>(null);
  
  const [itemChecks, setItemChecks] = useState<Record<string, { verificado: boolean; obs: string }>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const resultCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTab === 'historial') loadHistorial();
  }, [activeTab]);

  const loadHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const allObjs = await fetchObjetosPerdidos();
      const allDespachos = await fetchDespachos();
      const userId = currentUser.nombre_apellido;
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const misObjetos = allObjs.filter(o => 
        o.conductor_firma_usuario?.includes(userId) && new Date(o.conductor_firma_fecha || '') >= oneYearAgo
      ).map(o => ({
        id: o.id, tipo: 'Objeto', fecha: o.conductor_firma_fecha, descripcion: o.descripcion, estado: o.estado
      }));

      const misDespachos = allDespachos.filter(d => 
        d.transportador_nombre?.includes(userId) && new Date(d.transportador_fecha || '') >= oneYearAgo
      ).map(d => ({
        id: d.id, tipo: 'Despacho', fecha: d.transportador_fecha, descripcion: `Precinto: ${d.numero_precinto} (${d.items.length} items)`, estado: d.estado
      }));

      const combined = [...misObjetos, ...misDespachos].sort((a, b) => new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime());
      setHistorialFirmas(combined);
    } catch (e) {
      console.warn("Error cargando historial", e);
    } finally {
      setLoadingHistorial(false);
    }
  };

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
          foundDesp.items.forEach(item => { initialChecks[item.objeto_id] = { verificado: true, obs: '' }; });
          setItemChecks(initialChecks);
        } else {
          setFeedbackError(`El código "${cleanCode}" no corresponde a un objeto o despacho registrado.`);
        }
      }
    } catch (err: any) {
      setFeedbackError(err?.message || 'Error procesando código escaneado.');
    } finally {
      setLoadingCode(false);
    }
  };

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

  const handleConfirmarTransporte = async () => {
    if (!currentDespacho) return;
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
      const updated = await confirmarTransporteDespacho(currentDespacho.id, currentUser, itemChecks);
      setCurrentDespacho(updated);
      setFeedbackSuccess(`¡Despacho cerrado y aceptado para transporte por ${currentUser.nombre_apellido}! Los objetos pasan al estado "Enviado".`);
    } catch (err: any) {
      setFeedbackError(err?.message || 'Error confirmando transporte.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title="Registrar Firma y Verificación Móvil"
        subtitle="Escaneo de códigos QR para confirmación de hallazgos por conductores y control de despachos para transportadores"
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
        <div className="max-w-xl mx-auto space-y-5 pb-36">
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

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('registro')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'registro' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Registro
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'historial' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Historial
            </button>
          </div>

          {activeTab === 'historial' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col min-h-[400px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Mi Historial (Último Año)</h3>
                <button onClick={loadHistorial} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md transition-colors" title="Actualizar">
                  <RefreshCw className={`w-4 h-4 ${loadingHistorial ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex-1 p-0 overflow-y-auto">
                {loadingHistorial ? (
                  <div className="p-8 text-center text-slate-400">Cargando historial...</div>
                ) : historialFirmas.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                    <FileText className="w-10 h-10 mb-2 opacity-50" />
                    <p>No tienes firmas registradas en el último año.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {historialFirmas.map((item, idx) => (
                      <div key={item.id ? `hist-${item.id}-${idx}` : idx} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${item.tipo === 'Objeto' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                            {item.tipo}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.fecha ? new Date(item.fecha).toLocaleString('es-AR') : 'Sin fecha'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-1">{item.descripcion}</p>
                        <p className="text-xs text-slate-500">Estado: <span className="font-semibold">{item.estado}</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'registro' && (
            <>
              {detectedType === 'none' && !currentObjeto && !currentDespacho && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-2xs space-y-5">
                  <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Escanear Código</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      Escanee el código QR provisto en el objeto o en el precinto del despacho.
                    </p>
                  </div>
                  <button onClick={() => setIsScannerOpen(true)} className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                    <QrCode className="w-5 h-5" />
                    <span>Abrir Cámara para Escanear</span>
                  </button>
                  {loadingCode && <p className="text-sm text-blue-600 mt-2 font-bold animate-pulse">Procesando código...</p>}
                  {feedbackError && <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 text-left font-medium">{feedbackError}</div>}
                </div>
              )}

              {detectedType === 'objeto' && currentObjeto && (
                <div ref={resultCardRef} className="bg-white border border-blue-200 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5">
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-slate-800">Objeto Perdido</h3>
                    <p className="text-slate-600 text-sm mt-2">{currentObjeto.descripcion}</p>
                    {feedbackSuccess && <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200 font-medium">{feedbackSuccess}</div>}
                    {feedbackError && <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 font-medium">{feedbackError}</div>}
                    
                    {!currentObjeto.conductor_firmo ? (
                      <div className="mt-4">
                        <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-xs mb-4">
                          <p className="font-bold flex items-center gap-1.5"><PenTool className="w-4 h-4"/> Declaración:</p>
                          <p>Yo, {currentUser.nombre_apellido}, confirmo haber encontrado y entregado este objeto.</p>
                        </div>
                        <button onClick={handleConfirmarFirmaConductor} disabled={actionLoading} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2">
                          <Check className="w-5 h-5" /> {actionLoading ? 'Registrando...' : 'Confirmar Firma'}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-emerald-50 text-emerald-900 text-center rounded-xl">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="font-bold">Ya firmado por {getFirmaInfo(currentObjeto).firmante}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-slate-100">
                    <button onClick={() => { setCurrentObjeto(null); setDetectedType('none'); }} className="text-slate-500 text-sm font-medium hover:text-slate-800">Escanear otro código</button>
                  </div>
                </div>
              )}

              {detectedType === 'despacho' && currentDespacho && (
                <div ref={resultCardRef} className="bg-white border border-blue-200 rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/5">
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-slate-800">Despacho de Administración</h3>
                    <p className="text-slate-600 text-sm mt-2">Precinto: {currentDespacho.numero_precinto}</p>
                    {feedbackSuccess && <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200 font-medium">{feedbackSuccess}</div>}
                    {feedbackError && <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 font-medium">{feedbackError}</div>}
                    
                    {currentDespacho.estado === 'Pendiente de Transporte' ? (
                      <div className="mt-4">
                        <div className="max-h-60 overflow-y-auto mb-4 border border-slate-200 rounded-xl divide-y divide-slate-100">
                          {currentDespacho.items.map((item, idx) => {
                            const check = itemChecks[item.objeto_id] || { verificado: true, obs: '' };
                            return (
                              <div key={item.objeto_id ? `${item.objeto_id}-${idx}` : idx} className="p-3 bg-slate-50">
                                <label className="flex items-start gap-2">
                                  <input type="checkbox" checked={check.verificado} onChange={() => setItemChecks(p => ({...p, [item.objeto_id]: { ...p[item.objeto_id], verificado: !check.verificado }}))} className="mt-1" />
                                  <div className="text-xs">
                                    <span className="font-bold text-slate-700">{item.descripcion}</span>
                                    {!check.verificado && (
                                      <input type="text" placeholder="Observación faltante" value={check.obs} onChange={e => setItemChecks(p => ({...p, [item.objeto_id]: { ...p[item.objeto_id], obs: e.target.value }}))} className="w-full mt-2 p-1 border rounded" />
                                    )}
                                  </div>
                                </label>
                              </div>
                            )
                          })}
                        </div>
                        <button onClick={handleConfirmarTransporte} disabled={actionLoading} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2">
                          <Check className="w-5 h-5" /> {actionLoading ? 'Registrando...' : 'Transportar'}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-blue-50 text-blue-900 text-center rounded-xl">
                        <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-bold">Despacho en estado: {currentDespacho.estado}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-slate-100">
                    <button onClick={() => { setCurrentDespacho(null); setDetectedType('none'); }} className="text-slate-500 text-sm font-medium hover:text-slate-800">Escanear otro código</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={(c) => { setIsScannerOpen(false); handleProcessCode(c); }} title="Escanear Código QR" subtitle="Apunte al código" />
    </div>
  );
}
