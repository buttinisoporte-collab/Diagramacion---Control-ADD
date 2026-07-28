import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import Select from 'react-select';

interface Option { value: string; label: string; }

export default function ControlMecanico() {
  const [mecanicos, setMecanicos] = useState<Option[]>([]);
  const [selectedMecanico, setSelectedMecanico] = useState<Option | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState(''); // Simple mock if needed

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState(new Date().toTimeString().substring(0, 5));

  const [unidades, setUnidades] = useState<{ value: string; label: string; turnoId: string; turnoStr: string }[]>([]);
  const [selectedUnidad, setSelectedUnidad] = useState<any | null>(null);

  const [fluids, setFluids] = useState<{ [key: string]: number | null }>({
    flu_agua: null, flu_aceite: null, flu_combustible: null, flu_hidraulico: null, flu_frenos: null
  });
  
  const [observaciones, setObservaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    async function init() {
      if (!supabase) return;
      
      const { data: mRes } = await supabase.from('nomina_mecanicos').select('id_mecanico, apellido_nombre');
      if (mRes) {
        setMecanicos(mRes.map(m => ({ value: m.id_mecanico, label: m.apellido_nombre })));
      }

      // Check if there is an assigned mechanic for today in diagramacion_mecanicos
      const { data: dRes } = await supabase.from('diagramacion_mecanicos').select('id_mecanico').eq('fecha', new Date().toISOString().split('T')[0]).maybeSingle();
      if (dRes) {
        const found = mRes?.find(m => m.id_mecanico === dRes.id_mecanico);
        if (found) {
          setSelectedMecanico({ value: found.id_mecanico, label: found.apellido_nombre });
        }
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadEarlyUnits() {
      if (!supabase || !isAuthenticated) return;
      
      // Load assignments for today
      const { data: diagRes } = await supabase.from('diagramaciones').select('*').eq('fecha', fecha);
      if (!diagRes) return;
      
      // Load turnos to check time
      const { data: tRes } = await supabase.from('turnos').select('*');
      if (!tRes) return;
      
      // Load flota to get name
      const { data: fRes } = await supabase.from('flota_activa').select('*');

      const earlyAssignments: any[] = [];
      diagRes.forEach(d => {
        const t = tRes.find(x => x.cod_turno === d.cod_turno);
        if (t && t.hora_inicio && t.hora_inicio < '07:00:00' && d.unidad) {
          const u = fRes?.find(x => x.unidad === d.unidad || x.id_unidad === d.unidad);
          if (u) {
             earlyAssignments.push({
               value: u.id_unidad,
               label: u.unidad,
               turnoId: t.id_turno,
               turnoStr: t.cod_turno
             });
          }
        }
      });
      setUnidades(earlyAssignments);
    }
    loadEarlyUnits();
  }, [isAuthenticated, fecha]);

  const handleLogin = () => {
    if (selectedMecanico) setIsAuthenticated(true);
  };

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
        id_mecanico: selectedMecanico?.value,
        id_unidad: selectedUnidad.value,
        fecha,
        hora,
        ...fluids,
        observaciones
      };

      const { error } = await supabase.from('control_mecanico').insert([payload]);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Control guardado exitosamente.' });
      setFluids({ flu_agua: null, flu_aceite: null, flu_combustible: null, flu_hidraulico: null, flu_frenos: null });
      setSelectedUnidad(null);
      setObservaciones('');
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error al guardar.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 w-96 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-6">Acceso Mecánicos</h2>
          <div className="space-y-4">
            <Select 
               options={mecanicos} 
               value={selectedMecanico} 
               onChange={setSelectedMecanico} 
               placeholder="Seleccione su Nombre..."
            />
            <button 
              onClick={handleLogin}
              disabled={!selectedMecanico}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors disabled:opacity-50"
            >
              INGRESAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header title="Control Mecánico" subtitle="Fluidos Matutinos" />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {message && (
            <div className={`p-4 rounded-lg font-medium text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {message.text}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
             <div className="p-6 border-b border-slate-200 bg-slate-50 rounded-t-lg">
               <div className="flex flex-col md:flex-row items-center justify-between text-slate-700 font-bold mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🔧</span>
                    <span className="text-lg">Chequeo: {selectedMecanico?.label}</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                     <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fecha</label>
                     <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-mono" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Hora</label>
                     <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-mono" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unidad (Turno)</label>
                     <Select 
                        options={unidades.map(u => ({ value: u.value, label: `${u.label} (${u.turnoStr})`, turnoId: u.turnoId, turnoStr: u.turnoStr }))}
                        value={selectedUnidad}
                        onChange={setSelectedUnidad}
                        placeholder="Seleccione..."
                     />
                  </div>
               </div>
             </div>
             
             <div className="p-6">
               <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Indique niveles (1=Bajo ... 5=Óptimo)</p>
               <div className="space-y-6">
                  {[
                    { id: 'flu_agua', name: 'Agua' },
                    { id: 'flu_aceite', name: 'Aceite' },
                    { id: 'flu_combustible', name: 'Combustible' },
                    { id: 'flu_hidraulico', name: 'Hidráulico' },
                    { id: 'flu_frenos', name: 'Frenos' }
                  ].map((fluido) => (
                    <div key={fluido.id}>
                      <label className="block text-sm font-bold text-slate-800 mb-2">{fluido.name}</label>
                      <div className="flex space-x-2">
                         {[1, 2, 3, 4, 5].map((level) => (
                            <button 
                              key={level} 
                              onClick={() => setFluid(fluido.id, level)}
                              className={`flex-1 py-3 border rounded font-bold transition-colors 
                                ${fluids[fluido.id] === level ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50'}
                              `}
                            >
                              {level}
                            </button>
                         ))}
                      </div>
                    </div>
                  ))}
               </div>
                            
               <div className="mt-8">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Observaciones</label>
                  <textarea 
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    className="w-full border border-slate-300 rounded p-4 text-sm focus:outline-none focus:border-blue-500 bg-slate-50" 
                    rows={4} 
                    placeholder="Detalle trabajos realizados o pendientes..."
                  ></textarea>
               </div>
               
               <div className="mt-8 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                 <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-[#6a5acd] text-white font-bold rounded hover:bg-[#5c4eba] transition-colors uppercase text-sm tracking-wide disabled:opacity-50">
                    {isSaving ? 'Guardando...' : 'Guardar Chequeo'}
                 </button>
                 <button onClick={() => window.open('http://buttini.sgm.lym.com.ar/Account/Login', '_blank')} className="flex-1 py-3 border-2 border-rose-700 text-rose-700 font-bold rounded hover:bg-rose-50 transition-colors uppercase text-sm tracking-wide">
                    Solicitar O.T.
                 </button>
               </div>

             </div>
          </div>
        </div>
      </div>
    </>
  );
}
