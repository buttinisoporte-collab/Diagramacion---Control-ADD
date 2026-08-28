import React, { useState } from 'react';
import { DespachoObjetosPerdidos } from '../../types/objetosPerdidos';
import { confirmarRecepcionDespacho } from '../../lib/objetosPerdidosService';
import { Usuario } from '../../context/AuthContext';
import QrCodeDisplayModal from '../QrCodeDisplayModal';
import { 
  Inbox, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Lock, 
  Unlock, 
  Send, 
  User, 
  Calendar, 
  Package, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface RecepcionOficinaViewProps {
  despachos: DespachoObjetosPerdidos[];
  currentUser: Usuario;
  onRecepcionCompletada: () => void;
}

export default function RecepcionOficinaView({
  despachos,
  currentUser,
  onRecepcionCompletada
}: RecepcionOficinaViewProps) {
  const [selectedDespachoId, setSelectedDespachoId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [desbloqueadoManual, setDesbloqueadoManual] = useState(false);

  // Verificaciones de recepción: objeto_id -> { verificado: boolean, obs: string }
  const [verificaciones, setVerificaciones] = useState<Record<string, { verificado: boolean; obs: string }>>({});
  const [ubicacionOficina, setUbicacionOficina] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter pending reception despachos (both 'En Tránsito' and 'Pendiente de Transporte')
  const despachosPendientes = despachos.filter(d => d.estado !== 'Entregado');
  const selectedDespacho = despachos.find(d => d.id === selectedDespachoId);

  // Initialize verification list when selecting a despacho
  const handleSelectDespacho = (despacho: DespachoObjetosPerdidos) => {
    setSelectedDespachoId(despacho.id);
    setDesbloqueadoManual(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUbicacionOficina('');

    const initialVerif: Record<string, { verificado: boolean; obs: string }> = {};
    despacho.items.forEach(item => {
      initialVerif[item.objeto_id] = {
        verificado: item.verificado_transporte !== false,
        obs: item.obs_transporte || ''
      };
    });
    setVerificaciones(initialVerif);
  };

  const handleToggleItem = (objetoId: string) => {
    setVerificaciones(prev => ({
      ...prev,
      [objetoId]: {
        ...prev[objetoId],
        verificado: !prev[objetoId]?.verificado
      }
    }));
  };

  const handleObsChange = (objetoId: string, obs: string) => {
    setVerificaciones(prev => ({
      ...prev,
      [objetoId]: {
        ...prev[objetoId],
        obs
      }
    }));
  };

  const handleConfirmarRecepcion = async () => {
    if (!selectedDespacho) return;
    if (!ubicacionOficina.trim()) {
      setErrorMsg('Debe detallar el lugar de la oficina donde se guardarán los objetos.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      await confirmarRecepcionDespacho(
        selectedDespacho.id,
        currentUser,
        ubicacionOficina.trim(),
        verificaciones
      );

      setSuccessMsg(`¡Despacho ${selectedDespacho.id} recepcionado con éxito! Los objetos pasaron al estado "EN ADMINISTRACION" con la ubicación registrada.`);
      onRecepcionCompletada();
      setTimeout(() => {
        setSelectedDespachoId(null);
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error confirmando recepción');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Recepción de Despachos en Oficinas de Administración</h3>
            <p className="text-xs text-slate-500">
              Seleccione el despacho que ha llegado a oficinas para generar el código QR de control, desbloquear el checklist de verificación y registrar la ubicación física de almacenamiento.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of pending despachos */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Despachos Pendientes</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
              {despachosPendientes.length}
            </span>
          </h4>

          {despachosPendientes.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No hay despachos pendientes de recibir en este momento.
            </div>
          ) : (
            despachosPendientes.map((d) => {
              const isSelected = d.id === selectedDespachoId;
              return (
                <div
                  key={d.id}
                  onClick={() => handleSelectDespacho(d)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-black text-slate-800">{d.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.estado === 'En Tránsito' 
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {d.estado}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700">Precinto: {d.numero_precinto}</p>
                  
                  <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Envío: {d.fecha_envio}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Send className="w-3 h-3 text-slate-400" />
                      <span>Despachó: {d.operador_despacha_nombre}</span>
                    </div>
                    {d.transportador_nombre && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-700 font-medium">Transporta: {d.transportador_nombre}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      <Package className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-slate-700">{d.items.length} objetos incluidos</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail and checklist of selected despacho */}
        <div className="lg:col-span-2">
          {selectedDespacho ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-blue-400">{selectedDespacho.id}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-200">
                      Precinto N°: {selectedDespacho.numero_precinto}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Despachado en Garita por {selectedDespacho.operador_despacha_nombre} el {selectedDespacho.fecha_envio}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Ver QR para Transportador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDesbloqueadoManual(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                    title="Desbloquear checklist para revisión"
                  >
                    {desbloqueadoManual ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Desbloqueado</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Desbloquear Checklist</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Information banner according to workflow */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-slate-800">Flujo de Recepción en Administración:</p>
                  <p className="text-slate-600">
                    1. El transportador escanea el QR del despacho con su celular (o se presiona "Desbloquear Checklist").
                  </p>
                  <p className="text-slate-600">
                    2. Chequee uno a uno los artículos del despacho físico. Los ítems que no se marcaron en origen ya incluyen su observación de despacho.
                  </p>
                  <p className="text-slate-600">
                    3. Indique la ubicación exacta en administración ("UBICADO EN: ...") y confirme la recepción.
                  </p>
                </div>

                {/* Items Checklist */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Revisión de Artículos ({selectedDespacho.items.length})</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Chequear cada artículo físico recibido
                    </span>
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {selectedDespacho.items.map((item, idx) => {
                      const v = verificaciones[item.objeto_id] || { verificado: true, obs: '' };
                      const hasTransportWarning = item.verificado_transporte === false;

                      return (
                        <div key={item.objeto_id || idx} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                disabled={!desbloqueadoManual}
                                onClick={() => handleToggleItem(item.objeto_id)}
                                className={`mt-0.5 p-1 rounded-md transition-colors ${
                                  v.verificado 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                                } ${!desbloqueadoManual ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <Check className="w-4 h-4" />
                              </button>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-800">
                                    {item.objeto_id}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Planilla: {item.numero_planilla}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-800 mt-1">
                                  {item.descripcion}
                                </p>

                                {hasTransportWarning && (
                                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>Obs. en despacho: {item.obs_transporte || 'No verificado al despachar'}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              v.verificado ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {v.verificado ? 'Recibido OK' : 'Faltante / Observado'}
                            </span>
                          </div>

                          {/* Observation input */}
                          {desbloqueadoManual && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100">
                              <input
                                type="text"
                                placeholder="Observación de recepción (opcional si falta o tiene daño)..."
                                value={v.obs}
                                onChange={(e) => handleObsChange(item.objeto_id, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Storage Location Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Lugar de la oficina donde se está guardando (Requerido) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Ej. Estante 2, Nivel 3, Caja de Objetos Perdidos Oficina Central..."
                    value={ubicacionOficina}
                    onChange={(e) => setUbicacionOficina(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Este texto se guardará automáticamente como "UBICADO EN: [detalle]" en cada objeto y quedará registrado en su trazabilidad.
                  </p>
                </div>

                {/* Confirm Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={saving || !desbloqueadoManual || !ubicacionOficina.trim()}
                    onClick={handleConfirmarRecepcion}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{saving ? 'Confirmando...' : 'Confirmar Recepción de Despacho'}</span>
                  </button>
                </div>
              </div>

              {/* QR Modal for Transporter to scan at office */}
              <QrCodeDisplayModal
                isOpen={showQrModal}
                onClose={() => {
                  setShowQrModal(false);
                  setDesbloqueadoManual(true);
                }}
                title={`Despacho ${selectedDespacho.id}`}
                subtitle="El transportador debe escanear este código en la oficina para validar la entrega"
                dataValue={selectedDespacho.id}
                details={[
                  { label: 'Precinto N°', value: selectedDespacho.numero_precinto },
                  { label: 'Fecha Envío', value: selectedDespacho.fecha_envio },
                  { label: 'Total Objetos', value: String(selectedDespacho.items.length) }
                ]}
              />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-2xs">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700">Seleccione un despacho</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Haga clic en uno de los despachos pendientes a la izquierda para ver su contenido, generar su QR y procesar la recepción física.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
