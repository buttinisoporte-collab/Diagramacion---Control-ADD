import React from 'react';
import { ObjetoPerdido } from '../../types/objetosPerdidos';
import { X, History, User, Calendar, MapPin, CheckCircle2, Clock, Shield, Tag } from 'lucide-react';

interface TrazabilidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  objeto: ObjetoPerdido | null;
}

export default function TrazabilidadModal({
  isOpen,
  onClose,
  objeto
}: TrazabilidadModalProps) {
  if (!isOpen || !objeto) return null;

  const events = [...(objeto.trazabilidad || [])].reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Historial y Trazabilidad</h3>
              <p className="text-xs text-slate-400">
                Objeto ID: <span className="font-mono text-blue-300 font-bold">{objeto.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Objeto Info card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-sm font-bold text-slate-800">{objeto.descripcion}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                objeto.estado === 'Encontrado' ? 'bg-blue-100 text-blue-800' :
                objeto.estado === 'Enviado' ? 'bg-amber-100 text-amber-800' :
                objeto.estado === 'EN ADMINISTRACION' ? 'bg-purple-100 text-purple-800' :
                objeto.estado === 'Entregado a Titular' ? 'bg-emerald-100 text-emerald-800' :
                objeto.estado === 'BAJA - DONACION' ? 'bg-teal-100 text-teal-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                {objeto.estado}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-400 block">Planilla N°:</span>
                <span className="font-bold text-slate-700">{objeto.numero_planilla}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Fecha Hallazgo:</span>
                <span className="font-bold text-slate-700">{objeto.fecha_hallazgo}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Unidad / Sector:</span>
                <span className="font-bold text-slate-700">{objeto.unidad_interno}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Hallado por:</span>
                <span className="font-bold text-slate-700">{objeto.personal_hallazgo}</span>
              </div>
            </div>

            {objeto.ubicacion_actual && (
              <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{objeto.ubicacion_actual}</span>
              </div>
            )}
          </div>

          {/* Timeline of events */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Línea de Tiempo de Eventos ({events.length})
            </h4>

            {events.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay eventos registrados.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {events.map((ev, idx) => (
                  <div key={ev.id || idx} className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />

                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-800">
                          {ev.accion.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ev.fecha).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mb-2">{ev.detalle}</p>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-700">{ev.usuario_nombre}</span>
                        {ev.usuario_rol && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-600">
                            {ev.usuario_rol}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
