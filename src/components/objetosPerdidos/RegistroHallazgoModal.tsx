import React, { useState, useEffect } from 'react';
import { ObjetoPerdido } from '../../types/objetosPerdidos';
import { createObjetoPerdido } from '../../lib/objetosPerdidosService';
import { fetchPersonalConcatenado, fetchFlotaActiva, fetchTurnosActivos, PersonalOption, FlotaOption, TurnoOption } from '../../lib/catalogoService';
import { Usuario } from '../../context/AuthContext';
import { X, PackagePlus, Save, AlertCircle, CheckCircle2, User, Bus, MapPin, Calendar, FileText } from 'lucide-react';

interface RegistroHallazgoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario;
  onCreated: (nuevoObjeto: ObjetoPerdido) => void;
}

const SECTORES = [
  'Unidad / Colectivo',
  'Taller',
  'Estacionamiento',
  'Lavadero',
  'Bomba Combustible',
  'Chapería',
  'Gomería'
];

export default function RegistroHallazgoModal({
  isOpen,
  onClose,
  currentUser,
  onCreated
}: RegistroHallazgoModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [fechaHallazgo, setFechaHallazgo] = useState(todayStr);
  const [numeroPlanilla, setNumeroPlanilla] = useState('');
  const [personalHallazgo, setPersonalHallazgo] = useState('');
  const [unidadInterno, setUnidadInterno] = useState('');
  const [recorridoTurno, setRecorridoTurno] = useState('');
  const [sectorHallazgo, setSectorHallazgo] = useState('Unidad / Colectivo');
  const [descripcion, setDescripcion] = useState('');

  const [personalList, setPersonalList] = useState<PersonalOption[]>([]);
  const [flotaList, setFlotaList] = useState<FlotaOption[]>([]);
  const [turnosList, setTurnosList] = useState<TurnoOption[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCatalogos();
      setFechaHallazgo(new Date().toISOString().split('T')[0]);
      setErrorMsg(null);
    }
  }, [isOpen]);

  const loadCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [personal, flota, turnos] = await Promise.all([
        fetchPersonalConcatenado(),
        fetchFlotaActiva(),
        fetchTurnosActivos()
      ]);
      setPersonalList(personal);
      setFlotaList(flota);
      setTurnosList(turnos);
      if (personal.length > 0 && !personalHallazgo) {
        setPersonalHallazgo(personal[0].value);
      }
      if (flota.length > 0 && !unidadInterno) {
        setUnidadInterno(flota[0].value);
      }
      if (turnos.length > 0 && !recorridoTurno) {
        setRecorridoTurno(turnos[0].value);
      }
    } catch (e) {
      console.warn('Error loading catalogos:', e);
    } finally {
      setLoadingCatalogos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroPlanilla.trim()) {
      setErrorMsg('Debe ingresar el N° de planilla de objetos perdidos.');
      return;
    }
    if (!personalHallazgo) {
      setErrorMsg('Seleccione el personal que realizó el hallazgo.');
      return;
    }
    if (!descripcion.trim()) {
      setErrorMsg('Describa detalladamente las características del objeto.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const nuevo = await createObjetoPerdido(
        {
          fecha_hallazgo: fechaHallazgo,
          numero_planilla: numeroPlanilla.trim(),
          personal_hallazgo: personalHallazgo,
          unidad_interno: sectorHallazgo === 'Unidad / Colectivo' ? unidadInterno : 'Sin unidad / Área interna',
          recorrido_turno: sectorHallazgo === 'Unidad / Colectivo' ? recorridoTurno : 'N/A - Predio/Taller',
          sector_hallazgo: sectorHallazgo,
          descripcion: descripcion.trim(),
          operador_garita_id: currentUser.id,
          operador_garita_nombre: currentUser.nombre_apellido
        },
        currentUser
      );

      // Reset form
      setNumeroPlanilla('');
      setDescripcion('');
      onCreated(nuevo);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al registrar objeto perdido.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <PackagePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Nuevo Registro de Objeto Perdido</h3>
              <p className="text-xs text-slate-400">
                Operador Garita: <span className="text-blue-300 font-semibold">{currentUser.nombre_apellido}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha hallazgo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Fecha del Hallazgo *
              </label>
              <input
                type="date"
                required
                value={fechaHallazgo}
                onChange={(e) => setFechaHallazgo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* N° Planilla */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                N° de Planilla de Objetos Perdidos *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. PL-2026-089"
                value={numeroPlanilla}
                onChange={(e) => setNumeroPlanilla(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-1">Planilla que se colocará en la caja de transporte.</p>
            </div>
          </div>

          {/* Personal que realizó el hallazgo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Personal que realizó el hallazgo (Conductor / Mecánico) *
            </label>
            <select
              value={personalHallazgo}
              onChange={(e) => setPersonalHallazgo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="">Seleccione personal...</option>
              {personalList.map((p, idx) => (
                <option key={`${p.value}-${idx}`} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sector de hallazgo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Sector de la empresa donde se encontró *
            </label>
            <select
              value={sectorHallazgo}
              onChange={(e) => setSectorHallazgo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              {SECTORES.map(sec => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* If found in unit */}
          {sectorHallazgo === 'Unidad / Colectivo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-blue-600" />
                  N° de Interno (Parque Móvil Activo) *
                </label>
                <select
                  value={unidadInterno}
                  onChange={(e) => setUnidadInterno(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Seleccione interno...</option>
                  {flotaList.map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Recorrido / Turno Activo *
                </label>
                <select
                  value={recorridoTurno}
                  onChange={(e) => setRecorridoTurno(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Seleccione turno/recorrido...</option>
                  {turnosList.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Descripción detallada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Descripción detallada de las características del objeto *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Indique marca, modelo, color, tamaño, estado, contenido u observaciones distintivas..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Generación de QR y Constancia de Aceptación:</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Al guardar, el sistema generará automáticamente el código QR con el ID del registro para que el conductor pueda escanearlo desde la sección <strong>"Registrar Firma"</strong> y asentar su aceptación.
              </p>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || loadingCatalogos}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar y Generar QR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
