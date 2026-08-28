import React, { useState } from 'react';
import { ObjetoPerdido, DespachoObjetosPerdidos } from '../../types/objetosPerdidos';
import { crearDespacho } from '../../lib/objetosPerdidosService';
import { Usuario } from '../../context/AuthContext';
import { X, Send, Calendar, ShieldCheck, CheckSquare, Square, AlertCircle, Package } from 'lucide-react';

interface DespachoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  objetosPendientes: ObjetoPerdido[];
  onDespachoCreado: (despacho: DespachoObjetosPerdidos) => void;
}

export default function DespachoModal({
  isOpen,
  onClose,
  currentUser,
  objetosPendientes,
  onDespachoCreado
}: DespachoModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [fechaEnvio, setFechaEnvio] = useState(todayStr);
  const [numeroPrecinto, setNumeroPrecinto] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    objetosPendientes.map(o => o.id)
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync selected IDs if list updates
  React.useEffect(() => {
    setSelectedIds(objetosPendientes.map(o => o.id));
  }, [objetosPendientes]);

  const toggleSelectAll = () => {
    if (selectedIds.length === objetosPendientes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(objetosPendientes.map(o => o.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCrearDespacho = async () => {
    if (!fechaEnvio) {
      setErrorMsg('Debe seleccionar la fecha de envío.');
      return;
    }
    if (!numeroPrecinto.trim()) {
      setErrorMsg('Debe asentar el número de precinto colocado a la caja de transporte.');
      return;
    }
    if (selectedIds.length === 0) {
      setErrorMsg('Debe seleccionar al menos un objeto para despachar.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const despacho = await crearDespacho(
        fechaEnvio,
        numeroPrecinto.trim(),
        selectedIds,
        currentUser
      );
      onDespachoCreado(despacho);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al generar despacho a oficina.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-xl">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Preparar Despacho a Oficina</h3>
              <p className="text-xs text-blue-100">
                Operador Garita: <span className="font-semibold">{currentUser.nombre_apellido}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Fecha de Envío *
              </label>
              <input
                type="date"
                required
                value={fechaEnvio}
                onChange={(e) => setFechaEnvio(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                N° de Precinto de la Caja *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. PREC-982341"
                value={numeroPrecinto}
                onChange={(e) => setNumeroPrecinto(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">Precinto físico de seguridad colocado en la caja de transporte.</p>
            </div>
          </div>

          {/* Resumen previo a despacho */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                Resumen de Objetos para Control Final ({selectedIds.length} de {objetosPendientes.length} seleccionados)
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {selectedIds.length === objetosPendientes.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" /> Desmarcar Todos
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" /> Seleccionar Todos
                  </>
                )}
              </button>
            </div>

            {objetosPendientes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                No hay objetos en estado "Encontrado" pendientes de despacho.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {objetosPendientes.map((obj) => {
                    const isSelected = selectedIds.includes(obj.id);
                    return (
                      <div
                        key={obj.id}
                        onClick={() => toggleSelectOne(obj.id)}
                        className={`p-3 text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'bg-white hover:bg-slate-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">{obj.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                Planilla: {obj.numero_planilla}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                {obj.unidad_interno}
                              </span>
                            </div>
                            <p className="font-semibold text-slate-700 mt-0.5">{obj.descripcion}</p>
                            <p className="text-[10px] text-slate-400">
                              Hallado por: {obj.personal_hallazgo} • Sector: {obj.sector_hallazgo}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-slate-500">{obj.fecha_hallazgo}</span>
                          <div>
                            {obj.conductor_firmo ? (
                              <span className="text-[10px] font-bold text-emerald-600">✓ Firmado</span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">Sin firma</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            <p className="font-bold mb-1">Paso posterior al despacho:</p>
            <p className="text-[11px] text-blue-700">
              Al presionar <strong>"Despacho a oficina"</strong>, se generará el código QR del envío. El personal de transporte abrirá su aplicación en <strong>"Registrar Firma"</strong>, escaneará el código, chequeará cada ítem y confirmará el inicio del viaje a oficinas de administración.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={saving || selectedIds.length === 0}
            onClick={handleCrearDespacho}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{saving ? 'Generando Despacho...' : 'Despacho a oficina'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
