import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { normalizeName } from '../lib/utils';

interface Option { value: string; label: string; turnoId: string; turnoStr: string; horaSalida: string; }

export default function ControlMecanico() {
  const { user, logout } = useAuth();
  const [isDiagramado, setIsDiagramado] = useState<boolean | null>(null);
  const [mechanicId, setMechanicId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState(new Date().toTimeString().substring(0, 5));
  
  const [unidades, setUnidades] = useState<Option[]>([]);
  const [selectedUnidad, setSelectedUnidad] = useState<Option | null>(null);
  
  const [fluids, setFluids] = useState<{ [key: string]: number | null }>({
    flu_agua: null, flu_aceite: null, flu_combustible: null, flu_hidraulico: null, flu_frenos: null
  });
  
  const [observaciones, setObservaciones] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    async function checkDiagramacion() {
      if (!supabase || !user) return;
      
      // 1. Get id_mecanico for current user
      const { data: mList } = await supabase.from('nomina_mecanicos')
        .select('id_mecanico, apellido_nombre');
        
      if (!mList) {
        setIsDiagramado(false);
        return;
      }
      
      const userNormalized = normalizeName(user.nombre_apellido);
      const matchedMecanico = mList.find(m => normalizeName(m.apellido_nombre || '') === userNormalized);
      
      if (!matchedMecanico) {
        setIsDiagramado(false);
        return;
      }
      
      const mId = matchedMecanico.id_mecanico;
      setMechanicId(mId);
      
      // 2. Check if scheduled today
      const { data: dRes } = await supabase.from('diagramacion_mecanicos')
        .select('id_mecanico')
        .eq('fecha', fecha)
        .eq('id_mecanico', mId)
        .maybeSingle();
        
      if (dRes) {
        setIsDiagramado(true);
      } else {
        setIsDiagramado(false);
      }
    }
    checkDiagramacion();
  }, [user, fecha]);

  useEffect(() => {
    async function loadUnits() {
      if (!supabase || !isDiagramado) return;
      
      // Load assignments for today
      const { data: diagRes } = await supabase.from('diagramaciones').select('*').eq('fecha', fecha);
      if (!diagRes) return;
      
      // Load turnos to check time
      const { data: tRes } = await supabase.from('turnos').select('*');
      if (!tRes) return;
      
      // Load flota to get name
      const { data: fRes } = await supabase.from('flota_activa').select('*');
      
      const earlyAssignments: Option[] = [];
      diagRes.forEach(d => {
        const t = tRes.find((x: any) => x.cod_turno === d.cod_turno);
        // Assuming we keep the < 07:00:00 logic based on previous requirements, 
        // or just load all. The prompt says "El listado desplegable de unidades, debe mostrarlas ordenada por hora de salida"
        if (t && d.unidad) {
          const u = fRes?.find((x: any) => x.unidad === d.unidad || x.id_unidad === d.unidad);
          if (u) {
             earlyAssignments.push({
               value: u.id_unidad,
               label: `${u.unidad} (${t.hora_salida_base || '-'}) - Turno: ${t.cod_turno}`,
               turnoId: t.id_turno,
               turnoStr: t.cod_turno,
               horaSalida: t.hora_salida_base || '23:59:59' // Default late if not set
             });
          }
        }
      });
      
      // Sort by hora_salida_base
      earlyAssignments.sort((a, b) => a.horaSalida.localeCompare(b.horaSalida));
      
      setUnidades(earlyAssignments);
    }
    loadUnits();
  }, [isDiagramado, fecha]);


  useEffect(() => {
    async function checkExistingControl() {
      if (!selectedUnidad || !supabase) {
        setIsReadOnly(false);
        setFluids({ flu_agua: null, flu_aceite: null, flu_combustible: null, flu_hidraulico: null, flu_frenos: null });
        setObservaciones('');
        return;
      }
      
      const { data } = await supabase.from('control_mecanico')
        .select('*')
        .eq('fecha', fecha)
        .eq('id_unidad', selectedUnidad.value)
        .eq('id_turno', selectedUnidad.turnoId)
        .maybeSingle();
        
      if (data) {
        setIsReadOnly(true);
        setFluids({
          flu_agua: data.flu_agua,
          flu_aceite: data.flu_aceite,
          flu_combustible: data.flu_combustible,
          flu_hidraulico: data.flu_hidraulico,
          flu_frenos: data.flu_frenos,
        });
        setObservaciones(data.observaciones || '');
      } else {
        setIsReadOnly(false);
        setFluids({ flu_agua: null, flu_aceite: null, flu_combustible: null, flu_hidraulico: null, flu_frenos: null });
        setObservaciones('');
      }
    }
    checkExistingControl();
  }, [selectedUnidad, fecha]);

  const setFluid = (key: string, val: number) => {
    setFluids(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!selectedUnidad) {
      setMessage({ type: 'error', text: 'Debe seleccionar una unidad.' });
      return;
    }
    
    // Validar si completó todo
    const pending = Object.values(fluids).some(v => v === null);
    if (pending) {
      setMessage({ type: 'error', text: 'Debe completar todos los fluidos.' });
      return;
    }

    if (!supabase) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        id_turno: selectedUnidad.turnoId,
        id_unidad: selectedUnidad.value,
        id_mecanico: mechanicId,
        fecha,
        hora,
        flu_agua: fluids.flu_agua,
        flu_aceite: fluids.flu_aceite,
        flu_combustible: fluids.flu_combustible,
        flu_hidraulico: fluids.flu_hidraulico,
        flu_frenos: fluids.flu_frenos,
        observaciones: observaciones || null
      };

      const { error } = await supabase.from('control_mecanico').insert([payload]);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Control guardado exitosamente.' });
      setFluids({ flu_agua: null, flu_aceite: null, flu_combustible: null, flu_hidraulico: null, flu_frenos: null });
      setSelectedUnidad(null);
      setObservaciones('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al guardar.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isDiagramado === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-bold">Verificando diagramación...</p>
      </div>
    );
  }

  if (isDiagramado === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg text-center max-w-md w-full border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Acceso Denegado</h2>
          <p className="text-slate-600 mb-6 text-sm md:text-base leading-relaxed">
            No tiene turno asignado para el día de hoy. Por favor comunicarse con Administración de Taller.
          </p>
          <div className="space-y-4 mb-8 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block font-bold text-slate-800">Mario Días</span>
              <a href="https://wa.link/8jmhzv" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">
                2604 000772
              </a>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block font-bold text-slate-800">Oficina Técnica</span>
              <a href="https://wa.link/1fzosv" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">
                2604 030789
              </a>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Salir del sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header title="Control Mecánico" subtitle="Checklist matutino de fluidos" />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Datos del Control
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hora</label>
                <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Unidad y Turno (ordenados por salida)</label>
                <Select
                  value={selectedUnidad}
                  onChange={(val) => setSelectedUnidad(val)}
                  options={unidades}
                  placeholder="-- Seleccionar Unidad --"
                  className="text-sm"
                  styles={{
                    control: (base) => ({ ...base, minHeight: '42px', borderRadius: '0.5rem' })
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Revisión de Fluidos
            </h3>
            
            <div className="space-y-4">
              {[
                { key: 'flu_agua', label: 'Agua' },
                { key: 'flu_aceite', label: 'Aceite' },
                { key: 'flu_combustible', label: 'Combustible' },
                { key: 'flu_hidraulico', label: 'Hidráulico' },
                { key: 'flu_frenos', label: 'Frenos' }
              ].map(fluid => (
                <div key={fluid.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 gap-3">
                  <span className="font-bold text-slate-700 text-sm">{fluid.label}</span>
                  <div className="flex bg-slate-200 rounded-lg p-1 w-full sm:w-auto">
                    {[
                      { val: 1, label: '1/4', color: 'bg-rose-500', hover: 'hover:bg-rose-100', text: 'text-rose-700' },
                      { val: 2, label: '2/4', color: 'bg-amber-500', hover: 'hover:bg-amber-100', text: 'text-amber-700' },
                      { val: 3, label: '3/4', color: 'bg-emerald-400', hover: 'hover:bg-emerald-100', text: 'text-emerald-700' },
                      { val: 4, label: '4/4', color: 'bg-emerald-600', hover: 'hover:bg-emerald-100', text: 'text-emerald-700' }
                    ].map(level => {
                      const isSelected = fluids[fluid.key] === level.val;
                      return (
                        <button
                          key={level.val}
                          onClick={() => !isReadOnly && setFluid(fluid.key, level.val)} disabled={isReadOnly}
                          className={`flex-1 sm:flex-none px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold rounded-md transition-all ${
                            isSelected 
                              ? `${level.color} text-white shadow-sm scale-105` 
                              : `text-slate-500 ${!isReadOnly ? level.hover : ''}`
                          }`}
                        >
                          {level.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                disabled={isReadOnly}
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Indique si rellenó fluidos o notó algo anormal..."
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="pt-2 pb-8">
            <button
              onClick={handleSave}
              disabled={isSaving || isReadOnly || !selectedUnidad}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30 disabled:opacity-50 text-sm md:text-base"
            >
              {isReadOnly ? 'Control ya registrado' : isSaving ? 'Guardando...' : 'Guardar Control'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
